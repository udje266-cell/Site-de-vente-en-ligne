-- CreateEnum
CREATE TYPE "ProductUsage" AS ENUM ('ALIMENTAIRE', 'COSMETIQUE', 'ALIMENTAIRE_ET_COSMETIQUE');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "ingredients" TEXT,
ADD COLUMN     "origin" TEXT,
ADD COLUMN     "storage" TEXT,
ADD COLUMN     "usage" "ProductUsage";

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "netWeight" TEXT;

-- Produits de démonstration : retrait des descriptions écrites pendant le développement
-- (elles contenaient des affirmations non confirmées, ex. usage « en cuisine » du karité).
-- Seules les descriptions restées identiques au texte d'origine sont effacées.
UPDATE "Product" SET "description" = '' WHERE ("slug", "description") IN (
  ('beurre-de-karite-brut', E'Beurre de karité **100 % naturel**, extrait artisanalement dans le nord de la Côte d''Ivoire.\n\nIdéal pour la peau, les cheveux et la cuisine.'),
  ('beurre-de-karite-parfume', 'Karité fouetté, parfumé aux huiles essentielles.'),
  ('savon-au-karite', 'Savon artisanal saponifié à froid, enrichi en karité.'),
  ('baume-karite-levres', 'Petit pot de baume nourrissant.'),
  ('miel-de-foret', 'Miel sauvage récolté en forêt, goût intense.'),
  ('miel-d-acacia', 'Miel doux et clair.'),
  ('miel-en-rayon', 'Rayon de cire garni de miel, à déguster tel quel.'),
  ('miel-au-gingembre', 'Miel infusé au gingembre frais.'),
  ('poudre-de-mais', 'Farine de maïs moulue finement, pour bouillies et pâtes.'),
  ('grains-de-mil', 'Mil décortiqué et trié.'),
  ('farine-de-mil', 'Farine de mil pour bouillie (koko).'),
  ('mais-en-grains', 'Maïs jaune séché.')
);

-- Savon et baume de démonstration : usage cosmétique (jamais présentés comme comestibles).
UPDATE "Product" SET "usage" = 'COSMETIQUE' WHERE "slug" IN ('savon-au-karite', 'baume-karite-levres') AND "usage" IS NULL;
