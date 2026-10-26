"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyOrderToken } from "@/lib/orders/token";
import { startOnlinePayment } from "@/lib/payments/process";

export async function retryPayment(formData: FormData) {
  const number = String(formData.get("number") ?? "");
  const t = String(formData.get("t") ?? "");
  if (!verifyOrderToken(number, t)) redirect("/");
  const order = await prisma.order.findUnique({ where: { number } });
  if (!order || order.status !== "PENDING_PAYMENT") redirect(`/commande/${number}?t=${t}`);
  redirect(await startOnlinePayment(order));
}
