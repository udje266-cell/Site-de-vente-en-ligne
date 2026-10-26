import { expect, test } from "@playwright/test";
import { addToCartAndCheckout, db, fillCustomer } from "./helpers";

test("parcours d'achat avec paiement à la livraison", async ({ page }) => {
  await addToCartAndCheckout(page);
  await fillCustomer(page);
  // 3 000 (250 g) + 1 500 livraison Cocody
  await expect(page.getByTestId("total")).toHaveText("4 500 FCFA");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByRole("heading", { name: "Merci pour votre commande !" })).toBeVisible();
  await expect(page.getByTestId("order-status")).toHaveText(/À confirmer/);
  const number = await page.getByTestId("order-number").innerText();
  expect(number).toMatch(/^CMD-\d{4}-\d{6}$/);
  await expect(page.getByTestId("cart-count")).toHaveCount(0);

  // Suivi public
  await page.goto(`/suivi?numero=${number}&tel=0701020304`);
  await expect(page.getByTestId("order-number")).toHaveText(number);
});

test("un prix modifié dans le navigateur est ignoré", async ({ page }) => {
  await addToCartAndCheckout(page);
  await fillCustomer(page);
  await page.evaluate(() => {
    const cart = JSON.parse(localStorage.getItem("cart:v1")!);
    cart[0].price = 1;
    localStorage.setItem("cart:v1", JSON.stringify(cart));
    const input = document.querySelector<HTMLInputElement>('input[name="items"]')!;
    const items = JSON.parse(input.value);
    input.value = JSON.stringify(items.map((i: object) => ({ ...i, price: 1, unitPrice: 1, total: 1 })));
  });
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  const number = await page.getByTestId("order-number").innerText();
  const order = await db.order.findUniqueOrThrow({ where: { number } });
  expect(order.total).toBe(4500);
});

test("paiement en ligne (fake) : PAID uniquement via webhook + vérification", async ({ page }) => {
  await addToCartAndCheckout(page);
  await fillCustomer(page);
  await page.getByLabel(/Mobile Money/).check();
  await page.getByRole("button", { name: "Payer maintenant" }).click();
  await expect(page.getByText("Mode simulation")).toBeVisible();
  const tx = decodeURIComponent(page.url().split("/paiement/fake/")[1]!);
  const pending = await db.payment.findUniqueOrThrow({ where: { transactionId: tx }, include: { order: true } });
  expect(pending.order.status).toBe("PENDING_PAYMENT");

  await page.getByRole("button", { name: "Simuler un paiement accepté" }).click();
  await expect(page.getByTestId("order-status")).toHaveText("Payée", { timeout: 20_000 });

  // Notification reçue deux fois : aucun doublon
  for (let i = 0; i < 2; i++) {
    const res = await page.request.post("/api/payments/notify", { form: { cpm_trans_id: tx } });
    expect(res.ok()).toBe(true);
  }
  const events = await db.orderEvent.findMany({ where: { orderId: pending.orderId, toStatus: "PAID" } });
  expect(events).toHaveLength(1);
});

test("paiement non finalisé : annulé après 30 minutes, stock libéré", async ({ page }) => {
  await addToCartAndCheckout(page);
  await fillCustomer(page);
  await page.getByLabel(/Mobile Money/).check();
  await page.getByRole("button", { name: "Payer maintenant" }).click();
  await expect(page.getByText("Mode simulation")).toBeVisible();
  const tx = decodeURIComponent(page.url().split("/paiement/fake/")[1]!);
  const payment = await db.payment.findUniqueOrThrow({ where: { transactionId: tx }, include: { order: { include: { items: true } } } });
  const variantId = payment.order.items[0]!.variantId!;
  const stockBefore = (await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock;

  expect((await page.request.get("/api/cron/expire-orders")).status()).toBe(401);
  await db.order.update({ where: { id: payment.orderId }, data: { createdAt: new Date(Date.now() - 31 * 60_000) } });
  const res = await page.request.get("/api/cron/expire-orders", { headers: { Authorization: "Bearer e2e-cron" } });
  expect((await res.json()).cancelled).toContain(payment.order.number);
  expect((await db.order.findUniqueOrThrow({ where: { id: payment.orderId } })).status).toBe("CANCELLED");
  expect((await db.productVariant.findUniqueOrThrow({ where: { id: variantId } })).stock).toBe(stockBefore + 1);
});

test("pages légales accessibles depuis le pied de page", async ({ page }) => {
  await page.goto("/");
  for (const name of ["CGV", "Retours", "Confidentialité", "Mentions légales"]) {
    await page.getByRole("contentinfo").getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(/\/infos\//);
    await page.goBack();
  }
});
