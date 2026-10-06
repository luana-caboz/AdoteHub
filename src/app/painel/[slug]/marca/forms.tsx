"use client";

import { useActionState, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Field, FormMessage, SubmitButton, fieldError, useSubmitWithoutReset } from "@/components/ui";
import { brandInk, brandTint, onColor } from "@/lib/color";
import { MEDIA_BUCKET } from "@/lib/env";
import { compressLogo } from "@/lib/image/compress";
import { createClient } from "@/lib/supabase/client";
import { saveExtraQuestionsAction, saveLogoAction, updateBrandAction } from "@/modules/organizations/actions";
import type { Organization } from "@/modules/organizations/types";

export function BrandForm({ slug, org }: { slug: string; org: Organization }) {
  const [state, action, pending] = useActionState(updateBrandAction, null);
  const onSubmit = useSubmitWithoutReset(action);
  const [primary, setPrimary] = useState(org.primaryColor);
  const [secondary, setSecondary] = useState(org.secondaryColor);
  const [support, setSupport] = useState<string | null>(org.supportColor);

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5">
      <input type="hidden" name="slug" value={slug} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nome da ONG" name="name" error={fieldError(state, "name")}>
          <input id="name" name="name" defaultValue={org.name} required className="input" />
        </Field>
        <div className="grid grid-cols-[1fr_5rem] gap-2">
          <Field label="Cidade" name="city">
            <input id="city" name="city" defaultValue={org.city ?? ""} className="input" />
          </Field>
          <Field label="UF" name="state" error={fieldError(state, "state")}>
            <input id="state" name="state" maxLength={2} defaultValue={org.state ?? ""} className="input uppercase" />
          </Field>
        </div>
        <Field label="E-mail de contato" name="contactEmail" error={fieldError(state, "contactEmail")}>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={org.contactEmail ?? ""} className="input" />
        </Field>
        <Field label="WhatsApp" name="whatsapp" hint="Com DDD. Aparece no catálogo.">
          <input id="whatsapp" name="whatsapp" inputMode="tel" defaultValue={org.whatsapp ?? ""} className="input" />
        </Field>
        <Field label="Instagram" name="instagram">
          <input id="instagram" name="instagram" defaultValue={org.instagram ?? ""} placeholder="@suaong" className="input" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cor principal" name="primaryColor" error={fieldError(state, "primaryColor")}>
          <div className="flex items-center gap-2">
            <input type="color" id="primaryColor" name="primaryColor" value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-11 w-14 cursor-pointer rounded-sm border-[1.5px] border-linha bg-papel p-1" />
            <code className="text-sm font-semibold">{primary}</code>
          </div>
        </Field>
        <Field label="Cor de destaque" name="secondaryColor" error={fieldError(state, "secondaryColor")}>
          <div className="flex items-center gap-2">
            <input type="color" id="secondaryColor" name="secondaryColor" value={secondary} onChange={(e) => setSecondary(e.target.value)} className="h-11 w-14 cursor-pointer rounded-sm border-[1.5px] border-linha bg-papel p-1" />
            <code className="text-sm font-semibold">{secondary}</code>
          </div>
        </Field>
        <Field
          label="Cor de apoio (opcional)"
          name="supportColor"
          error={fieldError(state, "supportColor")}
          hint="Usada em detalhes pequenos, como a idade e os ícones de saúde."
        >
          <input type="hidden" name="supportColor" value={support ?? ""} />
          {support ? (
            <div className="flex flex-wrap items-center gap-2">
              <input type="color" id="supportColor" value={support} onChange={(e) => setSupport(e.target.value)} className="h-11 w-14 cursor-pointer rounded-sm border-[1.5px] border-linha bg-papel p-1" />
              <code className="text-sm font-semibold">{support}</code>
              <button type="button" className="btn-link" onClick={() => setSupport(null)}>
                Usar a cor principal
              </button>
            </div>
          ) : (
            <div>
              <button type="button" id="supportColor" className="btn-secondary px-5! py-2.5! text-sm!" onClick={() => setSupport(primary)}>
                Escolher cor de apoio
              </button>
            </div>
          )}
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-md border-2 border-dashed border-linha p-4">
        <span className="corpo-p">Prévia:</span>
        <span className="rounded-pill px-4 py-2 text-sm font-bold" style={{ background: secondary, color: onColor(secondary) }}>
          Quero adotar
        </span>
        <span className="rounded-pill px-3 py-1 text-xs font-bold" style={{ background: brandTint(primary), color: brandInk(primary) }}>
          Fêmea
        </span>
        <span className="rounded-pill px-3 py-1 text-xs font-bold" style={{ background: brandTint(secondary), color: brandInk(secondary) }}>
          Porte médio
        </span>
        <span className="rounded-pill px-3 py-1 text-xs font-bold" style={{ background: brandTint(support ?? primary), color: brandInk(support ?? primary) }}>
          Adulto
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <SubmitButton className="btn-verde" pending={pending}>Salvar</SubmitButton>
        </div>
        <FormMessage state={state} />
      </div>
    </form>
  );
}

export function LogoUploader({ slug, orgId, logoUrl, name }: { slug: string; orgId: string; logoUrl: string | null; name: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const logo = await compressLogo(file);
      const path = `${orgId}/brand/logo-${Date.now()}.png`;
      const { error: upErr } = await createClient()
        .storage.from(MEDIA_BUCKET)
        .upload(path, logo.blob, { contentType: "image/png", cacheControl: "31536000" });
      if (upErr) throw new Error("Falha no envio do logo");
      await saveLogoAction(slug, path);
      startTransition(() => router.refresh());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao enviar logo");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt={`Logo ${name}`} className="h-20 w-20 rounded-full border border-linha bg-papel object-contain" />
      ) : (
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-verde-50 font-display text-2xl font-extrabold text-verde">
          {name.charAt(0)}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className={`btn-secondary ${busy ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {busy ? "Enviando…" : logoUrl ? "Trocar logo" : "Enviar logo"}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        <p className="text-xs text-tinta-suave">PNG com fundo transparente fica melhor. Reduzimos para 512px.</p>
        {error && <p className="text-sm font-semibold text-erro">{error}</p>}
      </div>
    </div>
  );
}

export function ExtraQuestionsForm({ slug, initial }: { slug: string; initial: string }) {
  const [state, action, pending] = useActionState(saveExtraQuestionsAction, null);
  const onSubmit = useSubmitWithoutReset(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <textarea
        name="questions"
        rows={6}
        defaultValue={initial}
        className="input font-mono text-sm"
        placeholder={"Você mora em Curitiba ou região? *\nComo conheceu a ONG?"}
        aria-label="Perguntas extras"
      />
      <p className="text-xs text-tinta-suave">Uma pergunta por linha. Termine com * para tornar obrigatória. Máximo de 15.</p>
      <div>
        <SubmitButton className="btn-verde" pending={pending}>Salvar perguntas</SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
