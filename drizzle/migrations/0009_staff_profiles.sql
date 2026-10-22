create table public.staff_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null check(length(trim(display_name)) between 1 and 100),
 avatar_path text,
 revision integer not null default 1,
 updated_at timestamptz not null default clock_timestamp()
);
alter table public.staff_profiles enable row level security;
revoke all on public.staff_profiles from public,anon,authenticated;
grant select on public.staff_profiles to authenticated;
grant all on public.staff_profiles to service_role;
create policy staff_profiles_read on public.staff_profiles for select to authenticated using(public.can_manage_site());
create function public.save_staff_profile(_revision integer,_display_name text,_avatar_path text) returns jsonb language plpgsql security definer set search_path='' as $$
declare current_row public.staff_profiles;
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 if _display_name is null or length(trim(_display_name)) not between 1 and 100 then raise exception 'Enter your name'; end if;
 if _avatar_path is not null and (_avatar_path !~ ('^'||auth.uid()::text||'/[0-9a-f-]{36}\.webp$') or not exists(select 1 from storage.objects where bucket_id='site-media' and name=_avatar_path)) then raise exception 'Upload your own profile photo'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,82));
 select * into current_row from public.staff_profiles where user_id=auth.uid() for update;
 if (found and current_row.revision is distinct from _revision) or (not found and _revision is distinct from 0) then raise exception 'Profile changed; reload'; end if;
 insert into public.staff_profiles(user_id,display_name,avatar_path) values(auth.uid(),trim(_display_name),_avatar_path)
 on conflict(user_id) do update set display_name=excluded.display_name,avatar_path=excluded.avatar_path,revision=staff_profiles.revision+1,updated_at=clock_timestamp() returning * into current_row;
 return to_jsonb(current_row);
end $$;
revoke all on function public.save_staff_profile(integer,text,text) from public,anon;
grant execute on function public.save_staff_profile(integer,text,text) to authenticated;