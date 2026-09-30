import { Paw } from "@/components/brand/paw";
import { ShareButtons } from "@/components/catalog/share-buttons";
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

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <div>
      <dt className="rotulo text-brand-2">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  );
}

export default async function AnimalPage({ params }: { params: Params }) {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) notFound();
  const { org, animal } = data;

  const canonical = animalPath(slug, animal.name, animal.code);
  if (`/${slug}/animais/${ref}` !== canonical) permanentRedirect(canonical);

  const extras = extraValues(
    await listCustomFields(createPublicClient(), org.id),
    animal.extra,
  );

  const photos = animal.photos.length ? animal.photos : [];
  const cover = photos.find((p) => p.id === animal.coverPhotoId) ?? photos[0];
  const ordered = cover
    ? [cover, ...photos.filter((p) => p.id !== cover.id)]
    : [];
  const url = `${env.siteUrl}${canonical}`;
  const reserved = animal.status === "reserved";

  return (
    <article className="grid gap-8 lg:grid-cols-2">
      <div className="flex flex-col gap-3">
        {ordered.length > 0 ? (
          <div className="flex snap-x snap-mandatory gap-2 overflow-x-auto rounded-lg">
            {ordered.map((p, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={p.id}
                src={p.url}
                alt={`${animal.name} — foto ${i + 1}`}
                width={p.width ?? undefined}
                height={p.height ?? undefined}
                loading={i === 0 ? "eager" : "lazy"}
                className="aspect-square w-full flex-none snap-center rounded-lg object-cover shadow-card"
              />
            ))}
          </div>
        ) : (
          <div className="flex aspect-square items-center justify-center rounded-lg bg-verde-50">
            <Paw className="h-20 w-20" />
          </div>
        )}
        {ordered.length > 1 && (
          <p className="text-center corpo-p">
            Deslize para ver {ordered.length} fotos
          </p>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div>
          <Link
            href={`/${slug}`}
            className="font-bold text-brand underline underline-offset-4"
          >
            ← Todos os animais
          </Link>
          <h1 className="display-l mt-2 text-brand">{animal.name}</h1>
          {reserved && (
            <span className={`${STATUS_TAG[animal.status]} mt-3`}>
              {STATUS_LABEL[animal.status]}
            </span>
          )}
        </div>

        <dl className="card grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Info label="Espécie" value={SPECIES_LABEL[animal.species]} />
          <Info
            label="Sexo"
            value={animal.sex !== "unknown" ? SEX_LABEL[animal.sex] : null}
          />
          <Info
            label="Idade"
            value={animal.ageGroup ? AGE_LABEL[animal.ageGroup] : null}
          />
          <Info
            label="Porte"
            value={animal.size ? SIZE_LABEL[animal.size] : null}
          />
          <Info label="Raça" value={animal.breed} />
          <Info label="Cor" value={animal.color} />
          <Info
            label="Castrado(a)"
            value={animal.neutered === null ? null : yesNo(animal.neutered)}
          />
          <Info
            label="Vacinado(a)"
            value={animal.vaccinated === null ? null : yesNo(animal.vaccinated)}
          />
          <Info
            label="Vermifugado(a)"
            value={animal.dewormed === null ? null : yesNo(animal.dewormed)}
          />
          <Info
            label="Com crianças"
            value={
              animal.goodWithKids === null ? null : yesNo(animal.goodWithKids)
            }
          />
          <Info
            label="Com cães"
            value={
              animal.goodWithDogs === null ? null : yesNo(animal.goodWithDogs)
            }
          />
          <Info
            label="Com gatos"
            value={
              animal.goodWithCats === null ? null : yesNo(animal.goodWithCats)
            }
          />
        </dl>

        {animal.description && (
          <p className="whitespace-pre-line lead text-tinta">
            {animal.description}
          </p>
        )}
        {animal.specialNeeds && (
          <div className="rounded-lg bg-mel-50 p-5 text-mel">
            <p className="rotulo">Cuidados especiais</p>
            <p className="whitespace-pre-line">{animal.specialNeeds}</p>
          </div>
        )}

        {extras.length > 0 && (
          <dl className="flex flex-col gap-3">
            {extras.map(({ field, value }) => (
              <div key={field.key}>
                <dt className="rotulo text-tinta-suave">{field.label}</dt>
                <dd className="whitespace-pre-line">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div className="flex flex-col gap-3">
          <Link href={`${canonical}/adotar`} className="btn-brand">
            {reserved
              ? "Quero entrar na lista de interessados"
              : `Quero adotar ${animal.name}`}
          </Link>
          <ShareButtons
            url={url}
            title={`${animal.name} para adoção`}
            text={`Conheça ${animal.name}, para adoção na ${org.name}!`}
          />
        </div>
      </div>
    </article>
  );
}
