import { formatPrice } from "@/lib/format";

/** Construit un lien wa.me pré-rempli. */
export function waLink(phone: string, text?: string): string {
  const num = phone.replace(/\D/g, "");
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Message WhatsApp de commande : produit, format, quantité, prix et lien vers la fiche. */
export function buildOrderMessage(o: { shopName: string; productName: string; format: string; quantity: number; unitPrice: number; url: string }) {
  return [
    `Bonjour ${o.shopName}, je souhaite commander :`,
    `- Produit : ${o.productName}`,
    `- Format : ${o.format}`,
    `- Quantité : ${o.quantity}`,
    `- Prix : ${formatPrice(o.unitPrice)} l'unité, soit ${formatPrice(o.unitPrice * o.quantity)}`,
    `Lien : ${o.url}`,
  ].join("\n");
}
