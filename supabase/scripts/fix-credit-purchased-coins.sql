-- Run once in Supabase SQL Editor if you see:
--   cannot change return type of existing function credit_purchased_coins(uuid,integer,text)
--
-- Safe to re-run.

create table if not exists public.payment_fulfillments (
  payment_id text primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  provider text not null default 'paypal',
  coins integer not null check (coins > 0),
  created_at timestamptz not null default now()
);

alter table public.payment_fulfillments enable row level security;

drop policy if exists "fulfillments_select_own" on public.payment_fulfillments;
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
