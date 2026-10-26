import { prisma } from "@/lib/db";
import type { CheckPaymentResult, CheckedStatus, InitPaymentInput, InitPaymentResult, PaymentProvider } from "./types";
import { appUrl } from "@/lib/app-url";

/**
 * Fournisseur factice (dev + tests e2e, PAYMENT_PROVIDER=fake).
 * La page /paiement/fake/[tx] simule l'écran CinetPay : elle enregistre le choix
 * (accepté/refusé) ici, puis appelle le webhook comme le ferait CinetPay.
 */
const key = (tx: string) => `fakepay:${tx}`;

export async function setFakeOutcome(transactionId: string, status: CheckedStatus, amount: number) {
  const value = JSON.stringify({ status, amount });
  await prisma.setting.upsert({ where: { key: key(transactionId) }, create: { key: key(transactionId), value }, update: { value } });
}

export class FakePaymentProvider implements PaymentProvider {
  readonly name = "FAKE";

  async initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
    const base = appUrl();
    return { paymentUrl: `${base}/paiement/fake/${encodeURIComponent(input.transactionId)}`, raw: { fake: true } };
  }

  async checkPayment(transactionId: string): Promise<CheckPaymentResult> {
    const row = await prisma.setting.findUnique({ where: { key: key(transactionId) } });
    if (!row) return { status: "PENDING", amount: null, currency: null, raw: { fake: true, status: "PENDING" } };
    const v = JSON.parse(row.value) as { status: CheckedStatus; amount: number };
    return { status: v.status, amount: v.amount, currency: "XOF", raw: { fake: true, ...v } };
  }
}
