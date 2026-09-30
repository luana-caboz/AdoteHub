import { ApplicationsPrivacyNotice } from "@/components/painel/support-notice";
import { formatDateTime } from "@/lib/format";
import { countApplicationsByStatus, listApplications } from "@/modules/applications/repository";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_BADGE as STATUS_BADGE, type ApplicationStatus } from "@/modules/applications/types";
import { requireOrgContext } from "@/modules/organizations/service";

import Link from "next/link";

export default async function ApplicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { db, org, isSupport } = await requireOrgContext(slug);
  if(isSupport) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="display-l text-verde">Candidaturas</h1>
        <ApplicationsPrivacyNotice />
      </div>
    );
  }
  const status = sp.status && sp.status in APPLICATION_STATUS_LABEL ? (sp.status as ApplicationStatus) : undefined;
  const [items, counts] = await Promise.all([listApplications(db, org.id, status), countApplicationsByStatus(db, org.id)]);
  const base = `/painel/${slug}/candidaturas`;

  return (
    <div className="flex flex-col gap-5">
      <h1 className="display-l text-verde">Candidaturas</h1>
      <nav className="flex flex-wrap gap-2 text-sm">
        <Link href={base} className={`rounded-pill px-4 py-1.5 font-bold ${!status ? "bg-verde text-on-verde" : "bg-papel text-verde border-[1.5px] border-linha"}`}>
          Todas
        </Link>
        {(Object.keys(APPLICATION_STATUS_LABEL) as ApplicationStatus[]).map((s) => (
          <Link
            key={s}
            href={`${base}?status=${s}`}
            className={`rounded-pill px-4 py-1.5 font-bold ${status === s ? "bg-verde text-on-verde" : "bg-papel text-verde border-[1.5px] border-linha"}`}
          >
            {APPLICATION_STATUS_LABEL[s]} ({counts[s]})
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <p className="card text-tinta-suave">Nenhuma candidatura {status ? "com esse status" : "ainda"}.</p>
      ) : (
        <ul className="divide-y divide-linha overflow-hidden rounded-lg bg-papel shadow-card">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`${base}/${a.id}`} className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 hover:bg-verde-50">
                <div>
                  <p className="font-bold text-verde">
                    {a.person.name} <span className="font-medium text-tinta-suave">→ {a.animal.name} #{a.animal.externalId}</span>
                  </p>
                  <p className="corpo-p">
                    {[a.person.city, a.person.state].filter(Boolean).join(" - ")} · {formatDateTime(a.createdAt)}
                  </p>
                </div>
                <span className={STATUS_BADGE[a.status]}>
                  {APPLICATION_STATUS_LABEL[a.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
