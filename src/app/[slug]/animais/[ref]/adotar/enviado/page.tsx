import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicAnimalByRef } from "@/modules/animals/public";

export default async function SentPage({ params }: { params: Promise<{ slug: string; ref: string }> }) {
  const { slug, ref } = await params;
  const data = await getPublicAnimalByRef(slug, ref);
  if (!data) notFound();
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-16 text-center">
      <h1 className="display-l text-brand">Candidatura enviada!</h1>
      <p className="lead">
        A equipe da {data.org.name} vai analisar suas respostas sobre {data.animal.name} e entrar em contato pelo WhatsApp
        ou e-mail.
      </p>
      <Link href={`/${slug}`} className="btn-brand">
        Ver outros animais
      </Link>
    </div>
  );
}
