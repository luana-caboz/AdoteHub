import { formatDateTime } from "@/lib/format";
import { removeMemberAction, revokeInviteAction } from "@/modules/organizations/actions";
import { listMembers, listPendingInvites } from "@/modules/organizations/repository";
import { requireOrgContext } from "@/modules/organizations/service";
import { ROLE_LABEL } from "@/modules/organizations/types";
import { getSiteUrl } from "@/lib/site-url";
import { CopyButton } from "@/components/ui";
import { TeamInviteForm } from "./invite-form";

export default async function TeamPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, org, userId } = await requireOrgContext(slug, "admin");
  const [members, invites] = await Promise.all([listMembers(db, org.id), listPendingInvites(db, org.id)]);
  const siteUrl = await getSiteUrl();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-l text-verde">Equipe</h1>

      <section className="card">
        <h2 className="titulo mb-3 text-verde">Convidar</h2>
        <TeamInviteForm slug={slug} />
      </section>

      {invites.length > 0 && (
        <section className="card">
          <h2 className="titulo mb-3 text-verde">Convites pendentes</h2>
          <ul className="flex flex-col divide-y divide-linha">
            {invites.map((i) => (
              <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                <span>
                  {i.email} · {ROLE_LABEL[i.role]} <span className="text-xs text-tinta-suave">até {formatDateTime(i.expiresAt)}</span>
                </span>
                <span className="flex gap-2">
                  <CopyButton text={`${siteUrl}/convite/${i.token}`} />
                  <form action={revokeInviteAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="inviteId" value={i.id} />
                    <button className="btn-danger">Cancelar</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <h2 className="titulo mb-3 text-verde">Membros</h2>
        <ul className="flex flex-col divide-y divide-linha">
          {members.map((m) => (
            <li key={m.userId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span>
                {m.email} · <span className="text-tinta-suave">{ROLE_LABEL[m.role]}</span>
                {m.userId === userId && <span className="text-xs text-tinta-suave"> (você)</span>}
              </span>
              {m.role !== "owner" && m.userId !== userId && (
                <form action={removeMemberAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="userId" value={m.userId} />
                  <button className="btn-danger">Remover</button>
                </form>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
