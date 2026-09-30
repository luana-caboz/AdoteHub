import type { CSSProperties } from "react";

export function readableTextColor(hex: string): "#000000" | "#ffffff" {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#ffffff";
  const n = parseInt(m[1], 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  const l = 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
  return (l + 0.05) / 0.05 > 1.05 / (l + 0.05) ? "#000000" : "#ffffff";
}

export function brandStyle(primary: string, secondary: string): CSSProperties {
  return {
    ["--brand" as string]: primary,
    ["--brand-contrast" as string]: readableTextColor(primary),
    ["--brand-2" as string]: secondary,
    ["--brand-2-contrast" as string]: readableTextColor(secondary),
  };
}
