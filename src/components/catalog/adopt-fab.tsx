import Link from "next/link";
import { PawIcon } from "./icons";

// Único botão principal da página do animal: pílula fixa no canto inferior direito.
// `data-fab` faz o layout reservar espaço no fim da página (ver [slug]/layout.tsx).
export function AdoptFab({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      data-fab
      className="btn-brand fixed right-4 z-20 rounded-pill! px-5! sm:right-6"
      style={{ bottom: "calc(24px + env(safe-area-inset-bottom, 0px))" }}
    >
      <PawIcon className="h-5 w-5" />
      {label}
    </Link>
  );
}
