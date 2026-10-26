import Link from "next/link";
import { WhatsAppIcon } from "./WhatsAppButton";
import { waLink } from "@/lib/whatsapp";

/** État « aucun résultat » : propose de réinitialiser, de voir tout le catalogue ou de demander sur WhatsApp. */
export function EmptyResults({ resetHref, whatsapp, query }: { resetHref?: string; whatsapp: string; query?: string }) {
  return (
    <div className="card space-y-3 p-5">
      <h2 className="text-2xl">Aucun produit ne correspond</h2>
      <p className="text-stone-700">
        {resetHref ? "Essayez d'élargir les filtres (prix, format) ou de les réinitialiser." : "Vérifiez l'orthographe ou essayez un mot plus simple, par exemple « miel » ou « mil »."}
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {resetHref ? <Link href={resetHref} className="btn-primary">Réinitialiser les filtres</Link> : null}
        <Link href="/produits" className={resetHref ? "btn-outline" : "btn-primary"}>Voir tous les produits</Link>
        <a
          href={waLink(whatsapp, query ? `Bonjour, je cherche « ${query} ». Est-ce que vous l'avez ?` : "Bonjour, je cherche un produit.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-outline"
        >
          <WhatsAppIcon /> Demander sur WhatsApp
        </a>
      </div>
    </div>
  );
}
