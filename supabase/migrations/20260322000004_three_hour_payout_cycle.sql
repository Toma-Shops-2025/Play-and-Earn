-- Three-hour payout windows: always advance timer; convert coins when a window elapses

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

  while v_profile.conversion_due_at <= now() loop
    v_added := 0;
    if v_profile.coins > 0 then
      v_added := round((v_profile.coins::numeric / v_coins_per_dollar), 4);
    end if;

    update public.profiles
    set
      cash_balance = cash_balance + v_added,
      coins = case when v_added > 0 then 0 else coins end,
      conversion_due_at = conversion_due_at + interval '3 hours'
    where id = p_user_id
    returning * into v_profile;

    if v_added > 0 then
      insert into public.coin_ledger (user_id, delta, reason, metadata)
      values (
        p_user_id,
        0,
        'conversion',
        jsonb_build_object('cash_added', v_added, 'interval_hours', 3)
      );
    end if;
  end loop;

  return v_profile;
end;
$$;
