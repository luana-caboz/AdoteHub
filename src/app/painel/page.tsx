import { PlatformHeader } from "@/components/brand/logo";
import { Paw } from "@/components/brand/paw";
import { OrgLinkCard, OrgLinkGrid } from "@/components/painel/org-link-card";
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

  const allOrgs = isAdmin ? await listAllOrganizations(db) : [];
  const mine = new Set(memberships.map((m) => m.slug));
  const supportOrgs = allOrgs.filter((o) => !mine.has(o.slug) && !o.archivedAt);

  const noOrgsAtAll = isAdmin && allOrgs.length === 0; // estado A
  const hasOrgs = memberships.length > 0 || supportOrgs.length > 0; // estados B e C
  const greeting = noOrgsAtAll || !hasOrgs ? "Olá!" : "Suas ONGs";
  const lead = noOrgsAtAll
    ? "Você ainda não cadastrou nenhuma ONG."
    : isAdmin
      ? "Abra o painel de uma ONG ou cadastre uma nova."
      : hasOrgs
        ? "Escolha uma ONG para abrir o painel."
        : "Sua conta ainda não está ligada a nenhuma ONG.";

  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader>
        <span className="corpo-p hidden max-w-[16rem] truncate sm:inline">{user.email}</span>
        <form action="/sair" method="post">
          <button className="btn-secondary px-5! py-2.5! text-sm!">Sair</button>
        </form>
      </PlatformHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12">
        <header>
          <p className="rotulo text-verde">Painel</p>
          <h1 className="display-l text-verde">{greeting}</h1>
          <p className="lead mt-2">{lead}</p>
        </header>

        {noOrgsAtAll && (
          <section className="card mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8! text-center">
            <Paw className="h-12 w-12" />
            <h2 className="titulo text-verde">Nenhuma ONG cadastrada ainda</h2>
            <p className="text-base text-tinta">
              O cadastro é feito por você. Crie a primeira ONG e envie o convite para a responsável.
            </p>
            <Link href="/admin" className="btn-primary">
              Cadastrar primeira ONG
            </Link>
          </section>
        )}

        {!isAdmin && !hasOrgs && (
          <section className="card mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8! text-center">
            <Paw className="h-12 w-12" />
            <p className="text-base text-tinta">
              Você ainda não faz parte de nenhuma ONG. Se recebeu um convite, abra o link que enviamos.
            </p>
          </section>
        )}

        {memberships.length > 0 && (
          <section aria-labelledby="suas-ongs" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="suas-ongs" className="titulo text-verde">
                Suas ONGs
              </h2>
              {isAdmin && (
                <Link href="/admin" className="btn-verde">
                  Cadastrar ONG
                </Link>
              )}
            </div>
            <OrgLinkGrid>
              {memberships.map((m) => (
                <li key={m.organizationId}>
                  <OrgLinkCard name={m.name} slug={m.slug} logoUrl={m.logoUrl} />
                </li>
              ))}
            </OrgLinkGrid>
          </section>
        )}

        {isAdmin && !noOrgsAtAll && (
          <section aria-labelledby="suporte" className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="suporte" className="titulo text-verde">
                Suporte · todas as ONGs
              </h2>
              {memberships.length === 0 && (
                <Link href="/admin" className="btn-verde">
                  Cadastrar ONG
                </Link>
              )}
            </div>
            {supportOrgs.length > 0 ? (
              <OrgLinkGrid>
                {supportOrgs.map((o) => (
                  <li key={o.id}>
                    <OrgLinkCard name={o.name} slug={o.slug} logoUrl={o.logoUrl} />
                  </li>
                ))}
              </OrgLinkGrid>
            ) : (
              <p className="card text-base text-tinta">
                Não há outras ONGs ativas. As arquivadas aparecem na tela de administração.
              </p>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
