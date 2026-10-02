const STEPS = [
  "Escolha um animal no catálogo da ONG.",
  "Envie sua candidatura pelo formulário.",
  "A ONG entra em contato com você.",
];

export function HowItWorks() {
  return (
    <section aria-labelledby="como-funciona" className="flex flex-col gap-6">
      <div>
        <p className="rotulo text-coral-forte">Para adotar</p>
        <h2 id="como-funciona" className="titulo text-verde">
          Como funciona
        </h2>
      </div>
      <ol className="grid gap-6 md:grid-cols-3">
        {STEPS.map((text, i) => (
          <li key={text} className="card flex items-start gap-4">
            <span
              aria-hidden
              className="titulo-card flex h-12 w-12 flex-none items-center justify-center rounded-full bg-verde-50 text-verde"
            >
              {i + 1}
            </span>
            <p className="pt-2.5 text-base font-semibold text-tinta">
              <span className="sr-only">Passo {i + 1}: </span>
              {text}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}
