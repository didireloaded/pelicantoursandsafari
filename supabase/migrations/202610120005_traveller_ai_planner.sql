begin;
create schema if not exists private;
create table private.traveller_plan_requests(user_id uuid not null references auth.users(id) on delete cascade,created_at timestamptz not null default now());
create index traveller_plan_user_time_idx on private.traveller_plan_requests(user_id,created_at);
alter table private.traveller_plan_requests enable row level security;
revoke all on private.traveller_plan_requests from public,anon,authenticated;
-- Serialize quota decisions across accounts to protect shared gateway spend.
-- No travel preferences, budget or model output are stored.
create function public.consume_traveller_plan_request() returns boolean language plpgsql security definer set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pelican-traveller-plan-budget',5));
 delete from private.traveller_plan_requests where created_at < now()-interval '1 day';
 if (select count(*) from private.traveller_plan_requests where user_id=auth.uid() and created_at > now()-interval '1 hour') >= 3
 or (select count(*) from private.traveller_plan_requests) >= 100 then raise exception 'Planning limit reached'; end if;
 insert into private.traveller_plan_requests(user_id) values(auth.uid());
 return true;
end $$;
revoke all on function public.consume_traveller_plan_request() from public,anon;
grant execute on function public.consume_traveller_plan_request() to authenticated;
commit;
