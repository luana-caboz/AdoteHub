create type public.org_type as enum ('ong', 'individual');
create type public.member_role as enum ('member', 'admin', 'owner');
create type public.animal_species as enum ('dog', 'cat', 'other');
create type public.animal_sex as enum ('male', 'female', 'unknown');
create type public.animal_size as enum ('small', 'medium', 'large');
create type public.animal_age_group as enum ('puppy', 'young', 'adult', 'senior');
create type public.animal_status as enum ('available', 'reserved', 'adopted', 'unavailable');
create type public.animal_source as enum ('manual', 'import');
create type public.application_status as enum ('new', 'in_review', 'approved', 'rejected', 'withdrawn');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  type public.org_type not null default 'ong',
  name text not null check (char_length(name) between 2 and 120),
  slug text not null unique
    check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  logo_path text,
  primary_color text not null default '#7c3aed' check (primary_color ~ '^#[0-9a-fA-F]{6}$'),
  secondary_color text not null default '#f59e0b' check (secondary_color ~ '^#[0-9a-fA-F]{6}$'),
  city text,
  state text check (state is null or state ~ '^[A-Z]{2}$'),
  contact_email text,
  whatsapp text,
  instagram text,
  max_photos_per_animal int not null default 8 check (max_photos_per_animal between 1 and 20),
  adoption_extra_questions jsonb not null default '[]'::jsonb
    check (jsonb_typeof(adoption_extra_questions) = 'array'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create index organization_members_user_idx on public.organization_members (user_id);

create table public.organization_invites (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  email text not null check (email = lower(email) and email like '%@%'),
  role public.member_role not null default 'member',
  token uuid not null unique default gen_random_uuid(),
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '14 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create index organization_invites_org_idx on public.organization_invites (organization_id);

create table public.animals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  code text not null default substr(replace(gen_random_uuid()::text, '-', ''), 1, 8),
  name text not null check (char_length(name) between 1 and 80),
  species public.animal_species not null default 'dog',
  sex public.animal_sex not null default 'unknown',
  size public.animal_size,
  age_group public.animal_age_group,
  birth_date_estimate date,
  breed text,
  color text,
  description text,
  neutered boolean,
  vaccinated boolean,
  dewormed boolean,
  special_needs text,
  good_with_kids boolean,
  good_with_dogs boolean,
  good_with_cats boolean,
  status public.animal_status not null default 'available',
  cover_photo_id uuid,
  external_id text not null
    check (external_id = btrim(external_id) and char_length(external_id) between 1 and 40),
  source public.animal_source not null default 'manual',
  created_by uuid references auth.users (id) on delete set null,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, code),
  constraint animals_org_external_id_key unique (organization_id, external_id)
);

create index animals_catalog_idx
  on public.animals (organization_id, status, species)
  where archived_at is null;

create trigger animals_updated_at
  before update on public.animals
  for each row execute function public.set_updated_at();

create table public.animal_photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  storage_path text not null,
  thumb_path text not null,
  width int,
  height int,
  size_bytes int,
  position int not null default 0,
  created_at timestamptz not null default now()
);

create index animal_photos_animal_idx on public.animal_photos (animal_id, position);

alter table public.animals
  add constraint animals_cover_photo_fk
  foreign key (cover_photo_id) references public.animal_photos (id) on delete set null;

create or replace function public.check_animal_photo()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_limit int;
  v_count int;
begin
  select a.organization_id, o.max_photos_per_animal
    into v_org, v_limit
  from public.animals a
  join public.organizations o on o.id = a.organization_id
  where a.id = new.animal_id;

  if v_org is null or v_org <> new.organization_id then
    raise exception 'Foto e animal pertencem a organizações diferentes';
  end if;

  select count(*) into v_count from public.animal_photos where animal_id = new.animal_id;
  if v_count >= v_limit then
    raise exception 'Limite de % fotos por animal atingido', v_limit
      using errcode = 'P0001', hint = 'photo_limit';
  end if;

  return new;
end;
$$;

create trigger animal_photos_check
  before insert on public.animal_photos
  for each row execute function public.check_animal_photo();

