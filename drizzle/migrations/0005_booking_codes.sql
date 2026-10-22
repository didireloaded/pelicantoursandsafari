ALTER TABLE public.enquiries ADD COLUMN trip_code text, ADD COLUMN booking_ref text;
CREATE UNIQUE INDEX enquiries_booking_ref_key ON public.enquiries(booking_ref) WHERE booking_ref IS NOT NULL;
CREATE TABLE private.booking_lookup_limits (network_hash text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
REVOKE ALL ON private.booking_lookup_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.assign_booking_ref(_enquiry uuid, _trip_code text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
declare current_ref text; candidate text; alphabet text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; i int;
begin
  if _trip_code is null or _trip_code !~ '^[A-Z]{3}[0-9]{1,2}$' then raise exception 'Invalid trip code'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_enquiry::text,3));
  select booking_ref into current_ref from public.enquiries where id = _enquiry;
  if not found then raise exception 'Unknown enquiry'; end if;
  if current_ref is not null then return current_ref; end if;
  loop
    candidate := _trip_code || '-';
    for i in 1..4 loop candidate := candidate || substr(alphabet, 1 + floor(random()*length(alphabet))::int, 1); end loop;
    exit when not exists (select 1 from public.enquiries where booking_ref = candidate);
  end loop;
  update public.enquiries set trip_code = _trip_code, booking_ref = candidate where id = _enquiry;
  return candidate;
end $$;

CREATE OR REPLACE FUNCTION public.lookup_booking(_ref text, _contact text, _network_hash text)
RETURNS TABLE(trip_code text, status public.enquiry_status, created_at timestamptz)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
begin
  if _network_hash is null or _network_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid network'; end if;
  if _ref is null or length(_ref) > 20 or _contact is null or length(_contact) not between 3 and 255 then raise exception 'Invalid lookup'; end if;
  perform pg_advisory_xact_lock(hashtextextended(_network_hash,4));
  delete from private.booking_lookup_limits where booking_lookup_limits.created_at < now() - interval '1 day';
  if (select count(*) from private.booking_lookup_limits l where l.network_hash = _network_hash and l.created_at > now() - interval '1 hour') >= 20 then raise exception 'Rate limit'; end if;
  insert into private.booking_lookup_limits(network_hash) values(_network_hash);
  return query select e.trip_code, e.status, e.created_at from public.enquiries e
    where e.booking_ref = upper(trim(_ref))
      and (lower(e.email) = lower(trim(_contact))
        or (e.phone is not null and regexp_replace(e.phone,'\D','','g') = regexp_replace(_contact,'\D','','g') and length(regexp_replace(_contact,'\D','','g')) >= 6));
end $$;

REVOKE ALL ON FUNCTION public.assign_booking_ref(uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.lookup_booking(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_booking_ref(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.lookup_booking(text, text, text) TO service_role;