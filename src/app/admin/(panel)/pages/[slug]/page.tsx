import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { defaultPages, isTemplateBody } from "@/content/pages";
import { pageTokens } from "@/lib/page-content";
import { savePage } from "../../crud-actions";

export default async function EditPage({ params }: { params: Promise<{ slug: string }> }) {
  const page = await prisma.page.findUnique({ where: { slug: (await params).slug } });
  if (!page) notFound();
  // Tant que la page contient le texte modèle, on part du contenu par défaut (celui affiché sur le site)
  const def = isTemplateBody(page.body) ? defaultPages[page.slug] : undefined;
  const title = def?.title ?? page.title;
  const body = def?.body ?? page.body;
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-sm text-stone-600"># Titre, ## Sous-titre, **gras**, - liste. <a href={`/infos/${page.slug}`} className="underline" target="_blank">Voir la page</a></p>
      <ActionForm action={savePage} submitLabel="Enregistrer" className="card space-y-3 p-4">
        <input type="hidden" name="slug" value={page.slug} />
        <div><label htmlFor="title" className="label">Titre</label><input id="title" name="title" defaultValue={title} className="input" /></div>
        <div><label htmlFor="body" className="label">Contenu</label><textarea id="body" name="body" rows={18} defaultValue={body} className="input font-mono text-sm" /></div>
      </ActionForm>
      <details className="card p-3 text-sm">
        <summary className="min-h-11 cursor-pointer py-2 font-bold">Valeurs automatiques utilisables dans le texte</summary>
        <p className="mb-2">Ces repères sont remplacés sur le site par les valeurs à jour (Réglages, zones de livraison).</p>
        <ul className="space-y-1">
          {pageTokens.map(([token, label]) => (
            <li key={token}><code>{token}</code> : {label}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
