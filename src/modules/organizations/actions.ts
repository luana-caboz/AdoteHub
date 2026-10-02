"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { env } from "@/lib/env";
import { friendlyDbError, type ActionState } from "@/lib/errors";
import { slugify, validateOrgSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import type { Db } from "@/lib/supabase/types";
import { requireOrgContext, requirePlatformAdmin } from "./service";
import type { ExtraQuestion } from "./types";

const inviteUrl = (token: string) => `${env.siteUrl}/convite/${token}`;

const emptyToNull = (v: unknown) => (typeof v === "string" && v.trim() === "" ? null : v);
const optionalText = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const uf = z.preprocess(
  (v) => (typeof v === "string" ? (v.trim() === "" ? null : v.trim().toUpperCase()) : v),
  z.string().regex(/^[A-Z]{2}$/, "UF com 2 letras").nullable(),
);
const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Cor inválida");

const createOrgSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto").max(120),
  slug: z.string().trim().toLowerCase(),
  ownerEmail: z.string().trim().toLowerCase().email("E-mail inválido"),
  city: optionalText(80),
  state: uf,
});

export async function createOrganizationAction(
  _prev: ActionState<{ inviteUrl: string; slug: string }>,
  formData: FormData,
): Promise<ActionState<{ inviteUrl: string; slug: string }>> {
  const { db } = await requirePlatformAdmin();
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    slug: formData.get("slug") || slugify(String(formData.get("name") ?? "")),
    ownerEmail: formData.get("ownerEmail"),
    city: formData.get("city"),
    state: formData.get("state"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const slugError = validateOrgSlug(parsed.data.slug);
  if (slugError) return { ok: false, error: slugError, fieldErrors: { slug: [slugError] } };

  const { data, error } = await db
    .rpc("admin_create_organization", {
      p_name: parsed.data.name,
      p_slug: parsed.data.slug,
      p_owner_email: parsed.data.ownerEmail,
      p_city: parsed.data.city,
      p_state: parsed.data.state,
    })
    .single<{ organization_id: string; invite_token: string }>();
  if (error || !data) {
    return { ok: false, error: error?.code === "23505" ? "Esse endereço (slug) já está em uso." : friendlyDbError(error) };
  }

  revalidatePath("/admin");
  return {
    ok: true,
    message: "ONG criada. Envie o link de convite para a responsável.",
    data: { inviteUrl: inviteUrl(data.invite_token), slug: parsed.data.slug },
  };
}

export async function adminUpdateOrganizationAction(formData: FormData) {
  const { db } = await requirePlatformAdmin();
  const orgId = String(formData.get("orgId"));
  const maxPhotos = Number(formData.get("maxPhotos"));
  const archived = formData.get("archived");
  const { error } = await db.rpc("admin_update_organization", {
    p_org: orgId,
    p_max_photos: Number.isFinite(maxPhotos) && maxPhotos > 0 ? maxPhotos : null,
    p_archived: archived === null ? null : archived === "true",
  });
  if (error) throw new Error(friendlyDbError(error));
  revalidatePath("/admin");
}

export async function adminSetOrgHomeAction(formData: FormData) {
  const { db } = await requirePlatformAdmin();
  const city = optionalText(80).parse(formData.get("city"));
  const { error } = await db.rpc("admin_set_org_home", {
    p_org: String(formData.get("orgId")),
    p_show: formData.get("showOnHome") === "on",
    p_city: city,
  });
  if (error) throw new Error(friendlyDbError(error));
  revalidatePath("/admin");
  revalidatePath("/");
}

const inviteSchema = z.object({
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(["member", "admin", "owner"]),
});

async function insertInvite(db: Db, orgId: string, userId: string, formData: FormData): Promise<ActionState<{ inviteUrl: string }>> {
  const parsed = inviteSchema.safeParse({ email: formData.get("email"), role: formData.get("role") ?? "member" });
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };

  const { data, error } = await db
    .from("organization_invites")
    .insert({ organization_id: orgId, email: parsed.data.email, role: parsed.data.role, invited_by: userId })
    .select("token")
    .single();
  if (error || !data) return { ok: false, error: friendlyDbError(error) };
  return { ok: true, message: "Convite criado. Envie o link.", data: { inviteUrl: inviteUrl(data.token) } };
}

