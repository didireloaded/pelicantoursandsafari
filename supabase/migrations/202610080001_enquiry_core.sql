begin;
do $$ begin create type public.app_role as enum ('admin', 'staff'); exception when duplicate_object then null; end $$;
do $$ begin create type public.enquiry_status as enum ('new', 'contacted', 'building_itinerary', 'quote_sent', 'confirmed', 'closed'); exception when duplicate_object then null; end $$;
create table if not exists public.user_roles (id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, role public.app_role not null);
create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  name text not null, email text, phone text, residence text, contact_preference text, safari_slug text, brief text not null,
  staff_notes text, status public.enquiry_status not null default 'new'
);
alter table public.enquiries add column if not exists request_id uuid;
alter table public.enquiries add column if not exists request_hash text;
create unique index if not exists enquiries_request_id_key on public.enquiries(request_id);
create index if not exists enquiries_status_created_idx on public.enquiries(status, created_at desc);
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create table if not exists private.enquiry_limits (network_hash text not null, created_at timestamptz not null default now());
create index if not exists enquiry_limits_network_time_idx on private.enquiry_limits(network_hash, created_at);
create table if not exists public.enquiry_events (
  id uuid primary key default gen_random_uuid(), enquiry_id uuid not null references public.enquiries(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
  previous_status public.enquiry_status, next_status public.enquiry_status, notes_changed boolean not null default false
);
create or replace function public.is_staff(_user_id uuid) returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.user_roles where user_id = _user_id and role in ('admin', 'staff'));
$$;
revoke all on function public.is_staff(uuid) from public;
grant execute on function public.is_staff(uuid) to authenticated;
alter table public.enquiries enable row level security;
alter table public.user_roles enable row level security;
alter table public.enquiry_events enable row level security;
-- Replace the legacy public insert path. Staff assignments and existing enquiries are retained.
do $$ declare p record; begin
  for p in select tablename, policyname from pg_policies where schemaname = 'public' and tablename in ('enquiries','user_roles','enquiry_events') loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;
revoke all on public.enquiries, public.user_roles, public.enquiry_events from anon, authenticated;
grant select on public.enquiries, public.user_roles, public.enquiry_events to authenticated;
grant update(status, staff_notes) on public.enquiries to authenticated;
create policy staff_read on public.enquiries for select to authenticated using (public.is_staff((select auth.uid())));
create policy staff_update on public.enquiries for update to authenticated using (public.is_staff((select auth.uid()))) with check (public.is_staff((select auth.uid())));
create policy own_roles on public.user_roles for select to authenticated using (user_id = (select auth.uid()));
create policy staff_events on public.enquiry_events for select to authenticated using (public.is_staff((select auth.uid())));
create or replace function private.audit_enquiry() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  if old.status is distinct from new.status or old.staff_notes is distinct from new.staff_notes then
    insert into public.enquiry_events(enquiry_id, actor_id, previous_status, next_status, notes_changed)
    values(new.id, auth.uid(), old.status, new.status, old.staff_notes is distinct from new.staff_notes);
  end if;
  return new;
end $$;
drop trigger if exists pelican_enquiry_audit on public.enquiries;
create trigger pelican_enquiry_audit before update on public.enquiries for each row execute function private.audit_enquiry();
create or replace function public.submit_enquiry(payload jsonb, network_hash text) returns uuid language plpgsql security definer set search_path = '' as $$
declare request uuid; existing public.enquiries; result uuid; fingerprint text;
begin
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 16000 then raise exception 'Invalid enquiry'; end if;
  request := (payload->>'request_id')::uuid;
  if request is null or length(network_hash) <> 64 or coalesce(length(trim(payload->>'name')),0) not between 1 and 200
    or coalesce(length(payload->>'brief'),0) not between 1 and 8000
    or coalesce(length(payload->>'email'),0) > 255 or coalesce(length(payload->>'phone'),0) > 50
    or coalesce(length(payload->>'residence'),0) > 120
    or (coalesce(trim(payload->>'email'),'') = '' and coalesce(trim(payload->>'phone'),'') = '')
    or coalesce(payload->>'contact_preference','') not in ('WhatsApp','Email','Phone') then raise exception 'Invalid enquiry'; end if;
  if coalesce(payload->>'email','') <> '' and payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if coalesce(payload->>'safari_slug','') not in ('','big-five-etosha','windhoek-city-tour','namibian-highlights','cross-border') then raise exception 'Invalid safari'; end if;
  fingerprint := md5((payload - 'request_id')::text);
  perform pg_advisory_xact_lock(hashtextextended(request::text,0));
  select * into existing from public.enquiries where request_id = request;
  if found then
    if existing.request_hash <> fingerprint then raise exception 'Request changed; use a new request ID'; end if;
    return existing.id;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(network_hash,1));
  delete from private.enquiry_limits where created_at < now() - interval '1 day';
  if (select count(*) from private.enquiry_limits l where l.network_hash = submit_enquiry.network_hash and created_at > now() - interval '1 hour') >= 10 then raise exception 'Rate limit reached'; end if;
  insert into private.enquiry_limits(network_hash) values(network_hash);
  insert into public.enquiries(name,email,phone,residence,contact_preference,safari_slug,brief,request_id,request_hash)
    values(trim(payload->>'name'),nullif(trim(payload->>'email'),''),nullif(trim(payload->>'phone'),''),nullif(trim(payload->>'residence'),''),payload->>'contact_preference',nullif(payload->>'safari_slug',''),payload->>'brief',request,fingerprint) returning id into result;
  return result;
end $$;
revoke all on function public.submit_enquiry(jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_enquiry(jsonb,text) to service_role;
commit;
