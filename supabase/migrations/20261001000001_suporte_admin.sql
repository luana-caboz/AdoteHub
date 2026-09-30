create or replace function public.has_org_membership(
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
  select public.has_org_membership(p_org, p_min) or public.is_platform_admin();
$$;

drop policy if exists "membros veem candidaturas da ONG" on public.applications;
create policy "membros veem candidaturas da ONG"
  on public.applications for select to authenticated
  using (public.has_org_membership(organization_id));

drop policy if exists "membros atualizam status e notas" on public.applications;
create policy "membros atualizam status e notas"
  on public.applications for update to authenticated
  using (public.has_org_membership(organization_id))
  with check (public.has_org_membership(organization_id));

drop policy if exists "ONG vê candidatos que recebeu" on public.persons;
create policy "ONG vê candidatos que recebeu"
  on public.persons for select to authenticated
  using (
    exists (
      select 1 from public.applications ap
      where ap.person_id = persons.id
        and public.has_org_membership(ap.organization_id)
    )
  );
