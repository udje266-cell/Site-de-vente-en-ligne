import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { slug: "beurre-de-karite", name: "Beurre de karité", position: 0 },
  { slug: "miel", name: "Miel", position: 1 },
  { slug: "cereales-et-farines", name: "Céréales & farines", position: 2 },
];

type V = { label: string; attrs: Record<string, string>; price: number; compareAt?: number; stock: number };
type P = { slug: string; name: string; cat: string; featured?: boolean; usage?: "COSMETIQUE"; variants: V[] };

const w = (label: string, price: number, stock: number, compareAt?: number): V => ({ label, attrs: { Poids: label }, price, stock, compareAt });
const vol = (label: string, price: number, stock: number, compareAt?: number): V => ({ label, attrs: { Contenance: label }, price, stock, compareAt });

const products: P[] = [
  { slug: "beurre-de-karite-brut", name: "Beurre de karité brut", cat: "beurre-de-karite", featured: true,
    variants: [w("250 g", 2500, 40), w("500 g", 4500, 25), w("1 kg", 8000, 10, 9000)] },
  { slug: "beurre-de-karite-parfume", name: "Beurre de karité parfumé", cat: "beurre-de-karite",
    variants: [{ label: "200 g / Vanille", attrs: { Poids: "200 g", Parfum: "Vanille" }, price: 3500, stock: 15 },
      { label: "200 g / Coco", attrs: { Poids: "200 g", Parfum: "Coco" }, price: 3500, stock: 12 }] },
  { slug: "savon-au-karite", name: "Savon au karité", cat: "beurre-de-karite", usage: "COSMETIQUE", variants: [w("1 pain (100 g)", 1000, 60), w("Lot de 5", 4500, 20, 5000)] },
  { slug: "baume-karite-levres", name: "Baume karité pour les lèvres", cat: "beurre-de-karite", usage: "COSMETIQUE", variants: [w("15 g", 1500, 3)] },
  { slug: "miel-de-foret", name: "Miel de forêt", cat: "miel", featured: true, variants: [vol("250 g", 3000, 30), vol("500 g", 5500, 20), vol("1 kg", 10000, 8, 11000)] },
  { slug: "miel-d-acacia", name: "Miel d'acacia", cat: "miel", variants: [vol("500 g", 6000, 18)] },
  { slug: "miel-en-rayon", name: "Miel en rayon", cat: "miel", variants: [vol("300 g", 7000, 4)] },
  { slug: "miel-au-gingembre", name: "Miel au gingembre", cat: "miel", featured: true, variants: [vol("250 g", 3500, 22, 4000)] },
  { slug: "poudre-de-mais", name: "Poudre de maïs", cat: "cereales-et-farines", featured: true, variants: [w("1 kg", 1000, 80), w("5 kg", 4500, 30), w("25 kg", 20000, 6)] },
  { slug: "grains-de-mil", name: "Grains de mil", cat: "cereales-et-farines", variants: [w("1 kg", 1200, 50), w("5 kg", 5500, 15)] },
  { slug: "farine-de-mil", name: "Farine de mil", cat: "cereales-et-farines", variants: [w("1 kg", 1500, 40), w("5 kg", 7000, 2, 7500)] },
  { slug: "mais-en-grains", name: "Maïs en grains", cat: "cereales-et-farines", variants: [w("5 kg", 3500, 25), w("25 kg", 15000, 5)] },
];

const zones = ["Abobo", "Adjamé", "Attécoubé", "Cocody", "Koumassi", "Marcory", "Plateau", "Port-Bouët", "Treichville", "Yopougon", "Bingerville", "Anyama", "Songon"];
const zoneFee = (z: string) => (["Bingerville", "Anyama", "Songon"].includes(z) ? 2500 : 1500);

const pages = [
  ["a-propos", "À propos"], ["livraison", "Livraison"], ["retours", "Retours"], ["cgv", "Conditions générales de vente"],
  ["confidentialite", "Politique de confidentialité"], ["mentions-legales", "Mentions légales"], ["contact", "Contact"],
] as const;

async function main() {
  for (const c of categories) await prisma.category.upsert({ where: { slug: c.slug }, create: c, update: {} });
  const catIds = Object.fromEntries((await prisma.category.findMany()).map((c) => [c.slug, c.id]));

  for (const p of products) {
    if (await prisma.product.findUnique({ where: { slug: p.slug } })) continue;
    await prisma.product.create({
      data: {
        // Produits de démonstration : pas de description ni de photo (à fournir par la boutique), usage non affirmé
        slug: p.slug, name: p.name, categoryId: catIds[p.cat], isFeatured: !!p.featured, usage: p.usage ?? null,
        variants: {
          create: p.variants.map((v, i) => ({
            sku: `${p.slug}-${i + 1}`.toUpperCase(), label: v.label, attributes: v.attrs, price: v.price,
            compareAtPrice: v.compareAt ?? null, stock: v.stock, position: i,
          })),
        },
      },
    });
  }

  for (const [i, name] of zones.entries())
    await prisma.deliveryZone.upsert({ where: { name }, create: { name, fee: zoneFee(name), etaLabel: "24 à 48 h", position: i }, update: {} });
  await prisma.deliveryZone.upsert({
    where: { name: "Intérieur du pays" }, create: { name: "Intérieur du pays", fee: 5000, etaLabel: "3 à 5 jours", position: zones.length }, update: {},
  });

  await prisma.promoCode.upsert({
    where: { code: "BIENVENUE10" }, create: { code: "BIENVENUE10", type: "PERCENT", value: 10, minSubtotal: 5000 }, update: {},
  });

  for (const [slug, title] of pages)
    await prisma.page.upsert({
      where: { slug }, update: {},
      create: { slug, title, body: `# ${title}\n\n_Texte modèle à compléter depuis l'administration (Admin → Pages)._\n` },
    });

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    await prisma.adminUser.upsert({
      where: { email: email.toLowerCase() }, update: {},
      create: { email: email.toLowerCase(), name: "Propriétaire", passwordHash: await bcrypt.hash(password, 12) },
    });
  } else console.warn("ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun admin créé.");
}

main().then(() => prisma.$disconnect()).catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
