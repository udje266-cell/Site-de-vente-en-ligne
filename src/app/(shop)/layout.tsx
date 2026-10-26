import Image from "next/image";
import Link from "next/link";
import { CartBadge } from "@/components/cart/CartBadge";
import { CartProvider } from "@/components/cart/CartProvider";
import { SearchBox } from "@/components/SearchBox";
import { KorhogoBand } from "@/components/KorhogoBand";
import { FloatingWhatsApp } from "@/components/WhatsAppButton";
import { shopConfig } from "@/config/shop";
import { getCategories } from "@/lib/catalog";
import { getSettings } from "@/lib/settings";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
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
            <div className="w-40 rounded-md bg-white p-2">
              <Image src={shopConfig.logoFull} alt={settings.shopName} width={640} height={574} sizes="160px" className="h-auto w-full" />
            </div>
            
            <p className="mt-1">{shopConfig.city}, Côte d&apos;Ivoire</p>
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
            <p className="font-bold text-white">Suivez-nous</p>
            <ul className="mt-1 flex gap-4">
              <li><a href={shopConfig.social.facebook} rel="noopener noreferrer" target="_blank" className="inline-block py-2 hover:underline">Facebook</a></li>
              <li><a href={shopConfig.social.instagram} rel="noopener noreferrer" target="_blank" className="inline-block py-2 hover:underline">Instagram</a></li>
              <li><a href={shopConfig.social.tiktok} rel="noopener noreferrer" target="_blank" className="inline-block py-2 hover:underline">TikTok</a></li>
            </ul>
          </div>
        </div>
      </footer>
      <FloatingWhatsApp phone={settings.whatsapp} />
    </CartProvider>
  );
}
