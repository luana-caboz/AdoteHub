\set ON_ERROR_STOP on
\o /dev/null

create schema tests;
grant usage on schema tests to anon, authenticated;
create table tests.kv (k text primary key, v text);
grant all on tests.kv to anon, authenticated;

create function tests.login(p_email text) returns void language plpgsql as $$
declare v_id uuid;
begin
  select id into v_id from auth.users where email = p_email;
  perform set_config('request.jwt.claims',
    json_build_object('sub', v_id, 'email', p_email, 'role', 'authenticated')::text, false);
end $$;
create function tests.logout() returns void language sql as $$
  select set_config('request.jwt.claims', '{"role":"anon"}', false);
$$;
create function tests.get(p_k text) returns text language sql as $$ select v from tests.kv where k = p_k $$;
grant execute on all functions in schema tests to anon, authenticated;

insert into auth.users (email) values
  ('admin@adotehub.test'), ('ana@ong1.test'), ('bia@ong1.test'),
  ('carla@ong2.test'), ('intrusa@x.test');
insert into public.platform_admins (user_id)
  select id from auth.users where email = 'admin@adotehub.test';

\echo '1. Admin da plataforma cria ONGs + convite da responsável'
select tests.login('admin@adotehub.test'); set role authenticated;
insert into tests.kv select 'ong1_token', invite_token::text
  from public.admin_create_organization('Vira Lata Club', 'viralataclub', 'Ana@ONG1.test', 'Curitiba', 'pr');
insert into tests.kv select 'ong2_token', invite_token::text
  from public.admin_create_organization('Patas do Sul', 'patasdosul', 'carla@ong2.test');
do $$ begin
  assert (select count(*) from public.organizations) = 2, 'admin deveria ver 2 ONGs';
  assert (select state from public.organizations where slug = 'viralataclub') = 'PR', 'UF normalizada';
end $$;

reset role; select tests.login('ana@ong1.test'); set role authenticated;
do $$ begin
  begin
    perform public.admin_create_organization('X', 'xyz', 'a@b.c');
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;

\echo '2. Convites: e-mail precisa bater; responsável convida equipe'
reset role; select tests.login('intrusa@x.test'); set role authenticated;
do $$ begin
  begin
    perform public.accept_invite(tests.get('ong1_token')::uuid);
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;

reset role; select tests.login('ana@ong1.test'); set role authenticated;
do $$ begin
  assert public.accept_invite(tests.get('ong1_token')::uuid) = 'viralataclub', 'aceite devolve slug';
  assert (select role from public.organization_members) = 'owner', 'Ana é responsável';
end $$;
do $$ begin
  begin
    perform public.accept_invite(tests.get('ong1_token')::uuid);
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;
do $$ begin
  begin
    insert into public.organization_invites (organization_id, email, role)
    select id, 'x@x.test', 'owner' from public.organizations where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;
insert into public.organization_invites (organization_id, email, role)
  select id, 'bia@ong1.test', 'member' from public.organizations where slug = 'viralataclub';
insert into tests.kv select 'bia_token', token::text from public.organization_invites where email = 'bia@ong1.test';

do $$ begin
  begin
    update public.organizations set slug = 'outro' where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;
update public.organizations set primary_color = '#112233' where slug = 'viralataclub';

reset role; select tests.login('bia@ong1.test'); set role authenticated;
select public.accept_invite(tests.get('bia_token')::uuid);

reset role; select tests.login('carla@ong2.test'); set role authenticated;
select public.accept_invite(tests.get('ong2_token')::uuid);
do $$ begin
  assert (select count(*) from public.list_org_members(
    (select id from public.organizations where slug = 'viralataclub'))) = 0, 'outra ONG não lista equipe alheia';
  assert (select email from public.list_org_members(
    (select id from public.organizations where slug = 'patasdosul'))) = 'carla@ong2.test', 'lista a própria equipe';
end $$;

\echo '3. Animais: membros cadastram; sem delete; isolamento entre ONGs'
reset role; select tests.login('bia@ong1.test'); set role authenticated;
insert into public.animals (organization_id, external_id, name, species, sex)
  select id, '001', 'Rex', 'dog', 'male' from public.organizations where slug = 'viralataclub';
insert into public.animals (organization_id, external_id, name, species, sex, status)
  select id, '002', 'Mimi', 'cat', 'female', 'adopted' from public.organizations where slug = 'viralataclub';
insert into tests.kv select 'rex_code', code from public.animals where name = 'Rex';
insert into tests.kv select 'rex_id', id::text from public.animals where name = 'Rex';
do $$ begin
  assert (select count(*) from public.animals) = 2, 'membro vê todos os animais da ONG';
  begin
    insert into public.animals (organization_id, name)
      select id, 'Sem ID' from public.organizations where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
  begin
    insert into public.animals (organization_id, external_id, name)
      select id, '001', 'Outro' from public.organizations where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
  begin
    insert into public.animals (organization_id, external_id, name)
      select id, ' 003 ', 'Espaços' from public.organizations where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
  begin
    delete from public.animals where name = 'Rex';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;

reset role; select tests.login('carla@ong2.test'); set role authenticated;
do $$ begin
  assert (select count(*) from public.animals where organization_id =
    (select id from public.organizations where slug = 'viralataclub')) = 1, 'outra ONG só vê o público (Rex)';
  begin
    insert into public.animals (organization_id, external_id, name)
      select id, '999', 'Invasor' from public.organizations where slug = 'viralataclub';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;
