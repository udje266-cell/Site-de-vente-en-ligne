import { prisma } from "@/lib/db";

export async function resetDb() {
  await prisma.$executeRawUnsafe(
    `TRUNCATE "OrderEvent","OrderItem","Payment","Order","ProductVariant","ProductImage","Product","Category","DeliveryZone","PromoCode","Setting","OrderSequence","RateLimit" CASCADE`,
  );
}

export async function fixture(stock = 5, price = 2500) {
  const product = await prisma.product.create({
    data: { slug: `p-${Math.random().toString(36).slice(2)}`, name: "Miel test", variants: { create: { sku: `SKU-${Math.random()}`, label: "500 g", price, stock } } },
    include: { variants: true },
  });
  const zone = await prisma.deliveryZone.create({ data: { name: `Zone ${Math.random()}`, fee: 1500, etaLabel: "24 h" } });
  return { variant: product.variants[0]!, zone };
}

export const customer = { customerName: "Awa Koné", customerPhone: "+2250700000000", deliveryDistrict: "Angré", deliveryLandmark: "près de la pharmacie", pickup: false };
