"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";

type Suggestion = { name: string; slug: string };

export function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [active, setActive] = useState(-1);
  const listId = useId();

  useEffect(() => {
    if (q.trim().length < 2) {
      setItems([]);
      return;
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/search/suggest?q=${encodeURIComponent(q)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { items: Suggestion[] }) => {
          setItems(d.items);
          setActive(-1);
        })
        .catch(() => {});
    }, 200);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [q]);

  return (
    <form
      role="search"
      action="/recherche"
      className="relative w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const sel = items[active];
        setItems([]);
        router.push(sel ? `/produits/${sel.slug}` : `/recherche?q=${encodeURIComponent(q)}`);
      }}
    >
      <label htmlFor="search-input" className="sr-only">
        Rechercher un produit
      </label>
      <input
        id="search-input"
        name="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, items.length - 1));
          else if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, -1));
          else if (e.key === "Escape") setItems([]);
        }}
        onBlur={() => setTimeout(() => setItems([]), 150)}
        placeholder="Karité, miel, mil…"
        autoComplete="off"
        role="combobox"
        aria-expanded={items.length > 0}
        aria-controls={listId}
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        className="min-h-11 w-full rounded-lg border-0 bg-white px-3 py-2 text-base text-stone-900 focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {items.length > 0 ? (
        <ul id={listId} role="listbox" className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-900 shadow-lg">
          {items.map((s, i) => (
            <li
              key={s.slug}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              className={`cursor-pointer px-3 py-3 ${i === active ? "bg-stone-100" : ""}`}
              onMouseDown={(e) => {
                e.preventDefault();
                setItems([]);
                router.push(`/produits/${s.slug}`);
              }}
            >
              {s.name}
            </li>
          ))}
        </ul>
      ) : null}
    </form>
  );
}
