import { expect, type Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ADMIN, E2E_DB } from "./global-setup";

export const db = new PrismaClient({ datasources: { db: { url: E2E_DB } } });

/** Trouve un produit via la recherche, l'ajoute au panier et ouvre la page de commande. */
export async function addToCartAndCheckout(page: Page, search = "miel de forêt") {
  await page.goto("/");
  await page.getByRole("combobox", { name: "Rechercher un produit" }).fill(search);
  await page.getByRole("combobox", { name: "Rechercher un produit" }).press("Enter");
  await page.getByRole("link", { name: /Miel de forêt/ }).first().click();
  await page.getByRole("button", { name: "Ajouter au panier" }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");
  await page.goto("/panier");
  await page.getByRole("link", { name: "Passer la commande" }).click();
}

export async function fillCustomer(page: Page) {
  await page.getByLabel("Nom et prénom *").fill("Awa Koné");
  await page.getByLabel("Téléphone *").fill("07 01 02 03 04");
  const zone = await db.deliveryZone.findUniqueOrThrow({ where: { name: "Cocody" } });
  await page.getByLabel("Zone de livraison *").selectOption(zone.id);
  await page.getByLabel(/Adresse : quartier/).fill("Angré 8e tranche, près de la pharmacie");
}

export async function loginAdmin(page: Page) {
  await page.goto("/admin/connexion");
  await page.getByLabel("E-mail").fill(ADMIN.email);
  await page.getByLabel("Mot de passe").fill(ADMIN.password);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await expect(page.getByRole("heading", { name: "Tableau de bord" })).toBeVisible();
}
