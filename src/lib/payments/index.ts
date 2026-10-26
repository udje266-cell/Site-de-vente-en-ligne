import { CinetPayProvider } from "./cinetpay";
import { FakePaymentProvider } from "./fake";
import type { PaymentProvider } from "./types";

export function getPaymentProvider(): PaymentProvider {
  return process.env.PAYMENT_PROVIDER === "cinetpay" ? new CinetPayProvider() : new FakePaymentProvider();
}
