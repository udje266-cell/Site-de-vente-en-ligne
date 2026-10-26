import { randomBytes } from "crypto";
import { Prisma, type Order } from "@prisma/client";
import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";
import { notifySeller, notifyStatusChanged } from "@/lib/notify";
import { OrderError } from "@/lib/orders/errors";
import { applyTransition, lockOrder, transitionOrder } from "@/lib/orders/transition";
import { getPaymentProvider } from "./index";
import { appUrl } from "@/lib/app-url";


/** Ajoute une entrée au journal Payment.rawPayload (sans données sensibles). */
function logEntry(kind: string, data: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify({ at: new Date().toISOString(), kind, data, }, (k, v) => (/apikey|secret|token/i.test(k) ? "[masqué]" : v)));
}

async function appendLog(paymentId: string, entry: Prisma.InputJsonValue, tx: Prisma.TransactionClient = prisma) {
  const p = await tx.payment.findUnique({ where: { id: paymentId }, select: { rawPayload: true } });
  const log = Array.isArray(p?.rawPayload) ? (p!.rawPayload as Prisma.InputJsonValue[]) : [];
  await tx.payment.update({ where: { id: paymentId }, data: { rawPayload: [...log, entry] } });
}

/** Initialise le paiement en ligne et renvoie l'URL de paiement vers laquelle rediriger le client. */
export async function startOnlinePayment(order: Order): Promise<string> {
  const provider = getPaymentProvider();
  const transactionId = `${order.number}-${randomBytes(4).toString("hex")}`;
  const payment = await prisma.payment.create({
    data: { orderId: order.id, provider: provider.name, transactionId, amount: order.total },
  });
  try {
    const res = await provider.initPayment({
      transactionId,
      amount: order.total,
      description: `Commande ${order.number}`,
      notifyUrl: `${appUrl()}/api/payments/notify`,
      returnUrl: `${appUrl()}/commande/${order.number}/paiement?tx=${encodeURIComponent(transactionId)}`,
      customer: { name: order.customerName, phone: order.customerPhone, email: order.customerEmail },
    });
    await prisma.payment.update({ where: { id: payment.id }, data: { paymentUrl: res.paymentUrl } });
    await appendLog(payment.id, logEntry("init", res.raw));
    return res.paymentUrl;
  } catch (e) {
    await appendLog(payment.id, logEntry("init_error", String(e)));
    throw e;
  }
}

/**
 * Vérifie une transaction auprès du fournisseur et met à jour Payment + Order.
 * Idempotent : peut être appelé autant de fois que nécessaire (webhook répété, page de retour, cron).
 * Ne fait jamais confiance aux données reçues du navigateur ou de la notification.
 */
export async function verifyPayment(transactionId: string, source: string): Promise<{ status: string } | null> {
  const payment = await prisma.payment.findUnique({ where: { transactionId } });
  if (!payment) return null;
  const check = await getPaymentProvider().checkPayment(transactionId);

  const result = await prisma.$transaction(async (tx) => {
    const order = await lockOrder(tx, payment.orderId);
    const p = (await tx.payment.findUnique({ where: { id: payment.id } }))!;
    await appendLog(p.id, logEntry(`check:${source}`, check.raw), tx);

    if (p.status !== "PENDING") return { changed: null as Order | null, status: p.status, late: false };

    if (check.status === "ACCEPTED") {
      if (check.amount !== p.amount || check.amount !== order.total || (check.currency && check.currency !== shopConfig.currency)) {
        await appendLog(p.id, logEntry("amount_mismatch", { expected: order.total, got: check.amount, currency: check.currency }), tx);
        await tx.orderEvent.create({ data: { orderId: order.id, type: "PAYMENT_MISMATCH", message: "Montant confirmé différent du total : paiement à vérifier manuellement." } });
        return { changed: null, status: "MISMATCH", late: false };
      }
      await tx.payment.update({ where: { id: p.id }, data: { status: "ACCEPTED" } });
      if (order.status === "PENDING_PAYMENT") {
        const updated = await applyTransition(tx, order, "PAID", { type: "PAYMENT_ACCEPTED", message: "Paiement accepté", paymentStatus: "ACCEPTED" });
        return { changed: updated, status: "ACCEPTED", late: false };
      }
      // Paiement arrivé après annulation (expiration) : à traiter par la vendeuse.
      await tx.order.update({ where: { id: order.id }, data: { paymentStatus: "ACCEPTED" } });
      await tx.orderEvent.create({ data: { orderId: order.id, type: "PAYMENT_LATE", message: "Paiement reçu après annulation : à rembourser ou à reconfirmer." } });
      return { changed: null, status: "ACCEPTED", late: true };
    }

    if (check.status === "REFUSED" || check.status === "CANCELLED") {
      await tx.payment.update({ where: { id: p.id }, data: { status: check.status } });
      if (order.status === "PENDING_PAYMENT") {
        const updated = await applyTransition(tx, order, "CANCELLED", {
          type: "PAYMENT_FAILED",
          message: "Paiement non abouti, commande annulée",
          paymentStatus: check.status,
        });
        return { changed: updated, status: check.status, late: false };
      }
      return { changed: null, status: check.status, late: false };
    }
    return { changed: null, status: "PENDING", late: false };
  });

  if (result.changed) await notifyStatusChanged(result.changed, result.changed.status);
  if (result.late) await notifySeller("Paiement reçu après annulation", `Transaction ${transactionId} : paiement accepté sur une commande annulée.`);
  return { status: result.status };
}

/** Annule les commandes en attente de paiement depuis plus de 30 minutes et libère le stock. */
export async function expireStalePayments(now = new Date()): Promise<string[]> {
  const limit = new Date(now.getTime() - shopConfig.paymentTimeoutMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: { status: "PENDING_PAYMENT", createdAt: { lt: limit } },
    include: { payments: { where: { status: "PENDING" } } },
  });
  const cancelled: string[] = [];
  for (const order of stale) {
    // Dernière vérification au cas où une notification aurait été perdue
    for (const p of order.payments) {
      await verifyPayment(p.transactionId, "expiry").catch((e) => console.error("[expiry] check", e));
    }
    try {
      // Les lignes Payment restent PENDING : un paiement accepté plus tard sera détecté (branche « tardive »).
      await transitionOrder(order.id, "CANCELLED", {
        type: "PAYMENT_EXPIRED",
        message: "Paiement non finalisé sous 30 minutes",
        paymentStatus: "CANCELLED",
      });
      cancelled.push(order.number);
    } catch (e) {
      if (!(e instanceof OrderError)) throw e; // déjà payée/annulée entre-temps
    }
  }
  return cancelled;
}
