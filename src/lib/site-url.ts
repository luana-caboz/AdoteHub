import "server-only";
import { headers } from "next/headers";
import { env } from "@/lib/env";

// Endereço público do site. Prefere NEXT_PUBLIC_SITE_URL; se ela não chegou ao build
// (continua no padrão localhost), usa o endereço da requisição, para não gerar links com localhost em produção.
export async function getSiteUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return env.siteUrl;
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (!host) return env.siteUrl;
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
