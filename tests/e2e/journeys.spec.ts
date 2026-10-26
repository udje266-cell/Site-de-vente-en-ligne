import { expect, test, type Page } from "@playwright/test";
import { db, fillCustomer } from "./helpers";

const ordersOf = (name: string) => db.order.count({ where: { customerName: name } });

const cartCount = async (page: Page) => Number((await page.getByTestId("cart-count").textContent({ timeout: 500 }).catch(() => "0")) || 0);

/** Ajoute un produit depuis sa fiche et attend que le compteur du panier augmente
 *  (en mode dev, un clic envoyé avant l'hydratation de la page serait ignoré). */
async function addFromProductPage(page: Page, slug: string, format?: RegExp) {
  await page.goto(`/produits/${slug}`);
  await page.waitForLoadState("networkidle");
  const before = await cartCount(page);
  await expect(async () => {
    if (format) await page.getByRole("radio", { name: format }).check();
    await page.getByRole("button", { name: "Ajouter au panier", exact: true }).click();
    expect(await cartCount(page)).toBeGreaterThan(before);
  }).toPass({ timeout: 20_000 });
}

test("catalogue : format choisi sur la carte, filtres dans l'URL, réinitialisation et état vide", async ({ page }) => {
  await page.goto("/produits");
  const card = page.locator("article", { has: page.getByRole("heading", { name: "Miel de forêt", exact: true }) });
  await card.getByLabel("Format de Miel de forêt").selectOption({ label: "500 g – 5 500 FCFA" });
  await expect(card.getByText("5 500 FCFA").first()).toBeVisible();
  await card.getByRole("button", { name: /Ajouter Miel de forêt, 500 g, au panier/ }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("1");

  // Filtres conservés dans l'URL + réinitialisation
  // Sur mobile, les filtres sont repliés derrière « Filtrer et trier »
  const toggle = page.getByRole("button", { name: /Filtrer et trier/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await page.getByLabel("Prix max").fill("3000");
  await page.getByLabel("Trier par").selectOption("prix-asc");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page).toHaveURL(/max=3000/);
  await expect(page).toHaveURL(/tri=prix-asc/);
  await page.getByRole("link", { name: "Réinitialiser les filtres" }).first().click();
  await expect(page).toHaveURL(/\/produits$/);

  // Aucun résultat : propositions pour continuer
  await page.goto("/produits?max=10");
  await expect(page.getByRole("heading", { name: "Aucun produit ne correspond" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Réinitialiser les filtres" }).last()).toBeVisible();
  await page.goto("/recherche?q=zzzz");
  await expect(page.getByRole("link", { name: /Demander sur WhatsApp/ })).toHaveAttribute("href", /zzzz/);
});

test("fiche produit : prix et stock selon le format, livraison estimée, barre mobile, produits complémentaires", async ({ page }) => {
  await page.goto("/produits/miel-de-foret");
  await page.getByRole("radio", { name: /1 kg/ }).check();
  await expect(page.getByText("1 × 1 kg")).toBeVisible();
  await expect(page.getByText(/Livraison de .* selon votre commune/)).toBeVisible();
  await page.getByRole("button", { name: "Augmenter la quantité" }).click();
  await expect(page.getByText("2 × 1 kg")).toBeVisible();
  const wa = decodeURIComponent((await page.getByTestId("wa-order").getAttribute("href"))!);
  expect(wa).toContain("Format : 1 kg");
  expect(wa).toContain("Quantité : 2");
  // Barre d'achat fixe : apparaît après avoir dépassé les boutons
  await page.mouse.wheel(0, 2500);
  await expect(page.getByRole("button", { name: "Ajouter", exact: true })).toBeInViewport();
  await page.getByRole("button", { name: "Ajouter", exact: true }).click();
  await expect(page.getByTestId("cart-count")).toHaveText("2");
  await expect(page.getByRole("heading", { name: /Dans la même catégorie|Autres produits/ })).toBeVisible();
});

test("panier : persistance, changement de format, annulation du retrait, livraison offerte", async ({ page }) => {
  await addFromProductPage(page, "miel-de-foret", /250 g/);
  await addFromProductPage(page, "grains-de-mil");
  await page.goto("/panier");
  await page.reload(); // conservé après actualisation
  await expect(page.getByRole("link", { name: "Miel de forêt" })).toBeVisible();
  await expect(page.getByText(/Plus que .* d'achats pour la livraison offerte/)).toBeVisible();

  // Changement de format : 250 g → 500 g, prix unitaire et total mis à jour
  await page.getByLabel("Format").first().selectOption({ label: "500 g – 5 500 FCFA" });
  await expect(page.getByText("5 500 FCFA l'unité")).toBeVisible();

  // Retrait puis annulation
  await page.getByRole("button", { name: "Retirer Grains de mil" }).click();
  await expect(page.getByRole("link", { name: "Grains de mil" })).toHaveCount(0);
  await page.getByRole("button", { name: "Annuler" }).click();
  await expect(page.getByRole("link", { name: "Grains de mil" })).toBeVisible();

  // Navigation : le panier suit
  await page.goto("/");
  await expect(page.getByTestId("cart-count")).toHaveText("2");
});

test("commande : erreurs près des champs, valeurs conservées, total provisoire puis frais de la commune", async ({ page }) => {
  await addFromProductPage(page, "miel-de-foret");
  await page.goto("/commande");
  await expect(page.getByText("Total provisoire")).toBeVisible();
  await page.getByLabel("Nom et prénom *").fill("Client Erreur");
  await page.getByLabel("Téléphone *").fill("12345");
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByText("Numéro ivoirien à 10 chiffres")).toBeVisible();
  await expect(page.getByText("Choisissez votre commune.")).toBeVisible();
  await expect(page.getByLabel("Téléphone *")).toBeFocused();
  await expect(page.getByLabel("Nom et prénom *")).toHaveValue("Client Erreur");
  expect(await ordersOf("Client Erreur")).toBe(0);

  const zone = await db.deliveryZone.findUniqueOrThrow({ where: { name: "Bingerville" } });
  await page.getByLabel("Commune *").selectOption(zone.id);
  await expect(page.getByTestId("total")).toHaveText("5 500 FCFA"); // 3 000 + 2 500
  await expect(page.getByText("Total provisoire")).toHaveCount(0);
});

test("commande : retrait sur place sans frais + code promo recalculé côté serveur", async ({ page }) => {
  await addFromProductPage(page, "miel-de-foret", /500 g/);
  await page.goto("/commande");
  await page.getByLabel("Nom et prénom *").fill("Client Retrait");
  await page.getByLabel("Téléphone *").fill("05 11 22 33 44");
  await page.getByRole("radio", { name: /Retrait sur place/ }).check();
  await expect(page.getByLabel("Commune *")).toHaveCount(0);
  await page.getByPlaceholder("Code promo…").fill("bienvenue10");
  await page.getByRole("button", { name: "Appliquer" }).click();
  await expect(page.getByText("Code « BIENVENUE10 » appliqué.")).toBeVisible();
  await expect(page.getByTestId("total")).toHaveText("4 950 FCFA"); // 5 500 − 10 %
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByTestId("order-number")).toBeVisible();
  const order = await db.order.findFirstOrThrow({ where: { customerName: "Client Retrait" } });
  expect(order).toMatchObject({ pickup: true, shippingFee: 0, subtotal: 5500, discount: 550, total: 4950, deliveryZoneId: null });
});

test("commande : double clic et réponse perdue ne créent qu'une seule commande, panier conservé en cas d'échec", async ({ page }) => {
  await addFromProductPage(page, "grains-de-mil");
  await page.goto("/commande");
  await fillCustomer(page);
  await page.getByLabel("Nom et prénom *").fill("Client Reseau");

  // 1er envoi : la requête atteint le serveur (commande créée) mais la réponse est perdue
  let dropped = false;
  await page.route("**/commande", async (route) => {
    if (route.request().method() === "POST" && !dropped) {
      dropped = true;
      await route.fetch();
      await route.abort("connectionreset");
      return;
    }
    await route.continue();
  });
  await page.getByRole("button", { name: "Confirmer la commande" }).click();
  await expect(page.getByText(/^Connexion interrompue/)).toBeVisible();
  await expect(page.getByTestId("cart-count")).toHaveText("1"); // panier conservé
  expect(await ordersOf("Client Reseau")).toBe(1);

  // Nouvel essai (double clic) : la même commande est renvoyée, aucun doublon
  await page.getByRole("button", { name: "Confirmer la commande" }).dblclick();
  await expect(page.getByTestId("order-number")).toBeVisible();
  expect(await ordersOf("Client Reseau")).toBe(1);
  await expect(page.getByTestId("cart-count")).toHaveCount(0); // vidé après confirmation
});
