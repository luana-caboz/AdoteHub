import Link from "next/link";
import { Paw } from "@/components/brand/paw";

export function OrgLinkCard({ name, slug, logoUrl }: { name: string; slug: string; logoUrl: string | null }) {
  return (
    <Link href={`/painel/${slug}`} className="card-link group flex h-full flex-col gap-3">
      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-verde-50">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Paw className="h-8 w-8" />
        )}
      </div>
      <p className="titulo-card break-words text-verde">{name}</p>
      <p className="corpo-p break-all">/{slug}</p>
      <span className="mt-auto pt-1 font-bold text-verde group-hover:underline group-hover:underline-offset-4">Abrir painel →</span>
    </Link>
  );
}

export function OrgLinkGrid({ children }: { children: React.ReactNode }) {
  return <ul className="grid gap-6 md:grid-cols-2">{children}</ul>;
}
