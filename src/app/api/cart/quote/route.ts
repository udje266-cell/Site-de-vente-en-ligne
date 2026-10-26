import { NextResponse } from "next/server";
import { quoteCart, quoteSchema } from "@/lib/orders/quote";

export async function POST(req: Request) {
  const parsed = quoteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  return NextResponse.json(await quoteCart(parsed.data));
}
