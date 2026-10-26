import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { setFakeOutcome } from "@/lib/payments/fake";
import { fakePaymentsAllowed } from "@/lib/payments";
import { appUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";
export const metadata = { title: "Paiement (simulation)", robots: { index: false } };

/** Simule l'écran de paiement CinetPay (uniquement avec PAYMENT_PROVIDER=fake). */
export default async function FakePaymentPage({ params }: { params: Promise<{ tx: string }> }) {
  if (!fakePaymentsAllowed()) notFound();
  const { tx } = await params;
  const payment = await prisma.payment.findUnique({ where: { transactionId: decodeURIComponent(tx) }, include: { order: true } });
  if (!payment) notFound();

  async function decide(formData: FormData) {
    "use server";
    if (!fakePaymentsAllowed()) return;
    const outcome = formData.get("outcome");
    const p = payment!;
    if (outcome === "ACCEPTED" || outcome === "REFUSED") {
      await setFakeOutcome(p.transactionId, outcome, p.amount);
      // Simule la notification serveur-à-serveur envoyée par CinetPay
      const base = appUrl();
      await fetch(`${base}/api/payments/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ cpm_trans_id: p.transactionId, cpm_amount: String(p.amount) }),
      }).catch((e) => console.error("[fakepay] notify", e));
    }
    redirect(`/commande/${p.order.number}/paiement?tx=${encodeURIComponent(p.transactionId)}`);
  }

  return (
    <div className="mx-auto max-w-sm space-y-4 py-8 text-center">
      <p className="rounded bg-amber-100 p-2 text-sm">Mode simulation – aucun argent n&apos;est débité.</p>
      <h1 className="text-xl font-bold">Paiement de {formatPrice(payment.amount)}</h1>
      <p>Commande {payment.order.number}</p>
      <form action={decide} className="flex flex-col gap-2">
        <button name="outcome" value="ACCEPTED" className="btn-primary">Simuler un paiement accepté</button>
        <button name="outcome" value="REFUSED" className="btn-outline">Simuler un paiement refusé</button>
        <button name="outcome" value="ABANDON" className="btn-outline">Abandonner (retour sans payer)</button>
      </form>
    </div>
  );
}
