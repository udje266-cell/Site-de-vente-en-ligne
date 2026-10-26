import type { Metadata } from "next";
import { CatalogFilters, hasActiveFilters, parseFilters, resetHref } from "@/components/CatalogFilters";
import { EmptyResults } from "@/components/EmptyResults";
import { ProductGrid } from "@/components/ProductCard";
import { collectAttributes, filterAndSort, getAllProducts } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Tous nos produits : miel, karité, maïs et mil",
  description:
    "Le catalogue Noh's Shop : miel de Korhogo, beurre de karité, maïs et mil, avec prix et formats. Livraison à Abidjan, paiement à la livraison.",
  alternates: { canonical: "/produits" },
};

export default async function AllProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const filters = parseFilters(await searchParams);
  const [all, settings] = await Promise.all([getAllProducts(), getSettings()]);
  const products = filterAndSort(all, filters);
  return (
    <div>
      <h1 className="mb-3 text-3xl text-balance">Tous nos produits</h1>
      <CatalogFilters action="/produits" attributes={collectAttributes(all)} current={filters} />
      <p className="mb-3 text-sm text-stone-700" aria-live="polite">{products.length} produit{products.length > 1 ? "s" : ""}</p>
      {products.length === 0 ? (
        <EmptyResults resetHref={hasActiveFilters(filters) ? resetHref("/produits") : undefined} whatsapp={settings.whatsapp} />
      ) : (
        <ProductGrid products={products} priorityCount={2} headingLevel={2} />
      )}
    </div>
  );
}
