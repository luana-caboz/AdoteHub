# AdoteHub — Identidade visual

> Fonte da verdade da marca no código. Guia visual completo (com exemplos ao vivo):
> https://claude.ai/artifact/KbrZTQuZBR3wRDGxVk8KWK

## Regra de aplicação

| Área | Identidade |
|---|---|
| Site institucional, home (`/`), login (`/entrar`), convite, `/admin`, painel da ONG (`/painel/**`) e qualquer tela nova da plataforma | **AdoteHub completa**, com **2 cores** (`verde` e `coral-forte`): cores, fontes, formas, emblema e logotipo abaixo |
| Catálogo público de cada ONG (`/[slug]/**`: catálogo, página do animal, formulário de adoção, card social) | **Mesma estrutura AdoteHub** (fontes, cantos, cards, pílulas, sombras, layout), mas com **3 papéis de cor da ONG**: **principal** (substitui `verde`), **destaque** (substitui `coral-forte`) e **apoio** (nova, opcional; sem ela, usa a principal). Cabeçalho com logo e nome da ONG; AdoteHub só no rodapé ("Catálogo feito com AdoteHub") |

No painel, o logo da ONG pode aparecer no cabeçalho, mas as cores são as do AdoteHub. A plataforma fica com duas cores para ser reconhecível; a terceira existe só no catálogo das ONGs.

## Princípios

1. **Acolhedor antes de técnico.** Fundo `creme` (nunca branco puro), cantos grandes, sombras suaves.
2. **O animal é o herói.** Foto grande, nome em destaque, informação curta em pílulas.
3. **Cores com papéis claros.** `verde` organiza (títulos, links, rótulos, foco). `coral-forte` chama para agir (um botão principal por tela). `coral` vivo é só decoração. No catálogo da ONG, o mesmo raciocínio vale com principal, destaque e apoio (ver "Três papéis de cor no catálogo da ONG").
4. **A ONG aparece primeiro** no catálogo dela.
5. **Sem vazios.** Nenhuma página pode depender de o animal ter muitos dados para ficar bem. O que não existe não aparece.

## Cores da plataforma (tema claro)

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

Status do animal: Disponível `verde`/`verde-50` · Em processo `mel`/`mel-50` · Adotado `azul`/`azul-50` · Indisponível `cinza`/`cinza-50`. A palavra sempre aparece; a cor só reforça. **Os status mantêm as cores fixas da AdoteHub, também no catálogo da ONG.**

## Três papéis de cor no catálogo da ONG

A ONG escolhe até três cores no painel (Marca). Cada uma tem um papel.

| Papel | Substitui | Onde aparece |
|---|---|---|
| **Principal** | `verde` | Nome do animal, títulos dos cards, links, anel de foco, tag de sexo, ícones dos cards, borda do botão fantasma |
| **Destaque** | `coral-forte` | Botão flutuante de adoção, tag de porte, `shadow-cta` |
| **Apoio** (opcional) | — | Tag de idade, checks de Saúde, ponto atual da galeria, detalhes pequenos e discretos. **Nunca em botão.** Sem cor de apoio, usa a principal |

### Tokens derivados (por cor de marca)

- `-50`: fundo de tag, mistura da cor com branco.
- **Variante de texto**: versão escurecida usada quando a cor original não atinge 4.5:1 sobre `papel` ou `creme`. Texto pequeno (rótulos, tags, links) usa sempre a variante de texto, nunca a cor de preenchimento.
- `on-principal`, `on-destaque`, `on-apoio`: texto sobre a cor. É **branco ou `tinta`**, o que passar 4.5:1. Nunca fixo em branco. Uma cor de destaque clara, como o âmbar, leva texto escuro.

### Tags de animal

| Tag | Catálogo da ONG | Plataforma (AdoteHub) |
|---|---|---|
| Sexo | Principal | `verde` |
| Porte | Destaque | coral |
| Idade | Apoio | coral |
| Status | Cores fixas de status | Cores fixas de status |

## Tipografia (Google Fonts, via `next/font/google`)

- **Bricolage Grotesque** 700–800 → títulos. Letter-spacing negativo, entrelinha curta. Nunca em texto corrido nem abaixo de 20px.
- **Figtree** 400–800 → todo o resto.

