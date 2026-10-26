import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";

/**
 * Estimation de livraison affichée avant l'ajout au panier, calculée à partir des zones
 * actives et des réglages (mêmes données que le calcul de la commande).
 */
export async function getDeliveryEstimate() {
  const [zones, settings] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ fee: "asc" }, { position: "asc" }] }),
    getSettings(),
  ]);
  const lines: string[] = [];
  if (zones.length) {
    const cheapest = zones[0]!;
    const maxFee = Math.max(...zones.map((z) => z.fee));
    lines.push(
      cheapest.fee === maxFee
        ? `Livraison : ${formatPrice(cheapest.fee)}, délai indicatif ${cheapest.etaLabel}.`
        : `Livraison de ${formatPrice(cheapest.fee)} à ${formatPrice(maxFee)} selon votre commune (délai indicatif dès ${cheapest.etaLabel}).`,
    );
  }
  if (settings.freeShippingThreshold > 0) lines.push(`Offerte dès ${formatPrice(settings.freeShippingThreshold)} d'achats.`);
  if (settings.pickupEnabled) lines.push("Retrait sur place possible, sans frais de livraison.");
  return lines.join(" ");
}
