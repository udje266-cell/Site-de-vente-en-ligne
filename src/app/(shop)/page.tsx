import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { t } from "@/config/messages";
import { shopConfig } from "@/config/shop";
import { appUrl } from "@/lib/app-url";
import { getFamilies, getHomeSections } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import { onlinePaymentAvailable } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: "Noh's Shop : miel de Korhogo, karité, maïs et mil à Abidjan" },
  description:
    "Miel de Korhogo 100 % naturel, beurre de karité, maïs et mil livrés à Abidjan. Commandez en ligne ou sur WhatsApp, paiement à la livraison.",
  alternates: { canonical: "/" },
};

/** Couleur de chaque famille : la matière du produit. */
const familyStyle: Record<string, string> = {
  miel: "bg-accent text-ink",
  karite: "bg-karite text-ink",
  mais: "bg-mil text-ink",
  mil: "bg-[#e3d6b4] text-ink",
};

export default async function HomePage() {
  const onlineEnabled = onlinePaymentAvailable();
  const [{ promos, best, bestFromSales, news }, families, settings] = await Promise.all([getHomeSections(4), getFamilies(), getSettings()]);

  // Données structurées « commerce local » (référencement local à Abidjan)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Store",
    name: settings.shopName,
    image: `${appUrl()}/logo.webp`,
    logo: `${appUrl()}/logo.webp`,
    url: appUrl(),
    telephone: settings.whatsapp,
    address: { "@type": "PostalAddress", addressLocality: shopConfig.city, addressCountry: shopConfig.country },
    areaServed: "Abidjan",
    currenciesAccepted: "XOF",
  };

  return (
    <div className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      <section aria-labelledby="h-hero" className="-mx-4 -mt-6 bg-brand px-4 py-8 text-white sm:mx-0 sm:rounded-b-md sm:px-8">
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <h1 id="h-hero" className="max-w-[18ch] text-[2.4rem] text-balance sm:text-5xl lg:text-6xl">
              Miel de Korhogo, karité, maïs et mil livrés à Abidjan
            </h1>
            <p className="mt-4 max-w-[46ch] text-pretty text-white/90">
              {onlineEnabled ? "Payez à la livraison ou par Mobile Money." : "Vous payez à la livraison."} Une question sur un produit ?
              Écrivez-nous, on vous répond sur WhatsApp.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/produits" className="btn-primary">Découvrir nos produits</Link>
              <a
                href={waLink(settings.whatsapp, "Bonjour Noh's Shop, j'ai une question sur vos produits.")}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border-2 border-white text-white hover:bg-white hover:text-brand"
              >
                <WhatsAppIcon /> Nous contacter sur WhatsApp
              </a>
            </div>
          </div>
          <div className="hidden justify-self-center rounded-full bg-white p-6 md:block">
            <Image src="/embleme.png" alt="" width={192} height={192} priority />
          </div>
        </div>
      </section>

      <section aria-labelledby="h-familles">
        <h2 id="h-familles" className="mb-4 text-3xl">Nos produits</h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {families.map((f) => (
            <li key={f.key} className="min-w-0">
              <Link href={f.href} className={`flex h-full min-h-32 flex-col justify-between gap-2 rounded-md p-4 hover:outline-2 hover:outline-brand ${familyStyle[f.key]}`}>
                <span>
                  <span className="display block text-3xl">{f.title}</span>
                  <span className="mt-1 block text-sm">{f.line}</span>
                </span>
                <span className="text-sm font-bold">
                  {f.count > 0 && f.minPrice != null
                    ? `${f.count} produit${f.count > 1 ? "s" : ""}, dès ${formatPrice(f.minPrice)}`
                    : "Bientôt disponible"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {promos.length > 0 ? (
        <section aria-labelledby="h-promo">
          <h2 id="h-promo" className="mb-4 text-3xl">{t.promotions}</h2>
          <ProductGrid products={promos} promo priorityCount={2} />
        </section>
      ) : null}
      {best.length > 0 ? (
        <section aria-labelledby="h-best">
          <h2 id="h-best" className="mb-4 text-3xl">{bestFromSales ? t.bestSellers : "Nos incontournables"}</h2>
          <ProductGrid products={best} />
        </section>
      ) : null}
      {news.length > 0 ? (
        <section aria-labelledby="h-new">
          <h2 id="h-new" className="mb-4 text-3xl">{t.newArrivals}</h2>
          <ProductGrid products={news} />
        </section>
      ) : null}
      <p>
        <Link href="/produits" className="btn-outline">Voir tous les produits</Link>
      </p>
    </div>
  );
}
