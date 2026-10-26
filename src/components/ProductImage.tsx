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
  ratio = "square",
  compact = false,
}: {
  src?: string | null;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  /** square : catalogue et fiches ; wide (4:3) : vignettes compactes */
  ratio?: "square" | "wide";
  /** Miniature (panier, récapitulatif) : emblème seul, sans texte */
  compact?: boolean;
}) {
  return (
    <div className={`relative ${ratio === "wide" ? "aspect-[4/3]" : "aspect-square"} overflow-hidden rounded-md bg-karite ${className}`}>
      {src ? (
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" priority={priority} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 p-1 text-center">
          <Image src="/embleme.png" alt="" width={56} height={56} className={`opacity-40 grayscale ${compact ? "w-1/2" : ""}`} />
          {compact ? null : <span className="text-xs text-stone-600">Photo à venir</span>}
          <span className="sr-only">{alt}</span>
        </div>
      )}
    </div>
  );
}
