import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PlatformHeader } from "@/components/brand/logo";
import { friendlyDbError } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type MemberRole } from "@/modules/organizations/types";
import { getCurrentUser } from "@/modules/organizations/service";
import { FirstAccessForm } from "@/app/primeiro-acesso/first-access-form";

export const metadata: Metadata = { title: "Convite" };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const db = await createClient();
  const { data } = UUID.test(token)
    ? await db.rpc("get_invite", { p_token: token }).maybeSingle<{
        organization_name: string;
        organization_slug: string;
        email: string;
        role: MemberRole;
        state: "pending" | "accepted" | "expired" | "revoked";
      }>()
    : { data: null };
  const user = await getCurrentUser();

  // Logada(o) com o e-mail do convite: aceita na hora e vai direto para o painel da ONG.
  let acceptError: string | null = null;
  if (data?.state === "pending" && user?.email?.toLowerCase() === data.email) {
    const { data: slug, error } = await db.rpc("accept_invite", { p_token: token });
    if (!error && typeof slug === "string") redirect(`/painel/${slug}`);
    acceptError = friendlyDbError(error);
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PlatformHeader />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6 px-4 py-12">
        {!data || data.state === "revoked" ? (
          <p className="lead">Convite inválido. Peça um novo link para quem convidou você.</p>
        ) : data.state === "expired" ? (
          <p className="lead">Este convite expirou. Peça um novo link para quem convidou você.</p>
        ) : data.state === "accepted" ? (
          <p className="lead">
            Este convite já foi usado.{" "}
            <a className="font-bold text-verde underline underline-offset-4" href="/painel">
              Ir para o painel →
            </a>
          </p>
        ) : (
          <>
            <div>
              <h1 className="display-l text-verde">Você foi convidada(o) para {data.organization_name}</h1>
              <p className="lead mt-2">
                Papel: {ROLE_LABEL[data.role]} · convite para <strong className="text-tinta">{data.email}</strong>
              </p>
            </div>
            {!user ? (
              <>
                <p className="corpo-p">Primeiro acesso? Confirme seu e-mail e crie sua senha:</p>
                <FirstAccessForm next={`/convite/${token}`} defaultEmail={data.email} />
                <p className="corpo-p">
                  Já tem senha?{" "}
                  <a
                    className="font-bold text-verde underline underline-offset-4"
                    href={`/entrar?next=${encodeURIComponent(`/convite/${token}`)}&email=${encodeURIComponent(data.email)}`}
                  >
                    Entrar →
                  </a>
                </p>
              </>
            ) : user.email?.toLowerCase() !== data.email ? (
              <div className="flex flex-col gap-3">
                <p role="alert" className="rounded-md bg-mel-50 px-4 py-3 text-sm font-semibold text-mel">
                  Você está conectada(o) como {user.email}, mas o convite é para {data.email}.
                </p>
                <form action="/sair" method="post">
                  <input type="hidden" name="next" value={`/convite/${token}`} />
                  <button className="btn-secondary">Sair e entrar com outro e-mail</button>
                </form>
              </div>
            ) : (
              <p role="alert" className="rounded-md bg-erro-50 px-4 py-3 text-sm font-semibold text-erro">
                {acceptError ?? "Não foi possível aceitar o convite. Tente abrir o link novamente."}
              </p>
            )}
          </>
        )}
      </main>
    </div>
  );
}
