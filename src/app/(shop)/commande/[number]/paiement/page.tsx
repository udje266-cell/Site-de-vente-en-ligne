import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { orderToken } from "@/lib/orders/token";
import { PaymentPoller } from "./PaymentPoller";

export const metadata: Metadata = { title: "Vérification du paiement", robots: { index: false } };
export const dynamic = "force-dynamic";

/** URL de retour CinetPay : n'affiche qu'un état d'attente ; le statut vient du serveur (webhook + vérification). */
export default async function PaymentReturnPage({ params, searchParams }: { params: Promise<{ number: string }>; searchParams: Promise<{ tx?: string }> }) {
  const { number } = await params;
  const { tx } = await searchParams;
  if (!tx) notFound();
  const payment = await prisma.payment.findUnique({ where: { transactionId: tx }, include: { order: true } });
  if (!payment || payment.order.number !== number) notFound();
  return (
    <div className="mx-auto max-w-md py-8 text-center">
      <h1 className="text-2xl font-bold">Paiement en cours de vérification</h1>
      <p className="mt-2 text-stone-700">Merci de patienter quelques instants, nous confirmons votre paiement auprès de CinetPay.</p>
      <PaymentPoller tx={tx} confirmationUrl={`/commande/${number}?t=${orderToken(number)}`} />
    </div>
  );
}
