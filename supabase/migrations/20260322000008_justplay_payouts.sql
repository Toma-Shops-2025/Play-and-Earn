-- JustPlay-style: any amount cashout + PayPal / Cash App destinations.

alter table public.withdrawals
  add column if not exists payout_method text,
  add column if not exists payout_destination text;

update public.withdrawals
set
  payout_method = coalesce(payout_method, case when payout_email is not null then 'paypal' else null end),
  payout_destination = coalesce(payout_destination, payout_email)
where payout_destination is null or payout_method is null;

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
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

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

  if v_balance < p_min_amount then
    return jsonb_build_object(
      'ok', false,
      'message', format('Minimum balance is $%s.', trim(to_char(p_min_amount, 'FM999990.00')))
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
