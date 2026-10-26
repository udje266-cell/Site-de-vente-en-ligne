import type { DeliveryZone, Order, OrderEvent, OrderItem } from "@prisma/client";
import { paymentMethodLabels, statusLabels } from "@/config/messages";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { OrderProgress } from "./OrderProgress";

type Full = Order & { items: OrderItem[]; events: OrderEvent[]; deliveryZone: DeliveryZone | null };

/** Masque un numéro : « +225 07 •• •• •3 04 » (suivi public : pas de données personnelles inutiles). */
export function maskPhone(phone: string) {
  const f = formatPhone(phone);
  return f.replace(/(\+225 \d{2}) \d{2} \d{2} \d(\d) (\d{2})$/, "$1 •• •• •$2 $3");
}

/**
 * Récapitulatif d'une commande.
 * privacy="minimal" (suivi public) : prénom, téléphone masqué et commune seulement, sans adresse ni note.
 */
export function OrderSummary({ order, privacy = "full" }: { order: Full; privacy?: "full" | "minimal" }) {
  const minimal = privacy === "minimal";
  return (
    <div className="space-y-4">
      <div className="card space-y-4 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-sm text-stone-700">Référence de commande</p>
            <p className="display text-2xl" data-testid="order-number">{order.number}</p>
          </div>
          <p className="text-sm text-stone-700">{formatDate(order.createdAt)}</p>
        </div>
        <OrderProgress status={order.status} pickup={order.pickup} />
        <p>
          Statut : <strong data-testid="order-status">{statusLabels[order.status]}</strong>
          <span className="block text-sm text-stone-700">{paymentMethodLabels[order.paymentMethod]}</span>
        </p>
      </div>
      <div className="card p-4">
        <h2 className="mb-2 text-xl">Articles</h2>
        <ul className="space-y-1 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span className="min-w-0 break-words">{i.productName}, {i.variantLabel} × {i.quantity}</span>
              <span className="tabular-nums">{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-stone-200 pt-2 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd className="tabular-nums">{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 ? <div className="flex justify-between"><dt>Remise</dt><dd className="tabular-nums">−{formatPrice(order.discount)}</dd></div> : null}
          <div className="flex justify-between">
            <dt>Livraison</dt>
            <dd className="tabular-nums">{order.pickup ? "Retrait, sans frais" : order.shippingFee ? formatPrice(order.shippingFee) : "Offerte"}</dd>
          </div>
          <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{formatPrice(order.total)}</dd></div>
        </dl>
      </div>
      <div className="card p-4 text-sm">
        <h2 className="mb-2 text-xl">{order.pickup ? "Retrait" : "Livraison"}</h2>
        {minimal ? (
          <>
            {/* Suivi public : prénom et téléphone déjà réduits côté serveur (voir publicOrderView) */}
            <p>{order.customerName}, {order.customerPhone}</p>
            <p>{order.pickup ? "Retrait sur place" : order.deliveryZone?.name ?? "Livraison"}</p>
          </>
        ) : (
          <>
            <p><strong>{order.customerName}</strong>, {formatPhone(order.customerPhone)}</p>
            <p className="whitespace-pre-line">{order.pickup ? "Retrait sur place" : `${order.deliveryZone?.name ?? ""}\n${order.deliveryAddress}`}</p>
            {order.deliveryNote ? <p className="mt-1 italic">Note : {order.deliveryNote}</p> : null}
          </>
        )}
      </div>
      <OrderTimeline events={order.events} />
    </div>
  );
}

/** Historique public : uniquement les changements de statut (les notes internes ne sont pas affichées). */
export function OrderTimeline({ events, internal = false }: { events: OrderEvent[]; internal?: boolean }) {
  const shown = internal ? events : events.filter((e) => e.toStatus);
  return (
    <div className="card p-4">
      <h2 className="mb-2 text-xl">Historique</h2>
      <ol className="space-y-2 border-l-2 border-brand/30 pl-4 text-sm">
        {shown.map((e) => (
          <li key={e.id}>
            <p className="font-bold">{e.toStatus ? statusLabels[e.toStatus] : e.message}</p>
            <p className="text-stone-700">
              {formatDate(e.createdAt)}
              {e.message && (internal || e.type === "ADMIN_STATUS") ? ` : ${e.message}` : ""}
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const orderInclude = {
  items: true,
  events: { orderBy: { createdAt: "asc" } },
  deliveryZone: true,
} as const;

type FullOrder = Full;

/**
 * Vue publique d'une commande pour le suivi : seules les données utiles quittent le serveur
 * (prénom, téléphone masqué, commune ; ni adresse, ni note, ni e-mail, ni notes internes).
 */
export function publicOrderView(o: FullOrder): FullOrder {
  return {
    ...o,
    customerName: o.customerName.trim().split(/\s+/)[0] ?? "",
    customerPhone: maskPhone(o.customerPhone),
    customerEmail: null,
    deliveryAddress: "",
    deliveryNote: null,
    idempotencyKey: null,
    promoCodeId: null,
    events: o.events
      .filter((e) => e.toStatus)
      .map((e) => ({ ...e, message: e.type === "ADMIN_STATUS" ? e.message : null })),
  };
}
