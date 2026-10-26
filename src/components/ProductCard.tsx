import Link from "next/link";
import { t } from "@/config/messages";
import { priceInfo, type ProductCardData } from "@/lib/catalog";
import { Price } from "./Price";
import { ProductImage } from "./ProductImage";

export function ProductCard({ product, priority = false, promo = false }: { product: ProductCardData; priority?: boolean; promo?: boolean }) {
  const info = priceInfo(product, { preferPromo: promo });
  const img = product.images[0];
  return (
    <Link href={`/produits/${product.slug}`} className="group flex h-full flex-col rounded-md focus-visible:outline-offset-4">
      <div className="relative">
        <ProductImage src={img?.url} alt={img?.alt || product.name} sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" priority={priority} />
        {info.compareAt ? (
          <span className="absolute left-0 top-3 rounded-r-md bg-accent px-2 py-1 text-sm font-bold text-ink">
            −{Math.round((1 - info.price / info.compareAt) * 100)}&nbsp;%
          </span>
        ) : null}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-2">
        <h3 className="line-clamp-2 break-words font-sans text-base font-normal leading-snug text-ink group-hover:underline">{product.name}</h3>
        <Price price={info.price} compareAt={info.compareAt} from={info.multiple && !info.compareAt} />
        <span className="text-sm text-stone-700">
          {info.label}
          {product.variants.length > 1 ? (
            <span className="text-stone-600">, et {product.variants.length - 1} autre{product.variants.length > 2 ? "s" : ""} format{product.variants.length > 2 ? "s" : ""}</span>
          ) : null}
        </span>
        {info.stock <= 0 ? <span className="text-sm font-bold text-red-700">{t.outOfStock}</span> : null}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0, promo = false }: { products: ProductCardData[]; priorityCount?: number; promo?: boolean }) {
  if (products.length === 0) return <p className="text-stone-700">Aucun produit pour le moment.</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id} className="min-w-0">
          <ProductCard product={p} priority={i < priorityCount} promo={promo} />
        </li>
      ))}
    </ul>
  );
}
