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
