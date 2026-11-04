-- Run entire file once in Supabase SQL Editor (migrations in order)

-- ===== 20260322000000_init.sql =====
-- Play & Earn Arcade — auth-linked wallet (server is source of truth when signed in)

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_id bigint generated always as identity,
  coins integer not null default 10 check (coins >= 0),
  cash_balance numeric(12, 4) not null default 0.03 check (cash_balance >= 0),
  conversion_due_at timestamptz not null default (now() + interval '3 hours'),
  claimed_reward_days integer[] not null default '{}',
  stripe_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.withdrawals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(12, 4) not null check (amount > 0),
  status text not null default 'pending'
    check (status in ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  stripe_payout_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.coin_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  delta integer not null,
  reason text not null,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.game_reward_claims (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game_id text not null,
  day date not null default (timezone('utc', now()))::date,
  claim_count integer not null default 0,
  unique (user_id, game_id, day)
);

alter table public.profiles enable row level security;
alter table public.withdrawals enable row level security;
alter table public.coin_ledger enable row level security;
alter table public.game_reward_claims enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "withdrawals_select_own"
  on public.withdrawals for select
  using (auth.uid() = user_id);

create policy "ledger_select_own"
  on public.coin_ledger for select
  using (auth.uid() = user_id);

-- New auth users get a profile row
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_profile_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.touch_profile_updated_at();

-- Apply coin conversion cycles that elapsed while offline
create or replace function public.sync_conversion(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_added numeric(12, 4);
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  while v_profile.conversion_due_at <= now() and v_profile.coins > 0 loop
    v_added := round((v_profile.coins::numeric / 1000), 4);
    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = 0,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    insert into public.coin_ledger (user_id, delta, reason, metadata)
    values (p_user_id, 0, 'conversion', jsonb_build_object('cash_added', v_added));
  end loop;

  return v_profile;
end;
$$;

create or replace function public.get_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_withdrawals jsonb;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_profile := public.sync_conversion(auth.uid());

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'amount', w.amount,
      'status', w.status,
      'createdAt', w.created_at
    ) order by w.created_at desc
  ), '[]'::jsonb)
  into v_withdrawals
  from (
    select * from public.withdrawals
    where user_id = auth.uid()
    order by created_at desc
    limit 20
  ) w;

  return jsonb_build_object(
    'uid', v_profile.display_id,
    'coins', v_profile.coins,
    'cashBalance', v_profile.cash_balance,
    'secondsUntilConversion', greatest(0, floor(extract(epoch from (v_profile.conversion_due_at - now()))))::integer,
    'claimedRewardDays', v_profile.claimed_reward_days,
    'withdrawals', v_withdrawals
  );
end;
$$;

create or replace function public.grant_game_coins(p_game_id text, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_claims integer;
  v_new_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > 10 then
    raise exception 'invalid reward amount';
  end if;

  insert into public.game_reward_claims (user_id, game_id, day, claim_count)
  values (auth.uid(), p_game_id, v_today, 1)
  on conflict (user_id, game_id, day)
  do update set claim_count = game_reward_claims.claim_count + 1
  returning claim_count into v_claims;

  if v_claims > 50 then
    raise exception 'daily game limit reached';
  end if;

  update public.profiles
  set coins = coins + p_amount
  where id = auth.uid()
  returning coins into v_new_balance;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_amount, 'game', jsonb_build_object('game_id', p_game_id));

  return v_new_balance;
end;
$$;

create or replace function public.claim_daily_reward(p_day_index integer, p_coins integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer[];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_day_index < 0 or p_day_index > 6 or p_coins < 1 or p_coins > 50 then
    raise exception 'invalid reward';
  end if;

  select claimed_reward_days into v_days from public.profiles where id = auth.uid() for update;
  if p_day_index = any (v_days) then
    return false;
  end if;
  if p_day_index <> coalesce(array_length(v_days, 1), 0) then
    raise exception 'claim current day only';
  end if;

  update public.profiles
  set
    coins = coins + p_coins,
    claimed_reward_days = array_append(claimed_reward_days, p_day_index)
  where id = auth.uid();

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_coins, 'daily', jsonb_build_object('day', p_day_index));

  return true;
end;
$$;

