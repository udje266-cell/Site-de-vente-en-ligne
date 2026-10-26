import type { Metadata } from "next";
import Link from "next/link";
import { HeroComposition } from "@/components/HeroComposition";
import { ProductGrid } from "@/components/ProductCard";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { t } from "@/config/messages";
import { shopConfig } from "@/config/shop";
import { appUrl } from "@/lib/app-url";
import { getFamilies, getHomeSections } from "@/lib/catalog";
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

export default async function HomePage() {
  const onlineEnabled = onlinePaymentAvailable();
  const [families, settings] = await Promise.all([getFamilies(), getSettings()]);
  const heroIds = families.flatMap((f) => (f.pick ? [f.pick.id] : []));
  const { promos, best, bestFromSales, news } = await getHomeSections(4, heroIds);

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

      <section aria-labelledby="h-hero" className="-mx-4 -mt-6 bg-brand px-4 py-8 text-white sm:mx-0 sm:rounded-b-md sm:px-8 lg:py-10">
        <div className="grid items-center gap-8 md:grid-cols-[1.1fr_1fr]">
          <div className="min-w-0">
            <h1 id="h-hero" className="max-w-[14ch] text-[2.5rem] text-balance sm:text-5xl lg:text-6xl">
              Miel, karité, maïs et mil livrés à Abidjan
            </h1>
            <p className="mt-4 max-w-[44ch] text-pretty text-white/90">
              Notre miel de Korhogo est 100&nbsp;% naturel. {onlineEnabled ? "Payez à la livraison ou par Mobile Money." : "Vous payez à la livraison."}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Link href="/produits" className="btn-primary">Découvrir les produits</Link>
              <a
                href={waLink(settings.whatsapp, `Bonjour ${settings.shopName}, je souhaite passer une commande.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border-2 border-white text-white hover:bg-white hover:text-brand"
              >
                <WhatsAppIcon /> Commander sur WhatsApp
              </a>
            </div>
          </div>
          <HeroComposition families={families} />
        </div>
      </section>

      {promos.length > 0 ? (
        <section aria-labelledby="h-promo">
          <h2 id="h-promo" className="mb-4 text-3xl">{t.promotions}</h2>
          <ProductGrid products={promos} promo priorityCount={2} />
        </section>
      ) : null}
      {best.length > 0 ? (
        <section aria-labelledby="h-best">
          <h2 id="h-best" className="mb-4 text-3xl">{bestFromSales ? t.bestSellers : t.selection}</h2>
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
