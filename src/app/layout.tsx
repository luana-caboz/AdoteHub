import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], weight: ["700", "800"], variable: "--font-display", display: "swap" });
const texto = Figtree({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"], variable: "--font-texto", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: "AdoteHub", template: "%s · AdoteHub" },
  description: "Catálogo de animais para adoção de ONGs de proteção animal.",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${texto.variable}`}>
      <body className="min-h-dvh font-texto">{children}</body>
    </html>
  );
}
