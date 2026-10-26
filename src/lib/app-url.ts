/**
 * URL publique du site (sans / final).
 * APP_URL si défini, sinon le domaine de production fourni par Vercel, sinon localhost.
 */
export function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
