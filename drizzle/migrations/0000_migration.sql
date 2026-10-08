create type public.app_role as enum ('admin', 'staff');
create type public.enquiry_status as enum ('new','contacted','building_itinerary','quote_sent','confirmed','closed');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','staff')) $$;

create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  status enquiry_status not null default 'new',
  name text not null check (char_length(name) between 1 and 200),
  email text check (email is null or char_length(email) <= 255),
  phone text check (phone is null or char_length(phone) <= 50),
  residence text check (residence is null or char_length(residence) <= 120),
  contact_preference text check (contact_preference is null or char_length(contact_preference) <= 40),
  safari_slug text check (safari_slug is null or char_length(safari_slug) <= 120),
  brief text not null check (char_length(brief) <= 8000),
  staff_notes text
);
grant insert on public.enquiries to anon, authenticated;
grant select, update on public.enquiries to authenticated;
grant all on public.enquiries to service_role;
alter table public.enquiries enable row level security;
create policy "Anyone can submit a new enquiry" on public.enquiries for insert to anon, authenticated
  with check (status = 'new' and staff_notes is null and (email is not null or phone is not null));
create policy "Staff read enquiries" on public.enquiries for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff update enquiries" on public.enquiries for update to authenticated using (public.is_staff(auth.uid())) with check (public.is_staff(auth.uid()));

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;
create trigger enquiries_touch before update on public.enquiries for each row execute function public.touch_updated_at();