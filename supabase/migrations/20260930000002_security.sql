create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(
  p_org uuid,
  p_min public.member_role default 'member'
)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and m.role >= p_min
  );
$$;

create or replace function public.org_is_active(p_org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.organizations where id = p_org and archived_at is null
  );
$$;

create or replace function public.animal_is_public(p_animal uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.animals a
    join public.organizations o on o.id = a.organization_id
    where a.id = p_animal
      and a.archived_at is null
      and a.status in ('available', 'reserved')
      and o.archived_at is null
  );
$$;

alter table public.platform_admins enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_invites enable row level security;
alter table public.animals enable row level security;
alter table public.animal_photos enable row level security;
alter table public.animal_events enable row level security;
alter table public.persons enable row level security;
alter table public.adopter_profiles enable row level security;
alter table public.applications enable row level security;
alter table public.import_mappings enable row level security;
alter table public.import_runs enable row level security;

create policy "admin vê a si mesmo"
  on public.platform_admins for select to authenticated
  using (user_id = (select auth.uid()));

create policy "catálogo público vê ONGs ativas; membros e admin veem sempre"
  on public.organizations for select to anon, authenticated
  using (
    archived_at is null
    or public.has_org_role(id)
    or public.is_platform_admin()
  );

create policy "admin da plataforma cria ONG"
  on public.organizations for insert to authenticated
  with check (public.is_platform_admin());

create policy "admin da ONG ou da plataforma edita"
  on public.organizations for update to authenticated
  using (public.has_org_role(id, 'admin') or public.is_platform_admin())
  with check (public.has_org_role(id, 'admin') or public.is_platform_admin());

revoke update on public.organizations from anon, authenticated;
grant update (
  name, logo_path, primary_color, secondary_color, city, state,
  contact_email, whatsapp, instagram, adoption_extra_questions
) on public.organizations to authenticated;
revoke delete on public.organizations from anon, authenticated;

create policy "membros veem a equipe"
  on public.organization_members for select to authenticated
  using (public.has_org_role(organization_id) or public.is_platform_admin());

create policy "admin da plataforma adiciona membro"
  on public.organization_members for insert to authenticated
  with check (public.is_platform_admin());

create policy "responsável muda papéis"
  on public.organization_members for update to authenticated
  using (public.has_org_role(organization_id, 'owner') or public.is_platform_admin())
  with check (public.has_org_role(organization_id, 'owner') or public.is_platform_admin());

create policy "admin remove membros (exceto responsável); membro sai"
  on public.organization_members for delete to authenticated
  using (
    public.is_platform_admin()
    or (role <> 'owner' and public.has_org_role(organization_id, 'admin'))
    or (role <> 'owner' and user_id = (select auth.uid()))
  );

create policy "admins veem convites"
  on public.organization_invites for select to authenticated
  using (public.has_org_role(organization_id, 'admin') or public.is_platform_admin());

create policy "admins convidam (só a plataforma convida responsável)"
  on public.organization_invites for insert to authenticated
  with check (
    public.is_platform_admin()
    or (role <> 'owner' and public.has_org_role(organization_id, 'admin'))
  );

create policy "admins revogam convites"
  on public.organization_invites for update to authenticated
  using (public.has_org_role(organization_id, 'admin') or public.is_platform_admin())
  with check (public.has_org_role(organization_id, 'admin') or public.is_platform_admin());

revoke update on public.organization_invites from anon, authenticated;
grant update (revoked_at) on public.organization_invites to authenticated;
revoke delete on public.organization_invites from anon, authenticated;

create policy "catálogo público vê disponíveis; membros veem todos"
  on public.animals for select to anon, authenticated
  using (
    (
      archived_at is null
      and status in ('available', 'reserved')
      and public.org_is_active(organization_id)
    )
    or public.has_org_role(organization_id)
  );

create policy "membros cadastram"
  on public.animals for insert to authenticated
  with check (public.has_org_role(organization_id));

create policy "membros editam"
  on public.animals for update to authenticated
  using (public.has_org_role(organization_id))
  with check (public.has_org_role(organization_id));

revoke delete on public.animals from anon, authenticated;

create policy "fotos públicas de animais públicos; membros veem todas"
  on public.animal_photos for select to anon, authenticated
  using (public.animal_is_public(animal_id) or public.has_org_role(organization_id));

create policy "membros enviam fotos"
  on public.animal_photos for insert to authenticated
  with check (public.has_org_role(organization_id));

create policy "membros reordenam fotos"
  on public.animal_photos for update to authenticated
  using (public.has_org_role(organization_id))
  with check (public.has_org_role(organization_id));

