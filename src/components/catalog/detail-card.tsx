import { CheckIcon } from "./icons";

export function DetailCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="card flex flex-col gap-4">
      <h2 className="titulo-card flex items-center gap-2 text-brand-ink">
        {icon}
        {title}
      </h2>
      <dl className="flex flex-col gap-3">{children}</dl>
    </section>
  );
}

export function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-2 text-base">
      <dt className="font-bold text-tinta">{label}:</dt>
      <dd className="whitespace-pre-line text-tinta">{children}</dd>
    </div>
  );
}

// Sim = check em traço; Não = "Não"; vazio = "Não informado" (nunca "Não" sem dado).
export function HealthRow({ label, value }: { label: string; value: boolean | null }) {
  return (
    <DetailRow label={label}>
      {value === null ? (
        <span className="text-tinta-suave">Não informado</span>
      ) : value ? (
        <span className="inline-flex items-center gap-1">
          <CheckIcon className="h-[18px] w-[18px] text-brand-3-ink" />
          Sim
        </span>
      ) : (
        "Não"
      )}
    </DetailRow>
  );
}
