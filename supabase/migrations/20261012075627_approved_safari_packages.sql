-- Add structured, optional verified package facts to the existing staff approval workflow.
-- Existing RLS continues to hide drafts and limit writes to staff.
alter table public.travel_details
  add column safari_slug text,
  add column package_details jsonb,
  add constraint travel_details_safari_slug check (safari_slug is null or safari_slug in ('big-five-etosha','windhoek-city-tour','namibian-highlights','cross-border')),
  add constraint travel_details_package check (
    package_details is null or (
      safari_slug is not null and category = 'itinerary'
      and jsonb_typeof(package_details) = 'object'
      and octet_length(package_details::text) <= 150000
    )
  );
-- One currently published package per catalogue safari; drafts may coexist.
create unique index travel_details_published_package
  on public.travel_details(safari_slug)
  where approved and package_details is not null;
grant insert(safari_slug,package_details), update(safari_slug,package_details)
  on public.travel_details to authenticated;
comment on column public.travel_details.package_details is 'Verified optional package facts. Public clients validate the versioned shape before display; financial data is staff-approved NAD, not availability or a confirmed reservation.';
