import type { CSSProperties } from "react";

type Rgb = [number, number, number];

const HEX = /^#([0-9a-f]{6})$/i;

export function isHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX.test(value);
}

function toRgb(hex: string): Rgb | null {
  const m = HEX.exec(hex);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminance([r, g, b]: Rgb): number {
  const ch = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

const mix = (a: Rgb, b: Rgb, t: number): Rgb => [0, 1, 2].map((i) => Math.round(a[i] + (b[i] - a[i]) * t)) as Rgb;
const toHex = (c: Rgb) => `#${c.map((v) => v.toString(16).padStart(2, "0")).join("")}`;

const CREME: Rgb = [0xfb, 0xf7, 0xf1];
const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];
const TINTA = "#1d2b24";
const MIN_CONTRAST = 4.5;

export function contrastRatio(a: string, b: string): number {
  const ra = toRgb(a);
  const rb = toRgb(b);
  if (!ra || !rb) return 1;
  const [hi, lo] = [luminance(ra), luminance(rb)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Usada pela prévia da marca e pelo card social (não muda): preto ou branco, o que contrastar mais.
export function readableTextColor(hex: string): "#000000" | "#ffffff" {
  return contrastRatio(hex, "#000000") > contrastRatio(hex, "#ffffff") ? "#000000" : "#ffffff";
}

// Texto sobre uma cor de marca: branco; senão `tinta`; senão preto (sempre passa 4.5:1).
export function onColor(hex: string): string {
  if (!isHexColor(hex)) return "#ffffff";
  if (contrastRatio(hex, "#ffffff") >= MIN_CONTRAST) return "#ffffff";
  if (contrastRatio(hex, TINTA) >= MIN_CONTRAST) return TINTA;
  return "#000000";
}

// Variante "-50": a cor misturada com branco (fundo de tag, faixa).
export function brandTint(hex: string): string {
  const base = toRgb(hex);
  return base ? toHex(mix(base, WHITE, 0.86)) : "#e3f1ea";
}

// Variante de texto: a própria cor se já passa 4.5:1 sobre `creme`, `papel` e o seu "-50"; senão, escurecida.
export function brandInk(hex: string): string {
  const base = toRgb(hex);
  if (!base) return "#1f6b4f";
  const bgs = [CREME, WHITE, toRgb(brandTint(hex))!];
  const darkestBg = Math.min(...bgs.map(luminance));
  for (let t = 0; t <= 1; t += 0.05) {
    const c = mix(base, BLACK, t);
    if ((darkestBg + 0.05) / (luminance(c) + 0.05) >= MIN_CONTRAST) return toHex(c);
  }
  return "#000000";
}

// Três papéis de cor da ONG: principal, destaque e apoio (opcional; sem apoio, vale a principal).
export function brandStyle(primary: string, secondary: string, support?: string | null): CSSProperties {
  const third = isHexColor(support) ? support : primary;
  const roles = [
    ["brand", primary],
    ["brand-2", secondary],
    ["brand-3", third],
  ] as const;
  const style: Record<string, string> = {};
  for (const [name, hex] of roles) {
    style[`--${name}`] = hex;
    style[`--${name}-50`] = brandTint(hex);
    style[`--${name}-ink`] = brandInk(hex);
    style[`--${name}-contrast`] = onColor(hex);
  }
  return style as CSSProperties;
}
