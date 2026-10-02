function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Variável de ambiente ausente: ${name}`);
  return value;
}

export const env = {
  supabaseUrl: required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
  supabaseAnonKey: required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
};

export const MEDIA_BUCKET = "org-media";

export function publicMediaUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return `${env.supabaseUrl}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

export const contato = {
  whatsapp: (process.env.NEXT_PUBLIC_CONTATO_WHATSAPP ?? "").replace(/\D/g, ""),
  email: (process.env.NEXT_PUBLIC_CONTATO_EMAIL ?? "").trim(),
};

export function contatoHref(): string | null {
  if (contato.whatsapp) return `https://wa.me/${contato.whatsapp}`;
  if (contato.email) return `mailto:${contato.email}`;
  return null;
}
