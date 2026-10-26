import Link from "next/link";
import type { SortKey } from "@/lib/catalog";
import { FiltersToggle } from "./FiltersToggle";

/** Formulaire GET sans JavaScript : tri, prix min/max, attributs. */
export function CatalogFilters({
  action,
  attributes,
  current,
  hidden = {},
}: {
  action: string;
  attributes: Record<string, string[]>;
  current: { sort: SortKey; min?: number; max?: number; attrs: Record<string, string> };
  hidden?: Record<string, string>;
}) {
  return (
    <FiltersToggle active={hasActiveFilters(current)}>
    <form action={action} method="get" className="grid grid-cols-2 gap-3 p-3 sm:grid-cols-4">
      {Object.entries(hidden).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <div className="col-span-2 sm:col-span-1">
        <label htmlFor="f-sort" className="label">Trier par</label>
        <select id="f-sort" name="tri" defaultValue={current.sort} className="input">
          <option value="nouveautes">Nouveautés</option>
          <option value="prix-asc">Prix croissant</option>
          <option value="prix-desc">Prix décroissant</option>
        </select>
      </div>
      <div>
        <label htmlFor="f-min" className="label">Prix min</label>
        <input id="f-min" name="min" type="number" min={0} inputMode="numeric" defaultValue={current.min} className="input" />
      </div>
      <div>
        <label htmlFor="f-max" className="label">Prix max</label>
        <input id="f-max" name="max" type="number" min={0} inputMode="numeric" defaultValue={current.max} className="input" />
      </div>
      {Object.entries(attributes).map(([k, values]) => (
        <div key={k}>
          <label htmlFor={`f-a-${k}`} className="label">{k}</label>
          <select id={`f-a-${k}`} name={`a.${k}`} defaultValue={current.attrs[k] ?? ""} className="input">
            <option value="">Tous</option>
            {values.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      ))}
      <div className="col-span-2 flex flex-col justify-end gap-2 sm:col-span-1">
        <button type="submit" className="btn-primary w-full">Appliquer</button>
        {hasActiveFilters(current) ? (
          <Link href={resetHref(action, hidden)} className="btn-outline w-full">Réinitialiser les filtres</Link>
        ) : null}
      </div>
    </form>
    </FiltersToggle>
  );
}

type SP = Record<string, string | string[] | undefined>;

export function parseFilters(sp: SP) {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const num = (v: string | undefined) => (v && /^\d+$/.test(v) ? Number(v) : undefined);
  const sortRaw = one(sp.tri);
  const sort: SortKey = sortRaw === "prix-asc" || sortRaw === "prix-desc" ? sortRaw : "nouveautes";
  const attrs: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    const val = one(v);
    if (k.startsWith("a.") && val) attrs[k.slice(2)] = val;
  }
  return { sort, min: num(one(sp.min)), max: num(one(sp.max)), attrs };
}

export function hasActiveFilters(f: { sort: SortKey; min?: number; max?: number; attrs: Record<string, string> }) {
  return f.sort !== "nouveautes" || f.min != null || f.max != null || Object.keys(f.attrs).length > 0;
}

/** URL sans filtres (conserve uniquement la recherche éventuelle). */
export function resetHref(action: string, hidden: Record<string, string> = {}) {
  const qs = new URLSearchParams(Object.entries(hidden).filter(([, v]) => v)).toString();
  return qs ? `${action}?${qs}` : action;
}
