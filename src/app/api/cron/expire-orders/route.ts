import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { expireStalePayments } from "@/lib/payments/process";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

/** À appeler toutes les 5 minutes (Vercel Cron ou crontab) avec `Authorization: Bearer $CRON_SECRET`. */
async function handler(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const cancelled = await expireStalePayments();
  return NextResponse.json({ cancelled });
}

export { handler as GET, handler as POST };
