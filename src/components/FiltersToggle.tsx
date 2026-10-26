"use client";

import { useId, useState } from "react";

/** Filtres repliés sur mobile (bouton « Filtrer et trier »), toujours visibles sur tablette et ordinateur. */
export function FiltersToggle({ active, children }: { active: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(active);
  const id = useId();
  return (
    <div className="card mb-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((o) => !o)}
        className="flex min-h-12 w-full items-center justify-between px-3 font-bold sm:hidden"
      >
        Filtrer et trier{active ? " (filtres actifs)" : ""}
        <span aria-hidden="true" className={`transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      <div id={id} className={`${open ? "block" : "hidden"} sm:block`}>
        {children}
      </div>
    </div>
  );
}
