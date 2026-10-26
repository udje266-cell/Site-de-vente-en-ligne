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
  const clear = useCallback(() => setLines([]), []);
  const replace = useCallback((l: CartLine[]) => setLines(l), []);

  const value = useMemo(
    () => ({ lines, ready, count: lines.reduce((s, l) => s + l.quantity, 0), add, setQuantity, remove, clear, replace }),
    [lines, ready, add, setQuantity, remove, clear, replace],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart hors CartProvider");
  return c;
}
