# Roteiro da Fase 1 — do código base ao piloto

> Estado em 30/09/2026: código base da Fase 1 escrito. Testes do banco (RLS) e da importação passando.
> O app ainda **não foi rodado com `npm install`** (o ambiente onde foi gerado não tinha acesso ao npm) — o passo 1 é justamente isso.

## Etapa 1 — Colocar de pé (1–2 dias)

- [ ] `npm install` e `npm run typecheck` — corrigir o que aparecer (versões de pacotes podem ter mudado).
- [ ] Criar o projeto Supabase, aplicar as migrations, configurar URLs, SMTP (Resend) e templates de e-mail (ver README).
- [ ] Entrar, virar admin (`platform_admins`), criar uma ONG de teste com o seu segundo e-mail como responsável.
- [ ] Aceitar o convite no celular (testa o link mágico em outro aparelho).

## Etapa 2 — Percorrer cada fluxo como a ONG (2–3 dias)

- [ ] Marca: logo, cores, WhatsApp, Instagram. Conferir contraste do texto sobre as cores.
- [ ] Equipe: convidar voluntário, aceitar, remover.
- [ ] Cadastrar 3 animais à mão com fotos tiradas no celular (inclusive foto "deitada" e foto do iPhone).
- [ ] Importar uma planilha de teste; reimportar a mesma planilha e confirmar que **atualiza pelo ID, não duplica**. Testar dois animais com o mesmo nome e IDs diferentes.
- [ ] Catálogo: filtros, busca, paginação, compartilhar no WhatsApp e conferir o card social.
- [ ] Enviar candidatura como adotante; mudar status e notas no painel; ver o histórico do animal.

## Etapa 3 — Com as ONGs do piloto

- [ ] Pedir as planilhas reais de 2–3 ONGs e importar. Anotar colunas/valores que o mapeamento não adivinhou e acrescentar ao dicionário em `modules/imports/mapping.ts` (com teste).
- [ ] Definir com as ONGs as perguntas extras do formulário.
- [ ] Revisão jurídica dos textos de consentimento (`modules/applications/form.ts`) e definir quem é controlador dos dados. Criar página de privacidade.
- [ ] Domínio + deploy na Vercel.

## Decisões tomadas no código (revisar se quiser)

| Decisão | Motivo |
|---|---|
| Fotos no Supabase Storage, comprimidas no navegador (JPEG 1600px + miniatura 480px) | Uma conta a menos; JPEG porque o gerador do card social não lê WebP |
| Convite = link copiável (WhatsApp/e-mail), preso ao e-mail convidado, válido 14 dias | Não depende de e-mail transacional próprio; evita repasse do link |
| Login só por link mágico (sem senha) | Menos suporte para ONGs |
| Todo animal tem **ID obrigatório e único por ONG** (`external_id`), no cadastro manual e na planilha | Nomes se repetem; o ID é a chave da importação e da sync. Planilha sem coluna de ID não importa |
| Colunas não mapeadas não são tocadas na reimportação | Não apagar o que a ONG preencheu na plataforma |
| Admin da plataforma não vê candidaturas | Acesso mínimo (LGPD) |
| Pessoa reconhecida por e-mail; envio anônimo não sobrescreve dados existentes | Base de adotantes desde a v1 sem permitir que alguém altere o cadastro de outra pessoa |

## Limitações conhecidas (candidatas a pequenos incrementos, não a novas features)

- Busca não ignora acentos ("joao" não acha "João"). Solução: extensão `unaccent` + coluna gerada.
- ONGs sem ID na planilha precisam criar a coluna antes de importar (ex.: nº da ficha). Conferir isso com as ONGs do piloto.
- Sem reordenação de fotos (só "usar como capa").
- HEIC do iPhone só funciona em navegadores que decodificam HEIC (Safari sim; Chrome no Windows não).
- ONG não recebe aviso de nova candidatura (só vê no painel). Um e-mail via Resend resolve.
- Anti-spam do formulário é simples (honeypot + 5 envios/hora por e-mail). Se aparecer abuso: Cloudflare Turnstile.
- O e-mail do adotante não é verificado — conta para o critério "adotantes em mais de uma ONG" com essa ressalva.

## Preparado para a Fase 1.1 (sync)

- `import_mappings` já tem `sheet_url`; `import_runs` tem `kind = 'sync'` e relatório de erros por linha.
- `mapRows()` é pura e roda no servidor — a sync só precisa ler a planilha pela service account e chamar a mesma função.
- `animals.source = 'import'` identifica os campos que ficarão somente leitura.
