"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { useCart, type CartLine } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { ProductImage } from "@/components/ProductImage";
import { t } from "@/config/messages";
import { formatPrice } from "@/lib/format";

type Removed = { line: CartLine; index: number; at: number };

export function CartView() {
  const { lines, ready, setQuantity, remove, restore, changeVariant, replace } = useCart();
  const { quote, loading, error } = useQuote(lines, {}, ready);
  const [removed, setRemoved] = useState<Removed | null>(null);
  const [priceChanges, setPriceChanges] = useState<Record<string, { from: number; to: number }>>({});
  const formatId = useId();

  // Synchronisation avec le serveur : prix et noms à jour, lignes disparues retirées, changements de prix signalés
  useEffect(() => {
    if (!quote) return;
    const fresh = new Map(quote.lines.map((l) => [l.variantId, l]));
    const changes: Record<string, { from: number; to: number }> = {};
    const synced = lines
      .filter((l) => fresh.has(l.variantId))
      .map((l) => {
        const f = fresh.get(l.variantId)!;
        if (f.unitPrice !== l.price) changes[l.variantId] = { from: l.price, to: f.unitPrice };
        return { ...l, price: f.unitPrice, productName: f.productName, variantLabel: f.variantLabel, image: f.image, slug: f.slug };
      });
    if (Object.keys(changes).length) setPriceChanges((prev) => ({ ...prev, ...changes }));
    if (JSON.stringify(synced) !== JSON.stringify(lines)) replace(synced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quote]);

  // L'annulation du retrait reste proposée 8 secondes
  useEffect(() => {
    if (!removed) return;
    const timer = setTimeout(() => setRemoved(null), 8000);
    return () => clearTimeout(timer);
  }, [removed]);

  if (!ready) return <CartSkeleton />;

  const undo = removed ? (
    <div role="status" aria-live="polite" className="anim-feedback card mb-4 flex flex-wrap items-center justify-between gap-2 border-brand/40 bg-karite p-3">
      <span>
        « {removed.line.productName} ({removed.line.variantLabel}) » retiré du panier.
      </span>
      <button
        type="button"
        className="btn-outline"
        onClick={() => {
          restore(removed.line, removed.index);
          setRemoved(null);
        }}
      >
        Annuler
      </button>
    </div>
  ) : null;

  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-2xl py-6">
        <h1 className="mb-4 text-3xl">{t.cart}</h1>
        {undo}
        <div className="card space-y-3 p-6 text-center">
          <p>{t.emptyCart}</p>
          <Link href="/produits" className="btn-primary">Découvrir les produits</Link>
        </div>
      </div>
    );

  const info = new Map(quote?.lines.map((l) => [l.variantId, l]) ?? []);
  const blocked = quote?.lines.some((l) => !l.available) ?? false;
  const subtotal = quote?.subtotal ?? lines.reduce((s, l) => s + l.price * l.quantity, 0);

  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <h1 className="mb-4 text-3xl">{t.cart}</h1>
        {undo}
        {error ? (
          <p role="alert" className="card mb-4 border-red-300 bg-red-50 p-3 text-sm text-red-900">
            Impossible de vérifier les prix et le stock pour le moment (connexion ?). Les montants affichés seront recalculés à la commande.
          </p>
        ) : null}
        <ul className="space-y-3">
          {lines.map((l, index) => {
            const q = info.get(l.variantId);
            const change = priceChanges[l.variantId];
            const max = Math.max(1, Math.min(99, q?.stock ?? 99));
            return (
              <li key={l.variantId} className="card flex gap-3 p-3">
                <Link href={`/produits/${l.slug}`} className="w-20 shrink-0 sm:w-24" tabIndex={-1} aria-hidden="true">
                  <ProductImage src={l.image} alt="" sizes="96px" compact />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  <div className="flex flex-wrap items-start justify-between gap-x-3">
                    <Link href={`/produits/${l.slug}`} className="min-w-0 break-words font-bold hover:underline">{l.productName}</Link>
                    <span className="display text-lg tabular-nums" aria-label={`Total pour cet article : ${formatPrice(l.price * l.quantity)}`}>
                      {formatPrice(l.price * l.quantity)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {q && q.options.length > 1 ? (
                      <span className="flex items-center gap-2">
                        <label htmlFor={`${formatId}-${l.variantId}`}>Format</label>
                        <select
                          id={`${formatId}-${l.variantId}`}
                          value={l.variantId}
                          onChange={(e) => {
                            const o = q.options.find((x) => x.variantId === e.target.value);
                            if (o) changeVariant(l.variantId, { variantId: o.variantId, variantLabel: o.label, price: o.price, productName: l.productName, slug: l.slug, image: l.image });
                          }}
                          className="input min-h-11 w-auto py-1 text-sm"
                        >
                          {q.options.map((o) => (
                            <option key={o.variantId} value={o.variantId} disabled={o.stock <= 0 && o.variantId !== l.variantId}>
                              {o.label} – {formatPrice(o.price)}
                              {o.stock <= 0 ? " (rupture)" : ""}
                            </option>
                          ))}
                        </select>
                      </span>
                    ) : (
                      <span>Format : {l.variantLabel}</span>
                    )}
                    <span className="tabular-nums text-stone-700">{formatPrice(l.price)} l&apos;unité</span>
                  </div>
                  {change ? (
                    <p className="text-sm text-amber-900">Prix mis à jour : {formatPrice(change.from)} → {formatPrice(change.to)}.</p>
                  ) : null}
                  {q && !q.available ? (
                    <p className="text-sm font-bold text-red-700">
                      {q.stock > 0 ? `Plus que ${q.stock} en stock : réduisez la quantité.` : `${t.outOfStock} : retirez cet article pour commander.`}
                    </p>
                  ) : null}
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1" role="group" aria-label={`Quantité de ${l.productName}`}>
                      <button type="button" className="btn-outline w-11 px-0" aria-label="Diminuer la quantité" disabled={l.quantity <= 1} onClick={() => setQuantity(l.variantId, l.quantity - 1)}>
                        −
                      </button>
                      <span aria-live="polite" className="w-10 text-center tabular-nums">{l.quantity}</span>
                      <button type="button" className="btn-outline w-11 px-0" aria-label="Augmenter la quantité" disabled={l.quantity >= max} onClick={() => setQuantity(l.variantId, l.quantity + 1)}>
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      className="btn ml-auto text-sm text-red-800 underline"
                      onClick={() => {
                        setRemoved({ line: l, index, at: Date.now() });
                        remove(l.variantId);
                      }}
                    >
                      Retirer<span className="sr-only"> {l.productName}</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <aside className="card h-fit space-y-3 p-4 lg:sticky lg:top-32" aria-label="Récapitulatif du panier">
        <div className="flex justify-between">
          <span>Sous-total</span>
          <strong className="tabular-nums" aria-busy={loading}>{formatPrice(subtotal)}</strong>
        </div>
        <FreeShipping remaining={quote?.freeShippingRemaining ?? null} threshold={quote?.freeShippingThreshold ?? 0} />
        <p className="text-sm text-stone-700">Frais de livraison selon votre commune, et code promo, à l&apos;étape suivante.</p>
        <Link href="/commande" aria-disabled={blocked} className={`btn-primary w-full ${blocked ? "pointer-events-none opacity-50" : ""}`}>
          {t.checkout}
        </Link>
        {blocked ? <p className="text-sm text-red-700">Corrigez les articles signalés pour continuer.</p> : null}
        <Link href="/produits" className="btn-outline w-full">Continuer mes achats</Link>
      </aside>
    </div>
  );
}

/** Seuil de livraison offerte configuré (Réglages) : montant restant, sans compte à rebours ni urgence. */
function FreeShipping({ remaining, threshold }: { remaining: number | null; threshold: number }) {
  if (remaining == null || threshold <= 0) return null;
  const pct = Math.round(((threshold - remaining) / threshold) * 100);
  return (
    <div className="space-y-1 text-sm">
      {remaining > 0 ? (
        <p>
          Plus que <strong className="tabular-nums">{formatPrice(remaining)}</strong> d&apos;achats pour la livraison offerte.
        </p>
      ) : (
        <p className="font-bold text-nere">Livraison offerte pour cette commande.</p>
      )}
      <div className="h-2 overflow-hidden rounded bg-stone-200" aria-hidden="true">
        <div className="h-full bg-nere" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-stone-700">Seuil de {formatPrice(threshold)}, calculé après remise éventuelle, valable pour toutes les zones de livraison.</p>
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-2xl animate-pulse space-y-3 motion-reduce:animate-none" aria-busy="true" aria-label="Chargement du panier">
      <div className="h-9 w-40 rounded bg-stone-200" />
      <div className="h-28 rounded-md bg-stone-100" />
      <div className="h-28 rounded-md bg-stone-100" />
    </div>
  );
}
