import Image from "next/image";
import Link from "next/link";
import { t } from "@/config/messages";
import { priceInfo, type ProductCardData } from "@/lib/catalog";
import { Price } from "./Price";

export function ProductCard({ product, priority = false }: { product: ProductCardData; priority?: boolean }) {
  const info = priceInfo(product);
  const img = product.images[0];
  return (
    <Link href={`/produits/${product.slug}`} className="group flex flex-col">
      <div className="relative aspect-square overflow-hidden rounded-md bg-karite">
        {img ? (
          <Image src={img.url} alt={img.alt || product.name} fill sizes="(max-width: 640px) 50vw, 25vw" className="object-cover" priority={priority} />
        ) : null}
        {info.compareAt ? <span className="absolute left-0 top-3 rounded-r-md bg-accent px-2 py-1 text-sm font-bold text-ink">Promo</span> : null}
      </div>
      <div className="flex flex-1 flex-col gap-0.5 pt-2">
        <h3 className="line-clamp-2 font-sans text-base font-normal leading-snug group-hover:underline">{product.name}</h3>
        <Price price={info.price} compareAt={info.compareAt} from={info.multiple} />
        {info.stock <= 0 ? <span className="text-xs text-red-700">{t.outOfStock}</span> : null}
      </div>
    </Link>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: ProductCardData[]; priorityCount?: number }) {
  if (products.length === 0) return <p className="text-stone-600">Aucun produit pour le moment.</p>;
  return (
    <ul className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <li key={p.id}>
          <ProductCard product={p} priority={i < priorityCount} />
        </li>
      ))}
    </ul>
  );
}
