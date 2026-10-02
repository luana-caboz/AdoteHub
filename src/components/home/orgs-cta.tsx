import Link from "next/link";
import { contatoHref } from "@/lib/env";

export function OrgsCta() {
  const href = contatoHref();
  return (
    <section aria-labelledby="para-ongs" className="flex flex-col items-start gap-4 rounded-lg bg-verde-50 p-6 md:p-8">
      <h2 id="para-ongs" className="titulo text-verde">
        Quer sua ONG aqui?
      </h2>
      <p className="max-w-[60ch] text-base text-tinta">
        Catálogo com a sua marca, formulário de adoção e caixa de candidaturas, tudo gratuito.
      </p>
      {href && (
        <a href={href} className="btn-secondary" {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          Falar com o AdoteHub
        </a>
      )}
      <p className="corpo-p">
        Já tem convite?{" "}
        <Link href="/entrar" className="btn-link">
          Entrar →
        </Link>
      </p>
    </section>
  );
}
