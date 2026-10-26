import { describe, expect, it } from "vitest";
import { collectAttributes, filterAndSort, type ProductCardData } from "@/lib/catalog";

const p = (name: string, prices: [number, Record<string, string>][], created: string) =>
  ({
    id: name,
    name,
    createdAt: new Date(created),
    images: [],
    variants: prices.map(([price, attributes], i) => ({ id: `${name}-${i}`, price, attributes, compareAtPrice: null, stock: 1 })),
  }) as unknown as ProductCardData;

const list = [
  p("Miel", [[3000, { Poids: "250 g" }], [5500, { Poids: "500 g" }]], "2026-01-02"),
  p("Mil", [[1200, { Poids: "1 kg" }]], "2026-01-03"),
  p("Karité", [[8000, { Poids: "1 kg" }]], "2026-01-01"),
];

describe("filtres et tri du catalogue", () => {
  it("trie par prix et par nouveauté", () => {
    expect(filterAndSort(list, { sort: "prix-asc", attrs: {} }).map((x) => x.name)).toEqual(["Mil", "Miel", "Karité"]);
    expect(filterAndSort(list, { sort: "prix-desc", attrs: {} }).map((x) => x.name)).toEqual(["Karité", "Miel", "Mil"]);
    expect(filterAndSort(list, { sort: "nouveautes", attrs: {} }).map((x) => x.name)).toEqual(["Mil", "Miel", "Karité"]);
  });
  it("filtre par prix et attribut sur une même variante", () => {
    expect(filterAndSort(list, { sort: "prix-asc", attrs: { Poids: "1 kg" }, max: 5000 }).map((x) => x.name)).toEqual(["Mil"]);
    expect(filterAndSort(list, { sort: "prix-asc", attrs: { Poids: "250 g" }, min: 4000 })).toEqual([]);
  });
  it("collecte les attributs", () => {
    expect(collectAttributes(list)).toEqual({ Poids: ["1 kg", "250 g", "500 g"] });
  });
});
