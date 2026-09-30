import { ApplicationsPrivacyNotice } from "@/components/painel/support-notice";
import { STATUS_LABEL, STATUS_TAG } from "@/modules/animals/labels";
import { countOrgAnimals } from "@/modules/animals/repository";
import type { AnimalStatus } from "@/modules/animals/types";
import { countApplicationsByStatus } from "@/modules/applications/repository";
import { requireOrgContext } from "@/modules/organizations/service";
import Link from "next/link";

export default async function OrgHome({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, org, isSupport } = await requireOrgContext(slug);
  const [animals, applications] = await Promise.all([countOrgAnimals(db, org.id), countApplicationsByStatus(db, org.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-l text-verde">Resumo</h1>
        <Link href={`/painel/${slug}/animais/novo`} className="btn-primary">
          + Cadastrar animal
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(animals) as AnimalStatus[]).map((s) => (
          <Link key={s} href={`/painel/${slug}/animais?status=${s}`} className="card-link flex flex-col items-start gap-2">
            <span className={STATUS_TAG[s]}>{STATUS_LABEL[s]}</span>
            <p className="display-l">{animals[s]}</p>
          </Link>
        ))}
      </section>

      {isSupport ? <ApplicationsPrivacyNotice /> : (
      <section className="grid gap-4 sm:grid-cols-2">
        <Link href={`/painel/${slug}/candidaturas?status=new`} className="card-link flex flex-col items-start gap-2">
          <span className="rotulo text-verde">Candidaturas novas</span>
          <p className="display-l">{applications.new}</p>
        </Link>
        <Link href={`/painel/${slug}/candidaturas?status=in_review`} className="card-link flex flex-col items-start gap-2">
          <span className="rotulo text-coral-forte">Em análise</span>
          <p className="display-l">{applications.in_review}</p>
        </Link>
      </section>
      )}
    </div>
  );
}
