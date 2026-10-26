import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPayment } from "@/lib/payments/process";

/** Statut d'un paiement pour la page de retour. Déclenche une vérification serveur (idempotente). */
export async function GET(req: Request) {
  const tx = z.string().min(1).max(80).safeParse(new URL(req.url).searchParams.get("tx"));
  if (!tx.success) return NextResponse.json({ status: "UNKNOWN" }, { status: 400 });
  const payment = await prisma.payment.findUnique({ where: { transactionId: tx.data } });
  if (!payment) return NextResponse.json({ status: "UNKNOWN" }, { status: 404 });
  if (payment.status === "PENDING") await verifyPayment(tx.data, "return").catch((e) => console.error("[status]", e));
  const fresh = await prisma.payment.findUnique({ where: { id: payment.id }, select: { status: true } });
  return NextResponse.json({ status: fresh?.status ?? "PENDING" }, { headers: { "Cache-Control": "no-store" } });
}
