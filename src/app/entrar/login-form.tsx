"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { sendMagicLinkAction } from "@/modules/auth/actions";

export function LoginForm({ next, defaultEmail }: { next: string; defaultEmail?: string }) {
  const [state, action] = useActionState(sendMagicLinkAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" name="email">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} className="input" />
      </Field>
      <SubmitButton pendingText="Enviando…">Receber link de acesso</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
