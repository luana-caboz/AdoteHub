import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/auth/safe-next";

export async function GET(request: NextRequest) {
  const url = request.nextUrl;
  const next = safeNext(url.searchParams.get("next"));
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const code = url.searchParams.get("code");
  const db = await createClient();

  let ok = false;
  if (tokenHash && type) {
    const { error } = await db.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  } else if (code) {
    const { error } = await db.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const target = new URL(ok ? next : `/primeiro-acesso?erro=link&next=${encodeURIComponent(next)}`, url.origin);
  return NextResponse.redirect(target);
}
