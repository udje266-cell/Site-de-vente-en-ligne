"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { useQuote } from "@/components/cart/useQuote";
import { ProductImage } from "@/components/ProductImage";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { paymentMethodLabels, t } from "@/config/messages";
import { formatPrice, normalizeCiPhone } from "@/lib/format";
import { waLink } from "@/lib/whatsapp";
import { placeOrder } from "./actions";

type Zone = { id: string; name: string; fee: number; etaLabel: string };
type Fields = {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deliveryZoneId: string;
  deliveryDistrict: string;
  deliveryLandmark: string;
  deliveryNote: string;
};
const emptyFields: Fields = { customerName: "", customerPhone: "", customerEmail: "", deliveryZoneId: "", deliveryDistrict: "", deliveryLandmark: "", deliveryNote: "" };
const fieldOrder = ["customerName", "customerPhone", "customerEmail", "deliveryZoneId", "deliveryDistrict", "deliveryLandmark", "paymentMethod"];

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}-key`);

/** Vérifications immédiates (les mêmes règles sont appliquées côté serveur, qui fait foi). */
function validate(f: Fields, pickup: boolean): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.customerName.trim().length < 2) e.customerName = "Indiquez votre nom.";
  if (!normalizeCiPhone(f.customerPhone)) e.customerPhone = "Numéro ivoirien à 10 chiffres, par exemple 07 00 00 00 00.";
  if (f.customerEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.customerEmail.trim())) e.customerEmail = "Adresse e-mail invalide (ou laissez vide).";
  if (!pickup) {
    if (!f.deliveryZoneId) e.deliveryZoneId = "Choisissez votre commune.";
    if (f.deliveryDistrict.trim().length < 2) e.deliveryDistrict = "Indiquez votre quartier.";
    if (f.deliveryLandmark.trim().length < 3) e.deliveryLandmark = "Indiquez un point de repère (pharmacie, école, carrefour…).";
  }
  return e;
}

export function CheckoutForm(props: {
  zones: Zone[];
  pickupEnabled: boolean;
  pickupAddress: string;
  codEnabled: boolean;
  onlineEnabled: boolean;
  whatsapp: string;
}) {
  const { lines, ready } = useCart();
  const [f, setF] = useState<Fields>(emptyFields);
  const [pickup, setPickup] = useState(false);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState("");
  const [method, setMethod] = useState<"COD" | "CINETPAY">(props.codEnabled ? "COD" : "CINETPAY");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  // Clé anti-doublon : identique pour un double clic ou un nouvel essai, renouvelée si le panier change
  const cartKey = useMemo(() => JSON.stringify(lines.map((l) => [l.variantId, l.quantity])), [lines]);
  const [idempotencyKey, setIdempotencyKey] = useState("");
  useEffect(() => setIdempotencyKey(newKey()), [cartKey]);

  const { quote, error: quoteError } = useQuote(lines, { pickup, deliveryZoneId: f.deliveryZoneId || undefined, promoCode: promo || undefined }, ready);

  if (!ready) return <p aria-busy="true">Chargement…</p>;
  if (lines.length === 0)
    return (
      <div className="mx-auto max-w-xl py-10 text-center">
        <h1 className="text-3xl">Finaliser la commande</h1>
        <p className="mt-2">{t.emptyCart}</p>
        <Link href="/produits" className="btn-primary mt-4">Découvrir les produits</Link>
      </div>
    );

  const codAllowed = props.codEnabled && (quote?.codAvailable ?? true);
  const methods = [codAllowed ? "COD" : null, props.onlineEnabled ? "CINETPAY" : null].filter(Boolean) as ("COD" | "CINETPAY")[];
  const effectiveMethod = methods.includes(method) ? method : methods[0];
  const blocked = quote?.lines.some((l) => !l.available) ?? false;
  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setF((prev) => ({ ...prev, [k]: value }));
    if (fieldErrors[k]) setFieldErrors((prev) => ({ ...prev, [k]: "" }));
  };
  const err = (k: string) => (fieldErrors[k] ? <p id={`${k}-err`} className="mt-1 text-sm font-bold text-red-700">{fieldErrors[k]}</p> : null);
  const aria = (k: string) => (fieldErrors[k] ? { "aria-invalid": true as const, "aria-describedby": `${k}-err` } : {});
  const focusFirstError = (errors: Record<string, string>) => {
    const first = fieldOrder.find((k) => errors[k]);
    if (first) requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus());
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting.current) return; // double clic
    setError(null);
    const errors = validate(f, pickup);
    if (!effectiveMethod) errors.paymentMethod = "Aucun moyen de paiement disponible pour ce montant : contactez-nous sur WhatsApp.";
    if (Object.keys(errors).length) {
      setFieldErrors(errors);
      setError("Merci de corriger les champs indiqués.");
      focusFirstError(errors);
      return;
    }
    submitting.current = true;
    setPending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await placeOrder(fd);
      if (res.ok) {
        // Le panier est vidé sur la page de confirmation, une fois la commande créée
        window.location.assign(res.redirectTo);
        return;
      }
      setError(res.error);
      setFieldErrors(res.fieldErrors ?? {});
      if (res.fieldErrors) focusFirstError(res.fieldErrors);
    } catch {
      setError("Connexion interrompue : la commande n'a peut-être pas été envoyée. Votre panier et vos informations sont conservés ; réessayez, aucune commande ne sera créée en double.");
    }
    submitting.current = false;
    setPending(false);
  }

  const zone = props.zones.find((z) => z.id === f.deliveryZoneId);

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_340px]">
      <input type="hidden" name="items" value={JSON.stringify(lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })))} />
      <input type="hidden" name="promoCode" value={quote?.promoError ? "" : promo} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {effectiveMethod ? <input type="hidden" name="paymentMethod" value={effectiveMethod} /> : null}

      <div className="min-w-0 space-y-5">
        <h1 className="text-3xl">Finaliser la commande</h1>
        <p className="text-sm text-stone-700">Pas besoin de créer de compte. Les champs marqués * sont obligatoires.</p>

        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-bold">Vos coordonnées</legend>
          <div>
            <label htmlFor="customerName" className="label">Nom et prénom *</label>
            <input id="customerName" name="customerName" value={f.customerName} onChange={set("customerName")} autoComplete="name" className="input" {...aria("customerName")} />
            {err("customerName")}
          </div>
          <div>
            <label htmlFor="customerPhone" className="label">Téléphone *</label>
            <input
              id="customerPhone"
              name="customerPhone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="07 00 00 00 00…"
              value={f.customerPhone}
              onChange={set("customerPhone")}
              className="input"
              aria-describedby={fieldErrors.customerPhone ? "customerPhone-err" : "customerPhone-hint"}
              aria-invalid={fieldErrors.customerPhone ? true : undefined}
            />
            {fieldErrors.customerPhone ? err("customerPhone") : <p id="customerPhone-hint" className="mt-1 text-sm text-stone-700">Il sert à vous joindre pour la livraison et à suivre la commande.</p>}
          </div>
          <div>
            <label htmlFor="customerEmail" className="label">E-mail (facultatif)</label>
            <input id="customerEmail" name="customerEmail" type="email" autoComplete="email" spellCheck={false} value={f.customerEmail} onChange={set("customerEmail")} className="input" {...aria("customerEmail")} />
            {err("customerEmail")}
          </div>
        </fieldset>

        <fieldset className="card space-y-3 p-4">
          <legend className="px-1 font-bold">Livraison</legend>
          {props.pickupEnabled ? (
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Mode de réception">
              {[
                [false, "Livraison", "Frais selon votre commune"],
                [true, "Retrait sur place", props.pickupAddress || "Sans frais, adresse communiquée sur WhatsApp"],
              ].map(([value, label, hint]) => (
                <label key={String(value)} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-md border-2 p-3 ${pickup === value ? "border-brand bg-brand/5" : "border-stone-300"}`}>
                  <input type="radio" name="pickupChoice" checked={pickup === value} onChange={() => setPickup(value as boolean)} className="h-5 w-5 accent-brand" />
                  <span>
                    <span className="block font-bold">{label as string}</span>
                    <span className="block text-sm text-stone-700">{hint as string}</span>
                  </span>
                </label>
              ))}
              {pickup ? <input type="hidden" name="pickup" value="on" /> : null}
            </div>
          ) : null}
          {!pickup ? (
            <>
              <div>
                <label htmlFor="deliveryZoneId" className="label">Commune *</label>
                <select id="deliveryZoneId" name="deliveryZoneId" value={f.deliveryZoneId} onChange={set("deliveryZoneId")} className="input" {...aria("deliveryZoneId")}>
                  <option value="">Choisir votre commune…</option>
                  {props.zones.map((z) => (
                    <option key={z.id} value={z.id}>
                      {z.name} – {formatPrice(z.fee)} ({z.etaLabel})
                    </option>
                  ))}
                </select>
                {err("deliveryZoneId")}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label htmlFor="deliveryDistrict" className="label">Quartier *</label>
                  <input id="deliveryDistrict" name="deliveryDistrict" autoComplete="address-level3" placeholder="Ex. Angré 8e tranche…" value={f.deliveryDistrict} onChange={set("deliveryDistrict")} className="input" {...aria("deliveryDistrict")} />
                  {err("deliveryDistrict")}
                </div>
                <div>
                  <label htmlFor="deliveryLandmark" className="label">Point de repère *</label>
                  <input id="deliveryLandmark" name="deliveryLandmark" autoComplete="off" placeholder="Ex. près de la pharmacie…" value={f.deliveryLandmark} onChange={set("deliveryLandmark")} className="input" {...aria("deliveryLandmark")} />
                  {err("deliveryLandmark")}
                </div>
              </div>
            </>
          ) : (
            <p className="rounded-md bg-karite p-3 text-sm">Aucun frais de livraison. Nous vous contactons au numéro indiqué pour convenir du retrait.</p>
          )}
          <div>
            <label htmlFor="deliveryNote" className="label">Note (facultatif)</label>
            <textarea id="deliveryNote" name="deliveryNote" rows={2} value={f.deliveryNote} onChange={set("deliveryNote")} className="input" />
          </div>
        </fieldset>

        <fieldset className="card space-y-2 p-4" aria-describedby={fieldErrors.paymentMethod ? "paymentMethod-err" : undefined}>
          <legend className="px-1 font-bold">Paiement</legend>
          {methods.length === 0 ? (
            <p className="text-sm">
              Le paiement à la livraison n&apos;est pas proposé pour ce montant.{" "}
              <a href={waLink(props.whatsapp, "Bonjour, je souhaite commander un montant élevé : comment puis-je payer ?")} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline">
                Contactez-nous sur WhatsApp
              </a>
            </p>
          ) : (
            methods.map((m) => (
              <label key={m} className="flex min-h-11 cursor-pointer items-center gap-3">
                <input type="radio" name="paymentChoice" checked={effectiveMethod === m} onChange={() => setMethod(m)} className="h-5 w-5 accent-brand" />
                <span>
                  {paymentMethodLabels[m]}
                  {m === "CINETPAY" ? <span className="block text-sm text-stone-700">Orange Money, MTN MoMo, Moov Money, Wave, Visa/Mastercard, sur la page sécurisée CinetPay.</span> : null}
                </span>
              </label>
            ))
          )}
          {props.codEnabled && !codAllowed ? <p className="text-sm text-stone-700">Le paiement à la livraison n&apos;est pas proposé au-delà d&apos;un certain montant.</p> : null}
          {err("paymentMethod")}
        </fieldset>
      </div>

      <aside className="card h-fit space-y-3 p-4 lg:sticky lg:top-32" aria-label="Récapitulatif de la commande">
        <h2 className="text-2xl">Récapitulatif</h2>
        <ul className="space-y-2 text-sm">
          {(quote?.lines ?? []).map((l) => (
            <li key={l.variantId} className="flex gap-2">
              <div className="w-12 shrink-0"><ProductImage src={l.image} alt="" sizes="48px" compact /></div>
              <span className="min-w-0 flex-1">
                {l.productName}, {l.variantLabel} × {l.quantity}
                {!l.available ? <em className="block font-bold text-red-700">Stock insuffisant : modifiez votre panier</em> : null}
              </span>
              <span className="tabular-nums">{formatPrice(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <label htmlFor="promo" className="sr-only">Code promo</label>
          <input id="promo" value={promoInput} onChange={(e) => setPromoInput(e.target.value)} placeholder="Code promo…" autoComplete="off" spellCheck={false} className="input" />
          <button type="button" className="btn-outline" onClick={() => setPromo(promoInput.trim())}>Appliquer</button>
        </div>
        <p aria-live="polite" className="text-sm">
          {promo && quote?.promoError ? <span className="text-red-700">{quote.promoError}</span> : null}
          {promo && quote && !quote.promoError && quote.discount > 0 ? <span className="text-nere">Code « {promo.toUpperCase()} » appliqué.</span> : null}
        </p>
        {quote ? (
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatPrice(quote.subtotal)}</dd></div>
            {quote.discount > 0 ? <div className="flex justify-between text-nere"><dt>Remise</dt><dd className="tabular-nums">−{formatPrice(quote.discount)}</dd></div> : null}
            <div className="flex justify-between">
              <dt>Livraison</dt>
              <dd className="tabular-nums">
                {pickup ? "Retrait, sans frais" : quote.shippingKnown ? (quote.shippingFee === 0 ? "Offerte" : formatPrice(quote.shippingFee)) : "selon la commune"}
              </dd>
            </div>
            <div className="flex justify-between border-t border-stone-200 pt-2 text-base font-bold">
              <dt>{quote.shippingKnown ? "Total" : "Total provisoire"}</dt>
              <dd data-testid="total" className="tabular-nums">{formatPrice(quote.total)}</dd>
            </div>
            {!quote.shippingKnown ? <p className="text-stone-700">Choisissez votre commune pour connaître les frais de livraison et le total définitif.</p> : null}
            {zone && !pickup ? <p className="text-stone-700">Délai indicatif pour {zone.name} : {zone.etaLabel}.</p> : null}
          </dl>
        ) : quoteError ? (
          <p className="text-sm text-red-700">Impossible de calculer le total (connexion ?). Il sera recalculé à l&apos;envoi.</p>
        ) : (
          <p className="text-sm" aria-busy="true">Calcul du total…</p>
        )}
        {error ? (
          <div role="alert" className="rounded bg-red-50 p-3 text-sm text-red-900">
            {error}
          </div>
        ) : null}
        <button type="submit" disabled={pending || blocked || !idempotencyKey} className="btn-primary w-full">
          {pending ? "Enregistrement…" : effectiveMethod === "CINETPAY" ? "Payer maintenant" : "Confirmer la commande"}
        </button>
        <p className="text-xs text-stone-700">Les prix, remises et frais sont vérifiés à l&apos;envoi de la commande.</p>
        <a href={waLink(props.whatsapp, "Bonjour, j'ai une question sur ma commande en cours.")} target="_blank" rel="noopener noreferrer" className="btn-outline w-full text-sm">
          <WhatsAppIcon className="h-5 w-5" /> Une question ? WhatsApp
        </a>
      </aside>
    </form>
  );
}
