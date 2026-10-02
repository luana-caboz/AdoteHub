"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Field, FormMessage, SubmitButton } from "@/components/ui";
import { signInAction } from "@/modules/auth/actions";

export function LoginForm({ next, defaultEmail }: { next: string; defaultEmail?: string }) {
  const [state, action] = useActionState(signInAction, null);
  const firstAccess = `/primeiro-acesso?next=${encodeURIComponent(next)}${defaultEmail ? `&email=${encodeURIComponent(defaultEmail)}` : ""}`;
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <Field label="E-mail" name="email">
        <input id="email" name="email" type="email" required autoComplete="email" defaultValue={defaultEmail} className="input" />
      </Field>
      <Field label="Senha" name="password">
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </Field>
      <SubmitButton pendingText="Entrando…">Entrar</SubmitButton>
      <FormMessage state={state} />
      <p className="corpo-p">
        Primeiro acesso ou esqueceu a senha?{" "}
        <Link href={firstAccess} className="font-bold text-verde underline underline-offset-4">
          Receber link por e-mail →
        </Link>
      </p>
    </form>
  );
}
