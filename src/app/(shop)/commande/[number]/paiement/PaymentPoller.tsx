"use client";

import { useEffect, useState } from "react";

export function PaymentPoller({ tx, confirmationUrl }: { tx: string; confirmationUrl: string }) {
  const [status, setStatus] = useState("PENDING");
  useEffect(() => {
    let tries = 0;
    let stop = false;
    const tick = async () => {
      if (stop) return;
      tries++;
      try {
        const r = await fetch(`/api/payments/status?tx=${encodeURIComponent(tx)}`, { cache: "no-store" });
        const d = (await r.json()) as { status: string };
        setStatus(d.status);
        if (d.status !== "PENDING") {
          window.location.href = confirmationUrl;
          return;
        }
      } catch {
        /* réessaie */
      }
      if (tries < 40) setTimeout(tick, 3000);
    };
    void tick();
    return () => {
      stop = true;
    };
  }, [tx, confirmationUrl]);
  return (
    <div className="mt-6" role="status" aria-live="polite">
      {status === "PENDING" ? <p className="animate-pulse">Vérification…</p> : <p>Redirection…</p>}
      <a href={confirmationUrl} className="btn-outline mt-4">Voir ma commande</a>
    </div>
  );
}
