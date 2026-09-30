"use client";

import { createCustomFieldAction } from "@/modules/animals/custom-fields-actions";
import {
  importAnimalsAction,
  type ImportResult,
} from "@/modules/imports/actions";
import {
  FIELD_BY_KEY,
  IGNORE_VALUE,
  IMPORT_FIELDS,
  type ImportFieldKey,
} from "@/modules/imports/fields";
import {
  ColumnTarget,
  CustomFieldRef,
  MAX_IMPORT_ROWS,
  detectHeaderRow,
  distinctValues,
  extraTarget,
  isExtraTarget,
  mapRows,
  matrixToTable,
  missingRequiredColumns,
  suggestColumnMap,
  suggestExtraColumns,
  suggestValueMap,
  type ColumnMap,
  type ImportMapping,
  type SheetMatrix,
  type SheetRow,
  type ValueMap,
} from "@/modules/imports/mapping";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { ColumnMapper } from "./column-mapper";

type Step = "file" | "columns" | "values" | "review" | "done";

interface Sheet {
  fileName: string;
  matrix: SheetMatrix;
  startRowNumber: number;
  headerIndex: number;
  headers: string[];
  rows: SheetRow[];
  firstRowNumber: number;
}

function buildSheet(
  fileName: string,
  matrix: SheetMatrix,
  startRowNumber: number,
  headerIndex: number,
): Sheet {
  const table = matrixToTable(matrix, headerIndex, startRowNumber);
  return { fileName, matrix, startRowNumber, headerIndex, ...table };
}

async function readSpreadsheet(file: File): Promise<Sheet> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), {
    type: "array",
    cellDates: true,
  });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws || !ws["!ref"])
    throw new Error("A primeira aba da planilha está vazia.");
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: "",
    raw: false,
    blankrows: true,
  });
  const startRowNumber = XLSX.utils.decode_range(ws["!ref"]).s.r + 1;
  const sheet = buildSheet(
    file.name,
    matrix,
    startRowNumber,
    detectHeaderRow(matrix),
  );
  if (sheet.rows.length === 0)
    throw new Error("Não encontramos animais na planilha.");
  return sheet;
}

function rowPreview(row: unknown[] | undefined): string {
  const texts = (row ?? []).map((v) => String(v ?? "").trim()).filter(Boolean);
  if (texts.length === 0) return "(vazia)";
  return texts.slice(0, 5).join(" · ") + (texts.length > 5 ? " …" : "");
}

function initialColumnMap(
  headers: string[],
  saved: ImportMapping | null,
  customFields: CustomFieldRef[],
): ColumnMap {
  const valid = new Set(customFields.map((f) => extraTarget(f.key)));
  let merged: ColumnMap = suggestColumnMap(headers);
  if (saved) {
    for (const [target, column] of Object.entries(saved.columnMap) as [
      ColumnTarget,
      string,
    ][]) {
      if (!column || !headers.includes(column)) continue;
      if (isExtraTarget(target) && !valid.has(target)) continue;
      for (const [t, c] of Object.entries(merged) as [ColumnTarget, string][])
        if (c === column) delete merged[t];
      merged[target] = column;
    }
  }
  merged = suggestExtraColumns(headers, customFields, merged);
  return merged;
}

