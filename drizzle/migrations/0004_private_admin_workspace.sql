create table public.clients (
 id uuid primary key, name text not null check(length(trim(name)) between 1 and 200), country text not null default '' check(length(country)<=100),
 email text not null default '' check(length(email)<=255), phone text not null default '' check(length(phone)<=50),
 source text not null default 'Unknown' check(source in ('Website','WhatsApp','Referral','Returning client','Other','Unknown')),
 notes text not null default '' check(length(notes)<=5000), avatar_path text check(avatar_path is null or avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$'),
 archived boolean not null default false, revision integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default clock_timestamp()
);
grant select on public.clients to authenticated; grant all on public.clients to service_role;
alter table public.clients enable row level security;
create policy clients_staff on public.clients for select to authenticated using(public.can_manage_site());
-- Trips remain the reservation source. Offline clients need not create traveller accounts.
alter table public.trips alter column traveller_id drop not null;
alter table public.trips add column client_id uuid references public.clients(id), add column total_nad numeric(12,2), add column paid_nad numeric(12,2),
 add constraint trip_owner_present check(traveller_id is not null or client_id is not null),
 add constraint trip_money check((total_nad is null or total_nad between 0 and 100000000) and (paid_nad is null or paid_nad between 0 and 100000000) and (paid_nad is null or total_nad is null or paid_nad <= total_nad));
alter policy trip_staff_read on public.trips using(public.can_manage_site());
alter policy trip_staff_insert on public.trips with check(public.can_manage_site());
alter policy trip_staff_update on public.trips using(public.can_manage_site()) with check(public.can_manage_site());
revoke insert,update on public.trips from authenticated;
grant insert(id,traveller_id,title,status,starts_on,stops),update(traveller_id,title,status,starts_on,stops) on public.trips to authenticated;

create function public.save_admin_client(_id uuid,_revision integer,_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row public.clients;
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 if _data is null or jsonb_typeof(_data)<>'object' or octet_length(_data::text)>12000 or coalesce(length(trim(_data->>'name')),0) not between 1 and 200
 or coalesce(length(_data->>'country'),999)>100 or coalesce(length(_data->>'email'),999)>255 or coalesce(length(_data->>'phone'),999)>50 or coalesce(length(_data->>'notes'),99999)>5000 or coalesce(_data->>'source','') not in ('Website','WhatsApp','Referral','Returning client','Other','Unknown') or jsonb_typeof(_data->'archived') is distinct from 'boolean'
 or (_data - array['name','country','email','phone','source','notes','avatar_path','archived'])<>'{}'::jsonb then raise exception 'Check client fields'; end if;
 if _data->>'avatar_path' is not null and ((_data->>'avatar_path') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' or not exists(select 1 from storage.objects where bucket_id='site-media' and name=_data->>'avatar_path')) then raise exception 'Upload a valid photo'; end if;
 perform pg_advisory_xact_lock(hashtextextended(_id::text,52));
 select * into row from public.clients where id=_id for update;
 if (found and row.revision is distinct from _revision) or (not found and _revision is distinct from 0) then raise exception 'Client changed; reload'; end if;
 insert into public.clients(id,name,country,email,phone,source,notes,avatar_path,archived)
 values(_id,trim(_data->>'name'),_data->>'country',_data->>'email',_data->>'phone',_data->>'source',_data->>'notes',_data->>'avatar_path',(_data->>'archived')::boolean)
 on conflict(id) do update set name=excluded.name,country=excluded.country,email=excluded.email,phone=excluded.phone,source=excluded.source,notes=excluded.notes,avatar_path=excluded.avatar_path,archived=excluded.archived,revision=clients.revision+1,updated_at=clock_timestamp() returning * into row;
 return to_jsonb(row);
end $$;
revoke all on function public.save_admin_client(uuid,integer,jsonb) from public,anon; grant execute on function public.save_admin_client(uuid,integer,jsonb) to authenticated;
create function public.save_admin_trip(_id uuid,_updated_at timestamptz,_data jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare row public.trips; previous public.trips;
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 if _data is null or jsonb_typeof(_data)<>'object' or octet_length(_data::text)>20000 or coalesce(length(trim(_data->>'title')),0) not between 1 and 200 or not coalesce(public.valid_trip_stops(_data->'stops'),false) or coalesce(_data->>'status','') not in ('draft','confirmed','cancelled') or (_data-array['client_id','traveller_id','title','starts_on','status','stops','total_nad','paid_nad'])<>'{}'::jsonb then raise exception 'Check booking fields'; end if;
 if not exists(select 1 from public.clients where id=(_data->>'client_id')::uuid) then raise exception 'Choose an existing client'; end if;
 perform pg_advisory_xact_lock(hashtextextended(_id::text,53));
 select * into previous from public.trips where id=_id for update;
 if (found and previous.updated_at is distinct from _updated_at) or (not found and _updated_at is not null) then raise exception 'Booking changed; reload'; end if;
 insert into public.trips(id,client_id,traveller_id,title,starts_on,status,stops,total_nad,paid_nad)
 values(_id,(_data->>'client_id')::uuid,nullif(_data->>'traveller_id','')::uuid,trim(_data->>'title'),(_data->>'starts_on')::date,_data->>'status',_data->'stops',(_data->>'total_nad')::numeric,(_data->>'paid_nad')::numeric)
 on conflict(id) do update set client_id=excluded.client_id,traveller_id=excluded.traveller_id,title=excluded.title,starts_on=excluded.starts_on,status=excluded.status,stops=excluded.stops,total_nad=excluded.total_nad,paid_nad=excluded.paid_nad returning * into row;
 return to_jsonb(row);
end $$;
revoke all on function public.save_admin_trip(uuid,timestamptz,jsonb) from public,anon; grant execute on function public.save_admin_trip(uuid,timestamptz,jsonb) to authenticated;

create table public.site_daily_views(day date not null,path text not null,views bigint not null default 0 check(views>=0),primary key(day,path));
grant select on public.site_daily_views to authenticated; grant all on public.site_daily_views to service_role;
alter table public.site_daily_views enable row level security;
create policy daily_views_staff on public.site_daily_views for select to authenticated using(public.can_manage_site());
create table private.page_view_limits(network_hash text not null,hour timestamptz not null,hits integer not null,primary key(network_hash,hour));
create function public.record_page_view(_path text,_network_hash text) returns void language plpgsql security definer set search_path='' as $$
declare hour_now timestamptz:=date_trunc('hour',now()); count_now integer;
begin
 if _path is null or length(_path)>150 or _path !~ '^/[a-z0-9/-]*$' or _network_hash is null or _network_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid event'; end if;
 delete from private.page_view_limits where hour < hour_now-interval '2 hours';
 insert into private.page_view_limits values(_network_hash,hour_now,1) on conflict(network_hash,hour) do update set hits=page_view_limits.hits+1 returning hits into count_now;
 if count_now>120 then return; end if;
 insert into public.site_daily_views values(current_date,_path,1) on conflict(day,path) do update set views=site_daily_views.views+1;
end $$;
revoke all on function public.record_page_view(text,text) from public,anon,authenticated; grant execute on function public.record_page_view(text,text) to service_role;

create table public.staff_presence(user_id uuid primary key,display_name text not null,last_seen timestamptz not null);
grant select on public.staff_presence to authenticated;grant all on public.staff_presence to service_role;
alter table public.staff_presence enable row level security;
create policy presence_staff on public.staff_presence for select to authenticated using(public.can_manage_site());
create function public.touch_staff_presence() returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 delete from public.staff_presence where last_seen < now()-interval '1 day';
 insert into public.staff_presence values(auth.uid(),left(split_part(coalesce(auth.jwt()->>'email','Staff'),'@',1),100),clock_timestamp()) on conflict(user_id) do update set last_seen=excluded.last_seen,display_name=excluded.display_name;
end $$;
revoke all on function public.touch_staff_presence() from public,anon; grant execute on function public.touch_staff_presence() to authenticated;
create function public.consume_admin_help() returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 perform public.consume_ai_draft_request();
end $$;
revoke all on function public.consume_admin_help() from public,anon;grant execute on function public.consume_admin_help() to authenticated;