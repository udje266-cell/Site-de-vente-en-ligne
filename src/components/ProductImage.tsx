import Image from "next/image";

/**
 * Photo produit au format carré, ou emplacement neutre « Photo à venir »
 * quand la boutique n'a pas encore fourni de photo (aucune illustration inventée).
 */
export function ProductImage({
  src,
  alt,
  sizes,
  priority = false,
  className = "",
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-md bg-karite ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
          <Image src="/embleme.png" alt="" width={56} height={56} className="opacity-40 grayscale" />
          <span className="text-xs text-stone-600">Photo à venir</span>
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
