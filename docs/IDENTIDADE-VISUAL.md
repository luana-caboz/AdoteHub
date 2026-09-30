# AdoteHub — Identidade visual

> Fonte da verdade da marca no código. Guia visual completo (com exemplos ao vivo):
> https://claude.ai/artifact/KbrZTQuZBR3wRDGxVk8KWK

## Regra de aplicação

| Área | Identidade |
|---|---|
| Site institucional, login (`/entrar`), convite, `/admin`, painel da ONG (`/painel/**`) e qualquer tela nova da plataforma | **AdoteHub completa**: cores, fontes, formas, emblema e logotipo abaixo |
| Catálogo público de cada ONG (`/[slug]/**`: catálogo, página do animal, formulário de adoção, card social) | **Mesma estrutura AdoteHub** (fontes, cantos, cards, pílulas, sombras, layout), mas **cores da ONG**: a cor principal da ONG substitui `verde` e a cor de destaque substitui `coral-forte`. Cabeçalho com logo e nome da ONG; AdoteHub só no rodapé ("Catálogo feito com AdoteHub") |

No painel, o logo da ONG pode aparecer no cabeçalho, mas as cores são as do AdoteHub.

## Princípios

1. **Acolhedor antes de técnico.** Fundo `creme` (nunca branco puro), cantos grandes, sombras suaves.
2. **O animal é o herói.** Foto grande, nome em destaque, informação curta em pílulas.
3. **Duas cores, papéis claros.** `verde` organiza (títulos, links, rótulos, foco). `coral-forte` chama para agir (um botão principal por tela). `coral` vivo é só decoração.
4. **A ONG aparece primeiro** no catálogo dela.

## Cores (tema claro)

| Token | Hex | Uso |
|---|---|---|
| `creme` | `#FBF7F1` | Fundo da página |
| `papel` | `#FFFFFF` | Cards, cabeçalho, campos, halo do emblema |
| `linha` | `#E8E1D6` | Filetes e bordas de campos |
| `tinta` | `#1D2B24` | Texto principal |
| `tinta-suave` | `#5E6B63` | Texto secundário (metadados, ajudas) |
| `verde` | `#1F6B4F` | 1ª linha dos títulos, nomes nos cards, links, rótulos de filtro, foco |
| `verde-escuro` | `#164E3A` | Hover de elementos verdes |
| `verde-50` | `#E3F1EA` | Fundo de tags verdes (texto `verde`) |
| `on-verde` | `#FFFFFF` | Texto sobre `verde` |
| `coral` | `#FF7A59` | **Só decorativo** (anel do emblema, pegadas, ilustrações). Nunca texto |
| `coral-forte` | `#C23D17` | Botão principal, 2ª linha dos títulos, texto de tags coral |
| `coral-50` | `#FFEDE7` | Fundo de tags coral |
| `on-coral` | `#FFFFFF` | Texto sobre `coral-forte` |
| `mel` / `mel-50` | `#8A5A00` / `#FFF1D1` | Status "Em processo de adoção" |
| `azul` / `azul-50` | `#1F4E8C` / `#E4EEFB` | Status "Adotado" |
| `cinza` / `cinza-50` | `#4A564F` / `#EEF0EF` | Status "Indisponível"/"Arquivado", desabilitado |
| `erro` / `erro-50` | `#B42318` / `#FDECEA` | Erros de formulário (sempre com texto) |
| `foco` | `#1F6B4F` | Anel de foco: 3px sólido, 2px de afastamento, em todo controle |

Todos os pares de texto acima passam 4.5:1. Modo escuro está definido no guia visual, mas **não é prioridade na v1**.

Status do animal: Disponível `verde`/`verde-50` · Em processo `mel`/`mel-50` · Adotado `azul`/`azul-50` · Indisponível `cinza`/`cinza-50`. A palavra sempre aparece; a cor só reforça.

## Tipografia (Google Fonts, via `next/font/google`)

- **Bricolage Grotesque** 700–800 → títulos. Letter-spacing negativo, entrelinha curta. Nunca em texto corrido nem abaixo de 20px.
- **Figtree** 400–800 → todo o resto.

