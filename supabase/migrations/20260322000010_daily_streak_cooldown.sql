-- One daily-streak claim per 24 hours. Amounts must match economy-config dailyStreakCoins.

alter table public.profiles
  add column if not exists last_daily_claim_at timestamptz;

create or replace function public.claim_daily_reward(p_day_index integer, p_coins integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer[];
  v_last timestamptz;
  v_expected constant integer[] := array[4, 6, 8, 10, 12, 15, 20];
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_day_index < 0 or p_day_index > 6 then
    raise exception 'invalid reward';
  end if;
  if p_coins is distinct from v_expected[p_day_index + 1] then
    raise exception 'invalid reward';
  end if;

  select claimed_reward_days, last_daily_claim_at
  into v_days, v_last
  from public.profiles
  where id = auth.uid()
  for update;

  if p_day_index = any (v_days) then
    return false;
  end if;
  if p_day_index <> coalesce(array_length(v_days, 1), 0) then
    raise exception 'claim current day only';
  end if;
  if v_last is not null and v_last > now() - interval '24 hours' then
    raise exception 'next daily reward unlocks 24 hours after the last claim';
  end if;

  update public.profiles
  set
    coins = coins + p_coins,
    claimed_reward_days = array_append(claimed_reward_days, p_day_index),
    last_daily_claim_at = now()
  where id = auth.uid();

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_coins, 'daily', jsonb_build_object('day', p_day_index));

  return true;
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
    'lastDailyClaimAt', v_profile.last_daily_claim_at,
    'withdrawals', v_withdrawals,
    'adsWatchedToday', coalesce(v_ad_count, 0),
    'adsRemainingToday', greatest(0, v_daily_limit - coalesce(v_ad_count, 0))
  );
end;
$$;