create policy "membros removem fotos"
  on public.animal_photos for delete to authenticated
  using (public.has_org_role(organization_id));

create policy "membros veem histórico"
  on public.animal_events for select to authenticated
  using (public.has_org_role(organization_id));

create policy "membros registram eventos"
  on public.animal_events for insert to authenticated
  with check (public.has_org_role(organization_id));

revoke update, delete on public.animal_events from anon, authenticated;

create policy "ONG vê candidatos que recebeu"
  on public.persons for select to authenticated
  using (
    exists (
      select 1 from public.applications ap
      where ap.person_id = persons.id
        and public.has_org_role(ap.organization_id)
    )
  );

revoke insert, update, delete on public.persons from anon, authenticated;
revoke all on public.adopter_profiles from anon, authenticated;

create policy "membros veem candidaturas da ONG"
  on public.applications for select to authenticated
  using (public.has_org_role(organization_id));

create policy "membros atualizam status e notas"
  on public.applications for update to authenticated
  using (public.has_org_role(organization_id))
  with check (public.has_org_role(organization_id));

revoke insert, update, delete on public.applications from anon, authenticated;
grant update (status, internal_notes, archived_at) on public.applications to authenticated;

create policy "membros gerenciam mapeamentos"
  on public.import_mappings for all to authenticated
  using (public.has_org_role(organization_id))
  with check (public.has_org_role(organization_id));

create policy "membros veem importações"
  on public.import_runs for select to authenticated
  using (public.has_org_role(organization_id));

create policy "membros registram importações"
  on public.import_runs for insert to authenticated
  with check (public.has_org_role(organization_id));

