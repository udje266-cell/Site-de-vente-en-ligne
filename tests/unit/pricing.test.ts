import { describe, expect, it } from "vitest";
import { computeTotals, evaluatePromo, isCodAvailable } from "@/lib/orders/pricing";

const promo = { type: "PERCENT" as const, value: 10, minSubtotal: 5000, maxUses: 2, usedCount: 0, startsAt: null, endsAt: null, isActive: true };

describe("codes promo", () => {
  it("pourcentage arrondi à l'entier inférieur", () => {
    expect(evaluatePromo(promo, 12345)).toEqual({ ok: true, discount: 1234 });
  });
  it("montant fixe plafonné au sous-total", () => {
    expect(evaluatePromo({ ...promo, type: "FIXED", value: 9000, minSubtotal: null }, 6000)).toEqual({ ok: true, discount: 6000 });
  });
  it("refuse : minimum, utilisations, dates, inactif, inexistant", () => {
    expect(evaluatePromo(promo, 4000).ok).toBe(false);
    expect(evaluatePromo({ ...promo, usedCount: 2 }, 10000).ok).toBe(false);
    const now = new Date("2026-06-01");
    expect(evaluatePromo({ ...promo, startsAt: new Date("2026-07-01") }, 10000, now).ok).toBe(false);
    expect(evaluatePromo({ ...promo, endsAt: new Date("2026-05-01") }, 10000, now).ok).toBe(false);
    expect(evaluatePromo({ ...promo, isActive: false }, 10000).ok).toBe(false);
    expect(evaluatePromo(null, 10000).ok).toBe(false);
  });
});

describe("totaux", () => {
  const lines = [{ unitPrice: 2500, quantity: 2 }, { unitPrice: 1000, quantity: 1 }];
  it("ajoute les frais de livraison", () => {
    expect(computeTotals({ lines, discount: 0, pickup: false, zoneFee: 1500, freeShippingThreshold: 50000 })).toEqual({
      subtotal: 6000, discount: 0, shippingFee: 1500, total: 7500,
    });
  });
  it("livraison gratuite au-dessus du seuil (après remise)", () => {
    expect(computeTotals({ lines, discount: 0, pickup: false, zoneFee: 1500, freeShippingThreshold: 6000 }).shippingFee).toBe(0);
    expect(computeTotals({ lines, discount: 500, pickup: false, zoneFee: 1500, freeShippingThreshold: 6000 }).shippingFee).toBe(1500);
  });
  it("retrait sur place gratuit", () => {
    expect(computeTotals({ lines, discount: 0, pickup: true, zoneFee: 1500, freeShippingThreshold: 0 }).total).toBe(6000);
  });
  it("plafond du paiement à la livraison", () => {
    expect(isCodAvailable(100000, { codEnabled: true, codMaxAmount: 100000 })).toBe(true);
    expect(isCodAvailable(100001, { codEnabled: true, codMaxAmount: 100000 })).toBe(false);
    expect(isCodAvailable(1000, { codEnabled: false, codMaxAmount: 100000 })).toBe(false);
  });
});
