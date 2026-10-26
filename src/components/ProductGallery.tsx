"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Img = { url: string; alt: string };

export function ProductGallery({ images, name }: { images: Img[]; name: string }) {
  const [current, setCurrent] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const img = images[current];
  if (!img) return <div className="aspect-square rounded-xl bg-stone-100" />;
  return (
    <div>
      <button type="button" onClick={() => dialog.current?.showModal()} className="relative block aspect-square w-full overflow-hidden rounded-xl bg-stone-100" aria-label="Agrandir la photo">
        <Image src={img.url} alt={img.alt || name} fill priority sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </button>
      {images.length > 1 ? (
        <ul className="mt-2 flex gap-2 overflow-x-auto">
          {images.map((im, i) => (
            <li key={im.url}>
              <button type="button" onClick={() => setCurrent(i)} aria-label={`Photo ${i + 1}`} aria-current={i === current} className={`relative block h-16 w-16 overflow-hidden rounded-lg border-2 ${i === current ? "border-brand" : "border-transparent"}`}>
                <Image src={im.url} alt="" fill sizes="64px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <dialog ref={dialog} className="m-auto max-h-[95dvh] max-w-[95vw] rounded-xl p-0 backdrop:bg-black/80" onClick={() => dialog.current?.close()}>
        <div className="relative h-[90dvh] w-[95vw] max-w-4xl">
          <Image src={img.url} alt={img.alt || name} fill sizes="95vw" className="object-contain" />
        </div>
        <button type="button" className="btn-outline absolute right-2 top-2" onClick={() => dialog.current?.close()}>Fermer</button>
      </dialog>
    </div>
  );
}
