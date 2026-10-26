import { defaultPages, isTemplateBody } from "@/content/pages";
import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";
import { formatPhone, formatPrice } from "@/lib/format";
import { onlinePaymentAvailable } from "@/lib/payments";
import { getSettings } from "@/lib/settings";
import { waLink } from "@/lib/whatsapp";

/** Jetons utilisables dans les pages (Admin → Pages). */
export const pageTokens = [
  ["{{boutique}}", "nom de la boutique"],
  ["{{ville}}", "ville"],
  ["{{telephone}}", "numéro WhatsApp / téléphone"],
  ["{{lien_telephone}}", "lien d'appel"],
  ["{{lien_whatsapp}}", "lien WhatsApp"],
  ["{{zones_livraison}}", "tableau des zones actives"],
  ["{{livraison_gratuite}}", "phrase sur la livraison offerte"],
  ["{{retrait_sur_place}}", "phrase sur le retrait sur place"],
  ["{{moyens_paiement}}", "moyens de paiement disponibles"],
  ["{{plafond_paiement_livraison}}", "plafond du paiement à la livraison"],
] as const;

const escapeCell = (s: string) => s.replace(/\|/g, "\\|");

/**
 * Titre et contenu Markdown d'une page, avec les valeurs à jour (réglages, zones, numéro).
 * Si la page contient encore le texte modèle d'origine, le contenu par défaut est utilisé.
 */
export async function getPageContent(slug: string): Promise<{ title: string; body: string } | null> {
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return null;
  const def = defaultPages[slug];
  const useDefault = isTemplateBody(page.body) && def;
  const title = useDefault ? def.title : page.title;
  const raw = useDefault ? def.body : page.body;
  if (!raw.includes("{{")) return { title, body: raw };

  const settings = await getSettings();
  const zones = raw.includes("{{zones_livraison}}")
    ? await prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ position: "asc" }, { name: "asc" }] })
    : [];
  const online = onlinePaymentAvailable();

  const values: Record<string, string> = {
    "{{boutique}}": settings.shopName,
    "{{ville}}": shopConfig.city,
    "{{telephone}}": formatPhone(settings.whatsapp),
    "{{lien_telephone}}": `tel:${settings.whatsapp}`,
    "{{lien_whatsapp}}": waLink(settings.whatsapp, `Bonjour ${settings.shopName}, `),
    "{{zones_livraison}}": zones.length
      ? ["| Zone | Frais de livraison | Délai indicatif |", "| --- | --- | --- |", ...zones.map((z) => `| ${escapeCell(z.name)} | ${formatPrice(z.fee)} | ${escapeCell(z.etaLabel)} |`)].join("\n")
      : "Contactez-nous sur WhatsApp pour connaître les zones desservies.",
    "{{livraison_gratuite}}":
      settings.freeShippingThreshold > 0 ? `La livraison est offerte dès ${formatPrice(settings.freeShippingThreshold)} d'achats (montant après remise).` : "",
    "{{retrait_sur_place}}": settings.pickupEnabled
      ? "Vous pouvez aussi choisir le retrait sur place au moment de la commande : l'adresse vous est communiquée sur WhatsApp."
      : "",
    "{{moyens_paiement}}": [
      settings.codEnabled ? "Vous payez à la livraison, au moment de recevoir votre commande." : "",
      online ? "Vous pouvez aussi payer en ligne par Mobile Money ou carte bancaire, sur la page sécurisée de CinetPay." : "",
      !settings.codEnabled && !online ? "Contactez-nous sur WhatsApp pour convenir du paiement." : "",
    ]
      .filter(Boolean)
      .join(" "),
    "{{plafond_paiement_livraison}}":
      settings.codEnabled && settings.codMaxAmount > 0
        ? `Le paiement à la livraison est proposé pour les commandes jusqu'à ${formatPrice(settings.codMaxAmount)}.${online ? " Au-delà, seul le paiement en ligne est possible." : ""}`
        : "",
  };
  let body = raw;
  for (const [token, value] of Object.entries(values)) body = body.split(token).join(value);
  // Paragraphes vidés par un jeton sans valeur
  body = body.replace(/\n{3,}/g, "\n\n");
  return { title, body };
}
