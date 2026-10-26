/**
 * Configuration unique de la boutique.
 * Les valeurs marquées PLACEHOLDER sont à remplacer (nom, logo, couleurs, WhatsApp).
 * Les réglages modifiables depuis l'admin (WhatsApp, e-mail, paiement à la livraison…)
 * sont stockés en base (table Setting) ; les valeurs ci-dessous servent de valeurs par défaut.
 */
export const shopConfig = {
  name: "Saveurs d'Abidjan", // PLACEHOLDER
  tagline: "Karité, miel, maïs et mil, du terroir à votre porte", // PLACEHOLDER
  logo: "/logo.svg", // PLACEHOLDER : remplacer public/logo.svg
  colors: {
    // PLACEHOLDER : couleurs principales (aussi définies dans src/app/globals.css)
    primary: "#1e2b4a",
    accent: "#f2a900",
  },
  whatsapp: "+2250700000000", // PLACEHOLDER (format +225XXXXXXXXXX)
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
  social: {
    facebook: "https://facebook.com/", // PLACEHOLDER
    instagram: "https://instagram.com/", // PLACEHOLDER
    tiktok: "https://tiktok.com/", // PLACEHOLDER
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
