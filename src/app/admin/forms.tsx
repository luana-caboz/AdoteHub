"use client";

import { useActionState, useState } from "react";
import { CopyButton, Field, FormMessage, SubmitButton, fieldError } from "@/components/ui";
import { slugify } from "@/lib/slug";
import { adminCreateInviteAction, createOrganizationAction } from "@/modules/organizations/actions";

function InviteLink({ url }: { url: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-md bg-verde-50 p-4 text-sm">
      <p>Envie este link (WhatsApp ou e-mail). Vale por 14 dias e só funciona com o e-mail convidado.</p>
      <code className="break-all rounded-sm bg-papel px-2 py-1">{url}</code>
      <div>
        <CopyButton text={url} />
      </div>
    </div>
  );
}

export function CreateOrgForm() {
  const [state, action] = useActionState(createOrganizationAction, null);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      <Field label="Nome da ONG" name="name" error={fieldError(state, "name")}>
        <input
          id="name"
          name="name"
          required
          className="input"
          onChange={(e) => !slugTouched && setSlug(slugify(e.target.value))}
        />
      </Field>
      <Field label="Endereço (slug)" name="slug" error={fieldError(state, "slug")} hint={`adotehub.com.br/${slug || "…"}`}>
        <input
          id="slug"
          name="slug"
          required
          className="input"
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </Field>
      <Field label="E-mail da responsável" name="ownerEmail" error={fieldError(state, "ownerEmail")}>
        <input id="ownerEmail" name="ownerEmail" type="email" required className="input" />
      </Field>
      <div className="grid grid-cols-[1fr_5rem] gap-2">
        <Field label="Cidade" name="city">
          <input id="city" name="city" className="input" />
        </Field>
        <Field label="UF" name="state" error={fieldError(state, "state")}>
          <input id="state" name="state" maxLength={2} className="input uppercase" />
        </Field>
      </div>
      <div className="flex flex-col gap-3 md:col-span-2">
        <div>
          <SubmitButton className="btn-verde" pendingText="Criando…">Criar ONG e gerar convite</SubmitButton>
        </div>
        <FormMessage state={state} />
        {state?.ok && state.data && <InviteLink url={state.data.inviteUrl} />}
      </div>
    </form>
  );
}

export function AdminInviteForm({ orgId }: { orgId: string }) {
  const [state, action] = useActionState(adminCreateInviteAction, null);
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="orgId" value={orgId} />
      <input type="hidden" name="role" value="owner" />
      <div className="flex gap-2">
        <input name="email" type="email" required placeholder="email@ong.org" className="input" aria-label="E-mail" />
        <SubmitButton className="btn-verde" pendingText="…">
          Convidar
        </SubmitButton>
      </div>
      <FormMessage state={state} />
      {state?.ok && state.data && <InviteLink url={state.data.inviteUrl} />}
    </form>
  );
}
