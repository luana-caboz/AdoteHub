# AdoteHub — instruções para o Claude

- Stack: Next.js 15 (App Router) + Supabase + Tailwind v4. Padrão de módulos em `src/modules/<modulo>/` (types, mappers, repository, service, actions).
- Plano do produto e fases: fora do repo (projeto "ONGs"). Roteiro da Fase 1: `docs/ROTEIRO-FASE-1.md`.

## Identidade visual (obrigatório em toda tela)

- Siga `docs/IDENTIDADE-VISUAL.md`. Toda tela da plataforma (site, login, convite, admin, painel) usa a identidade AdoteHub completa.
- O catálogo público das ONGs (`src/app/[slug]/**`) usa a mesma estrutura, fontes e formas, mas troca `verde` pela cor principal da ONG (`--brand`) e `coral-forte` pela cor de destaque (`--brand-2`).
- Use sempre os tokens (classes Tailwind geradas no `@theme` de `src/app/globals.css`); não escreva cores hex soltas nos componentes.
- Um botão principal (coral) por tela. `coral` vivo é só decorativo, nunca texto.

## Regras de dados

- Toda tabela da ONG tem `organization_id`; isolamento na aplicação (`requireOrgContext`) e no banco (RLS).
- Arquivar em vez de apagar. Animal tem ID (`external_id`) obrigatório e único por ONG.
- Nunca use a chave secreta do Supabase em variável `NEXT_PUBLIC_*`.
