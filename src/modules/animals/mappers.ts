import { publicMediaUrl } from "@/lib/env";
import type { Row } from "@/lib/supabase/types";
import type { Animal, AnimalEvent, AnimalPhoto } from "./types";

export const ANIMAL_COLUMNS =
  "id, organization_id, code, name, species, sex, size, age_group, breed, color, description, neutered, vaccinated, dewormed, special_needs, good_with_kids, good_with_dogs, good_with_cats, extra, status, source, external_id, cover_photo_id, archived_at, created_at, updated_at";

export const PHOTO_COLUMNS = "id, storage_path, thumb_path, width, height, position";

export const ANIMAL_SELECT = `${ANIMAL_COLUMNS}, cover:animal_photos!animals_cover_photo_fk(storage_path, thumb_path), photos:animal_photos!animal_photos_animal_id_fkey(${PHOTO_COLUMNS})`;
export const ANIMAL_LIST_SELECT = `${ANIMAL_COLUMNS}, cover:animal_photos!animals_cover_photo_fk(storage_path, thumb_path)`;

export function toPhoto(row: Row): AnimalPhoto {
  return {
    id: row.id,
    path: row.storage_path,
    thumbPath: row.thumb_path,
    url: publicMediaUrl(row.storage_path)!,
    thumbUrl: publicMediaUrl(row.thumb_path)!,
    width: row.width,
    height: row.height,
    position: row.position,
  };
}

export function toAnimal(row: Row): Animal {
  const photos: AnimalPhoto[] = Array.isArray(row.photos)
    ? row.photos.map((r: Row) => toPhoto(r)).sort((a: AnimalPhoto, b: AnimalPhoto) => a.position - b.position)
    : [];
  const coverRow = row.cover ?? (photos[0] ? { storage_path: photos[0].path, thumb_path: photos[0].thumbPath } : null);
  return {
    id: row.id,
    organizationId: row.organization_id,
    code: row.code,
    name: row.name,
    species: row.species,
    sex: row.sex,
    size: row.size,
    ageGroup: row.age_group,
    breed: row.breed,
    color: row.color,
    description: row.description,
    neutered: row.neutered,
    vaccinated: row.vaccinated,
    dewormed: row.dewormed,
    specialNeeds: row.special_needs,
    goodWithKids: row.good_with_kids,
    goodWithDogs: row.good_with_dogs,
    goodWithCats: row.good_with_cats,
    extra: row.extra && typeof row.extra === "object" ? (row.extra as Record<string, string>) : {},    status: row.status,
    source: row.source,
    externalId: row.external_id,
    coverPhotoId: row.cover_photo_id,
    cover: coverRow
      ? { url: publicMediaUrl(coverRow.storage_path)!, thumbUrl: publicMediaUrl(coverRow.thumb_path)! }
      : null,
    photos,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toAnimalEvent(row: Row): AnimalEvent {
  return { id: row.id, type: row.type, payload: row.payload ?? {}, createdAt: row.created_at };
}
