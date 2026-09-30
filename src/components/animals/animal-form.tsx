"use client";

import { Field, FormMessage, SubmitButton, fieldError, useSubmitWithoutReset } from "@/components/ui";
import { createAnimalAction, updateAnimalAction } from "@/modules/animals/actions";
import { CustomField } from "@/modules/animals/custom-fields";
import { AGE_LABEL, SEX_LABEL, SIZE_LABEL, SPECIES_LABEL, STATUS_LABEL, options } from "@/modules/animals/labels";
import type { Animal } from "@/modules/animals/types";
import { useActionState } from "react";

function TriSelect({ name, label, value }: { name: string; label: string; value: boolean | null | undefined }) {
  return (
    <Field label={label} name={name}>
      <select id={name} name={name} defaultValue={value === true ? "true" : value === false ? "false" : ""} className="input">
        <option value="">Não informado</option>
        <option value="true">Sim</option>
        <option value="false">Não</option>
      </select>
    </Field>
  );
}

function EnumSelect({
  name,
  label,
  items,
  value,
  empty,
  error,
}: {
  name: string;
  label: string;
  items: { value: string; label: string }[];
  value: string | null | undefined;
  empty?: string;
  error?: string;
}) {
  return (
    <Field label={label} name={name} error={error}>
      <select id={name} name={name} defaultValue={value ?? ""} className="input">
        {empty !== undefined && <option value="">{empty}</option>}
        {items.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

export function AnimalForm({ slug, animal, customFields = [] }: { slug: string; animal?: Animal; customFields?: CustomField[] }) {
  const [state, action, pending] = useActionState(animal ? updateAnimalAction : createAnimalAction, null);
  const onSubmit = useSubmitWithoutReset(action);
  const readOnlyHint = animal?.source === "import" ? "Veio da planilha: uma nova importação pode sobrescrever." : undefined;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <input type="hidden" name="slug" value={slug} />
      {animal && <input type="hidden" name="animalId" value={animal.id} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          label="ID do animal"
          name="externalId"
          error={fieldError(state, "externalId")}
          hint="Código único na ONG (nº da ficha, da planilha…). Nomes podem se repetir; o ID não."
        >
          <input id="externalId" name="externalId" required maxLength={40} defaultValue={animal?.externalId ?? ""} className="input" />
        </Field>
        <Field label="Nome" name="name" error={fieldError(state, "name")} hint={readOnlyHint}>
          <input id="name" name="name" required maxLength={80} defaultValue={animal?.name} className="input" />
        </Field>
        <EnumSelect name="species" label="Espécie" items={options(SPECIES_LABEL)} value={animal?.species ?? "dog"} />
        <EnumSelect name="sex" label="Sexo" items={options(SEX_LABEL)} value={animal?.sex ?? "unknown"} />
        <EnumSelect name="size" label="Porte" items={options(SIZE_LABEL)} value={animal?.size} empty="Não informado" />
        <EnumSelect name="ageGroup" label="Idade" items={options(AGE_LABEL)} value={animal?.ageGroup} empty="Não informado" />
        <EnumSelect name="status" label="Situação" items={options(STATUS_LABEL)} value={animal?.status ?? "available"} />
        <Field label="Raça" name="breed">
          <input id="breed" name="breed" maxLength={60} defaultValue={animal?.breed ?? ""} placeholder="SRD" className="input" />
        </Field>
        <Field label="Cor / pelagem" name="color">
          <input id="color" name="color" maxLength={60} defaultValue={animal?.color ?? ""} className="input" />
        </Field>
      </div>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 rotulo text-verde">Saúde</legend>
        <TriSelect name="neutered" label="Castrado(a)" value={animal?.neutered} />
        <TriSelect name="vaccinated" label="Vacinado(a)" value={animal?.vaccinated} />
        <TriSelect name="dewormed" label="Vermifugado(a)" value={animal?.dewormed} />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-3">
        <legend className="mb-2 rotulo text-verde">Convivência</legend>
        <TriSelect name="goodWithKids" label="Com crianças" value={animal?.goodWithKids} />
        <TriSelect name="goodWithDogs" label="Com cães" value={animal?.goodWithDogs} />
        <TriSelect name="goodWithCats" label="Com gatos" value={animal?.goodWithCats} />
      </fieldset>

      <Field label="História e personalidade" name="description" error={fieldError(state, "description")}>
        <textarea id="description" name="description" rows={5} maxLength={4000} defaultValue={animal?.description ?? ""} className="input" />
      </Field>
            {customFields.length > 0 && (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-semibold">Campos da ONG</legend>
          {customFields.map((f) => (
            <Field
              key={f.key}
              label={f.label}
              name={`extra_${f.key}`}
              hint={f.isPublic ? undefined : "Só a equipe vê (não aparece no catálogo)."}
            >
              <textarea
                id={`extra_${f.key}`}
                name={`extra_${f.key}`}
                rows={2}
                maxLength={2000}
                defaultValue={animal?.extra[f.key] ?? ""}
                className="input"
              />
            </Field>
          ))}
        </fieldset>
      )}
      <Field label="Necessidades especiais" name="specialNeeds">
        <textarea id="specialNeeds" name="specialNeeds" rows={2} maxLength={1000} defaultValue={animal?.specialNeeds ?? ""} className="input" />
      </Field>

      <div className="flex flex-col gap-3">
        <div>
          <SubmitButton className="btn-primary" pending={pending}>{animal ? "Salvar alterações" : "Cadastrar e adicionar fotos"}</SubmitButton>
        </div>
        <FormMessage state={state} />
      </div>
    </form>
  );
}
