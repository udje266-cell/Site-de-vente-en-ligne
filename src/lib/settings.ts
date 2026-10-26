import { shopConfig } from "@/config/shop";
import { prisma } from "@/lib/db";

export type ShopSettings = {
  shopName: string;
  whatsapp: string;
  notificationEmail: string;
  codEnabled: boolean;
  codMaxAmount: number;
  freeShippingThreshold: number;
  pickupEnabled: boolean;
};

export const defaultSettings: ShopSettings = {
  shopName: shopConfig.name,
  whatsapp: shopConfig.whatsapp,
  notificationEmail: shopConfig.email,
  codEnabled: shopConfig.defaults.codEnabled,
  codMaxAmount: shopConfig.defaults.codMaxAmount,
  freeShippingThreshold: shopConfig.defaults.freeShippingThreshold,
  pickupEnabled: shopConfig.pickup.enabled,
};

export async function getSettings(): Promise<ShopSettings> {
  const rows = await prisma.setting.findMany();
  const s: ShopSettings = { ...defaultSettings };
  for (const { key, value } of rows) {
    if (!(key in s)) continue;
    const k = key as keyof ShopSettings;
    const def = defaultSettings[k];
    (s as Record<string, unknown>)[k] =
      typeof def === "boolean" ? value === "true" : typeof def === "number" ? Number(value) : value;
  }
  return s;
}

export async function saveSettings(values: ShopSettings): Promise<void> {
  await prisma.$transaction(
    Object.entries(values).map(([key, value]) =>
      prisma.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } }),
    ),
  );
}
