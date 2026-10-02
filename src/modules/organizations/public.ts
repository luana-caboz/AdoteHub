import { cache } from "react";
import { SLUG_PATTERN } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import { findOrgBySlug, listHomeOrgs } from "./repository";

export const getPublicOrg = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug)) return null;
  return findOrgBySlug(createPublicClient(), slug);
});

export async function getHomeOrgs() {
  try {
    return await listHomeOrgs(createPublicClient());
  } catch (error) {
    console.error("Falha ao listar ONGs da home", error);
    return [];
  }
}
