"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton } from "@/components/ui";
import { acceptInviteAction } from "@/modules/organizations/actions";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action] = useActionState(acceptInviteAction, null);
  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <SubmitButton pendingText="Entrando…">Aceitar convite</SubmitButton>
      <FormMessage state={state} />
    </form>
  );
}
