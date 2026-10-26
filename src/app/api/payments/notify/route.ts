import { NextResponse } from "next/server";
import { verifyPayment } from "@/lib/payments/process";

/**
 * URL de notification (webhook) CinetPay.
 * Le contenu reçu n'est utilisé QUE pour connaître l'identifiant de transaction :
 * le statut réel est obtenu en rappelant l'API de vérification (verifyPayment), de façon idempotente.
 */
export async function POST(req: Request) {
  let txId: string | null = null;
  const type = req.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const body = (await req.json()) as Record<string, unknown>;
      txId = String(body.cpm_trans_id ?? body.transaction_id ?? "");
    } else {
      const form = await req.formData();
      txId = String(form.get("cpm_trans_id") ?? form.get("transaction_id") ?? "");
    }
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  if (!txId || txId.length > 80) return NextResponse.json({ ok: false }, { status: 400 });
  try {
    const res = await verifyPayment(txId, "notify");
    if (!res) return NextResponse.json({ ok: false }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[notify]", e);
    // 500 : CinetPay renverra la notification plus tard
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}

/** CinetPay peut tester l'accessibilité de l'URL en GET. */
export async function GET() {
  return NextResponse.json({ ok: true });
}
