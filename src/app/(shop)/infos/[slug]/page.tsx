import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 3600;

/** Pages générées à la première visite puis mises en cache (ISR). */
export async function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  return page ? { title: page.title, alternates: { canonical: `/infos/${page.slug}` } } : {};
}

export default async function StaticPage({ params }: Props) {
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  if (!page) notFound();
  return <article className="prose-shop card mx-auto max-w-2xl p-5" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />;
}
