"use server";

import { friendlyDbError } from "@/lib/errors";
import { requireOrgContext } from "@/modules/organizations/service";
import { revalidatePath } from "next/cache";
import { customFieldKey } from "../imports/mapping";
import { listCustomFields, type CustomField } from "./custom-fields";

function revalidate(slug: string) {
  revalidatePath(`/painel/${slug}`, "layout");
  revalidatePath(`/${slug}`, "layout");
}

export async function createCustomFieldAction(
  slug: string,
  label: string,
): Promise<{ ok: true; field: CustomField } | { ok: false; error: string }> {
  const { db, org } = await requireOrgContext(slug);
  const clean = label.trim().replace(/\s+/g, " ").slice(0, 60);
  if (!clean) return { ok: false, error: "Dê um nome ao campo." };

  const all = await listCustomFields(db, org.id, { includeArchived: true });
  const same = all.find((f) => f.label.toLowerCase() === clean.toLowerCase());
  if (same) {
    if (same.archivedAt) {
      await db.from("animal_custom_fields").update({ archived_at: null }).eq("id", same.id).eq("organization_id", org.id);
      revalidate(slug);
    }
    return { ok: true, field: { ...same, archivedAt: null } };
  }

  const { data, error } = await db
    .from("animal_custom_fields")
    .insert({
      organization_id: org.id,
      key: customFieldKey(clean, all.map((f) => f.key)),
      label: clean,
      position: all.length,
    })
    .select("id, key, label, is_public, position, archived_at")
    .single();
  if (error || !data) return { ok: false, error: friendlyDbError(error) };
  revalidate(slug);
  return {
    ok: true,
    field: { id: data.id, key: data.key, label: data.label, isPublic: data.is_public, position: data.position, archivedAt: null },
  };
}

export async function updateCustomFieldAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const { db, org } = await requireOrgContext(slug, "admin");
  const id = String(formData.get("fieldId"));
  const patch: Record<string, unknown> = {};
  const label = formData.get("label");
  if (typeof label === "string" && label.trim()) patch.label = label.trim().slice(0, 60);
  const isPublic = formData.get("isPublic");
  if (isPublic !== null) patch.is_public = isPublic === "true";
  const archived = formData.get("archived");
  if (archived !== null) patch.archived_at = archived === "true" ? new Date().toISOString() : null;
  if (Object.keys(patch).length === 0) return;

  const { error } = await db.from("animal_custom_fields").update(patch).eq("id", id).eq("organization_id", org.id);
  if (error) throw new Error(friendlyDbError(error));
  revalidate(slug);
}

export async function addCustomFieldAction(formData: FormData) {
  const slug = String(formData.get("slug"));
  const res = await createCustomFieldAction(slug, String(formData.get("label") ?? ""));
  if (!res.ok) throw new Error(res.error);
}