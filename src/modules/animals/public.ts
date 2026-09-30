import { cache } from "react";
import { codeFromAnimalRef } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import { getPublicOrg } from "@/modules/organizations/public";
import { getPublicAnimal } from "./repository";

export const getPublicAnimalByRef = cache(async (slug: string, ref: string) => {
  const org = await getPublicOrg(slug);
  if (!org) return null;
  const code = codeFromAnimalRef(ref);
  if (!/^[0-9a-f]{8}$/.test(code)) return null;
  const animal = await getPublicAnimal(createPublicClient(), org.id, code);
  return animal ? { org, animal } : null;
});
