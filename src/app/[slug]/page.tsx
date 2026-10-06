import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AnimalCard } from "@/components/catalog/animal-card";
import { ShareButtons } from "@/components/catalog/share-buttons";
import { env } from "@/lib/env";
import { createPublicClient } from "@/lib/supabase/public";
import { AGE_LABEL, SEX_LABEL, SIZE_LABEL, SPECIES_LABEL, options } from "@/modules/animals/labels";
import { listPublicAnimals } from "@/modules/animals/repository";
import type { AgeGroup, PublicFilters, Sex, Size, Species } from "@/modules/animals/types";
import { getPublicOrg } from "@/modules/organizations/public";

type SP = { q?: string; especie?: string; sexo?: string; porte?: string; idade?: string; pagina?: string };

function pick<T extends string>(value: string | undefined, labels: Record<T, string>): T | undefined {
  return value && value in labels ? (value as T) : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const org = await getPublicOrg(slug);
  if (!org) return {};
  const title = `Adote um amigo — ${org.name}`;
  const description = `Conheça os animais disponíveis para adoção na ${org.name}${org.city ? `, ${org.city}` : ""}.`;
  return { title, description, openGraph: { title, description, type: "website" }, alternates: { canonical: `/${slug}` } };
}

export default async function CatalogPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SP>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const org = await getPublicOrg(slug);
  if (!org) notFound();

  const filters: PublicFilters = {
    q: sp.q?.slice(0, 60),
    species: pick<Species>(sp.especie, SPECIES_LABEL),
    sex: pick<Sex>(sp.sexo, SEX_LABEL),
    size: pick<Size>(sp.porte, SIZE_LABEL),
    ageGroup: pick<AgeGroup>(sp.idade, AGE_LABEL),
    page: Math.max(1, Number(sp.pagina) || 1),
  };
  const { items, total, page, pageSize } = await listPublicAnimals(createPublicClient(), org.id, filters);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const hasFilters = Boolean(filters.q || filters.species || filters.sex || filters.size || filters.ageGroup);

  const selects: { name: string; label: string; opts: { value: string; label: string }[]; value?: string }[] = [
    { name: "especie", label: "Espécie", opts: options(SPECIES_LABEL), value: filters.species },
    { name: "sexo", label: "Sexo", opts: options(SEX_LABEL).filter((o) => o.value !== "unknown"), value: filters.sex },
    { name: "porte", label: "Porte", opts: options(SIZE_LABEL), value: filters.size },
    { name: "idade", label: "Idade", opts: options(AGE_LABEL), value: filters.ageGroup },
  ];

  const pageHref = (p: number) => {
    const qs = new URLSearchParams(Object.entries(sp).filter(([k, v]) => k !== "pagina" && v) as [string, string][]);
    if (p > 1) qs.set("pagina", String(p));
    const s = qs.toString();
    return `/${slug}${s ? `?${s}` : ""}`;
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="display-l text-brand-ink">Adote um amigo</h1>
          <p className="lead mt-2">
            {total} {total === 1 ? "animal esperando" : "animais esperando"} por um lar
          </p>
        </div>
        <ShareButtons url={`${env.siteUrl}/${slug}`} title={org.name} text={`Conheça os animais para adoção da ${org.name}:`} />
      </div>

      <form className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" role="search">
        <div className="relative sm:col-span-2 lg:col-span-4">
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="pointer-events-none absolute left-5 top-1/2 h-[22px] w-[22px] -translate-y-1/2 fill-none stroke-brand stroke-[2.4]"
            strokeLinecap="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.6-3.6" />
          </svg>
          <input
            name="q"
            defaultValue={sp.q}
            placeholder="Buscar por nome, raça, cor"
            className="input-pill pl-[52px]!"
            aria-label="Buscar"
          />
        </div>
        {selects.map(({ name, label, opts, value }, i) => (
          <label
            key={name}
            className="flex h-[52px] flex-col justify-center rounded-pill border-[1.5px] border-linha bg-papel px-5 focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-foco"
          >
            <span className={`rotulo ${i % 2 === 0 ? "text-brand-ink" : "text-brand-2-ink"}`}>{label}</span>
            <select name={name} defaultValue={value ?? ""} className="w-full bg-transparent text-sm font-bold text-tinta outline-none">
              <option value="">Todos</option>
              {opts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        ))}
        <div className="flex gap-3 sm:col-span-2 lg:col-span-4">
          <button className="btn-brand">Filtrar</button>
          {hasFilters && (
            <Link href={`/${slug}`} className="btn-secondary">
              Limpar
            </Link>
          )}
        </div>
      </form>

      {items.length === 0 ? (
        <p className="lead py-12 text-center">
          {hasFilters ? "Nenhum animal com esses filtros." : "Nenhum animal disponível no momento."}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((a) => (
            <li key={a.id}>
              <AnimalCard orgSlug={slug} animal={a} />
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-center gap-3" aria-label="Paginação">
          {page > 1 && (
            <Link href={pageHref(page - 1)} className="btn-secondary">
              ← Anterior
            </Link>
          )}
          <span className="corpo-p">
            Página {page} de {pages}
          </span>
          {page < pages && (
            <Link href={pageHref(page + 1)} className="btn-secondary">
              Próxima →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
