import type { Db, Row } from "@/lib/supabase/types";
import type { Application, ApplicationStatus } from "./types";

const SELECT =
  "id, status, answers, consent_matching, consent_version, internal_notes, created_at, status_changed_at, person:persons(name, email, phone, city, state), animal:animals(id, name, code, external_id)";

function toApplication(row: Row): Application {
  return {
    id: row.id,
    status: row.status,
    answers: row.answers ?? { person: {}, profile: {}, extra: {} },
    consentMatching: row.consent_matching,
    consentVersion: row.consent_version,
    internalNotes: row.internal_notes,
    createdAt: row.created_at,
    statusChangedAt: row.status_changed_at,
    person: row.person ?? { name: "—", email: "", phone: null, city: null, state: null },
    animal: row.animal
      ? { id: row.animal.id, name: row.animal.name, code: row.animal.code, externalId: row.animal.external_id }
      : { id: "", name: "—", code: "", externalId: "" },
  };
}

export async function listApplications(db: Db, orgId: string, status?: ApplicationStatus): Promise<Application[]> {
  let query = db
    .from("applications")
    .select(SELECT)
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (status) query = query.eq("status", status);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: Row) => toApplication(r));
}

export async function getApplication(db: Db, orgId: string, id: string): Promise<Application | null> {
  const { data, error } = await db
    .from("applications")
    .select(SELECT)
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? toApplication(data) : null;
}

export async function countApplicationsByStatus(db: Db, orgId: string): Promise<Record<ApplicationStatus, number>> {
  const { data, error } = await db
    .from("applications")
    .select("status")
    .eq("organization_id", orgId)
    .is("archived_at", null);
  if (error) throw error;
  const counts: Record<ApplicationStatus, number> = { new: 0, in_review: 0, approved: 0, rejected: 0, withdrawn: 0 };
  for (const row of (data ?? []) as Row[]) counts[row.status as ApplicationStatus] += 1;
  return counts;
}

export async function listOtherApplicationsFromPerson(
  db: Db,
  orgId: string,
  email: string,
  excludeId: string,
): Promise<{ id: string; status: ApplicationStatus; createdAt: string; animalName: string }[]> {
  const { data, error } = await db
    .from("applications")
    .select("id, status, created_at, animal:animals(name), person:persons!inner(email)")
    .eq("organization_id", orgId)
    .eq("person.email", email)
    .neq("id", excludeId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    status: r.status as ApplicationStatus,
    createdAt: r.created_at as string,
    animalName: (r.animal?.name as string) ?? "—",
  }));
}
