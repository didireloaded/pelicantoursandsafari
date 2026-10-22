-- Enrolled staff must complete their authenticator challenge before accessing this panel.
create function public.can_manage_site() returns boolean language sql stable security definer set search_path = '' as $$
 select auth.uid() is not null and public.is_staff(auth.uid()) and coalesce(auth.jwt()->>'aal','aal1')='aal2'
$$;
revoke all on function public.can_manage_site() from public,anon;
grant execute on function public.can_manage_site() to authenticated;
-- Client-managed content. Drafts never share a readable public row with published data.
create table public.site_content (
 id uuid primary key, kind text not null check(kind in ('package','photo')),
 draft jsonb not null, published jsonb, published_at timestamptz, revision integer not null default 1,
 updated_at timestamptz not null default clock_timestamp(), updated_by uuid not null,
 check(octet_length(draft::text) <= 100000), check(jsonb_typeof(draft)='object')
);
create table public.site_content_history (
 id bigint generated always as identity primary key, content_id uuid not null references public.site_content(id),
 revision integer not null, draft jsonb not null, published jsonb, action text not null,
 changed_at timestamptz not null default clock_timestamp(), changed_by uuid not null,
 unique(content_id,revision)
);
revoke all on public.site_content, public.site_content_history from anon,authenticated;
grant select on public.site_content, public.site_content_history to authenticated;
grant all on public.site_content, public.site_content_history to service_role;
alter table public.site_content enable row level security;
alter table public.site_content_history enable row level security;
create policy content_staff_read on public.site_content for select to authenticated using(public.can_manage_site());
create policy content_history_staff_read on public.site_content_history for select to authenticated using(public.can_manage_site());

create function public.save_site_content(_id uuid, _kind text, _revision integer, _action text, _draft jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_row public.site_content; destination text; v_data jsonb;
begin
 if not public.can_manage_site() then raise exception 'Staff access required'; end if;
 if _kind is null or _kind not in ('package','photo') or _action is null or _action not in ('save','publish','unpublish') then raise exception 'Invalid action'; end if;
 if _revision is null or _revision < 0 or _draft is null or jsonb_typeof(_draft) <> 'object' or octet_length(_draft::text) > 100000 then raise exception 'Invalid content'; end if;
 if _kind = 'package' then
  if coalesce(length(trim(_draft->>'title')),0) not between 1 and 200 or coalesce(length(trim(_draft->>'summary')),0) not between 1 and 400 or coalesce(length(trim(_draft->>'description')),0) not between 1 and 12000 or jsonb_typeof(_draft->'destinations') is distinct from 'array' or jsonb_typeof(_draft->'details') is distinct from 'object' then raise exception 'Check package fields'; end if;
  if jsonb_array_length(_draft->'destinations') not between 1 and 11 then raise exception 'Choose destinations'; end if;
  if (_draft->>'coverPath') is not null and ((_draft->>'coverPath') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' or coalesce(length(trim(_draft->>'coverAlt')),0) not between 1 and 300) then raise exception 'Check cover photo'; end if;
 else
  if coalesce(_draft->>'path','') !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.webp$' or coalesce(length(trim(_draft->>'alt')),0) not between 1 and 300 or coalesce(length(_draft->>'caption'),0) > 600 or coalesce(_draft->>'position','') !~ '^[0-9]{1,4}$' then raise exception 'Check photo fields'; end if;
 end if;
 for destination in select jsonb_array_elements_text(case when _kind='package' then _draft->'destinations' else jsonb_build_array(_draft->>'destination') end) loop
  if destination is null or destination not in ('etosha','sossusvlei-deadvlei','swakopmund-walvis-bay','spitzkoppe','skeleton-coast','kavango-zambezi','windhoek','botswana','chobe','zimbabwe','victoria-falls') then raise exception 'Invalid destination'; end if;
 end loop;
 -- Unique IDs serialize creation and updates. Revision prevents silent lost updates, including retry-after-timeout.
 perform pg_advisory_xact_lock(hashtextextended(_id::text, 45));
 select * into current_row from public.site_content where id=_id for update;
 if found then
  if current_row.revision <> _revision or current_row.kind <> _kind then raise exception 'Content changed; reload'; end if;
 else
  if _revision <> 0 then raise exception 'Content changed; reload'; end if;
 end if;
 -- Uploaded paths must exist; never publish a broken media reference.
 v_data := _draft;
 if coalesce(v_data->>'path',v_data->>'coverPath') is not null and not exists(select 1 from storage.objects where bucket_id='site-media' and name=coalesce(v_data->>'path',v_data->>'coverPath')) then raise exception 'Upload the photo first'; end if;
 insert into public.site_content(id,kind,draft,published,published_at,revision,updated_by)
 values(_id,_kind,_draft,case when _action='publish' then _draft else null end,case when _action='publish' then clock_timestamp() else null end,1,auth.uid())
 on conflict(id) do update set draft=_draft,
 published=case _action when 'publish' then _draft when 'unpublish' then null else site_content.published end,
 published_at=case _action when 'publish' then clock_timestamp() when 'unpublish' then null else site_content.published_at end,
 revision=site_content.revision+1, updated_at=clock_timestamp(),updated_by=auth.uid()
 returning * into current_row;
 insert into public.site_content_history(content_id,revision,draft,published,action,changed_by)
 values(current_row.id,current_row.revision,current_row.draft,current_row.published,_action,auth.uid());
 return to_jsonb(current_row);
end $$;
revoke all on function public.save_site_content(uuid,text,integer,text,jsonb) from public,anon;
grant execute on function public.save_site_content(uuid,text,integer,text,jsonb) to authenticated;

-- Fixed projection: neither unpublished rows nor draft properties can escape to public readers.
create function public.published_site_content(_kind text)
returns table(id uuid,kind text,data jsonb,updated_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select c.id,c.kind,c.published,c.published_at from public.site_content c
 where c.kind=_kind and c.published is not null order by c.updated_at desc
$$;
revoke all on function public.published_site_content(text) from public;
grant execute on function public.published_site_content(text) to anon,authenticated;

-- Provision site-media through Lovable's Storage tool: private, 5 MB limit, image/webp only.
-- Bucket creation is deliberately outside Cloud SQL migrations.
create policy site_media_upload on storage.objects for insert to authenticated with check(bucket_id='site-media' and public.can_manage_site() and name ~ ('^' || auth.uid()::text || '/[0-9a-f-]{36}\.webp$'));
create policy site_media_staff_read on storage.objects for select to authenticated using(bucket_id='site-media' and public.can_manage_site());
create policy site_media_published_read on storage.objects for select to anon,authenticated using(bucket_id='site-media' and exists(
 select 1 from public.published_site_content('photo') p where p.data->>'path'=name
 union all select 1 from public.published_site_content('package') p where p.data->>'coverPath'=name
));
-- No direct content writes or file overwrite/delete. Unpublish preserves recoverable history.
