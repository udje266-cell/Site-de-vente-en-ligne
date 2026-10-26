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
    deliveryAddress: z.string().trim().max(300).default(""),
    deliveryNote: z.string().trim().max(500).optional(),
    promoCode: z.string().trim().max(40).optional(),
    paymentMethod: z.enum(["CINETPAY", "COD"]),
  })
  .superRefine((v, ctx) => {
    if (!v.pickup) {
      if (!v.deliveryZoneId) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryZoneId"], message: "Choisissez une zone de livraison." });
      if (v.deliveryAddress.length < 5)
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["deliveryAddress"], message: "Indiquez le quartier et un point de repère." });
    }
  });

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutData = z.output<typeof checkoutSchema>;
