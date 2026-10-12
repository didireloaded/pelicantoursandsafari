begin;
-- No brief, traveller identity or generated text is retained in the quota ledger.
create table private.ai_draft_requests(staff_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create index ai_draft_staff_time_idx on private.ai_draft_requests(staff_id,created_at);
create function public.consume_ai_draft_request() returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if not public.is_staff(auth.uid()) then raise exception 'Staff access required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pelican-ai-draft-budget',4));
 delete from private.ai_draft_requests where created_at < now() - interval '1 day';
 if (select count(*) from private.ai_draft_requests where staff_id=auth.uid() and created_at > now()-interval '1 hour') >= 10
 or (select count(*) from private.ai_draft_requests) >= 100 then raise exception 'Draft limit reached'; end if;
 insert into private.ai_draft_requests(staff_id) values(auth.uid());
 return true;
end $$;
revoke all on function public.consume_ai_draft_request() from public,anon;
grant execute on function public.consume_ai_draft_request() to authenticated;
commit;
