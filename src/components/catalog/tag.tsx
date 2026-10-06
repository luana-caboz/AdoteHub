// Pílula nas cores da ONG. Papéis: principal (sexo), destaque (porte), apoio (idade).
// O texto usa a variante legível da cor, não a cor de preenchimento.
const TONE = { brand: "tag-brand", "brand-2": "tag-brand-2", "brand-3": "tag-brand-3" } as const;

export function Tag({ tone, children }: { tone: keyof typeof TONE; children: React.ReactNode }) {
  return <span className={TONE[tone]}>{children}</span>;
}
