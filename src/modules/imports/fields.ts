export type FieldKind = "text" | "enum" | "boolean";

export type ImportFieldKey =
  | "external_id"
  | "name"
  | "species"
  | "sex"
  | "size"
  | "age_group"
  | "breed"
  | "color"
  | "description"
  | "neutered"
  | "vaccinated"
  | "dewormed"
  | "special_needs"
  | "good_with_dogs"
  | "good_with_cats"
  | "good_with_kids"
  | "status";

export interface ImportField {
  key: ImportFieldKey;
  label: string;
  kind: FieldKind;
  required?: boolean;
  help?: string;
  synonyms: string[];
  options?: { value: string; label: string }[];
}

export const IMPORT_FIELDS: ImportField[] = [
  {
    key: "external_id",
    label: "ID do animal",
    kind: "text",
    required: true,
    help: "Obrigatório. Código único de cada animal (nº da ficha, registro...). É o que evita duplicar ao reimportar.",
    synonyms: ["id", "id do animal", "codigo", "codigo do animal", "cod", "registro", "ficha", "numero da ficha", "n da ficha", "no da ficha", "numero", "n", "no"],
  },
  {
    key: "name",
    label: "Nome",
    kind: "text",
    required: true,
    synonyms: ["nome", "nome do animal", "nome do pet", "animal", "pet"],
  },
  {
    key: "species",
    label: "Espécie",
    kind: "enum",
    synonyms: ["especie", "tipo", "cao ou gato", "cachorro ou gato", "especie do animal"],
    options: [
      { value: "dog", label: "Cachorro" },
      { value: "cat", label: "Gato" },
      { value: "other", label: "Outro" },
    ],
  },
  {
    key: "sex",
    label: "Sexo",
    kind: "enum",
    synonyms: ["sexo", "genero"],
    options: [
      { value: "male", label: "Macho" },
      { value: "female", label: "Fêmea" },
      { value: "unknown", label: "Não informado" },
    ],
  },
  {
    key: "size",
    label: "Porte",
    kind: "enum",
    synonyms: ["porte", "tamanho"],
    options: [
      { value: "small", label: "Pequeno" },
      { value: "medium", label: "Médio" },
      { value: "large", label: "Grande" },
    ],
  },
  {
    key: "age_group",
    label: "Idade / fase",
    kind: "enum",
    synonyms: ["idade", "faixa etaria", "fase", "idade aproximada", "idade estimada"],
    options: [
      { value: "puppy", label: "Filhote" },
      { value: "young", label: "Jovem" },
      { value: "adult", label: "Adulto" },
      { value: "senior", label: "Idoso" },
    ],
  },
  { key: "breed", label: "Raça", kind: "text", synonyms: ["raca"] },
  { key: "color", label: "Cor / pelagem", kind: "text", synonyms: ["cor", "cores", "pelagem", "cor da pelagem"] },
  {
    key: "description",
    label: "Descrição / história",
    kind: "text",
    synonyms: ["descricao", "descritivo", "historia", "sobre o animal", "sobre", "observacoes", "obs", "personalidade"],
  },
  { key: "neutered", label: "Castrado", kind: "boolean", synonyms: ["castrado", "castrada", "castracao", "e castrado"] },
  { key: "vaccinated", label: "Vacinado", kind: "boolean", synonyms: ["vacinado", "vacinada", "vacinas", "vacina", "vacinado v10", "v10"] },
  { key: "dewormed", label: "Vermifugado", kind: "boolean", synonyms: ["vermifugado", "vermifugada", "vermifugo"] },
  {
    key: "special_needs",
    label: "Necessidades especiais",
    kind: "text",
    synonyms: ["necessidades especiais", "cuidados especiais", "necessidade especial", "condicoes de saude", "saude"],
  },
  {
    key: "good_with_dogs",
    label: "Se dá bem com cães",
    kind: "boolean",
    synonyms: ["se da bem com caes", "se da bem com cachorros", "convive com caes", "bom com caes"],
  },
  {
    key: "good_with_cats",
    label: "Se dá bem com gatos",
    kind: "boolean",
    synonyms: ["se da bem com gatos", "convive com gatos", "bom com gatos"],
  },
  {
    key: "good_with_kids",
    label: "Se dá bem com crianças",
    kind: "boolean",
    synonyms: ["se da bem com criancas", "convive com criancas", "bom com criancas"],
  },
  {
    key: "status",
    label: "Situação",
    kind: "enum",
    synonyms: ["status", "situacao", "disponibilidade", "disponivel"],
    options: [
      { value: "available", label: "Disponível" },
      { value: "reserved", label: "Reservado / em processo" },
      { value: "adopted", label: "Adotado" },
      { value: "unavailable", label: "Indisponível" },
    ],
  },
];

export const FIELD_BY_KEY: Record<ImportFieldKey, ImportField> = Object.fromEntries(
  IMPORT_FIELDS.map((f) => [f.key, f]),
) as Record<ImportFieldKey, ImportField>;

export const IGNORE_VALUE = "__ignore__";