import type { DeliveryZone, Order, OrderEvent, OrderItem } from "@prisma/client";
import { paymentMethodLabels, statusLabels } from "@/config/messages";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";

type Full = Order & { items: OrderItem[]; events: OrderEvent[]; deliveryZone: DeliveryZone | null };

export function OrderSummary({ order }: { order: Full }) {
  return (
    <div className="space-y-4">
      <div className="card p-4">
        <p className="text-sm text-stone-600">Commande</p>
        <p className="text-xl font-bold" data-testid="order-number">{order.number}</p>
        <p className="mt-1">
          Statut : <strong data-testid="order-status">{statusLabels[order.status]}</strong>
        </p>
        <p className="text-sm text-stone-600">{paymentMethodLabels[order.paymentMethod]}</p>
      </div>
      <div className="card p-4">
        <ul className="space-y-1 text-sm">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>{i.productName} – {i.variantLabel} × {i.quantity}</span>
              <span>{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-stone-200 pt-2 text-sm">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount > 0 ? <div className="flex justify-between"><dt>Remise</dt><dd>−{formatPrice(order.discount)}</dd></div> : null}
          <div className="flex justify-between"><dt>Livraison</dt><dd>{order.shippingFee ? formatPrice(order.shippingFee) : "Offerte"}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </div>
      <div className="card p-4 text-sm">
        <p><strong>{order.customerName}</strong> – {formatPhone(order.customerPhone)}</p>
        <p>{order.pickup ? "Retrait sur place" : `${order.deliveryZone?.name ?? ""} – ${order.deliveryAddress}`}</p>
      </div>
      <OrderTimeline events={order.events} />
    </div>
  );
}

export function OrderTimeline({ events }: { events: OrderEvent[] }) {
  return (
    <div className="card p-4">
      <h2 className="mb-2 font-semibold">Historique</h2>
      <ol className="space-y-2 border-l-2 border-brand/30 pl-4 text-sm">
        {events.map((e) => (
          <li key={e.id}>
            <p className="font-medium">{e.toStatus ? statusLabels[e.toStatus] : e.message}</p>
            <p className="text-stone-600">{formatDate(e.createdAt)}{e.toStatus && e.message ? ` – ${e.message}` : ""}</p>
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
