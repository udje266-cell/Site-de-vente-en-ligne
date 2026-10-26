# Décisions techniques

Choix faits faute de précision dans la spec (§11 : « fais le choix le plus simple et note-le »).

## Produits et contenus
- **Type de produits** : alimentation (beurre de karité, miel, poudre de maïs, grains de mil). Le seed crée 3 catégories : *Beurre de karité*, *Miel*, *Céréales & farines*, et 12 produits avec des variantes de poids/contenance.
- **Nom et logo** : Noh's Shop, « Alimentaire et divers ». Logo complet `public/logo.webp`, emblème seul `public/embleme.png`, icônes `src/app/icon.png` / `apple-icon.png`, image de partage `src/app/opengraph-image.jpg`. Couleurs du logo dans `src/app/globals.css` (bloc `@theme`). **WhatsApp** : +225 01 01 11 40 70. **Réseaux sociaux** : aucun pour l'instant (liens vides dans `src/config/shop.ts`, la section « Suivez-nous » réapparaît dès qu'un lien est renseigné). Le nom affiché et le WhatsApp sont aussi modifiables depuis Admin → Réglages (ces valeurs priment).
- **Photos de démo** : visuels générés (`prisma/demo-images.mjs`) dans `public/demo/`.

## Stack
- Next.js 15 (App Router), React 19, Prisma 6, Auth.js **v4** (`next-auth@4`, version stable ; la v5 est encore en bêta), Tailwind CSS 4, Zod 3.
- Pas de shadcn/ui : quelques classes utilitaires (`btn-primary`, `input`…) suffisent et limitent le JS client.
- **Recherche** : plein texte PostgreSQL (`to_tsvector('french')`) + extension `unaccent` (« karite » trouve « karité »). Disponible sur Neon et Supabase.
- **Filtres catalogue** : faits en mémoire après chargement de la catégorie (catalogue de petite taille). À passer en SQL si le catalogue dépasse quelques centaines de produits.

## Panier et commandes
- **Panier** : `localStorage` + synchronisation serveur (`POST /api/cart/quote`) qui renvoie prix, stock et totaux recalculés. Le navigateur n'envoie que des identifiants de variantes et des quantités.
- **Stock** : décrémenté dans la transaction de création de commande, avec `SELECT … FOR UPDATE` sur les variantes, pour COD comme pour le paiement en ligne. Pour le paiement en ligne, c'est la « réservation ». Le champ `Order.stockHeld` garantit une seule réintégration lors d'une annulation ou d'un remboursement.
- **Code promo** : verrouillé et compté dans la même transaction. Son utilisation est rendue si la commande est **annulée** (pas si elle est remboursée).
- **Numéro de commande** : `CMD-AAAA-NNNNNN`, compteur atomique par année (table `OrderSequence`).
- **Machine d'état** (`src/lib/orders/state.ts`) : une commande encaissée ne peut pas être « annulée », elle doit être « remboursée ». Une commande COD livrée peut être remboursée. `PAID` n'est jamais posé à la main, uniquement par la vérification du paiement.
- **Livraison gratuite** : seuil comparé au sous-total **après** remise.
- **Page de confirmation** : protégée par un jeton HMAC dans l'URL, car les numéros de commande sont séquentiels et donc devinables. Le suivi public demande numéro + téléphone, avec une limite de tentatives.

## Paiement CinetPay
- **⚠️ La documentation officielle (docs.cinetpay.com) n'était pas accessible depuis l'environnement de développement** (domaine bloqué par le proxy réseau). L'implémentation (`src/lib/payments/cinetpay.ts`) suit l'API Checkout v2 telle que décrite par des SDK publics : `POST /v2/payment` (réponse `code: "201"`, `data.payment_url`) et `POST /v2/payment/check` (`code: "00"` + `data.status: "ACCEPTED"`). **À vérifier contre la doc avant la mise en production** : URL, champs, codes, montant multiple de 5, champs client obligatoires. L'URL de base est surchargeable via `CINETPAY_BASE_URL`.
- Le webhook n'utilise que l'identifiant de transaction reçu, puis **rappelle toujours** l'API de vérification. Le contrôle HMAC de l'en-tête `x-token` n'est donc pas indispensable à la sécurité ; il pourra être ajouté avec `CINETPAY_SECRET_KEY` une fois le format confirmé par la doc.
- **Paiement refusé ou annulé** : la commande est annulée tout de suite et le stock libéré. Le client peut recommander.
- **Paiement accepté après expiration** (commande déjà annulée) : la commande n'est pas réactivée automatiquement. Un événement `PAYMENT_LATE` est créé et la vendeuse est prévenue par e-mail (remboursement ou reconfirmation manuelle).
- **Expiration** : route `/api/cron/expire-orders` (en-tête `Authorization: Bearer $CRON_SECRET`), appelée toutes les 10 min par Vercel Cron (`vercel.json`). Sur un VPS, utiliser une crontab. Avant d'annuler, une dernière vérification est faite auprès du fournisseur, au cas où une notification aurait été perdue.

## Notifications
- E-mail : `console` (logs) ou Resend (API HTTP, sans dépendance). SMTP n'est pas implémenté ; il suffit d'ajouter une classe dans `src/lib/notify/mailer.ts`.
- SMS : abstraction `SmsSender`, implémentation `console` uniquement (fournisseur à choisir).
- Les échecs d'envoi sont journalisés mais ne bloquent jamais une commande.

## Sécurité
- CSRF : les mutations admin passent par des **Server Actions** Next.js, qui vérifient l'en-tête `Origin` par rapport à l'hôte. NextAuth protège ses propres routes avec un jeton CSRF.
- Connexion admin limitée à 5 essais / 15 min par e-mail et 20 par IP (table `RateLimit`, compatible serverless).
- En-têtes de sécurité (CSP, HSTS, X-Frame-Options…) dans `next.config.ts`. La CSP autorise `'unsafe-inline'` pour les scripts (scripts inline de Next.js) : compromis raisonnable sans nonce.
- Uploads : JPEG/PNG/WebP/HEIC/AVIF, 8 Mo max, ré-encodés en WebP (1600 px) par `sharp` ; 6 photos max par produit.

## Images
- `IMAGE_STORAGE=local` (dossier `public/uploads`, pour le dev ou un VPS avec volume) ou `cloudinary`. Sur Vercel, le disque n'est pas persistant : **utiliser Cloudinary**.

## Tests
- `prisma migrate reset` est bloqué lorsqu'il est lancé par un agent IA : les tests utilisent `migrate deploy` puis `TRUNCATE`.

## Base de données (revue « Supabase Postgres best practices »)
- Dates en `timestamptz` ; index sur toutes les clés étrangères ; index composite `Order(status, createdAt)` pour la liste admin et l'expiration des paiements.
- Contraintes `CHECK` en base : stock ≥ 0 (dernière barrière contre la survente), montants positifs, `total = sous-total − remise + livraison`, pourcentage ≤ 100.
- RLS activée sans politique sur toutes les tables (refus par défaut pour `anon`/`authenticated` sur Supabase). L'application utilise le rôle propriétaire, non soumis à la RLS.
- Pool de connexions obligatoire en serverless (voir `.env.example`). Les transactions n'incluent aucun appel HTTP (CinetPay est appelé hors transaction) ; les verrous de variantes sont pris dans l'ordre des identifiants (pas d'interblocage).
- Non retenu pour l'instant : clés primaires `bigint identity`/UUIDv7 au lieu de `cuid` (les cuid sont déjà ordonnés dans le temps ; migration coûteuse) ; index GIN pour la recherche (`unaccent` n'est pas IMMUTABLE, il faudrait une fonction enveloppe : inutile tant que le catalogue compte moins de quelques milliers de produits) ; montants en `integer` plutôt que `numeric`, car le FCFA n'a pas de décimales.

## Refonte Noh's Shop (frontend-design, web-design-guidelines, webapp-testing, seo-audit)
- **Photos** : aucune vraie photo produit n'est disponible. Les visuels générés de démonstration ont été retirés (migration `remove_demo_images`) : les cartes affichent un emplacement neutre « Photo à venir » au format carré.
- **Informations produit** : nouveaux champs `usage` (alimentaire / cosmétique / les deux), `ingredients`, `storage`, `origin` et `netWeight` (par format). Vides = non confirmés : la fiche n'affiche rien d'inventé et l'usage reste « À préciser par la boutique ». Seuls le savon et le baume de démonstration sont marqués « cosmétique ».
- **Descriptions de démonstration** : retirées (elles contenaient des affirmations non confirmées, ex. karité « pour la cuisine »).
- **Promotions** : uniquement les produits dont une variante a un prix barré supérieur au prix ; la carte affiche alors cette variante remisée. Les sections de l'accueil ne répètent jamais un produit. « Meilleures ventes » devient « Nos incontournables » tant qu'il n'y a pas de ventes.
- **WhatsApp** : numéro par défaut unique dans `src/config/shop.ts` (+225 01 01 11 40 70, confirmé par la boutique), modifiable dans Admin → Réglages. Le lien produit du message est construit avec le domaine utilisé par le visiteur.
- **Frise de motifs retirée** : décorative, sans rapport avec les produits.
- **Bouton WhatsApp flottant** masqué sur la fiche produit, le panier et la commande (il masquait des prix ; ces pages ont leur propre bouton).
