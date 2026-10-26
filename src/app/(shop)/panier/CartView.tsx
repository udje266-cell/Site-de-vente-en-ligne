"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { t } from "@/config/messages";
import { formatPrice } from "@/lib/format";

export function CartView() {
  const { lines, ready, setQuantity, remove, replace } = useCart();
  const { quote } = useQuote(lines, {}, ready);

  // Synchronisation : prix et noms à jour depuis le serveur, lignes disparues retirées.
  useEffect(() => {
    if (!quote) return;
    const fresh = new Map(quote.lines.map((l) => [l.variantId, l]));
    const synced = lines
      .filter((l) => fresh.has(l.variantId))
      .map((l) => {
        const f = fresh.get(l.variantId)!;
        return { ...l, price: f.unitPrice, productName: f.productName, variantLabel: f.variantLabel, image: f.image };
      });
    if (JSON.stringify(synced) !== JSON.stringify(lines)) replace(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  if (!ready) return <p>Chargement…</p>;
  if (lines.length === 0)
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold">{t.cart}</h1>
        <p className="mt-2">{t.emptyCart}</p>
        <Link href="/" className="btn-primary mt-4">Continuer mes achats</Link>
      </div>
    );

  const info = new Map(quote?.lines.map((l) => [l.variantId, l]) ?? []);
  const blocked = quote?.lines.some((l) => !l.available) ?? false;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-2xl font-bold">{t.cart}</h1>
      <ul className="space-y-3">
        {lines.map((l) => {
          const q = info.get(l.variantId);
          return (
            <li key={l.variantId} className="card flex gap-3 p-3">
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                {l.image ? <Image src={l.image} alt="" fill sizes="80px" className="object-cover" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Link href={`/produits/${l.slug}`} className="font-medium hover:underline">{l.productName}</Link>
                <span className="text-sm text-stone-600">{l.variantLabel}</span>
                <span className="text-sm font-semibold">{formatPrice(l.price)}</span>
                {q && !q.available ? <span className="text-sm text-red-700">{q.stock > 0 ? `Plus que ${q.stock} en stock` : t.outOfStock}</span> : null}
                <div className="mt-1 flex items-center gap-2">
                  <button type="button" className="btn-outline w-11 px-0" aria-label="Diminuer la quantité" onClick={() => setQuantity(l.variantId, l.quantity - 1)}>−</button>
                  <span aria-live="polite" className="w-8 text-center" aria-label="Quantité">{l.quantity}</span>
                  <button type="button" className="btn-outline w-11 px-0" aria-label="Augmenter la quantité" onClick={() => setQuantity(l.variantId, l.quantity + 1)}>+</button>
                  <button type="button" className="btn ml-auto text-sm text-red-700 underline" onClick={() => remove(l.variantId)}>Retirer</button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="card mt-4 space-y-2 p-4">
        <div className="flex justify-between"><span>Sous-total</span><strong>{quote ? formatPrice(quote.subtotal) : "…"}</strong></div>
        <p className="text-sm text-stone-600">
          Frais de livraison et code promo à l&apos;étape suivante.
          {quote && quote.freeShippingThreshold > 0 ? ` Livraison offerte dès ${formatPrice(quote.freeShippingThreshold)}.` : ""}
        </p>
        <Link href="/commande" aria-disabled={blocked} className={`btn-primary w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>
          {t.checkout}
        </Link>
      </div>
    </div>
  );
}
