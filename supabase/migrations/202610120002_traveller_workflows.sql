begin;
alter table public.enquiries add column assigned_to uuid references auth.users(id) on delete set null;
alter table public.enquiries add column follow_up_on date;
create index enquiries_follow_up_idx on public.enquiries(follow_up_on) where status not in ('confirmed','closed');
alter table public.enquiry_events add column previous_assignee uuid;
alter table public.enquiry_events add column next_assignee uuid;
alter table public.enquiry_events add column previous_follow_up date;
alter table public.enquiry_events add column next_follow_up date;
grant update(assigned_to,follow_up_on) on public.enquiries to authenticated;
create or replace function private.audit_enquiry() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.assigned_to is not null and not public.is_staff(new.assigned_to) then raise exception 'Assignee must be staff'; end if;
 new.updated_at := clock_timestamp();
 if old.status is distinct from new.status or old.staff_notes is distinct from new.staff_notes or old.assigned_to is distinct from new.assigned_to or old.follow_up_on is distinct from new.follow_up_on then
 insert into public.enquiry_events(enquiry_id,actor_id,previous_status,next_status,notes_changed,previous_assignee,next_assignee,previous_follow_up,next_follow_up)
 values(new.id,auth.uid(),old.status,new.status,old.staff_notes is distinct from new.staff_notes,old.assigned_to,new.assigned_to,old.follow_up_on,new.follow_up_on);
 end if; return new;
end $$;
create function public.staff_directory() returns table(user_id uuid,email text) language plpgsql stable security definer set search_path = '' as $$
begin
 if not public.is_staff(auth.uid()) then raise exception 'Staff access required'; end if;
 return query select u.id,u.email::text from auth.users u where public.is_staff(u.id);
