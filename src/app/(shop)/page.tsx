import Link from "next/link";
import { KorhogoBand } from "@/components/KorhogoBand";
import { ProductGrid } from "@/components/ProductCard";
import { t } from "@/config/messages";
import { prisma } from "@/lib/db";
import { getBestSellers, getNewArrivals, getPromotions } from "@/lib/catalog";
import { onlinePaymentAvailable } from "@/lib/payments";

export const revalidate = 300;

/** Couleur de chaque catégorie : la matière du produit (karité, miel, céréales…). */
const materialColors = ["bg-karite text-ink", "bg-accent text-ink", "bg-mil text-ink", "bg-nere text-white"];

export default async function HomePage() {
  const onlineEnabled = onlinePaymentAvailable();
  const [news, best, promos, categories] = await Promise.all([
    getNewArrivals(8),
    getBestSellers(4),
    getPromotions(4),
    prisma.category.findMany({
      where: { parentId: null },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { _count: { select: { products: { where: { isActive: true } } } } },
    }),
  ]);
  return (
    <div className="space-y-12">
      <section aria-labelledby="h-hero" className="-mx-4 -mt-6 bg-brand px-4 pb-0 pt-8 text-white sm:mx-0 sm:rounded-b-md">
        <h1 id="h-hero" className="max-w-[17ch] text-[2.6rem] sm:text-6xl">Miel de Korhogo, karité et céréales du Nord, livrés à Abidjan</h1>
        <p className="mt-4 max-w-[46ch] text-white/85">
          {onlineEnabled ? "Payez à la livraison ou par Mobile Money." : "Vous payez à la livraison."} Une question ? Écrivez-nous sur
          WhatsApp, on répond vite.
        </p>
        <KorhogoBand className="anim-reveal mt-8 block" color="#e59900" />
      </section>

      <nav aria-label="Nos produits">
        <ul className="grid gap-3 sm:grid-cols-3">
          {categories.map((c, i) => (
            <li key={c.id}>
              <Link
                href={`/categories/${c.slug}`}
                className={`flex min-h-20 flex-col justify-between rounded-md p-4 hover:outline-2 hover:outline-brand ${materialColors[i % materialColors.length]}`}
              >
                <span className="display text-3xl">{c.name}</span>
                <span className="text-sm">{c._count.products} produit{c._count.products > 1 ? "s" : ""}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {promos.length > 0 ? (
        <section aria-labelledby="h-promo">
          <h2 id="h-promo" className="mb-4 text-3xl">{t.promotions}</h2>
          <ProductGrid products={promos} />
        </section>
      ) : null}
      <section aria-labelledby="h-best">
        <h2 id="h-best" className="mb-4 text-3xl">{t.bestSellers}</h2>
        <ProductGrid products={best} priorityCount={2} />
      </section>
      <section aria-labelledby="h-new">
        <h2 id="h-new" className="mb-4 text-3xl">{t.newArrivals}</h2>
        <ProductGrid products={news} />
      </section>
    </div>
  );
}
