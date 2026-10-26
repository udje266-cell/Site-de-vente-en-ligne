import type { Metadata } from "next";
import { CatalogFilters, parseFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductCard";
import { collectAttributes, filterAndSort, searchProducts } from "@/lib/catalog";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "";
  const filters = parseFilters(sp);
  const all = await searchProducts(q);
  const products = filterAndSort(all, filters);
  return (
    <div>
      <h1 className="mb-3 text-3xl text-balance break-words">{q ? `Résultats pour « ${q} »` : "Recherche"}</h1>
      {all.length > 0 ? <CatalogFilters action="/recherche" attributes={collectAttributes(all)} current={filters} hidden={{ q }} /> : null}
      {q && products.length === 0 ? <p>Aucun produit trouvé. Essayez un autre mot, ou écrivez-nous sur WhatsApp.</p> : <ProductGrid products={products} />}
    </div>
  );
}
