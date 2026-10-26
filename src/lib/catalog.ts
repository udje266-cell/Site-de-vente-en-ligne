import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const productCardInclude = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: { where: { isActive: true }, orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

/** Prix « à partir de » d'un produit (variante active la moins chère). */
export function priceInfo(p: ProductCardData) {
  const vs = p.variants;
  if (vs.length === 0) return { price: 0, compareAt: null as number | null, stock: 0 };
  const cheapest = vs.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    price: cheapest.price,
    compareAt: cheapest.compareAtPrice && cheapest.compareAtPrice > cheapest.price ? cheapest.compareAtPrice : null,
    stock: vs.reduce((s, v) => s + Math.max(0, v.stock), 0),
    multiple: new Set(vs.map((v) => v.price)).size > 1,
  };
}

const visible = { isActive: true, variants: { some: { isActive: true } } } satisfies Prisma.ProductWhereInput;

export function getNewArrivals(take = 8) {
  return prisma.product.findMany({ where: visible, include: productCardInclude, orderBy: { createdAt: "desc" }, take });
}

export function getPromotions(take = 8) {
  return prisma.product.findMany({
    where: { ...visible, variants: { some: { isActive: true, compareAtPrice: { not: null } } } },
    include: productCardInclude,
    take,
  });
}

/** Meilleures ventes (quantités vendues, hors commandes annulées), complétées par les produits mis en avant. */
export async function getBestSellers(take = 8) {
  const rows = await prisma.$queryRaw<{ productId: string }[]>`
    SELECT v."productId" FROM "OrderItem" i
    JOIN "ProductVariant" v ON v."id" = i."variantId"
    JOIN "Order" o ON o."id" = i."orderId"
    WHERE o."status" NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY v."productId" ORDER BY SUM(i."quantity") DESC LIMIT ${take}`;
  const ids = rows.map((r) => r.productId);
  const sold = await prisma.product.findMany({ where: { ...visible, id: { in: ids } }, include: productCardInclude });
  sold.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
  if (sold.length >= take) return sold;
  const featured = await prisma.product.findMany({
    where: { ...visible, isFeatured: true, id: { notIn: ids } },
    include: productCardInclude,
    take: take - sold.length,
  });
  return [...sold, ...featured];
}

export function getCategories() {
  return prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] });
}

export type SortKey = "nouveautes" | "prix-asc" | "prix-desc";

export type CatalogFilters = { min?: number; max?: number; attrs: Record<string, string>; sort: SortKey };

/** Filtre et trie une liste de produits (prix + attributs de variantes). Pur, testé. */
export function filterAndSort(products: ProductCardData[], f: CatalogFilters): ProductCardData[] {
  const matches = (p: ProductCardData) =>
    p.variants.some((v) => {
      if (f.min != null && v.price < f.min) return false;
      if (f.max != null && v.price > f.max) return false;
      const a = (v.attributes ?? {}) as Record<string, string>;
      return Object.entries(f.attrs).every(([k, val]) => a[k] === val);
    });
  const out = products.filter(matches);
  const price = (p: ProductCardData) => priceInfo(p).price;
  if (f.sort === "prix-asc") out.sort((a, b) => price(a) - price(b));
  else if (f.sort === "prix-desc") out.sort((a, b) => price(b) - price(a));
  else out.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return out;
}

/** Attributs disponibles (clé -> valeurs) pour construire les filtres. */
export function collectAttributes(products: ProductCardData[]): Record<string, string[]> {
  const map: Record<string, Set<string>> = {};
  for (const p of products)
    for (const v of p.variants)
      for (const [k, val] of Object.entries((v.attributes ?? {}) as Record<string, string>)) (map[k] ??= new Set()).add(val);
  return Object.fromEntries(Object.entries(map).map(([k, s]) => [k, [...s].sort()]));
}

/** Recherche plein texte PostgreSQL (français, insensible aux accents via unaccent). */
export async function searchProducts(q: string, take = 24) {
  const query = q.trim().slice(0, 80);
  if (!query) return [];
  const like = "%" + query.replace(/[%_]/g, "") + "%";
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT p."id" FROM "Product" p
    WHERE p."isActive" AND (
      to_tsvector('french', unaccent(p."name" || ' ' || p."description")) @@ websearch_to_tsquery('french', unaccent(${query}))
      OR unaccent(p."name") ILIKE unaccent(${like})
    )
    ORDER BY ts_rank(to_tsvector('french', unaccent(p."name" || ' ' || p."description")), websearch_to_tsquery('french', unaccent(${query}))) DESC
    LIMIT ${take}`;
  const ids = rows.map((r) => r.id);
  const list = await prisma.product.findMany({ where: { ...visible, id: { in: ids } }, include: productCardInclude });
  return list.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

/** Suggestions pendant la saisie : début de mot dans le nom, sans tenir compte des accents. */
export async function suggestProducts(q: string) {
  const query = q.trim().slice(0, 50).replace(/[%_\\]/g, "");
  if (query.length < 2) return [];
  return prisma.$queryRaw<{ name: string; slug: string }[]>`
    SELECT "name", "slug" FROM "Product"
    WHERE "isActive" AND (unaccent("name") ILIKE unaccent(${query + "%"}) OR unaccent("name") ILIKE unaccent(${"% " + query + "%"}))
    ORDER BY "name" LIMIT 6`;
}
