import type { Metadata } from "next";
import Image from "next/image";
import { shopConfig } from "@/config/shop";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Connexion admin", robots: { index: false } };

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      <Image src={shopConfig.logoFull} alt={shopConfig.name} width={640} height={574} sizes="200px" className="mx-auto mb-4 h-auto w-48" priority />
      <h1 className="mb-4 text-2xl font-bold">Espace vendeuse</h1>
      <LoginForm />
    </main>
  );
}
