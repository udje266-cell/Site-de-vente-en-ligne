import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { savePromo } from "../crud-actions";

const d = (x: Date | null | undefined) => (x ? x.toISOString().slice(0, 10) : "");

export default async function Promos() {
  const promos = await prisma.promoCode.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Codes promo</h1>
      {[null, ...promos].map((p) => (
        <details key={p?.id ?? "new"} className="card p-3" open={!p}>
          <summary className="min-h-11 cursor-pointer py-2 font-medium">
            {p ? `${p.code} – ${p.type === "PERCENT" ? `${p.value} %` : `${p.value} FCFA`} – utilisé ${p.usedCount}${p.maxUses ? `/${p.maxUses}` : ""} fois${p.isActive ? "" : " (inactif)"}` : "+ Nouveau code"}
          </summary>
          <ActionForm action={savePromo} submitLabel="Enregistrer" className="mt-2 grid grid-cols-2 gap-2">
            {p ? <input type="hidden" name="id" value={p.id} /> : null}
            <div><label className="label" htmlFor={`c-${p?.id}`}>Code</label><input id={`c-${p?.id}`} name="code" defaultValue={p?.code} required className="input uppercase" /></div>
            <div>
              <label className="label" htmlFor={`t-${p?.id}`}>Type</label>
              <select id={`t-${p?.id}`} name="type" defaultValue={p?.type ?? "PERCENT"} className="input"><option value="PERCENT">Pourcentage</option><option value="FIXED">Montant fixe</option></select>
            </div>
            <div><label className="label" htmlFor={`v-${p?.id}`}>Valeur</label><input id={`v-${p?.id}`} name="value" type="number" min={1} defaultValue={p?.value} required className="input" /></div>
            <div><label className="label" htmlFor={`m-${p?.id}`}>Montant minimum</label><input id={`m-${p?.id}`} name="minSubtotal" type="number" min={0} defaultValue={p?.minSubtotal ?? ""} className="input" /></div>
            <div><label className="label" htmlFor={`u-${p?.id}`}>Utilisations max</label><input id={`u-${p?.id}`} name="maxUses" type="number" min={0} defaultValue={p?.maxUses ?? ""} className="input" /></div>
            <div />
            <div><label className="label" htmlFor={`s-${p?.id}`}>Début</label><input id={`s-${p?.id}`} name="startsAt" type="date" defaultValue={d(p?.startsAt)} className="input" /></div>
            <div><label className="label" htmlFor={`e-${p?.id}`}>Fin</label><input id={`e-${p?.id}`} name="endsAt" type="date" defaultValue={d(p?.endsAt)} className="input" /></div>
            <label className="col-span-2 flex min-h-11 items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={p?.isActive ?? true} className="h-5 w-5" /> Actif</label>
          </ActionForm>
        </details>
      ))}
    </div>
  );
}
