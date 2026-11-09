-- One daily streak claim per UTC calendar day (guest mode was client-only before).

alter table public.profiles
  add column if not exists last_daily_reward_claim_date date;

create or replace function public.claim_daily_reward(p_day_index integer, p_coins integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days integer[];
  v_last date;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_day_index < 0 or p_day_index > 6 or p_coins < 1 or p_coins > 50 then
    raise exception 'invalid reward';
  end if;

  select claimed_reward_days, last_daily_reward_claim_date
    into v_days, v_last
  from public.profiles
  where id = auth.uid()
  for update;

  if v_last = (timezone('utc', now()))::date then
    raise exception 'already claimed today';
  end if;

  if p_day_index = any (v_days) then
    return false;
  end if;
  if p_day_index <> coalesce(array_length(v_days, 1), 0) then
    raise exception 'claim current day only';
  end if;

  update public.profiles
  set
    coins = coins + p_coins,
    claimed_reward_days = array_append(claimed_reward_days, p_day_index),
    last_daily_reward_claim_date = (timezone('utc', now()))::date
  where id = auth.uid();

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (auth.uid(), p_coins, 'daily', jsonb_build_object('day', p_day_index));

  return true;
end;
$$;