create or replace function public.request_withdrawal(p_min_amount numeric default 5)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 4);
  v_row public.withdrawals;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

  select cash_balance into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_balance < p_min_amount then
    return jsonb_build_object(
      'ok', false,
      'message', format('Minimum cashout is $%s. Keep playing!', trim(to_char(p_min_amount, 'FM999990.00')))
    );
  end if;

  update public.profiles set cash_balance = 0 where id = auth.uid();

  insert into public.withdrawals (user_id, amount, status)
  values (auth.uid(), v_balance, 'pending')
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'message', format('Withdrawal of $%s submitted for processing.', trim(to_char(v_balance, 'FM999990.00'))),
    'withdrawalId', v_row.id
  );
end;
$$;

create or replace function public.credit_purchased_coins(p_user_id uuid, p_coins integer, p_stripe_session_id text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_coins < 1 then
    raise exception 'invalid purchase';
  end if;

  update public.profiles
  set coins = coins + p_coins
  where id = p_user_id;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (p_user_id, p_coins, 'purchase', jsonb_build_object('stripe_session_id', p_stripe_session_id));
end;
$$;

grant usage on schema public to anon, authenticated;
grant select on public.profiles to authenticated;
grant select on public.withdrawals to authenticated;
grant select on public.coin_ledger to authenticated;

grant execute on function public.get_wallet() to authenticated;
grant execute on function public.grant_game_coins(text, integer) to authenticated;
grant execute on function public.claim_daily_reward(integer, integer) to authenticated;
grant execute on function public.request_withdrawal(numeric) to authenticated;

revoke execute on function public.credit_purchased_coins(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.credit_purchased_coins(uuid, integer, text) to service_role;

-- ===== 20260322000001_ad_rewards.sql =====
-- Rewarded video grants (validated server-side; client only triggers after ad completion)

create table if not exists public.ad_reward_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null default (timezone('utc', now()))::date,
  claim_count integer not null default 0 check (claim_count >= 0),
  primary key (user_id, day)
);

alter table public.ad_reward_claims enable row level security;

create policy "ad_claims_select_own"
  on public.ad_reward_claims for select
  using (auth.uid() = user_id);

create or replace function public.grant_ad_reward(
  p_coins integer default 15,
  p_daily_limit integer default 12
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_count integer;
  v_new_balance integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_coins < 1 or p_coins > 50 or p_daily_limit < 1 or p_daily_limit > 50 then
    raise exception 'invalid ad reward config';
  end if;

  insert into public.ad_reward_claims (user_id, day, claim_count)
  values (auth.uid(), v_today, 0)
  on conflict (user_id, day) do nothing;

  select claim_count into v_count
  from public.ad_reward_claims
  where user_id = auth.uid() and day = v_today
  for update;

  if v_count >= p_daily_limit then
    return jsonb_build_object(
      'ok', false,
      'message', 'Daily ad limit reached. Come back tomorrow!',
      'adsWatchedToday', v_count,
      'adsRemainingToday', 0,
      'coinsGranted', 0
    );
  end if;

  update public.ad_reward_claims
  set claim_count = claim_count + 1
  where user_id = auth.uid() and day = v_today;

  update public.profiles
  set coins = coins + p_coins
  where id = auth.uid()
  returning coins into v_new_balance;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_coins, 'rewarded_ad', jsonb_build_object('day', v_today));

  return jsonb_build_object(
    'ok', true,
    'message', format('+%s coins added for watching an ad.', p_coins),
    'adsWatchedToday', v_count + 1,
    'adsRemainingToday', p_daily_limit - (v_count + 1),
    'coinsGranted', p_coins,
    'coinBalance', v_new_balance
  );
end;
$$;

grant execute on function public.grant_ad_reward(integer, integer) to authenticated;

-- ===== 20260322000002_wallet_ad_stats.sql =====
-- Extend get_wallet with rewarded-ad daily stats

create or replace function public.get_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_withdrawals jsonb;
  v_today date := (timezone('utc', now()))::date;
  v_ad_count integer := 0;
  v_daily_limit integer := 12;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_profile := public.sync_conversion(auth.uid());

  select coalesce(claim_count, 0) into v_ad_count
  from public.ad_reward_claims
  where user_id = auth.uid() and day = v_today;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'amount', w.amount,
      'status', w.status,
      'createdAt', w.created_at
    ) order by w.created_at desc
  ), '[]'::jsonb)
  into v_withdrawals
  from (
    select * from public.withdrawals
    where user_id = auth.uid()
    order by created_at desc
    limit 20
  ) w;

  return jsonb_build_object(
    'uid', v_profile.display_id,
    'coins', v_profile.coins,
    'cashBalance', v_profile.cash_balance,
    'secondsUntilConversion', greatest(0, floor(extract(epoch from (v_profile.conversion_due_at - now()))))::integer,
    'claimedRewardDays', v_profile.claimed_reward_days,
    'withdrawals', v_withdrawals,
    'adsWatchedToday', coalesce(v_ad_count, 0),
    'adsRemainingToday', greatest(0, v_daily_limit - coalesce(v_ad_count, 0))
  );
