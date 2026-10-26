"use client";

import { useActionState } from "react";
import { OrderSummary } from "@/components/order/OrderSummary";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { waLink } from "@/lib/whatsapp";
import { trackOrder, type TrackState } from "./actions";

export function TrackForm({ initialNumero, whatsapp, shopName }: { initialNumero: string; whatsapp: string; shopName: string }) {
  const [state, action, pending] = useActionState<TrackState, FormData>(trackOrder, {});
  const numero = state.numero ?? initialNumero;
  return (
    <>
      <form action={action} className="card space-y-3 p-4">
        <div>
          <label htmlFor="numero" className="label">Référence de commande</label>
          <input id="numero" name="numero" defaultValue={numero} required placeholder="CMD-2026-000123…" autoComplete="off" spellCheck={false} className="input uppercase" />
        </div>
        <div>
          <label htmlFor="tel" className="label">Téléphone utilisé pour la commande</label>
          <input id="tel" name="tel" type="tel" required inputMode="tel" autoComplete="tel" placeholder="07 00 00 00 00…" className="input" />
        </div>
        <button disabled={pending} className="btn-primary w-full">{pending ? "Recherche…" : "Voir le suivi"}</button>
      </form>
      <div aria-live="polite">
        {state.error ? <p role="alert" className="card border-red-300 bg-red-50 p-3 text-red-900">{state.error}</p> : null}
        {state.order ? (
          <div className="space-y-4">
            <OrderSummary order={state.order} privacy="minimal" />
            <a
              href={waLink(whatsapp, `Bonjour ${shopName}, je vous contacte au sujet de ma commande ${state.order.number}.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-wa w-full"
            >
              <WhatsAppIcon /> Une question sur cette commande ? WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </>
  );
}
