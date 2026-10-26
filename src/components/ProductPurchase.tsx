"use client";

import Link from "next/link";
import { useState } from "react";
import { t } from "@/config/messages";
import { waLink } from "@/lib/whatsapp";
import { useCart } from "./cart/CartProvider";
import { Price } from "./Price";
import { WhatsAppIcon } from "./WhatsAppButton";

type Variant = { id: string; label: string; price: number; compareAtPrice: number | null; stock: number };

export function ProductPurchase(props: {
  productName: string;
  slug: string;
  image?: string;
  variants: Variant[];
  whatsapp: string;
  productUrl: string;
}) {
  const { add } = useCart();
  const firstAvailable = props.variants.find((v) => v.stock > 0) ?? props.variants[0]!;
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const v = props.variants.find((x) => x.id === variantId) ?? firstAvailable;
  const out = v.stock <= 0;

  const waText = `Bonjour, je souhaite commander : ${props.productName} – ${v.label} (x${qty}).\n${props.productUrl}`;

  return (
    <div className="space-y-4">
      <Price price={v.price} compareAt={v.compareAtPrice && v.compareAtPrice > v.price ? v.compareAtPrice : null} className="text-2xl" />
      {props.variants.length > 1 ? (
        <fieldset>
          <legend className="label">Choisir</legend>
          <div className="flex flex-wrap gap-2">
            {props.variants.map((x) => (
              <label key={x.id} className={`btn cursor-pointer border ${x.id === variantId ? "border-brand bg-brand text-white" : "border-2 border-stone-300 bg-white"} ${x.stock <= 0 ? "opacity-60" : ""}`}>
                <input type="radio" name="variant" value={x.id} checked={x.id === variantId} onChange={() => { setVariantId(x.id); setAdded(false); }} className="sr-only" />
                {x.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm text-stone-700">{v.label}</p>
      )}
      <p className={`text-sm font-medium ${out ? "text-red-700" : "text-green-800"}`}>{out ? t.outOfStock : t.inStock(v.stock)}</p>
      {!out ? (
        <div className="flex items-center gap-2">
          <label htmlFor="qty" className="label mb-0">Quantité</label>
          <input id="qty" type="number" min={1} max={Math.min(99, v.stock)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(v.stock, Number(e.target.value) || 1)))} className="input w-24" inputMode="numeric" />
        </div>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="button"
          disabled={out}
          className="btn-primary flex-1"
          onClick={() => {
            add({ variantId: v.id, quantity: qty, productName: props.productName, variantLabel: v.label, slug: props.slug, image: props.image, price: v.price });
            setAdded(true);
          }}
        >
          {t.addToCart}
        </button>
        <a href={waLink(props.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1">
          <WhatsAppIcon /> {t.orderViaWhatsapp}
        </a>
      </div>
      <p role="status" aria-live="polite" className="text-sm text-green-800">
        {added ? (
          <>
            Ajouté au panier. <Link href="/panier" className="font-semibold underline">Voir le panier</Link>
          </>
        ) : null}
      </p>
    </div>
  );
}
