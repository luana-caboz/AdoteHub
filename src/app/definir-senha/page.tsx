import type { Metadata } from "next";
import { PlatformHeader } from "@/components/brand/logo";
import { safeNext } from "@/lib/auth/safe-next";
import { requireUser } from "@/modules/organizations/service";
import { SetPasswordForm } from "./set-password-form";

export const metadata: Metadata = { title: "Criar senha", robots: { index: false } };

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const user = await requireUser(`/definir-senha?next=${encodeURIComponent(next)}`);
  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
        <div>
          <h1 className="display-l text-verde">Crie sua senha</h1>
          <p className="lead mt-2">
            E-mail confirmado: <strong className="text-tinta">{user.email}</strong>. Nos próximos acessos, você entra com e-mail e senha.
          </p>
        </div>
        <SetPasswordForm next={next} />
      </main>
    </div>
  );
}
