import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export const productCardInclude = {
  images: { orderBy: { position: "asc" }, take: 1 },
  variants: { where: { isActive: true }, orderBy: { position: "asc" } },
} satisfies Prisma.ProductInclude;

export type ProductCardData = Prisma.ProductGetPayload<{ include: typeof productCardInclude }>;

type CardVariant = ProductCardData["variants"][number];

const isDiscounted = (v: CardVariant) => v.compareAtPrice != null && v.compareAtPrice > v.price;

/**
 * Prix affiché sur une carte, toujours accompagné de son conditionnement (label de la variante).
 * Par défaut la variante la moins chère ; avec preferPromo, la variante réellement remisée.
 */
export function priceInfo(p: ProductCardData, opts: { preferPromo?: boolean } = {}) {
  const vs = p.variants;
  if (vs.length === 0) return { price: 0, compareAt: null as number | null, label: "", stock: 0, multiple: false, onSale: false };
  const promos = vs.filter(isDiscounted);
  const pick =
    opts.preferPromo && promos.length > 0
      ? promos.reduce((a, b) => (b.compareAtPrice! - b.price > a.compareAtPrice! - a.price ? b : a))
      : vs.reduce((a, b) => (b.price < a.price ? b : a));
  return {
    price: pick.price,
    compareAt: isDiscounted(pick) ? pick.compareAtPrice : null,
    label: pick.label,
    stock: vs.reduce((s, v) => s + Math.max(0, v.stock), 0),
    multiple: vs.length > 1,
    onSale: promos.length > 0,
  };
}

const visible = { isActive: true, variants: { some: { isActive: true } } } satisfies Prisma.ProductWhereInput;

/** Identifiants des produits ayant au moins une variante active réellement remisée (prix barré > prix). */
async function discountedProductIds(): Promise<string[]> {
  const rows = await prisma.$queryRaw<{ productId: string }[]>`
    SELECT DISTINCT v."productId" FROM "ProductVariant" v JOIN "Product" p ON p."id" = v."productId"
    WHERE v."isActive" AND p."isActive" AND v."compareAtPrice" > v."price"`;
  return rows.map((r) => r.productId);
}

/**
 * Sections de l'accueil sans doublon : un produit n'apparaît que dans une seule section
 * (promotions, puis meilleures ventes, puis nouveautés).
 */
export async function getHomeSections(perSection = 4, exclude: string[] = []) {
  const promoIds = await discountedProductIds();
  const promos = await prisma.product.findMany({
    where: { ...visible, id: { in: promoIds.filter((id) => !exclude.includes(id)) } },
    include: productCardInclude,
    orderBy: { updatedAt: "desc" },
    take: perSection,
  });
  // Produits déjà visibles (bannière, promotions) : exclus de « Notre sélection » et des nouveautés
  const shown = new Set([...exclude, ...promos.map((p) => p.id)]);

  const sold = await prisma.$queryRaw<{ productId: string }[]>`
    SELECT v."productId" FROM "OrderItem" i
    JOIN "ProductVariant" v ON v."id" = i."variantId"
    JOIN "Order" o ON o."id" = i."orderId"
    WHERE o."status" NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY v."productId" ORDER BY SUM(i."quantity") DESC LIMIT 20`;
  const soldIds = sold.map((r) => r.productId).filter((id) => !shown.has(id));
  let best = await prisma.product.findMany({ where: { ...visible, id: { in: soldIds } }, include: productCardInclude });
  best.sort((a, b) => soldIds.indexOf(a.id) - soldIds.indexOf(b.id));
  best = best.slice(0, perSection);
  // Pas encore assez de ventes : complète avec les produits mis en avant (section « Nos incontournables »)
  const bestFromSales = best.length > 0;
  if (best.length < perSection) {
    const featured = await prisma.product.findMany({
      where: { ...visible, isFeatured: true, id: { notIn: [...shown, ...best.map((b) => b.id)] } },
      include: productCardInclude,
      take: perSection - best.length,
    });
    best = [...best, ...featured];
  }
  best.forEach((p) => shown.add(p.id));

  const news = await prisma.product.findMany({
    where: { ...visible, id: { notIn: [...shown] } },
    include: productCardInclude,
    orderBy: { createdAt: "desc" },
    take: perSection,
  });
  return { promos, best, bestFromSales, news };
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

/** Familles mises en avant sur l'accueil, reconnues d'après le nom du produit. */
export const families = [
  { key: "miel", title: "Miel", line: "Miel de Korhogo", href: "/recherche?q=miel", test: (n: string) => n.includes("miel") },
  { key: "karite", title: "Karité", line: "Beurre de karité", href: "/recherche?q=karite", test: (n: string) => n.includes("karite") },
  { key: "mais", title: "Maïs", line: "Grains et poudre de maïs", href: "/recherche?q=mais", test: (n: string) => /\bmais\b/.test(n) },
  { key: "mil", title: "Mil", line: "Grains et farine de mil", href: "/recherche?q=mil", test: (n: string) => /\bmil\b/.test(n) },
] as const;

const normalize = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/**
 * Pour chaque famille : nombre de produits, prix de départ réels et un produit représentatif
 * (mis en avant de préférence) pour la composition de la bannière. Rien d'inventé.
 */
export async function getFamilies() {
  const products = await prisma.product.findMany({ where: visible, include: productCardInclude, orderBy: { createdAt: "asc" } });
  return families.map((f) => {
    const list = products.filter((p) => f.test(normalize(p.name)));
    const prices = list.flatMap((p) => p.variants.map((v) => v.price));
    const pick = list.find((p) => p.isFeatured && p.images.length) ?? list.find((p) => p.images.length) ?? list.find((p) => p.isFeatured) ?? list[0] ?? null;
    return { key: f.key, title: f.title, line: f.line, href: f.href, count: list.length, minPrice: prices.length ? Math.min(...prices) : null, pick };
  });
}

export function getAllProducts() {
  return prisma.product.findMany({ where: visible, include: productCardInclude });
}
