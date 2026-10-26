import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { savePage } from "../../crud-actions";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  if (!page) notFound();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{page.title}</h1>
      <p className="text-sm text-stone-600"># Titre, ## Sous-titre, **gras**, - liste. <a href={`/infos/${page.slug}`} className="underline" target="_blank">Voir la page</a></p>
      <ActionForm action={savePage} submitLabel="Enregistrer" className="card space-y-3 p-4">
        <input type="hidden" name="slug" value={page.slug} />
        <div><label htmlFor="title" className="label">Titre</label><input id="title" name="title" defaultValue={page.title} className="input" /></div>
        <div><label htmlFor="body" className="label">Contenu</label><textarea id="body" name="body" rows={18} defaultValue={page.body} className="input font-mono text-sm" /></div>
      </ActionForm>
    </div>
  );
}
