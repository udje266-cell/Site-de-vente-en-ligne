import type { Order, OrderStatus } from "@prisma/client";
import { statusLabels } from "@/config/messages";
import { formatPrice } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { getMailer } from "./mailer";
import { getSmsSender } from "./sms";

const appUrl = () => process.env.APP_URL ?? "http://localhost:3000";

/** N'interrompt jamais le flux métier : les erreurs d'envoi sont journalisées. */
async function safe(label: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.error(`[notify] échec ${label}`, e);
  }
}

type NotifOrder = Pick<Order, "number" | "customerName" | "customerPhone" | "customerEmail" | "total" | "status">;

export async function notifyCustomer(order: NotifOrder, subject: string, text: string) {
  const { shopName } = await getSettings();
  const trackUrl = `${appUrl()}/suivi?numero=${encodeURIComponent(order.number)}`;
  const body = `${text}\nSuivi : ${trackUrl}`;
  await safe("sms client", () => getSmsSender().send(order.customerPhone, `${shopName} : ${body}`));
  if (order.customerEmail) {
    const email = order.customerEmail;
    await safe("mail client", () =>
      getMailer().send({ to: email, subject: `${shopName} – ${subject}`, text: `Bonjour ${order.customerName},\n\n${body}\n\nMerci,\n${shopName}` }),
    );
  }
}

export async function notifyOrderCreated(order: NotifOrder) {
  await notifyCustomer(
    order,
    `Commande ${order.number} reçue`,
    `Votre commande ${order.number} (${formatPrice(order.total)}) est bien enregistrée. Statut : ${statusLabels[order.status]}.`,
  );
  const s = await getSettings();
  const msg = `Nouvelle commande ${order.number} – ${order.customerName} – ${formatPrice(order.total)}. ${appUrl()}/admin/commandes`;
  await safe("mail vendeuse", () => getMailer().send({ to: s.notificationEmail, subject: `Nouvelle commande ${order.number}`, text: msg }));
  await safe("sms vendeuse", () => getSmsSender().send(s.whatsapp, msg));
}

export async function notifyStatusChanged(order: NotifOrder, to: OrderStatus) {
  await notifyCustomer(order, `Commande ${order.number} : ${statusLabels[to]}`, `Votre commande ${order.number} est maintenant : ${statusLabels[to]}.`);
}

export async function notifySeller(subject: string, text: string) {
  const s = await getSettings();
  await safe("mail vendeuse", () => getMailer().send({ to: s.notificationEmail, subject, text }));
}
