import type { OrderStatus } from "@prisma/client";
import { notFound } from "next/navigation";
import { WhatsAppIcon } from "@/components/WhatsAppButton";
import { OrderTimeline } from "@/components/order/OrderSummary";
import { paymentMethodLabels, paymentStatusLabels, statusLabels } from "@/config/messages";
import { prisma } from "@/lib/db";
import { formatDate, formatPhone, formatPrice } from "@/lib/format";
import { allowedTransitions, nextStatus } from "@/lib/orders/state";
import { waLink } from "@/lib/whatsapp";
import { StatusButtons } from "./StatusButtons";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true, events: { orderBy: { createdAt: "asc" } }, deliveryZone: true, promoCode: true, payments: true },
  });
  if (!order) notFound();
  const allowed: OrderStatus[] = allowedTransitions(order.status, { paid: order.paymentStatus === "ACCEPTED" }).filter((s) => s !== "PAID");
  const next = nextStatus(order.status);
  const nextOk = next && allowed.includes(next) ? next : null;
  const waText = `Bonjour ${order.customerName}, c'est au sujet de votre commande ${order.number}.`;
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold">{order.number}</h1>
          <p className="text-sm text-stone-600">{formatDate(order.createdAt)}</p>
        </div>
        <p className="rounded bg-stone-200 px-2 py-1 text-sm font-semibold" data-testid="admin-status">{statusLabels[order.status]}</p>
      </div>
      <StatusButtons orderId={order.id} next={nextOk} others={allowed.filter((s) => s !== nextOk)} />
      <section className="card space-y-1 p-4 text-sm">
        <p className="text-base font-semibold">{order.customerName}</p>
        <p><a href={`tel:${order.customerPhone}`} className="underline">{formatPhone(order.customerPhone)}</a></p>
        {order.customerEmail ? <p>{order.customerEmail}</p> : null}
        <p>{order.pickup ? "Retrait sur place" : `${order.deliveryZone?.name ?? "?"} – ${order.deliveryAddress}`}</p>
        {order.deliveryNote ? <p className="italic">« {order.deliveryNote} »</p> : null}
        <a href={waLink(order.customerPhone, waText)} target="_blank" rel="noopener noreferrer" className="btn-wa mt-2 w-full">
          <WhatsAppIcon /> Contacter sur WhatsApp
        </a>
      </section>
      <section className="card p-4 text-sm">
        <ul className="space-y-1">
          {order.items.map((i) => (
            <li key={i.id} className="flex justify-between gap-2">
              <span>{i.productName} – {i.variantLabel} × {i.quantity}</span>
              <span>{formatPrice(i.unitPrice * i.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t pt-2">
          <div className="flex justify-between"><dt>Sous-total</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          {order.discount ? <div className="flex justify-between"><dt>Remise {order.promoCode ? `(${order.promoCode.code})` : ""}</dt><dd>−{formatPrice(order.discount)}</dd></div> : null}
          <div className="flex justify-between"><dt>Livraison</dt><dd>{formatPrice(order.shippingFee)}</dd></div>
          <div className="flex justify-between font-bold"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
        <p className="mt-2">{paymentMethodLabels[order.paymentMethod]} – paiement : {paymentStatusLabels[order.paymentStatus]}</p>
        {order.payments.map((p) => (
          <p key={p.id} className="text-xs text-stone-600">Transaction {p.transactionId} : {paymentStatusLabels[p.status]}</p>
        ))}
      </section>
      <OrderTimeline events={order.events} />
    </div>
  );
}
