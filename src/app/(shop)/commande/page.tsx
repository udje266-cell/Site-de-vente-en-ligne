import type { Metadata } from "next";
import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { CheckoutForm } from "./CheckoutForm";

export const metadata: Metadata = { title: "Commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const [zones, settings] = await Promise.all([
    prisma.deliveryZone.findMany({ where: { isActive: true }, orderBy: [{ position: "asc" }, { name: "asc" }] }),
    getSettings(),
  ]);
  return (
    <CheckoutForm
      zones={zones.map((z) => ({ id: z.id, name: z.name, fee: z.fee, etaLabel: z.etaLabel }))}
      pickupEnabled={settings.pickupEnabled}
      pickupAddress={shopConfig.pickup.address}
      codEnabled={settings.codEnabled}
    />
  );
}