end;
$$;

-- ===== 20260322000003_profitable_economy.sql =====
-- Profitability guardrails: slower virtual cash, higher cashout threshold, tighter game faucet

create or replace function public.sync_conversion(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_added numeric(12, 4);
  v_coins_per_dollar constant numeric := 2500;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  while v_profile.conversion_due_at <= now() and v_profile.coins > 0 loop
    v_added := round((v_profile.coins::numeric / v_coins_per_dollar), 4);
    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = 0,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    insert into public.coin_ledger (user_id, delta, reason, metadata)
    values (p_user_id, 0, 'conversion', jsonb_build_object('cash_added', v_added));
  end loop;

  return v_profile;
end;
$$;

create or replace function public.grant_game_coins(p_game_id text, p_amount integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_claims integer;
  v_new_balance integer;
  v_daily_cap constant integer := 30;
  v_max_grant constant integer := 8;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_amount is null or p_amount < 1 or p_amount > v_max_grant then
    raise exception 'invalid reward amount';
  end if;

  insert into public.game_reward_claims (user_id, game_id, day, claim_count)
  values (auth.uid(), p_game_id, v_today, 1)
  on conflict (user_id, game_id, day)
  do update set claim_count = game_reward_claims.claim_count + 1
  returning claim_count into v_claims;

  if v_claims > v_daily_cap then
    raise exception 'daily game limit reached';
  end if;

  update public.profiles
  set coins = coins + p_amount
  where id = auth.uid()
  returning coins into v_new_balance;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_amount, 'game', jsonb_build_object('game_id', p_game_id));

  return v_new_balance;
end;
$$;

create or replace function public.request_withdrawal(p_min_amount numeric default 25)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 4);
  v_row public.withdrawals;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

  select cash_balance into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_balance < p_min_amount then
    return jsonb_build_object(
      'ok', false,
      'message', format('Minimum balance is $%s virtual. Keep playing or watch ads!', trim(to_char(p_min_amount, 'FM999990.00')))
    );
  end if;

  update public.profiles set cash_balance = 0 where id = auth.uid();

  insert into public.withdrawals (user_id, amount, status)
  values (auth.uid(), v_balance, 'pending')
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'message', format('Virtual withdrawal of $%s queued (not real money unless your operator enables payouts).', trim(to_char(v_balance, 'FM999990.00'))),
    'withdrawalId', v_row.id
  );
end;
$$;

create or replace function public.get_wallet()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_withdrawals jsonb;
  v_today date := (timezone('utc', now()))::date;
  v_ad_count integer := 0;
  v_daily_limit integer := 25;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  v_profile := public.sync_conversion(auth.uid());

  select coalesce(claim_count, 0) into v_ad_count
  from public.ad_reward_claims
  where user_id = auth.uid() and day = v_today;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', w.id,
      'amount', w.amount,
      'status', w.status,
      'createdAt', w.created_at
    ) order by w.created_at desc
  ), '[]'::jsonb)
  into v_withdrawals
  from (
    select * from public.withdrawals
    where user_id = auth.uid()
    order by created_at desc
    limit 20
  ) w;

  return jsonb_build_object(
    'uid', v_profile.display_id,
    'coins', v_profile.coins,
    'cashBalance', v_profile.cash_balance,
    'secondsUntilConversion', greatest(0, floor(extract(epoch from (v_profile.conversion_due_at - now()))))::integer,
    'claimedRewardDays', v_profile.claimed_reward_days,
    'withdrawals', v_withdrawals,
    'adsWatchedToday', coalesce(v_ad_count, 0),
    'adsRemainingToday', greatest(0, v_daily_limit - coalesce(v_ad_count, 0))
  );
end;
$$;

-- ===== 20260322000004_three_hour_payout_cycle.sql =====
-- Three-hour payout windows: always advance timer; convert coins when a window elapses

