"use server";

import { prisma } from "@/lib/db";
import { createOrderOnce } from "@/lib/orders/create";
import { OrderError } from "@/lib/orders/errors";
import { checkoutSchema } from "@/lib/orders/schema";
import { orderToken } from "@/lib/orders/token";
import { notifyOrderCreated } from "@/lib/notify";
import { onlinePaymentAvailable } from "@/lib/payments";
import { expireStalePayments, startOnlinePayment } from "@/lib/payments/process";

export type CheckoutResult = { ok: true; redirectTo: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

/**
 * Enregistre la commande. Tous les montants sont recalculés côté serveur (createOrder) ;
 * seuls les identifiants de formats et les quantités du navigateur sont utilisés.
 * Renvoie l'adresse de la page suivante au lieu de rediriger : le navigateur ne vide le panier
 * qu'une fois la commande confirmée, et peut réessayer sans risque grâce à la clé anti-doublon.
 */
export async function placeOrder(formData: FormData): Promise<CheckoutResult> {
  let items: unknown;
  try {
    items = JSON.parse(String(formData.get("items") ?? "[]"));
  } catch {
    return { ok: false, error: "Panier invalide. Actualisez la page puis réessayez." };
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
    deliveryDistrict: str("deliveryDistrict") ?? "",
    deliveryLandmark: str("deliveryLandmark") ?? "",
    deliveryNote: str("deliveryNote"),
    promoCode: str("promoCode") || undefined,
    paymentMethod: str("paymentMethod"),
    idempotencyKey: str("idempotencyKey") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = String(issue.path[0] ?? "form");
      fieldErrors[k] ??= issue.message;
    }
    return { ok: false, error: "Merci de corriger les champs indiqués.", fieldErrors };
  }
  if (parsed.data.paymentMethod === "CINETPAY" && !onlinePaymentAvailable()) {
    return { ok: false, error: "Le paiement en ligne n'est pas encore disponible. Choisissez le paiement à la livraison.", fieldErrors: { paymentMethod: "Moyen de paiement indisponible." } };
  }
  // Libère le stock des paiements abandonnés avant de vérifier la disponibilité
  await expireStalePayments().catch((e) => console.error("[checkout] expiration", e));

  try {
    const { order, duplicate } = await createOrderOnce(parsed.data);
    if (!duplicate) await notifyOrderCreated(order);
    const confirmation = `/commande/${order.number}?t=${orderToken(order.number)}`;
    if (order.paymentMethod !== "CINETPAY" || order.status !== "PENDING_PAYMENT") return { ok: true, redirectTo: confirmation };
    // Paiement en ligne : réutilise le lien de paiement d'un essai précédent s'il existe encore
    if (duplicate) {
      const pending = await prisma.payment.findFirst({ where: { orderId: order.id, status: "PENDING", paymentUrl: { not: null } }, orderBy: { createdAt: "desc" } });
      if (pending?.paymentUrl) return { ok: true, redirectTo: pending.paymentUrl };
    }
    try {
      return { ok: true, redirectTo: await startOnlinePayment(order) };
    } catch (e) {
      console.error("[checkout] init paiement", e);
      // La commande existe : le client peut réessayer le paiement depuis la page de confirmation
      return { ok: true, redirectTo: `${confirmation}&erreur=paiement` };
    }
  } catch (e) {
    if (e instanceof OrderError) return { ok: false, error: e.message };
    console.error("[checkout]", e);
    return { ok: false, error: "La commande n'a pas pu être enregistrée. Votre panier est conservé : réessayez dans un instant ou contactez-nous sur WhatsApp." };
  }
}
