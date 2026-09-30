import type { Metadata } from "next";
import { PlatformHeader } from "@/components/brand/logo";
import { createClient } from "@/lib/supabase/server";
import { ROLE_LABEL, type MemberRole } from "@/modules/organizations/types";
import { getCurrentUser } from "@/modules/organizations/service";
import { LoginForm } from "@/app/entrar/login-form";
import { AcceptInviteForm } from "./accept-form";

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
                <p className="corpo-p">Primeiro, confirme seu e-mail:</p>
                <LoginForm next={`/convite/${token}`} defaultEmail={data.email} />
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
              <AcceptInviteForm token={token} />
            )}
          </>
        )}
      </main>
    </div>
  );
}
