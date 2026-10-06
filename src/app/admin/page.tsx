import { PlatformHeader } from "@/components/brand/logo";
import { adminSetOrgHomeAction, adminUpdateOrganizationAction } from "@/modules/organizations/actions";
import { listAllOrganizations } from "@/modules/organizations/repository";
import { requirePlatformAdmin } from "@/modules/organizations/service";
import type { Metadata } from "next";
import Link from "next/link";
import { AdminInviteForm, CreateOrgForm } from "./forms";

export const metadata: Metadata = { title: "Administração", robots: { index: false } };

export default async function AdminPage() {
  const { db } = await requirePlatformAdmin();
  const orgs = await listAllOrganizations(db);

  return (
    <>
      <PlatformHeader>
        <Link href="/painel" className="btn-secondary">
          Meu painel
        </Link>
      </PlatformHeader>
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-4 py-10">
      <header>
        <p className="rotulo text-coral-forte">Tela interna</p>
        <h1 className="display-l text-verde">ONGs</h1>
      </header>

      <section className="card">
        <h2 className="titulo mb-4 text-verde">Nova ONG</h2>
        <CreateOrgForm />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="titulo text-verde">Cadastradas ({orgs.length})</h2>
        {orgs.length === 0 && <p className="corpo-p">Nenhuma ONG ainda.</p>}
        {orgs.map((org) => (
          <article key={org.id} className="card flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="titulo-card text-verde">
                  {org.name} {org.archivedAt && <span className="tag-cinza align-middle">Arquivada</span>}
                </h3>
                <p className="corpo-p">
                  /{org.slug} · {[org.city, org.state].filter(Boolean).join(" - ") || "sem cidade"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/${org.slug}`} className="btn-secondary" target="_blank">
                  Catálogo
                </Link>
                <Link href={`/painel/${org.slug}`} className="btn-primary">
                  Abrir painel
                </Link>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="rotulo mb-2 text-verde">Convidar responsável</p>
                <AdminInviteForm orgId={org.id} />
              </div>
              <form action={adminUpdateOrganizationAction} className="flex flex-col gap-2">
                <input type="hidden" name="orgId" value={org.id} />
                <label className="rotulo text-coral-forte" htmlFor={`max-${org.id}`}>
                  Limite de fotos por animal
                </label>
                <div className="flex gap-2">
                  <input
                    id={`max-${org.id}`}
                    name="maxPhotos"
                    type="number"
                    min={1}
                    max={20}
                    defaultValue={org.maxPhotosPerAnimal}
                    className="input w-24"
                  />
                  <button className="btn-verde">Salvar</button>
                  <button
                    name="archived"
                    value={org.archivedAt ? "false" : "true"}
                    className={org.archivedAt ? "btn-secondary" : "btn-danger"}
                  >
                    {org.archivedAt ? "Reativar" : "Arquivar"}
                  </button>
                </div>
              </form>
            </div>
            <form action={adminSetOrgHomeAction} className="flex flex-col gap-3 rounded-md bg-verde-50 p-4">
              <input type="hidden" name="orgId" value={org.id} />
              <p className="rotulo text-verde">Home do AdoteHub</p>
              <div className="flex flex-wrap items-end gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-tinta" htmlFor={`city-${org.id}`}>
                    Cidade na home
                  </label>
                  <input id={`city-${org.id}`} name="city" defaultValue={org.city ?? ""} maxLength={80} className="input w-56" />
                </div>
                <label className="flex cursor-pointer items-center gap-3 py-3 text-sm font-bold text-tinta">
                  <input
                    type="checkbox"
                    role="switch"
                    name="showOnHome"
                    defaultChecked={org.showOnHome}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden
                    className="relative h-7 w-12 flex-none rounded-pill bg-cinza/40 transition after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-papel after:shadow-card after:transition peer-checked:bg-verde peer-checked:after:translate-x-5 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-foco"
                  />
                  Aparecer na home
                </label>
                <button className="btn-verde">Salvar</button>
              </div>
              <p className="text-xs text-tinta-suave">Só aparece se a ONG não estiver arquivada. A ONG não altera isso.</p>
            </form>
          </article>
        ))}
      </section>
      </main>
    </>
  );
}
