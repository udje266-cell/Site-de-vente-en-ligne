import Link from "next/link";
import { priceInfo, type ProductCardData } from "@/lib/catalog";
import { CardBuy } from "./CardBuy";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, priority = false, promo = false, headingLevel = 3 }: { product: ProductCardData; priority?: boolean; promo?: boolean; headingLevel?: 2 | 3 }) {
  const info = priceInfo(product, { preferPromo: promo });
  const img = product.images[0];
  const Heading = headingLevel === 2 ? "h2" : "h3";
  const initial = product.variants.find((v) => v.label === info.label && v.price === info.price) ?? product.variants[0];
  if (!initial) return null;
  return (
    <article className="flex h-full flex-col">
      <Link href={`/produits/${product.slug}`} className="group block rounded-md focus-visible:outline-offset-4">
        <div className="relative">
          <ProductImage src={img?.url} alt={img?.alt || product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} />
          {info.onSale ? (
            <span className="absolute left-0 top-3 rounded-r-md bg-accent px-2 py-1 text-sm font-bold text-ink">
              {info.compareAt ? `−${Math.round((1 - info.price / info.compareAt) * 100)} %` : "Promo"}
            </span>
          ) : null}
        </div>
        <Heading className="mt-2 line-clamp-2 min-h-[2.75rem] break-words font-sans text-base font-normal leading-snug text-ink group-hover:underline">
          {product.name}
        </Heading>
      </Link>
      <CardBuy
        slug={product.slug}
        name={product.name}
        image={img?.url}
        initialId={initial.id}
        variants={product.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock }))}
      />
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, promo = false, headingLevel = 3 }: { products: ProductCardData[]; priorityCount?: number; promo?: boolean; headingLevel?: 2 | 3 }) {
  if (products.length === 0) return null;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} priority={i < priorityCount} promo={promo} headingLevel={headingLevel} />
        </li>
      ))}
    </ul>
  );
}