| Estilo | Fonte | Tamanho / entrelinha | Peso | Extra |
|---|---|---|---|---|
| `display-xl` | Bricolage | 64px / 1.0 (44px no celular) | 800 | -0.03em; 2 linhas: 1ª `verde`, 2ª `coral-forte` |
| `display-l` | Bricolage | 44px / 1.05 | 800 | -0.025em; título de página |
| `titulo` | Bricolage | 28px / 1.15 | 800 | -0.02em |
| `titulo-card` | Bricolage | 22px / 1.2 | 800 | -0.015em; nome do animal no card, em `verde` (principal no catálogo da ONG) |
| `lead` | Figtree | 18px / 1.55 | 400 | `tinta-suave`, até ~60 caracteres/linha |
| `corpo` | Figtree | 16px / 1.55 | 400 | |
| `corpo-p` | Figtree | 14px / 1.5 | 500 | metadados, `tinta-suave` |
| `botao` | Figtree | 16px / 1.2 | 700 | |
| `tag` | Figtree | 12px / 1.3 | 700 | |
| `rotulo` | Figtree | 11px / 1.3 | 800 | CAIXA-ALTA, +0.12em; rótulos de filtro em `verde` ou `coral-forte` (na ONG: variante de texto da principal ou do destaque) |

## Formas, espaço, sombra

- Raios: `radius-sm` 10px (logos pequenos, blocos pequenos) · `radius-md` 16px (botões, campos) · `radius-lg` 24px (cards, blocos, foto do animal) · `radius-pill` 999px (tags, busca, filtros, botão flutuante).
- Espaços: 4 · 8 · 12 · 16 · 20 · 24 · 48 · 80px. Grade de cards com 24px de espaço; respiro lateral mínimo 16px no celular; seções a 48px.
- Sombras (profundidade por sombra, não por borda):
  - `shadow-card`: `0 1px 2px rgba(29,43,36,.06), 0 18px 36px -22px rgba(29,43,36,.30)`
  - `shadow-cta` (só botão principal): `0 12px 24px -12px rgba(194,61,23,.55)`. No catálogo da ONG, a mesma sombra usa a cor de destaque.
  - `shadow-emblema`: `0 28px 56px -28px rgba(29,43,36,.40)`
- Celular primeiro. Grade de animais: 2 colunas no celular, 4 no desktop.

## Componentes

### Botões e links

- **Botão principal**: fundo `coral-forte` (destaque da ONG no catálogo), texto `on-coral`, `radius-md`, padding 14×26, `shadow-cta`, Figtree 700. **Um por tela.**
- **Botão secundário**: fundo `papel`, borda 2px e texto `verde`; hover `verde-50`.
- **Botão fantasma**: fundo transparente, borda 1.5px e texto `verde` (principal da ONG no catálogo), padding 10×18, ícone em traço. Hover: fundo `-50` da cor. Para ações leves, como "Compartilhar".
- **Botão verde**: fundo `verde`, texto branco; hover `verde-escuro` (ações do painel).
- **Botão de adoção flutuante** (página do animal): pílula fixa no canto inferior direito (24px de distância; 16px no celular; respeita a área segura do aparelho), cor de destaque da ONG, `radius-pill`, `shadow-cta`, ícone de pegada em traço + "Quero adotar {nome}", Figtree 700. Dar pelo menos 96px de respiro no fim da página. Animal não Disponível: sem botão, com a frase "{nome} não está disponível para adoção agora." e o link "Ver outros animais →".
- **Link de ação**: Figtree 700 `verde`, com "→" no fim ("Conhecer Rex →").

### Tags e cards

- **Tag**: pílula, padding 5×12, `tag`. Cores por papel, conforme a tabela de tags acima.
- **Card de animal**: `papel`, `radius-lg`, `shadow-card`, sem borda, o card inteiro é link, sobe 3px no hover. Foto 4:5 no topo; corpo com padding 20px: nome (`titulo-card` verde), até 3 tags, metadados (`corpo-p`), link "Conhecer {nome} →". Status ≠ Disponível vira selo sobre a foto. Sem foto: bloco `verde-50` com pegada `coral`.
- **Card de ONG** (home): `papel`, `radius-lg`, `shadow-card`, sem borda, o card inteiro é link, sobe 3px no hover. Logo (ou bloco `verde-50` com pegada `coral`), nome (`titulo-card`, `verde`), cidade (`corpo-p`), tag com a quantidade de animais disponíveis ("Sem animais no momento" em `cinza`) e link "Ver animais →".
- **Card de detalhe** (página do animal): `papel`, `radius-lg`, `shadow-card`, sem borda, padding 20px. Título `titulo-card` na cor principal com ícone de traço à esquerda. Só aparece se tiver ao menos uma linha para mostrar. Dado não preenchido nunca vira "Não".

