export const RESERVED_SLUGS = new Set([
  "admin", "painel", "entrar", "sair", "auth", "convite", "api", "ajuda", "sobre",
  "termos", "privacidade", "contato", "blog", "app", "www", "static", "public",
  "_next", "favicon.ico", "robots.txt", "sitemap.xml", "ongs", "adotar", "animais",
]);

export const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;

export function removeAccents(value: string): string {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export function slugify(value: string): string {
  return removeAccents(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function validateOrgSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) return "Use 3 a 40 caracteres: letras minúsculas, números e hífen.";
  if (RESERVED_SLUGS.has(slug)) return "Este endereço é reservado.";
  return null;
}

export function animalPath(orgSlug: string, name: string, code: string): string {
  const base = slugify(name) || "animal";
  return `/${orgSlug}/animais/${base}-${code}`;
}

export function codeFromAnimalRef(ref: string): string {
  const i = ref.lastIndexOf("-");
  return i === -1 ? ref : ref.slice(i + 1);
}
