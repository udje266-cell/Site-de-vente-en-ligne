import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion admin", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <h1 className="mb-4 text-2xl font-bold">Espace vendeuse</h1>
      <LoginForm />
    </main>
  );
}
