import Link from "next/link";
import { Paw } from "@/components/brand/paw";
import type { HomeOrg } from "@/modules/organizations/types";

export function availableLabel(count: number): string {
  if (count === 0) return "Sem animais no momento";
  return count === 1 ? "1 animal disponível" : `${count} animais disponíveis`;
}

export function OrgCard({ org }: { org: HomeOrg }) {
  return (
    <Link href={`/${org.slug}`} className="card-link group flex h-full flex-col gap-3">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-verde-50">
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={org.logoUrl} alt={org.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Paw className="h-8 w-8" />
        )}
      </div>
      <p className="titulo-card text-verde">{org.name}</p>
      {org.city && <p className="corpo-p">{org.city}</p>}
      <div>
        <span className={org.availableAnimals > 0 ? "tag-verde" : "tag-cinza"}>{availableLabel(org.availableAnimals)}</span>
      </div>
      <span className="mt-auto pt-1 font-bold text-verde group-hover:underline group-hover:underline-offset-4">Ver animais →</span>
    </Link>
  );
}
