export type InitPaymentInput = {
  transactionId: string;
  amount: number;
  description: string;
  notifyUrl: string;
  returnUrl: string;
  customer: { name: string; phone: string; email?: string | null };
};

export type InitPaymentResult = { paymentUrl: string; raw: unknown };

export type CheckedStatus = "PENDING" | "ACCEPTED" | "REFUSED" | "CANCELLED";

export type CheckPaymentResult = {
  status: CheckedStatus;
  amount: number | null;
  currency: string | null;
  raw: unknown;
};

export interface PaymentProvider {
  readonly name: string;
  initPayment(input: InitPaymentInput): Promise<InitPaymentResult>;
  /** Interroge le fournisseur pour connaître le statut RÉEL d'une transaction. */
  checkPayment(transactionId: string): Promise<CheckPaymentResult>;
}
