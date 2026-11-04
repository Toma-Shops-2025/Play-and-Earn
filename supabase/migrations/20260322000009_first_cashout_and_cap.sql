-- First cashout minimum ($5), then any amount. Ready balance caps at $25 until cashout.

create or replace function public.sync_conversion(p_user_id uuid)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_added numeric(12, 4);
  v_room numeric(12, 4);
  v_room_coins bigint;
  v_convert bigint;
  v_coins_per_dollar constant numeric := 2500;
  v_max_cash constant numeric := 25;
begin
  if p_user_id is null or p_user_id <> auth.uid() then
    raise exception 'unauthorized';
  end if;

  select * into v_profile from public.profiles where id = p_user_id for update;
  if not found then
    raise exception 'profile not found';
  end if;

  while v_profile.conversion_due_at <= now() loop
    v_added := 0;
    v_convert := 0;
    v_room := greatest(0, v_max_cash - v_profile.cash_balance);

    if v_profile.coins > 0 and v_room > 0 then
      v_room_coins := floor(v_room * v_coins_per_dollar);
      v_convert := least(v_profile.coins::bigint, v_room_coins);
      if v_convert > 0 then
        v_added := round((v_convert::numeric / v_coins_per_dollar), 4);
      end if;
    end if;

    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = coins - v_convert::int,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    if v_added > 0 then
      insert into public.coin_ledger (user_id, delta, reason, metadata)
      values (
        p_user_id,
        -v_convert::int,
        'conversion',
        jsonb_build_object(
          'cash_added', v_added,
          'interval_hours', 3,
          'max_cash_balance', v_max_cash
        )
      );
    end if;
  end loop;

  return v_profile;
end;
$$;

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
  v_has_prior boolean;
  v_min numeric(12, 4);
  v_first_min constant numeric := 5;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  perform public.sync_conversion(auth.uid());

  select exists(
    select 1
    from public.withdrawals
    where user_id = auth.uid()
      and status in ('pending', 'processing', 'completed')
  ) into v_has_prior;

  -- Server enforces: $5 first cashout, $0 after. Client p_min_amount cannot lower this.
  v_min := case when v_has_prior then 0 else v_first_min end;
  if p_min_amount is not null and p_min_amount > v_min then
    v_min := p_min_amount;
  end if;

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

  if v_balance < v_min then
    return jsonb_build_object(
      'ok', false,
      'message', case
        when v_has_prior then
          format('Minimum balance is $%s.', trim(to_char(v_min, 'FM999990.00')))
        else
          format(
            'First cashout needs $%s. After that, any amount is fine.',
            trim(to_char(v_min, 'FM999990.00'))
          )
      end
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
