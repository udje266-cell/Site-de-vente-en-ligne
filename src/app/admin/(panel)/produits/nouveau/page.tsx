import { ActionForm } from "@/components/admin/ActionForm";
import { prisma } from "@/lib/db";
import { createProduct } from "../actions";

export default async function NewProduct() {
  const categories = await prisma.category.findMany({ orderBy: { position: "asc" } });
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Nouveau produit</h1>
      <ActionForm action={createProduct} submitLabel="Créer le produit" className="card space-y-3 p-4">
        <div>
          <label htmlFor="images" className="label">Photos (jusqu&apos;à 6)</label>
          <input id="images" name="images" type="file" accept="image/*" multiple className="input" />
        </div>
        <div>
          <label htmlFor="name" className="label">Nom *</label>
          <input id="name" name="name" required className="input" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="price" className="label">Prix (FCFA) *</label>
            <input id="price" name="price" type="number" inputMode="numeric" min={0} required className="input" />
          </div>
          <div>
            <label htmlFor="stock" className="label">Stock *</label>
            <input id="stock" name="stock" type="number" inputMode="numeric" min={0} required defaultValue={1} className="input" />
          </div>
          <div>
            <label htmlFor="compareAtPrice" className="label">Prix barré (promo)</label>
            <input id="compareAtPrice" name="compareAtPrice" type="number" inputMode="numeric" min={0} className="input" />
          </div>
          <div>
            <label htmlFor="label" className="label">Format</label>
            <input id="label" name="label" placeholder="Ex. 500 g" className="input" />
          </div>
        </div>
        <div>
          <label htmlFor="categoryId" className="label">Catégorie</label>
          <select id="categoryId" name="categoryId" className="input">
            <option value="">—</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="description" className="label">Description</label>
          <textarea id="description" name="description" rows={4} className="input" />
        </div>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" name="isFeatured" className="h-5 w-5" /> Mettre en avant
        </label>
      </ActionForm>
    </div>
  );
}
