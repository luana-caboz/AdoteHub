import { Logo } from "@/components/brand/logo";
import { SupportBanner } from "@/components/painel/support-notice";
import { canManageTeam, requireOrgContext } from "@/modules/organizations/service";
import { ROLE_LABEL } from "@/modules/organizations/types";
import Link from "next/link";
import { NavLink } from "./nav-link";

export default async function OrgPanelLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { org, role, isSupport } = await requireOrgContext(slug);
  const base = `/painel/${slug}`;
  const links = [
    { href: `${base}/animais`, label: "Animais" },
    { href: `${base}/candidaturas`, label: "Candidaturas" },
    { href: `${base}/importar`, label: "Importar planilha" },
    ...(canManageTeam(role)
      ? [
          { href: `${base}/marca`, label: "Marca e formulário" },
          { href: `${base}/campos`, label: "Campos extras" },
          { href: `${base}/equipe`, label: "Equipe" },
        ]
      : []),
  ];

  return (
    <div className="min-h-dvh">
      {isSupport && <SupportBanner orgName={org.name} />}
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logo href={base} />
          <div className="flex items-center gap-2">
            <Link href={`/${slug}`} target="_blank" className="btn-secondary px-5! py-2.5! text-sm!">
              Ver catálogo
            </Link>
            <form action="/sair" method="post">
              <button className="btn-link">Sair</button>
            </form>
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 pb-2">
          {org.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={org.logoUrl} alt="" className="h-9 w-9 rounded-full border border-linha bg-papel object-contain" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-verde-50 font-display text-lg font-extrabold text-verde">
              {org.name.charAt(0)}
            </span>
          )}
          <span>
            <span className="block font-bold leading-tight">{org.name}</span>
            <span className="corpo-p block text-xs!">{isSupport ? "Suporte AdoteHub" :  ROLE_LABEL[role]}</span>
          </span>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4">
          {links.map((l) => (
            <NavLink key={l.href} href={l.href}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
