"use client";

import type { OrderStatus } from "@prisma/client";
import { useActionState } from "react";
import { statusLabels } from "@/config/messages";
import { changeStatus } from "../actions";

export function StatusButtons({ orderId, next, others }: { orderId: string; next: OrderStatus | null; others: OrderStatus[] }) {
  const [state, action, pending] = useActionState(changeStatus, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="orderId" value={orderId} />
      {next ? (
        <button name="to" value={next} disabled={pending} className="btn-primary w-full text-lg">
          Passer à : {statusLabels[next]}
        </button>
      ) : null}
      {others.length > 0 ? (
        <details className="card p-3">
          <summary className="min-h-11 cursor-pointer py-2">Autres actions</summary>
          <label htmlFor="message" className="label mt-2">Message au client (facultatif)</label>
          <input id="message" name="message" className="input mb-2" />
          <div className="flex flex-wrap gap-2">
            {others.map((s) => (
              <button
                key={s}
                name="to"
                value={s}
                disabled={pending}
                className={s === "CANCELLED" || s === "REFUNDED" ? "btn border border-red-300 bg-white text-red-800" : "btn-outline"}
                onClick={(e) => {
                  if ((s === "CANCELLED" || s === "REFUNDED") && !confirm(`Confirmer : ${statusLabels[s]} ?`)) e.preventDefault();
                }}
              >
                {statusLabels[s]}
              </button>
            ))}
          </div>
        </details>
      ) : null}
      {state.error ? <p role="alert" className="text-sm text-red-700">{state.error}</p> : null}
      {state.ok ? <p role="status" className="text-sm text-green-800">Statut mis à jour, client notifié.</p> : null}
    </form>
  );
}