| Estilo | Fonte | Tamanho / entrelinha | Peso | Extra |
|---|---|---|---|---|
| `display-xl` | Bricolage | 64px / 1.0 (44px no celular) | 800 | -0.03em; 2 linhas: 1ª `verde`, 2ª `coral-forte` |
| `display-l` | Bricolage | 44px / 1.05 | 800 | -0.025em; título de página |
| `titulo` | Bricolage | 28px / 1.15 | 800 | -0.02em |
| `titulo-card` | Bricolage | 22px / 1.2 | 800 | -0.015em; nome do animal no card, em `verde` |
| `lead` | Figtree | 18px / 1.55 | 400 | `tinta-suave`, até ~60 caracteres/linha |
| `corpo` | Figtree | 16px / 1.55 | 400 | |
| `corpo-p` | Figtree | 14px / 1.5 | 500 | metadados, `tinta-suave` |
| `botao` | Figtree | 16px / 1.2 | 700 | |
| `tag` | Figtree | 12px / 1.3 | 700 | |
| `rotulo` | Figtree | 11px / 1.3 | 800 | CAIXA-ALTA, +0.12em; rótulos de filtro em `verde` ou `coral-forte` |

## Formas, espaço, sombra

- Raios: `radius-sm` 10px (miniaturas) · `radius-md` 16px (botões, campos) · `radius-lg` 24px (cards, blocos) · `radius-pill` 999px (tags, busca, filtros).
- Espaços: 4 · 8 · 12 · 16 · 20 · 24 · 48 · 80px. Grade de cards com 24px de espaço; respiro lateral mínimo 16px no celular; seções a 48px.
- Sombras (profundidade por sombra, não por borda):
  - `shadow-card`: `0 1px 2px rgba(29,43,36,.06), 0 18px 36px -22px rgba(29,43,36,.30)`
  - `shadow-cta` (só botão principal): `0 12px 24px -12px rgba(194,61,23,.55)`
  - `shadow-emblema`: `0 28px 56px -28px rgba(29,43,36,.40)`
- Celular primeiro. Grade de animais: 2 colunas no celular, 4 no desktop.

## Componentes

- **Botão principal**: fundo `coral-forte`, texto branco, `radius-md`, padding 14×26, `shadow-cta`, Figtree 700. **Um por tela.**
- **Botão secundário**: fundo `papel`, borda 2px e texto `verde`; hover `verde-50`.
- **Botão verde**: fundo `verde`, texto branco; hover `verde-escuro` (ações do painel).
- **Link de ação**: Figtree 700 `verde`, com "→" no fim ("Conhecer Rex →").
- **Tag**: pílula, padding 5×12, `tag`. Sexo em verde; porte/idade em coral; status nas cores de status.
- **Card de animal**: `papel`, `radius-lg`, `shadow-card`, sem borda, o card inteiro é link, sobe 3px no hover. Foto 4:5 no topo; corpo com padding 20px: nome (`titulo-card` verde), até 3 tags, metadados (`corpo-p`), link "Conhecer {nome} →". Status ≠ Disponível vira selo sobre a foto. Sem foto: bloco `verde-50` com pegada `coral`.
- **Cabeçalho**: fundo `papel`, filete `linha` embaixo; emblema 48px + logotipo "Adote" (`verde`) + "Hub" (`coral-forte`) em Bricolage 800, 28px, -0.03em, sem espaço.
- **Hero**: grid 2 colunas; título `display-xl` em duas cores; `lead`; um botão principal; à direita o emblema grande (84%) dentro de um círculo `papel` de 300px com `shadow-emblema`. No celular o halo vai para cima e vira 200px.
- **Busca e filtros**: pílulas `papel` com borda `linha`, altura 52px. Busca com lupa em traço `verde`. Filtros com rótulo `rotulo` acima do valor, alternando `verde` e `coral-forte`.
- **Campos**: rótulo Figtree 700 14px acima; campo `papel`, borda 1.5px `linha`, `radius-md`, padding 12×16; foco com anel `foco` e borda `verde`. Escolhas curtas como botões de opção (marcado: `verde-50` + borda `verde`). Erro: borda `erro` + frase que diz como corrigir.

## Logo

- Emblema: `public/brand/adotehub-emblema.svg` (disco verde, anel coral, casa branca com pegada coral). Não recolorir nem distorcer; mínimo 24px; respiro de 1/4 do diâmetro. Também é o favicon.
- Logotipo: composto em texto (ainda não vetorizado), como descrito no cabeçalho.

## Voz

- Fale com "você", frases curtas, português do Brasil, sem jargão ("endereço da ONG", não "slug").
- Botões dizem o que acontece: "Quero adotar Rex", "Enviar candidatura", "Cadastrar animal".
- Erros explicam como corrigir. Sem emoji decorativo. Caixa-alta só nos rótulos pequenos.

## Ícones

Sem conjunto próprio ainda: traço arredondado de 2–2.4px, pontas redondas, 18–24px, em `verde` ou `tinta-suave`.
