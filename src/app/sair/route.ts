import { NextResponse, type NextRequest } from "next/server";
import { safeNext } from "@/lib/auth/safe-next";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const next = form?.get("next");
  const db = await createClient();
  await db.auth.signOut();
  const target = next ? `/entrar?next=${encodeURIComponent(safeNext(next))}` : "/entrar";
  return NextResponse.redirect(new URL(target, request.nextUrl.origin), { status: 303 });
}
