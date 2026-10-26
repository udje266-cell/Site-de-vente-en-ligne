"use server";

import { redirect } from "next/navigation";
import { createOrder } from "@/lib/orders/create";
import { OrderError } from "@/lib/orders/errors";
import { checkoutSchema } from "@/lib/orders/schema";
import { orderToken } from "@/lib/orders/token";
import { notifyOrderCreated } from "@/lib/notify";
import { startOnlinePayment } from "@/lib/payments/process";

export type CheckoutState = { error?: string; fieldErrors?: Record<string, string> };

export async function placeOrder(_prev: CheckoutState, formData: FormData): Promise<CheckoutState> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { error: "Panier invalide." };
  }
  const str = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v : undefined;
  };
  const parsed = checkoutSchema.safeParse({
    items,
    customerName: str("customerName") ?? "",
    customerPhone: str("customerPhone") ?? "",
    customerEmail: str("customerEmail"),
    pickup: str("pickup") === "on",
    deliveryZoneId: str("deliveryZoneId") || undefined,
    deliveryAddress: str("deliveryAddress") ?? "",
    deliveryNote: str("deliveryNote"),
    promoCode: str("promoCode") || undefined,
    paymentMethod: str("paymentMethod"),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return { error: "Merci de corriger les champs indiqués.", fieldErrors };
  }

  let target: string;
  try {
    const order = await createOrder(parsed.data);
    await notifyOrderCreated(order);
    if (order.paymentMethod === "CINETPAY") {
      try {
        target = await startOnlinePayment(order);
      } catch (e) {
        console.error("[checkout] init paiement", e);
        // La commande existe : le client peut réessayer depuis la page de paiement.
        target = `/commande/${order.number}?t=${orderToken(order.number)}&erreur=paiement`;
      }
    } else {
      target = `/commande/${order.number}?t=${orderToken(order.number)}`;
    }
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    console.error("[checkout]", e);
    return { error: "Une erreur est survenue. Réessayez ou contactez-nous sur WhatsApp." };
  }
  redirect(target);
}
