import type { Metadata } from "next";
import { getSettings } from "@/lib/settings";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Suivre ma commande", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function TrackingPage({ searchParams }: { searchParams: Promise<{ numero?: string }> }) {
  const { numero = "" } = await searchParams;
  const settings = await getSettings();
  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-3xl">Suivre ma commande</h1>
      <p className="text-stone-700">Saisissez la référence affichée à la fin de votre commande (elle commence par CMD-) et le téléphone utilisé.</p>
      <TrackForm initialNumero={numero.slice(0, 30)} whatsapp={settings.whatsapp} shopName={settings.shopName} />
    </div>
  );
}
