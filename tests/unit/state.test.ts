import { describe, expect, it } from "vitest";
import { allowedTransitions, canTransition, nextStatus } from "@/lib/orders/state";

describe("machine d'état des commandes", () => {
  it("chemin COD complet", () => {
    const path = ["COD_PENDING", "CONFIRMED", "PREPARED", "SHIPPED", "DELIVERED"] as const;
    for (let i = 0; i < path.length - 1; i++) expect(canTransition(path[i]!, path[i + 1]!, { paid: false })).toBe(true);
  });
  it("paiement en ligne", () => {
    expect(canTransition("PENDING_PAYMENT", "PAID", { paid: false })).toBe(true);
    expect(canTransition("PENDING_PAYMENT", "CONFIRMED", { paid: false })).toBe(false);
    expect(canTransition("PAID", "CONFIRMED", { paid: true })).toBe(true);
  });
  it("une commande payée se rembourse, ne s'annule pas", () => {
    expect(canTransition("CONFIRMED", "CANCELLED", { paid: true })).toBe(false);
    expect(canTransition("CONFIRMED", "REFUNDED", { paid: true })).toBe(true);
    expect(canTransition("CONFIRMED", "REFUNDED", { paid: false })).toBe(false);
    expect(canTransition("DELIVERED", "REFUNDED", { paid: false })).toBe(true);
  });
  it("les états finaux sont bloqués", () => {
    expect(allowedTransitions("CANCELLED", { paid: false })).toEqual([]);
    expect(allowedTransitions("REFUNDED", { paid: true })).toEqual([]);
  });
  it("interdit les retours en arrière", () => {
    expect(canTransition("SHIPPED", "PREPARED", { paid: false })).toBe(false);
    expect(canTransition("DELIVERED", "SHIPPED", { paid: false })).toBe(false);
  });
  it("étape suivante en un geste", () => {
    expect(nextStatus("COD_PENDING")).toBe("CONFIRMED");
    expect(nextStatus("SHIPPED")).toBe("DELIVERED");
    expect(nextStatus("PENDING_PAYMENT")).toBeNull();
    expect(nextStatus("DELIVERED")).toBeNull();
  });
});
