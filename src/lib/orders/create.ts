import { Prisma, type Order } from "@prisma/client";
import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { OrderError } from "./errors";
import { computeTotals, evaluatePromo, isCodAvailable } from "./pricing";
import type { CheckoutData } from "./schema";

type Tx = Prisma.TransactionClient;

/** Numéro séquentiel lisible : CMD-2026-000123 (compteur atomique par année). */
export async function nextOrderNumber(tx: Tx, now = new Date()): Promise<string> {
  const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: shopConfig.timeZone }).format(now));
  const rows = await tx.$queryRaw<{ value: number }[]>`
    INSERT INTO "OrderSequence" ("year", "value") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "value" = "OrderSequence"."value" + 1
    RETURNING "value"`;
  return `CMD-${year}-${String(rows[0]!.value).padStart(6, "0")}`;
}

type LockedVariant = {
  id: string;
  label: string;
  price: number;
  stock: number;
  isActive: boolean;
  productName: string;
  productActive: boolean;
};

/**
 * Crée une commande. Tous les montants sont recalculés ici à partir de la base :
 * seuls les identifiants de variantes et les quantités du navigateur sont utilisés.
 * Le stock est décrémenté (COD) ou réservé (paiement en ligne) dans la même transaction,
 * avec verrou de ligne (SELECT … FOR UPDATE) pour empêcher toute survente.
 */
export async function createOrder(data: CheckoutData): Promise<Order> {
  const settings = await getSettings();

  // Regroupe les lignes en double
  const qty = new Map<string, number>();
  for (const it of data.items) qty.set(it.variantId, (qty.get(it.variantId) ?? 0) + it.quantity);
  const ids = [...qty.keys()].sort();

  return prisma.$transaction(
    async (tx) => {
      const variants = await tx.$queryRaw<LockedVariant[]>`
        SELECT v."id", v."label", v."price", v."stock", v."isActive",
               p."name" AS "productName", p."isActive" AS "productActive"
        FROM "ProductVariant" v JOIN "Product" p ON p."id" = v."productId"
        WHERE v."id" IN (${Prisma.join(ids)})
        ORDER BY v."id"
        FOR UPDATE OF v`;
      const byId = new Map(variants.map((v) => [v.id, v]));

      const lines = ids.map((id) => {
        const v = byId.get(id);
        const quantity = qty.get(id)!;
        if (!v || !v.isActive || !v.productActive) throw new OrderError("Un article de votre panier n'est plus disponible.");
        if (v.stock < quantity)
          throw new OrderError(
            v.stock > 0 ? `Stock insuffisant pour « ${v.productName} » (${v.stock} restant).` : `« ${v.productName} » est en rupture de stock.`,
          );
        return { v, quantity, unitPrice: v.price };
      });

      let zoneFee: number | null = null;
      let deliveryZoneId: string | null = null;
      if (data.pickup) {
        if (!settings.pickupEnabled) throw new OrderError("Le retrait sur place n'est pas disponible.");
      } else {
        const zone = await tx.deliveryZone.findFirst({ where: { id: data.deliveryZoneId, isActive: true } });
        if (!zone) throw new OrderError("Zone de livraison invalide.");
        zoneFee = zone.fee;
        deliveryZoneId = zone.id;
      }

      const subtotal = lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
      let discount = 0;
      let promoCodeId: string | null = null;
      if (data.promoCode) {
        const code = data.promoCode.toUpperCase();
        const promos = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "PromoCode" WHERE "code" = ${code} FOR UPDATE`;
        const promo = promos[0] ? await tx.promoCode.findUnique({ where: { id: promos[0].id } }) : null;
        const check = evaluatePromo(promo, subtotal);
        if (!check.ok) throw new OrderError(check.error);
        discount = check.discount;
        promoCodeId = promo!.id;
        await tx.promoCode.update({ where: { id: promo!.id }, data: { usedCount: { increment: 1 } } });
      }

      const totals = computeTotals({
        lines,
        discount,
        pickup: data.pickup,
        zoneFee,
        freeShippingThreshold: settings.freeShippingThreshold,
      });

      if (data.paymentMethod === "COD" && !isCodAvailable(totals.total, settings))
        throw new OrderError("Le paiement à la livraison n'est pas disponible pour cette commande.");

      for (const l of lines) {
        await tx.productVariant.update({ where: { id: l.v.id }, data: { stock: { decrement: l.quantity } } });
      }

      const status = data.paymentMethod === "COD" ? "COD_PENDING" : "PENDING_PAYMENT";
      return tx.order.create({
        data: {
          number: await nextOrderNumber(tx),
          customerName: data.customerName,
          customerPhone: data.customerPhone,
          customerEmail: data.customerEmail ?? null,
          pickup: data.pickup,
          deliveryZoneId,
          deliveryAddress: data.pickup ? "" : data.deliveryAddress,
          deliveryNote: data.deliveryNote || null,
          ...totals,
          paymentMethod: data.paymentMethod,
          paymentStatus: "PENDING",
          status,
          promoCodeId,
          items: {
            create: lines.map((l) => ({
              variantId: l.v.id,
              productName: l.v.productName,
              variantLabel: l.v.label,
              unitPrice: l.unitPrice,
              quantity: l.quantity,
            })),
          },
          events: { create: { type: "CREATED", toStatus: status, message: "Commande créée" } },
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15000 },
  );
}
