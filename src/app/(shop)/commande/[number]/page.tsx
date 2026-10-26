import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ClearCart } from "@/components/cart/ClearCart";
import { OrderSummary, orderInclude } from "@/components/order/OrderSummary";
import { prisma } from "@/lib/db";
import { verifyOrderToken } from "@/lib/orders/token";
import { retryPayment } from "./paiement/actions";

export const metadata: Metadata = { title: "Confirmation de commande", robots: { index: false } };
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ number: string }>; searchParams: Promise<{ t?: string; erreur?: string }> };

export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { number } = await params;
  const { t, erreur } = await searchParams;
  if (!verifyOrderToken(number, t)) notFound();
  const order = await prisma.order.findUnique({ where: { number }, include: orderInclude });
  if (!order) notFound();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <ClearCart />
      <h1 className="text-2xl font-bold">Merci pour votre commande !</h1>
      {erreur === "paiement" || order.status === "PENDING_PAYMENT" ? (
        <form action={retryPayment} className="card space-y-2 border-amber-300 bg-amber-50 p-4">
          <input type="hidden" name="number" value={order.number} />
          <input type="hidden" name="t" value={t} />
          <p>Le paiement n&apos;est pas encore finalisé. Vous avez 30 minutes pour payer, sinon la commande sera annulée.</p>
          <button className="btn-primary">Payer maintenant</button>
        </form>
      ) : (
        <p>Vous recevrez un SMS de confirmation. Gardez votre numéro de commande pour la suivre.</p>
      )}
      <OrderSummary order={order} />
      <Link href={`/suivi?numero=${order.number}`} className="btn-outline w-full">Suivre ma commande</Link>
    </div>
  );
}
