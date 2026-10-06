"use client";

import { useActionState } from "react";
import { Field, FormMessage, SubmitButton, fieldError } from "@/components/ui";
import { setPasswordAction } from "@/modules/auth/actions";

export function SetPasswordForm({ next }: { next: string }) {
  const [state, action] = useActionState(setPasswordAction, null);
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Nova senha" name="password" error={fieldError(state, "password")} hint="Pelo menos 8 caracteres.">
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </Field>
      <Field label="Repita a senha" name="confirm" error={fieldError(state, "confirm")}>
        <input id="confirm" name="confirm" type="password" required minLength={8} autoComplete="new-password" className="input" />
      </Field>
      <SubmitButton pendingText="Salvando…">Salvar senha e continuar</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
