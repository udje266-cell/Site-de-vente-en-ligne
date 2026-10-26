import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductPurchase } from "@/components/ProductPurchase";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getSettings } from "@/lib/settings";

export const revalidate = 300;

/** Pages générées à la première visite puis mises en cache (ISR). */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const getProduct = cache((slug: string) =>
  prisma.product.findFirst({
    where: { slug, isActive: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: { where: { isActive: true }, orderBy: { position: "asc" } },
    },
  }),
);

const appUrl = process.env.APP_URL ?? "http://localhost:3000";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p) return {};
  const minPrice = Math.min(...p.variants.map((v) => v.price));
  const description = `${p.name} à partir de ${formatPrice(minPrice)}. ${p.description.replace(/[#*_>\n]+/g, " ").slice(0, 120)}`;
  return {
    title: p.name,
    description,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: { title: p.name, description, images: p.images.slice(0, 1).map((i) => ({ url: i.url, width: i.width, height: i.height, alt: i.alt })) },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product || product.variants.length === 0) notFound();
  const settings = await getSettings();
  const url = `${appUrl}/produits/${product.slug}`;
  const totalStock = product.variants.reduce((s, v) => s + v.stock, 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images.map((i) => new URL(i.url, appUrl).toString()),
    description: product.description,
    sku: product.variants[0]?.sku,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "XOF",
      lowPrice: Math.min(...product.variants.map((v) => v.price)),
      highPrice: Math.max(...product.variants.map((v) => v.price)),
      offerCount: product.variants.length,
      availability: totalStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    },
  };

  return (
    <article className="grid gap-6 md:grid-cols-2">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <ProductGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt || product.name }))} name={product.name} />
      <div className="space-y-4">
        {product.category ? (
          <Link href={`/categories/${product.category.slug}`} className="inline-block py-2 text-sm text-brand underline">
            {product.category.name}
          </Link>
        ) : null}
        <h1 className="text-4xl">{product.name}</h1>
        <ProductPurchase
          productName={product.name}
          slug={product.slug}
          image={product.images[0]?.url}
          whatsapp={settings.whatsapp}
          productUrl={url}
          variants={product.variants.map((v) => ({ id: v.id, label: v.label, price: v.price, compareAtPrice: v.compareAtPrice, stock: v.stock }))}
        />
        <p className="text-sm text-stone-700">
          🚚 Livraison indicative : {product.leadTimeNote ?? "24 à 48 h à Abidjan, 3 à 5 jours à l'intérieur du pays"}.{" "}
          <Link href="/infos/livraison" className="underline">Détails</Link>
        </p>
        <div className="prose-shop border-t border-stone-200 pt-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }} />
      </div>
    </article>
  );
}
