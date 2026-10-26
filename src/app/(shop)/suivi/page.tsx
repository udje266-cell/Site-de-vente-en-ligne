import type { Metadata } from "next";
import { OrderSummary, orderInclude } from "@/components/order/OrderSummary";
import { prisma } from "@/lib/db";
import { normalizeCiPhone } from "@/lib/format";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export const metadata: Metadata = { title: "Suivre ma commande", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ numero?: string; tel?: string }> };

export default async function TrackingPage({ searchParams }: Props) {
  const { numero = "", tel = "" } = await searchParams;
  let order = null;
  let error: string | null = null;
  if (numero && tel) {
    if (!(await rateLimit(`track:${await clientIp()}`, 20, 15 * 60))) {
      error = "Trop de tentatives. Réessayez dans quelques minutes.";
    } else {
      const phone = normalizeCiPhone(tel);
      const found = phone ? await prisma.order.findUnique({ where: { number: numero.trim().toUpperCase() }, include: orderInclude }) : null;
      if (found && found.customerPhone === phone) order = found;
      else error = "Aucune commande ne correspond à ce numéro et ce téléphone.";
    }
  }
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Suivre ma commande</h1>
      <form method="get" className="card space-y-3 p-4">
        <div>
          <label htmlFor="numero" className="label">Numéro de commande</label>
          <input id="numero" name="numero" defaultValue={numero} required placeholder="CMD-2026-000123" className="input" />
        </div>
        <div>
          <label htmlFor="tel" className="label">Téléphone utilisé pour la commande</label>
          <input id="tel" name="tel" type="tel" defaultValue={tel} required inputMode="tel" placeholder="07 00 00 00 00" className="input" />
        </div>
        <button className="btn-primary w-full">Voir le suivi</button>
      </form>
      {error ? <p role="alert" className="text-red-700">{error}</p> : null}
      {order ? <OrderSummary order={order} /> : null}
    </div>
  );
}
