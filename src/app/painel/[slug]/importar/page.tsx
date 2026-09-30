import { formatDateTime } from "@/lib/format";
import { listCustomFields } from "@/modules/animals/custom-fields";
import { getSavedMapping, listImportRuns } from "@/modules/imports/repository";
import { requireOrgContext } from "@/modules/organizations/service";
import { ImportWizard } from "./import-wizard";

export default async function ImportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, org } = await requireOrgContext(slug);
  const [saved, runs, customFields] = await Promise.all([getSavedMapping(db, org.id), listImportRuns(db, org.id), listCustomFields(db, org.id)]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="display-l text-verde">Importar planilha</h1>
        <p className="lead">
          Envie a planilha que a ONG já usa (Excel, CSV ou exportada do Google Planilhas). Você diz qual coluna é qual uma
          vez só — o mapeamento fica salvo para as próximas importações. Animais são reconhecidos pelo ID: quem já existe é
          atualizado, não duplicado.
        </p>
      </div>

      <ImportWizard slug={slug} saved={saved ? { columnMap: saved.columnMap, valueMap: saved.valueMap } : null} customFields={customFields.map((f) => ({key: f.key, label: f.label}))} />

      {runs.length > 0 && (
        <section className="card">
          <h2 className="titulo mb-3 text-verde">Importações recentes</h2>
          <ul className="flex flex-col divide-y divide-linha text-sm">
            {runs.map((r) => (
              <li key={r.id} className="py-2">
                <p>
                  <strong>{r.fileName ?? "planilha"}</strong> · {formatDateTime(r.createdAt)} — {r.created} novos, {r.updated}{" "}
                  atualizados, {r.failed} com erro
                </p>
                {r.errors.length > 0 && (
                  <details className="mt-1 text-tinta-suave">
                    <summary className="cursor-pointer">Ver erros</summary>
                    <ul className="ml-4 list-disc">
                      {r.errors.slice(0, 50).map((e, i) => (
                        <li key={i}>
                          Linha {e.row}
                          {e.key ? ` (${e.key})` : ""}: {e.messages.join("; ")}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
