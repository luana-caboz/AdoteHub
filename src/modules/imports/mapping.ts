import { FIELD_BY_KEY, IGNORE_VALUE, IMPORT_FIELDS, type ImportFieldKey } from "./fields.ts";

export const MAX_IMPORT_ROWS = 2000;

export type SheetRow = Record<string, unknown>;
export type ExtraTarget = `extra.${string}`;
export type ColumnTarget = ImportFieldKey | ExtraTarget;
export type ColumnMap = Partial<Record<ColumnTarget, string>>;

export const EXTRA_PREFIX = "extra.";
export const isExtraTarget = (t: string): t is ExtraTarget => t.startsWith(EXTRA_PREFIX);
export const extraTarget = (key: string): ExtraTarget => `extra.${key}`;

export interface CustomFieldRef {
  key: string;
  label: string;
}

export type ValueMap = Partial<Record<ImportFieldKey, Record<string, string>>>;

export interface ImportMapping {
  columnMap: ColumnMap;
  valueMap: ValueMap;
}

export interface MappedAnimal {
  row: number;
  external_id: string;
  values: Partial<Record<Exclude<ImportFieldKey, "external_id">, string | boolean | null>>;
  extra?: Record<string, string | null>;
}

export interface RowError {
  row: number;
  key?: string;
  messages: string[];
}

export interface MapResult {
  animals: MappedAnimal[];
  errors: RowError[];
}

export function normalize(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

export function normalizeHeader(value: unknown): string {
  return normalize(value)
    .replace(/\([^)]*\)/g, " ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function suggestColumnMap(headers: string[]): ColumnMap {
  const map: ColumnMap = {};
  const used = new Set<string>();
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));

  for (const strategy of ["exact", "prefix"] as const) {
    for (const field of IMPORT_FIELDS) {
      if (map[field.key]) continue;
      for (const synonym of field.synonyms) {
        const hit = normalized.find(
          (h) =>
            !used.has(h.raw) &&
            (strategy === "exact" ? h.norm === synonym : synonym.length >= 4 && h.norm.startsWith(`${synonym} `)),
        );
        if (hit) {
          map[field.key] = hit.raw;
          used.add(hit.raw);
          break;
        }
      }
    }
  }
  return map;
}

export type SheetMatrix = unknown[][];

export function detectHeaderRow(matrix: SheetMatrix, scan = 15): number {
  let best = 0;
  let bestScore = -1;
  matrix.slice(0, scan).forEach((row, index) => {
    const texts = row.map((v) => cellText(v)).filter((v) => v !== "");
    const score = texts.filter((t) => t.length <= 60 && !/^[\d\s.,/:-]+$/.test(t)).length;
    if (score > bestScore) {
      best = index;
      bestScore = score;
    }
  });
  return best;
}

export interface SheetTable {
  headers: string[];
  rows: SheetRow[];
  firstRowNumber: number;
}

export function matrixToTable(matrix: SheetMatrix, headerIndex: number, startRowNumber = 1): SheetTable {
  const headerRow = matrix[headerIndex] ?? [];
  let width = headerRow.length;
  for (const r of matrix.slice(headerIndex + 1)) width = Math.max(width, r.length);
  const seen = new Map<string, number>();
  const headers: string[] = [];
  for (let c = 0; c < width; c++) {
    let title = cellText(headerRow[c]) || `Coluna ${columnLetter(c)}`;
    const count = (seen.get(title) ?? 0) + 1;
    seen.set(title, count);
    if (count > 1) title = `${title} (${count})`;
    headers.push(title);
  }
  let body = matrix.slice(headerIndex + 1);
  while (body.length && body[body.length - 1].every((v) => cellText(v) === "")) body = body.slice(0, -1);
  const rows = body.map((r) => Object.fromEntries(headers.map((h, c) => [h, r[c] ?? ""])));
  const useful = headers.filter(
    (h, c) => cellText(headerRow[c]) !== "" || rows.some((row) => cellText(row[h]) !== ""),
  );
  return {
    headers: useful,
    rows: rows.map((row) => Object.fromEntries(useful.map((h) => [h, row[h]]))),
    firstRowNumber: startRowNumber + headerIndex + 1,
  };
}

