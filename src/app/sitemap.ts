import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { appUrl } from "@/lib/app-url";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = appUrl();
  const [products, categories, pages] = await Promise.all([
    prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    prisma.category.findMany({ select: { slug: true, updatedAt: true } }),
    prisma.page.findMany({ select: { slug: true, updatedAt: true } }),
  ]);
  return [
    { url: base, changeFrequency: "daily", priority: 1 },
    ...categories.map((c) => ({ url: `${base}/categories/${c.slug}`, lastModified: c.updatedAt })),
    ...products.map((p) => ({ url: `${base}/produits/${p.slug}`, lastModified: p.updatedAt })),
    ...pages.map((p) => ({ url: `${base}/infos/${p.slug}`, lastModified: p.updatedAt })),
  ];
}
