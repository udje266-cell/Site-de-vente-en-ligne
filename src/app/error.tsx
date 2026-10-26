"use client";

import Link from "next/link";
import { useEffect } from "react";
import { t } from "@/config/messages";
import { shopConfig } from "@/config/shop";
import { waLink } from "@/lib/whatsapp";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t.errorTitle}</h1>
      <p className="mt-2 text-stone-700">{t.errorBody}</p>
      <div className="mt-6 flex flex-col gap-2">
        <button type="button" onClick={reset} className="btn-primary">Réessayer</button>
        <a href={waLink(shopConfig.whatsapp, "Bonjour, j'ai rencontré une erreur sur le site.")} className="btn-wa">{t.contactWhatsapp}</a>
        <Link href="/" className="btn-outline">Retour à l&apos;accueil</Link>
      </div>
    </main>
  );
}
