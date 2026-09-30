import type { Db, Row } from "@/lib/supabase/types";
import type { ImportMapping } from "./mapping";

export const DEFAULT_MAPPING_NAME = "Planilha principal";

export async function getSavedMapping(db: Db, orgId: string): Promise<(ImportMapping & { id: string }) | null> {
  const { data, error } = await db
    .from("import_mappings")
    .select("id, column_map, value_map")
    .eq("organization_id", orgId)
    .eq("name", DEFAULT_MAPPING_NAME)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, columnMap: data.column_map ?? {}, valueMap: data.value_map ?? {} } : null;
}

export async function saveMapping(db: Db, orgId: string, userId: string, mapping: ImportMapping): Promise<string> {
  const { data, error } = await db
    .from("import_mappings")
    .upsert(
      {
        organization_id: orgId,
        name: DEFAULT_MAPPING_NAME,
        column_map: mapping.columnMap,
        value_map: mapping.valueMap,
        updated_by: userId,
      },
      { onConflict: "organization_id,name" },
    )
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface ImportRun {
  id: string;
  fileName: string | null;
  totalRows: number;
  created: number;
  updated: number;
  failed: number;
  errors: { row: number; key?: string; messages: string[] }[];
  createdAt: string;
}

export async function listImportRuns(db: Db, orgId: string): Promise<ImportRun[]> {
  const { data, error } = await db
    .from("import_runs")
    .select("id, file_name, total_rows, created_count, updated_count, failed_count, errors, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []).map((r: Row) => ({
    id: r.id as string,
    fileName: r.file_name as string | null,
    totalRows: r.total_rows as number,
    created: r.created_count as number,
    updated: r.updated_count as number,
    failed: r.failed_count as number,
    errors: (r.errors ?? []) as { row: number; key?: string; messages: string[] }[],
    createdAt: r.created_at as string,
  }));
}

export async function existingExternalIds(db: Db, orgId: string, keys: string[]): Promise<Map<string, string>> {
  const found = new Map<string, string>();
  for (let i = 0; i < keys.length; i += 200) {
    const { data, error } = await db
      .from("animals")
      .select("id, external_id")
      .eq("organization_id", orgId)
      .in("external_id", keys.slice(i, i + 200));
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) found.set(r.external_id, r.id);
  }
  return found;
}

export async function existingExtras(db: Db, orgId: string, keys: string[]): Promise<Map<string, Record<string, unknown>>> {
  const found = new Map<string, Record<string, unknown>>();
  for (let i = 0; i < keys.length; i += 200) {
    const { data, error } = await db
      .from("animals")
      .select("external_id, extra")
      .eq("organization_id", orgId)
      .in("external_id", keys.slice(i, i + 200));
    if (error) throw error;
    for (const r of (data ?? []) as Row[]) found.set(r.external_id, (r.extra ?? {}) as Record<string, unknown>);
  }
  return found;
}
