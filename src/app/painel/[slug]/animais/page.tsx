import Link from "next/link";
import { Paw } from "@/components/brand/paw";
import { STATUS_LABEL, STATUS_TAG, SPECIES_LABEL, options } from "@/modules/animals/labels";
import { listOrgAnimals } from "@/modules/animals/repository";
import type { AnimalStatus } from "@/modules/animals/types";
import { requireOrgContext } from "@/modules/organizations/service";

export default async function AnimalsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; q?: string; arquivados?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const { db, org } = await requireOrgContext(slug);
  const status = sp.status && sp.status in STATUS_LABEL ? (sp.status as AnimalStatus) : undefined;
  const archived = sp.arquivados === "1";
  const animals = await listOrgAnimals(db, org.id, { status, q: sp.q, archived });

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display-l text-verde">{archived ? "Animais arquivados" : "Animais"}</h1>
        <Link href={`/painel/${slug}/animais/novo`} className="btn-primary">
          + Cadastrar animal
        </Link>
      </div>

      <form className="flex flex-wrap items-center gap-2" role="search">
        <input name="q" defaultValue={sp.q} placeholder="Buscar por nome ou ID" aria-label="Buscar" className="input max-w-xs" />
        <select name="status" defaultValue={status ?? ""} aria-label="Situação" className="input w-auto">
          <option value="">Todas as situações</option>
          {options(STATUS_LABEL).map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {archived && <input type="hidden" name="arquivados" value="1" />}
        <button className="btn-secondary">Filtrar</button>
        <Link href={`/painel/${slug}/animais${archived ? "" : "?arquivados=1"}`} className="btn-link">
          {archived ? "Ver ativos" : "Ver arquivados"}
        </Link>
      </form>

      {animals.length === 0 ? (
        <div className="card text-center text-tinta-suave">
          Nenhum animal aqui ainda.{" "}
          <Link href={`/painel/${slug}/importar`} className="font-bold text-verde underline underline-offset-4">
            Importe sua planilha
          </Link>{" "}
          ou cadastre um por um.
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((a) => (
            <li key={a.id}>
              <Link href={`/painel/${slug}/animais/${a.id}`} className="card-link flex gap-3 p-3!">
                {a.cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={a.cover.thumbUrl} alt="" className="h-20 w-20 flex-none rounded-sm object-cover" loading="lazy" />
                ) : (
                  <div className="flex h-20 w-20 flex-none items-center justify-center rounded-sm bg-verde-50">
                    <Paw className="h-8 w-8" />
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate font-display text-lg font-extrabold leading-tight tracking-[-0.015em] text-verde">
                    {a.name} <span className="font-texto text-sm font-medium text-tinta-suave">#{a.externalId}</span>
                  </p>
                  <p className="corpo-p">{SPECIES_LABEL[a.species]}</p>
                  <span className={`${STATUS_TAG[a.status]} mt-1`}>{STATUS_LABEL[a.status]}</span>
                  {a.photos.length === 0 && !a.cover && <span className="ml-1 text-xs font-bold text-mel">· adicionar fotos</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
