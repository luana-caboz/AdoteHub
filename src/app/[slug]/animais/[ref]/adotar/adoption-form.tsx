"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, fieldError, useSubmitWithoutReset } from "@/components/ui";
import { submitApplicationAction } from "@/modules/applications/actions";
import {
  CONSENT_MATCHING_TEXT,
  CONSENT_ORG_TEXT,
  HOURS_ALONE,
  HOUSING_OWNERSHIP,
  HOUSING_TYPE,
  WINDOW_SCREENS,
} from "@/modules/applications/form";
import type { ExtraQuestion } from "@/modules/organizations/types";

function Radios({ name, items, error }: { name: string; items: Record<string, string>; error?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap gap-2">
        {Object.entries(items).map(([value, label]) => (
          <label key={value} className={`flex cursor-pointer items-center gap-2 rounded-md border-[1.5px] bg-papel px-4 py-2.5 text-sm font-semibold has-[:checked]:border-brand has-[:checked]:bg-[color-mix(in_srgb,var(--color-brand)_12%,white)] has-[:checked]:text-brand has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco ${error ? "border-erro" : "border-linha"}`}>
            <input type="radio" name={name} value={value} className="sr-only" />
            {label}
          </label>
        ))}
      </div>
      {error && <p className="text-sm font-semibold text-erro">{error}</p>}
    </div>
  );
}

const YES_NO = { true: "Sim", false: "Não" };

function Question({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-bold text-tinta">{label}</legend>
      {children}
    </fieldset>
  );
}

export function AdoptionForm({
  orgSlug,
  orgName,
  animalCode,
  extraQuestions,
}: {
  orgSlug: string;
  orgName: string;
  animalCode: string;
  extraQuestions: ExtraQuestion[];
}) {
  const [state, action, pending] = useActionState(submitApplicationAction, null);
  const onSubmit = useSubmitWithoutReset(action);
  const err = (n: string) => fieldError(state, n);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-8" noValidate>
      <input type="hidden" name="orgSlug" value={orgSlug} />
      <input type="hidden" name="animalCode" value={animalCode} />
      <div aria-hidden className="absolute -left-[9999px] h-0 overflow-hidden">
        <label>
          Site <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <section className="card flex flex-col gap-4">
        <h2 className="titulo-card text-brand">Seus dados</h2>
        <Field label="Nome completo" name="name" error={err("name")}>
          <input id="name" name="name" autoComplete="name" required className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="E-mail" name="email" error={err("email")}>
            <input id="email" name="email" type="email" autoComplete="email" required className="input" />
          </Field>
          <Field label="WhatsApp (com DDD)" name="phone" error={err("phone")}>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-[1fr_5rem] gap-2">
          <Field label="Cidade" name="city" error={err("city")}>
            <input id="city" name="city" autoComplete="address-level2" required className="input" />
          </Field>
          <Field label="UF" name="state" error={err("state")}>
            <input id="state" name="state" maxLength={2} autoComplete="address-level1" required className="input uppercase" />
          </Field>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="adult" className="mt-0.5 h-5 w-5 flex-none accent-brand" />
          <span>Tenho 18 anos ou mais.</span>
        </label>
        {err("adult") && <p className="text-sm font-semibold text-erro">{err("adult")}</p>}
      </section>

      <section className="card flex flex-col gap-5">
        <h2 className="titulo-card text-brand">Sua casa e rotina</h2>
        <Question label="Você mora em">
          <Radios name="housing_type" items={HOUSING_TYPE} error={err("housing_type")} />
        </Question>
        <Question label="A moradia é">
          <Radios name="housing_ownership" items={HOUSING_OWNERSHIP} error={err("housing_ownership")} />
        </Question>
        <Question label="Tem quintal ou área externa?">
          <Radios name="has_yard" items={YES_NO} error={err("has_yard")} />
        </Question>
        <Question label="As janelas e sacadas têm tela de proteção?">
          <Radios name="has_window_screens" items={WINDOW_SCREENS} error={err("has_window_screens")} />
        </Question>
        <Field label="Tem outros animais? Quais? (deixe em branco se não tiver)" name="other_animals" error={err("other_animals")}>
          <input id="other_animals" name="other_animals" className="input" />
        </Field>
        <Question label="Há crianças na casa?">
          <Radios name="has_children" items={YES_NO} error={err("has_children")} />
        </Question>
        <Field label="Se sim, quais idades?" name="children_ages">
          <input id="children_ages" name="children_ages" className="input" />
        </Field>
        <Question label="Todos que moram com você concordam com a adoção?">
          <Radios name="household_agrees" items={YES_NO} error={err("household_agrees")} />
        </Question>
        <Question label="Quanto tempo o animal ficaria sozinho por dia?">
          <Radios name="hours_alone" items={HOURS_ALONE} error={err("hours_alone")} />
        </Question>
        <Field label="Por que você quer adotar?" name="motivation" error={err("motivation")}>
          <textarea id="motivation" name="motivation" rows={4} required className="input" />
        </Field>
      </section>

      {extraQuestions.length > 0 && (
        <section className="card flex flex-col gap-4">
          <h2 className="titulo-card text-brand">Perguntas da {orgName}</h2>
          {extraQuestions.map((q) => (
            <Field key={q.id} label={`${q.label}${q.required ? " *" : ""}`} name={`extra_${q.id}`} error={err(`extra_${q.id}`)}>
              <textarea id={`extra_${q.id}`} name={`extra_${q.id}`} rows={2} className="input" />
            </Field>
          ))}
        </section>
      )}

      <section className="flex flex-col gap-3">
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consentOrg" className="mt-0.5 h-5 w-5 flex-none accent-brand" />
          <span>{CONSENT_ORG_TEXT(orgName)} (obrigatório)</span>
        </label>
        {err("consentOrg") && <p className="text-sm font-semibold text-erro">{err("consentOrg")}</p>}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" name="consentMatching" className="mt-0.5 h-5 w-5 flex-none accent-brand" />
          <span>{CONSENT_MATCHING_TEXT}</span>
        </label>
      </section>

      <div className="flex flex-col gap-3">
        <FormMessage state={state} />
        <SubmitButton className="btn-brand" pendingText="Enviando…" pending={pending}>
          Enviar candidatura
        </SubmitButton>
      </div>
    </form>
  );
}
