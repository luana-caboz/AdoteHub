insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-media', 'org-media', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create or replace function public.storage_org_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when split_part(p_name, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 1)::uuid
    else null
  end;
$$;

create policy "org-media: membros leem a própria pasta"
  on storage.objects for select to authenticated
  using (bucket_id = 'org-media' and public.has_org_role(public.storage_org_id(name)));

create policy "org-media: membros enviam para a própria pasta"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'org-media' and public.has_org_role(public.storage_org_id(name)));

create policy "org-media: membros substituem na própria pasta"
  on storage.objects for update to authenticated
  using (bucket_id = 'org-media' and public.has_org_role(public.storage_org_id(name)))
  with check (bucket_id = 'org-media' and public.has_org_role(public.storage_org_id(name)));

create policy "org-media: membros removem da própria pasta"
  on storage.objects for delete to authenticated
  using (bucket_id = 'org-media' and public.has_org_role(public.storage_org_id(name)));
