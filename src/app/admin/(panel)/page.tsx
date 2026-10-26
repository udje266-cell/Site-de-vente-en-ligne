import Link from "next/link";
import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

/** Début du jour/semaine/mois dans le fuseau Africa/Abidjan (UTC+0, sans heure d'été). */
function periodStarts(now = new Date()) {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const week = new Date(day);
  week.setUTCDate(day.getUTCDate() - ((day.getUTCDay() + 6) % 7));
  const month = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return { day, week, month };
}

const revenueStatuses = ["PAID", "CONFIRMED", "PREPARED", "SHIPPED", "DELIVERED"] as const;

export default async function Dashboard() {
  const { day, week, month } = periodStarts();
  const revenue = async (from: Date) => {
    const r = await prisma.order.aggregate({
      where: { createdAt: { gte: from }, status: { in: [...revenueStatuses] } },
      _sum: { total: true },
      _count: true,
    });
    return { total: r._sum.total ?? 0, count: r._count };
  };
  const [d, w, m, toProcess, lowStock] = await Promise.all([
    revenue(day),
    revenue(week),
    revenue(month),
    prisma.order.count({ where: { status: { in: ["COD_PENDING", "PAID", "CONFIRMED", "PREPARED"] } } }),
    prisma.productVariant.findMany({
      where: { isActive: true, product: { isActive: true }, stock: { lte: shopConfig.defaults.lowStockThreshold } },
      include: { product: true },
      orderBy: { stock: "asc" },
      take: 20,
    }),
  ]);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Tableau de bord</h1>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ["Aujourd'hui", d],
          ["Cette semaine", w],
          ["Ce mois", m],
        ].map(([label, v]) => (
          <div key={label as string} className="card p-3">
            <p className="text-sm text-stone-600">{label as string}</p>
            <p className="text-lg font-bold">{formatPrice((v as { total: number }).total)}</p>
            <p className="text-sm">{(v as { count: number }).count} commande(s)</p>
          </div>
        ))}
        <Link href="/admin/commandes?statut=a-traiter" className="card bg-amber-50 p-3">
          <p className="text-sm text-stone-600">À traiter</p>
          <p className="text-2xl font-bold">{toProcess}</p>
        </Link>
      </div>
      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Stock bas</h2>
        {lowStock.length === 0 ? (
          <p className="text-sm text-stone-600">Aucun produit en stock bas.</p>
        ) : (
          <ul className="divide-y divide-stone-100 text-sm">
            {lowStock.map((v) => (
              <li key={v.id}>
                <Link href={`/admin/produits/${v.productId}`} className="flex min-h-11 items-center justify-between">
                  <span>{v.product.name} – {v.label}</span>
                  <strong className={v.stock <= 0 ? "text-red-700" : ""}>{v.stock}</strong>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/produits/nouveau" className="btn-primary">+ Ajouter un produit</Link>
        <Link href="/admin/commandes" className="btn-outline">Voir les commandes</Link>
      </div>
    </div>
  );
}
