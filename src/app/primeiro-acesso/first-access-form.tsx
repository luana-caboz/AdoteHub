"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { sendFirstAccessLinkAction } from "@/modules/auth/actions";

export function FirstAccessForm({ next, defaultEmail }: { next: string; defaultEmail?: string }) {
  const [state, action] = useActionState(sendFirstAccessLinkAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" name="email">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} className="input" />
      </Field>
      <SubmitButton pendingText="Enviando…">Receber link por e-mail</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