### Estrutura de página

- **Cabeçalho da plataforma**: fundo `papel`, filete `linha` embaixo; emblema 48px + logotipo "Adote" (`verde`) + "Hub" (`coral-forte`) em Bricolage 800, 28px, -0.03em, sem espaço.
- **Cabeçalho fixo** (catálogo da ONG): logo e nome da ONG, fica no topo ao rolar, fundo `papel`, filete `linha` sempre visível, `shadow-card` suave só depois de rolar 8px. Altura única (~64px), usada pelo sticky da foto.
- **Hero**: grid 2 colunas; título `display-xl` em duas cores; `lead`; um botão principal; à direita o emblema grande (84%) dentro de um círculo `papel` de 300px com `shadow-emblema`. No celular o halo vai para cima e vira 200px.
- **Busca e filtros**: pílulas `papel` com borda `linha`, altura 52px. Busca com lupa em traço `verde`. Filtros com rótulo `rotulo` acima do valor, alternando `verde` e `coral-forte`.
- **Campos**: rótulo Figtree 700 14px acima; campo `papel`, borda 1.5px `linha`, `radius-md`, padding 12×16; foco com anel `foco` e borda `verde`. Escolhas curtas como botões de opção (marcado: `verde-50` + borda `verde`). Erro: borda `erro` + frase que diz como corrigir.

### Galeria de fotos do animal

- Sem miniaturas. Uma foto por vez, com deslize no celular e setas do teclado no desktop.
- **Setas** circulares translúcidas: 40px (área de toque 44px), fundo branco 55% com desfoque, ícone em traço `tinta`, centralizadas na vertical, sempre visíveis. Sem "anterior" na primeira foto e sem "próxima" na última.
- **Pontos** de posição sobre a foto, 8px: o atual na cor principal da ONG, os demais em branco translúcido, com sombra leve.
- Com uma só foto, sem setas nem pontos. O selo de status fica no canto superior esquerdo.

### Página do animal: layout

- **Desktop:** foto menor e fixa (sticky) à esquerda, 4:5, cabendo inteira na primeira tela. Conteúdo rolando à direita, nesta ordem: "← Todos os animais", nome, tags, Compartilhar, faixa "desde" (só se houver data de entrada), "Conheça {nome}" (só com história) e cards de detalhes em grade de 2 colunas.
- **Celular:** 1 coluna, foto primeiro (altura máxima de 62% da tela), sem sticky.
- Sem faixas de largura total abaixo da foto, que criam espaços vazios. A página precisa continuar boa com um animal quase sem dados.
- Cards: Informações, Saúde (checks na cor de apoio, com o texto "Sim" sempre visível; inclui "Condição e cuidados"), Sociabilidade e "Mais sobre {nome}" (campos extras públicos da ONG, sem nomes fixos no código).

## Logo

- Emblema: `public/brand/adotehub-emblema.svg` (disco verde, anel coral, casa branca com pegada coral). Não recolorir nem distorcer; mínimo 24px; respiro de 1/4 do diâmetro. Também é o favicon.
- Logotipo: composto em texto (ainda não vetorizado), como descrito no cabeçalho.

## Voz

- Fale com "você", frases curtas, português do Brasil, sem jargão ("endereço da ONG", não "slug").
- Botões dizem o que acontece: "Quero adotar Rex", "Enviar candidatura", "Cadastrar animal".
- Erros explicam como corrigir. Sem emoji decorativo. Caixa-alta só nos rótulos pequenos.

## Ícones

Sem conjunto próprio ainda: traço arredondado de 2–2.4px, pontas redondas, 18–24px. Na plataforma, em `verde` ou `tinta-suave`; no catálogo da ONG, na cor principal ou em `tinta-suave`. Nunca emoji. Ícones decorativos levam `aria-hidden`.
