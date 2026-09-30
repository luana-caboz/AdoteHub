"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { compressPhoto } from "@/lib/image/compress";
import { MEDIA_BUCKET } from "@/lib/env";
import { createClient } from "@/lib/supabase/client";
import { deletePhotoAction, registerPhotoAction, setCoverAction } from "@/modules/animals/actions";
import type { AnimalPhoto } from "@/modules/animals/types";

interface Props {
  slug: string;
  orgId: string;
  animalId: string;
  photos: AnimalPhoto[];
  coverPhotoId: string | null;
  maxPhotos: number;
}

export function PhotoManager({ slug, orgId, animalId, photos, coverPhotoId, maxPhotos }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [, startTransition] = useTransition();
  const remaining = maxPhotos - photos.length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const list = Array.from(files).slice(0, remaining);
    const skipped = files.length - list.length;
    const errs: string[] = skipped > 0 ? [`${skipped} foto(s) ignorada(s): limite de ${maxPhotos} por animal.`] : [];
    const supabase = createClient();

    for (const [i, file] of list.entries()) {
      setProgress(`Enviando ${i + 1} de ${list.length}…`);
      try {
        const { main, thumb } = await compressPhoto(file);
        const id = crypto.randomUUID();
        const base = `${orgId}/animals/${animalId}/${id}`;
        const path = `${base}.jpg`;
        const thumbPath = `${base}-thumb.jpg`;
        const opts = { contentType: "image/jpeg", cacheControl: "31536000", upsert: false };
        const [a, b] = await Promise.all([
          supabase.storage.from(MEDIA_BUCKET).upload(path, main.blob, opts),
          supabase.storage.from(MEDIA_BUCKET).upload(thumbPath, thumb.blob, opts),
        ]);
        if (a.error || b.error) throw new Error(`${file.name}: falha no envio`);
        const result = await registerPhotoAction(slug, animalId, {
          id,
          path,
          thumbPath,
          width: main.width,
          height: main.height,
          sizeBytes: main.blob.size,
        });
        if (!result.ok) throw new Error(result.error);
      } catch (e) {
        errs.push(e instanceof Error ? e.message : `${file.name}: erro`);
      }
    }

    setProgress(null);
    setErrors(errs);
    if (inputRef.current) inputRef.current.value = "";
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="titulo text-verde">
          Fotos <span className="font-texto text-sm font-medium text-tinta-suave">({photos.length} de {maxPhotos})</span>
        </h2>
        <label className={`btn-secondary ${remaining <= 0 || progress ? "pointer-events-none opacity-50" : "cursor-pointer"}`}>
          {progress ?? "+ Adicionar fotos"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            disabled={remaining <= 0 || progress !== null}
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
      <p className="text-xs text-tinta-suave">
        As fotos são reduzidas e comprimidas no seu aparelho antes do envio. A primeira vira a capa.
      </p>
      {errors.length > 0 && (
        <ul className="rounded-md bg-erro-50 px-4 py-3 text-sm font-semibold text-erro">
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p) => {
          const isCover = p.id === coverPhotoId;
          return (
            <li key={p.id} className="overflow-hidden rounded-md bg-papel shadow-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.thumbUrl} alt="" className="aspect-square w-full object-cover" loading="lazy" />
              <div className="flex items-center justify-between gap-1 p-2 text-xs">
                {isCover ? (
                  <span className="tag-verde">Capa</span>
                ) : (
                  <form action={setCoverAction}>
                    <input type="hidden" name="slug" value={slug} />
                    <input type="hidden" name="animalId" value={animalId} />
                    <input type="hidden" name="photoId" value={p.id} />
                    <button className="font-bold text-verde underline underline-offset-4">Usar como capa</button>
                  </form>
                )}
                <form
                  action={deletePhotoAction}
                  onSubmit={(e) => {
                    if (!confirm("Remover esta foto?")) e.preventDefault();
                  }}
                >
                  <input type="hidden" name="slug" value={slug} />
                  <input type="hidden" name="photoId" value={p.id} />
                  <button className="font-bold text-erro underline underline-offset-4">Remover</button>
                </form>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
