import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { renderMarkdown } from "@/lib/markdown";
import { getPageContent } from "@/lib/page-content";

export const revalidate = 3600;

/** Pages générées à la première visite puis mises en cache (ISR). */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

const descriptions: Record<string, string> = {
  livraison: "Zones, frais et délais de livraison Noh's Shop à Abidjan et à l'intérieur de la Côte d'Ivoire. Suivi de commande en ligne.",
  contact: "Contactez Noh's Shop à Abidjan par téléphone ou sur WhatsApp pour une question ou une commande.",
  "a-propos": "Noh's Shop, alimentaire et divers à Abidjan : miel de Korhogo, beurre de karité, maïs et mil. Commande en ligne ou sur WhatsApp.",
  retours: "Un problème avec votre commande Noh's Shop ? Comment nous contacter pour une réclamation, une modification ou une annulation.",
  cgv: "Conditions générales de vente de Noh's Shop : commande, prix en FCFA, disponibilité, paiement et livraison.",
  confidentialite: "Quelles informations Noh's Shop enregistre lors d'une commande, pourquoi, et comment exercer vos droits.",
  "mentions-legales": "Mentions légales du site Noh's Shop : éditeur, hébergement et propriété du contenu.",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug;
  const page = await getPageContent(slug);
  return page ? { title: page.title, description: descriptions[slug], alternates: { canonical: `/infos/${slug}` } } : {};
}

export default async function StaticPage({ params }: Props) {
  const page = await getPageContent((await params).slug);
  if (!page) notFound();
  return <article className="prose-shop mx-auto max-w-2xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />;
}
