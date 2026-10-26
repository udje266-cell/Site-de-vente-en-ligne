/**
 * Configuration unique de la boutique.
 * Les valeurs marquées PLACEHOLDER sont à remplacer (nom, logo, couleurs, WhatsApp).
 * Les réglages modifiables depuis l'admin (WhatsApp, e-mail, paiement à la livraison…)
 * sont stockés en base (table Setting) ; les valeurs ci-dessous servent de valeurs par défaut.
 */
export const shopConfig = {
  name: "Noh's Shop",
  tagline: "Alimentaire et divers",
  logo: "/embleme.png", // emblème seul ; logo complet : /logo.webp
  logoFull: "/logo.webp",
  colors: {
    // Couleurs du logo (aussi définies dans src/app/globals.css)
    primary: "#014322",
    accent: "#e59900",
  },
  whatsapp: "+2250101114070", // format +225XXXXXXXXXX
  email: "contact@example.com", // PLACEHOLDER
  city: "Abidjan",
  country: "CI",
  currency: "XOF",
  locale: "fr-FR",
  timeZone: "Africa/Abidjan",
  pickup: {
    enabled: true,
    address: "Cocody, Abidjan (adresse exacte communiquée par WhatsApp)", // PLACEHOLDER
  },
  /** Réseaux sociaux : laisser vide ("") pour ne pas afficher le lien. */
  social: {
    facebook: "",
    instagram: "",
    tiktok: "",
  },
  defaults: {
    codEnabled: true,
    codMaxAmount: 100000,
    freeShippingThreshold: 50000,
    lowStockThreshold: 5,
  },
  /** Délai (minutes) avant annulation d'une commande payée en ligne non finalisée */
  paymentTimeoutMinutes: 30,
} as const;
