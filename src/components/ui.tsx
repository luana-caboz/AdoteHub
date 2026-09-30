"use client";

import { useTransition } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/errors";

export function SubmitButton({
  children,
  pendingText = "Salvando…",
  className = "btn-primary",
  pending: pendingProp,
}: {
  children: React.ReactNode;
  pendingText?: string;
  className?: string;
  pending?: boolean;
}) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <button type="submit" className={className} disabled={pending}>
      {pending ? pendingText : children}
    </button>
  );
}

export function FormMessage({ state }: { state: ActionState<unknown> }) {
  if (!state) return null;
  if (state.ok) {
    return state.message ? (
      <p role="status" className="rounded-md bg-verde-50 px-4 py-3 text-sm font-semibold text-verde">
        {state.message}
      </p>
    ) : null;
  }
  return (
    <p role="alert" className="rounded-md bg-erro-50 px-4 py-3 text-sm font-semibold text-erro">
      {state.error}
    </p>
  );
}

export function fieldError(state: ActionState<unknown>, name: string): string | undefined {
  if (!state || state.ok) return undefined;
  return state.fieldErrors?.[name]?.[0];
}

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${error ? "[&_.input]:border-erro" : ""}`}>
      <label htmlFor={name} className="text-sm font-bold text-tinta">
        {label}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-tinta-suave">{hint}</p>}
      {error && <p className="text-sm font-semibold text-erro">{error}</p>}
    </div>
  );
}

export function CopyButton({ text, label = "Copiar link" }: { text: string; label?: string }) {
  return (
    <button
      type="button"
      className="btn-secondary"
      onClick={async (e) => {
        const btn = e.currentTarget;
        await navigator.clipboard.writeText(text);
        const original = btn.textContent;
        btn.textContent = "Copiado!";
        setTimeout(() => (btn.textContent = original), 1500);
      }}
    >
      {label}
    </button>
  );
}

export function useSubmitWithoutReset(dispatch: (formData: FormData) => void) {
  const [, startTransition] = useTransition();
  return (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => dispatch(formData));
  };
}
