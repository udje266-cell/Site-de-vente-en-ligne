import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/format";
import Link from "next/link";
import { saveZone } from "../crud-actions";

export default async function Zones() {
  const [zones, settings] = await Promise.all([prisma.deliveryZone.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }), getSettings()]);
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Zones de livraison</h1>
      <p className="text-sm">Livraison gratuite dès {formatPrice(settings.freeShippingThreshold)} (<Link href="/admin/reglages" className="underline">modifier</Link>).</p>
      {[...zones, null].map((z) => (
        <details key={z?.id ?? "new"} className="card p-3" open={!z}>
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            {z ? `${z.name} – ${formatPrice(z.fee)} – ${z.etaLabel}${z.isActive ? "" : " (inactive)"}` : "+ Nouvelle zone"}
          </summary>
          <ActionForm action={saveZone} submitLabel="Enregistrer" className="mt-2 grid grid-cols-2 gap-2">
            {z ? <input type="hidden" name="id" value={z.id} /> : null}
            <div className="col-span-2"><label className="label" htmlFor={`n-${z?.id}`}>Nom</label><input id={`n-${z?.id}`} name="name" defaultValue={z?.name} required className="input" /></div>
            <div><label className="label" htmlFor={`f-${z?.id}`}>Tarif (FCFA)</label><input id={`f-${z?.id}`} name="fee" type="number" inputMode="numeric" min={0} defaultValue={z?.fee} required className="input" /></div>
            <div><label className="label" htmlFor={`e-${z?.id}`}>Délai</label><input id={`e-${z?.id}`} name="etaLabel" defaultValue={z?.etaLabel ?? "24 à 48 h"} required className="input" /></div>
            <div><label className="label" htmlFor={`p-${z?.id}`}>Ordre</label><input id={`p-${z?.id}`} name="position" type="number" defaultValue={z?.position ?? zones.length} className="input" /></div>
            <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={z?.isActive ?? true} className="h-5 w-5" /> Active</label>
          </ActionForm>
        </details>
      ))}
    </div>
  );
}
