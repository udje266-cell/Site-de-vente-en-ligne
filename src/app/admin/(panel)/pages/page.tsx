import Link from "next/link";
import { prisma } from "@/lib/db";

export default async function Pages() {
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Pages</h1>
      <ul className="space-y-2">
        {pages.map((p) => (
          <li key={p.id}><Link href={`/admin/pages/${p.slug}`} className="card flex min-h-11 items-center p-3 hover:bg-stone-50">{p.title}</Link></li>
        ))}
      </ul>
    </div>
  );
}
