alter table public.enquiries add column confirmed_starts_on date, add column confirmed_ends_on date;
alter table public.enquiries add constraint enquiry_confirmed_dates check (
 (confirmed_starts_on is null and confirmed_ends_on is null) or
 (confirmed_starts_on is not null and confirmed_ends_on is not null and confirmed_ends_on>=confirmed_starts_on and confirmed_ends_on<=confirmed_starts_on+365)
);
create function private.require_booking_dates() returns trigger language plpgsql set search_path='' as $$
begin
 if new.booking_ref is not null and new.status='confirmed' and
 (old.status is distinct from new.status or old.confirmed_starts_on is distinct from new.confirmed_starts_on or old.confirmed_ends_on is distinct from new.confirmed_ends_on) and
 (new.confirmed_starts_on is null or new.confirmed_ends_on is null) then raise exception 'Choose confirmed travel dates'; end if;
 return new;
end $$;
revoke all on function private.require_booking_dates() from public,anon,authenticated;
create trigger booking_confirmed_dates before update on public.enquiries for each row execute function private.require_booking_dates();
create function public.confirm_booking(_id uuid,_updated_at timestamptz,_starts_on date,_ends_on date) returns jsonb language plpgsql security definer set search_path='' as $$
declare result public.enquiries;
begin
 if not public.can_manage_site() then raise exception 'Staff verification required'; end if;
 if _starts_on is null or _ends_on is null or _ends_on<_starts_on or _ends_on>_starts_on+365 then raise exception 'Choose valid travel dates (up to one year)'; end if;
 update public.enquiries set status='confirmed',confirmed_starts_on=_starts_on,confirmed_ends_on=_ends_on
 where id=_id and booking_ref is not null and updated_at=_updated_at returning * into result;
 if not found then raise exception 'Booking changed; reload'; end if;
 return to_jsonb(result);
end $$;
revoke all on function public.confirm_booking(uuid,timestamptz,date,date) from public,anon;
grant execute on function public.confirm_booking(uuid,timestamptz,date,date) to authenticated;