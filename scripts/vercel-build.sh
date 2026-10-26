#!/bin/sh
# Construction sur Vercel (script « vercel-build », prioritaire sur « build »).
# 1. Migrations avec l'URL DIRECTE (DIRECT_URL) : le pooler ne convient pas aux migrations.
# 2. Seed uniquement si SEED_ON_BUILD=1 (premier déploiement ; à retirer ensuite).
# 3. Build Next.js (DATABASE_URL = URL du pooler).
set -e
direct() {
  if [ -n "$DIRECT_URL" ]; then DATABASE_URL="$DIRECT_URL" "$@"; else "$@"; fi
}
direct npx prisma migrate deploy
if [ "$SEED_ON_BUILD" = "1" ]; then
  direct npx tsx prisma/seed.ts
fi
npx prisma generate
npx next build
