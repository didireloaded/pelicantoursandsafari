create or replace function public.quote_recipients()
returns table(client_id uuid, traveller_id uuid, enquiry_id uuid, name text, email text)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
  return query
    select c.id, u.id, e.id, c.name, c.email
    from public.clients c
    join auth.users u on lower(u.email) = lower(c.email)
    left join lateral (select q.id from public.enquiries q where lower(q.email) = lower(c.email) order by q.created_at desc limit 1) e on true
    where not c.archived and c.email <> '' and u.email_confirmed_at is not null
    order by c.name, c.email;
end $$;
revoke all on function public.quote_recipients() from public, anon;
grant execute on function public.quote_recipients() to authenticated;