end $$;
revoke all on function public.staff_directory() from public;
grant execute on function public.staff_directory() to authenticated;
create table public.proposals (
 id uuid primary key default gen_random_uuid(), traveller_id uuid not null references auth.users(id),
 enquiry_id uuid references public.enquiries(id), title text not null check(length(trim(title)) between 1 and 200), created_at timestamptz not null default now()
);
create table public.proposal_versions (
 id uuid primary key default gen_random_uuid(), proposal_id uuid not null references public.proposals(id), version integer not null check(version > 0),
 itinerary text not null check(length(trim(itinerary)) between 1 and 12000), accommodation text not null check(length(trim(accommodation)) between 1 and 8000),
 inclusions text not null check(length(trim(inclusions)) between 1 and 8000), exclusions text not null check(length(trim(exclusions)) between 1 and 8000),
 currency text not null check(currency in ('NAD','USD','EUR','GBP','ZAR')), total numeric(14,2) not null check(total > 0 and total <= 999999999999.99),
 terms text not null check(length(trim(terms)) between 1 and 12000), valid_until date not null,
 published_by uuid not null references auth.users(id), created_at timestamptz not null default now(), unique(proposal_id,version)
);
create table public.proposal_requests (
 id uuid primary key default gen_random_uuid(), version_id uuid not null references public.proposal_versions(id),
 traveller_id uuid not null references auth.users(id), message text not null check(length(trim(message)) between 1 and 4000),
 created_at timestamptz not null default now()
);
create index proposals_traveller_idx on public.proposals(traveller_id);
create index proposal_requests_traveller_time_idx on public.proposal_requests(traveller_id,created_at);
create index proposal_requests_version_idx on public.proposal_requests(version_id);
alter table public.proposals enable row level security;
alter table public.proposal_versions enable row level security;
alter table public.proposal_requests enable row level security;
revoke all on public.proposals,public.proposal_versions,public.proposal_requests from anon,authenticated;
grant select on public.proposals,public.proposal_versions,public.proposal_requests to authenticated;
grant insert(traveller_id,enquiry_id,title) on public.proposals to authenticated;
grant insert(version_id,traveller_id,message) on public.proposal_requests to authenticated;
create policy proposal_read on public.proposals for select to authenticated using(traveller_id = (select auth.uid()) or public.is_staff((select auth.uid())));
create policy proposal_create on public.proposals for insert to authenticated with check(public.is_staff((select auth.uid())));
create policy version_read on public.proposal_versions for select to authenticated using(exists(select 1 from public.proposals p where p.id = proposal_id));
create policy request_read on public.proposal_requests for select to authenticated using(traveller_id = (select auth.uid()) or public.is_staff((select auth.uid())));
create policy request_create on public.proposal_requests for insert to authenticated with check(traveller_id = (select auth.uid()) and exists(select 1 from public.proposal_versions v join public.proposals p on p.id = v.proposal_id where v.id = version_id and p.traveller_id = (select auth.uid())));
create function public.publish_proposal(_proposal_id uuid,_expected_version integer,_details jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare current_version integer; result uuid;
begin
 if not public.is_staff(auth.uid()) then raise exception 'Staff access required'; end if;
 if _details is null or jsonb_typeof(_details) <> 'object' or octet_length(_details::text) > 50000 then raise exception 'Invalid proposal'; end if;
 perform 1 from public.proposals where id = _proposal_id for update;
 if not found then raise exception 'Proposal not found'; end if;
 select coalesce(max(version),0) into current_version from public.proposal_versions where proposal_id = _proposal_id;
 if _expected_version is null or current_version <> _expected_version then raise exception 'Proposal changed; reload before publishing'; end if;
 if (_details->>'valid_until')::date < current_date then raise exception 'Expiry must not be in the past'; end if;
 insert into public.proposal_versions(proposal_id,version,itinerary,accommodation,inclusions,exclusions,currency,total,terms,valid_until,published_by)
 values(_proposal_id,current_version+1,_details->>'itinerary',_details->>'accommodation',_details->>'inclusions',_details->>'exclusions',_details->>'currency',(_details->>'total')::numeric,_details->>'terms',(_details->>'valid_until')::date,auth.uid()) returning id into result;
 return result;
end $$;
revoke all on function public.publish_proposal(uuid,integer,jsonb) from public;
grant execute on function public.publish_proposal(uuid,integer,jsonb) to authenticated;
-- Approved, source-attributed content. Public readers cannot see drafts.
create table public.travel_details (
 id uuid primary key default gen_random_uuid(), category text not null check(category in ('itinerary','pricing','accommodation','guide','vehicle','review','credential')),
 title text not null check(length(trim(title)) between 1 and 200), body text not null check(length(trim(body)) between 1 and 12000),
 source_url text not null check(source_url ~ '^https://[^[:space:]]+$' and length(source_url) < 2000),
 photo_url text check(photo_url is null or (photo_url ~ '^https://[^[:space:]]+$' and length(photo_url) < 2000)),
 approved boolean not null default false, updated_at timestamptz not null default now(), updated_by uuid not null references auth.users(id)
);
alter table public.travel_details enable row level security;
revoke all on public.travel_details from anon,authenticated;
grant select on public.travel_details to anon,authenticated;
grant insert(category,title,body,source_url,photo_url,approved,updated_by) on public.travel_details to authenticated;
create policy public_details on public.travel_details for select using(approved);
create policy staff_details_read on public.travel_details for select to authenticated using(public.is_staff((select auth.uid())));
create policy staff_details_insert on public.travel_details for insert to authenticated with check(public.is_staff((select auth.uid())) and updated_by = (select auth.uid()));
grant update(category,title,body,source_url,photo_url,approved,updated_by) on public.travel_details to authenticated;
create policy staff_details_update on public.travel_details for update to authenticated using(public.is_staff((select auth.uid()))) with check(public.is_staff((select auth.uid())) and updated_by = (select auth.uid()));
create function private.touch_travel_details() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end $$;
create trigger travel_details_timestamp before update on public.travel_details for each row execute function private.touch_travel_details();
-- Bound authenticated request spam; serialize the quota check per traveller.
create function private.limit_proposal_requests() returns trigger language plpgsql security definer set search_path = '' as $$
begin
 if new.traveller_id is distinct from auth.uid() then raise exception 'Traveller mismatch'; end if;
 perform pg_advisory_xact_lock(hashtextextended(new.traveller_id::text, 3));
 if (select count(*) from public.proposal_requests where traveller_id = new.traveller_id and created_at > now() - interval '1 hour') >= 10 then raise exception 'Too many requests; please try later'; end if;
 return new;
end $$;
create trigger proposal_request_limit before insert on public.proposal_requests for each row execute function private.limit_proposal_requests();
commit;
