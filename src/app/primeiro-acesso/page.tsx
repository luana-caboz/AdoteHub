import type { Metadata } from "next";
import Link from "next/link";
import { PlatformHeader } from "@/components/brand/logo";
import { FirstAccessForm } from "./first-access-form";

export const metadata: Metadata = { title: "Primeiro acesso" };

export default async function FirstAccessPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; erro?: string }>;
}) {
  const { next, email, erro } = await searchParams;
  const target = next ?? "/painel";
  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
        <div>
          <h1 className="display-l text-verde">Primeiro acesso</h1>
          <p className="lead mt-2">
            Informe seu e-mail. Enviaremos um link para confirmar o e-mail e criar sua senha. Serve também se você esqueceu a senha.
          </p>
        </div>
        {erro && (
          <p role="alert" className="rounded-md bg-mel-50 px-4 py-3 text-sm font-semibold text-mel">
            O link expirou ou já foi usado. Peça um novo abaixo.
          </p>
        )}
        <FirstAccessForm next={target} defaultEmail={email} />
        <p className="corpo-p">
          Já tem senha?{" "}
          <Link
            href={`/entrar?next=${encodeURIComponent(target)}`}
            className="font-bold text-verde underline underline-offset-4"
          >
            Entrar →
          </Link>
        </p>
      </main>
    </div>
  );
}
