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
