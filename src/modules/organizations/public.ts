import { cache } from "react";
import { SLUG_PATTERN } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import { findOrgBySlug } from "./repository";

export const getPublicOrg = cache(async (slug: string) => {
  if (!SLUG_PATTERN.test(slug)) return null;
  return findOrgBySlug(createPublicClient(), slug);
});
