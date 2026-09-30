import { createClient } from "@supabase/supabase-js";

const [email, next = "/painel"] = process.argv.slice(2);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secret = process.env.SUPABASE_SECRET_KEY;
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

if (!email) {
  console.error("Uso: npm run dev:link -- email@exemplo.com [/caminho]");
  process.exit(1);
}
if (!url || !secret) {
  console.error("Faltam NEXT_PUBLIC_SUPABASE_URL e/ou SUPABASE_SECRET_KEY no .env.local");
  process.exit(1);
}
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(site)) {
  console.error(`Recusado: NEXT_PUBLIC_SITE_URL (${site}) não é localhost. Este script é só para desenvolvimento.`);
  process.exit(1);
}

const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

const { error: createError } = await admin.auth.admin.createUser({ email, email_confirm: true });
if (createError && !/already|registered|exists/i.test(createError.message)) {
  console.error("Erro ao criar usuário:", createError.message);
  process.exit(1);
}

const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
if (error || !data?.properties?.hashed_token) {
  console.error("Erro ao gerar link:", error?.message ?? "sem token");
  process.exit(1);
}

const link =
  `${site}/auth/callback?token_hash=${encodeURIComponent(data.properties.hashed_token)}` +
  `&type=email&next=${encodeURIComponent(next)}`;

console.log(`\nLink de acesso para ${email} (uso único, expira em ~1h):\n\n${link}\n`);
console.log("Dica: abra numa janela anônima para não trocar a sessão da janela principal.\n");
