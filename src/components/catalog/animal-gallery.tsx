"use client";

import { useRef, useState } from "react";
import { Paw } from "@/components/brand/paw";
import type { AnimalPhoto } from "@/modules/animals/types";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons";

// Foto 4:5 que cabe na primeira tela: largura = min(100%, altura máxima × 0.8).
const FRAME =
  "relative mx-auto aspect-[4/5] [--gal-max:62svh] lg:mx-0 lg:[--gal-max:calc(100svh_-_var(--header-h)_-_48px_-_40px)]";
const FRAME_STYLE = { width: "min(100%, calc(var(--gal-max) * 0.8))" };

function Arrow({ side, onClick }: { side: "prev" | "next"; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "prev" ? "Foto anterior" : "Próxima foto"}
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center ${side === "prev" ? "left-1" : "right-1"}`}
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/55 text-tinta backdrop-blur-[6px]">
        {side === "prev" ? <ArrowLeftIcon className="h-5 w-5" /> : <ArrowRightIcon className="h-5 w-5" />}
      </span>
    </button>
  );
}

export function AnimalGallery({
  name,
  photos,
  badge,
}: {
  name: string;
  photos: AnimalPhoto[];
  badge?: React.ReactNode;
}) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const count = photos.length;

  if (count === 0) {
    return (
      <div className={`${FRAME} flex items-center justify-center rounded-lg tint-brand shadow-card`} style={FRAME_STYLE}>
        <Paw className="h-20 w-20" />
        {badge}
      </div>
    );
  }

  function go(i: number) {
    const el = track.current;
    if (!el || i < 0 || i >= count) return;
    el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div
      className={`${FRAME} overflow-hidden rounded-lg bg-papel shadow-card`}
      style={FRAME_STYLE}
      role="region"
      aria-roledescription="carrossel"
      aria-label={`Fotos de ${name}`}
      tabIndex={count > 1 ? 0 : undefined}
      onKeyDown={(e) => {
        if (count < 2) return;
        if (e.key === "ArrowLeft") {
          e.preventDefault();
          go(index - 1);
        } else if (e.key === "ArrowRight") {
          e.preventDefault();
          go(index + 1);
        }
      }}
    >
      <div
        ref={track}
        className="no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          const i = Math.round(el.scrollLeft / el.clientWidth);
          if (i !== index) setIndex(i);
        }}
      >
        {photos.map((p, i) => (
          <div
            key={p.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} de ${count}`}
            className="h-full w-full flex-none snap-center"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.url}
              alt={i === 0 ? name : `${name}, foto ${i + 1}`}
              width={p.width ?? undefined}
              height={p.height ?? undefined}
              loading={i === 0 ? "eager" : "lazy"}
              className="h-full w-full object-cover [object-position:center_35%]"
            />
          </div>
        ))}
      </div>

      {badge}

      {count > 1 && (
        <>
          {index > 0 && <Arrow side="prev" onClick={() => go(index - 1)} />}
          {index < count - 1 && <Arrow side="next" onClick={() => go(index + 1)} />}
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5" aria-hidden>
            {photos.map((p, i) => (
              <span
                key={p.id}
                className={`h-2 w-2 rounded-full shadow-[0_1px_3px_rgba(0,0,0,.45)] ${i === index ? "bg-brand" : "bg-white/70"}`}
              />
            ))}
          </div>
          <p className="sr-only" aria-live="polite">
            Foto {index + 1} de {count}
          </p>
        </>
      )}
    </div>
  );
}
