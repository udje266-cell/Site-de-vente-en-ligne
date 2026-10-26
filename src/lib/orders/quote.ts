import { z } from "zod";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { computeTotals, evaluatePromo, isCodAvailable } from "./pricing";
import { cartLineSchema } from "./schema";

export const quoteSchema = z.object({
  items: z.array(cartLineSchema).max(50),
  deliveryZoneId: z.string().max(50).optional(),
  pickup: z.boolean().default(false),
  promoCode: z.string().trim().max(40).optional(),
});

export type QuoteLine = {
  variantId: string;
  productName: string;
  variantLabel: string;
  slug: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  stock: number;
  available: boolean;
  /** Autres formats actifs du même produit (pour changer de format dans le panier) */
  options: { variantId: string; label: string; price: number; stock: number }[];
};

/** Devis calculé côté serveur à partir de la base : sert à afficher le panier et le récapitulatif. */
export async function quoteCart(input: z.infer<typeof quoteSchema>) {
  const settings = await getSettings();
  const ids = [...new Set(input.items.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    include: {
      product: {
        include: {
          images: { orderBy: { position: "asc" }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { position: "asc" } },
        },
      },
    },
  });
  const byId = new Map(variants.map((v) => [v.id, v]));
  const lines: QuoteLine[] = [];
  for (const it of input.items) {
    const v = byId.get(it.variantId);
    if (!v) continue;
    const available = v.isActive && v.product.isActive && v.stock >= it.quantity;
    lines.push({
      variantId: v.id,
      productName: v.product.name,
      variantLabel: v.label,
      slug: v.product.slug,
      image: v.product.images[0]?.url,
      unitPrice: v.price,
      quantity: it.quantity,
      stock: Math.max(0, v.stock),
      available,
      options: v.product.variants.map((o) => ({ variantId: o.id, label: o.label, price: o.price, stock: Math.max(0, o.stock) })),
    });
  }
  const priced = lines.filter((l) => l.available);
  const subtotal = priced.reduce((s, l) => s + l.unitPrice * l.quantity, 0);

  let discount = 0;
  let promoError: string | null = null;
  if (input.promoCode) {
    const promo = await prisma.promoCode.findUnique({ where: { code: input.promoCode.toUpperCase() } });
    const check = evaluatePromo(promo, subtotal);
    if (check.ok) discount = check.discount;
    else promoError = check.error;
  }
  let zoneFee: number | null = null;
  if (!input.pickup && input.deliveryZoneId) {
    const zone = await prisma.deliveryZone.findFirst({ where: { id: input.deliveryZoneId, isActive: true } });
    zoneFee = zone?.fee ?? null;
  }
  const totals = computeTotals({
    lines: priced.map((l) => ({ unitPrice: l.unitPrice, quantity: l.quantity })),
    discount,
    pickup: input.pickup,
    zoneFee,
    freeShippingThreshold: settings.freeShippingThreshold,
  });
  return {
    lines,
    ...totals,
    shippingKnown: input.pickup || zoneFee != null,
    promoError,
    codAvailable: isCodAvailable(totals.total, settings),
    freeShippingThreshold: settings.freeShippingThreshold,
    /** Montant restant pour la livraison offerte (calculé comme à la commande : sous-total après remise) */
    freeShippingRemaining: settings.freeShippingThreshold > 0 ? Math.max(0, settings.freeShippingThreshold - (totals.subtotal - totals.discount)) : null,
  };
}

export type Quote = Awaited<ReturnType<typeof quoteCart>>;
