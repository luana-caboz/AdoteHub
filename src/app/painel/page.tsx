import { PlatformHeader } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { listAllOrganizations, listMemberships } from "@/modules/organizations/repository";
import { getIsPlatformAdmin, requireUser } from "@/modules/organizations/service";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PainelIndex() {
  const user = await requireUser("/painel");
  const db = await createClient();
  const memberships = await listMemberships(db, user.id);
  const isAdmin = await getIsPlatformAdmin();

  if (memberships.length === 1 && !isAdmin) redirect(`/painel/${memberships[0].slug}`);

  const mine = new Set(memberships.map((m) => m.slug));
  const supportOrgs = isAdmin
    ? (await listAllOrganizations(db)).filter((o) => !mine.has(o.slug) && !o.archivedAt)
    : [];

  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-4 px-4 py-12">
        <h1 className="display-l text-verde">Suas ONGs</h1>

        {memberships.length === 0 && !isAdmin && (
          <p className="lead">
            Sua conta ({user.email}) ainda não participa de nenhuma ONG. Peça um convite para a responsável.
          </p>
        )}

        {memberships.map((m) => (
          <Link key={m.organizationId} href={`/painel/${m.slug}`} className="card-link titulo-card text-verde">
            {m.name}
          </Link>
        ))}

        {supportOrgs.length > 0 && (
          <>
            <h2 className="rotulo mt-4 text-coral-forte">Suporte · todas as ONGs</h2>
            {supportOrgs.map((o) => (
              <Link key={o.id} href={`/painel/${o.slug}`} className="card-link titulo-card text-verde">
                {o.name}
              </Link>
            ))}
          </>
        )}

        {isAdmin && (
          <Link href="/admin" className="btn-secondary">
            Tela interna (admin)
          </Link>
        )}

        <form action="/sair" method="post">
          <button className="btn-link">Sair</button>
        </form>
      </main>
    </div>
  );
}