import type { Metadata } from "next";
import { CatalogFilters, hasActiveFilters, parseFilters, resetHref } from "@/components/CatalogFilters";
import { EmptyResults } from "@/components/EmptyResults";
import { ProductGrid } from "@/components/ProductCard";
import { collectAttributes, filterAndSort, searchProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = { title: "Recherche", robots: { index: false } };

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const q = ((Array.isArray(sp.q) ? sp.q[0] : sp.q) ?? "").slice(0, 80);
  const filters = parseFilters(sp);
  const [all, settings] = await Promise.all([searchProducts(q), getSettings()]);
  const products = filterAndSort(all, filters);
  return (
    <div>
      <h1 className="mb-3 text-3xl text-balance break-words">{q ? `Résultats pour « ${q} »` : "Recherche"}</h1>
      {all.length > 0 ? <CatalogFilters action="/recherche" attributes={collectAttributes(all)} current={filters} hidden={{ q }} /> : null}
      {all.length > 0 ? (
        <p className="mb-3 text-sm text-stone-700" aria-live="polite">{products.length} produit{products.length > 1 ? "s" : ""}</p>
      ) : null}
      {products.length === 0 ? (
        <EmptyResults
          resetHref={all.length > 0 && hasActiveFilters(filters) ? resetHref("/recherche", { q }) : undefined}
          whatsapp={settings.whatsapp}
          query={q || undefined}
        />
      ) : (
        <ProductGrid products={products} headingLevel={2} />
      )}
    </div>
  );
}
