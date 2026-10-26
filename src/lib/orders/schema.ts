import { z } from "zod";
import { normalizeCiPhone } from "@/lib/format";

export const cartLineSchema = z.object({
  variantId: z.string().min(1).max(50),
  quantity: z.coerce.number().int().min(1).max(99),
});

export const checkoutSchema = z
  .object({
    items: z.array(cartLineSchema).min(1, "Votre panier est vide.").max(50),
    customerName: z.string().trim().min(2, "Indiquez votre nom.").max(100),
    customerPhone: z
      .string()
      .trim()
      .transform((v, ctx) => {
        const p = normalizeCiPhone(v);
        if (!p) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Numéro ivoirien invalide (ex. 07 00 00 00 00)." });
          return z.NEVER;
        }
        return p;
      }),
    customerEmail: z
      .string()
      .trim()
      .max(200)
      .optional()
      .transform((v) => (v ? v : undefined))
      .pipe(z.string().email("E-mail invalide.").optional()),
    pickup: z.boolean().default(false),
    deliveryZoneId: z.string().max(50).optional(),
    // Quartier et point de repère, combinés en une adresse descriptive
    deliveryDistrict: z.string().trim().max(120).default(""),
    deliveryLandmark: z.string().trim().max(200).default(""),
    deliveryNote: z.string().trim().max(500).optional(),
    promoCode: z.string().trim().max(40).optional(),
    paymentMethod: z.enum(["CINETPAY", "COD"], { errorMap: () => ({ message: "Choisissez un moyen de paiement." }) }),
    idempotencyKey: z.string().regex(/^[A-Za-z0-9-]{16,64}$/).optional(),
  })
  .superRefine((v, ctx) => {
    if (!v.pickup) {
      if (!v.deliveryZoneId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryZoneId"], message: "Choisissez une zone de livraison." });
      if (v.deliveryDistrict.length < 2)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryDistrict"], message: "Indiquez votre quartier." });
      if (v.deliveryLandmark.length < 3)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryLandmark"], message: "Indiquez un point de repère (pharmacie, école, carrefour…)." });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;

/** Adresse descriptive enregistrée sur la commande. */
export function formatDeliveryAddress(d: { deliveryDistrict: string; deliveryLandmark: string }): string {
  return `Quartier : ${d.deliveryDistrict}\nRepère : ${d.deliveryLandmark}`;
}
