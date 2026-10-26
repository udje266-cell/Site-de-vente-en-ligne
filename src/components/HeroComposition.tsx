import Link from "next/link";
import type { ProductCardData } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { ProductImage } from "./ProductImage";

export type HeroFamily = { key: string; title: string; line: string; href: string; count: number; minPrice: number | null; pick: ProductCardData | null };

/**
 * Composition de la bannière : les quatre familles (miel, karité, maïs, mil) avec la photo
 * d'un produit réel, le nombre de produits et le prix de départ réels.
 * Sans photo fournie, l'emplacement « Photo à venir » est affiché.
 */
export function HeroComposition({ families }: { families: HeroFamily[] }) {
  return (
    <ul className="grid w-full max-w-md grid-cols-2 gap-3 justify-self-center md:justify-self-end" aria-label="Nos familles de produits">
      {families.map((f, i) => (
        <li key={f.key} className="hero-tile min-w-0" style={{ animationDelay: `${120 + i * 90}ms` }}>
          <Link href={f.href} className="group block h-full rounded-md bg-white p-2 text-ink shadow-sm hover:outline-2 hover:outline-accent">
            <ProductImage src={f.pick?.images[0]?.url} alt={f.pick?.images[0]?.alt || f.title} sizes="(max-width: 768px) 45vw, 200px" priority={i < 2} ratio="wide" />
            <span className="display mt-2 block text-xl group-hover:underline">{f.title}</span>
            <span className="block text-sm text-stone-700">{f.line}</span>
            <span className="block text-sm tabular-nums">
              {f.count > 0 && f.minPrice != null ? (
                <>
                  {f.count} produit{f.count > 1 ? "s" : ""}, dès <strong>{formatPrice(f.minPrice)}</strong>
                </>
              ) : (
                "Bientôt disponible"
              )}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
