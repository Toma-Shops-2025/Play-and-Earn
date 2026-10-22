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
