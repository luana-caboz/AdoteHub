"use client";

import { useActionState } from "react";
import { FormMessage, SubmitButton, useSubmitWithoutReset } from "@/components/ui";
import { updateApplicationAction } from "@/modules/applications/actions";
import { APPLICATION_STATUS_LABEL, type ApplicationStatus } from "@/modules/applications/types";

export function ApplicationStatusForm({
  slug,
  applicationId,
  status,
  notes,
}: {
  slug: string;
  applicationId: string;
  status: ApplicationStatus;
  notes: string | null;
}) {
  const [state, action, pending] = useActionState(updateApplicationAction, null);
  const onSubmit = useSubmitWithoutReset(action);
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="applicationId" value={applicationId} />
      <select name="status" defaultValue={status} className="input" aria-label="Status">
        {(Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]).map((s) => (
          <option key={s} value={s}>
            {APPLICATION_STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      <label className="rotulo text-verde" htmlFor="internalNotes">
        Notas internas (só a equipe vê)
      </label>
      <textarea id="internalNotes" name="internalNotes" rows={5} defaultValue={notes ?? ""} className="input" />
      <SubmitButton className="btn-verde" pending={pending}>Salvar</SubmitButton>
      <FormMessage state={state} />
      <p className="text-xs text-tinta-suave">
        Aprovou? Lembre de mudar a situação do animal para &quot;Adotado&quot;.
      </p>
    </form>
  );
}
