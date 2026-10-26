"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export function LoginForm() {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  return (
    <form
      className="card space-y-3 p-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setPending(true);
        setError(null);
        const fd = new FormData(e.currentTarget);
        const res = await signIn("credentials", { email: fd.get("email"), password: fd.get("password"), redirect: false });
        setPending(false);
        if (res?.ok) window.location.href = "/admin";
        else setError(res?.error === "TooManyAttempts" ? "Trop de tentatives. Réessayez dans 15 minutes." : "E-mail ou mot de passe incorrect.");
      }}
    >
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Mot de passe</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="input" />
      </div>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Connexion…" : "Se connecter"}</button>
    </form>
  );
}
