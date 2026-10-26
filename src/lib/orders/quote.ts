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
};

/** Devis calculé côté serveur à partir de la base : sert à afficher le panier et le récapitulatif. */
export async function quoteCart(input: z.infer<typeof quoteSchema>) {
  const settings = await getSettings();
  const ids = [...new Set(input.items.map((i) => i.variantId))];
  const variants = await prisma.productVariant.findMany({
    where: { id: { in: ids } },
    include: { product: { include: { images: { orderBy: { position: "asc" }, take: 1 } } } },
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
  };
}

export type Quote = Awaited<ReturnType<typeof quoteCart>>;