export async function createInviteAction(
  _prev: ActionState<{ inviteUrl: string }>,
  formData: FormData,
): Promise<ActionState<{ inviteUrl: string }>> {
  const slug = String(formData.get("slug"));
  const { db, org, userId } = await requireOrgContext(slug, "admin");
  if (formData.get("role") === "owner") return { ok: false, error: "Só a plataforma define a responsável." };
  const result = await insertInvite(db, org.id, userId, formData);
  revalidatePath(`/painel/${slug}/equipe`);
  return result;
}

export async function adminCreateInviteAction(
  _prev: ActionState<{ inviteUrl: string }>,
  formData: FormData,
): Promise<ActionState<{ inviteUrl: string }>> {
  const { db, user } = await requirePlatformAdmin();
  const result = await insertInvite(db, String(formData.get("orgId")), user.id, formData);
  revalidatePath("/admin");
  return result;
}

export async function revokeInviteAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug, "admin");
  const { error } = await db
    .from("organization_invites")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", String(formData.get("inviteId")))
    .eq("organization_id", org.id);
  if (error) throw new Error(friendlyDbError(error));
  revalidatePath(`/painel/${slug}/equipe`);
}

export async function removeMemberAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug, "admin");
  const { error } = await db
    .from("organization_members")
    .delete()
    .eq("organization_id", org.id)
    .eq("user_id", String(formData.get("userId")))
    .neq("role", "owner");
  if (error) throw new Error(friendlyDbError(error));
  revalidatePath(`/painel/${slug}/equipe`);
}

const brandSchema = z.object({
  name: z.string().trim().min(2).max(120),
  primaryColor: hexColor,
  secondaryColor: hexColor,
  city: optionalText(80),
  state: uf,
  contactEmail: z.preprocess(emptyToNull, z.string().trim().email("E-mail inválido").nullable()),
  whatsapp: optionalText(20),
  instagram: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().replace(/^@/, "") || null : v),
    z.string().max(40).nullable(),
  ),
});

export async function updateBrandAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug, "admin");
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  const d = parsed.data;
  const { error } = await db
    .from("organizations")
    .update({
      name: d.name,
      primary_color: d.primaryColor.toLowerCase(),
      secondary_color: d.secondaryColor.toLowerCase(),
      city: d.city,
      state: d.state,
      contact_email: d.contactEmail,
      whatsapp: d.whatsapp,
      instagram: d.instagram,
    })
    .eq("id", org.id);
  if (error) return { ok: false, error: friendlyDbError(error) };
  revalidatePath(`/painel/${slug}`, "layout");
  revalidatePath(`/${slug}`, "layout");
  return { ok: true, message: "Salvo." };
}

export async function saveLogoAction(slug: string, logoPath: string) {
  const { db, org } = await requireOrgContext(slug, "admin");
  if (!logoPath.startsWith(`${org.id}/brand/`)) throw new Error("Caminho inválido");
  const previous = org.logoPath;
  const { error } = await db.from("organizations").update({ logo_path: logoPath }).eq("id", org.id);
  if (error) throw new Error(friendlyDbError(error));
  if (previous && previous !== logoPath) await db.storage.from("org-media").remove([previous]);
  revalidatePath(`/painel/${slug}`, "layout");
  revalidatePath(`/${slug}`, "layout");
}

export async function saveExtraQuestionsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug, "admin");
  const lines = String(formData.get("questions") ?? "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length > 15) return { ok: false, error: "Use no máximo 15 perguntas extras." };

  const seen = new Set<string>();
  const questions: ExtraQuestion[] = [];
  for (const line of lines) {
    const required = line.endsWith("*");
    const label = required ? line.slice(0, -1).trim() : line;
    if (label.length > 200) return { ok: false, error: "Pergunta muito longa (máx. 200 caracteres)." };
    let id = slugify(label).slice(0, 30) || "pergunta";
    while (seen.has(id)) id = `${id}-2`;
    seen.add(id);
    questions.push({ id, label, required });
  }

  const { error } = await db.from("organizations").update({ adoption_extra_questions: questions }).eq("id", org.id);
  if (error) return { ok: false, error: friendlyDbError(error) };
  revalidatePath(`/${slug}`, "layout");
  return { ok: true, message: "Formulário atualizado." };
}

export async function acceptInviteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const token = String(formData.get("token"));
  const db = await createClient();
  const { data: slug, error } = await db.rpc("accept_invite", { p_token: token });
  if (error || typeof slug !== "string") return { ok: false, error: friendlyDbError(error) };
  redirect(`/painel/${slug}`);
}
