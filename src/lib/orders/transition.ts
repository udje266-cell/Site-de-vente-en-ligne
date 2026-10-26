import type { Order, OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { notifyStatusChanged } from "@/lib/notify";
import { OrderError } from "./errors";
import { canTransition, releasesStock } from "./state";

type Tx = Prisma.TransactionClient;

/** Verrouille la commande (SELECT … FOR UPDATE) et la renvoie. */
export async function lockOrder(tx: Tx, orderId: string): Promise<Order> {
  await tx.$queryRaw`SELECT "id" FROM "Order" WHERE "id" = ${orderId} FOR UPDATE`;
  const order = await tx.order.findUnique({ where: { id: orderId } });
  if (!order) throw new OrderError("Commande introuvable.");
  return order;
}

/** Réintègre le stock retenu par la commande (une seule fois grâce à stockHeld). */
async function releaseStock(tx: Tx, order: Order, releasePromo: boolean) {
  if (!order.stockHeld) return;
  const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
  for (const it of items) {
    if (it.variantId) await tx.productVariant.update({ where: { id: it.variantId }, data: { stock: { increment: it.quantity } } });
  }
  if (releasePromo && order.promoCodeId) {
    await tx.promoCode.updateMany({ where: { id: order.promoCodeId, usedCount: { gt: 0 } }, data: { usedCount: { decrement: 1 } } });
  }
  await tx.order.update({ where: { id: order.id }, data: { stockHeld: false } });
}

/**
 * Applique une transition à l'intérieur d'une transaction existante.
 * Toute transition crée un OrderEvent. Lève OrderError si elle est interdite.
 */
export async function applyTransition(
  tx: Tx,
  order: Order,
  to: OrderStatus,
  opts: { message?: string; type?: string; paymentStatus?: Order["paymentStatus"] } = {},
): Promise<Order> {
  const paid = order.paymentStatus === "ACCEPTED";
  if (!canTransition(order.status, to, { paid })) {
    throw new OrderError(`Transition interdite : ${order.status} → ${to}`);
  }
  if (releasesStock(to)) await releaseStock(tx, order, to === "CANCELLED");
  const updated = await tx.order.update({
    where: { id: order.id },
    data: {
      status: to,
      ...(opts.paymentStatus ? { paymentStatus: opts.paymentStatus } : to === "REFUNDED" && paid ? { paymentStatus: "REFUNDED" } : {}),
      events: { create: { type: opts.type ?? "STATUS_CHANGED", fromStatus: order.status, toStatus: to, message: opts.message ?? null } },
    },
  });
  return updated;
}

/** Changement de statut (admin, expiration…) + notification au client après commit. */
export async function transitionOrder(
  orderId: string,
  to: OrderStatus,
  opts: { message?: string; type?: string; paymentStatus?: Order["paymentStatus"] } = {},
): Promise<Order> {
  const updated = await prisma.$transaction(async (tx) => applyTransition(tx, await lockOrder(tx, orderId), to, opts));
  await notifyStatusChanged(updated, to);
  return updated;
}
