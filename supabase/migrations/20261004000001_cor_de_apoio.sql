-- Terceira cor da marca da ONG (opcional): detalhes pequenos como a tag de idade e os checks de saúde.
-- Sem valor, o catálogo usa a cor principal no lugar.
alter table public.organizations add column if not exists support_color text;
alter table public.organizations drop constraint if exists organizations_support_color_hex;
alter table public.organizations
  add constraint organizations_support_color_hex
  check (support_color is null or support_color ~ '^#[0-9a-fA-F]{6}$');

-- O update de organizations é liberado coluna a coluna (ver migration de segurança).
grant update (support_color) on public.organizations to authenticated;