function columnLetter(index: number): string {
  let n = index + 1;
  let out = "";
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

export interface DistinctValue {
  normalized: string;
  sample: string;
  count: number;
}

export function distinctValues(rows: SheetRow[], column: string): DistinctValue[] {
  const acc = new Map<string, DistinctValue>();
  for (const row of rows) {
    const sample = cellText(row[column]);
    const norm = normalize(sample);
    if (!norm) continue;
    const item = acc.get(norm);
    if (item) item.count += 1;
    else acc.set(norm, { normalized: norm, sample, count: 1 });
  }
  return [...acc.values()].sort((a, b) => b.count - a.count || a.normalized.localeCompare(b.normalized));
}

const DEFAULT_ENUM_VALUES: Partial<Record<ImportFieldKey, Record<string, string>>> = {
  species: {
    cachorro: "dog", cachorra: "dog", cao: "dog", cadela: "dog", canino: "dog", canina: "dog", dog: "dog", c: "dog",
    gato: "cat", gata: "cat", felino: "cat", felina: "cat", cat: "cat", g: "cat",
  },
  sex: {
    macho: "male", m: "male", masculino: "male", male: "male",
    femea: "female", f: "female", feminino: "female", female: "female",
  },
  size: {
    pequeno: "small", pequena: "small", p: "small", mini: "small", "porte pequeno": "small",
    medio: "medium", media: "medium", m: "medium", "porte medio": "medium",
    grande: "large", g: "large", gigante: "large", "porte grande": "large",
  },
  age_group: {
    filhote: "puppy", bebe: "puppy",
    jovem: "young",
    adulto: "adult", adulta: "adult",
    idoso: "senior", idosa: "senior", senior: "senior", velhinho: "senior", velhinha: "senior",
  },
  status: {
    disponivel: "available", "para adocao": "available", "disponivel para adocao": "available", sim: "available",
    reservado: "reserved", reservada: "reserved", "em processo": "reserved", "em adocao": "reserved",
    "em processo de adocao": "reserved",
    adotado: "adopted", adotada: "adopted",
    indisponivel: "unavailable", "em tratamento": "unavailable", nao: "unavailable",
  },
};

const TRUE_WORDS = new Set(["sim", "s", "yes", "y", "x", "ok", "true", "1", "verdadeiro"]);
const FALSE_WORDS = new Set(["nao", "n", "no", "false", "0", "falso", "-"]);
const UNKNOWN_WORDS = new Set(["nao testado", "nao sei", "nao informado", "?", "a testar", "sem informacao", "desconhecido"]);

export function ageGroupFromText(norm: string): string | undefined {
  const m = /(\d+(?:[.,]\d+)?)\s*(mes|meses|m\b|ano|anos|a\b)/.exec(norm);
  if (!m) return undefined;
  const n = parseFloat(m[1].replace(",", "."));
  const years = m[2].startsWith("m") ? n / 12 : n;
  if (years < 1) return "puppy";
  if (years < 3) return "young";
  if (years < 8) return "adult";
  return "senior";
}

export function suggestValue(field: ImportFieldKey, normalized: string): string | undefined {
  const def = FIELD_BY_KEY[field];
  if (def.kind === "boolean") {
    if (TRUE_WORDS.has(normalized)) return "true";
    if (FALSE_WORDS.has(normalized)) return "false";
    if (UNKNOWN_WORDS.has(normalized)) return IGNORE_VALUE;
    if (def.synonyms.some((s) => normalized.startsWith(s.slice(0, 6)))) return "true";
    return undefined;
  }
  if (def.kind !== "enum") return undefined;
  const direct = DEFAULT_ENUM_VALUES[field]?.[normalized];
  if (direct) return direct;
  if (field === "age_group") return ageGroupFromText(normalized);
  return undefined;
}

export function suggestValueMap(rows: SheetRow[], columnMap: ColumnMap, saved: ValueMap = {}): ValueMap {
  const result: ValueMap = {};
  for (const field of IMPORT_FIELDS) {
    if (field.kind === "text") continue;
    const column = columnMap[field.key];
    if (!column) continue;
    const current: Record<string, string> = { ...(saved[field.key] ?? {}) };
    for (const { normalized } of distinctValues(rows, column)) {
      if (current[normalized]) continue;
      const suggestion = suggestValue(field.key, normalized);
      if (suggestion) current[normalized] = suggestion;
    }
    result[field.key] = current;
  }
  return result;
}

export function unmappedValues(rows: SheetRow[], mapping: ImportMapping): Partial<Record<ImportFieldKey, DistinctValue[]>> {
  const out: Partial<Record<ImportFieldKey, DistinctValue[]>> = {};
  for (const field of IMPORT_FIELDS) {
    if (field.kind === "text") continue;
    const column = mapping.columnMap[field.key];
    if (!column) continue;
    const map = mapping.valueMap[field.key] ?? {};
    const missing = distinctValues(rows, column).filter((v) => !map[v.normalized]);
    if (missing.length) out[field.key] = missing;
  }
  return out;
}

export function missingRequiredColumns(columnMap: ColumnMap): string[] {
  return IMPORT_FIELDS.filter((f) => f.required && !columnMap[f.key]).map((f) => f.label);
}

export function mapRows(rows: SheetRow[], mapping: ImportMapping, firstRowNumber = 2): MapResult {
  const { columnMap, valueMap } = mapping;
  const animals: MappedAnimal[] = [];
  const errors: RowError[] = [];
  const seenKeys = new Map<string, number>();

  const missing = missingRequiredColumns(columnMap);
  if (missing.length) {
    return { animals, errors: [{ row: firstRowNumber - 1, messages: missing.map((label) => `Escolha a coluna "${label}".`) }] };
  }
  const idColumn = columnMap.external_id!;

  rows.forEach((row, index) => {
    const rowNumber = index + firstRowNumber;
    const messages: string[] = [];
    const values: MappedAnimal["values"] = {};
    let animalExtra: MappedAnimal["extra"];

    if (Object.values(row).every((v) => cellText(v) === "")) return;

    for (const field of IMPORT_FIELDS) {
      if (field.key === "external_id") continue;
      const column = columnMap[field.key];
      if (!column) continue;
      const raw = cellText(row[column]);
      const key = field.key as Exclude<ImportFieldKey, "external_id">;

      if (field.kind === "text") {
        values[key] = raw === "" ? null : raw;
        continue;
      }

      const norm = normalize(raw);
      if (norm === "") {
        values[key] = null;
        continue;
      }
      const mapped = valueMap[field.key]?.[norm] ?? suggestValue(field.key, norm);
      if (!mapped) {
        messages.push(`${field.label}: valor "${raw}" sem correspondência`);
        continue;
      }
      if (mapped === IGNORE_VALUE) {
        values[key] = null;
      } else if (field.kind === "boolean") {
        values[key] = mapped === "true";
      } else {
        values[key] = mapped;
      }
    }

    const name = values.name;
    if (typeof name !== "string" || name.length === 0) {
      messages.push("Nome vazio");
    } else if (name.length > 80) {
      messages.push("Nome com mais de 80 caracteres");
    }

    const extraEntries = (Object.entries(columnMap) as [ColumnTarget, string][]).filter(([t]) => isExtraTarget(t));
    if (extraEntries.length) {
      const extra: Record<string, string | null> = {};
      for (const [target, column] of extraEntries) {
        const text = cellText(row[column]);
        extra[target.slice(EXTRA_PREFIX.length)] = text === "" ? null : text.slice(0, 2000);
      }
      animalExtra = extra;
    }

    for (const k of ["species", "sex", "status"] as const) {
      if (values[k] === null) delete values[k];
    }

    const externalId = cellText(row[idColumn]);
    if (!externalId) {
      messages.push("ID vazio");
    } else if (externalId.length > 40) {
      messages.push("ID com mais de 40 caracteres");
    } else {
      const firstRow = seenKeys.get(externalId);
      if (firstRow !== undefined) messages.push(`ID "${externalId}" repetido (também na linha ${firstRow})`);
      else seenKeys.set(externalId, rowNumber);
    }

    if (messages.length) {
      errors.push({ row: rowNumber, key: typeof name === "string" ? name : undefined, messages });
    } else {
      animals.push(
        animalExtra
          ? { row: rowNumber, external_id: externalId, values, extra: animalExtra }
          : { row: rowNumber, external_id: externalId, values },
      );
    }
  });

  return { animals, errors };
}

function isBlankRow(row: SheetRow): boolean {
  return Object.values(row).every((v) => cellText(v) === "");
}

export function sampleValues(rows: SheetRow[], column: string, limit = 3, maxLength = 40): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const row of rows) {
    const text = cellText(row[column]);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    out.push(text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text);
    if (out.length >= limit) break;
  }
  return out;
}

