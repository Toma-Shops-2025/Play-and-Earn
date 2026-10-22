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
