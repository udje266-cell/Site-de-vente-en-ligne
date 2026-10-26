"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { paymentMethodLabels, t } from "@/config/messages";
import { formatPrice } from "@/lib/format";
import { placeOrder, type CheckoutState } from "./actions";

type Zone = { id: string; name: string; fee: number; etaLabel: string };

export function CheckoutForm(props: { zones: Zone[]; pickupEnabled: boolean; pickupAddress: string; codEnabled: boolean; onlineEnabled: boolean }) {
  const { lines, ready } = useCart();
  const [state, action, pending] = useActionState<CheckoutState, FormData>(placeOrder, {});
  const [pickup, setPickup] = useState(false);
  const [zoneId, setZoneId] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [method, setMethod] = useState<"COD" | "CINETPAY">(props.codEnabled ? "COD" : "CINETPAY");
  const { quote } = useQuote(lines, { pickup, deliveryZoneId: zoneId || undefined, promoCode: promo || undefined }, ready);
  const fe = state.fieldErrors ?? {};

  if (!ready) return <p>Chargement…</p>;
  if (lines.length === 0)
    return (
      <div className="py-10 text-center">
        <h1 className="text-3xl">Finaliser la commande</h1>
        <p className="mt-2">{t.emptyCart}</p>
        <Link href="/" className="btn-primary mt-4">Voir les produits</Link>
      </div>
    );

  const codAllowed = props.codEnabled && (quote?.codAvailable ?? true);
  const effectiveMethod = codAllowed ? method : "CINETPAY";
  const err = (k: string) => (fe[k] ? <p id={`${k}-err`} className="mt-1 text-sm text-red-700">{fe[k]}</p> : null);
  const aria = (k: string) => (fe[k] ? { "aria-invalid": true, "aria-describedby": `${k}-err` } : {});

  return (
    <form action={action} className="mx-auto grid max-w-4xl gap-6 md:grid-cols-[1fr_320px]">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))} />
      {/* Un code refusé par le devis n'est pas envoyé : il ne doit pas bloquer la commande */}
      <input type="hidden" name="promoCode" value={quote?.promoError ? "" : promo} />
      <div className="space-y-5">
        <h1 className="text-2xl font-bold">Finaliser la commande</h1>
        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-semibold">Vos coordonnées</legend>
          <div>
            <label htmlFor="customerName" className="label">Nom et prénom *</label>
            <input id="customerName" name="customerName" required autoComplete="name" className="input" {...aria("customerName")} />
            {err("customerName")}
          </div>
          <div>
            <label htmlFor="customerPhone" className="label">Téléphone *</label>
            <input id="customerPhone" name="customerPhone" type="tel" required inputMode="tel" autoComplete="tel" placeholder="07 00 00 00 00" className="input" {...aria("customerPhone")} />
            {err("customerPhone")}
          </div>
          <div>
            <label htmlFor="customerEmail" className="label">E-mail (facultatif)</label>
            <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" className="input" {...aria("customerEmail")} />
            {err("customerEmail")}
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-semibold">Livraison</legend>
          {props.pickupEnabled ? (
            <label className="flex min-h-11 items-center gap-2">
              <input type="checkbox" name="pickup" checked={pickup} onChange={(e) => setPickup(e.target.checked)} className="h-5 w-5" />
              Retrait sur place, sans frais de livraison ({props.pickupAddress || "adresse communiquée sur WhatsApp"})
            </label>
          ) : null}
          {!pickup ? (
            <>
              <div>
                <label htmlFor="deliveryZoneId" className="label">Zone de livraison *</label>
                <select id="deliveryZoneId" name="deliveryZoneId" value={zoneId} onChange={(e) => setZoneId(e.target.value)} required className="input" {...aria("deliveryZoneId")}>
                  <option value="">Choisir…</option>
                  {props.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} – {formatPrice(z.fee)} ({z.etaLabel})
                    </option>
                  ))}
                </select>
                {err("deliveryZoneId")}
              </div>
              <div>
                <label htmlFor="deliveryAddress" className="label">Adresse : quartier et point de repère *</label>
                <textarea id="deliveryAddress" name="deliveryAddress" rows={2} required placeholder="Ex. Angré 8e tranche, près de la pharmacie…" className="input" {...aria("deliveryAddress")} />
                {err("deliveryAddress")}
              </div>
            </>
          ) : null}
          <div>
            <label htmlFor="deliveryNote" className="label">Note (facultatif)</label>
            <textarea id="deliveryNote" name="deliveryNote" rows={2} className="input" />
          </div>
        </fieldset>

        <fieldset className="card space-y-2 p-4">
          <legend className="px-1 font-semibold">Paiement</legend>
          {props.codEnabled ? (
            <label className={`flex min-h-11 items-center gap-2 ${codAllowed ? "" : "opacity-50"}`}>
              <input type="radio" name="paymentMethod" value="COD" checked={effectiveMethod === "COD"} disabled={!codAllowed} onChange={() => setMethod("COD")} className="h-5 w-5" />
              {paymentMethodLabels.COD}
            </label>
          ) : null}
          {props.codEnabled && !codAllowed ? <p className="text-sm text-stone-600">Au-delà de ce montant, seul le paiement en ligne est possible.</p> : null}
          {props.onlineEnabled ? (
            <>
              <label className="flex min-h-11 items-center gap-2">
                <input type="radio" name="paymentMethod" value="CINETPAY" checked={effectiveMethod === "CINETPAY"} onChange={() => setMethod("CINETPAY")} className="h-5 w-5" />
                {paymentMethodLabels.CINETPAY}
              </label>
              <p className="text-xs text-stone-600">Orange Money, MTN MoMo, Moov Money, Wave, Visa/Mastercard. Vous serez redirigé vers la page sécurisée CinetPay.</p>
            </>
          ) : (
            <p className="text-sm text-stone-600">Paiement Mobile Money bientôt disponible.</p>
          )}
        </fieldset>
      </div>

      <aside className="card h-fit space-y-3 p-4 md:sticky md:top-32">
        <h2 className="font-semibold">Récapitulatif</h2>
        <ul className="space-y-1 text-sm">
          {(quote?.lines ?? []).map((l) => (
            <li key={l.variantId} className="flex justify-between gap-2">
              <span>
                {l.productName} – {l.variantLabel} × {l.quantity}
                {!l.available ? <em className="block text-red-700">Indisponible</em> : null}
              </span>
              <span>{formatPrice(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="promo" className="sr-only">Code promo</label>
          <input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Code promo" className="input" />
          <button type="button" className="btn-outline" onClick={() => setPromo(promoInput.trim())}>OK</button>
        </div>
        {quote?.promoError ? <p className="text-sm text-red-700">{quote.promoError}</p> : null}
        {quote ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(quote.subtotal)}</dd></div>
            {quote.discount > 0 ? <div className="flex justify-between text-green-800"><dt>Remise</dt><dd>−{formatPrice(quote.discount)}</dd></div> : null}
            <div className="flex justify-between"><dt>Livraison</dt><dd>{quote.shippingKnown ? (quote.shippingFee === 0 ? "Offerte" : formatPrice(quote.shippingFee)) : "Choisissez une zone"}</dd></div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold"><dt>Total</dt><dd data-testid="total">{formatPrice(quote.total)}</dd></div>
          </dl>
        ) : null}
        {state.error ? <p role="alert" className="rounded bg-red-50 p-2 text-sm text-red-800">{state.error}</p> : null}
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Envoi…" : effectiveMethod === "COD" ? "Confirmer la commande" : "Payer maintenant"}
        </button>
      </aside>
    </form>
  );
}
