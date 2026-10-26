import { shopConfig } from "@/config/shop";

const NBSP = " ";

/** 12500 -> "12 500 FCFA" (espaces insécables) */
export function formatPrice(amount: number): string {
  const digits = Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return `${digits}${NBSP}FCFA`;
}

/** Préfixes valides des numéros ivoiriens à 10 chiffres (mobiles et fixes). */
const CI_PHONE = /^(01|05|07|21|25|27)\d{8}$/;

/** Normalise un numéro ivoirien en "+225XXXXXXXXXX", ou null si invalide. */
export function normalizeCiPhone(input: string): string | null {
  let digits = input.replace(/[\s.\-()]/g, "");
  if (digits.startsWith("+225")) digits = digits.slice(4);
  else if (digits.startsWith("00225")) digits = digits.slice(5);
  else if (digits.startsWith("225") && digits.length === 13) digits = digits.slice(3);
  return CI_PHONE.test(digits) ? `+225${digits}` : null;
}

/** "+2250700000000" -> "+225 07 00 00 00 00" */
export function formatPhone(phone: string): string {
  const m = /^\+225(\d{10})$/.exec(phone);
  if (!m) return phone;
  return "+225 " + m[1]!.match(/\d{2}/g)!.join(" ");
}

export function formatDate(date: Date, withTime = true): string {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: shopConfig.timeZone,
    dateStyle: "long",
    ...(withTime ? { timeStyle: "short" } : {}),
  }).format(date);
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
