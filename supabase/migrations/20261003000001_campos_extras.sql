-- Campos extras do animal (colunas da planilha que a ONG quer guardar).
-- O código já usa animals.extra e animal_custom_fields, mas nenhuma migration anterior os criava.
alter table public.animals add column if not exists extra jsonb not null default '{}'::jsonb;
alter table public.animals drop constraint if exists animals_extra_is_object;
alter table public.animals add constraint animals_extra_is_object check (jsonb_typeof(extra) = 'object');

create table if not exists public.animal_custom_fields (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  key text not null check (key ~ '^[a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 60),
  is_public boolean not null default false,
  position int not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, key)
);

create index if not exists animal_custom_fields_org_idx
  on public.animal_custom_fields (organization_id, position);

alter table public.animal_custom_fields enable row level security;

-- Catálogo público só enxerga campos marcados como públicos; a equipe vê todos.
create policy "catálogo vê campos públicos; equipe vê todos"
  on public.animal_custom_fields for select to anon, authenticated
  using (
    (is_public and archived_at is null and public.org_is_active(organization_id))
    or public.has_org_role(organization_id)
  );

create policy "equipe cria campos"
  on public.animal_custom_fields for insert to authenticated
  with check (public.has_org_role(organization_id));

create policy "equipe edita campos"
  on public.animal_custom_fields for update to authenticated
  using (public.has_org_role(organization_id))
  with check (public.has_org_role(organization_id));

revoke delete on public.animal_custom_fields from anon, authenticated;
revoke insert, update on public.animal_custom_fields from anon;
