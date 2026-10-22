create table public.team_access_requests(
 user_id uuid primary key,
 email text not null,
 status text not null default 'pending' check (status in ('pending','approved','declined')),
 created_at timestamptz not null default now(),
 decided_at timestamptz,
 decided_by uuid
);
grant all on public.team_access_requests to service_role;
alter table public.team_access_requests enable row level security;

create function public.request_team_access() returns text language plpgsql security definer set search_path='' as $$
declare u_email text; confirmed timestamptz; current_status text;
begin
 if auth.uid() is null then raise exception 'Sign in first'; end if;
 if exists(select 1 from public.user_roles where user_id=auth.uid()) then return 'member'; end if;
 select email,email_confirmed_at into u_email,confirmed from auth.users where id=auth.uid();
 if u_email is null or confirmed is null then raise exception 'Verify your email first'; end if;
 select status into current_status from public.team_access_requests where user_id=auth.uid();
 if current_status='declined' then return 'declined'; end if;
 insert into public.team_access_requests(user_id,email) values(auth.uid(),lower(u_email))
 on conflict (user_id) do update set status='pending', email=excluded.email
 where public.team_access_requests.status='approved';
 return 'pending';
end $$;
revoke all on function public.request_team_access() from public,anon;
grant execute on function public.request_team_access() to authenticated;

create function public.pending_team_requests() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 return coalesce((select jsonb_agg(jsonb_build_object('user_id',user_id,'email',email,'created_at',created_at) order by created_at)
  from public.team_access_requests where status='pending'),'[]'::jsonb);
end $$;
revoke all on function public.pending_team_requests() from public,anon;
grant execute on function public.pending_team_requests() to authenticated;

create function public.decide_team_request(_user_id uuid,_approve boolean,_role public.app_role default 'staff') returns void language plpgsql security definer set search_path='' as $$
declare r_email text;
begin
 if not public.can_manage_team() then raise exception 'Team administrator verification required'; end if;
 select email into r_email from public.team_access_requests where user_id=_user_id and status='pending';
 if r_email is null then raise exception 'Request no longer pending'; end if;
 if _approve then perform public.set_team_member(r_email,_role); end if;
 update public.team_access_requests set status=case when _approve then 'approved' else 'declined' end,
  decided_at=now(), decided_by=auth.uid() where user_id=_user_id;
end $$;
revoke all on function public.decide_team_request(uuid,boolean,public.app_role) from public,anon;
grant execute on function public.decide_team_request(uuid,boolean,public.app_role) to authenticated;