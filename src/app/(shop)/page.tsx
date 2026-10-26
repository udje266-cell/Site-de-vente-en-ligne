import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { t } from "@/config/messages";
import { shopConfig } from "@/config/shop";
import { getBestSellers, getCategories, getNewArrivals, getPromotions } from "@/lib/catalog";

export const revalidate = 300;

export default async function HomePage() {
  const [news, best, promos, categories] = await Promise.all([getNewArrivals(8), getBestSellers(4), getPromotions(4), getCategories()]);
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-gradient-to-br from-brand to-brand-dark px-5 py-8 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">{shopConfig.name}</h1>
        <p className="mt-2 max-w-md text-white/90">{shopConfig.tagline}. Livraison partout à Abidjan, paiement Mobile Money ou à la livraison.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/categories/${c.slug}`} className="btn bg-white text-brand-dark hover:bg-stone-100">
              {c.name}
            </Link>
          ))}
        </div>
      </section>
      {promos.length > 0 ? (
        <section aria-labelledby="h-promo">
          <h2 id="h-promo" className="mb-3 text-xl font-bold">{t.promotions}</h2>
          <ProductGrid products={promos} />
        </section>
      ) : null}
      <section aria-labelledby="h-best">
        <h2 id="h-best" className="mb-3 text-xl font-bold">{t.bestSellers}</h2>
        <ProductGrid products={best} priorityCount={2} />
      </section>
      <section aria-labelledby="h-new">
        <h2 id="h-new" className="mb-3 text-xl font-bold">{t.newArrivals}</h2>
        <ProductGrid products={news} />
      </section>
    </div>
  );
}
