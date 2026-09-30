"use server";

import { friendlyDbError } from "@/lib/errors";
import { requireOrgContext } from "@/modules/organizations/service";
import { revalidatePath } from "next/cache";
import { listCustomFields } from "../animals/custom-fields";
import { MAX_IMPORT_ROWS, mapRows, type ColumnMap, type MappedAnimal, type RowError, type SheetRow, type ValueMap } from "./mapping";
import { existingExternalIds, existingExtras, saveMapping } from "./repository";

const CHUNK = 200;

export interface ImportPayload {
  fileName: string;
  rows: SheetRow[];
  columnMap: ColumnMap;
  valueMap: ValueMap;
  firstRowNumber?: number;
}

export type ImportResult =
  | { ok: true; created: number; updated: number; failed: number; errors: RowError[] }
  | { ok: false; error: string };

export async function importAnimalsAction(slug: string, payload: ImportPayload): Promise<ImportResult> {
  const { db, org, userId } = await requireOrgContext(slug);
  if (!Array.isArray(payload.rows) || payload.rows.length === 0) return { ok: false, error: "Planilha vazia." };
  if (payload.rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `Máximo de ${MAX_IMPORT_ROWS} linhas por importação.` };
  }

  const mapping = { columnMap: payload.columnMap ?? {}, valueMap: payload.valueMap ?? {} };
  const firstRowNumber = Number.isInteger(payload.firstRowNumber) && payload.firstRowNumber! >= 2 ? payload.firstRowNumber! : 2;
  const { animals, errors } = mapRows(payload.rows, mapping, firstRowNumber);
  if (animals.length === 0) {
    return { ok: false, error: errors[0]?.messages.join("; ") ?? "Nenhuma linha válida." };
  }

  const mappingId = await saveMapping(db, org.id, userId, mapping);
  const existing = await existingExternalIds(db, org.id, animals.map((a) => a.external_id));

  
  const hasExtra = animals.some((a) => a.extra);
  const validKeys = hasExtra ? new Set((await listCustomFields(db, org.id)).map((f) => f.key)) : new Set<string>();
  const currentExtras = hasExtra ? await existingExtras(db, org.id, [...existing.keys()]) : new Map<string, Record<string, unknown>>();
  const mergedExtra = (a: MappedAnimal) => {
    const merged: Record<string, unknown> = { ...(currentExtras.get(a.external_id) ?? {}) };
    for (const [key, value] of Object.entries(a.extra ?? {})) {
      if (!validKeys.has(key)) continue;
      if (value === null) delete merged[key];
      else merged[key] = value;
    }
    return merged;
  };
  
  const groups = new Map<string, MappedAnimal[]>();
  for (const a of animals) {
    const signature = [...Object.keys(a.values).sort(), a.extra ? "extra" : ""].join(",");
    groups.set(signature, [...(groups.get(signature) ?? []), a]);
  }

  const failed: RowError[] = [...errors];
  let created = 0;
  let updated = 0;

  for (const group of groups.values()) {
    for (let i = 0; i < group.length; i += CHUNK) {
      const batch = group.slice(i, i + CHUNK);
      const rows = batch.map((a) => ({
        ...a.values,
        ...(a.extra ? { extra: mergedExtra(a) } : {}),
        organization_id: org.id,
        external_id: a.external_id,
        source: "import",
      }));
      const { error } = await db
        .from("animals")
        .upsert(rows, { onConflict: "organization_id,external_id", defaultToNull: false });
      if (error) {
        for (const a of batch) {
          failed.push({ row: a.row, key: String(a.values.name ?? ""), messages: [friendlyDbError(error)] });
        }
        continue;
      }
      for (const a of batch) {
        if (existing.has(a.external_id)) updated += 1;
        else created += 1;
      }
    }
  }

  const updatedEvents = animals
    .filter((a) => existing.has(a.external_id) && !failed.some((f) => f.row === a.row))
    .map((a) => ({
      organization_id: org.id,
      animal_id: existing.get(a.external_id)!,
      type: "imported",
      payload: { file: payload.fileName, row: a.row },
      actor_id: userId,
    }));
  for (let i = 0; i < updatedEvents.length; i += CHUNK) {
    await db.from("animal_events").insert(updatedEvents.slice(i, i + CHUNK));
  }

  failed.sort((a, b) => a.row - b.row);
  const { error: runError } = await db.from("import_runs").insert({
    organization_id: org.id,
    mapping_id: mappingId,
    kind: "file",
    file_name: payload.fileName.slice(0, 200),
    total_rows: payload.rows.length,
    created_count: created,
    updated_count: updated,
    failed_count: failed.length,
    errors: failed.slice(0, 500),
    created_by: userId,
  });
  if (runError) console.error("import_runs", runError);

  revalidatePath(`/painel/${slug}`, "layout");
  revalidatePath(`/${slug}`, "layout");
  return { ok: true, created, updated, failed: failed.length, errors: failed };
}