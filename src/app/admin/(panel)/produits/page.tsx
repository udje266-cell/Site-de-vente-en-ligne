import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { name: { contains: q, mode: "insensitive" } } : {},
    include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true, category: true },
    orderBy: { updatedAt: "desc" },
  });
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Produits</h1>
        <Link href="/admin/produits/nouveau" className="btn-primary">+ Ajouter</Link>
      </div>
      <form className="flex gap-2">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" defaultValue={q} placeholder="Rechercher" className="input" />
        <button className="btn-outline">OK</button>
      </form>
      <ul className="space-y-2">
        {products.map((p) => {
          const stock = p.variants.reduce((s, v) => s + v.stock, 0);
          const min = p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : 0;
          return (
            <li key={p.id}>
              <Link href={`/admin/produits/${p.id}`} className="card flex items-center gap-3 p-2 hover:bg-stone-50">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded bg-stone-100">
                  {p.images[0] ? <Image src={p.images[0].url} alt="" fill sizes="56px" className="object-cover" /> : null}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{p.name} {!p.isActive ? <span className="text-xs text-red-700">(masqué)</span> : null}</p>
                  <p className="text-xs text-stone-600">{p.category?.name ?? "Sans catégorie"} · {formatPrice(min)} · stock {stock}</p>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
