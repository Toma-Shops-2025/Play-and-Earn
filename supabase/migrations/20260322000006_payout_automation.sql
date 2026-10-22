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
