"use client";

import { usePathname } from "next/navigation";
import { waLink } from "@/lib/whatsapp";

export function WhatsAppIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.6.1-.7.8-.8 1c-.2.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.4.8 3.2.6a2.8 2.8 0 0 0 1.8-1.3 2.3 2.3 0 0 0 .2-1.3c-.1-.1-.3-.2-.5-.3Z" />
    </svg>
  );
}

/**
 * Bouton flottant. Masqué sur les pages qui ont déjà leur propre bouton WhatsApp
 * ou un formulaire (fiche produit, panier, commande, pages d'information), pour ne pas cacher de contenu.
 */
export function FloatingWhatsApp({ phone }: { phone: string }) {
  const pathname = usePathname();
  if (/^\/(produits\/[^/]+|panier|commande|infos\/)/.test(pathname)) return null;
  return (
    <a
      href={waLink(phone, "Bonjour, j'ai une question sur vos produits.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Nous écrire sur WhatsApp"
      className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1a7f45] text-white shadow-lg hover:bg-[#146636]"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
