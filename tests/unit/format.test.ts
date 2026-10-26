import { describe, expect, it } from "vitest";
import { formatPhone, formatPrice, normalizeCiPhone, slugify } from "@/lib/format";

describe("format", () => {
  it("formate les prix en FCFA avec espaces insécables", () => {
    expect(formatPrice(12500)).toBe("12 500 FCFA");
    expect(formatPrice(1000000)).toBe("1 000 000 FCFA");
    expect(formatPrice(500)).toBe("500 FCFA");
  });
  it("normalise les numéros ivoiriens", () => {
    expect(normalizeCiPhone("07 00 00 00 00")).toBe("+2250700000000");
    expect(normalizeCiPhone("+225 05.12.34.56.78")).toBe("+2250512345678");
    expect(normalizeCiPhone("002250112345678")).toBe("+2250112345678");
    expect(normalizeCiPhone("2250712345678")).toBe("+2250712345678");
    expect(normalizeCiPhone("0912345678")).toBeNull();
    expect(normalizeCiPhone("07123")).toBeNull();
  });
  it("affiche les numéros", () => {
    expect(formatPhone("+2250700000000")).toBe("+225 07 00 00 00 00");
  });
  it("slugify", () => {
    expect(slugify("Miel d'acacia Épicé")).toBe("miel-d-acacia-epice");
  });
});

import { buildOrderMessage, waLink } from "@/lib/whatsapp";

describe("WhatsApp", () => {
  it("message de commande : produit, format, quantité, prix et lien", () => {
    const msg = buildOrderMessage({ shopName: "Noh's Shop", productName: "Miel de forêt", format: "500 g", quantity: 2, unitPrice: 5500, url: "https://exemple.ci/produits/miel-de-foret" });
    expect(msg).toContain("- Produit : Miel de forêt");
    expect(msg).toContain("- Format : 500 g");
    expect(msg).toContain("- Quantité : 2");
    expect(msg).toContain("11 000 FCFA");
    expect(msg).toContain("Lien : https://exemple.ci/produits/miel-de-foret");
  });
  it("lien wa.me avec le numéro sans + ni espaces", () => {
    expect(waLink("+225 01 01 11 40 70", "a b")).toBe("https://wa.me/2250101114070?text=a%20b");
  });
});
