import type { CheckPaymentResult, CheckedStatus, InitPaymentInput, InitPaymentResult, PaymentProvider } from "./types";

/**
 * Intégration CinetPay (API Checkout v2).
 *
 * ⚠️ À VÉRIFIER sur docs.cinetpay.com avant la mise en production (la documentation
 * n'était pas accessible depuis l'environnement de développement — voir docs/decisions.md) :
 *  - URL de base, chemins `/v2/payment` et `/v2/payment/check`,
 *  - noms exacts des champs et des codes de réponse ("201" à l'initialisation, "00" pour un paiement accepté),
 *  - règle « montant multiple de 5 » pour XOF.
 * L'URL de base est configurable (CINETPAY_BASE_URL) pour faciliter l'ajustement.
 *
 * Sécurité : le webhook n'utilise JAMAIS le contenu de la notification ; il rappelle checkPayment.
 */
const BASE_URL = process.env.CINETPAY_BASE_URL ?? "https://api-checkout.cinetpay.com";

function credentials() {
  const apikey = process.env.CINETPAY_API_KEY;
  const site_id = process.env.CINETPAY_SITE_ID;
  if (!apikey || !site_id) throw new Error("CINETPAY_API_KEY / CINETPAY_SITE_ID manquants");
  return { apikey, site_id };
}

async function post(path: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  return (await res.json().catch(() => ({ code: String(res.status) }))) as Record<string, unknown>;
}

function mapStatus(code: unknown, status: unknown): CheckedStatus {
  const s = String(status ?? "").toUpperCase();
  if (String(code) === "00" && s === "ACCEPTED") return "ACCEPTED";
  if (s === "REFUSED") return "REFUSED";
  if (s === "CANCELED" || s === "CANCELLED") return "CANCELLED";
  return "PENDING";
}

export class CinetPayProvider implements PaymentProvider {
  readonly name = "CINETPAY";

  async initPayment(input: InitPaymentInput): Promise<InitPaymentResult> {
    const [firstName, ...rest] = input.customer.name.trim().split(/\s+/);
    const raw = await post("/v2/payment", {
      ...credentials(),
      transaction_id: input.transactionId,
      amount: input.amount,
      currency: "XOF",
      description: input.description.replace(/[^\p{L}\p{N} -]/gu, " ").slice(0, 100),
      notify_url: input.notifyUrl,
      return_url: input.returnUrl,
      channels: "ALL",
      lang: "fr",
      customer_name: rest.join(" ") || firstName,
      customer_surname: firstName,
      customer_phone_number: input.customer.phone,
      customer_email: input.customer.email ?? undefined,
      customer_city: "Abidjan",
      customer_country: "CI",
    });
    const data = raw.data as { payment_url?: string } | undefined;
    if (String(raw.code) !== "201" || !data?.payment_url) {
      throw new Error(`CinetPay init échouée (code ${String(raw.code)} ${String(raw.message ?? "")})`);
    }
    return { paymentUrl: data.payment_url, raw };
  }

  async checkPayment(transactionId: string): Promise<CheckPaymentResult> {
    const raw = await post("/v2/payment/check", { ...credentials(), transaction_id: transactionId });
    const data = (raw.data ?? {}) as { amount?: string | number; currency?: string; status?: string };
    return {
      status: mapStatus(raw.code, data.status),
      amount: data.amount != null ? Number(data.amount) : null,
      currency: data.currency ?? null,
      raw,
    };
  }
}
