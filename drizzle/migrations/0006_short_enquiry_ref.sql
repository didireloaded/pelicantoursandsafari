ALTER TABLE public.enquiries ADD COLUMN enquiry_ref text;
CREATE UNIQUE INDEX enquiries_enquiry_ref_key ON public.enquiries(enquiry_ref) WHERE enquiry_ref IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_enquiry_ref(_enquiry uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path TO '' AS $$
declare current_ref text; first_name text; prefix text; candidate text;
begin
  perform pg_advisory_xact_lock(hashtextextended(_enquiry::text,5));
  select enquiry_ref, split_part(trim(name),' ',1) into current_ref, first_name from public.enquiries where id = _enquiry;
  if not found then raise exception 'Unknown enquiry'; end if;
  if current_ref is not null then return current_ref; end if;
  prefix := left(upper(regexp_replace(coalesce(first_name,''),'[^A-Za-z]','','g')),12);
  if prefix = '' then prefix := 'GUEST'; end if;
  loop
    candidate := prefix || '-' || lpad((floor(random()*100000))::int::text,5,'0');
    exit when not exists (select 1 from public.enquiries where enquiry_ref = candidate);
  end loop;
  update public.enquiries set enquiry_ref = candidate where id = _enquiry;
  return candidate;
end $$;
REVOKE ALL ON FUNCTION public.assign_enquiry_ref(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_enquiry_ref(uuid) TO service_role;