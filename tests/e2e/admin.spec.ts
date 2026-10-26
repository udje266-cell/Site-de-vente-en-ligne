import path from "path";
import { expect, test } from "@playwright/test";
import { addToCartAndCheckout, db, fillCustomer, loginAdmin } from "./helpers";

test("connexion admin refusée avec un mauvais mot de passe", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/connexion/);
  await page.getByLabel("E-mail").fill("intrus@example.com");
  await page.getByLabel("Mot de passe").fill("mauvais");
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByText("E-mail ou mot de passe incorrect.")).toBeVisible();
});

test("création d'un produit avec photo", async ({ page }) => {
  await loginAdmin(page);
  await page.getByRole("link", { name: "+ Ajouter un produit" }).click();
  await page.getByLabel("Photos (jusqu'à 6)").setInputFiles(path.join(__dirname, "../../public/embleme.png"));
  await page.getByLabel("Nom *").fill("Miel de karité test");
  await page.getByLabel("Prix (FCFA) *").fill("4500");
  await page.getByLabel("Stock *").fill("7");
  await page.getByLabel("Format").fill("400 g");
  await page.getByLabel("Catégorie").selectOption({ label: "Miel" });
  await page.getByRole("button", { name: "Créer le produit" }).click();
  // En mode dev, l'écriture de la photo dans public/uploads déclenche un rechargement (Fast Refresh)
  // qui peut interrompre la redirection : on attend la création en base, puis on ouvre la page du produit.
  await expect.poll(() => db.product.count({ where: { name: "Miel de karité test" } }), { timeout: 20_000 }).toBe(1);
  const product = await db.product.findFirstOrThrow({ where: { name: "Miel de karité test" }, include: { images: true, variants: true } });
  await page.goto(`/admin/produits/${product.id}?cree=1`);
  await expect(page.getByText("Produit créé")).toBeVisible();
  expect(product.images).toHaveLength(1);
  expect(product.images[0]!.url).toMatch(/\.webp$/);
  expect(product.variants[0]!.price).toBe(4500);
  await page.goto(`/produits/${product.slug}`);
  await expect(page.getByRole("heading", { name: "Miel de karité test" })).toBeVisible();
});

test("traitement d'une commande jusqu'à « Livrée »", async ({ page }) => {
  await addToCartAndCheckout(page);
  await fillCustomer(page);
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  const number = await page.getByTestId("order-number").innerText();
  const order = await db.order.findUniqueOrThrow({ where: { number } });

  await loginAdmin(page);
  await page.goto(`/admin/commandes/${order.id}`);
  for (const label of ["Confirmée", "Préparée", "En cours de livraison", "Livrée"]) {
    await page.getByRole("button", { name: `Passer à : ${label}` }).click();
    await expect(page.getByTestId("admin-status")).toHaveText(label);
  }
  const events = await db.orderEvent.findMany({ where: { orderId: order.id }, orderBy: { createdAt: "asc" } });
  expect(events.map((e) => e.toStatus)).toEqual(["COD_PENDING", "CONFIRMED", "PREPARED", "SHIPPED", "DELIVERED"]);
});
