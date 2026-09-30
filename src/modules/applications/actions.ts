"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { friendlyDbError, type ActionState } from "@/lib/errors";
import { createPublicClient } from "@/lib/supabase/public";
import { findOrgBySlug } from "@/modules/organizations/repository";
import { requireOrgContext } from "@/modules/organizations/service";
import { CONSENT_VERSION, FORM_VERSION, personSchema, profileSchema } from "./form";

export async function submitApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  if (String(formData.get("website") ?? "") !== "") return { ok: true };

  const orgSlug = String(formData.get("orgSlug"));
  const animalCode = String(formData.get("animalCode"));
  const raw = Object.fromEntries(formData);

  const person = personSchema.safeParse(raw);
  const profile = profileSchema.safeParse(raw);
  const consentOrg = formData.get("consentOrg") === "on";
  const consentMatching = formData.get("consentMatching") === "on";
  const adult = formData.get("adult") === "on";

  const fieldErrors: Record<string, string[] | undefined> = {
    ...(person.success ? {} : person.error.flatten().fieldErrors),
    ...(profile.success ? {} : profile.error.flatten().fieldErrors),
  };
  if (!consentOrg) fieldErrors.consentOrg = ["Obrigatório para enviar"];
  if (!adult) fieldErrors.adult = ["É preciso ter 18 anos ou mais"];

  const db = createPublicClient();
  const org = await findOrgBySlug(db, orgSlug);
  if (!org) return { ok: false, error: "ONG não encontrada." };

  const extra: Record<string, { label: string; answer: string }> = {};
  for (const q of org.adoptionExtraQuestions) {
    const answer = String(formData.get(`extra_${q.id}`) ?? "").trim().slice(0, 2000);
    if (q.required && !answer) fieldErrors[`extra_${q.id}`] = ["Obrigatório"];
    extra[q.id] = { label: q.label, answer };
  }

  if (!person.success || !profile.success || Object.keys(fieldErrors).length > 0) {
    return { ok: false, error: "Confira os campos destacados.", fieldErrors };
  }

  const { error } = await db.rpc("submit_application", {
    p_org_slug: orgSlug,
    p_animal_code: animalCode,
    p_person: person.data,
    p_profile: { ...profile.data, form_version: FORM_VERSION },
    p_extra: extra,
    p_consent_org: consentOrg,
    p_consent_matching: consentMatching,
    p_consent_version: CONSENT_VERSION,
  });
  if (error) return { ok: false, error: friendlyDbError(error) };

  revalidatePath(`/painel/${orgSlug}/candidaturas`);
  redirect(`/${orgSlug}/animais/${animalCode}/adotar/enviado`);
}

const statusSchema = z.enum(["new", "in_review", "approved", "rejected", "withdrawn"]);

export async function updateApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const slug = String(formData.get("slug"));
  const id = String(formData.get("applicationId"));
  const { db, org } = await requireOrgContext(slug);
  const status = statusSchema.safeParse(formData.get("status"));
  if (!status.success) return { ok: false, error: "Status inválido." };
  const notes = String(formData.get("internalNotes") ?? "").trim().slice(0, 5000) || null;

  const { error } = await db
    .from("applications")
    .update({ status: status.data, internal_notes: notes })
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) return { ok: false, error: friendlyDbError(error) };

  revalidatePath(`/painel/${slug}/candidaturas`, "layout");
  return { ok: true, message: "Candidatura atualizada." };
}
