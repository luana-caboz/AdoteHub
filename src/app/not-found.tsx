import Link from "next/link";
import { PlatformHeader } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="titulo text-verde">Página não encontrada</h1>
        <p className="lead">O link pode estar errado, ou o animal já encontrou um lar.</p>
        <Link href="/" className="btn-secondary">
          Ir para o início
        </Link>
      </main>
    </div>
  );
}
