import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { OrderSummary, orderInclude } from "@/components/order/OrderSummary";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { prisma } from "@/lib/db";
import { verifyOrderToken } from "@/lib/orders/token";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";
import { retryPayment } from "./paiement/actions";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; erreur?: string }> };

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t, erreur } = await searchParams;
  if (!verifyOrderToken(number, t)) notFound();
  const [order, settings] = await Promise.all([prisma.order.findUnique({ where: { number }, include: orderInclude }), getSettings()]);
  if (!order) notFound();
  const awaitingPayment = erreur === "paiement" || order.status === "PENDING_PAYMENT";
  return (
    <div className="mx-auto max-w-xl space-y-4">
      {/* La commande existe bien : le panier peut être vidé */}
      <ClearCart />
      <h1 className="text-3xl">{awaitingPayment ? "Commande enregistrée" : "Merci, votre commande est enregistrée"}</h1>
      {awaitingPayment ? (
        <form action={retryPayment} className="card space-y-2 border-amber-300 bg-amber-50 p-4">
          <input type="hidden" name="number" value={order.number} />
          <input type="hidden" name="t" value={t} />
          <p>Le paiement n&apos;est pas encore finalisé. Sans paiement sous 30 minutes, la commande est annulée.</p>
          <button className="btn-primary">Payer maintenant</button>
        </form>
      ) : (
        <div className="card space-y-2 border-nere/40 bg-karite p-4">
          <p>
            Notez votre référence : <strong className="display text-xl">{order.number}</strong>
          </p>
          <p className="text-sm">
            Avec cette référence et votre téléphone, suivez l&apos;avancement de la commande sur la page{" "}
            <Link href={`/suivi?numero=${order.number}`} className="font-bold text-brand underline">Suivre ma commande</Link>.
          </p>
        </div>
      )}
      <OrderSummary order={order} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link href={`/suivi?numero=${order.number}`} className="btn-outline flex-1">Suivre ma commande</Link>
        <a
          href={waLink(settings.whatsapp, `Bonjour ${settings.shopName}, je vous contacte au sujet de ma commande ${order.number}.`)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-wa flex-1"
        >
          <WhatsAppIcon /> Nous écrire
        </a>
      </div>
      <Link href="/produits" className="btn-outline w-full">Continuer mes achats</Link>
    </div>
  );
}
