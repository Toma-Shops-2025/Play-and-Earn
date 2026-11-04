-- Time-boxed Y8 / Crazy Games rewards. Caps match src/lib/economy-config.ts portalPlay.

create table if not exists public.portal_play_claims (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  minutes integer not null default 0,
  coins integer not null default 0,
  primary key (user_id, day)
);

alter table public.portal_play_claims enable row level security;

create policy "portal_play_claims_select_own"
  on public.portal_play_claims for select
  using (auth.uid() = user_id);

create or replace function public.grant_portal_play(
  p_portal_id text,
  p_minutes integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (timezone('utc', now()))::date;
  v_used integer := 0;
  v_grant integer;
  v_coins integer;
  v_new_balance integer;
  v_coins_per_minute constant integer := 2;
  v_max_session constant integer := 20;
  v_max_day constant integer := 40;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_portal_id not in ('y8', 'crazy') then
    raise exception 'invalid portal';
  end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > v_max_session then
    raise exception 'invalid play minutes';
  end if;

  select coalesce(minutes, 0) into v_used
  from public.portal_play_claims
  where user_id = auth.uid() and day = v_today;

  v_grant := least(p_minutes, greatest(0, v_max_day - v_used));
  if v_grant <= 0 then
    return jsonb_build_object(
      'ok', false,
      'message', 'Daily arcade-portal cap reached. Watch ads or come back tomorrow.',
      'coinsGranted', 0,
      'minutesGranted', 0,
      'minutesRemainingToday', 0
    );
  end if;

  v_coins := v_grant * v_coins_per_minute;

  insert into public.portal_play_claims (user_id, day, minutes, coins)
  values (auth.uid(), v_today, v_grant, v_coins)
  on conflict (user_id, day)
  do update set
    minutes = portal_play_claims.minutes + excluded.minutes,
    coins = portal_play_claims.coins + excluded.coins;

  update public.profiles
  set coins = coins + v_coins
  where id = auth.uid()
  returning coins into v_new_balance;

  insert into public.coin_ledger (user_id, delta, reason, metadata)
  values (
    auth.uid(),
    v_coins,
    'portal',
    jsonb_build_object('portal_id', p_portal_id, 'minutes', v_grant)
  );

  return jsonb_build_object(
    'ok', true,
    'message', format('+%s coins for %s min in arcade portal', v_coins, v_grant),
    'coinsGranted', v_coins,
    'minutesGranted', v_grant,
    'minutesRemainingToday', greatest(0, v_max_day - (v_used + v_grant)),
    'balance', v_new_balance
  );
end;
$$;

grant execute on function public.grant_portal_play(text, integer) to authenticated;
