export type Species = "dog" | "cat" | "other";
export type Sex = "male" | "female" | "unknown";
export type Size = "small" | "medium" | "large";
export type AgeGroup = "puppy" | "young" | "adult" | "senior";
export type AnimalStatus = "available" | "reserved" | "adopted" | "unavailable";

export interface AnimalPhoto {
  id: string;
  path: string;
  thumbPath: string;
  url: string;
  thumbUrl: string;
  width: number | null;
  height: number | null;
  position: number;
}

export interface Animal {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  species: Species;
  sex: Sex;
  size: Size | null;
  ageGroup: AgeGroup | null;
  breed: string | null;
  color: string | null;
  description: string | null;
  neutered: boolean | null;
  vaccinated: boolean | null;
  dewormed: boolean | null;
  specialNeeds: string | null;
  goodWithKids: boolean | null;
  goodWithDogs: boolean | null;
  goodWithCats: boolean | null;
  extra: Record<string, string>;
  status: AnimalStatus;
  source: "manual" | "import";
  externalId: string;
  coverPhotoId: string | null;
  cover: { url: string; thumbUrl: string } | null;
  photos: AnimalPhoto[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PublicFilters {
  q?: string;
  species?: Species;
  sex?: Sex;
  size?: Size;
  ageGroup?: AgeGroup;
  page?: number;
}

export interface AnimalEvent {
  id: number;
  type: string;
  payload: Record<string, unknown>;
  createdAt: string;
}
