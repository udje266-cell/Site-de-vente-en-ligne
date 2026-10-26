"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ProductImage } from "./ProductImage";

type Img = { url: string; alt: string };

/**
 * Galerie : grande photo (agrandissable), flèches et miniatures quand il y a plusieurs photos,
 * navigation au clavier (← →) dans la vue agrandie.
 */
export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const img = images[current];
  if (!img) return <ProductImage alt={name} sizes="(max-width: 768px) 100vw, 50vw" priority />;
  const many = images.length > 1;
  const go = (delta: number) => setCurrent((c) => (c + delta + images.length) % images.length);

  const arrows = (variant: "page" | "zoom") =>
    many ? (
      <>
        <button type="button" onClick={() => go(-1)} aria-label="Photo précédente" className={`absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full ${variant === "zoom" ? "bg-white" : "bg-white/90"} text-xl text-ink shadow`}>
          ‹
        </button>
        <button type="button" onClick={() => go(1)} aria-label="Photo suivante" className={`absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full ${variant === "zoom" ? "bg-white" : "bg-white/90"} text-xl text-ink shadow`}>
          ›
        </button>
      </>
    ) : null;

  return (
    <div>
      <div className="relative">
        <button type="button" onClick={() => dialog.current?.showModal()} className="relative block aspect-square w-full overflow-hidden rounded-md bg-karite" aria-label={`Agrandir la photo ${current + 1} sur ${images.length}`}>
          <Image src={img.url} alt={img.alt || name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
        </button>
        {arrows("page")}
        {many ? (
          <span className="absolute bottom-2 right-2 rounded bg-white/90 px-2 py-0.5 text-sm tabular-nums text-ink" aria-hidden="true">
            {current + 1}/{images.length}
          </span>
        ) : null}
      </div>
      {many ? (
        <ul className="mt-2 flex gap-2 overflow-x-auto pb-1">
          {images.map((im, i) => (
            <li key={im.url} className="shrink-0">
              <button
                type="button"
                onClick={() => setCurrent(i)}
                aria-label={`Afficher la photo ${i + 1}`}
                aria-current={i === current}
                className={`relative block h-16 w-16 overflow-hidden rounded-md border-2 ${i === current ? "border-brand" : "border-transparent"}`}
              >
                <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <dialog
        ref={dialog}
        aria-label={`Photos de ${name}`}
        className="m-auto max-h-[95dvh] max-w-[95vw] overscroll-contain rounded-md p-0 backdrop:bg-black/80"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") go(1);
          if (e.key === "ArrowLeft") go(-1);
        }}
        onClick={(e) => {
          if (e.target === dialog.current) dialog.current?.close();
        }}
      >
        <div className="relative h-[90dvh] w-[95vw] max-w-4xl bg-white">
          <Image src={img.url} alt={img.alt || name} fill sizes="95vw" className="object-contain" />
          {arrows("zoom")}
        </div>
        <button type="button" className="btn-outline absolute right-2 top-2" onClick={() => dialog.current?.close()}>Fermer</button>
      </dialog>
    </div>
  );
}
