"use client";

import { useActionState } from "react";
import { CopyButton, FormMessage, SubmitButton } from "@/components/ui";
import { createInviteAction } from "@/modules/organizations/actions";

export function TeamInviteForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(createInviteAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <div className="flex flex-wrap gap-2">
        <input name="email" type="email" required placeholder="email@exemplo.com" className="input max-w-xs" aria-label="E-mail" />
        <select name="role" defaultValue="member" className="input w-auto" aria-label="Papel">
          <option value="member">Voluntário(a) — cadastra animais e vê candidaturas</option>
          <option value="admin">Administrador(a) — também gerencia equipe e marca</option>
        </select>
        <SubmitButton className="btn-verde" pendingText="…">Gerar convite</SubmitButton>
      </div>
      <FormMessage state={state} />
      {state?.ok && state.data && (
        <div className="flex flex-col gap-2 rounded-md bg-verde-50 p-4 text-sm">
          <p>Envie este link pelo WhatsApp ou e-mail. Ele só funciona com o e-mail convidado.</p>
          <code className="break-all rounded-sm bg-papel px-2 py-1">{state.data.inviteUrl}</code>
          <div>
            <CopyButton text={state.data.inviteUrl} />
          </div>
        </div>
      )}
    </form>
  );
}
