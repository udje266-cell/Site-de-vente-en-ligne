/** Construit un lien wa.me pré-rempli. */
export function waLink(phone: string, text?: string): string {
  const num = phone.replace(/\D/g, "");
  return `https://wa.me/${num}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}