create table public.animal_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index animal_events_animal_idx on public.animal_events (animal_id, created_at desc);
create index animal_events_org_idx on public.animal_events (organization_id, created_at desc);

create or replace function public.log_animal_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.animal_events (organization_id, animal_id, type, payload, actor_id)
    values (new.organization_id, new.id, 'created',
            jsonb_build_object('source', new.source, 'status', new.status), auth.uid());
    return new;
  end if;

  if new.status is distinct from old.status then
    insert into public.animal_events (organization_id, animal_id, type, payload, actor_id)
    values (new.organization_id, new.id, 'status_changed',
            jsonb_build_object('from', old.status, 'to', new.status), auth.uid());
  end if;

  if new.archived_at is not null and old.archived_at is null then
    insert into public.animal_events (organization_id, animal_id, type, actor_id)
    values (new.organization_id, new.id, 'archived', auth.uid());
  elsif new.archived_at is null and old.archived_at is not null then
    insert into public.animal_events (organization_id, animal_id, type, actor_id)
    values (new.organization_id, new.id, 'unarchived', auth.uid());
  end if;

  return new;
end;
$$;

create trigger animals_log_changes
  after insert or update on public.animals
  for each row execute function public.log_animal_changes();

create table public.persons (
  id uuid primary key default gen_random_uuid(),
  email text not null unique check (email = lower(email) and email like '%@%'),
  name text not null,
  phone text,
  city text,
  state text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index persons_phone_idx on public.persons (phone);

create trigger persons_updated_at
  before update on public.persons
  for each row execute function public.set_updated_at();

create table public.adopter_profiles (
  person_id uuid primary key references public.persons (id) on delete cascade,
  housing_type text,
  housing_ownership text,
  has_yard boolean,
  has_window_screens text,
  other_animals text,
  has_children boolean,
  children_ages text,
  hours_alone text,
  data jsonb not null default '{}'::jsonb,
  consent_matching_at timestamptz,
  updated_at timestamptz not null default now()
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  animal_id uuid not null references public.animals (id) on delete cascade,
  person_id uuid not null references public.persons (id) on delete restrict,
  status public.application_status not null default 'new',
  answers jsonb not null,
  consent_org boolean not null check (consent_org),
  consent_matching boolean not null default false,
  consent_version text not null,
  internal_notes text,
  status_changed_at timestamptz not null default now(),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index applications_inbox_idx on public.applications (organization_id, status, created_at desc);
create index applications_person_idx on public.applications (person_id);
create index applications_animal_idx on public.applications (animal_id);

create trigger applications_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

create or replace function public.log_application_changes()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.animal_events (organization_id, animal_id, type, payload)
    values (new.organization_id, new.animal_id, 'application_received',
            jsonb_build_object('application_id', new.id));
  elsif new.status is distinct from old.status then
    new.status_changed_at = now();
    insert into public.animal_events (organization_id, animal_id, type, payload, actor_id)
    values (new.organization_id, new.animal_id, 'application_status_changed',
            jsonb_build_object('application_id', new.id, 'from', old.status, 'to', new.status),
            auth.uid());
  end if;
  return new;
end;
$$;

create trigger applications_log_insert
  after insert on public.applications
  for each row execute function public.log_application_changes();

create trigger applications_log_update
  before update on public.applications
  for each row execute function public.log_application_changes();

create table public.import_mappings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null default 'Planilha principal',
  column_map jsonb not null default '{}'::jsonb,
  value_map jsonb not null default '{}'::jsonb,
  sheet_url text,
  updated_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, name)
);

create trigger import_mappings_updated_at
  before update on public.import_mappings
  for each row execute function public.set_updated_at();

create table public.import_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  mapping_id uuid references public.import_mappings (id) on delete set null,
  kind text not null default 'file' check (kind in ('file', 'sync')),
  file_name text,
  total_rows int not null default 0,
  created_count int not null default 0,
  updated_count int not null default 0,
  failed_count int not null default 0,
  errors jsonb not null default '[]'::jsonb,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index import_runs_org_idx on public.import_runs (organization_id, created_at desc);
