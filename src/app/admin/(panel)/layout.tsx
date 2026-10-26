import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { SignOutButton } from "./SignOutButton";

export const dynamic = "force-dynamic";

const nav = [
  ["/admin", "Accueil"],
  ["/admin/commandes", "Commandes"],
  ["/admin/produits", "Produits"],
  ["/admin/categories", "Catégories"],
  ["/admin/zones", "Livraison"],
  ["/admin/promos", "Promos"],
  ["/admin/pages", "Pages"],
  ["/admin/reglages", "Réglages"],
] as const;

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <header className="sticky top-0 z-30 bg-stone-900 text-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-3 py-1">
          <Link href="/admin" className="flex min-h-11 items-center font-bold">Admin boutique</Link>
          <div className="flex items-center gap-1">
            <Link href="/" className="btn text-sm">Voir le site</Link>
            <SignOutButton />
          </div>
        </div>
        <nav aria-label="Administration" className="bg-stone-800">
          <ul className="mx-auto flex max-w-5xl overflow-x-auto px-2 text-sm">
            {nav.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="flex min-h-11 items-center whitespace-nowrap px-3 hover:underline">{label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-3 py-4">{children}</main>
    </>
  );
}
