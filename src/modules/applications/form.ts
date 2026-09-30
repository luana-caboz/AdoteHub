import { z } from "zod";

export const FORM_VERSION = "core-v1";
export const CONSENT_VERSION = "2026-09-v1";

export const CONSENT_ORG_TEXT = (orgName: string) =>
  `Autorizo que ${orgName} use os dados deste formulário para avaliar esta adoção e entrar em contato comigo.`;
export const CONSENT_MATCHING_TEXT =
  "Quero que meu perfil fique salvo no AdoteHub para me sugerir outros animais compatíveis (opcional).";

export const HOUSING_TYPE = { house: "Casa", apartment: "Apartamento", rural: "Chácara / sítio" } as const;
export const HOUSING_OWNERSHIP = { owned: "Própria", rented: "Alugada", other: "Outro" } as const;
export const WINDOW_SCREENS = { yes: "Sim", no: "Não", na: "Não se aplica" } as const;
export const HOURS_ALONE = { lt4: "Menos de 4 horas", "4to8": "De 4 a 8 horas", gt8: "Mais de 8 horas" } as const;

const keys = <T extends Record<string, string>>(o: T) => Object.keys(o) as [keyof T & string, ...(keyof T & string)[]];
const yesNo = z.enum(["true", "false"], { message: "Escolha uma opção" }).transform((v) => v === "true");
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().trim().max(max).optional());

export const personSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(z.string().min(10, "Telefone com DDD").max(13)),
  city: z.string().trim().min(2, "Informe a cidade").max(80),
  state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, "UF com 2 letras"),
});

export const profileSchema = z.object({
  housing_type: z.enum(keys(HOUSING_TYPE), { message: "Escolha uma opção" }),
  housing_ownership: z.enum(keys(HOUSING_OWNERSHIP), { message: "Escolha uma opção" }),
  has_yard: yesNo,
  has_window_screens: z.enum(keys(WINDOW_SCREENS), { message: "Escolha uma opção" }),
  other_animals: optionalText(500),
  has_children: yesNo,
  children_ages: optionalText(100),
  household_agrees: yesNo,
  hours_alone: z.enum(keys(HOURS_ALONE), { message: "Escolha uma opção" }),
  motivation: z.string().trim().min(10, "Conte um pouco mais").max(2000),
});

export type PersonInput = z.infer<typeof personSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export const PROFILE_LABELS: Record<keyof ProfileInput, string> = {
  housing_type: "Tipo de moradia",
  housing_ownership: "Moradia",
  has_yard: "Tem quintal",
  has_window_screens: "Telas de proteção",
  other_animals: "Outros animais",
  has_children: "Crianças em casa",
  children_ages: "Idade das crianças",
  household_agrees: "Todos em casa concordam",
  hours_alone: "Tempo sozinho por dia",
  motivation: "Por que quer adotar",
};

const VALUE_LABELS: Partial<Record<keyof ProfileInput, Record<string, string>>> = {
  housing_type: HOUSING_TYPE,
  housing_ownership: HOUSING_OWNERSHIP,
  has_window_screens: WINDOW_SCREENS,
  hours_alone: HOURS_ALONE,
};

export function formatProfileValue(key: keyof ProfileInput, value: unknown): string {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return VALUE_LABELS[key]?.[String(value)] ?? String(value);
}
