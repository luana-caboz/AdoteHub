import { formatDateTime, whatsappLink } from "@/lib/format";
import { PROFILE_LABELS, formatProfileValue, type ProfileInput } from "@/modules/applications/form";
import { getApplication, listOtherApplicationsFromPerson } from "@/modules/applications/repository";
import { APPLICATION_STATUS_BADGE, APPLICATION_STATUS_LABEL } from "@/modules/applications/types";
import { requireOrgContext } from "@/modules/organizations/service";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApplicationStatusForm } from "./status-form";

const UUID = /^[0-9a-f-]{36}$/i;

export default async function ApplicationDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  if (!UUID.test(id)) notFound();
  const { db, org, isSupport } = await requireOrgContext(slug);
  if(isSupport) notFound();
  const app = await getApplication(db, org.id, id);
  if (!app) notFound();
  const others = await listOtherApplicationsFromPerson(db, org.id, app.person.email, app.id);
  const profile = app.answers.profile ?? {};
  const extra = app.answers.extra ?? {};

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        <div>
          <Link href={`/painel/${slug}/candidaturas`} className="btn-link px-0!">
            ← Candidaturas
          </Link>
          <h1 className="display-l text-verde">{app.person.name}</h1>
          <p className="lead">
            quer adotar{" "}
            <Link href={`/painel/${slug}/animais/${app.animal.id}`} className="font-bold text-verde underline underline-offset-4">
              {app.animal.name} (#{app.animal.externalId})
            </Link>{" "}
            · {formatDateTime(app.createdAt)}{" "}
            <span className={`ml-1 ${APPLICATION_STATUS_BADGE[app.status]}`}>
              {APPLICATION_STATUS_LABEL[app.status]}
            </span>
          </p>
        </div>

        <section className="card flex flex-col gap-2">
          <h2 className="titulo-card text-verde">Contato</h2>
          <p>
            <a href={`mailto:${app.person.email}`} className="font-bold text-verde underline underline-offset-4">
              {app.person.email}
            </a>
          </p>
          {app.person.phone && (
            <p>
              <a
                href={whatsappLink(app.person.phone, `Olá, ${app.person.name}! Aqui é da ${org.name}, sobre a adoção de ${app.animal.name}.`)}
                target="_blank"
                className="font-bold text-verde underline underline-offset-4"
              >
                WhatsApp: {app.person.phone}
              </a>
            </p>
          )}
          <p className="corpo-p">{[app.person.city, app.person.state].filter(Boolean).join(" - ")}</p>
        </section>

        <section className="card">
          <h2 className="titulo-card mb-3 text-verde">Respostas</h2>
          <dl className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(PROFILE_LABELS) as (keyof ProfileInput)[]).map((k) => (
              <div key={k} className={k === "motivation" ? "sm:col-span-2" : ""}>
                <dt className="rotulo text-coral-forte">{PROFILE_LABELS[k]}</dt>
                <dd className="whitespace-pre-wrap">{formatProfileValue(k, profile[k])}</dd>
              </div>
            ))}
            {Object.entries(extra).map(([qid, q]) => (
              <div key={qid} className="sm:col-span-2">
                <dt className="rotulo text-coral-forte">{q.label}</dt>
                <dd className="whitespace-pre-wrap">{q.answer || "—"}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-tinta-suave">
            Consentimento {app.consentVersion}
            {app.consentMatching ? " · aceitou receber sugestões de outros animais" : ""}
          </p>
        </section>
      </div>

      <aside className="flex flex-col gap-5">
        <section className="card">
          <h2 className="titulo-card mb-3 text-verde">Andamento</h2>
          <ApplicationStatusForm slug={slug} applicationId={app.id} status={app.status} notes={app.internalNotes} />
        </section>
        {others.length > 0 && (
          <section className="card">
            <h2 className="titulo-card mb-2 text-verde">Outras candidaturas desta pessoa</h2>
            <ul className="flex flex-col gap-1 text-sm">
              {others.map((o) => (
                <li key={o.id}>
                  <Link href={`/painel/${slug}/candidaturas/${o.id}`} className="font-bold text-verde underline underline-offset-4">
                    {o.animalName}
                  </Link>{" "}
                  · {APPLICATION_STATUS_LABEL[o.status]} · {formatDateTime(o.createdAt)}
                </li>
              ))}
            </ul>
          </section>
        )}
      </aside>
    </div>
  );
}
