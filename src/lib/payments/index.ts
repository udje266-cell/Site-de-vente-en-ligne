import { CinetPayProvider } from "./cinetpay";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "cinetpay" ? new CinetPayProvider() : new FakePaymentProvider();
}

/**
 * Le paiement en ligne est-il proposé ? Avec le fournisseur factice, uniquement en
 * développement/tests (ou ALLOW_FAKE_PAYMENTS=1) : en production, la page de simulation
 * permettrait à n'importe qui de marquer une commande comme payée.
 */
export function onlinePaymentAvailable(): boolean {
  if (process.env.PAYMENT_PROVIDER === "cinetpay") return true;
  return fakePaymentsAllowed();
}

export function fakePaymentsAllowed(): boolean {
  return process.env.PAYMENT_PROVIDER !== "cinetpay" && (process.env.NODE_ENV !== "production" || process.env.ALLOW_FAKE_PAYMENTS === "1");
}
