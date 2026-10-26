"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button type="button" className="btn text-sm" onClick={() => signOut({ callbackUrl: "/admin/connexion" })}>
      Déconnexion
    </button>
  );
}
