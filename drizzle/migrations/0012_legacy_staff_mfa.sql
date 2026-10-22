begin;
-- Bring legacy staff paths under the same staff + AAL2 gate as /admin.
-- Keep traveller-owned proposal reads and change requests available at AAL1.
-- The original scaffold and the Supabase import used different policy names.
do $$
declare policy_name text; read_count integer := 0; update_count integer := 0;
begin
 for policy_name in select policyname from pg_policies
   where schemaname='public' and tablename='enquiries'
     and policyname in ('Staff read enquiries','staff_read') loop
   execute format('alter policy %I on public.enquiries using (public.can_manage_site())',policy_name);
   read_count := read_count + 1;
 end loop;
 for policy_name in select policyname from pg_policies
   where schemaname='public' and tablename='enquiries'
     and policyname in ('Staff update enquiries','staff_update') loop
   execute format('alter policy %I on public.enquiries using (public.can_manage_site()) with check (public.can_manage_site())',policy_name);
   update_count := update_count + 1;
 end loop;
 if read_count=0 or update_count=0 then raise exception 'Expected enquiry staff policies are missing'; end if;
end $$;
alter policy staff_events on public.enquiry_events using (public.can_manage_site());
alter policy proposal_read on public.proposals using (
  traveller_id = (select auth.uid()) or public.can_manage_site()
);
alter policy proposal_create on public.proposals with check (public.can_manage_site());
alter policy request_read on public.proposal_requests using (
  traveller_id = (select auth.uid()) or public.can_manage_site()
);
alter policy staff_details_read on public.travel_details using (public.can_manage_site());
alter policy staff_details_insert on public.travel_details with check (
  public.can_manage_site() and updated_by = (select auth.uid())
);
alter policy staff_details_update on public.travel_details using (public.can_manage_site()) with check (
  public.can_manage_site() and updated_by = (select auth.uid())
);

-- Function entry points are security-definer: RLS alone does not protect them.
create or replace function public.publish_proposal(_proposal_id uuid,_expected_version integer,_details jsonb) returns uuid language plpgsql security definer set search_path = '' as $$
declare current_version integer; result uuid;
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
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

create or replace function public.consume_ai_draft_request() returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pelican-ai-draft-budget',4));
 delete from private.ai_draft_requests where created_at < now() - interval '1 day';
 if (select count(*) from private.ai_draft_requests where staff_id=auth.uid() and created_at > now()-interval '1 hour') >= 10
 or (select count(*) from private.ai_draft_requests) >= 100 then raise exception 'Draft limit reached'; end if;
 insert into private.ai_draft_requests(staff_id) values(auth.uid());
 return true;
end $$;
commit;
