import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { createOrder, createOrderOnce } from "@/lib/orders/create";
import { OrderError } from "@/lib/orders/errors";
import { checkoutSchema } from "@/lib/orders/schema";
import { transitionOrder } from "@/lib/orders/transition";
import { customer, fixture, resetDb } from "./helpers";

beforeEach(resetDb);

describe("création de commande", () => {
  it("recalcule les prix côté serveur et ignore les montants envoyés", async () => {
    const { variant, zone } = await fixture(5, 2500);
    const parsed = checkoutSchema.parse({
      items: [{ variantId: variant.id, quantity: 2, price: 1, unitPrice: 1 }],
      ...customer,
      customerPhone: "07 00 00 00 00",
      deliveryZoneId: zone.id,
      paymentMethod: "COD",
      total: 10,
      subtotal: 10,
    });
    const order = await createOrder(parsed);
    expect(order.subtotal).toBe(5000);
    expect(order.shippingFee).toBe(1500);
    expect(order.total).toBe(6500);
    expect(order.status).toBe("COD_PENDING");
    expect(order.number).toMatch(/^CMD-\d{4}-000001$/);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(3);
  });

  it("numéros séquentiels uniques", async () => {
    const { variant, zone } = await fixture(10);
    const data = checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 1 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD" });
    const a = await createOrder(data);
    const b = await createOrder(data);
    expect(Number(b.number.slice(-6))).toBe(Number(a.number.slice(-6)) + 1);
  });

  it("deux commandes simultanées sur le dernier article : une seule réussit", async () => {
    const { variant, zone } = await fixture(1);
    const data = checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 1 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD" });
    const results = await Promise.allSettled([createOrder(data), createOrder(data), createOrder(data)]);
    expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
    const rejected = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    expect(rejected.every((r) => r.reason instanceof OrderError)).toBe(true);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(0);
  });

  it("code promo validé et compté côté serveur, insensible à la casse", async () => {
    const { variant, zone } = await fixture(10, 5000);
    await prisma.promoCode.create({ data: { code: "BIENVENUE10", type: "PERCENT", value: 10, maxUses: 1 } });
    const data = checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 1 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD", promoCode: "bienvenue10" });
    const order = await createOrder(data);
    expect(order.discount).toBe(500);
    await expect(createOrder(data)).rejects.toThrow(OrderError);
  });

  it("refuse le paiement à la livraison au-delà du plafond", async () => {
    const { variant, zone } = await fixture(10, 60000);
    await prisma.setting.create({ data: { key: "codMaxAmount", value: "100000" } });
    const data = checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 2 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD" });
    await expect(createOrder(data)).rejects.toThrow(/paiement à la livraison/);
  });

  it("annulation : stock réintégré une seule fois, événement créé", async () => {
    const { variant, zone } = await fixture(5);
    const data = checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 2 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD" });
    const order = await createOrder(data);
    await transitionOrder(order.id, "CANCELLED");
    await expect(transitionOrder(order.id, "CANCELLED")).rejects.toThrow(OrderError);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(5);
    const events = await prisma.orderEvent.findMany({ where: { orderId: order.id } });
    expect(events.map((e) => e.toStatus)).toEqual(["COD_PENDING", "CANCELLED"]);
  });

  it("valide le téléphone ivoirien", () => {
    const r = checkoutSchema.safeParse({ items: [{ variantId: "x", quantity: 1 }], ...customer, customerPhone: "12345", deliveryZoneId: "z", paymentMethod: "COD" });
    expect(r.success).toBe(false);
  });
});

describe("anti-doublon (clé d'idempotence)", () => {
  it("même clé : une seule commande, stock décrémenté une fois", async () => {
    const { variant, zone } = await fixture(5);
    const data = checkoutSchema.parse({
      items: [{ variantId: variant.id, quantity: 2 }],
      ...customer,
      deliveryZoneId: zone.id,
      paymentMethod: "COD",
      idempotencyKey: "cle-de-test-0123456789",
    });
    const a = await createOrderOnce(data);
    const b = await createOrderOnce(data);
    expect(a.duplicate).toBe(false);
    expect(b.duplicate).toBe(true);
    expect(b.order.id).toBe(a.order.id);
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(3);
  });

  it("même clé envoyée en parallèle : une seule commande", async () => {
    const { variant, zone } = await fixture(10);
    const data = checkoutSchema.parse({
      items: [{ variantId: variant.id, quantity: 1 }],
      ...customer,
      deliveryZoneId: zone.id,
      paymentMethod: "COD",
      idempotencyKey: "cle-parallele-0123456789",
    });
    const results = await Promise.all([1, 2, 3, 4, 5].map(() => createOrderOnce(data)));
    expect(new Set(results.map((r) => r.order.id)).size).toBe(1);
    expect(await prisma.order.count()).toBe(1);
    expect((await prisma.productVariant.findUnique({ where: { id: variant.id } }))!.stock).toBe(9);
  });

  it("adresse : quartier et point de repère enregistrés", async () => {
    const { variant, zone } = await fixture(5);
    const order = await createOrder(checkoutSchema.parse({ items: [{ variantId: variant.id, quantity: 1 }], ...customer, deliveryZoneId: zone.id, paymentMethod: "COD" }));
    expect(order.deliveryAddress).toBe("Quartier : Angré\nRepère : près de la pharmacie");
  });
});
