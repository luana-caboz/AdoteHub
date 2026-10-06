"use server";

import { redirect } from "next/navigation";
import { safeNext } from "@/lib/auth/safe-next";
import { getSiteUrl } from "@/lib/site-url";
import type { ActionState } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

const SET_PASSWORD_PATH = "/definir-senha";
const MIN_PASSWORD = 8;

const emailSchema = z.string().trim().toLowerCase().email();

export async function signInAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  if (!email.success) return { ok: false, error: "Informe um e-mail válido." };
  if (!password) return { ok: false, error: "Informe sua senha." };
  const next = safeNext(formData.get("next"));

  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({ email: email.data, password });
  if (error) {
    if (error.status === 429) return { ok: false, error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    if (error.code === "email_not_confirmed") {
      return { ok: false, error: "Seu e-mail ainda não foi confirmado. Use o link “Receber link por e-mail” abaixo." };
    }
    return { ok: false, error: "E-mail ou senha incorretos. Se for seu primeiro acesso, use o link abaixo." };
  }
  redirect(next);
}

// Primeiro acesso e "esqueci a senha": o mesmo link confirma o e-mail e leva à tela de criar senha.
export async function sendFirstAccessLinkAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, error: "Informe um e-mail válido." };
  const requested = safeNext(formData.get("next"));
  const next = requested.startsWith(SET_PASSWORD_PATH)
    ? requested
    : `${SET_PASSWORD_PATH}?next=${encodeURIComponent(requested)}`;

  const db = await createClient();
  const { error } = await db.auth.signInWithOtp({
    email: email.data,
    options: {
      emailRedirectTo: `${await getSiteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
      shouldCreateUser: true,
    },
  });
  if (error) {
    console.error("[primeiro-acesso] signInWithOtp falhou:", error.status, error.code, error.message);
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
  return { ok: true, message: `Enviamos um link para ${email.data}. Abra seu e-mail para confirmar e criar sua senha.` };
}

const passwordSchema = z
  .object({
    password: z.string().min(MIN_PASSWORD, `Use pelo menos ${MIN_PASSWORD} caracteres.`).max(72, "Use no máximo 72 caracteres."),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], message: "As senhas não são iguais." });

export async function setPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordSchema.safeParse({ password: formData.get("password"), confirm: formData.get("confirm") });
  if (!parsed.success) {
    return { ok: false, error: "Confira os campos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const next = safeNext(formData.get("next"));

  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect(`/primeiro-acesso?erro=link&next=${encodeURIComponent(next)}`);

  const { error } = await db.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") return { ok: false, error: "Escolha uma senha diferente da anterior." };
    if (error.code === "weak_password") return { ok: false, error: "Senha fraca. Misture letras e números." };
    return { ok: false, error: "Não foi possível salvar a senha. Tente novamente." };
  }
  redirect(next);
}
