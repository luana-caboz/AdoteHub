import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { findOrgBySlug, getMemberRole, isPlatformAdmin } from "./repository";
import { ROLE_RANK, type MemberRole, type Organization } from "./types";

export const getCurrentUser = cache(async () => {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  return user;
});

export async function requireUser(next?: string) {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/entrar?next=${encodeURIComponent(next)}` : "/entrar");
  return user;
}

export const getIsPlatformAdmin = cache(async () => {
  const user = await getCurrentUser();
  if (!user) return false;
  return isPlatformAdmin(await createClient());
});

export async function requirePlatformAdmin() {
  const user = await requireUser("/admin");
  if (!(await getIsPlatformAdmin())) notFound();
  const db = await createClient();
  return { user, db };
}

export interface OrgContext {
  org: Organization;
  role: MemberRole;
  userId: string;
  isSupport: boolean;
}

const loadOrgContext = cache(async (slug: string): Promise<OrgContext | null> => {
  const user = await getCurrentUser();
  if (!user) return null;
  const db = await createClient();
  const org = await findOrgBySlug(db, slug);
  if (!org) return null;
  const role = await getMemberRole(db, org.id, user.id);
  if (role) return { org, role, userId: user.id, isSupport: false };
  if (await getIsPlatformAdmin()) return { org, role: "admin", userId: user.id, isSupport: true };
  return null;
});

export async function requireOrgContext(slug: string, minRole: MemberRole = "member") {
  await requireUser(`/painel/${slug}`);
  const ctx = await loadOrgContext(slug);
  if (!ctx || ROLE_RANK[ctx.role] < ROLE_RANK[minRole]) notFound();
  const db = await createClient();
  return { ...ctx, db };
}

export function canManageTeam(role: MemberRole) {
  return ROLE_RANK[role] >= ROLE_RANK.admin;
}
