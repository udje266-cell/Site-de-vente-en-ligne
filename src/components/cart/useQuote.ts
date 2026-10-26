"use client";

import { useEffect, useState } from "react";
import type { Quote } from "@/lib/orders/quote";
import type { CartLine } from "./CartProvider";

export function useQuote(lines: CartLine[], opts: { deliveryZoneId?: string; pickup?: boolean; promoCode?: string }, enabled = true) {
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const key = JSON.stringify([lines.map((l) => [l.variantId, l.quantity]), opts]);

  useEffect(() => {
    if (!enabled) return;
    if (lines.length === 0) {
      setQuote(null);
      return;
    }
    const ctrl = new AbortController();
    setLoading(true);
    fetch("/api/cart/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })), ...opts }),
      signal: ctrl.signal,
    })
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((q: Quote) => {
        setQuote(q);
        setError(false);
      })
      .catch((e: unknown) => {
        if ((e as Error)?.name !== "AbortError") setError(true);
      })
      .finally(() => setLoading(false));
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);

  return { quote, loading, error };
}
