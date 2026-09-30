import Link from "next/link";
import { PlatformHeader } from "@/components/brand/logo";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-4 py-12 md:grid-cols-2 md:py-20">
        <div className="flex justify-center md:order-2">
          <div className="flex h-[200px] w-[200px] items-center justify-center rounded-full bg-papel shadow-emblema md:h-[300px] md:w-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/adotehub-emblema.svg" alt="Emblema do AdoteHub" className="h-[84%] w-[84%]" />
          </div>
        </div>
        <div className="flex flex-col items-start gap-6 md:order-1">
          <h1 className="display-xl">
            <span className="block text-verde">Cada ONG,</span>
            <span className="block text-coral-forte">mais lares.</span>
          </h1>
          <p className="lead max-w-[60ch]">
            Catálogo de adoção gratuito para ONGs de proteção animal. Cada ONG tem seu próprio endereço, com a sua marca,
            os animais disponíveis e um formulário de adoção que chega organizado numa caixa de candidaturas.
          </p>
          <Link href="/entrar" className="btn-primary">
            Entrar (ONGs)
          </Link>
        </div>
      </main>
    </div>
  );
}
