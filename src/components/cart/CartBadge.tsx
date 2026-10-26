"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export function CartBadge() {
  const { count } = useCart();
  return (
    <Link href="/panier" className="relative flex h-11 w-11 items-center justify-center rounded-lg hover:bg-white/10" aria-label={`Panier, ${count} article(s)`}>
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6" />
        <circle cx="10" cy="20" r="1.5" />
        <circle cx="17" cy="20" r="1.5" />
      </svg>
      {count > 0 ? (
        <span className="absolute -right-0.5 -top-0.5 min-w-5 rounded-full bg-accent px-1 text-center text-xs font-bold text-stone-900" data-testid="cart-count">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
