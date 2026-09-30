import { listCustomFields } from "@/modules/animals/custom-fields";
import { addCustomFieldAction, updateCustomFieldAction } from "@/modules/animals/custom-fields-actions";
import { requireOrgContext } from "@/modules/organizations/service";

export default async function CustomFieldsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, org } = await requireOrgContext(slug, "admin");
  const fields = await listCustomFields(db, org.id, { includeArchived: true });
  const active = fields.filter((f) => !f.archivedAt);
  const archived = fields.filter((f) => f.archivedAt);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-l text-verde">Campos extras</h1>
        <p className="lead max-w-prose">
          Informações que a sua ONG usa e que não estão no cadastro padrão, como Personalidade ou Nível de energia. Elas
          aparecem no cadastro de cada animal e podem vir da planilha.
        </p>
      </div>

      <form action={addCustomFieldAction} className="card flex flex-wrap items-end gap-3">
        <input type="hidden" name="slug" value={slug} />
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-bold">Novo campo</span>
          <input name="label" required maxLength={60} placeholder="Ex.: Personalidade" className="input" />
        </label>
        <button className="btn-primary">Criar campo</button>
      </form>

      <section className="card flex flex-col gap-2">
        <h2 className="titulo text-verde">Campos da ONG ({active.length} de 20)</h2>
        {active.length === 0 && <p className="text-tinta-suave">Nenhum campo ainda.</p>}
        <ul className="flex flex-col divide-y divide-linha">
          {active.map((f) => (
            <li key={f.id} className="flex flex-wrap items-center gap-3 py-3">
              <form action={updateCustomFieldAction} className="flex flex-1 flex-wrap items-center gap-2">
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="fieldId" value={f.id} />
                <input name="label" defaultValue={f.label} maxLength={60} className="input min-w-48 flex-1" aria-label="Nome do campo" />
                <button className="btn-secondary">Renomear</button>
              </form>
              <form action={updateCustomFieldAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="fieldId" value={f.id} />
                <input type="hidden" name="isPublic" value={f.isPublic ? "false" : "true"} />
                <button className="btn-secondary" title="Mostrar ou esconder este campo na página pública do animal">
                  {f.isPublic ? "Aparece no catálogo" : "Só a equipe vê"}
                </button>
              </form>
              <form action={updateCustomFieldAction}>
                <input type="hidden" name="slug" value={slug} />
                <input type="hidden" name="fieldId" value={f.id} />
                <input type="hidden" name="archived" value="true" />
                <button className="btn-danger">Arquivar</button>
              </form>
            </li>
          ))}
        </ul>
        <p className="text-sm text-tinta-suave">
          Clique em “Aparece no catálogo” para alternar. Campos com informações internas (localização, observações da
          equipe) devem ficar como “Só a equipe vê”.
        </p>
      </section>

      {archived.length > 0 && (
        <section className="card flex flex-col gap-2">
          <h2 className="font-bold text-tinta">Arquivados</h2>
          <ul className="flex flex-col gap-2">
            {archived.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3">
                <span className="text-tinta-suave">{f.label}</span>
                <form action={updateCustomFieldAction}>
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="fieldId" value={f.id} />
                  <input type="hidden" name="archived" value="false" />
                  <button className="btn-secondary">Reativar</button>
                </form>
              </li>
            ))}
          </ul>
          <p className="text-sm text-tinta-suave">Arquivar esconde o campo, mas não apaga o que já foi preenchido.</p>
        </section>
      )}
    </div>
  );
}