"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { t } from "@/config/messages";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage, waLink } from "@/lib/whatsapp";
import { useCart } from "./cart/CartProvider";
import { Price } from "./Price";
import { WhatsAppIcon } from "./WhatsAppButton";

type Variant = { id: string; label: string; price: number; compareAtPrice: number | null; stock: number; netWeight: string | null };

function stockText(stock: number) {
  if (stock <= 0) return t.outOfStock;
  return t.inStock(stock);
}

export function ProductPurchase(props: {
  productName: string;
  slug: string;
  image?: string;
  variants: Variant[];
  whatsapp: string;
  shopName: string;
  productUrl: string;
  deliveryNote?: string;
}) {
  const { add } = useCart();
  const firstAvailable = props.variants.find((v) => v.stock > 0) ?? props.variants[0]!;
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [justAdded, setJustAdded] = useState(0);
  // Lien construit à partir du domaine réellement utilisé par le visiteur
  const [url, setUrl] = useState(props.productUrl);
  useEffect(() => setUrl(`${window.location.origin}/produits/${props.slug}`), [props.slug]);
  // Le bouton affiche « Ajouté ✓ » pendant 1,5 s après chaque ajout
  useEffect(() => {
    if (!justAdded) return;
    const timer = setTimeout(() => setJustAdded(0), 1500);
    return () => clearTimeout(timer);
  }, [justAdded]);

  // Barre d'achat fixe (mobile) : visible quand les boutons principaux sont hors de l'écran
  const actionsRef = useRef<HTMLDivElement>(null);
  const [showBar, setShowBar] = useState(false);
  useEffect(() => {
    const el = actionsRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(([entry]) => setShowBar(!entry!.isIntersecting && entry!.boundingClientRect.top < 0), { threshold: 0 });
    obs.observe(el);
    // Réserve la hauteur de la barre en bas de page (mobile) pour ne jamais masquer le pied de page
    document.body.classList.add("has-buybar");
    return () => {
      obs.disconnect();
      document.body.classList.remove("has-buybar");
    };
  }, []);

  const v = props.variants.find((x) => x.id === variantId) ?? firstAvailable;
  const out = v.stock <= 0;
  const max = Math.max(1, Math.min(99, v.stock));
  const quantity = Math.min(qty, max);
  const discounted = v.compareAtPrice != null && v.compareAtPrice > v.price;

  const addToCart = () => {
    add({ variantId: v.id, quantity, productName: props.productName, variantLabel: v.label, slug: props.slug, image: props.image, price: v.price });
    setAdded(true);
    setJustAdded(Date.now());
  };

  const waText = buildOrderMessage({ shopName: props.shopName, productName: props.productName, format: v.label, quantity, unitPrice: v.price, url });

  return (
    <div className="space-y-5">
      <fieldset>
        <legend className="label">Format</legend>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {props.variants.map((x) => {
            const selected = x.id === variantId;
            const xDiscount = x.compareAtPrice != null && x.compareAtPrice > x.price;
            return (
              <label
                key={x.id}
                className={`flex min-h-14 cursor-pointer items-center justify-between gap-3 rounded-md border-2 px-3 py-2 has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-accent ${
                  selected ? "border-brand bg-brand/5" : "border-stone-300 bg-white hover:border-brand/60"
                } ${x.stock <= 0 ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="variant"
                  value={x.id}
                  checked={selected}
                  onChange={() => {
                    setVariantId(x.id);
                    setAdded(false);
                  }}
                  className="h-5 w-5 shrink-0 accent-brand"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-bold">{x.label}</span>
                  {x.netWeight ? <span className="block text-sm text-stone-700">Poids net : {x.netWeight}</span> : null}
                  <span className={`block text-sm ${x.stock <= 0 ? "text-red-700" : "text-stone-700"}`}>{stockText(x.stock)}</span>
                </span>
                <span className="display text-right text-lg tabular-nums">
                  <span className="block">{formatPrice(x.price)}</span>
                  {xDiscount ? <s className="block font-sans text-sm font-normal text-stone-600">{formatPrice(x.compareAtPrice!)}</s> : null}
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span id="qty-label" className="label">Quantité</span>
          <div className="flex items-center gap-2" role="group" aria-labelledby="qty-label">
            <button type="button" className="btn-outline w-12 px-0" aria-label="Diminuer la quantité" disabled={out || quantity <= 1} onClick={() => setQty(Math.max(1, quantity - 1))}>
              −
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-label="Quantité"
              min={1}
              max={max}
              value={quantity}
              disabled={out}
              onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
              className="input w-16 text-center tabular-nums"
            />
            <button type="button" className="btn-outline w-12 px-0" aria-label="Augmenter la quantité" disabled={out || quantity >= max} onClick={() => setQty(Math.min(max, quantity + 1))}>
              +
            </button>
          </div>
        </div>
        <div className="text-right">
          <span className="block text-sm text-stone-700">
            {quantity} × {v.label}
          </span>
          <Price price={v.price * quantity} compareAt={discounted ? v.compareAtPrice! * quantity : null} className="text-2xl" />
        </div>
      </div>

      {props.deliveryNote ? (
        <p className="rounded-md bg-karite p-3 text-sm">
          {props.deliveryNote}{" "}
          <Link href="/infos/livraison" className="font-bold text-brand underline">Zones et tarifs</Link>
        </p>
      ) : null}

      <div ref={actionsRef} className="flex flex-col gap-2 sm:flex-row">
        <button type="button" disabled={out} className="btn-primary flex-1" onClick={addToCart}>
          {justAdded ? <span key={justAdded} className="anim-feedback">Ajouté ✓</span> : out ? t.outOfStock : t.addToCart}
        </button>
        <a href={waLink(props.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="btn-wa flex-1" data-testid="wa-order">
          <WhatsAppIcon /> {t.orderViaWhatsapp}
        </a>
      </div>
      {/* Barre d'achat fixe sur mobile : n'apparaît qu'après avoir dépassé les boutons ; la page réserve un espace en bas (classe has-buybar) */}
      <div
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-4 pt-2 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] transition-transform duration-200 motion-reduce:transition-none md:hidden ${
          showBar ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
        aria-hidden={!showBar}
        inert={!showBar}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm">{props.productName}, {v.label}</p>
            <p className="display text-lg tabular-nums">{formatPrice(v.price * quantity)}{quantity > 1 ? <span className="font-sans text-sm font-normal"> ({quantity})</span> : null}</p>
          </div>
          <button type="button" disabled={out} className="btn-primary shrink-0" onClick={addToCart}>
            {justAdded ? "Ajouté ✓" : out ? t.outOfStock : "Ajouter"}
          </button>
        </div>
      </div>

      <p role="status" aria-live="polite" className="min-h-6 text-sm text-green-800">
        {added ? (
          <span className="anim-feedback">
            Ajouté au panier.{" "}
            <Link href="/panier" className="font-semibold underline">
              Voir le panier
            </Link>
          </span>
        ) : null}
      </p>
    </div>
  );
}
