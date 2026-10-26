import type { OrderStatus, Prisma } from "@prisma/client";
import Link from "next/link";
import { statusLabels } from "@/config/messages";
import { prisma } from "@/lib/db";
import { formatDate, formatPrice } from "@/lib/format";

const filters: [string, string, OrderStatus[] | null][] = [
  ["a-traiter", "À traiter", ["COD_PENDING", "PAID", "CONFIRMED", "PREPARED"]],
  ["en-livraison", "En livraison", ["SHIPPED"]],
  ["attente-paiement", "Attente paiement", ["PENDING_PAYMENT"]],
  ["livrees", "Livrées", ["DELIVERED"]],
  ["annulees", "Annulées/remb.", ["CANCELLED", "REFUNDED"]],
  ["toutes", "Toutes", null],
];

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ statut?: string; q?: string }> }) {
  const { statut = "a-traiter", q } = await searchParams;
  const f = filters.find((x) => x[0] === statut) ?? filters[0]!;
  const where: Prisma.OrderWhereInput = {
    ...(f[2] ? { status: { in: f[2] } } : {}),
    ...(q ? { OR: [{ number: { contains: q.trim(), mode: "insensitive" } }, { customerName: { contains: q.trim(), mode: "insensitive" } }, { customerPhone: { contains: q.replace(/\D/g, "") || q } }] } : {}),
  };
  const orders = await prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Commandes</h1>
      <nav aria-label="Filtrer par statut" className="flex gap-1 overflow-x-auto">
        {filters.map(([key, label]) => (
          <Link key={key} href={`/admin/commandes?statut=${key}`} aria-current={key === f[0]} className={`btn whitespace-nowrap text-sm ${key === f[0] ? "bg-stone-900 text-white" : "bg-white border border-stone-300"}`}>
            {label}
          </Link>
        ))}
      </nav>
      <form className="flex gap-2">
        <input type="hidden" name="statut" value="toutes" />
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" defaultValue={q} placeholder="N°, nom ou téléphone" className="input" />
        <button className="btn-outline">Chercher</button>
      </form>
      {orders.length === 0 ? <p className="text-stone-600">Aucune commande.</p> : null}
      <ul className="space-y-2">
        {orders.map((o) => (
          <li key={o.id}>
            <Link href={`/admin/commandes/${o.id}`} className="card flex items-center justify-between gap-2 p-3 hover:bg-stone-50">
              <div>
                <p className="font-semibold">{o.number}</p>
                <p className="text-sm">{o.customerName}</p>
                <p className="text-xs text-stone-600">{formatDate(o.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold">{formatPrice(o.total)}</p>
                <p className="text-xs">{statusLabels[o.status]}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
