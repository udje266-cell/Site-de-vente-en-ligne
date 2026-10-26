import { createHmac, timingSafeEqual } from "crypto";

/** Jeton d'accès à la page de confirmation (les numéros de commande étant séquentiels, donc devinables). */
export function orderToken(number: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant");
  return createHmac("sha256", secret).update(`order:${number}`).digest("base64url").slice(0, 22);
}

export function verifyOrderToken(number: string, token: string | undefined | null): boolean {
  if (!token) return false;
  const a = Buffer.from(orderToken(number));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
