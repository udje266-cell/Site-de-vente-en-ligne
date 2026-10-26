# Boutique en ligne – vendeuse unique (Abidjan)

Site e-commerce mobile-first en français : catalogue, recherche, panier, commande sans compte, paiement Mobile Money / carte via **CinetPay** ou **à la livraison**, suivi de commande, et administration utilisable depuis un téléphone.

Stack : Next.js 15 (App Router) · TypeScript strict · Tailwind CSS 4 · PostgreSQL + Prisma · Auth.js · Zod · Vitest · Playwright.

Voir aussi : [`docs/decisions.md`](docs/decisions.md) (choix techniques) et [`docs/guide-admin.md`](docs/guide-admin.md) (guide de la vendeuse).

## Installation (développement)

Prérequis : Node.js 22, Docker (ou un PostgreSQL 14+ local).

```bash
cp .env.example .env            # puis renseigner NEXTAUTH_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d db         # PostgreSQL sur localhost:5432
npm install
npx prisma migrate deploy       # crée les tables
npm run db:seed                 # catégories, 12 produits, zones, BIENVENUE10, pages, compte admin
npm run dev                     # http://localhost:3000  –  admin : /admin
```

En développement, `PAYMENT_PROVIDER=fake` remplace CinetPay par un écran de paiement simulé.

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm run dev` | Serveur de développement |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Tests unitaires et d'intégration (Vitest, base `shop_test`) |
| `npm run test:e2e` | Parcours Playwright (base `shop_e2e`, paiement fake) |
| `npm run db:seed` | Données de départ (sans écraser l'existant) |

Les tests utilisent `TEST_DATABASE_URL` (par défaut `postgresql://shop:shop@localhost:5432/shop_test`) et `E2E_DATABASE_URL` (`…/shop_e2e`). Créez ces bases une fois : `createdb -U shop shop_test && createdb -U shop shop_e2e`. **Leur contenu est effacé à chaque lancement.**

## Configuration de la boutique

- `src/config/shop.ts` : nom, slogan, logo, couleurs, WhatsApp, réseaux sociaux, adresse de retrait, valeurs par défaut des réglages. **Les valeurs `PLACEHOLDER` sont à remplacer.**
- `src/app/globals.css` (bloc `@theme`) : couleurs utilisées par l'interface.
- `public/logo.svg` : logo.
- `src/config/messages.ts` : libellés des statuts et textes principaux.
- Depuis l'admin (Réglages) : nom affiché, WhatsApp, e-mail de notification, paiement à la livraison et son plafond, seuil de livraison gratuite, retrait sur place.

## Variables d'environnement

Toutes sont documentées dans [`.env.example`](.env.example). En production, au minimum : `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `APP_URL`, `PAYMENT_PROVIDER=cinetpay`, `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CRON_SECRET`, `MAIL_PROVIDER`/`RESEND_API_KEY`/`MAIL_FROM`, `IMAGE_STORAGE=cloudinary` + clés Cloudinary.

## Déploiement

### Vercel + Neon (ou Supabase)
1. Créer une base PostgreSQL (Neon ou Supabase) et récupérer l'URL de connexion.
2. Importer le dépôt dans Vercel et renseigner les variables d'environnement.
3. Variables : `DATABASE_URL` = URL du **pooler** (`?pgbouncer=true&connection_limit=1`), et lancez les migrations avec l'URL **directe** : `DATABASE_URL=<url directe> npx prisma migrate deploy` (depuis votre poste ou une étape de build dédiée).
   Sur Supabase, la migration `db_hardening` active la Row Level Security sur toutes les tables : l'API de données publique (clé `anon`) ne voit rien, seule l'application y accède. **Toute nouvelle table doit aussi recevoir `ENABLE ROW LEVEL SECURITY`.**
4. Lancer le seed une fois depuis votre poste : `DATABASE_URL=… ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run db:seed`.
5. `vercel.json` déclare une tâche planifiée toutes les 10 min sur `/api/cron/expire-orders`. Vercel envoie automatiquement `Authorization: Bearer $CRON_SECRET`.
6. Images : `IMAGE_STORAGE=cloudinary` (le disque Vercel n'est pas persistant).

### VPS avec Docker
```bash
docker compose --profile app up -d --build
docker compose exec app npx tsx prisma/seed.ts     # une fois
```
Ajouter une crontab pour l'expiration des paiements :
```
*/5 * * * * curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://votre-domaine/api/cron/expire-orders
```
Mettre un reverse proxy HTTPS (Caddy, Nginx + Let's Encrypt) devant le port 3000.

## Configuration CinetPay

> ⚠️ Avant la mise en production, vérifiez `src/lib/payments/cinetpay.ts` contre la documentation officielle (docs.cinetpay.com). Elle n'était pas accessible au moment du développement : voir `docs/decisions.md`.

1. Dans le back-office CinetPay, récupérez l'**API Key**, le **Site ID** et la **Secret Key**.
2. Renseignez `CINETPAY_API_KEY`, `CINETPAY_SITE_ID`, `CINETPAY_SECRET_KEY` et `PAYMENT_PROVIDER=cinetpay`.
3. L'URL de notification envoyée à CinetPay est `APP_URL/api/payments/notify`, et l'URL de retour `APP_URL/commande/<numéro>/paiement`. `APP_URL` doit être l'URL publique en HTTPS.
4. Faites un paiement réel d'un petit montant et vérifiez que la commande passe en « Payée ». Le journal des appels est dans `Payment.rawPayload`.

Fonctionnement : à la commande, le serveur initialise le paiement et redirige le client. Quand CinetPay notifie, le serveur **revérifie** la transaction via l'API, contrôle le montant et met à jour la commande. Ce traitement est idempotent. La page de retour ne fait qu'afficher l'état. Sans paiement sous 30 minutes, la commande est annulée et le stock libéré.

## Ajouter un produit

Depuis un téléphone : **Admin → + Ajouter un produit**. Photo, nom, prix, stock, puis « Créer ». Les autres formats (variantes) s'ajoutent sur la page du produit. Détails dans [`docs/guide-admin.md`](docs/guide-admin.md).

## Architecture

```
src/
  app/(shop)/        pages publiques (accueil, catégories, produit, panier, commande, suivi, pages)
  app/admin/         administration (protégée par Auth.js + requireAdmin())
  app/api/           webhook paiement, statut, devis panier, suggestions, cron, auth
  config/            shop.ts (config boutique), messages.ts (textes)
  lib/orders/        state.ts (machine d'état), pricing.ts, create.ts (transaction + verrous), transition.ts
  lib/payments/      PaymentProvider : cinetpay.ts, fake.ts, process.ts (vérification, expiration)
  lib/notify/        Mailer, SmsSender, notifications
  lib/storage/       ImageStorage (local / Cloudinary) + compression sharp
prisma/              schéma, migrations, seed
tests/unit           Vitest (logique + intégration base de données)
tests/e2e            Playwright
```