export function countFilled(rows: SheetRow[], column: string): number {
  return rows.filter((r) => !isBlankRow(r) && cellText(r[column]) !== "").length;
}

export interface IdColumnCheck {
  total: number;
  emptyRows: number[];
  duplicates: { value: string; rows: number[] }[];
}

export function checkIdColumn(rows: SheetRow[], column: string, firstRowNumber = 2): IdColumnCheck {
  const byValue = new Map<string, number[]>();
  const emptyRows: number[] = [];
  let total = 0;
  rows.forEach((row, index) => {
    if (isBlankRow(row)) return;
    total += 1;
    const rowNumber = index + firstRowNumber;
    const value = cellText(row[column]);
    if (!value) emptyRows.push(rowNumber);
    else byValue.set(value, [...(byValue.get(value) ?? []), rowNumber]);
  });
  const duplicates = [...byValue.entries()]
    .filter(([, list]) => list.length > 1)
    .map(([value, list]) => ({ value, rows: list }));
  return { total, emptyRows, duplicates };
}

export function assignColumn(columnMap: ColumnMap, column: string, field: ColumnTarget | null): ColumnMap {
  const next: ColumnMap = {};
  for (const [f, c] of Object.entries(columnMap) as [ColumnTarget, string][]) {
    if (c !== column && f !== field) next[f] = c;
  }
  if (field) next[field] = column;
  return next;
}

export function suggestExtraColumns(headers: string[], fields: CustomFieldRef[], columnMap: ColumnMap): ColumnMap {
  const next: ColumnMap = { ...columnMap };
  const used = new Set(Object.values(next));
  for (const field of fields) {
    const target = extraTarget(field.key);
    if (next[target]) continue;
    const hit = headers.find((h) => !used.has(h) && normalizeHeader(h) === normalizeHeader(field.label));
    if (hit) {
      next[target] = hit;
      used.add(hit);
    }
  }
  return next;
}

export function customFieldKey(label: string, taken: string[] = []): string {
  const base = normalizeHeader(label).replace(/ /g, "_").slice(0, 36) || "campo";
  let key = base;
  let n = 2;
  while (taken.includes(key)) key = `${base}_${n++}`;
  return key;
}