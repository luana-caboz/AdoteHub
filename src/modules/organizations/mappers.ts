import { publicMediaUrl } from "@/lib/env";
import type { Row } from "@/lib/supabase/types";
import type { ExtraQuestion, Membership, OrgInvite, OrgMember, Organization } from "./types";

export const ORG_COLUMNS =
  "id, type, name, slug, logo_path, primary_color, secondary_color, city, state, contact_email, whatsapp, instagram, max_photos_per_animal, adoption_extra_questions, archived_at";

function toExtraQuestions(value: unknown): ExtraQuestion[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((q): q is Row => typeof q === "object" && q !== null && typeof q.id === "string" && typeof q.label === "string")
    .map((q) => ({ id: q.id, label: q.label, required: Boolean(q.required) }));
}

export function toOrganization(row: Row): Organization {
  return {
    id: row.id,
    type: row.type,
    name: row.name,
    slug: row.slug,
    logoPath: row.logo_path,
    logoUrl: publicMediaUrl(row.logo_path),
    primaryColor: row.primary_color,
    secondaryColor: row.secondary_color,
    city: row.city,
    state: row.state,
    contactEmail: row.contact_email,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    maxPhotosPerAnimal: row.max_photos_per_animal,
    adoptionExtraQuestions: toExtraQuestions(row.adoption_extra_questions),
    archivedAt: row.archived_at,
  };
}

export function toMember(row: Row): OrgMember {
  return { userId: row.user_id, email: row.email, role: row.role, createdAt: row.created_at };
}

export function toInvite(row: Row): OrgInvite {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    token: row.token,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
  };
}

export function toMembership(row: Row): Membership {
  return {
    organizationId: row.organization_id,
    role: row.role,
    name: row.organizations?.name ?? "",
    slug: row.organizations?.slug ?? "",
  };
}
