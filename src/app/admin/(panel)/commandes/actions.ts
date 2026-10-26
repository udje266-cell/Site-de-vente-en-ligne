"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { OrderError } from "@/lib/orders/errors";
import { transitionOrder } from "@/lib/orders/transition";

const schema = z.object({
  orderId: z.string().min(1).max(50),
  // PAID n'est jamais posé à la main : uniquement via la vérification du paiement
  to: z.enum(["CONFIRMED", "PREPARED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"]),
  message: z.string().trim().max(300).optional(),
});

export async function changeStatus(_prev: { error?: string }, formData: FormData): Promise<{ error?: string; ok?: boolean }> {
  await requireAdmin();
  const parsed = schema.safeParse({ orderId: formData.get("orderId"), to: formData.get("to"), message: formData.get("message") || undefined });
  if (!parsed.success) return { error: "Requête invalide." };
  try {
    // Envoie automatiquement la notification au client (SMS + e-mail)
    await transitionOrder(parsed.data.orderId, parsed.data.to, { message: parsed.data.message, type: "ADMIN_STATUS" });
  } catch (e) {
    if (e instanceof OrderError) return { error: e.message };
    throw e;
  }
  revalidatePath(`/admin/commandes/${parsed.data.orderId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}
