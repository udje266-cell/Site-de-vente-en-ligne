-- Prisma stocke les dates en UTC : la conversion en timestamptz doit les lire en UTC.
SET TIME ZONE 'UTC';

-- DropIndex
DROP INDEX "Order_status_idx";

-- AlterTable
ALTER TABLE "AdminUser" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Order" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "OrderEvent" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Page" ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Payment" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "PromoCode" ALTER COLUMN "startsAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "endsAt" SET DATA TYPE TIMESTAMPTZ(3),
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ(3);

-- AlterTable
ALTER TABLE "RateLimit" ALTER COLUMN "resetAt" SET DATA TYPE TIMESTAMPTZ(3);

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_deliveryZoneId_idx" ON "Order"("deliveryZoneId");

-- CreateIndex
CREATE INDEX "Order_promoCodeId_idx" ON "Order"("promoCodeId");

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

-- Contraintes CHECK : dernière barrière en base (le code valide déjà ces règles).
-- Le stock ne peut jamais devenir négatif, même en cas de bug applicatif.
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_stock_check" CHECK ("stock" >= 0);
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_price_check" CHECK ("price" >= 0 AND ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0));
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_quantity_check" CHECK ("quantity" > 0 AND "unitPrice" >= 0);
ALTER TABLE "Order" ADD CONSTRAINT "Order_amounts_check" CHECK (
  "subtotal" >= 0 AND "discount" >= 0 AND "shippingFee" >= 0 AND "total" = "subtotal" - "discount" + "shippingFee"
);
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_amount_check" CHECK ("amount" >= 0);
ALTER TABLE "DeliveryZone" ADD CONSTRAINT "DeliveryZone_fee_check" CHECK ("fee" >= 0);
ALTER TABLE "PromoCode" ADD CONSTRAINT "PromoCode_value_check" CHECK (
  "value" > 0 AND ("type" <> 'PERCENT' OR "value" <= 100) AND "usedCount" >= 0
  AND ("startsAt" IS NULL OR "endsAt" IS NULL OR "startsAt" <= "endsAt")
);

-- Row Level Security sans aucune politique : refuse tout accès aux rôles autres que
-- le propriétaire des tables. Sur Supabase, le schéma public est exposé via l'API de
-- données (rôles anon/authenticated) : sans cela, commandes et téléphones clients
-- seraient lisibles avec la clé publique. L'application (Prisma) se connecte avec le
-- rôle propriétaire et n'est pas concernée (RLS non forcée).
ALTER TABLE "Category" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductImage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ProductVariant" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Payment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DeliveryZone" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromoCode" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Page" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Setting" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AdminUser" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RateLimit" ENABLE ROW LEVEL SECURITY;
-- Table interne de Prisma (absente de la base fantôme utilisée par migrate dev)
DO $$
BEGIN
  IF to_regclass('public._prisma_migrations') IS NOT NULL THEN
    ALTER TABLE "_prisma_migrations" ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
