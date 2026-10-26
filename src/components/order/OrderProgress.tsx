import type { OrderStatus } from "@prisma/client";

/** Étapes réellement gérées par la machine d'état (src/lib/orders/state.ts). */
const steps = [
  { label: "Reçue", statuses: ["PENDING_PAYMENT", "COD_PENDING", "PAID"] },
  { label: "Confirmée", statuses: ["CONFIRMED"] },
  { label: "En préparation", statuses: ["PREPARED"] },
  { label: "En livraison", statuses: ["SHIPPED"] },
  { label: "Livrée", statuses: ["DELIVERED"] },
] as const satisfies readonly { label: string; statuses: readonly OrderStatus[] }[];

export function OrderProgress({ status, pickup }: { status: OrderStatus; pickup: boolean }) {
  if (status === "CANCELLED" || status === "REFUNDED") {
    return (
      <p className="rounded-md border-2 border-red-300 bg-red-50 p-3 font-bold text-red-900">
        Commande {status === "CANCELLED" ? "annulée" : "remboursée"}.
      </p>
    );
  }
  const current = steps.findIndex((s) => (s.statuses as readonly OrderStatus[]).includes(status));
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Progression de la commande">
      {steps.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const label = pickup && s.label === "En livraison" ? "Prête au retrait" : pickup && s.label === "Livrée" ? "Retirée" : s.label;
        return (
          <li key={s.label} className="min-w-0 text-center" aria-current={active ? "step" : undefined}>
            <span
              className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-bold ${
                done ? "border-nere bg-nere text-white" : active ? "border-brand bg-accent text-ink" : "border-stone-300 bg-white text-stone-600"
              }`}
              aria-hidden="true"
            >
              {done ? "✓" : i + 1}
            </span>
            <span className={`mt-1 block break-words text-xs leading-tight ${active ? "font-bold" : "text-stone-700"}`}>
              {label}
              <span className="sr-only">{done ? " (terminé)" : active ? " (étape actuelle)" : " (à venir)"}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}
