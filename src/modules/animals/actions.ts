"use server";

import { MEDIA_BUCKET } from "@/lib/env";
import { friendlyDbError, type ActionState } from "@/lib/errors";
import type { Db } from "@/lib/supabase/types";
import { requireOrgContext } from "@/modules/organizations/service";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { listCustomFields } from "./custom-fields";
import { animalFormSchema, toAnimalRow } from "./schema";

async function readExtra(db: Db, orgId: string, formData: FormData, current: Record<string, unknown> = {}) {
  const fields = await listCustomFields(db, orgId);
  const extra: Record<string, unknown> = { ...current };
  for (const f of fields) {
    const raw = formData.get(`extra_${f.key}`);
    if (raw === null) continue;
    const text = String(raw).trim().slice(0, 2000);
    if (text) extra[f.key] = text;
    else delete extra[f.key];
  }
  return extra;
}

function duplicateIdError(error: { code?: string } | null, externalId: string): ActionState | null {
  if (error?.code !== "23505") return null;
  const msg = `Já existe um animal com o ID "${externalId}" nesta ONG.`;
  return { ok: false, error: msg, fieldErrors: { externalId: [msg] } };
}

function revalidateAnimal(slug: string) {
  revalidatePath(`/painel/${slug}/animais`, "layout");
  revalidatePath(`/${slug}`, "layout");
}

export async function createAnimalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("slug"));
  const { db, org, userId } = await requireOrgContext(slug);
  const parsed = animalFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };

  const { data, error } = await db
    .from("animals")
    .insert({
      ...toAnimalRow(parsed.data),
      extra: await readExtra(db, org.id, formData),
      organization_id: org.id,
      created_by: userId,
      source: "manual",
    })
    .select("id")
    .single();
  if (error || !data) return duplicateIdError(error, parsed.data.externalId) ?? { ok: false, error: friendlyDbError(error) };

  revalidateAnimal(slug);
  redirect(`/painel/${slug}/animais/${data.id}?novo=1`);
}

export async function updateAnimalAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("slug"));
  const animalId = String(formData.get("animalId"));
  const { db, org } = await requireOrgContext(slug);
  const parsed = animalFormSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };

    const { data: current } = await db
    .from("animals")
    .select("extra")
    .eq("id", animalId)
    .eq("organization_id", org.id)
    .maybeSingle();
  const extra = await readExtra(db, org.id, formData, (current?.extra ?? {}) as Record<string, unknown>);

  const { error } = await db
    .from("animals")
    .update({ ...toAnimalRow(parsed.data), extra })
    .eq("id", animalId)
    .eq("organization_id", org.id);
  if (error) return duplicateIdError(error, parsed.data.externalId) ?? { ok: false, error: friendlyDbError(error) };

  revalidateAnimal(slug);
  return { ok: true, message: "Alterações salvas." };
}

export async function setArchivedAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const animalId = String(formData.get("animalId"));
  const archived = formData.get("archived") === "true";
  const { db, org } = await requireOrgContext(slug);
  const { error } = await db
    .from("animals")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", animalId)
    .eq("organization_id", org.id);
  if (error) throw new Error(friendlyDbError(error));
  revalidateAnimal(slug);
}

const photoSchema = z.object({
  id: z.string().uuid(),
  path: z.string(),
  thumbPath: z.string(),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sizeBytes: z.number().int().positive(),
});

export async function registerPhotoAction(
  slug: string,
  animalId: string,
  input: z.infer<typeof photoSchema>,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { db, org } = await requireOrgContext(slug);
  const photo = photoSchema.parse(input);
  const prefix = `${org.id}/animals/${animalId}/`;
  if (!photo.path.startsWith(prefix) || !photo.thumbPath.startsWith(prefix)) {
    return { ok: false, error: "Caminho de foto inválido." };
  }

  const { count } = await db
    .from("animal_photos")
    .select("id", { count: "exact", head: true })
    .eq("animal_id", animalId);

  const { error } = await db.from("animal_photos").insert({
    id: photo.id,
    organization_id: org.id,
    animal_id: animalId,
    storage_path: photo.path,
    thumb_path: photo.thumbPath,
    width: photo.width,
    height: photo.height,
    size_bytes: photo.sizeBytes,
    position: count ?? 0,
  });

  if (error) {
    await db.storage.from(MEDIA_BUCKET).remove([photo.path, photo.thumbPath]);
    return { ok: false, error: friendlyDbError(error) };
  }

  await db
    .from("animals")
    .update({ cover_photo_id: photo.id })
    .eq("id", animalId)
    .eq("organization_id", org.id)
    .is("cover_photo_id", null);

  revalidateAnimal(slug);
  return { ok: true };
}

export async function deletePhotoAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const photoId = String(formData.get("photoId"));
  const { db, org } = await requireOrgContext(slug);
  const { data: photo, error } = await db
    .from("animal_photos")
    .delete()
    .eq("id", photoId)
    .eq("organization_id", org.id)
    .select("storage_path, thumb_path")
    .maybeSingle();
  if (error) throw new Error(friendlyDbError(error));
  if (photo) await db.storage.from(MEDIA_BUCKET).remove([photo.storage_path, photo.thumb_path]);
  revalidateAnimal(slug);
}

export async function setCoverAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug);
  const { error } = await db
    .from("animals")
    .update({ cover_photo_id: String(formData.get("photoId")) })
    .eq("id", String(formData.get("animalId")))
    .eq("organization_id", org.id);
  if (error) throw new Error(friendlyDbError(error));
  revalidateAnimal(slug);
}
