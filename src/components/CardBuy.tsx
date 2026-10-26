"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { t } from "@/config/messages";
import { formatPrice } from "@/lib/format";
import { useCart } from "./cart/CartProvider";

export type CardVariant = { id: string; label: string; price: number; compareAtPrice: number | null; stock: number };

/**
 * Bas de carte produit : choix du format (si plusieurs), prix et disponibilité du format choisi,
 * ajout au panier sans quitter la liste.
 */
export function CardBuy(props: { slug: string; name: string; image?: string; variants: CardVariant[]; initialId: string }) {
  const { add } = useCart();
  const [id, setId] = useState(props.initialId);
  const [added, setAdded] = useState(0);
  const selectId = useId();
  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(0), 1500);
    return () => clearTimeout(timer);
  }, [added]);

  const v = props.variants.find((x) => x.id === id) ?? props.variants[0]!;
  const discounted = v.compareAtPrice != null && v.compareAtPrice > v.price;
  const out = v.stock <= 0;

  return (
    <div className="mt-1 flex flex-1 flex-col gap-2">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="display text-[1.35rem] leading-tight tabular-nums">{formatPrice(v.price)}</span>
        {discounted ? <s className="text-sm text-stone-600">{formatPrice(v.compareAtPrice!)}</s> : null}
        {props.variants.length === 1 ? <span className="text-sm text-stone-700">{v.label}</span> : null}
      </p>
      {props.variants.length > 1 ? (
        <div>
          <label htmlFor={selectId} className="sr-only">Format de {props.name}</label>
          <select id={selectId} value={id} onChange={(e) => setId(e.target.value)} className="input min-h-11 py-1 text-sm">
            {props.variants.map((x) => (
              <option key={x.id} value={x.id}>
                {x.label} – {formatPrice(x.price)}
                {x.stock <= 0 ? " (rupture)" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <p className={`text-sm ${out ? "font-bold text-red-700" : "text-nere"}`}>{out ? t.outOfStock : t.inStock(v.stock)}</p>
      <div className="mt-auto">
        {out ? (
          <Link href={`/produits/${props.slug}`} className="btn-outline w-full text-sm">Voir le produit</Link>
        ) : (
          <button
            type="button"
            className="btn-primary w-full text-sm"
            onClick={() => {
              add({ variantId: v.id, quantity: 1, productName: props.name, variantLabel: v.label, slug: props.slug, image: props.image, price: v.price });
              setAdded(Date.now());
            }}
          >
            {added ? <span key={added} className="anim-feedback">Ajouté ✓</span> : <>Ajouter<span className="sr-only"> {props.name}, {v.label},</span> au panier</>}
          </button>
        )}
      </div>
      <p role="status" aria-live="polite" className="sr-only">{added ? `${props.name} (${v.label}) ajouté au panier` : ""}</p>
    </div>
  );
}
