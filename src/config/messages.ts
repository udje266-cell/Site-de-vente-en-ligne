import type { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

/** Textes affichés, centralisés pour être facilement modifiables. */
export const statusLabels: Record<OrderStatus, string> = {
  PENDING_PAYMENT: "En attente de paiement",
  PAID: "Payée",
  COD_PENDING: "À confirmer (paiement à la livraison)",
  CONFIRMED: "Confirmée",
  PREPARED: "Préparée",
  SHIPPED: "En cours de livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
  REFUNDED: "Remboursée",
};

export const paymentStatusLabels: Record<PaymentStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Accepté",
  REFUSED: "Refusé",
  CANCELLED: "Annulé",
  REFUNDED: "Remboursé",
};

export const paymentMethodLabels: Record<PaymentMethod, string> = {
  CINETPAY: "Mobile Money / carte (CinetPay)",
  COD: "Paiement à la livraison",
};

export const t = {
  addToCart: "Ajouter au panier",
  orderViaWhatsapp: "Commander via WhatsApp",
  cart: "Panier",
  emptyCart: "Votre panier est vide.",
  checkout: "Passer la commande",
  search: "Rechercher un produit",
  outOfStock: "Rupture de stock",
  inStock: (n: number) => (n <= 5 ? `Plus que ${n} en stock` : "En stock"),
  newArrivals: "Nouveautés",
  bestSellers: "Meilleures ventes",
  promotions: "Promotions",
  contactWhatsapp: "Écrire sur WhatsApp",
  errorTitle: "Oups, une erreur est survenue",
  errorBody: "Réessayez dans un instant ou contactez-nous sur WhatsApp.",
};
