import type { Db, Row } from "@/lib/supabase/types";
import { ANIMAL_LIST_SELECT, ANIMAL_SELECT, toAnimal, toAnimalEvent } from "./mappers";
import type { Animal, AnimalEvent, AnimalStatus, PublicFilters } from "./types";

export const PUBLIC_PAGE_SIZE = 24;

function sanitizeSearch(q: string): string {
  return q.replace(/[^\p{L}\p{N}\s-]/gu, " ").replace(/\s+/g, " ").trim().slice(0, 60);
}

export async function listOrgAnimals(
  db: Db,
  orgId: string,
  opts: { status?: AnimalStatus; q?: string; archived?: boolean } = {},
): Promise<Animal[]> {
  let query = db
    .from("animals")
    .select(ANIMAL_LIST_SELECT)
    .eq("organization_id", orgId)
    .order("updated_at", { ascending: false })
    .limit(500);
  query = opts.archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);
  if (opts.status) query = query.eq("status", opts.status);
  const q = opts.q ? sanitizeSearch(opts.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,external_id.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toAnimal);
}

export async function getOrgAnimal(db: Db, orgId: string, animalId: string): Promise<Animal | null> {
  const { data, error } = await db
    .from("animals")
    .select(ANIMAL_SELECT)
    .eq("organization_id", orgId)
    .eq("id", animalId)
    .maybeSingle();
  if (error) throw error;
  return data ? toAnimal(data) : null;
}

export async function listAnimalEvents(db: Db, orgId: string, animalId: string): Promise<AnimalEvent[]> {
  const { data, error } = await db
    .from("animal_events")
    .select("id, type, payload, created_at")
    .eq("organization_id", orgId)
    .eq("animal_id", animalId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((r: Row) => toAnimalEvent(r));
}

export async function countOrgAnimals(db: Db, orgId: string): Promise<Record<AnimalStatus, number>> {
  const { data, error } = await db
    .from("animals")
    .select("status")
    .eq("organization_id", orgId)
    .is("archived_at", null);
  if (error) throw error;
  const counts: Record<AnimalStatus, number> = { available: 0, reserved: 0, adopted: 0, unavailable: 0 };
  for (const row of (data ?? []) as Row[]) counts[row.status as AnimalStatus] += 1;
  return counts;
}

export async function listPublicAnimals(
  db: Db,
  orgId: string,
  filters: PublicFilters,
): Promise<{ items: Animal[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PUBLIC_PAGE_SIZE;
  let query = db
    .from("animals")
    .select(ANIMAL_LIST_SELECT, { count: "exact" })
    .eq("organization_id", orgId)
    .is("archived_at", null)
    .in("status", ["available", "reserved"])
    .order("status", { ascending: true })
    .order("created_at", { ascending: false })
    .range(from, from + PUBLIC_PAGE_SIZE - 1);
  if (filters.species) query = query.eq("species", filters.species);
  if (filters.sex) query = query.eq("sex", filters.sex);
  if (filters.size) query = query.eq("size", filters.size);
  if (filters.ageGroup) query = query.eq("age_group", filters.ageGroup);
  const q = filters.q ? sanitizeSearch(filters.q) : "";
  if (q) query = query.or(`name.ilike.%${q}%,breed.ilike.%${q}%,color.ilike.%${q}%`);

  const { data, error, count } = await query;
  if (error) throw error;
  return { items: (data ?? []).map(toAnimal), total: count ?? 0, page, pageSize: PUBLIC_PAGE_SIZE };
}

export async function getPublicAnimal(db: Db, orgId: string, code: string): Promise<Animal | null> {
  const { data, error } = await db
    .from("animals")
    .select(ANIMAL_SELECT)
    .eq("organization_id", orgId)
    .eq("code", code)
    .is("archived_at", null)
    .maybeSingle();
  if (error) throw error;
  return data ? toAnimal(data) : null;
}
