/**
 * Contenu par défaut des pages d'information (Livraison, Contact, À propos, Retours, CGV,
 * Confidentialité, Mentions légales).
 *
 * Règle : uniquement des informations confirmées ou le fonctionnement réel du site.
 * Aucune adresse, aucun horaire, aucune condition commerciale inventés. Ce qui manque est listé
 * dans docs/pages-a-completer.md.
 *
 * Les jetons {{…}} sont remplacés à l'affichage par les valeurs à jour (Réglages, zones de
 * livraison, numéro WhatsApp) : voir src/lib/page-content.ts. La vendeuse peut modifier ces textes
 * dans Admin → Pages ; ce contenu par défaut n'est utilisé que tant que la page contient le texte
 * modèle d'origine.
 */
export const defaultPages: Record<string, { title: string; body: string }> = {
  livraison: {
    title: "Livraison",
    body: `# Livraison

{{boutique}} livre à Abidjan et à l'intérieur de la Côte d'Ivoire.

## Zones, tarifs et délais

{{zones_livraison}}

Les délais sont donnés à titre indicatif. Les frais de livraison de votre zone s'affichent dans le récapitulatif, avant que vous confirmiez votre commande.

{{livraison_gratuite}}

## Votre adresse

Pas besoin d'adresse postale : indiquez votre quartier et un point de repère (pharmacie, école, carrefour…). Le numéro de téléphone demandé lors de la commande sert à vous joindre pour la livraison.

{{retrait_sur_place}}

## Suivre votre commande

Votre numéro de commande (par exemple CMD-2026-000123) s'affiche à la fin de la commande. Avec ce numéro et votre téléphone, suivez l'avancement de la commande sur la page [Suivre ma commande](/suivi).

## Une question sur la livraison ?

Écrivez-nous sur [WhatsApp]({{lien_whatsapp}}) ou appelez le [{{telephone}}]({{lien_telephone}}).
`,
  },

  contact: {
    title: "Contact",
    body: `# Contact

**{{boutique}}**, alimentaire et divers, {{ville}}, Côte d'Ivoire.

- **Téléphone :** [{{telephone}}]({{lien_telephone}})
- **WhatsApp :** [écrire au {{telephone}}]({{lien_whatsapp}})

Pour une commande en cours, indiquez votre numéro de commande (il commence par CMD-) : nous retrouverons votre commande plus vite.

Vous pouvez aussi suivre votre commande vous-même sur la page [Suivre ma commande](/suivi).
`,
  },

  "a-propos": {
    title: "À propos",
    body: `# À propos de {{boutique}}

{{boutique}} est une boutique en ligne basée à {{ville}} : alimentaire et divers.

Vous y trouvez notre miel de Korhogo, 100 % naturel, ainsi que du beurre de karité, du maïs et du mil.

## Commander

- Sur le site, sans créer de compte : choisissez vos produits, puis indiquez votre nom, votre téléphone et votre zone de livraison.
- Ou directement sur [WhatsApp]({{lien_whatsapp}}), au {{telephone}}.

{{moyens_paiement}}
`,
  },

  retours: {
    title: "Retours et réclamations",
    body: `# Retours et réclamations

## Un problème avec votre commande ?

Produit manquant, abîmé ou différent de ce que vous avez commandé : contactez-nous dès que possible sur [WhatsApp]({{lien_whatsapp}}) ou au [{{telephone}}]({{lien_telephone}}).

Pour que nous puissions vous répondre rapidement, indiquez :

- votre numéro de commande (il commence par CMD-) ;
- le produit concerné ;
- si possible, une photo du produit reçu.

## Modifier ou annuler une commande

Avant la livraison, contactez-nous au plus vite sur [WhatsApp]({{lien_whatsapp}}) en indiquant votre numéro de commande.
`,
  },

  cgv: {
    title: "Conditions générales de vente",
    body: `# Conditions générales de vente

Ces conditions décrivent le fonctionnement des commandes passées sur ce site auprès de {{boutique}}, {{ville}}, Côte d'Ivoire.

## 1. Commande

- La commande se passe sans créer de compte.
- Vous indiquez votre nom, votre téléphone (obligatoire), votre e-mail (facultatif), votre zone de livraison et une adresse descriptive (quartier et point de repère).
- Avant de confirmer, un récapitulatif affiche les produits, les quantités, les frais de livraison et le total à payer.
- Une fois la commande confirmée, un numéro de commande (CMD-…) s'affiche. Il permet de suivre la commande sur la page [Suivre ma commande](/suivi).

## 2. Prix

- Les prix sont indiqués en francs CFA (FCFA), pour chaque format de produit.
- Le prix appliqué est celui affiché au moment de la commande.
- Les frais de livraison dépendent de la zone choisie (voir la page [Livraison](/infos/livraison)). Ils sont ajoutés au total et affichés avant la confirmation.
- Un seul code promo peut être utilisé par commande, dans les conditions propres à chaque code (dates de validité, montant minimum, nombre d'utilisations).

## 3. Disponibilité

Les produits sont proposés dans la limite des stocks affichés sur le site. Un produit en rupture de stock ne peut pas être commandé.

## 4. Paiement

{{moyens_paiement}}

{{plafond_paiement_livraison}}

## 5. Livraison

Les zones, tarifs et délais indicatifs sont présentés sur la page [Livraison](/infos/livraison).

## 6. Réclamations

Voir la page [Retours et réclamations](/infos/retours).

## 7. Données personnelles

Voir la [politique de confidentialité](/infos/confidentialite).

## 8. Contact

{{boutique}}, {{ville}}. Téléphone et WhatsApp : [{{telephone}}]({{lien_telephone}}).
`,
  },

  confidentialite: {
    title: "Politique de confidentialité",
    body: `# Politique de confidentialité

Cette page explique quelles informations le site {{boutique}} enregistre et pourquoi.

## Informations demandées lors d'une commande

- nom et prénom ;
- numéro de téléphone ;
- adresse e-mail (facultative) ;
- zone de livraison, quartier et point de repère ;
- note éventuelle que vous ajoutez à la commande.

Ces informations servent à traiter votre commande, à vous livrer et à vous contacter au sujet de cette commande. Elles permettent aussi le suivi de commande (numéro de commande et téléphone).

## Paiement

Le site n'enregistre aucune donnée de carte bancaire ni de compte Mobile Money.

## Cookies et stockage dans le navigateur

- Votre panier est enregistré dans votre navigateur, sur votre appareil, pour que vous le retrouviez à votre prochaine visite.
- Le site n'utilise ni publicité ni outil de mesure d'audience.

## Hébergement

Le site est hébergé par Vercel et les données sont stockées dans une base de données gérée par Neon.

## Vos droits

Vous pouvez demander à consulter, corriger ou supprimer vos informations en nous contactant sur [WhatsApp]({{lien_whatsapp}}) ou au [{{telephone}}]({{lien_telephone}}).

La protection des données personnelles en Côte d'Ivoire est encadrée par la loi n° 2013-450 du 19 juin 2013.
`,
  },

  "mentions-legales": {
    title: "Mentions légales",
    body: `# Mentions légales

## Éditeur du site

**{{boutique}}**, alimentaire et divers
{{ville}}, Côte d'Ivoire
Téléphone : [{{telephone}}]({{lien_telephone}})

## Hébergement

Site hébergé par Vercel Inc. (États-Unis), [vercel.com](https://vercel.com).
Base de données gérée par Neon, [neon.tech](https://neon.tech).

## Propriété

Le nom {{boutique}}, son logo et les contenus de ce site appartiennent à {{boutique}}. Toute reproduction sans autorisation est interdite.
`,
  },
};

/** Texte modèle créé par le seed : tant qu'une page le contient, le contenu par défaut ci-dessus est affiché. */
export function isTemplateBody(body: string): boolean {
  return /^# [^\n]+\n\n_Texte modèle à compléter depuis l'administration \(Admin → Pages\)\._\s*$/.test(body);
}