create or replace function public.admin_create_organization(
  p_name text,
  p_slug text,
  p_owner_email text,
  p_city text default null,
  p_state text default null
)
returns table (organization_id uuid, invite_token uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_token uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  insert into public.organizations (name, slug, city, state)
  values (trim(p_name), lower(trim(p_slug)), nullif(trim(p_city), ''), nullif(upper(trim(p_state)), ''))
  returning id into v_org;

  insert into public.organization_invites (organization_id, email, role, invited_by)
  values (v_org, lower(trim(p_owner_email)), 'owner', auth.uid())
  returning token into v_token;

  return query select v_org, v_token;
end;
$$;

create or replace function public.admin_update_organization(
  p_org uuid,
  p_slug text default null,
  p_max_photos int default null,
  p_archived boolean default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Acesso negado' using errcode = '42501';
  end if;

  update public.organizations set
    slug = coalesce(lower(trim(p_slug)), slug),
    max_photos_per_animal = coalesce(p_max_photos, max_photos_per_animal),
    archived_at = case
      when p_archived is null then archived_at
      when p_archived then coalesce(archived_at, now())
      else null
    end
  where id = p_org;
end;
$$;

create or replace function public.get_invite(p_token uuid)
returns table (
  organization_name text,
  organization_slug text,
  email text,
  role public.member_role,
  state text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.name,
    o.slug,
    i.email,
    i.role,
    case
      when i.revoked_at is not null then 'revoked'
      when i.accepted_at is not null then 'accepted'
      when i.expires_at < now() then 'expired'
      else 'pending'
    end
  from public.organization_invites i
  join public.organizations o on o.id = i.organization_id
  where i.token = p_token;
$$;

create or replace function public.accept_invite(p_token uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.organization_invites;
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_slug text;
begin
  if auth.uid() is null then
    raise exception 'Faça login para aceitar o convite' using errcode = '42501';
  end if;

  select * into v_invite
  from public.organization_invites
  where token = p_token
  for update;

  if not found or v_invite.revoked_at is not null then
    raise exception 'Convite inválido' using errcode = 'P0001';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'Convite já utilizado' using errcode = 'P0001';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'Convite expirado' using errcode = 'P0001';
  end if;
  if v_invite.email <> v_email then
    raise exception 'Este convite foi enviado para outro e-mail' using errcode = 'P0001';
  end if;

  insert into public.organization_members (organization_id, user_id, role)
  values (v_invite.organization_id, auth.uid(), v_invite.role)
  on conflict (organization_id, user_id)
  do update set role = greatest(public.organization_members.role, excluded.role);

  update public.organization_invites
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_invite.id;

  select slug into v_slug from public.organizations where id = v_invite.organization_id;
  return v_slug;
end;
$$;

create or replace function public.submit_application(
  p_org_slug text,
  p_animal_code text,
  p_person jsonb,
  p_profile jsonb,
  p_extra jsonb,
  p_consent_org boolean,
  p_consent_matching boolean,
  p_consent_version text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_org uuid;
  v_animal uuid;
  v_person uuid;
  v_email text := lower(trim(coalesce(p_person ->> 'email', '')));
  v_name text := trim(coalesce(p_person ->> 'name', ''));
  v_existing uuid;
  v_recent int;
  v_app uuid;
begin
  if p_consent_org is not true then
    raise exception 'É preciso aceitar o uso dos dados pela ONG' using errcode = 'P0001';
  end if;
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'E-mail inválido' using errcode = 'P0001';
  end if;
  if char_length(v_name) < 2 then
    raise exception 'Nome inválido' using errcode = 'P0001';
  end if;

  select o.id, a.id into v_org, v_animal
  from public.organizations o
  join public.animals a on a.organization_id = o.id
  where o.slug = p_org_slug
    and o.archived_at is null
    and a.code = p_animal_code
    and a.archived_at is null
    and a.status in ('available', 'reserved');

  if v_animal is null then
    raise exception 'Animal indisponível para adoção' using errcode = 'P0001';
  end if;

  insert into public.persons (email, name, phone, city, state)
  values (
    v_email,
    v_name,
    nullif(trim(p_person ->> 'phone'), ''),
    nullif(trim(p_person ->> 'city'), ''),
    nullif(upper(trim(p_person ->> 'state')), '')
  )
  on conflict (email) do update set
    phone = coalesce(public.persons.phone, excluded.phone),
    city = coalesce(public.persons.city, excluded.city),
    state = coalesce(public.persons.state, excluded.state)
  returning id into v_person;

  select count(*) into v_recent
  from public.applications
  where person_id = v_person and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Muitas candidaturas em pouco tempo. Tente mais tarde.' using errcode = 'P0001';
  end if;

  select id into v_existing
  from public.applications
  where person_id = v_person
    and animal_id = v_animal
    and status in ('new', 'in_review')
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.applications (
    organization_id, animal_id, person_id, answers,
    consent_org, consent_matching, consent_version
  )
  values (
    v_org, v_animal, v_person,
    jsonb_build_object(
      'person', p_person,
      'profile', coalesce(p_profile, '{}'::jsonb),
      'extra', coalesce(p_extra, '{}'::jsonb)
    ),
    true, coalesce(p_consent_matching, false), p_consent_version
  )
  returning id into v_app;

  if p_consent_matching then
    insert into public.adopter_profiles (
      person_id, housing_type, housing_ownership, has_yard, has_window_screens,
      other_animals, has_children, children_ages, hours_alone, data, consent_matching_at
    )
    values (
      v_person,
      p_profile ->> 'housing_type',
      p_profile ->> 'housing_ownership',
      (p_profile ->> 'has_yard')::boolean,
      p_profile ->> 'has_window_screens',
      p_profile ->> 'other_animals',
      (p_profile ->> 'has_children')::boolean,
      p_profile ->> 'children_ages',
      p_profile ->> 'hours_alone',
      coalesce(p_profile, '{}'::jsonb),
      now()
    )
    on conflict (person_id) do update set
      housing_type = excluded.housing_type,
      housing_ownership = excluded.housing_ownership,
      has_yard = excluded.has_yard,
      has_window_screens = excluded.has_window_screens,
      other_animals = excluded.other_animals,
      has_children = excluded.has_children,
      children_ages = excluded.children_ages,
      hours_alone = excluded.hours_alone,
      data = excluded.data,
      consent_matching_at = now(),
      updated_at = now();
  end if;

  return v_app;
end;
$$;

create or replace function public.list_org_members(p_org uuid)
returns table (user_id uuid, email text, role public.member_role, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, u.email::text, m.role, m.created_at
  from public.organization_members m
  join auth.users u on u.id = m.user_id
  where m.organization_id = p_org
    and (public.has_org_role(p_org) or public.is_platform_admin())
  order by m.role desc, m.created_at;
$$;

revoke execute on function public.admin_create_organization(text, text, text, text, text) from public, anon;
revoke execute on function public.admin_update_organization(uuid, text, int, boolean) from public, anon;
revoke execute on function public.accept_invite(uuid) from public, anon;
revoke execute on function public.list_org_members(uuid) from public, anon;
grant execute on function public.list_org_members(uuid) to authenticated;
grant execute on function public.admin_create_organization(text, text, text, text, text) to authenticated;
grant execute on function public.admin_update_organization(uuid, text, int, boolean) to authenticated;
grant execute on function public.accept_invite(uuid) to authenticated;
grant execute on function public.get_invite(uuid) to anon, authenticated;
grant execute on function public.submit_application(text, text, jsonb, jsonb, jsonb, boolean, boolean, text) to anon, authenticated;
