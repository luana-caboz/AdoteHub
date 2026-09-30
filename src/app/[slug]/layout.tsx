import Link from "next/link";
import { notFound } from "next/navigation";
import { brandStyle } from "@/lib/color";
import { whatsappLink } from "@/lib/format";
import { getPublicOrg } from "@/modules/organizations/public";

export default async function OrgPublicLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const org = await getPublicOrg(slug);
  if (!org) notFound();

  const navLink = "rounded-md px-2 py-1 font-bold text-brand underline-offset-4 hover:underline";

  return (
    <div style={brandStyle(org.primaryColor, org.secondaryColor)} className="flex min-h-dvh flex-col">
      <header className="border-b border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href={`/${org.slug}`} className="flex items-center gap-3 rounded-md">
            {org.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={org.logoUrl} alt="" className="h-12 w-12 flex-none rounded-full border border-linha bg-papel object-contain p-0.5" />
            ) : (
              <span className="flex h-12 w-12 flex-none items-center justify-center rounded-full bg-brand font-display text-xl font-extrabold text-brand-contrast">
                {org.name.charAt(0)}
              </span>
            )}
            <span>
              <span className="block font-display text-[28px] font-extrabold leading-none tracking-[-0.03em] text-brand">{org.name}</span>
              {(org.city || org.state) && (
                <span className="corpo-p mt-1 block">{[org.city, org.state].filter(Boolean).join(" - ")}</span>
              )}
            </span>
          </Link>
          <nav className="flex gap-2 text-sm">
            {org.whatsapp && (
              <a href={whatsappLink(org.whatsapp)} target="_blank" rel="noopener" className={navLink}>
                WhatsApp
              </a>
            )}
            {org.instagram && (
              <a href={`https://instagram.com/${org.instagram}`} target="_blank" rel="noopener" className={navLink}>
                Instagram
              </a>
            )}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">{children}</main>
      <footer className="border-t border-linha bg-papel py-6">
        <Link href="/" className="mx-auto flex w-fit items-center gap-2 rounded-md text-sm font-semibold text-tinta-suave">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/adotehub-emblema.svg" alt="" width={24} height={24} />
          <span>
            Catálogo feito com <span className="font-display font-extrabold tracking-[-0.03em]"><span className="text-verde">Adote</span><span className="text-coral-forte">Hub</span></span>
          </span>
        </Link>
      </footer>
    </div>
  );
}