export function ImportWizard({
  slug,
  saved,
  customFields: initialCustomFields,
}: {
  slug: string;
  saved: ImportMapping | null;
  customFields: CustomFieldRef[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("file");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [columnMap, setColumnMap] = useState<ColumnMap>({});
  const [valueMap, setValueMap] = useState<ValueMap>(saved?.valueMap ?? {});
  const [customFields, setCustomFields] =
    useState<CustomFieldRef[]>(initialCustomFields);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [pending, startTransition] = useTransition();

  const valueFields = useMemo(
    () => IMPORT_FIELDS.filter((f) => f.kind !== "text" && columnMap[f.key]),
    [columnMap],
  );
  const preview = useMemo(
    () =>
      sheet && step === "review"
        ? mapRows(sheet.rows, { columnMap, valueMap }, sheet.firstRowNumber)
        : null,
    [sheet, step, columnMap, valueMap],
  );

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    try {
      const data = await readSpreadsheet(file);
      if (data.rows.length > MAX_IMPORT_ROWS)
        throw new Error(`Máximo de ${MAX_IMPORT_ROWS} linhas por importação.`);
      setSheet(data);
      setColumnMap(initialColumnMap(data.headers, saved, customFields));
      setStep("columns");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível ler o arquivo.",
      );
    }
  }

  function goToValues() {
    if (!sheet) return;
    const missing = missingRequiredColumns(columnMap);
    if (missing.length) {
      setError(
        `Escolha a coluna: ${missing.join(" e ")}.` +
          (!columnMap.external_id
            ? " Se a planilha não tem uma coluna de ID, crie uma (ex.: nº da ficha) antes de importar."
            : ""),
      );
      return;
    }
    setError(null);
    setValueMap(suggestValueMap(sheet.rows, columnMap, valueMap));
    setStep(
      IMPORT_FIELDS.some((f) => f.kind !== "text" && columnMap[f.key])
        ? "values"
        : "review",
    );
  }

  function runImport() {
    if (!sheet) return;
    const used = new Set(Object.values(columnMap).filter(Boolean) as string[]);
    const rows = sheet.rows.map((r) =>
      Object.fromEntries(Object.entries(r).filter(([k]) => used.has(k))),
    );
    startTransition(async () => {
      const res = await importAnimalsAction(slug, {
        fileName: sheet.fileName,
        rows,
        columnMap,
        valueMap,
        firstRowNumber: sheet.firstRowNumber,
      });
      setResult(res);
      setStep("done");
      router.refresh();
    });
  }

  return (
    <section className="card flex flex-col gap-5">
      <ol className="flex flex-wrap gap-2 text-xs">
        {(["file", "columns", "values", "review", "done"] as Step[]).map(
          (s, i) => (
            <li
              key={s}
              className={`rounded-pill px-3 py-1 ${step === s ? "bg-verde text-on-verde" : "bg-verde-50 text-tinta-suave"}`}
            >
              {i + 1}.{" "}
              {
                {
                  file: "Arquivo",
                  columns: "Colunas",
                  values: "Valores",
                  review: "Conferir",
                  done: "Pronto",
                }[s]
              }
            </li>
          ),
        )}
      </ol>

      {error && (
        <p className="rounded-md bg-erro-50 px-3 py-2 text-sm text-erro">
          {error}
        </p>
      )}

      {step === "file" && (
        <div className="flex flex-col gap-3">
          <label className="btn-primary w-fit cursor-pointer">
            Escolher planilha
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.ods"
              className="sr-only"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          <p className="text-sm text-tinta-suave">
            No Google Planilhas: Arquivo → Fazer download → Microsoft Excel
            (.xlsx). Usamos a primeira aba e encontramos sozinhos a linha com os
            títulos das colunas.{" "}
            <strong>A planilha precisa de uma coluna de ID</strong> (código
            único de cada animal), porque nomes podem se repetir.
          </p>
          {saved && (
            <p className="text-sm font-semibold text-verde">
              Encontramos as escolhas da última importação. Vamos
              reaproveitá-las.
            </p>
          )}
        </div>
      )}

      {step === "columns" && sheet && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2 rounded-md border-2 border-linha bg-papel p-4">
            <p className="text-tinta">
              Os <strong>títulos das colunas</strong> estão na linha{" "}
              <strong>{sheet.startRowNumber + sheet.headerIndex}</strong>:{" "}
              <span className="text-tinta-suave">
                {rowPreview(sheet.matrix[sheet.headerIndex])}
              </span>
            </p>
            <details className="text-sm">
              <summary className="cursor-pointer font-semibold text-verde">
                Não é essa linha? Escolher outra
              </summary>
              <label className="mt-2 flex flex-col gap-1">
                <span className="text-tinta-suave">
                  Em qual linha estão os títulos (ID, Nome…)?
                </span>
                <select
                  className="input"
                  value={sheet.headerIndex}
                  onChange={(e) => {
                    const next = buildSheet(
                      sheet.fileName,
                      sheet.matrix,
                      sheet.startRowNumber,
                      Number(e.target.value),
                    );
                    setSheet(next);
                    setColumnMap(
                      initialColumnMap(next.headers, saved, customFields),
                    );
                  }}
                >
                  {sheet.matrix.slice(0, 10).map((row, i) => (
                    <option key={i} value={i}>
                      Linha {sheet.startRowNumber + i}: {rowPreview(row)}
                    </option>
                  ))}
                </select>
              </label>
            </details>
          </div>
          <ColumnMapper
            headers={sheet.headers}
            rows={sheet.rows}
            firstRowNumber={sheet.firstRowNumber}
            columnMap={columnMap}
            onChange={setColumnMap}
            customFields={customFields}
            onCreateField={async (label) => {
              const res = await createCustomFieldAction(slug, label);
              if (!res.ok) return null;
              const field = { key: res.field.key, label: res.field.label };
              setCustomFields((list) =>
                list.some((f) => f.key === field.key) ? list : [...list, field],
              );
              return field;
            }}
          />
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => setStep("file")}>
              Trocar planilha
            </button>
            <button
              className="btn-primary"
              onClick={goToValues}
              disabled={!columnMap.external_id || !columnMap.name}
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {step === "values" && sheet && (
        <div className="flex flex-col gap-5">
          <p className="text-sm text-tinta-suave">
            Diga o que significa cada valor da planilha. Já preenchemos o que
            deu para adivinhar. Confira os que estão em destaque.
          </p>
          {valueFields.map((f) => {
            const values = distinctValues(sheet.rows, columnMap[f.key]!);
            const choices =
              f.kind === "boolean"
                ? [
                    { value: "true", label: "Sim" },
                    { value: "false", label: "Não" },
                  ]
                : (f.options ?? []);
            return (
              <fieldset key={f.key} className="flex flex-col gap-2">
                <legend className="mb-1 font-bold text-tinta">
                  {f.label}{" "}
                  <span className="text-sm font-normal text-tinta-suave">
                    (coluna “{columnMap[f.key]}”)
                  </span>
                </legend>
                {values.length === 0 && (
                  <p className="text-sm text-tinta-suave">Coluna vazia.</p>
                )}
                <div className="grid gap-2 sm:grid-cols-2">
                  {values.map((v) => {
                    const current = valueMap[f.key]?.[v.normalized] ?? "";
                    return (
                      <label
                        key={v.normalized}
                        className="flex items-center justify-between gap-2 text-sm"
                      >
                        <span className="truncate">
                          “{v.sample}”{" "}
                          <span className="text-tinta-suave">×{v.count}</span>
                        </span>
                        <select
                          className={`input w-44 ${current ? "" : "border-mel bg-mel-50"}`}
                          value={current}
                          onChange={(e) =>
                            setValueMap((m) => ({
                              ...m,
                              [f.key]: {
                                ...(m[f.key] ?? {}),
                                [v.normalized]: e.target.value,
                              },
                            }))
                          }
                        >
                          <option value="">Escolher…</option>
                          {choices.map((c) => (
                            <option key={c.value} value={c.value}>
                              {c.label}
                            </option>
                          ))}
                          <option value={IGNORE_VALUE}>Deixar em branco</option>
                        </select>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => setStep("columns")}
            >
              Voltar
            </button>
            <button className="btn-primary" onClick={() => setStep("review")}>
              Conferir
            </button>
          </div>
        </div>
      )}

      {step === "review" && preview && (
        <div className="flex flex-col gap-4">
          <p className="text-tinta">
            <strong>{preview.animals.length}</strong> animais prontos para
            importar
            {preview.errors.length > 0 && (
              <>
                {" "}
                · <strong className="text-erro">
                  {preview.errors.length}
                </strong>{" "}
                linhas com problema (serão puladas)
              </>
            )}
            .
          </p>
          <p className="text-sm text-tinta-suave">
            Animais com um ID que já existe na ONG serão{" "}
            <strong>atualizados</strong>; IDs novos viram cadastros novos.
          </p>
          {preview.errors.length > 0 && (
            <ul className="max-h-48 overflow-auto rounded-md bg-erro-50 px-4 py-2 text-sm text-erro">
              {preview.errors.map((e) => (
                <li key={e.row}>
                  Linha {e.row}
                  {e.key ? ` (${e.key})` : ""}: {e.messages.join("; ")}
                </li>
              ))}
            </ul>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-linha text-tinta-suave">
                  <th className="py-1 pr-3">Linha</th>
                  <th className="py-1 pr-3">ID</th>
                  {IMPORT_FIELDS.filter(
                    (f) => f.key !== "external_id" && columnMap[f.key],
                  ).map((f) => (
                    <th key={f.key} className="py-1 pr-3">
                      {f.label}
                    </th>
                  ))}
                </tr>
                {customFields
                  .filter((f) => columnMap[extraTarget(f.key)])
                  .map((f) => (
                    <th key={f.key} className="py-1 pr-3">
                      {f.label}
                    </th>
                  ))}
              </thead>
              <tbody>
                {preview.animals.slice(0, 8).map((a) => (
                  <tr key={a.row} className="border-b border-linha">
                    <td className="py-1 pr-3 text-tinta-suave">{a.row}</td>
                    <td className="py-1 pr-3 font-semibold">{a.external_id}</td>
                    {IMPORT_FIELDS.filter(
                      (f) => f.key !== "external_id" && columnMap[f.key],
                    ).map((f) => {
                      const v =
                        a.values[
                          f.key as Exclude<ImportFieldKey, "external_id">
                        ];
                      const def = FIELD_BY_KEY[f.key];
                      const label =
                        v === null || v === undefined
                          ? "—"
                          : typeof v === "boolean"
                            ? v
                              ? "Sim"
                              : "Não"
                            : (def.options?.find((o) => o.value === v)?.label ??
                              String(v));
                      return (
                        <td key={f.key} className="max-w-48 truncate py-1 pr-3">
                          {label}
                        </td>
                      );
                    })}
                    {customFields
                      .filter((f) => columnMap[extraTarget(f.key)])
                      .map((f) => (
                        <td key={f.key} className="max-w-48 truncate py-1 pr-3">
                          {a.extra?.[f.key] ?? "—"}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button
              className="btn-secondary"
              onClick={() => setStep(valueFields.length ? "values" : "columns")}
              disabled={pending}
            >
              Voltar
            </button>
            <button
              className="btn-primary"
              onClick={runImport}
              disabled={pending || preview.animals.length === 0}
            >
              {pending
                ? "Importando…"
                : `Importar ${preview.animals.length} animais`}
            </button>
          </div>
        </div>
      )}

      {step === "done" && result && (
        <div className="flex flex-col gap-3">
          {result.ok ? (
            <p className="rounded-md bg-verde-50 px-3 py-2 font-semibold text-verde">
              Pronto! {result.created} novos, {result.updated} atualizados
              {result.failed > 0 ? `, ${result.failed} com erro` : ""}. Suas
              escolhas ficaram salvas para a próxima vez.
            </p>
          ) : (
            <p className="rounded-md bg-erro-50 px-3 py-2 text-erro">
              {result.error}
            </p>
          )}
          <p className="text-sm text-tinta-suave">
            Próximo passo: abra cada animal e adicione as fotos.
          </p>
          <div>
            <button
              className="btn-secondary"
              onClick={() => {
                setSheet(null);
                setResult(null);
                setStep("file");
              }}
            >
              Importar outra planilha
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
