"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/format";
import { processAndStoreImage } from "@/lib/storage/image";

export type FormState = { error?: string; ok?: string };

const MAX_IMAGES = 6;

const money = z.coerce.number().int("Montant entier en FCFA").min(0).max(100_000_000);
const optionalMoney = z.preprocess((v) => (v === "" || v == null ? undefined : v), money.optional());

/** "Poids=500 g; Parfum=Vanille" -> { Poids: "500 g", Parfum: "Vanille" } */
function parseAttributes(input: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of input.split(/[;\n]/)) {
    const [k, ...rest] = part.split("=");
    const key = k?.trim();
    const val = rest.join("=").trim();
    if (key && val) out[key.slice(0, 40)] = val.slice(0, 60);
  }
  return out;
}

const productSchema = z.object({
  name: z.string().trim().min(2, "Nom trop court").max(120),
  categoryId: z.string().max(50).optional(),
  description: z.string().max(10000).default(""),
  leadTimeNote: z.string().trim().max(120).optional(),
  isFeatured: z.boolean(),
  usage: z.enum(["ALIMENTAIRE", "COSMETIQUE", "ALIMENTAIRE_ET_COSMETIQUE"]).optional(),
  ingredients: z.string().trim().max(1000).optional(),
  storage: z.string().trim().max(500).optional(),
  origin: z.string().trim().max(200).optional(),
});

/** Champs produit lus depuis le formulaire (chaîne vide = non renseigné). */
function productFields(fd: FormData) {
  return {
    name: str(fd, "name"),
    categoryId: str(fd, "categoryId") || undefined,
    description: str(fd, "description") ?? "",
    leadTimeNote: str(fd, "leadTimeNote") || undefined,
    isFeatured: fd.get("isFeatured") === "on",
    usage: str(fd, "usage") || undefined,
    ingredients: str(fd, "ingredients") || undefined,
    storage: str(fd, "storage") || undefined,
    origin: str(fd, "origin") || undefined,
  };
}

const variantSchema = z.object({
  label: z.string().trim().min(1, "Libellé requis").max(80),
  attributes: z.string().max(300).default(""),
  price: money,
  compareAtPrice: optionalMoney,
  stock: z.coerce.number().int().min(0).max(1_000_000),
  sku: z.string().trim().max(60).optional(),
  netWeight: z.string().trim().max(60).optional(),
});

function str(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
}

async function uniqueSlug(name: string, excludeId?: string) {
  const base = slugify(name) || "produit";
  let slug = base;
  for (let i = 2; await prisma.product.findFirst({ where: { slug, NOT: excludeId ? { id: excludeId } : undefined } }); i++) slug = `${base}-${i}`;
  return slug;
}

async function storeImages(productId: string, files: File[], alt: string) {
  const existing = await prisma.productImage.count({ where: { productId } });
  const valid = files.filter((f) => f && f.size > 0).slice(0, Math.max(0, MAX_IMAGES - existing));
  for (const [i, file] of valid.entries()) {
    const img = await processAndStoreImage(file);
    await prisma.productImage.create({ data: { productId, url: img.url, width: img.width, height: img.height, alt, position: existing + i } });
  }
}

function revalidateShop() {
  revalidatePath("/", "layout");
}

function firstError(e: z.ZodError) {
  return e.issues[0]?.message ?? "Formulaire invalide.";
}

/** Création rapide : un seul écran (nom, prix, stock, photo). Les variantes supplémentaires s'ajoutent ensuite. */
export async function createProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const p = productSchema.safeParse(productFields(fd));
  if (!p.success) return { error: firstError(p.error) };
  const v = variantSchema.safeParse({
    label: str(fd, "label") || "Standard",
    attributes: str(fd, "attributes") ?? "",
    price: str(fd, "price"),
    compareAtPrice: str(fd, "compareAtPrice"),
    stock: str(fd, "stock"),
    netWeight: str(fd, "netWeight") || undefined,
  });
  if (!v.success) return { error: firstError(v.error) };
  const slug = await uniqueSlug(p.data.name);
  let id: string;
  try {
    const product = await prisma.product.create({
      data: {
        ...p.data,
        slug,
        variants: {
          create: {
            sku: `${slug}-1`.toUpperCase(),
            label: v.data.label,
            attributes: parseAttributes(v.data.attributes),
            price: v.data.price,
            compareAtPrice: v.data.compareAtPrice ?? null,
            netWeight: v.data.netWeight ?? null,
            stock: v.data.stock,
          },
        },
      },
    });
    id = product.id;
    await storeImages(id, fd.getAll("images") as File[], p.data.name);
  } catch (e) {
    return { error: e instanceof Error && !(e instanceof Prisma.PrismaClientKnownRequestError) ? e.message : "Enregistrement impossible." };
  }
  revalidateShop();
  redirect(`/admin/produits/${id}?cree=1`);
}

