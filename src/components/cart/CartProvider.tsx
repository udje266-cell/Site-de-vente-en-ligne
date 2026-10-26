"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** Les informations d'affichage sont indicatives : le serveur recalcule tout (voir /api/cart/quote). */
export type CartLine = {
  variantId: string;
  quantity: number;
  productName: string;
  variantLabel: string;
  slug: string;
  image?: string;
  price: number;
};

type CartCtx = {
  lines: CartLine[];
  ready: boolean;
  count: number;
  add: (line: CartLine) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantId: string) => void;
  /** Remet un article retiré à sa place (annulation du retrait). */
  restore: (line: CartLine, index: number) => void;
  /** Change le format d'une ligne (fusionne avec la ligne existante du même format). */
  changeVariant: (fromVariantId: string, to: Omit<CartLine, "quantity">) => void;
  clear: () => void;
  replace: (lines: CartLine[]) => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "cart:v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* stockage indisponible */
    }
    setReady(true);
    // Panier partagé entre onglets : un ajout dans un onglet apparaît dans les autres
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        setLines(e.newValue ? (JSON.parse(e.newValue) as CartLine[]) : []);
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* ignore */
    }
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const i = prev.findIndex((l) => l.variantId === line.variantId);
      if (i === -1) return [...prev, line];
      const next = [...prev];
      next[i] = { ...next[i]!, quantity: Math.min(99, next[i]!.quantity + line.quantity) };
      return next;
    });
  }, []);
  const setQuantity = useCallback(
    (variantId: string, quantity: number) =>
      setLines((prev) => prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.max(1, Math.min(99, quantity)) } : l))),
    [],
  );
  const remove = useCallback((variantId: string) => setLines((prev) => prev.filter((l) => l.variantId !== variantId)), []);
  const restore = useCallback(
    (line: CartLine, index: number) =>
      setLines((prev) => {
        if (prev.some((l) => l.variantId === line.variantId)) return prev;
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, line);
        return next;
      }),
    [],
  );
  const changeVariant = useCallback(
    (fromVariantId: string, to: Omit<CartLine, "quantity">) =>
      setLines((prev) => {
        const from = prev.find((l) => l.variantId === fromVariantId);
        if (!from || fromVariantId === to.variantId) return prev;
        const existing = prev.find((l) => l.variantId === to.variantId);
        if (existing) {
          return prev
            .filter((l) => l.variantId !== fromVariantId)
            .map((l) => (l.variantId === to.variantId ? { ...l, quantity: Math.min(99, l.quantity + from.quantity) } : l));
        }
        return prev.map((l) => (l.variantId === fromVariantId ? { ...to, quantity: from.quantity } : l));
      }),
    [],
  );
  const clear = useCallback(() => setLines([]), []);
  const replace = useCallback((l: CartLine[]) => setLines(l), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((s, l) => s + l.quantity, 0), add, setQuantity, remove, restore, changeVariant, clear, replace }),
    [lines, ready, add, setQuantity, remove, restore, changeVariant, clear, replace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart hors CartProvider");
  return c;
}
