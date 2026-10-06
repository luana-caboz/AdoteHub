import type { Db, Row } from "@/lib/supabase/types";
import { ORG_COLUMNS, toHomeOrg, toInvite, toMember, toMembership, toOrganization } from "./mappers";
import type { HomeOrg, MemberRole, Membership, OrgInvite, OrgMember, Organization } from "./types";

export async function findOrgBySlug(db: Db, slug: string): Promise<Organization | null> {
  const { data, error } = await db.from("organizations").select(ORG_COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? toOrganization(data) : null;
}

export async function listAllOrganizations(db: Db): Promise<Organization[]> {
  const { data, error } = await db.from("organizations").select(ORG_COLUMNS).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Row) => toOrganization(r));
}

export async function listMemberships(db: Db, userId: string): Promise<Membership[]> {
  const { data, error } = await db
    .from("organization_members")
    .select("organization_id, role, organizations(name, slug, logo_path)")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: Row) => toMembership(r));
}

export async function getMemberRole(db: Db, orgId: string, userId: string): Promise<MemberRole | null> {
  const { data, error } = await db
    .from("organization_members")
    .select("role")
    .eq("organization_id", orgId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data?.role as MemberRole | undefined) ?? null;
}

export async function listMembers(db: Db, orgId: string): Promise<OrgMember[]> {
  const { data, error } = await db.rpc("list_org_members", { p_org: orgId });
  if (error) throw error;
  return (data ?? []).map((r: Row) => toMember(r));
}

export async function listPendingInvites(db: Db, orgId: string): Promise<OrgInvite[]> {
  const { data, error } = await db
    .from("organization_invites")
    .select("id, email, role, token, expires_at, created_at")
    .eq("organization_id", orgId)
    .is("accepted_at", null)
    .is("revoked_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: Row) => toInvite(r));
}

export async function isPlatformAdmin(db: Db): Promise<boolean> {
  const { data, error } = await db.rpc("is_platform_admin");
  if (error) throw error;
  return data === true;
}

export async function listHomeOrgs(db: Db): Promise<HomeOrg[]> {
  const { data, error } = await db.rpc("list_home_orgs");
  if (error) throw error;
  return (data ?? []).map((r: Row) => toHomeOrg(r));
}
