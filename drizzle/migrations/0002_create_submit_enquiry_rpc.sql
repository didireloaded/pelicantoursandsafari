create or replace function public.submit_enquiry(payload jsonb, network_hash text) returns uuid language plpgsql security definer set search_path = '' as $$
declare request uuid; existing public.enquiries; result uuid; fingerprint text;
begin
  if jsonb_typeof(payload) <> 'object' or octet_length(payload::text) > 16000 then raise exception 'Invalid enquiry'; end if;
  request := (payload->>'request_id')::uuid;
  if request is null or length(network_hash) <> 64 or coalesce(length(trim(payload->>'name')),0) not between 1 and 200
    or coalesce(length(payload->>'brief'),0) not between 1 and 8000
    or coalesce(length(payload->>'email'),0) > 255 or coalesce(length(payload->>'phone'),0) > 50
    or coalesce(length(payload->>'residence'),0) > 120
    or (coalesce(trim(payload->>'email'),'') = '' and coalesce(trim(payload->>'phone'),'') = '')
    or coalesce(payload->>'contact_preference','') not in ('WhatsApp','Email','Phone') then raise exception 'Invalid enquiry'; end if;
  if coalesce(payload->>'email','') <> '' and payload->>'email' !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'Invalid email'; end if;
  if coalesce(payload->>'safari_slug','') <> '' and (length(payload->>'safari_slug') > 80 or payload->>'safari_slug' !~ '^[a-z0-9-]+$') then raise exception 'Invalid safari'; end if;
  fingerprint := md5((payload - 'request_id')::text);
  perform pg_advisory_xact_lock(hashtextextended(request::text,0));
  select * into existing from public.enquiries where request_id = request;
  if found then
    if existing.request_hash <> fingerprint then raise exception 'Request changed; use a new request ID'; end if;
    return existing.id;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(network_hash,1));
  delete from private.enquiry_limits where created_at < now() - interval '1 day';
  if (select count(*) from private.enquiry_limits l where l.network_hash = submit_enquiry.network_hash and created_at > now() - interval '1 hour') >= 10 then raise exception 'Rate limit reached'; end if;
  insert into private.enquiry_limits(network_hash) values(network_hash);
  insert into public.enquiries(name,email,phone,residence,contact_preference,safari_slug,brief,request_id,request_hash)
    values(trim(payload->>'name'),nullif(trim(payload->>'email'),''),nullif(trim(payload->>'phone'),''),nullif(trim(payload->>'residence'),''),payload->>'contact_preference',nullif(payload->>'safari_slug',''),payload->>'brief',request,fingerprint) returning id into result;
  return result;
end $$;
revoke all on function public.submit_enquiry(jsonb,text) from public, anon, authenticated;
grant execute on function public.submit_enquiry(jsonb,text) to service_role;