update public.animals set name = 'Hackeado' where name = 'Rex';
insert into public.animals (organization_id, external_id, name, status)
  select id, '001', 'Rex', 'unavailable' from public.organizations where slug = 'patasdosul';

reset role; select tests.logout(); set role anon;
do $$ begin
  assert (select count(*) from public.animals) = 1, 'anônimo vê só disponíveis';
  assert (select name from public.animals) = 'Rex', 'outra ONG não conseguiu editar';
  assert (select count(*) from public.organizations) = 2, 'anônimo vê ONGs ativas';
end $$;

\echo '4. Fotos: limite por animal e isolamento no Storage'
reset role; select tests.login('admin@adotehub.test'); set role authenticated;
select public.admin_update_organization(id, p_max_photos => 2)
  from public.organizations where slug = 'viralataclub';

reset role; select tests.login('bia@ong1.test'); set role authenticated;
insert into public.animal_photos (organization_id, animal_id, storage_path, thumb_path, position)
  select organization_id, id, 'a.jpg', 'a-t.jpg', 0 from public.animals where name = 'Rex';
insert into public.animal_photos (organization_id, animal_id, storage_path, thumb_path, position)
  select organization_id, id, 'b.jpg', 'b-t.jpg', 1 from public.animals where name = 'Rex';
do $$ begin
  begin
    insert into public.animal_photos (organization_id, animal_id, storage_path, thumb_path, position)
      select organization_id, id, 'c.jpg', 'c-t.jpg', 2 from public.animals where name = 'Rex';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;

reset role;
insert into storage.buckets (id, name, public) values ('org-media', 'org-media', true) on conflict do nothing;
select tests.login('bia@ong1.test'); set role authenticated;
insert into storage.objects (bucket_id, name)
  select 'org-media', id::text || '/animals/x.jpg' from public.organizations where slug = 'viralataclub';
do $$ begin
  begin
    insert into storage.objects (bucket_id, name)
      select 'org-media', id::text || '/animals/x.jpg' from public.organizations where slug = 'patasdosul';
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;

\echo '5. Candidaturas: envio anônimo, deduplicação, acesso só da ONG'
reset role; select tests.logout(); set role anon;
insert into tests.kv select 'app1', public.submit_application(
  'viralataclub', tests.get('rex_code'),
  '{"name":"Joana","email":"Joana@Mail.test","phone":"41999990000","city":"Curitiba","state":"PR"}',
  '{"housing_type":"apartment","has_yard":false,"has_children":true}',
  '{"q1":"Sim"}', true, true, 'v1')::text;
do $$ begin
  assert public.submit_application(
    'viralataclub', tests.get('rex_code'), '{"name":"Joana","email":"joana@mail.test"}',
    '{}', '{}', true, false, 'v1')::text = tests.get('app1'), 'candidatura duplicada devolve a mesma';
  begin
    perform public.submit_application('viralataclub', tests.get('rex_code'),
      '{"name":"Zé","email":"ze@mail.test"}', '{}', '{}', false, false, 'v1');
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
  begin
    perform public.submit_application('viralataclub', 'naoexiste',
      '{"name":"Zé","email":"ze@mail.test"}', '{}', '{}', true, false, 'v1');
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
  assert (select count(*) from public.applications) = 0, 'anônimo não lê candidaturas';
end $$;

reset role; select tests.login('carla@ong2.test'); set role authenticated;
do $$ begin
  assert (select count(*) from public.applications) = 0, 'outra ONG não vê';
  assert (select count(*) from public.persons) = 0, 'outra ONG não vê a pessoa';
end $$;

reset role; select tests.login('admin@adotehub.test'); set role authenticated;
do $$ begin
  assert (select count(*) from public.applications) = 0, 'admin da plataforma não lê candidaturas';
end $$;

reset role; select tests.login('bia@ong1.test'); set role authenticated;
do $$ begin
  assert (select count(*) from public.applications) = 1, 'ONG vê a candidatura';
  assert (select email from public.persons) = 'joana@mail.test', 'ONG vê a pessoa, e-mail normalizado';
  begin
    update public.applications set answers = '{}' where id = tests.get('app1')::uuid;
    raise exception 'SHOULD_FAIL';
  exception when others then if sqlerrm = 'SHOULD_FAIL' then raise; end if; end;
end $$;
update public.applications set status = 'in_review', internal_notes = 'Ligar amanhã'
  where id = tests.get('app1')::uuid;

reset role;
do $$ begin
  assert (select count(*) from public.adopter_profiles) = 1, 'perfil salvo com consentimento 2';
  assert (select housing_type from public.adopter_profiles) = 'apartment', 'perfil estruturado';
end $$;

\echo '6. Histórico (animal_events)'
select tests.login('bia@ong1.test'); set role authenticated;
update public.animals set status = 'reserved' where name = 'Rex';
update public.animals set archived_at = now() where name = 'Mimi';
do $$
declare v text[];
begin
  select array_agg(type order by id) into v from public.animal_events
  where animal_id = tests.get('rex_id')::uuid;
  assert v = array['created', 'application_received', 'application_status_changed', 'status_changed'],
    'eventos do Rex: ' || v::text;
  assert exists (select 1 from public.animal_events where type = 'archived'), 'arquivamento registrado';
  assert (select status_changed_at > created_at from public.applications), 'status_changed_at atualizado';
end $$;

reset role; select tests.logout(); set role anon;
do $$ begin
  assert (select count(*) from public.animal_photos) = 2, 'fotos do Rex (reservado) são públicas';
end $$;

reset role;
\o
\echo 'OK — todos os testes passaram'
