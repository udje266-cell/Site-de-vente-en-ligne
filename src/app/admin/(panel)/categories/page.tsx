import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { deleteCategory, saveCategory } from "../crud-actions";

export default async function Categories() {
  const categories = await prisma.category.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Catégories</h1>
      <p className="text-sm text-stone-600">L&apos;ordre d&apos;affichage va du plus petit au plus grand numéro.</p>
      {[...categories, null].map((c) => (
        <div key={c?.id ?? "new"} className="card p-3">
          <ActionForm action={saveCategory} submitLabel={c ? "Enregistrer" : "Ajouter"} className="grid grid-cols-[1fr_80px] gap-2">
            {c ? <input type="hidden" name="id" value={c.id} /> : null}
            <div><label className="label" htmlFor={`n-${c?.id}`}>{c ? `Nom (${c._count.products} produits)` : "Nouvelle catégorie"}</label><input id={`n-${c?.id}`} name="name" defaultValue={c?.name} required className="input" /></div>
            <div><label className="label" htmlFor={`o-${c?.id}`}>Ordre</label><input id={`o-${c?.id}`} name="position" type="number" defaultValue={c?.position ?? categories.length} className="input" /></div>
          </ActionForm>
          {c && c._count.products === 0 ? (
            <form action={deleteCategory} className="mt-2"><input type="hidden" name="id" value={c.id} /><button className="btn text-sm text-red-800 underline">Supprimer</button></form>
          ) : null}
        </div>
      ))}
    </div>
  );
}
