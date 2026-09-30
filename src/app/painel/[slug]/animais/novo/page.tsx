import { AnimalForm } from "@/components/animals/animal-form";
import { listCustomFields } from "@/modules/animals/custom-fields";
import { requireOrgContext } from "@/modules/organizations/service";

export default async function NewAnimalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { db, org } = await requireOrgContext(slug);
  const customFields = await listCustomFields(db, org.id);
  return (
    <div className="flex flex-col gap-5">
      <h1 className="display-l text-verde">Cadastrar animal</h1>
      <div className="card">
        <AnimalForm slug={slug} customFields={customFields} />
      </div>
    </div>
  );
}
