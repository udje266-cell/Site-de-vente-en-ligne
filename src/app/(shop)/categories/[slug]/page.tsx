import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogFilters, parseFilters } from "@/components/CatalogFilters";
import { ProductGrid } from "@/components/ProductCard";
import { collectAttributes, filterAndSort, productCardInclude } from "@/lib/catalog";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function getCategory(slug: string) {
  return prisma.category.findUnique({ where: { slug }, include: { children: true } });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const c = await getCategory((await params).slug);
  if (!c) return {};
  return { title: c.name, description: `${c.name} : découvrez nos produits, livraison à Abidjan.`, alternates: { canonical: `/categories/${c.slug}` } };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const category = await getCategory((await params).slug);
  if (!category) notFound();
  const filters = parseFilters(await searchParams);
  const all = await prisma.product.findMany({
    where: { isActive: true, categoryId: { in: [category.id, ...category.children.map((c) => c.id)] }, variants: { some: { isActive: true } } },
    include: productCardInclude,
  });
  const products = filterAndSort(all, filters);
  return (
    <div>
      <h1 className="mb-3 text-2xl font-bold">{category.name}</h1>
      <CatalogFilters action={`/categories/${category.slug}`} attributes={collectAttributes(all)} current={filters} />
      <p className="mb-2 text-sm text-stone-600">{products.length} produit(s)</p>
      <ProductGrid products={products} priorityCount={2} />
    </div>
  );
}
