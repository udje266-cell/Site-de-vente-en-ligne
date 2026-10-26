import type { PromoCode } from "@prisma/client";

export type PricedLine = { unitPrice: number; quantity: number };

export type PromoCheck = { ok: true; discount: number } | { ok: false; error: string };

export function computeSubtotal(lines: PricedLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

/** Valide un code promo côté serveur et calcule la remise (entier, FCFA). */
export function evaluatePromo(
  promo: Pick<PromoCode, "type" | "value" | "minSubtotal" | "maxUses" | "usedCount" | "startsAt" | "endsAt" | "isActive"> | null,
  subtotal: number,
  now: Date = new Date(),
): PromoCheck {
  if (!promo || !promo.isActive) return { ok: false, error: "Code promo invalide." };
  if (promo.startsAt && now < promo.startsAt) return { ok: false, error: "Ce code promo n'est pas encore actif." };
  if (promo.endsAt && now > promo.endsAt) return { ok: false, error: "Ce code promo a expiré." };
  if (promo.maxUses != null && promo.usedCount >= promo.maxUses)
    return { ok: false, error: "Ce code promo a atteint son nombre maximal d'utilisations." };
  if (promo.minSubtotal != null && subtotal < promo.minSubtotal)
    return { ok: false, error: `Montant minimum non atteint pour ce code.` };
  const raw = promo.type === "PERCENT" ? Math.floor((subtotal * promo.value) / 100) : promo.value;
  return { ok: true, discount: Math.max(0, Math.min(raw, subtotal)) };
}

export function computeShipping(opts: {
  pickup: boolean;
  zoneFee: number | null;
  subtotalAfterDiscount: number;
  freeShippingThreshold: number;
}): number {
  if (opts.pickup) return 0;
  if (opts.zoneFee == null) return 0;
  if (opts.freeShippingThreshold > 0 && opts.subtotalAfterDiscount >= opts.freeShippingThreshold) return 0;
  return opts.zoneFee;
}

export function computeTotals(opts: {
  lines: PricedLine[];
  discount: number;
  pickup: boolean;
  zoneFee: number | null;
  freeShippingThreshold: number;
}) {
  const subtotal = computeSubtotal(opts.lines);
  const discount = Math.min(opts.discount, subtotal);
  const shippingFee = computeShipping({
    pickup: opts.pickup,
    zoneFee: opts.zoneFee,
    subtotalAfterDiscount: subtotal - discount,
    freeShippingThreshold: opts.freeShippingThreshold,
  });
  return { subtotal, discount, shippingFee, total: subtotal - discount + shippingFee };
}

/** Le paiement à la livraison est-il proposé pour ce total ? */
export function isCodAvailable(total: number, settings: { codEnabled: boolean; codMaxAmount: number }): boolean {
  return settings.codEnabled && (settings.codMaxAmount <= 0 || total <= settings.codMaxAmount);
}
