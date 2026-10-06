import Link from "next/link";
import { PlatformHeader } from "@/components/brand/logo";
import { HowItWorks } from "@/components/home/how-it-works";
import { OrgCard } from "@/components/home/org-card";
import { OrgsCta } from "@/components/home/orgs-cta";
import { getHomeOrgs } from "@/modules/organizations/public";

export const revalidate = 60;

export default async function Home() {
  const orgs = await getHomeOrgs();

  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader>
        <a href="#ongs" className="btn-link px-1!">
          ONGs
        </a>
        <Link href="/entrar" className="btn-secondary px-4! py-2! text-sm! md:px-[26px]! md:py-[14px]! md:text-base!">
          Entrar
        </Link>
      </PlatformHeader>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-4 py-12 md:py-20">
        <section className="grid items-center gap-12 md:grid-cols-2">
          <div className="hidden justify-center md:order-2 md:flex">
            <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full bg-papel shadow-emblema md:h-[300px] md:w-[300px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/adotehub-emblema.svg" alt="" className="h-[84%] w-[84%]" />
            </div>
          </div>
          <div className="flex flex-col items-start gap-6 md:order-1">
            <h1 className="display-xl">
              <span className="block text-verde">Cada ONG,</span>
              <span className="block text-coral-forte">mais lares.</span>
            </h1>
            <p className="lead max-w-[60ch]">
              Encontre um animal para adotar nas ONGs da sua cidade. Se você é de uma ONG, monte seu catálogo e receba
              candidaturas organizadas, de graça.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="#ongs" className="btn-primary">
                Ver ONGs e animais
              </a>
              <Link href="/entrar" className="btn-secondary">
                Sou de uma ONG
              </Link>
            </div>
          </div>
        </section>

        <section id="ongs" aria-labelledby="ongs-titulo" className="flex flex-col gap-6">
          <div>
            <p className="rotulo text-coral-forte">Para adotar</p>
            <h2 id="ongs-titulo" className="titulo text-verde">
              ONGs no AdoteHub
            </h2>
          </div>
          {orgs.length > 0 ? (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {orgs.map((org) => (
                <li key={org.slug}>
                  <OrgCard org={org} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="card text-base text-tinta">Estamos começando. Em breve, as primeiras ONGs aparecem aqui.</p>
          )}
        </section>

        <HowItWorks />
        <OrgsCta />
      </main>

      <footer className="border-t border-linha bg-papel">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/adotehub-emblema.svg" alt="" width={32} height={32} />
          <span className="text-base font-bold text-verde">AdoteHub</span>
        </div>
      </footer>
    </div>
  );
}
