-- Home pública: lista de ONGs (opt-in) com contagem de animais disponíveis.
-- `city` já existe desde a migration inicial; o `if not exists` mantém o script seguro.
alter table public.organizations add column if not exists city text;
alter table public.organizations add column if not exists show_on_home boolean not null default false;

-- show_on_home não entra no grant de update da ONG: só a plataforma altera (via função abaixo).

create or replace function public.list_home_orgs()
returns table (
  slug text,
  name text,
  logo_path text,
  city text,
  available_animals_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    o.slug,
    o.name,
    o.logo_path,
    o.city,
    (
      select count(*)
      from public.animals a
      where a.organization_id = o.id
        and a.status = 'available'
        and a.archived_at is null
    ) as available_animals_count
  from public.organizations o
  where o.show_on_home
    and o.archived_at is null
  order by available_animals_count desc, o.name;
$$;

create or replace function public.admin_set_org_home(
  p_org uuid,
  p_show boolean,
  p_city text default null
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
    show_on_home = coalesce(p_show, show_on_home),
    city = nullif(trim(p_city), '')
  where id = p_org;
end;
$$;

revoke execute on function public.list_home_orgs() from public;
revoke execute on function public.admin_set_org_home(uuid, boolean, text) from public, anon;
grant execute on function public.list_home_orgs() to anon, authenticated;
grant execute on function public.admin_set_org_home(uuid, boolean, text) to authenticated;
