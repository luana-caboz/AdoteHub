import { AdoptFab } from "@/components/catalog/adopt-fab";
import { AnimalGallery } from "@/components/catalog/animal-gallery";
import { DetailCard, DetailRow, HealthRow } from "@/components/catalog/detail-card";
import { HeartIcon, InfoIcon, SparkIcon, UsersIcon } from "@/components/catalog/icons";
import { ShareButtons } from "@/components/catalog/share-buttons";
import { Tag } from "@/components/catalog/tag";
import { env } from "@/lib/env";
import { animalPath } from "@/lib/slug";
import { createPublicClient } from "@/lib/supabase/public";
import { extraValues, listCustomFields } from "@/modules/animals/custom-fields";
import {
  AGE_LABEL,
  SEX_LABEL,
  SIZE_LABEL,
  SPECIES_LABEL,
  STATUS_LABEL,
  STATUS_TAG,
  yesNo,
} from "@/modules/animals/labels";
import { getPublicAnimalByRef } from "@/modules/animals/public";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";

export const revalidate = 300;

type Params = Promise<{ slug: string; ref: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) return {};
  const { org, animal } = data;
  const title = `${animal.name} para adoção — ${org.name}`;
  const description =
    animal.description?.slice(0, 160) ??
    `${animal.name} está esperando um lar. Conheça e candidate-se para adotar.`;
  return {
    title,
    description,
    alternates: { canonical: animalPath(slug, animal.name, animal.code) },
    openGraph: { title, description, type: "article" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function AnimalPage({ params }: { params: Params }) {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) notFound();
  const { org, animal } = data;

  const canonical = animalPath(slug, animal.name, animal.code);
  if (`/${slug}/animais/${ref}` !== canonical) permanentRedirect(canonical);

  const extras = extraValues(
    (await listCustomFields(createPublicClient(), org.id)).filter((f) => f.isPublic),
    animal.extra,
  );

  const photos = animal.photos;
  const cover = photos.find((p) => p.id === animal.coverPhotoId) ?? photos[0];
  const ordered = cover
    ? [cover, ...photos.filter((p) => p.id !== cover.id)]
    : [];
  const url = `${env.siteUrl}${canonical}`;
  const available = animal.status === "available";

  const sociability = [
    { label: "Com crianças", value: animal.goodWithKids },
    { label: "Com cães", value: animal.goodWithDogs },
    { label: "Com gatos", value: animal.goodWithCats },
  ].filter((r) => r.value !== null);

  return (
    <article>
      <Link
        href={`/${slug}`}
        className="mb-3 inline-flex min-h-11 items-center rounded-md font-bold text-brand-ink underline underline-offset-4 lg:mb-4 lg:min-h-0"
      >
        ← Todos os animais
      </Link>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-12">
      <div className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
        <AnimalGallery
          name={animal.name}
          photos={ordered}
          badge={
            !available && (
              <span className={`${STATUS_TAG[animal.status]} absolute left-3 top-3 shadow-card`}>
                {STATUS_LABEL[animal.status]}
              </span>
            )
          }
        />
      </div>

      <div className="flex min-w-0 flex-col items-start gap-6">
        <div className="flex flex-col items-start gap-4">
          <h1 className="display-l text-brand-ink">{animal.name}</h1>

          <div className="flex flex-wrap gap-1.5">
            {animal.sex !== "unknown" && <Tag tone="brand">{SEX_LABEL[animal.sex]}</Tag>}
            {animal.size && <Tag tone="brand-2">Porte {SIZE_LABEL[animal.size].toLowerCase()}</Tag>}
            {animal.ageGroup && <Tag tone="brand-3">{AGE_LABEL[animal.ageGroup]}</Tag>}
          </div>

          <ShareButtons
            withIcon
            url={url}
            title={`${animal.name} para adoção`}
            text={`Conheça ${animal.name}, para adoção na ${org.name}!`}
          />
        </div>

        {!available && (
          <div className="flex flex-col items-start gap-2">
            <p className="text-base text-tinta">{animal.name} não está disponível para adoção agora.</p>
            <Link
              href={`/${slug}`}
              className="rounded-md font-bold text-brand-ink underline underline-offset-4"
            >
              Ver outros animais →
            </Link>
          </div>
        )}

        {animal.description && (
          <section className="card w-full">
            <h2 className="titulo-card mb-3 text-brand-ink">Conheça {animal.name}</h2>
            <p className="whitespace-pre-line text-base text-tinta">{animal.description}</p>
          </section>
        )}

        <div className="grid w-full grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-6">
          <DetailCard title="Informações" icon={<InfoIcon />}>
            <DetailRow label="Espécie">{SPECIES_LABEL[animal.species]}</DetailRow>
            {animal.breed && <DetailRow label="Raça">{animal.breed}</DetailRow>}
            {animal.color && <DetailRow label="Cor">{animal.color}</DetailRow>}
            {animal.ageGroup && <DetailRow label="Idade">{AGE_LABEL[animal.ageGroup]}</DetailRow>}
          </DetailCard>

          <DetailCard title="Saúde" icon={<HeartIcon />}>
            <HealthRow label="Castrado(a)" value={animal.neutered} />
            <HealthRow label="Vacinado(a)" value={animal.vaccinated} />
            <HealthRow label="Vermifugado(a)" value={animal.dewormed} />
            {animal.specialNeeds && <DetailRow label="Condição e cuidados">{animal.specialNeeds}</DetailRow>}
          </DetailCard>

          {sociability.length > 0 && (
            <DetailCard title="Sociabilidade" icon={<UsersIcon />}>
              {sociability.map((r) => (
                <DetailRow key={r.label} label={r.label}>
                  {yesNo(r.value)}
                </DetailRow>
              ))}
            </DetailCard>
          )}

          {extras.length > 0 && (
            <DetailCard title={`Mais sobre ${animal.name}`} icon={<SparkIcon />}>
              {extras.map(({ field, value }) => (
                <DetailRow key={field.key} label={field.label}>
                  {value}
                </DetailRow>
              ))}
            </DetailCard>
          )}
        </div>
      </div>
      </div>

      {available && <AdoptFab href={`${canonical}/adotar`} label={`Quero adotar ${animal.name}`} />}
    </article>
  );
}