export async function updateProduct(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id")!;
  const p = productSchema.safeParse(productFields(fd));
  if (!p.success) return { error: firstError(p.error) };
  await prisma.product.update({
    where: { id },
    data: {
      ...p.data,
      categoryId: p.data.categoryId ?? null,
      leadTimeNote: p.data.leadTimeNote ?? null,
      usage: p.data.usage ?? null,
      ingredients: p.data.ingredients ?? null,
      storage: p.data.storage ?? null,
      origin: p.data.origin ?? null,
      isActive: fd.get("isActive") === "on",
    },
  });
  revalidateShop();
  return { ok: "Produit enregistré." };
}

export async function uploadImages(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(fd, "id")!;
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { error: "Produit introuvable." };
  try {
    await storeImages(id, fd.getAll("images") as File[], product.name);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Envoi impossible." };
  }
  revalidateShop();
  return { ok: "Photo(s) ajoutée(s)." };
}

export async function imageAction(fd: FormData) {
  await requireAdmin();
  const imageId = str(fd, "imageId")!;
  const op = str(fd, "op");
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  if (op === "delete") await prisma.productImage.delete({ where: { id: imageId } });
  if (op === "first") {
    const all = await prisma.productImage.findMany({ where: { productId: img.productId }, orderBy: { position: "asc" } });
    const ordered = [img, ...all.filter((a) => a.id !== img.id)];
    await prisma.$transaction(ordered.map((a, i) => prisma.productImage.update({ where: { id: a.id }, data: { position: i } })));
  }
  revalidateShop();
}

export async function saveVariant(_prev: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const productId = str(fd, "productId")!;
  const variantId = str(fd, "variantId");
  const v = variantSchema.safeParse({
    label: str(fd, "label"),
    attributes: str(fd, "attributes") ?? "",
    price: str(fd, "price"),
    compareAtPrice: str(fd, "compareAtPrice"),
    stock: str(fd, "stock"),
    sku: str(fd, "sku") || undefined,
    netWeight: str(fd, "netWeight") || undefined,
  });
  if (!v.success) return { error: firstError(v.error) };
  const data = {
    label: v.data.label,
    attributes: parseAttributes(v.data.attributes),
    price: v.data.price,
    compareAtPrice: v.data.compareAtPrice ?? null,
    netWeight: v.data.netWeight ?? null,
    stock: v.data.stock,
    isActive: fd.get("isActive") === "on",
  };
  try {
    if (variantId) {
      await prisma.productVariant.update({ where: { id: variantId }, data: { ...data, ...(v.data.sku ? { sku: v.data.sku } : {}) } });
    } else {
      const product = await prisma.product.findUniqueOrThrow({ where: { id: productId }, include: { _count: { select: { variants: true } } } });
      const n = product._count.variants + 1;
      await prisma.productVariant.create({
        data: { ...data, isActive: true, productId, position: n, sku: v.data.sku ?? `${product.slug}-${n}-${Date.now().toString(36)}`.toUpperCase() },
      });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Cette référence (SKU) existe déjà." };
    throw e;
  }
  revalidateShop();
  return { ok: "Variante enregistrée." };
}

export async function toggleProduct(fd: FormData) {
  await requireAdmin();
  const id = str(fd, "id")!;
  const p = await prisma.product.findUniqueOrThrow({ where: { id } });
  await prisma.product.update({ where: { id }, data: { isActive: !p.isActive } });
  revalidateShop();
}

export async function duplicateProduct(fd: FormData) {
  await requireAdmin();
  const src = await prisma.product.findUniqueOrThrow({ where: { id: str(fd, "id")! }, include: { images: true, variants: true } });
  const name = `${src.name} (copie)`;
  const slug = await uniqueSlug(name);
  const copy = await prisma.product.create({
    data: {
      slug,
      name,
      description: src.description,
      categoryId: src.categoryId,
      leadTimeNote: src.leadTimeNote,
      usage: src.usage,
      ingredients: src.ingredients,
      storage: src.storage,
      origin: src.origin,
      isActive: false,
      images: { create: src.images.map(({ url, alt, width, height, position }) => ({ url, alt, width, height, position })) },
      variants: {
        create: src.variants.map((v, i) => ({
          sku: `${slug}-${i + 1}`.toUpperCase(),
          label: v.label,
          attributes: v.attributes ?? {},
          price: v.price,
          compareAtPrice: v.compareAtPrice,
          netWeight: v.netWeight,
          stock: 0,
          isActive: v.isActive,
          position: v.position,
        })),
      },
    },
  });
  redirect(`/admin/produits/${copy.id}`);
}
