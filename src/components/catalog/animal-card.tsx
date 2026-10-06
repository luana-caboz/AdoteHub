import Link from "next/link";
import { Paw } from "@/components/brand/paw";
import { Tag } from "@/components/catalog/tag";
import { animalPath } from "@/lib/slug";
import { AGE_LABEL, SEX_LABEL, SIZE_LABEL, SPECIES_LABEL, STATUS_LABEL, STATUS_TAG } from "@/modules/animals/labels";
import type { Animal } from "@/modules/animals/types";

export function AnimalCard({ orgSlug, animal }: { orgSlug: string; animal: Animal }) {
  const tags = [
    animal.sex !== "unknown" ? { label: SEX_LABEL[animal.sex], tone: "brand" as const } : null,
    animal.size ? { label: `Porte ${SIZE_LABEL[animal.size].toLowerCase()}`, tone: "brand-2" as const } : null,
    animal.ageGroup ? { label: AGE_LABEL[animal.ageGroup], tone: "brand-3" as const } : null,
  ]
    .filter((t) => t !== null)
    .slice(0, 3);
  const meta = [SPECIES_LABEL[animal.species], animal.breed].filter(Boolean).join(" · ");

  return (
    <Link
      href={animalPath(orgSlug, animal.name, animal.code)}
      className="card-link group flex h-full flex-col overflow-hidden rounded-lg p-0!"
    >
      <div className="relative aspect-[4/5] tint-brand">
        {animal.cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={animal.cover.thumbUrl} alt={animal.name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Paw className="h-16 w-16" />
          </div>
        )}
        {animal.status !== "available" && (
          <span className={`${STATUS_TAG[animal.status]} absolute left-3 top-3 shadow-card`}>{STATUS_LABEL[animal.status]}</span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="titulo-card text-brand-ink">{animal.name}</p>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((t) => (
              <Tag key={t.label} tone={t.tone}>
                {t.label}
              </Tag>
            ))}
          </div>
        )}
        {meta && <p className="corpo-p">{meta}</p>}
        <span className="mt-auto font-bold text-brand-ink group-hover:underline group-hover:underline-offset-4">Conhecer {animal.name} →</span>
      </div>
    </Link>
  );
}
