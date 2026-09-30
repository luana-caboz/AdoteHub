import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { animalPath } from "@/lib/slug";
import { getPublicAnimalByRef } from "@/modules/animals/public";
import { AdoptionForm } from "./adoption-form";

export const metadata: Metadata = { robots: { index: false } };

export default async function AdoptPage({ params }: { params: Promise<{ slug: string; ref: string }> }) {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) notFound();
  const { org, animal } = data;
  const cover = animal.cover;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="flex items-center gap-4">
        {cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover.thumbUrl} alt="" className="h-20 w-20 rounded-md object-cover" />
        )}
        <div>
          <Link href={animalPath(slug, animal.name, animal.code)} className="font-bold text-brand underline underline-offset-4">
            ← {animal.name}
          </Link>
          <h1 className="display-l text-brand">Formulário de adoção</h1>
          <p className="lead">
            Para adotar {animal.name} com {org.name}. Leva uns 5 minutos.
          </p>
        </div>
      </div>
      <AdoptionForm orgSlug={slug} orgName={org.name} animalCode={animal.code} extraQuestions={org.adoptionExtraQuestions} />
    </div>
  );
}
