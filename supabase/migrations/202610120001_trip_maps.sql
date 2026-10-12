begin;
create or replace function public.valid_trip_stops(stops jsonb) returns boolean language plpgsql immutable set search_path = '' as $$
declare s jsonb;
begin
  if stops is null or jsonb_typeof(stops) <> 'array' or jsonb_array_length(stops) not between 1 and 30 then return false; end if;
  for s in select value from jsonb_array_elements(stops) loop
    if jsonb_typeof(s) <> 'object' or coalesce(s->>'destination','') not in ('etosha','sossusvlei-deadvlei','swakopmund-walvis-bay','spitzkoppe','skeleton-coast','kavango-zambezi','windhoek','botswana','chobe','zimbabwe','victoria-falls')
      or jsonb_typeof(s->'nights') <> 'number' or coalesce(s->>'nights','') !~ '^[0-9]+$' then return false; end if;
    if (s->>'nights')::numeric not between 1 and 90 then return false; end if;
    if s ? 'stay' and not coalesce((
      (s->>'stay' in ('mokuti-etosha','okaukuejo-resort') and s->>'destination' = 'etosha') or
      (s->>'stay' = 'the-desert-grace' and s->>'destination' = 'sossusvlei-deadvlei') or
      (s->>'stay' = 'strand-hotel-swakopmund' and s->>'destination' = 'swakopmund-walvis-bay')
    ), false) then return false; end if;
    if (s - 'destination' - 'stay' - 'nights') <> '{}'::jsonb then return false; end if;
  end loop;
  return true;
end $$;
create table public.trips (
  id uuid primary key default gen_random_uuid(), traveller_id uuid not null references auth.users(id),
  title text not null check (length(trim(title)) between 1 and 200),
  status text not null default 'draft' check(status in ('draft','confirmed','cancelled')),
  starts_on date not null, stops jsonb not null check(public.valid_trip_stops(stops)),
  created_at timestamptz not null default now(), updated_at timestamptz not null default clock_timestamp()
);
create index trips_traveller_idx on public.trips(traveller_id, starts_on);
alter table public.trips enable row level security;
revoke all on public.trips from anon, authenticated;
grant select, insert on public.trips to authenticated;
grant update(traveller_id,title,status,starts_on,stops) on public.trips to authenticated;
create policy trip_staff_read on public.trips for select to authenticated using(public.is_staff((select auth.uid())));
create policy trip_traveller_read on public.trips for select to authenticated using(traveller_id = (select auth.uid()) and status in ('confirmed','cancelled'));
create policy trip_staff_insert on public.trips for insert to authenticated with check(public.is_staff((select auth.uid())));
create policy trip_staff_update on public.trips for update to authenticated using(public.is_staff((select auth.uid()))) with check(public.is_staff((select auth.uid())));
create or replace function private.touch_trip() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end $$;
create trigger trip_updated before update on public.trips for each row execute function private.touch_trip();
create table private.routing_limits (network_hash text not null, created_at timestamptz not null default now());
create index routing_limits_network_idx on private.routing_limits(network_hash,created_at);
create or replace function public.consume_routing_request(network_hash text) returns void language plpgsql security definer set search_path = '' as $$
begin
  if network_hash is null or network_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid network'; end if;
  perform pg_advisory_xact_lock(hashtextextended(network_hash,2));
  delete from private.routing_limits where created_at < now() - interval '1 day';
  if (select count(*) from private.routing_limits l where l.network_hash = consume_routing_request.network_hash and l.created_at > now() - interval '1 hour') >= 20 then raise exception 'Rate limit'; end if;
  insert into private.routing_limits(network_hash) values(network_hash);
end $$;
revoke all on function public.consume_routing_request(text) from public,anon,authenticated;
grant execute on function public.consume_routing_request(text) to service_role;
commit;
