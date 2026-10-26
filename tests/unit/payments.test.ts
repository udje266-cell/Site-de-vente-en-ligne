import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder } from "@/lib/orders/create";
import { checkoutSchema } from "@/lib/orders/schema";
import { setFakeOutcome } from "@/lib/payments/fake";
import { expireStalePayments, startOnlinePayment, verifyPayment } from "@/lib/payments/process";
import { customer, fixture, resetDb } from "./helpers";

beforeEach(resetDb);

async function onlineOrder(stock = 3) {
  const { variant, zone } = await fixture(stock, 2500);
  const order = await createOrder(
    checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 1 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "CINETPAY" }),
  );
  await startOnlinePayment(order);
  const payment = (await prisma.payment.findFirst({ where: { orderId: order.id } }))!;
  return { order, payment, variant };
}

describe("paiement en ligne (fake)", () => {
  it("stock réservé, commande en attente tant que rien n'est confirmé", async () => {
    const { order, payment, variant } = await onlineOrder();
    expect(order.status).toBe("PENDING_PAYMENT");
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(2);
    await verifyPayment(payment.transactionId, "notify");
    expect((await prisma.order.findUnique({ where: { id: order.id } }))!.status).toBe("PENDING_PAYMENT");
  });

  it("passe en PAID via vérification ; notifications répétées idempotentes", async () => {
    const { order, payment } = await onlineOrder();
    await setFakeOutcome(payment.transactionId, "ACCEPTED", payment.amount);
    await Promise.all([verifyPayment(payment.transactionId, "notify"), verifyPayment(payment.transactionId, "notify")]);
    await verifyPayment(payment.transactionId, "notify");
    const o = (await prisma.order.findUnique({ where: { id: order.id }, include: { events: true } }))!;
    expect(o.status).toBe("PAID");
    expect(o.paymentStatus).toBe("ACCEPTED");
    expect(o.events.filter((e) => e.toStatus === "PAID")).toHaveLength(1);
  });

  it("refuse un montant confirmé différent du total", async () => {
    const { order, payment } = await onlineOrder();
    await setFakeOutcome(payment.transactionId, "ACCEPTED", payment.amount - 100);
    await verifyPayment(payment.transactionId, "notify");
    expect((await prisma.order.findUnique({ where: { id: order.id } }))!.status).toBe("PENDING_PAYMENT");
  });

  it("paiement refusé : commande annulée, stock libéré", async () => {
    const { order, payment, variant } = await onlineOrder();
    await setFakeOutcome(payment.transactionId, "REFUSED", payment.amount);
    await verifyPayment(payment.transactionId, "notify");
    expect((await prisma.order.findUnique({ where: { id: order.id } }))!.status).toBe("CANCELLED");
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(3);
  });

  it("annule après 30 minutes sans paiement et libère le stock", async () => {
    const { order, variant } = await onlineOrder();
    expect(await expireStalePayments(new Date(Date.now() + 29 * 60_000))).toEqual([]);
    expect(await expireStalePayments(new Date(Date.now() + 31 * 60_000))).toEqual([order.number]);
    expect((await prisma.order.findUnique({ where: { id: order.id } }))!.status).toBe("CANCELLED");
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(3);
  });

  it("ne pas annuler une commande payée dont la notification a été perdue", async () => {
    const { order, payment } = await onlineOrder();
    await setFakeOutcome(payment.transactionId, "ACCEPTED", payment.amount);
    await expireStalePayments(new Date(Date.now() + 31 * 60_000));
    expect((await prisma.order.findUnique({ where: { id: order.id } }))!.status).toBe("PAID");
  });

  it("paiement accepté après annulation : signalé, pas de double stock", async () => {
    const { order, payment, variant } = await onlineOrder();
    await expireStalePayments(new Date(Date.now() + 31 * 60_000));
    await setFakeOutcome(payment.transactionId, "ACCEPTED", payment.amount);
    await verifyPayment(payment.transactionId, "notify");
    const o = (await prisma.order.findUnique({ where: { id: order.id }, include: { events: true } }))!;
    expect(o.status).toBe("CANCELLED");
    expect(o.paymentStatus).toBe("ACCEPTED");
    expect(o.events.some((e) => e.type === "PAYMENT_LATE")).toBe(true);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(3);
  });
});
