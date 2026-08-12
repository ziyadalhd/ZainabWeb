create table public.interested_contacts (
  id uuid primary key default gen_random_uuid(),
  contact_name text not null
    constraint interested_contacts_name_valid
    check (length(btrim(contact_name)) between 2 and 120),
  phone_e164 text not null
    constraint interested_contacts_phone_valid
    check (phone_e164 ~ '^\+9665[0-9]{8}$'),
  email text not null unique
    constraint interested_contacts_email_normalized
    check (email = lower(email))
    constraint interested_contacts_email_valid
    check (length(email) <= 254 and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'),
  unsubscribe_token_hash text not null unique
    constraint interested_contacts_unsubscribe_token_hash_valid
    check (unsubscribe_token_hash ~ '^[a-f0-9]{64}$'),
  consented_at timestamptz not null default now(),
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint interested_contacts_unsubscribe_after_consent
    check (unsubscribed_at is null or unsubscribed_at >= consented_at)
);

comment on table public.interested_contacts is
  'Consent-based upcoming-event contacts. The email is required and the secure unsubscribe token is stored only as a hash.';
comment on column public.interested_contacts.unsubscribed_at is
  'Set only after the contact uses her secure unsubscribe link. No broadcast or automatic delivery is implied by this record.';

create index interested_contacts_active_consented_idx
  on public.interested_contacts (consented_at desc)
  where unsubscribed_at is null;

alter table public.interested_contacts enable row level security;

revoke all on table public.interested_contacts from public, anon, authenticated;
grant select on table public.interested_contacts to authenticated;

create policy interested_contacts_admin_select
on public.interested_contacts
for select
to authenticated
using ((select private.is_admin()));

create trigger interested_contacts_set_updated_at
before update on public.interested_contacts
for each row
execute function private.set_updated_at();

create function private.submit_interested_contact(
  p_contact_name text,
  p_phone_e164 text,
  p_email text,
  p_unsubscribe_token_hash text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  contact_id uuid;
  normalized_name text := btrim(coalesce(p_contact_name, ''));
  normalized_phone text := btrim(coalesce(p_phone_e164, ''));
  normalized_email text := lower(btrim(coalesce(p_email, '')));
begin
  if length(normalized_name) not between 2 and 120
    or normalized_phone !~ '^\+9665[0-9]{8}$'
    or length(normalized_email) > 254
    or normalized_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_unsubscribe_token_hash !~ '^[a-f0-9]{64}$'
  then
    raise sqlstate 'P0001' using message = 'invalid_interested_contact';
  end if;

  insert into public.interested_contacts (
    contact_name,
    phone_e164,
    email,
    unsubscribe_token_hash,
    consented_at,
    unsubscribed_at
  )
  values (
    normalized_name,
    normalized_phone,
    normalized_email,
    p_unsubscribe_token_hash,
    now(),
    null
  )
  on conflict (email) do update
  set
    contact_name = excluded.contact_name,
    phone_e164 = excluded.phone_e164,
    unsubscribe_token_hash = excluded.unsubscribe_token_hash,
    consented_at = now(),
    unsubscribed_at = null
  returning id into contact_id;

  return contact_id;
end;
$$;

create function private.unsubscribe_interested_contact(
  p_unsubscribe_token_hash text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_unsubscribe_token_hash !~ '^[a-f0-9]{64}$' then
    raise sqlstate 'P0001' using message = 'interested_contact_unavailable';
  end if;

  update public.interested_contacts
  set unsubscribed_at = coalesce(unsubscribed_at, now())
  where unsubscribe_token_hash = p_unsubscribe_token_hash;

  if not found then
    raise sqlstate 'P0001' using message = 'interested_contact_unavailable';
  end if;
end;
$$;

revoke all on function private.submit_interested_contact(text, text, text, text)
  from public, anon, authenticated;
revoke all on function private.unsubscribe_interested_contact(text)
  from public, anon, authenticated;
grant usage on schema private to anon, authenticated;
grant execute on function private.submit_interested_contact(text, text, text, text)
  to anon, authenticated;
grant execute on function private.unsubscribe_interested_contact(text)
  to anon, authenticated;

create function public.submit_interested_contact(
  p_contact_name text,
  p_phone_e164 text,
  p_email text,
  p_unsubscribe_token_hash text
)
returns uuid
language sql
security invoker
set search_path = ''
as $$
  select private.submit_interested_contact(
    p_contact_name,
    p_phone_e164,
    p_email,
    p_unsubscribe_token_hash
  );
$$;

create function public.unsubscribe_interested_contact(
  p_unsubscribe_token_hash text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.unsubscribe_interested_contact(p_unsubscribe_token_hash);
$$;

revoke all on function public.submit_interested_contact(text, text, text, text)
  from public, anon, authenticated;
revoke all on function public.unsubscribe_interested_contact(text)
  from public, anon, authenticated;
grant execute on function public.submit_interested_contact(text, text, text, text)
  to anon, authenticated;
grant execute on function public.unsubscribe_interested_contact(text)
  to anon, authenticated;

alter table public.registrations
  add column payment_status text not null default 'unpaid'
    constraint registrations_payment_status_valid
    check (payment_status in ('unpaid', 'deposit_paid', 'paid_in_full'));

comment on column public.registrations.payment_status is
  'Administrator-recorded manual payment state. The application does not process payments.';

create index registrations_event_payment_status_idx
  on public.registrations (event_id, payment_status)
  where status = 'registered';

create function private.set_registration_payment_status(
  p_registration_id uuid,
  p_payment_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise insufficient_privilege using message = 'admin_required';
  end if;

  if p_payment_status not in ('unpaid', 'deposit_paid', 'paid_in_full') then
    raise sqlstate 'P0001' using message = 'invalid_registration_payment_status';
  end if;

  update public.registrations
  set payment_status = p_payment_status
  where id = p_registration_id
    and status = 'registered';

  if not found then
    raise sqlstate 'P0001' using message = 'registration_not_active';
  end if;
end;
$$;

revoke all on function private.set_registration_payment_status(uuid, text)
  from public, anon, authenticated;
grant execute on function private.set_registration_payment_status(uuid, text)
  to authenticated;

create function public.set_registration_payment_status(
  p_registration_id uuid,
  p_payment_status text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.set_registration_payment_status(
    p_registration_id,
    p_payment_status
  );
$$;

revoke all on function public.set_registration_payment_status(uuid, text)
  from public, anon, authenticated;
grant execute on function public.set_registration_payment_status(uuid, text)
  to authenticated;

comment on function public.set_registration_payment_status(uuid, text) is
  'Invoker wrapper for administrator-only manual event-payment recording.';
