import { env } from "@/lib/env";
import { requireOrgContext } from "@/modules/organizations/service";
import { BrandForm, ExtraQuestionsForm, LogoUploader } from "./forms";

export default async function BrandPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { org } = await requireOrgContext(slug, "admin");
  const questionsText = org.adoptionExtraQuestions.map((q) => `${q.label}${q.required ? " *" : ""}`).join("\n");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="display-l text-verde">Marca e formulário</h1>

      <section className="card flex flex-col gap-4">
        <div>
          <h2 className="titulo text-verde">Endereço público</h2>
          <p className="lead">
            {env.siteUrl.replace(/^https?:\/\//, "")}/<strong>{org.slug}</strong>
          </p>
          <p className="text-xs text-tinta-suave">Para mudar o endereço, fale com a equipe do AdoteHub (links já compartilhados deixariam de funcionar).</p>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="titulo text-verde">Logo</h2>
        <LogoUploader slug={slug} orgId={org.id} logoUrl={org.logoUrl} name={org.name} />
      </section>

      <section className="card">
        <h2 className="titulo mb-4 text-verde">Dados e cores</h2>
        <BrandForm slug={slug} org={org} />
      </section>

      <section className="card">
        <h2 className="titulo mb-1 text-verde">Perguntas extras do formulário de adoção</h2>
        <p className="mb-4 text-sm text-tinta-suave">
          O formulário já tem um núcleo fixo (contato, moradia, quintal, telas, outros animais, crianças, rotina e motivação).
          Aqui você acrescenta perguntas próprias da ONG.
        </p>
        <ExtraQuestionsForm slug={slug} initial={questionsText} />
      </section>
    </div>
  );
}
