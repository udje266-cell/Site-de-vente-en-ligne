import type { ProductUsage } from "@prisma/client";
import { usageLabels } from "@/config/messages";

/** Champs « informations produit » (formulaire admin). Laisser vide ce qui n'est pas confirmé. */
export function ProductInfoFields(props: { usage?: ProductUsage | null; ingredients?: string | null; storage?: string | null; origin?: string | null }) {
  return (
    <fieldset className="space-y-3 rounded-md border border-stone-200 p-3">
      <legend className="px-1 text-sm font-bold">Informations produit (laisser vide si non confirmé)</legend>
      <div>
        <label htmlFor="usage" className="label">Usage</label>
        <select id="usage" name="usage" defaultValue={props.usage ?? ""} className="input">
          <option value="">Non précisé (rien n&apos;est affiché au client)</option>
          {Object.entries(usageLabels).map(([k, v]) => (
            <option key={k} value={k}>{v.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="ingredients" className="label">Ingrédients</label>
        <textarea id="ingredients" name="ingredients" rows={2} defaultValue={props.ingredients ?? ""} className="input" />
      </div>
      <div>
        <label htmlFor="storage" className="label">Conservation</label>
        <textarea id="storage" name="storage" rows={2} defaultValue={props.storage ?? ""} placeholder="Ex. à l'abri de la chaleur et de l'humidité…" className="input" />
      </div>
      <div>
        <label htmlFor="origin" className="label">Origine</label>
        <input id="origin" name="origin" defaultValue={props.origin ?? ""} placeholder="Ex. Korhogo…" className="input" />
      </div>
    </fieldset>
  );
}
