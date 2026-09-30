"use server";

import { safeNext } from "@/lib/auth/safe-next";
import { env } from "@/lib/env";
import type { ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export async function sendMagicLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = z.string().trim().toLowerCase().email().safeParse(formData.get("email"));
  if (!email.success) return { ok: false, error: "Informe um e-mail válido." };
  const next = safeNext(formData.get("next"));

  const db = await createClient();
  const { error } = await db.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${env.siteUrl}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });
  if (error) {
    console.error("[entrar] signInWithOtp falhou:", error.status, error.code, error.message);
    if (error.status === 429 || error.code === "over_email_send_rate_limit") {
      return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    }
    if (error.code === "email_address_not_authorized") {
      return {
        ok: false,
        error: "Este e-mail ainda não pode receber o link (o envio padrão do Supabase só atende a equipe do projeto).",
      };
    }
    const detail = process.env.NODE_ENV === "development" ? ` [${error.status ?? "?"} ${error.code ?? ""}: ${error.message}]` : "";
    return { ok: false, error: `Não foi possível enviar o link.${detail}` };
  }
  return { ok: true, message: `Enviamos um link de acesso para ${email.data}. Abra seu e-mail para entrar.` };
}