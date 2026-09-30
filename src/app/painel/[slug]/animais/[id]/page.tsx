import { AnimalForm } from "@/components/animals/animal-form";
import { PhotoManager } from "@/components/animals/photo-manager";
import { formatDateTime } from "@/lib/format";
import { animalPath } from "@/lib/slug";
import { setArchivedAction } from "@/modules/animals/actions";
import { listCustomFields } from "@/modules/animals/custom-fields";
import { EVENT_LABEL, STATUS_LABEL } from "@/modules/animals/labels";
import { getOrgAnimal, listAnimalEvents } from "@/modules/animals/repository";
import type { AnimalStatus } from "@/modules/animals/types";
import { requireOrgContext } from "@/modules/organizations/service";
import Link from "next/link";
import { notFound } from "next/navigation";

const UUID = /^[0-9a-f-]{36}$/i;

function describeEvent(type: string, payload: Record<string, unknown>) {
  const label = EVENT_LABEL[type] ?? type;
  if (type === "status_changed") {
    const from = STATUS_LABEL[payload.from as AnimalStatus] ?? payload.from;
    const to = STATUS_LABEL[payload.to as AnimalStatus] ?? payload.to;
    return `${label}: ${from} → ${to}`;
  }
  return label;
}

export default async function EditAnimalPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ novo?: string }>;
}) {
  const { slug, id } = await params;
  const { novo } = await searchParams;
  if (!UUID.test(id)) notFound();
  const { db, org } = await requireOrgContext(slug);
  const animal = await getOrgAnimal(db, org.id, id);
  if (!animal) notFound();
  const [events, customFields] = await Promise.all([listAnimalEvents(db, org.id, animal.id), listCustomFields(db, org.id)]);
  const publicUrl = animalPath(slug, animal.name, animal.code);
  const isPublic = !animal.archivedAt && (animal.status === "available" || animal.status === "reserved");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href={`/painel/${slug}/animais`} className="btn-link px-0!">
            ← Animais
          </Link>
          <h1 className="display-l text-verde">
            {animal.name} <span className="font-texto text-lg font-medium text-tinta-suave">#{animal.externalId}</span>
          </h1>
          {animal.archivedAt && <span className="tag-cinza">Arquivado</span>}
        </div>
        <div className="flex gap-2">
          {isPublic && (
            <Link href={publicUrl} target="_blank" className="btn-secondary">
              Ver página pública
            </Link>
          )}
          <form action={setArchivedAction}>
            <input type="hidden" name="slug" value={slug} />
            <input type="hidden" name="animalId" value={animal.id} />
            <input type="hidden" name="archived" value={animal.archivedAt ? "false" : "true"} />
            <button className={animal.archivedAt ? "btn-secondary" : "btn-danger"}>
              {animal.archivedAt ? "Desarquivar" : "Arquivar"}
            </button>
          </form>
        </div>
      </div>

      {novo && (
        <p role="status" className="rounded-md bg-verde-50 px-4 py-3 text-sm font-semibold text-verde">
          Animal cadastrado! Agora adicione as fotos.
        </p>
      )}

      <section className="card">
        <PhotoManager
          slug={slug}
          orgId={org.id}
          animalId={animal.id}
          photos={animal.photos}
          coverPhotoId={animal.coverPhotoId}
          maxPhotos={org.maxPhotosPerAnimal}
        />
      </section>

      <section className="card">
        <h2 className="titulo mb-4 text-verde">Dados</h2>
        <AnimalForm slug={slug} animal={animal} customFields={customFields} />
      </section>

      <section className="card">
        <h2 className="titulo mb-3 text-verde">Histórico</h2>
        <ul className="flex flex-col gap-1 text-sm">
          {events.map((e) => (
            <li key={e.id} className="flex gap-3">
              <span className="w-32 flex-none text-tinta-suave">{formatDateTime(e.createdAt)}</span>
              <span>{describeEvent(e.type, e.payload)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