create or replace function public.sync_conversion(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_added numeric(12, 4);
  v_coins_per_dollar constant numeric := 2500;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  while v_profile.conversion_due_at <= now() loop
    v_added := 0;
    if v_profile.coins > 0 then
      v_added := round((v_profile.coins::numeric / v_coins_per_dollar), 4);
    end if;

    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = case when v_added > 0 then 0 else coins end,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    if v_added > 0 then
      insert into public.coin_ledger (user_id, delta, reason, metadata)
      values (
        p_user_id,
        0,
        'conversion',
        jsonb_build_object('cash_added', v_added, 'interval_hours', 3)
      );
    end if;
  end loop;

  return v_profile;
end;
$$;

-- ===== 20260322000005_paypal_payments.sql =====
-- PayPal purchase fulfillment (idempotent; replaces Stripe session ids)

create table if not exists public.payment_fulfillments (
  payment_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'paypal',
  coins integer not null check (coins > 0),
  created_at timestamptz not null default now()
);

alter table public.payment_fulfillments enable row level security;

create policy "fulfillments_select_own"
  on public.payment_fulfillments for select
  using (auth.uid() = user_id);

drop function if exists public.credit_purchased_coins(uuid, integer, text);

create or replace function public.credit_purchased_coins(
  p_user_id uuid,
  p_coins integer,
  p_payment_reference text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_user_id is null or p_coins < 1 or p_payment_reference is null then
    raise exception 'invalid purchase';
  end if;

  if exists (select 1 from public.payment_fulfillments where payment_id = p_payment_reference) then
    return false;
  end if;

  insert into public.payment_fulfillments (payment_id, user_id, provider, coins)
  values (p_payment_reference, p_user_id, 'paypal', p_coins);

  update public.profiles
  set coins = coins + p_coins
  where id = p_user_id;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (
    p_user_id,
    p_coins,
    'purchase',
    jsonb_build_object('paypal_order_id', p_payment_reference)
  );

  return true;
end;
$$;

revoke execute on function public.credit_purchased_coins(uuid, integer, text) from public, anon, authenticated;
grant execute on function public.credit_purchased_coins(uuid, integer, text) to service_role;

-- ===== 20260322000006_payout_automation.sql =====
-- PayPal payout automation: store recipient email on withdrawal requests

alter table public.withdrawals
  add column if not exists payout_email text,
  add column if not exists failure_reason text,
  add column if not exists processed_at timestamptz,
  add column if not exists paypal_payout_batch_id text;

create or replace function public.request_withdrawal(
  p_min_amount numeric default 25,
  p_paypal_email text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 4);
  v_row public.withdrawals;
  v_email text := lower(trim(coalesce(p_paypal_email, '')));
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

  select cash_balance into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_balance < p_min_amount then
    return jsonb_build_object(
      'ok', false,
      'message', format('Minimum balance is $%s virtual. Keep playing or watch ads!', trim(to_char(p_min_amount, 'FM999990.00')))
    );
  end if;

  if v_email <> '' and v_email !~ '^[^@]+@[^@]+\.[^@]+$' then
    return jsonb_build_object('ok', false, 'message', 'Enter a valid PayPal email.');
  end if;

  update public.profiles set cash_balance = 0 where id = auth.uid();

  insert into public.withdrawals (user_id, amount, status, payout_email)
  values (auth.uid(), v_balance, 'pending', case when v_email = '' then null else v_email end)
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'message', case
      when v_row.payout_email is not null then
        format('Withdrawal of $%s queued for PayPal (%s).', trim(to_char(v_balance, 'FM999990.00')), v_row.payout_email)
      else
        format('Virtual withdrawal of $%s queued. Add PayPal email for automatic payouts.', trim(to_char(v_balance, 'FM999990.00')))
    end,
    'withdrawalId', v_row.id
  );
end;
$$;

-- Worker updates (service role only)
create or replace function public.mark_withdrawal_processing(p_withdrawal_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.withdrawals
  set status = 'processing'
  where id = p_withdrawal_id and status = 'pending';
  return found;
end;
$$;

create or replace function public.complete_withdrawal_payout(
  p_withdrawal_id uuid,
  p_batch_id text,
  p_success boolean,
  p_failure_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.withdrawals
  set
    status = case when p_success then 'completed' else 'failed' end,
    paypal_payout_batch_id = p_batch_id,
    failure_reason = p_failure_reason,
    processed_at = now()
  where id = p_withdrawal_id;
end;
$$;

revoke execute on function public.mark_withdrawal_processing(uuid) from public, anon, authenticated;
revoke execute on function public.complete_withdrawal_payout(uuid, text, boolean, text) from public, anon, authenticated;
grant execute on function public.mark_withdrawal_processing(uuid) to service_role;
grant execute on function public.complete_withdrawal_payout(uuid, text, boolean, text) to service_role;
-- First cashout minimum ($5), then any amount. Ready balance caps at $25 until cashout.

create or replace function public.sync_conversion(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_added numeric(12, 4);
  v_room numeric(12, 4);
  v_room_coins bigint;
  v_convert bigint;
  v_coins_per_dollar constant numeric := 2500;
  v_max_cash constant numeric := 25;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  while v_profile.conversion_due_at <= now() loop
    v_added := 0;
    v_convert := 0;
    v_room := greatest(0, v_max_cash - v_profile.cash_balance);

    if v_profile.coins > 0 and v_room > 0 then
      v_room_coins := floor(v_room * v_coins_per_dollar);
      v_convert := least(v_profile.coins::bigint, v_room_coins);
      if v_convert > 0 then
        v_added := round((v_convert::numeric / v_coins_per_dollar), 4);
      end if;
    end if;

    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = coins - v_convert::int,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    if v_added > 0 then
      insert into public.coin_ledger (user_id, delta, reason, metadata)
      values (
        p_user_id,
        -v_convert::int,
        'conversion',
        jsonb_build_object(
          'cash_added', v_added,
          'interval_hours', 3,
          'max_cash_balance', v_max_cash
        )
      );
    end if;
  end loop;

  return v_profile;
end;
$$;

create or replace function public.request_withdrawal(
  p_min_amount numeric default 0,
  p_paypal_email text default null,
  p_payout_method text default 'paypal',
  p_payout_destination text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric(12, 4);
  v_row public.withdrawals;
  v_method text := lower(trim(coalesce(p_payout_method, 'paypal')));
  v_dest text := trim(coalesce(p_payout_destination, p_paypal_email, ''));
  v_has_prior boolean;
  v_min numeric(12, 4);
  v_first_min constant numeric := 5;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

  select exists(
    select 1
    from public.withdrawals
    where user_id = auth.uid()
      and status in ('pending', 'processing', 'completed')
  ) into v_has_prior;

  -- Server enforces: $5 first cashout, $0 after. Client p_min_amount cannot lower this.
  v_min := case when v_has_prior then 0 else v_first_min end;
  if p_min_amount is not null and p_min_amount > v_min then
    v_min := p_min_amount;
  end if;

  select cash_balance into v_balance
  from public.profiles
  where id = auth.uid()
  for update;

  if v_balance is null or v_balance <= 0 then
    return jsonb_build_object(
      'ok', false,
      'message', 'No cashable balance yet. Earn until the next 3-hour payout window.'
    );
  end if;

  if v_balance < v_min then
    return jsonb_build_object(
      'ok', false,
      'message', case
        when v_has_prior then
          format('Minimum balance is $%s.', trim(to_char(v_min, 'FM999990.00')))
        else
          format(
            'First cashout needs $%s. After that, any amount is fine.',
            trim(to_char(v_min, 'FM999990.00'))
          )
      end
    );
  end if;

  if v_method not in ('paypal', 'cashapp') then
    return jsonb_build_object('ok', false, 'message', 'Choose PayPal or Cash App.');
  end if;

  if v_dest = '' then
    return jsonb_build_object(
      'ok', false,
      'message', case
        when v_method = 'cashapp' then 'Enter your Cash App $Cashtag.'
        else 'Enter your PayPal email.'
      end
    );
  end if;

  if v_method = 'paypal' and v_dest !~* '^[^@]+@[^@]+\.[^@]+$' then
    return jsonb_build_object('ok', false, 'message', 'Enter a valid PayPal email.');
  end if;

  if v_method = 'cashapp' then
    if left(v_dest, 1) <> '$' then
      v_dest := '$' || v_dest;
    end if;
    if v_dest !~ '^\$[A-Za-z][A-Za-z0-9_]{2,20}$' then
      return jsonb_build_object('ok', false, 'message', 'Cash App tags look like $YourName.');
    end if;
  else
    v_dest := lower(v_dest);
  end if;

  update public.profiles set cash_balance = 0 where id = auth.uid();

  insert into public.withdrawals (
    user_id,
    amount,
    status,
    payout_email,
    payout_method,
    payout_destination
  )
  values (
    auth.uid(),
    v_balance,
    'pending',
    case when v_method = 'paypal' then v_dest else null end,
    v_method,
    v_dest
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'message', format(
      'Payout of $%s queued to %s (%s).',
      trim(to_char(v_balance, 'FM999990.00')),
      case when v_method = 'cashapp' then 'Cash App' else 'PayPal' end,
      v_dest
    ),
    'withdrawalId', v_row.id
  );
end;
$$;

-- Migration 20260322000009_first_cashout_and_cap appended above

