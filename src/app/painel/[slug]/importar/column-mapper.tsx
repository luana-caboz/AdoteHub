"use client";

import { IMPORT_FIELDS } from "@/modules/imports/fields";
import {
  assignColumn,
  checkIdColumn,
  countFilled,
  extraTarget,
  isExtraTarget,
  sampleValues,
  type ColumnMap,
  type ColumnTarget,
  type CustomFieldRef,
  type SheetRow,
} from "@/modules/imports/mapping";
import { useMemo, useState } from "react";

const NEW_FIELD = "__novo_campo__";

interface Props {
  headers: string[];
  rows: SheetRow[];
  firstRowNumber: number;
  columnMap: ColumnMap;
  onChange: (next: ColumnMap) => void;
  customFields: CustomFieldRef[];
  onCreateField: (label: string) => Promise<CustomFieldRef | null>;
}

interface ColumnInfo {
  header: string;
  samples: string[];
  filled: number;
}

const OPTIONAL_FIELDS = IMPORT_FIELDS.filter((f) => f.key !== "external_id" && f.key !== "name");

export function ColumnMapper({ headers, rows, firstRowNumber, columnMap, onChange, customFields, onCreateField }: Props) {
  const [creating, setCreating] = useState<string | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const columns: ColumnInfo[] = useMemo(
    () => headers.map((header) => ({ header, samples: sampleValues(rows, header), filled: countFilled(rows, header) })),
    [headers, rows],
  );
  const visible = columns.filter((c) => c.filled > 0);
  const hiddenCount = columns.length - visible.length;

  const idColumn = columnMap.external_id;
  const nameColumn = columnMap.name;
  const idCheck = useMemo(
    () => (idColumn ? checkIdColumn(rows, idColumn, firstRowNumber) : null),
    [rows, idColumn, firstRowNumber],
  );
  const fieldOfColumn = (header: string) =>
    (Object.entries(columnMap) as [ColumnTarget, string][]).find(([, c]) => c === header)?.[0];

  async function chooseForColumn(header: string, value: string) {
    setCreateError(null);
    if (value !== NEW_FIELD) {
      onChange(assignColumn(columnMap, header, (value || null) as ColumnTarget | null));
      return;
    }
    setCreating(header);
    const field = await onCreateField(header);
    setCreating(null);
    if (!field) {
      setCreateError(`Não foi possível criar o campo “${header}”. Tente de novo.`);
      return;
    }
    onChange(assignColumn(columnMap, header, extraTarget(field.key)));
  }

  const labelOf = (target: ColumnTarget) =>
    isExtraTarget(target)
      ? customFields.find((f) => extraTarget(f.key) === target)?.label ?? "Campo extra"
      : IMPORT_FIELDS.find((f) => f.key === target)?.label ?? target;

  const others = visible.filter((c) => c.header !== idColumn && c.header !== nameColumn);

  return (
    <div className="flex flex-col gap-8">
      <p className="text-base text-tinta-suave">
        Sua planilha tem <strong className="text-tinta">{countRows(rows)} animais</strong>. Vamos mostrar cada coluna com
        alguns exemplos do que tem nela. É só clicar.
        {hiddenCount > 0 && ` (${hiddenCount} coluna${hiddenCount > 1 ? "s" : ""} vazia${hiddenCount > 1 ? "s" : ""} foi escondida${hiddenCount > 1 ? "s" : ""}.)`}
      </p>

      <Question
        number={1}
        title="Qual coluna tem o número (ID) de cada animal?"
        help="É o código que a ONG usa para identificar o animal: nº da ficha, registro, código. Cada animal tem um diferente."
      >
        <ColumnChoices
          columns={visible}
          selected={idColumn}
          disabled={nameColumn ? [nameColumn] : []}
          onSelect={(h) => onChange(assignColumn(columnMap, h, "external_id"))}
        />
        {idCheck && <IdCheckMessage check={idCheck} />}
        <details className="text-sm text-tinta-suave">
          <summary className="cursor-pointer font-semibold text-verde">Minha planilha não tem uma coluna de ID</summary>
          <p className="mt-2 max-w-prose">
            Abra a planilha, crie uma coluna chamada <strong>ID</strong> e numere os animais (1, 2, 3…). Use sempre o
            mesmo número para o mesmo animal. Depois salve e envie a planilha de novo.
          </p>
        </details>
      </Question>

      {idColumn && (
        <Question number={2} title="Qual coluna tem o nome do animal?">
          <ColumnChoices
            columns={visible}
            selected={nameColumn}
            disabled={[idColumn]}
            onSelect={(h) => onChange(assignColumn(columnMap, h, "name"))}
          />
        </Question>
      )}

      {idColumn && nameColumn && others.length > 0 && (
        <Question
          number={3}
          title="E as outras colunas, o que elas têm?"
          help="Escolha o que cada coluna tem. Se a informação é útil mas não está na lista (como Personalidade), escolha “Criar campo”. Deixe “Não usar” para dados de controle e, principalmente, dados de quem adotou (nome, contato, termo): esses não devem ir para o catálogo."
        >
          {createError && <p className="rounded-xl bg-erro-50 px-4 py-3 text-sm text-erro">{createError}</p>}
          <ul className="flex flex-col gap-3">
            {others.map((c) => {
              const current = fieldOfColumn(c.header) ?? "";
              const selectId = `col-${slugId(c.header)}`;
              return (
                <li
                  key={c.header}
                  className={`flex flex-col gap-3 rounded-2xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between ${
                    current ? "border-verde bg-verde-50" : "border-linha bg-papel"
                  }`}
                >
                  <div className="min-w-0">
                    <label htmlFor={selectId} className="block font-bold text-tinta">
                      {c.header}
                    </label>
                    <p className="truncate text-sm text-tinta-suave">Ex.: {c.samples.join(" · ")}</p>
                  </div>
                  <div className="flex flex-col gap-1 sm:w-72">
                    <select
                      id={selectId}
                      className="input"
                      value={current}
                      disabled={creating === c.header}
                      onChange={(e) => chooseForColumn(c.header, e.target.value)}
                    >
                      <option value="">Não usar</option>
                      <optgroup label="Informações do AdoteHub">
                        {OPTIONAL_FIELDS.map((f) => {
                          const usedBy = columnMap[f.key];
                          const taken = usedBy && usedBy !== c.header;
                          return (
                            <option key={f.key} value={f.key} disabled={Boolean(taken)}>
                              {f.label}
                              {taken ? ` (já está em “${usedBy}”)` : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                      {customFields.length > 0 && (
                        <optgroup label="Campos criados pela ONG">
                          {customFields.map((f) => {
                            const target = extraTarget(f.key);
                            const usedBy = columnMap[target];
                            const taken = usedBy && usedBy !== c.header;
                            return (
                              <option key={f.key} value={target} disabled={Boolean(taken)}>
                                {f.label}
                                {taken ? ` (já está em “${usedBy}”)` : ""}
                              </option>
                            );
                          })}
                        </optgroup>
                      )}
                      {!customFields.some((f) => f.label.toLowerCase() === c.header.toLowerCase()) && (
                        <option value={NEW_FIELD}>＋ Criar campo “{c.header}”</option>
                      )}
                    </select>
                    {creating === c.header && <span className="text-xs text-tinta-suave">Criando campo…</span>}
                    {current && isExtraTarget(current) && (
                      <span className="text-xs text-verde">Campo da ONG: {labelOf(current)}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </Question>
      )}
    </div>
  );
}

function Question({
  number,
  title,
  help,
  children,
}: {
  number: number;
  title: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`q${number}`}>
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-verde font-bold text-white">
          {number}
        </span>
        <div>
          <h3 id={`q${number}`} className="text-lg font-bold text-tinta">
            {title}
          </h3>
          {help && <p className="max-w-prose text-sm text-tinta-suave">{help}</p>}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:pl-11">{children}</div>
    </section>
  );
}

function ColumnChoices({
  columns,
  selected,
  disabled,
  onSelect,
}: {
  columns: ColumnInfo[];
  selected?: string;
  disabled: string[];
  onSelect: (header: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup">
      {columns.map((c) => {
        const isSelected = c.header === selected;
        const isDisabled = disabled.includes(c.header);
        return (
          <button
            key={c.header}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={isDisabled}
            onClick={() => onSelect(c.header)}
            className={`flex min-w-0 flex-col gap-1 rounded-2xl border-2 p-4 text-left transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-verde disabled:cursor-not-allowed disabled:opacity-40 ${
              isSelected ? "border-verde bg-verde-50" : "border-linha bg-papel hover:border-verde"
            }`}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="truncate font-bold text-tinta">{c.header}</span>
              {isSelected && <span className="flex-none text-sm font-bold text-verde">✓ Escolhida</span>}
            </span>
            <span className="truncate text-sm text-tinta-suave">Ex.: {c.samples.join(" · ")}</span>
          </button>
        );
      })}
    </div>
  );
}

function IdCheckMessage({ check }: { check: ReturnType<typeof checkIdColumn> }) {
  const ok = check.emptyRows.length === 0 && check.duplicates.length === 0;
  if (ok) {
    return (
      <p className="rounded-xl bg-verde-50 px-4 py-3 text-sm font-semibold text-verde">
        ✓ Ótimo: os {check.total} animais têm um ID e nenhum se repete.
      </p>
    );
  }
  return (
    <div className="rounded-xl bg-mel-50 px-4 py-3 text-sm text-mel">
      <p className="font-bold">Esta coluna tem problemas. Essas linhas não serão importadas:</p>
      <ul className="mt-1 list-disc pl-5">
        {check.emptyRows.length > 0 && (
          <li>
            {check.emptyRows.length === 1 ? "A linha" : "As linhas"} {listRows(check.emptyRows)} {check.emptyRows.length === 1 ? "está" : "estão"} sem ID.
          </li>
        )}
        {check.duplicates.slice(0, 5).map((d) => (
          <li key={d.value}>
            O ID “{d.value}” aparece nas linhas {listRows(d.rows)}.
          </li>
        ))}
        {check.duplicates.length > 5 && <li>E mais {check.duplicates.length - 5} IDs repetidos.</li>}
      </ul>
      <p className="mt-2">
        Se esta não é a coluna certa, escolha outra acima. Se for, corrija a planilha e envie de novo, ou siga assim e
        importe só as linhas certas.
      </p>
    </div>
  );
}

function countRows(rows: SheetRow[]) {
  return rows.filter((r) => Object.values(r).some((v) => String(v ?? "").trim() !== "")).length;
}

function listRows(rows: number[]) {
  const shown = rows.slice(0, 6).join(", ");
  return rows.length > 6 ? `${shown} e mais ${rows.length - 6}` : shown;
}

function slugId(text: string) {
  return text.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
}