import { NextResponse } from "next/server";
import { z } from "zod";
import { suggestProducts } from "@/lib/catalog";

export async function GET(req: Request) {
  const parsed = z.string().max(50).safeParse(new URL(req.url).searchParams.get("q") ?? "");
  if (!parsed.success) return NextResponse.json({ items: [] });
  const items = await suggestProducts(parsed.data);
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, max-age=60" } });
}
