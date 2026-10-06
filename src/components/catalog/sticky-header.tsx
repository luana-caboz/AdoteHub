"use client";

import { useEffect, useState } from "react";

// Cabeçalho fixo do catálogo da ONG. Altura única (--header-h); sombra suave só depois de rolar.
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b border-linha bg-papel transition-shadow ${scrolled ? "shadow-card" : ""}`}
      style={{ height: "var(--header-h)", paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      {children}
    </header>
  );
}
