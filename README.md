# AdoteHub — Fase 1 (Catálogo)

Catálogo de adoção gratuito para ONGs de proteção animal. Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage).

## O que já vem pronto

| Item da Fase 1 | Onde |
|---|---|
| Tela interna: criar ONG + convite da responsável | `/admin` · `src/app/admin` |
| Responsável convida a equipe (voluntário/admin) | `/painel/<slug>/equipe` |
| Identidade visual: logo, cores, slug | `/painel/<slug>/marca` · cores viram variáveis CSS (`lib/color.ts`) |
| Cadastro manual de animais, com **ID obrigatório e único por ONG** | `/painel/<slug>/animais` |
| Fotos com compressão/redimensionamento no navegador + limite por animal | `components/animals/photo-manager.tsx`, `lib/image/compress.ts`, trigger `check_animal_photo` |
| Importação de planilha com mapeamento de colunas **e valores** salvo por ONG; a coluna de ID é obrigatória e atualiza em vez de duplicar | `/painel/<slug>/importar` · lógica pura e testada em `modules/imports/mapping.ts` |
| Catálogo público com busca, filtros e paginação | `/<slug>` |
| Página do animal, compartilhamento e card social com a marca da ONG | `/<slug>/animais/<nome>-<code>` + `opengraph-image.tsx` |
| Formulário de adoção próprio (núcleo fixo + perguntas extras por ONG, 2 consentimentos LGPD) | `/<slug>/animais/<ref>/adotar` · `modules/applications/form.ts` |
| Caixa de candidaturas com status e notas internas | `/painel/<slug>/candidaturas` |
| Histórico por animal (`animal_events`) e arquivamento em vez de exclusão | triggers no banco |

## Arquitetura

```
src/
  app/                    rotas (App Router)
    admin/                tela interna (só admin da plataforma)
    painel/[slug]/        painel da ONG
    [slug]/               catálogo público da ONG
  modules/                monólito modular (padrão VLC)
    organizations/        types · mappers · repository · service · actions
    animals/
    applications/
    imports/              fields + mapping (puros, testados) · repository · actions
  lib/                    supabase (server/client/public), env, slug, cores, imagem
supabase/
  migrations/             schema, RLS + RPCs, storage
  tests/                  testes de isolamento (RLS) rodando em Postgres puro
```

- **Multi-tenant em duas camadas:** `requireOrgContext()` na aplicação + RLS no Postgres. Toda tabela da ONG tem `organization_id`.
- **Admin da plataforma** gerencia ONGs/convites, mas **não lê candidaturas nem dados de adotantes** (acesso mínimo, LGPD).
- **Catálogo público** usa um cliente anônimo sem cookies → páginas cacheáveis (ISR) e o RLS de `anon` decide o que aparece.
- **Pessoa/adotante** é da plataforma (reconhecida por e-mail). O perfil reutilizável só é gravado com o consentimento 2.
- **Fotos:** o navegador gera JPEG 1600px + miniatura 480px e envia direto ao Supabase Storage (bucket `org-media`, leitura pública, escrita só por membros da ONG dona da pasta).

## Como rodar

### 1. Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (região **South America (São Paulo)**).
2. Aplique as migrations — escolha uma opção:
   - **CLI:** `npx supabase login` → `npx supabase link --project-ref <ref>` → `npx supabase db push`
   - **Manual:** cole no SQL Editor, na ordem, os arquivos de `supabase/migrations/`.
3. **Authentication → URL Configuration**
   - Site URL: `http://localhost:3000` (depois, o domínio de produção)
   - Redirect URLs: `http://localhost:3000/**` e `https://<seu-domínio>/**`
4. **Authentication → Emails → SMTP** — **obrigatório para as ONGs receberem o link de acesso.** O SMTP padrão do Supabase só envia para membros da equipe do projeto. Use o [Resend](https://resend.com) (plano grátis) ou outro SMTP.
5. **Authentication → Emails → Templates** — troque o link em **Magic Link** e **Confirm signup** por:
   ```html
   <a href="{{ .RedirectTo }}&token_hash={{ .TokenHash }}&type=email">Entrar no AdoteHub</a>
   ```
   Assim o link funciona mesmo se a pessoa pedir no computador e abrir o e-mail no celular.

### 2. App

```bash
cp .env.example .env.local   # preencha URL e anon key (Project Settings → API)
npm install
npm run dev
```

### 3. Tornar-se admin da plataforma

Entre em `http://localhost:3000/entrar` com seu e-mail. Depois, no SQL Editor:

```sql
insert into public.platform_admins (user_id)
select id from auth.users where email = 'seu@email.com';
```

Acesse `/admin`, crie a primeira ONG e envie o link de convite para a responsável (WhatsApp ou e-mail).

### 4. Deploy (Vercel)

Importe o repositório na Vercel, configure as 3 variáveis de `.env.example` (com `NEXT_PUBLIC_SITE_URL` = domínio final) e adicione o domínio nas Redirect URLs do Supabase.

## Testes

```bash
npm test          # mapeamento da importação (node:test, sem dependências)
npm run test:db   # migrations + RLS num Postgres local (requer psql/createdb)
npm run typecheck
```

`supabase/tests/rls_test.sql` cobre: criação de ONG só pela plataforma, convite preso ao e-mail, isolamento entre ONGs (animais, fotos, Storage, candidaturas, equipe), sem delete de animais, limite de fotos, envio anônimo e deduplicado de candidaturas, admin da plataforma sem acesso às candidaturas, e o histórico em `animal_events`.

## Tipos do banco

Os repositories recebem linhas sem tipo e os mappers convertem para tipos de domínio. Para tipar o banco: `npm run db:types` e troque `Db` em `src/lib/supabase/types.ts` por `SupabaseClient<Database>`.
