-- Clé anti-doublon des commandes (double clic, nouvel essai après coupure réseau)
ALTER TABLE "Order" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "Order_idempotencyKey_key" ON "Order"("idempotencyKey");
