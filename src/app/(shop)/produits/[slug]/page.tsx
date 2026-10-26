import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductGrid } from "@/components/ProductCard";
import { ProductPurchase } from "@/components/ProductPurchase";
import { usageLabels } from "@/config/messages";
import { appUrl } from "@/lib/app-url";
import { productCardInclude } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { getDeliveryEstimate } from "@/lib/delivery";
import { formatPrice } from "@/lib/format";
import { renderMarkdown } from "@/lib/markdown";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

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

/** Produits complémentaires : d'abord la même catégorie, puis d'autres produits disponibles (4 au plus). */
async function getRelated(productId: string, categoryId: string | null) {
  const where = { isActive: true, id: { not: productId }, variants: { some: { isActive: true, stock: { gt: 0 } } } };
  const same = categoryId ? await prisma.product.findMany({ where: { ...where, categoryId }, include: productCardInclude, take: 4 }) : [];
  if (same.length >= 4) return { title: "Dans la même catégorie", items: same };
  const others = await prisma.product.findMany({
    where: { ...where, id: { notIn: [productId, ...same.map((p) => p.id)] } },
    include: productCardInclude,
    orderBy: { isFeatured: "desc" },
    take: 4 - same.length,
  });
  return { title: same.length ? "Dans la même catégorie et ailleurs" : "Autres produits", items: [...same, ...others] };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProduct((await params).slug);
  if (!p || p.variants.length === 0) return {};
  const minPrice = Math.min(...p.variants.map((v) => v.price));
  const formats = p.variants.map((v) => v.label).join(", ");
  const description = `${p.name} chez Noh's Shop : ${p.variants.length > 1 ? `formats ${formats}` : formats}, dès ${formatPrice(minPrice)}. Livraison à Abidjan, paiement à la livraison ou commande sur WhatsApp.`;
  return {
    title: `${p.name}, dès ${formatPrice(minPrice)}`,
    description,
    alternates: { canonical: `/produits/${p.slug}` },
    openGraph: {
      title: p.name,
      description,
      // Sans photo produit : image de partage de la boutique (logo)
      images: p.images.length
        ? p.images.slice(0, 1).map((i) => ({ url: i.url, width: i.width, height: i.height, alt: i.alt }))
        : [{ url: "/opengraph-image.jpg", width: 1200, height: 630, alt: "Noh's Shop" }],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug);
  if (!product || product.variants.length === 0) notFound();
  const [settings, deliveryNote, related] = await Promise.all([getSettings(), getDeliveryEstimate(), getRelated(product.id, product.categoryId)]);
  const url = `${appUrl()}/produits/${product.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    ...(product.images.length ? { image: product.images.map((i) => new URL(i.url, appUrl()).toString()) } : {}),
    ...(product.description ? { description: product.description } : {}),
    brand: { "@type": "Brand", name: settings.shopName },
    offers: product.variants.map((v) => ({
      "@type": "Offer",
      sku: v.sku,
      name: v.label,
      price: v.price,
      priceCurrency: "XOF",
      availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      url,
    })),
  };

  // Informations produit : seules les données renseignées par la boutique sont affichées
  const details = [
    ["Ingrédients", product.ingredients],
    ["Conservation", product.storage],
    ["Origine", product.origin],
  ].filter((d): d is [string, string] => Boolean(d[1]));
  const usage = product.usage ? usageLabels[product.usage] : null;
  const askText = `Bonjour ${settings.shopName}, pouvez-vous me donner plus d'informations sur « ${product.name} » ?\n${url}`;

  return (
    <div className="space-y-12">
    <article className="grid gap-6 md:grid-cols-2 md:gap-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="min-w-0">
        <ProductGallery images={product.images.map((i) => ({ url: i.url, alt: i.alt || product.name }))} name={product.name} />
      </div>
      <div className="min-w-0 space-y-5">
        <nav aria-label="Fil d'Ariane" className="text-sm">
          <Link href="/produits" className="inline-flex min-h-11 items-center text-brand underline">Produits</Link>
          {product.category ? (
            <>
              {" / "}
              <Link href={`/categories/${product.category.slug}`} className="inline-flex min-h-11 items-center text-brand underline">
                {product.category.name}
              </Link>
            </>
          ) : null}
        </nav>
        <h1 className="text-4xl text-balance break-words">{product.name}</h1>
        {usage ? (
          <p className={`inline-block rounded-md px-3 py-1 text-sm font-bold ${product.usage === "COSMETIQUE" ? "bg-mil text-ink" : "bg-nere text-white"}`}>
            {usage.label}
          </p>
        ) : null}
        <ProductPurchase
          productName={product.name}
          slug={product.slug}
          image={product.images[0]?.url}
          whatsapp={settings.whatsapp}
          shopName={settings.shopName}
          productUrl={url}
          deliveryNote={deliveryNote}
          variants={product.variants.map((v) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            stock: v.stock,
            netWeight: v.netWeight,
          }))}
        />
        {product.leadTimeNote ? <p className="text-sm text-stone-700">Délai propre à ce produit : {product.leadTimeNote}.</p> : null}

        <section aria-labelledby="h-infos" className="border-t border-stone-200 pt-5">
          <h2 id="h-infos" className="mb-3 text-2xl">Informations produit</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="font-bold">Usage</dt>
            <dd>{usage ? usage.detail : "À préciser par la boutique."}</dd>
            {details.map(([k, val]) => (
              <div key={k} className="contents">
                <dt className="font-bold">{k}</dt>
                <dd className="whitespace-pre-line break-words">{val}</dd>
              </div>
            ))}
          </dl>
          {details.length < 3 ? (
            <p className="mt-3 text-sm text-stone-700">
              {details.length === 0 ? "Ingrédients, conservation et origine : informations à venir." : "Certaines informations sont encore à venir."}{" "}
              <a href={waLink(settings.whatsapp, askText)} target="_blank" rel="noopener noreferrer" className="font-bold text-brand underline">
                Posez-nous la question sur WhatsApp
              </a>
            </p>
          ) : null}
          {product.description ? (
            <div className="prose-shop mt-4" dangerouslySetInnerHTML={{ __html: renderMarkdown(product.description) }} />
          ) : null}
        </section>
      </div>
    </article>
    {related.items.length > 0 ? (
      <section aria-labelledby="h-related">
        <h2 id="h-related" className="mb-4 text-3xl">{related.title}</h2>
        <ProductGrid products={related.items} />
      </section>
    ) : null}
    </div>
  );
}
