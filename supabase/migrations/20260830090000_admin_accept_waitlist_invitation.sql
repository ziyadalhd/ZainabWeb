-- Lets an administrator confirm a waitlist invitation on the guest's behalf, for the case where
-- the guest accepted by phone or WhatsApp instead of using their own invitation link. Mirrors the
-- guest-facing public.accept_waitlist_invitation transition exactly, but is looked up by
-- registration id (not the guest's secure token) and is admin-gated instead of token-gated.

create function private.admin_accept_waitlist_invitation(p_registration_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_event_id uuid;
  selected_registration public.registrations%rowtype;
  selected_event public.events%rowtype;
  registered_count integer;
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  select event_id
  into selected_event_id
  from public.registrations
  where id = p_registration_id;

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_found';
  end if;

  select *
  into selected_event
  from public.events
  where id = selected_event_id
  for update;

  select *
  into selected_registration
  from public.registrations
  where id = p_registration_id
  for update;

  if selected_registration.status <> 'invited'
    or selected_registration.invitation_expires_at <= now()
    or selected_event.starts_at <= now()
  then
    raise sqlstate 'P0001' using message = 'invitation_unavailable';
  end if;

  select count(*)::integer
  into registered_count
  from public.registrations
  where event_id = selected_event_id
    and status = 'registered';

  if registered_count >= selected_event.capacity then
    raise sqlstate 'P0001' using message = 'event_capacity_reached';
  end if;

  update public.registrations
  set
    status = 'registered',
    promoted_at = now(),
    invitation_token_hash = null,
    invitation_expires_at = null,
    invitation_accepted_at = now()
  where id = p_registration_id;
end;
$$;

comment on function private.admin_accept_waitlist_invitation(uuid) is
  'Admin-initiated equivalent of public.accept_waitlist_invitation, for a guest who accepted by phone or WhatsApp instead of their own invitation link.';

revoke all on function private.admin_accept_waitlist_invitation(uuid)
  from public, anon, authenticated;
grant execute on function private.admin_accept_waitlist_invitation(uuid)
  to authenticated;

create function public.admin_accept_waitlist_invitation(p_registration_id uuid)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.admin_accept_waitlist_invitation(p_registration_id);
$$;

revoke all on function public.admin_accept_waitlist_invitation(uuid)
  from public, anon, authenticated;
grant execute on function public.admin_accept_waitlist_invitation(uuid)
  to authenticated;
