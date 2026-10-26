"use server";

import { orderInclude, publicOrderView } from "@/components/order/OrderSummary";
import { prisma } from "@/lib/db";
import { normalizeCiPhone } from "@/lib/format";
import { clientIp, rateLimit } from "@/lib/rate-limit";

export type TrackState = { error?: string; order?: ReturnType<typeof publicOrderView>; numero?: string };

/** Recherche d'une commande par référence + téléphone (POST : le téléphone n'apparaît pas dans l'URL). */
export async function trackOrder(_prev: TrackState, formData: FormData): Promise<TrackState> {
  const numero = String(formData.get("numero") ?? "").trim().toUpperCase().slice(0, 30);
  const tel = String(formData.get("tel") ?? "").slice(0, 30);
  if (!numero || !tel) return { error: "Indiquez la référence et le téléphone.", numero };
  // Limite les essais automatisés : 20 par IP et 8 par référence, sur 15 minutes
  const ip = await clientIp();
  if (!(await rateLimit(`track:${ip}`, 20, 15 * 60)) || !(await rateLimit(`track-num:${numero}`, 8, 15 * 60))) {
    return { error: "Trop de tentatives. Réessayez dans quelques minutes, ou contactez-nous sur WhatsApp.", numero };
  }
  const phone = normalizeCiPhone(tel);
  const found = phone ? await prisma.order.findUnique({ where: { number: numero }, include: orderInclude }) : null;
  if (!found || found.customerPhone !== phone) {
    return { error: "Aucune commande ne correspond à cette référence et ce téléphone. Vérifiez la référence (elle commence par CMD-) et le numéro utilisé lors de la commande.", numero };
  }
  return { order: publicOrderView(found), numero };
}
