import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-stone-700">Cette page n&apos;existe pas ou plus.</p>
      <Link href="/" className="btn-primary mt-6">Retour à l&apos;accueil</Link>
    </main>
  );
}
