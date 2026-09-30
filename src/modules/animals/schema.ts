import { z } from "zod";

const emptyToNull = (v: unknown) => (v === "" || v === undefined ? null : v);
const text = (max: number) => z.preprocess(emptyToNull, z.string().trim().max(max).nullable());
const triState = z.preprocess(
  (v) => (v === "true" ? true : v === "false" ? false : null),
  z.boolean().nullable(),
);

export const animalFormSchema = z.object({
  externalId: z
    .string()
    .trim()
    .min(1, "Informe o ID do animal")
    .max(40, "Máximo de 40 caracteres"),
  name: z.string().trim().min(1, "Informe o nome").max(80),
  species: z.enum(["dog", "cat", "other"]),
  sex: z.enum(["male", "female", "unknown"]),
  size: z.preprocess(emptyToNull, z.enum(["small", "medium", "large"]).nullable()),
  ageGroup: z.preprocess(emptyToNull, z.enum(["puppy", "young", "adult", "senior"]).nullable()),
  breed: text(60),
  color: text(60),
  description: text(4000),
  specialNeeds: text(1000),
  neutered: triState,
  vaccinated: triState,
  dewormed: triState,
  goodWithKids: triState,
  goodWithDogs: triState,
  goodWithCats: triState,
  status: z.enum(["available", "reserved", "adopted", "unavailable"]),
});

export type AnimalFormValues = z.infer<typeof animalFormSchema>;

export function toAnimalRow(v: AnimalFormValues) {
  return {
    external_id: v.externalId,
    name: v.name,
    species: v.species,
    sex: v.sex,
    size: v.size,
    age_group: v.ageGroup,
    breed: v.breed,
    color: v.color,
    description: v.description,
    special_needs: v.specialNeeds,
    neutered: v.neutered,
    vaccinated: v.vaccinated,
    dewormed: v.dewormed,
    good_with_kids: v.goodWithKids,
    good_with_dogs: v.goodWithDogs,
    good_with_cats: v.goodWithCats,
    status: v.status,
  };
}
