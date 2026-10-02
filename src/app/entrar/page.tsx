import type { Metadata } from "next";
import { PlatformHeader } from "@/components/brand/logo";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; email?: string; erro?: string }>;
}) {
  const { next, email, erro } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
        <div>
          <h1 className="display-l text-verde">Entrar</h1>
          <p className="lead mt-2">Entre com seu e-mail e sua senha.</p>
        </div>
        {erro && (
          <p role="alert" className="rounded-md bg-mel-50 px-4 py-3 text-sm font-semibold text-mel">
            O link expirou ou já foi usado. Use “Receber link por e-mail” abaixo para pedir outro.
          </p>
        )}
        <LoginForm next={next ?? "/painel"} defaultEmail={email} />
      </main>
    </div>
  );
}
