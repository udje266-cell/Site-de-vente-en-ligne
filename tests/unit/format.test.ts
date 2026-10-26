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
