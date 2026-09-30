import type { AgeGroup, AnimalStatus, Sex, Size, Species } from "./types";

export const SPECIES_LABEL: Record<Species, string> = { dog: "Cachorro", cat: "Gato", other: "Outro" };
export const SEX_LABEL: Record<Sex, string> = { male: "Macho", female: "Fêmea", unknown: "Não informado" };
export const SIZE_LABEL: Record<Size, string> = { small: "Pequeno", medium: "Médio", large: "Grande" };
export const AGE_LABEL: Record<AgeGroup, string> = { puppy: "Filhote", young: "Jovem", adult: "Adulto", senior: "Idoso" };
export const STATUS_LABEL: Record<AnimalStatus, string> = {
  available: "Disponível",
  reserved: "Em processo de adoção",
  adopted: "Adotado",
  unavailable: "Indisponível",
};

export const STATUS_TAG: Record<AnimalStatus, string> = {
  available: "tag-verde",
  reserved: "tag-mel",
  adopted: "tag-azul",
  unavailable: "tag-cinza",
};

export const EVENT_LABEL: Record<string, string> = {
  created: "Cadastrado",
  status_changed: "Situação alterada",
  archived: "Arquivado",
  unarchived: "Desarquivado",
  application_received: "Candidatura recebida",
  application_status_changed: "Candidatura atualizada",
  imported: "Atualizado pela importação",
};

export function options<T extends string>(labels: Record<T, string>) {
  return (Object.entries(labels) as [T, string][]).map(([value, label]) => ({ value, label }));
}

export function yesNo(value: boolean | null): string {
  if (value === null) return "Não informado";
  return value ? "Sim" : "Não";
}
