-- Team membership is an explicit owner decision, never inferred from signup or metadata.
create function public.can_manage_team() returns boolean language sql stable security definer set search_path='' as $$
 select public.can_manage_site() and exists(select 1 from public.user_roles where user_id=auth.uid() and role='admin')
$$;
revoke all on function public.can_manage_team() from public,anon;
grant execute on function public.can_manage_team() to authenticated;

create function private.enforce_team_cap() returns trigger language plpgsql security definer set search_path='' as $$
begin
 perform pg_advisory_xact_lock(hashtextextended('pelican-team-seats',71));
 if not exists(select 1 from public.user_roles where user_id=new.user_id and id<>new.id)
 and (select count(distinct user_id) from public.user_roles where id<>new.id)>=5 then raise exception 'Team limit reached'; end if;
 return new;
end $$;
revoke all on function private.enforce_team_cap() from public,anon,authenticated;
create trigger team_seat_limit before insert or update on public.user_roles for each row execute function private.enforce_team_cap();

create function public.team_members() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('user_id',member.user_id,'email',member.email,'role',member.role) order by member.email) from (
  select r.user_id,u.email,case when bool_or(r.role='admin') then 'admin' else 'staff' end as role from public.user_roles r join auth.users u on u.id=r.user_id group by r.user_id,u.email
 ) member),'[]'::jsonb);
end $$;
revoke all on function public.team_members() from public,anon;
grant execute on function public.team_members() to authenticated;

create function public.set_team_member(_email text,_role public.app_role) returns void language plpgsql security definer set search_path='' as $$
declare target_id uuid; matches integer;
begin
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 if _email is null or length(trim(_email)) not between 3 and 255 or _role is null then raise exception 'Check team details'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pelican-team-seats',71));
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 select count(*),min(id::text)::uuid into matches,target_id from auth.users where lower(email)=lower(trim(_email)) and email_confirmed_at is not null;
 if matches<>1 then raise exception 'Account must sign in and verify its email first'; end if;
 if target_id=auth.uid() then raise exception 'You cannot change your own team access'; end if;
 if _role<>'admin' and exists(select 1 from public.user_roles where user_id=target_id and role='admin') and (select count(distinct user_id) from public.user_roles where role='admin')<=1 then raise exception 'Keep at least one administrator'; end if;
 delete from public.user_roles where user_id=target_id;
 insert into public.user_roles(user_id,role) values(target_id,_role);
end $$;
revoke all on function public.set_team_member(text,public.app_role) from public,anon;
grant execute on function public.set_team_member(text,public.app_role) to authenticated;

create function public.remove_team_member(_user_id uuid) returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 perform pg_advisory_xact_lock(hashtextextended('pelican-team-seats',71));
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 if _user_id=auth.uid() then raise exception 'You cannot remove your own team access'; end if;
 if exists(select 1 from public.user_roles where user_id=_user_id and role='admin') and (select count(distinct user_id) from public.user_roles where role='admin')<=1 then raise exception 'Keep at least one administrator'; end if;
 delete from public.user_roles where user_id=_user_id;
end $$;
revoke all on function public.remove_team_member(uuid) from public,anon;
grant execute on function public.remove_team_member(uuid) to authenticated;