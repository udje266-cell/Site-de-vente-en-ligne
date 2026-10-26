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

type SP = { statut?: string; q?: string; du?: string; au?: string };

const isoDay = (d: Date) => d.toISOString().slice(0, 10);
const validDay = (v?: string) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : undefined);

/** Construit l'URL de la liste en conservant les autres filtres. */
function href(current: SP, patch: Partial<SP>) {
  const next = { ...current, ...patch };
  const qs = new URLSearchParams(Object.entries(next).filter(([, v]) => v) as [string, string][]).toString();
  return `/admin/commandes${qs ? `?${qs}` : ""}`;
}

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const statut = sp.statut ?? "a-traiter";
  const du = validDay(sp.du);
  const au = validDay(sp.au);
  const q = sp.q?.trim().slice(0, 60);
  const current: SP = { statut, q, du, au };
  const f = filters.find((x) => x[0] === statut) ?? filters[0]!;
  // Africa/Abidjan = UTC+0 : une journée va de 00:00 à 23:59 UTC
  const createdAt: Prisma.DateTimeFilter = {};
  if (du) createdAt.gte = new Date(`${du}T00:00:00Z`);
  if (au) createdAt.lt = new Date(new Date(`${au}T00:00:00Z`).getTime() + 86_400_000);
  const where: Prisma.OrderWhereInput = {
    ...(f[2] ? { status: { in: f[2] } } : {}),
    ...(du || au ? { createdAt } : {}),
    ...(q ? { OR: [{ number: { contains: q, mode: "insensitive" } }, { customerName: { contains: q, mode: "insensitive" } }, { customerPhone: { contains: q.replace(/\D/g, "") || q } }] } : {}),
  };
  const [orders, totals] = await Promise.all([
    prisma.order.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    prisma.order.aggregate({ where, _count: true, _sum: { total: true } }),
  ]);
  const today = new Date();
  const daysAgo = (n: number) => isoDay(new Date(today.getTime() - n * 86_400_000));
  const presets: [string, Partial<SP>][] = [
    ["Aujourd'hui", { du: isoDay(today), au: isoDay(today) }],
    ["7 derniers jours", { du: daysAgo(6), au: isoDay(today) }],
    ["30 derniers jours", { du: daysAgo(29), au: isoDay(today) }],
    ["Toutes dates", { du: undefined, au: undefined }],
  ];
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Commandes</h1>
      <nav aria-label="Filtrer par statut" className="flex gap-1 overflow-x-auto">
        {filters.map(([key, label]) => (
          <Link key={key} href={href(current, { statut: key })} aria-current={key === f[0]} className={`btn whitespace-nowrap text-sm ${key === f[0] ? "bg-stone-900 text-white" : "bg-white border border-stone-300"}`}>
            {label}
          </Link>
        ))}
      </nav>
      <nav aria-label="Filtrer par période" className="flex gap-1 overflow-x-auto">
        {presets.map(([label, patch]) => {
          const active = (patch.du ?? "") === (du ?? "") && (patch.au ?? "") === (au ?? "");
          return (
            <Link key={label} href={href(current, patch)} aria-current={active} className={`btn whitespace-nowrap text-sm ${active ? "bg-brand text-white" : "bg-white border border-stone-300"}`}>
              {label}
            </Link>
          );
        })}
      </nav>
      <form className="card grid grid-cols-2 gap-2 p-3 sm:grid-cols-[1fr_1fr_2fr_auto]">
        <input type="hidden" name="statut" value={statut} />
        <div>
          <label htmlFor="du" className="label">Du</label>
          <input id="du" name="du" type="date" defaultValue={du} className="input" />
        </div>
        <div>
          <label htmlFor="au" className="label">Au</label>
          <input id="au" name="au" type="date" defaultValue={au} className="input" />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="q" className="label">Référence, nom ou téléphone</label>
          <input id="q" name="q" defaultValue={q} placeholder="CMD-2026-000123…" className="input" />
        </div>
        <div className="col-span-2 flex items-end gap-2 sm:col-span-1">
          <button className="btn-primary">Filtrer</button>
          <Link href="/admin/commandes?statut=toutes" className="btn-outline">Réinitialiser</Link>
        </div>
      </form>
      <p className="text-sm text-stone-700">
        {totals._count} commande{totals._count > 1 ? "s" : ""}, total {formatPrice(totals._sum.total ?? 0)}
        {totals._count > 100 ? " (100 plus récentes affichées)" : ""}
      </p>
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
