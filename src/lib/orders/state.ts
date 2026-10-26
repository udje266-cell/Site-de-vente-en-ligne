import type { OrderStatus } from "@prisma/client";

/**
 * Machine d'état unique des commandes.
 * PENDING_PAYMENT -> PAID | CANCELLED
 * COD_PENDING     -> CONFIRMED | CANCELLED
 * PAID            -> CONFIRMED | REFUNDED
 * CONFIRMED       -> PREPARED | CANCELLED* | REFUNDED*
 * PREPARED        -> SHIPPED  | CANCELLED* | REFUNDED*
 * SHIPPED         -> DELIVERED | CANCELLED* | REFUNDED*
 * DELIVERED       -> REFUNDED
 * CANCELLED, REFUNDED : états finaux.
 * (*) Une commande dont l'argent a été encaissé ne peut pas être « annulée » : elle doit être remboursée.
 *     Inversement, on ne rembourse que ce qui a été encaissé (paiement en ligne accepté, ou livraison payée).
 */
const TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  PENDING_PAYMENT: ["PAID", "CANCELLED"],
  COD_PENDING: ["CONFIRMED", "CANCELLED"],
  PAID: ["CONFIRMED", "REFUNDED"],
  CONFIRMED: ["PREPARED", "CANCELLED", "REFUNDED"],
  PREPARED: ["SHIPPED", "CANCELLED", "REFUNDED"],
  SHIPPED: ["DELIVERED", "CANCELLED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export type TransitionContext = {
  /** true si l'argent a été encaissé (paiement en ligne accepté) */
  paid: boolean;
};

export function allowedTransitions(from: OrderStatus, ctx: TransitionContext): OrderStatus[] {
  return TRANSITIONS[from].filter((to) => {
    if (to === "CANCELLED") return !ctx.paid;
    if (to === "REFUNDED") return ctx.paid || from === "DELIVERED";
    return true;
  });
}

export function canTransition(from: OrderStatus, to: OrderStatus, ctx: TransitionContext): boolean {
  return allowedTransitions(from, ctx).includes(to);
}

/** Étape suivante « normale » (bouton en un geste dans l'admin). */
export function nextStatus(from: OrderStatus): OrderStatus | null {
  const forward: Partial<Record<OrderStatus, OrderStatus>> = {
    COD_PENDING: "CONFIRMED",
    PAID: "CONFIRMED",
    CONFIRMED: "PREPARED",
    PREPARED: "SHIPPED",
    SHIPPED: "DELIVERED",
  };
  return forward[from] ?? null;
}

export function isFinal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/** États dans lesquels le stock n'est plus retenu par la commande. */
export function releasesStock(to: OrderStatus): boolean {
  return to === "CANCELLED" || to === "REFUNDED";
}
