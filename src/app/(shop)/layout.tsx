import Image from "next/image";
import Link from "next/link";
import { CartBadge } from "@/components/cart/CartBadge";
import { CartProvider } from "@/components/cart/CartProvider";
import { SearchBox } from "@/components/SearchBox";
import { KorhogoBand } from "@/components/KorhogoBand";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { shopConfig } from "@/config/shop";
import { getCategories } from "@/lib/catalog";
import { formatPhone } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const socialLinks = (
    [
      ["Facebook", shopConfig.social.facebook],
      ["Instagram", shopConfig.social.instagram],
      ["TikTok", shopConfig.social.tiktok],
    ] as const
  ).filter(([, href]) => href);
  return (
    <CartProvider>
      <a href="#contenu" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:bg-white focus:p-2">
        Aller au contenu
      </a>
      <header className="sticky top-0 z-30 bg-brand text-white">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2">
          <Link href="/" className="flex min-h-11 shrink-0 items-center gap-2 font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-white">
              <Image src={shopConfig.logo} alt="" width={34} height={34} priority />
            </span>
            <span className="display hidden text-xl sm:inline">{settings.shopName}</span>
            <span className="sr-only sm:hidden">{settings.shopName} – accueil</span>
          </Link>
          <div className="flex-1">
            <SearchBox />
          </div>
          <CartBadge />
        </div>
        <nav aria-label="Catégories" className="border-t border-white/15">
          <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 text-[0.95rem]">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/categories/${c.slug}`} className="flex min-h-11 items-center whitespace-nowrap px-2 hover:underline">
                  {c.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/suivi" className="flex min-h-11 items-center whitespace-nowrap px-2 hover:underline">
                Suivre ma commande
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main id="contenu" className="mx-auto max-w-6xl px-4 py-6">
        {children}
      </main>
      <footer className="mt-16 bg-brand text-white/85">
        <KorhogoBand className="block" color="#e59900" />
        <div className="mx-auto grid max-w-6xl gap-6 px-3 py-8 text-sm sm:grid-cols-3">
          <div>
            <div className="max-w-sm rounded-md bg-white p-3">
              <Image
                src="/banniere.webp"
                alt={`${settings.shopName} – Miel de Korhogo, 100 % naturel`}
                width={900}
                height={306}
                sizes="(max-width: 640px) 90vw, 384px"
                className="h-auto w-full"
              />
            </div>
            
            <p className="mt-3">{shopConfig.city}, Côte d&apos;Ivoire</p>
          </div>
          <nav aria-label="Informations">
            <ul className="space-y-1">
              {[
                ["a-propos", "À propos"],
                ["livraison", "Livraison"],
                ["retours", "Retours"],
                ["cgv", "CGV"],
                ["confidentialite", "Confidentialité"],
                ["mentions-legales", "Mentions légales"],
                ["contact", "Contact"],
              ].map(([slug, label]) => (
                <li key={slug}>
                  <Link href={`/infos/${slug}`} className="inline-block py-1 hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div>
            <p className="font-bold text-white">Nous contacter</p>
            <ul className="mt-1">
              <li>
                <a href={`tel:${settings.whatsapp}`} className="inline-block py-2 hover:underline">
                  Appeler le {formatPhone(settings.whatsapp)}
                </a>
              </li>
              <li>
                <a href={waLink(settings.whatsapp)} rel="noopener noreferrer" target="_blank" className="inline-block py-2 hover:underline">
                  Écrire sur WhatsApp
                </a>
              </li>
            </ul>
            {socialLinks.length > 0 ? (
              <>
                <p className="mt-4 font-bold text-white">Suivez-nous</p>
                <ul className="mt-1 flex gap-4">
                  {socialLinks.map(([label, href]) => (
                    <li key={label}>
                      <a href={href} rel="noopener noreferrer" target="_blank" className="inline-block py-2 hover:underline">{label}</a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}
          </div>
        </div>
      </footer>
      <FloatingWhatsApp phone={settings.whatsapp} />
    </CartProvider>
  );
}
