import type { Db, Row } from "@/lib/supabase/types";

export interface CustomField {
  id: string;
  key: string;
  label: string;
  isPublic: boolean;
  position: number;
  archivedAt: string | null;
}

function toCustomField(row: Row): CustomField {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    isPublic: row.is_public,
    position: row.position,
    archivedAt: row.archived_at,
  };
}

const COLUMNS = "id, key, label, is_public, position, archived_at";

export async function listCustomFields(
  db: Db,
  orgId: string,
  opts: { includeArchived?: boolean } = {},
): Promise<CustomField[]> {
  let query = db
    .from("animal_custom_fields")
    .select(COLUMNS)
    .eq("organization_id", orgId)
    .order("position")
    .order("created_at");
  if (!opts.includeArchived) query = query.is("archived_at", null);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r: Row) => toCustomField(r));
}

export function extraValues(fields: CustomField[], extra: Record<string, unknown> | null | undefined) {
  return fields
    .map((f) => ({ field: f, value: typeof extra?.[f.key] === "string" ? (extra[f.key] as string).trim() : "" }))
    .filter((x) => x.value !== "");
}