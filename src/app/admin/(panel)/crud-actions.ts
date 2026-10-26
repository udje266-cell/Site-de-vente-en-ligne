"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { normalizeCiPhone, slugify } from "@/lib/format";
import { saveSettings } from "@/lib/settings";

type State = { error?: string; ok?: string };

const s = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : undefined;
};
const intField = z.coerce.number().int().min(0).max(100_000_000);
const optInt = z.preprocess((v) => (v === "" || v == null ? undefined : v), intField.optional());
const optDate = z.preprocess((v) => (v === "" || v == null ? undefined : v), z.coerce.date().optional());
const err = (e: z.ZodError) => ({ error: e.issues[0]?.message ?? "Formulaire invalide." });
const done = (ok: string) => {
  revalidatePath("/", "layout");
  return { ok };
};
function dbError(e: unknown): State {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { error: "Cette valeur existe déjà." };
  throw e;
}

// ---------- Catégories ----------
const categorySchema = z.object({ name: z.string().trim().min(2).max(80), position: intField, parentId: z.string().max(50).optional() });

export async function saveCategory(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const p = categorySchema.safeParse({ name: s(fd, "name"), position: s(fd, "position") || 0, parentId: s(fd, "parentId") || undefined });
  if (!p.success) return err(p.error);
  const id = s(fd, "id");
  try {
    if (id) await prisma.category.update({ where: { id }, data: { ...p.data, parentId: p.data.parentId && p.data.parentId !== id ? p.data.parentId : null } });
    else await prisma.category.create({ data: { ...p.data, slug: slugify(p.data.name) } });
  } catch (e) {
    return dbError(e);
  }
  return done("Catégorie enregistrée.");
}

export async function deleteCategory(fd: FormData) {
  await requireAdmin();
  await prisma.category.delete({ where: { id: s(fd, "id")! } }); // produits -> sans catégorie (onDelete: SetNull)
  revalidatePath("/", "layout");
}

// ---------- Zones de livraison ----------
const zoneSchema = z.object({
  name: z.string().trim().min(2).max(80),
  fee: intField,
  etaLabel: z.string().trim().min(1).max(60),
  position: intField,
  isActive: z.boolean(),
});

export async function saveZone(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const p = zoneSchema.safeParse({ name: s(fd, "name"), fee: s(fd, "fee"), etaLabel: s(fd, "etaLabel"), position: s(fd, "position") || 0, isActive: fd.get("isActive") === "on" });
  if (!p.success) return err(p.error);
  const id = s(fd, "id");
  try {
    if (id) await prisma.deliveryZone.update({ where: { id }, data: p.data });
    else await prisma.deliveryZone.create({ data: p.data });
  } catch (e) {
    return dbError(e);
  }
  return done("Zone enregistrée.");
}

// ---------- Codes promo ----------
const promoSchema = z
  .object({
    code: z.string().trim().min(3).max(40).regex(/^[A-Za-z0-9_-]+$/, "Lettres, chiffres, - et _ uniquement").transform((c) => c.toUpperCase()),
    type: z.enum(["PERCENT", "FIXED"]),
    value: z.coerce.number().int().min(1),
    minSubtotal: optInt,
    maxUses: optInt,
    startsAt: optDate,
    endsAt: optDate,
    isActive: z.boolean(),
  })
  .refine((v) => v.type !== "PERCENT" || v.value <= 100, { message: "Un pourcentage ne peut pas dépasser 100." });

export async function savePromo(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const p = promoSchema.safeParse({
    code: s(fd, "code"),
    type: s(fd, "type"),
    value: s(fd, "value"),
    minSubtotal: s(fd, "minSubtotal"),
    maxUses: s(fd, "maxUses"),
    startsAt: s(fd, "startsAt"),
    endsAt: s(fd, "endsAt"),
    isActive: fd.get("isActive") === "on",
  });
  if (!p.success) return err(p.error);
  const data = { ...p.data, minSubtotal: p.data.minSubtotal ?? null, maxUses: p.data.maxUses ?? null, startsAt: p.data.startsAt ?? null, endsAt: p.data.endsAt ?? null };
  const id = s(fd, "id");
  try {
    if (id) await prisma.promoCode.update({ where: { id }, data });
    else await prisma.promoCode.create({ data });
  } catch (e) {
    return dbError(e);
  }
  return done("Code promo enregistré.");
}

// ---------- Pages ----------
export async function savePage(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const p = z.object({ slug: z.string().max(60), title: z.string().trim().min(2).max(120), body: z.string().max(50000) }).safeParse({
    slug: s(fd, "slug"),
    title: s(fd, "title"),
    body: s(fd, "body") ?? "",
  });
  if (!p.success) return err(p.error);
  await prisma.page.update({ where: { slug: p.data.slug }, data: { title: p.data.title, body: p.data.body } });
  return done("Page enregistrée.");
}

// ---------- Réglages ----------
export async function saveShopSettings(_p: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const p = z
    .object({
      shopName: z.string().trim().min(2).max(80),
      whatsapp: z.string().transform((v, ctx) => {
        const n = normalizeCiPhone(v);
        if (!n) ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro WhatsApp ivoirien invalide." });
        return n ?? "";
      }),
      notificationEmail: z.string().trim().email("E-mail invalide."),
      codEnabled: z.boolean(),
      codMaxAmount: intField,
      freeShippingThreshold: intField,
      pickupEnabled: z.boolean(),
    })
    .safeParse({
      shopName: s(fd, "shopName"),
      whatsapp: s(fd, "whatsapp") ?? "",
      notificationEmail: s(fd, "notificationEmail"),
      codEnabled: fd.get("codEnabled") === "on",
      codMaxAmount: s(fd, "codMaxAmount") || 0,
      freeShippingThreshold: s(fd, "freeShippingThreshold") || 0,
      pickupEnabled: fd.get("pickupEnabled") === "on",
    });
  if (!p.success) return err(p.error);
  await saveSettings(p.data);
  return done("Réglages enregistrés.");
}
