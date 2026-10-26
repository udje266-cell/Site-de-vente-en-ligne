import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm } from "@/components/admin/ActionForm";
import { ProductInfoFields } from "@/components/admin/ProductInfoFields";
import { prisma } from "@/lib/db";
import { duplicateProduct, imageAction, saveVariant, toggleProduct, updateProduct, uploadImages } from "../actions";

const attrsToText = (a: unknown) =>
  Object.entries((a ?? {}) as Record<string, string>)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ cree?: string }> }) {
  const { id } = await params;
  const { cree } = await searchParams;
  const [product, categories] = await Promise.all([
    prisma.product.findUnique({ where: { id }, include: { images: { orderBy: { position: "asc" } }, variants: { orderBy: { position: "asc" } } } }),
    prisma.category.findMany({ orderBy: { position: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div className="space-y-5">
      {cree ? <p role="status" className="rounded bg-green-50 p-3 text-green-900">Produit créé ✔</p> : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <div className="flex gap-2">
          <Link href={`/produits/${product.slug}`} className="btn-outline text-sm">Voir</Link>
          <form action={toggleProduct}><input type="hidden" name="id" value={product.id} /><button className="btn-outline text-sm">{product.isActive ? "Masquer" : "Afficher"}</button></form>
          <form action={duplicateProduct}><input type="hidden" name="id" value={product.id} /><button className="btn-outline text-sm">Dupliquer</button></form>
        </div>
      </div>

      <section className="card space-y-3 p-4">
        <h2 className="font-semibold">Photos ({product.images.length}/6)</h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {product.images.map((img, i) => (
            <li key={img.id} className="space-y-1">
              <div className="relative aspect-square overflow-hidden rounded bg-stone-100">
                <Image src={img.url} alt={img.alt} fill sizes="120px" className="object-cover" />
              </div>
              <form action={imageAction} className="flex gap-1">
                <input type="hidden" name="imageId" value={img.id} />
                {i > 0 ? <button name="op" value="first" className="btn-outline flex-1 px-1 text-xs">1ʳᵉ</button> : null}
                <button name="op" value="delete" className="btn flex-1 border border-red-300 px-1 text-xs text-red-800">Suppr.</button>
              </form>
            </li>
          ))}
        </ul>
        {product.images.length < 6 ? (
          <ActionForm action={uploadImages} submitLabel="Ajouter les photos" className="space-y-2">
            <input type="hidden" name="id" value={product.id} />
            <label htmlFor="images" className="label">Ajouter des photos</label>
            <input id="images" name="images" type="file" accept="image/*" multiple className="input" />
          </ActionForm>
        ) : null}
      </section>

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Informations</h2>
        <ActionForm action={updateProduct} submitLabel="Enregistrer">
          <input type="hidden" name="id" value={product.id} />
          <div><label htmlFor="name" className="label">Nom</label><input id="name" name="name" defaultValue={product.name} required className="input" /></div>
          <div>
            <label htmlFor="categoryId" className="label">Catégorie</label>
            <select id="categoryId" name="categoryId" defaultValue={product.categoryId ?? ""} className="input">
              <option value="">—</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div><label htmlFor="description" className="label">Description (Markdown)</label><textarea id="description" name="description" rows={6} defaultValue={product.description} className="input" /></div>
          <div><label htmlFor="leadTimeNote" className="label">Délai de livraison indicatif (facultatif)</label><input id="leadTimeNote" name="leadTimeNote" defaultValue={product.leadTimeNote ?? ""} className="input" /></div>
          <ProductInfoFields usage={product.usage} ingredients={product.ingredients} storage={product.storage} origin={product.origin} />
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={product.isActive} className="h-5 w-5" /> Visible sur le site</label>
          <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="isFeatured" defaultChecked={product.isFeatured} className="h-5 w-5" /> Mis en avant</label>
        </ActionForm>
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Variantes (format, prix, stock)</h2>
        <p className="text-sm text-stone-600">Attributs : <code>Clé=valeur; Clé=valeur</code>, ex. <code>Poids=500 g; Parfum=Vanille</code> (servent aux filtres).</p>
        {[...product.variants, null].map((v) => (
          <div key={v?.id ?? "new"} className="card p-4">
            <h3 className="mb-2 text-sm font-semibold">{v ? v.label : "+ Nouvelle variante"}</h3>
            <ActionForm action={saveVariant} submitLabel={v ? "Enregistrer" : "Ajouter"} className="grid grid-cols-2 gap-2">
              <input type="hidden" name="productId" value={product.id} />
              {v ? <input type="hidden" name="variantId" value={v.id} /> : null}
              <div className="col-span-2"><label className="label" htmlFor={`l-${v?.id}`}>Libellé</label><input id={`l-${v?.id}`} name="label" defaultValue={v?.label} required className="input" /></div>
              <div><label className="label" htmlFor={`p-${v?.id}`}>Prix</label><input id={`p-${v?.id}`} name="price" type="number" inputMode="numeric" min={0} defaultValue={v?.price} required className="input" /></div>
              <div><label className="label" htmlFor={`s-${v?.id}`}>Stock</label><input id={`s-${v?.id}`} name="stock" type="number" inputMode="numeric" min={0} defaultValue={v?.stock ?? 0} required className="input" /></div>
              <div><label className="label" htmlFor={`c-${v?.id}`}>Prix barré</label><input id={`c-${v?.id}`} name="compareAtPrice" type="number" inputMode="numeric" min={0} defaultValue={v?.compareAtPrice ?? ""} className="input" /></div>
              <div className="col-span-2"><label className="label" htmlFor={`w-${v?.id}`}>Poids ou contenance nets (facultatif)</label><input id={`w-${v?.id}`} name="netWeight" defaultValue={v?.netWeight ?? ""} placeholder="Ex. 250 g net…" className="input" /></div>
              <div><label className="label" htmlFor={`k-${v?.id}`}>Réf. (SKU)</label><input id={`k-${v?.id}`} name="sku" defaultValue={v?.sku} className="input" /></div>
              <div className="col-span-2"><label className="label" htmlFor={`a-${v?.id}`}>Attributs</label><input id={`a-${v?.id}`} name="attributes" defaultValue={attrsToText(v?.attributes)} className="input" /></div>
              {v ? <label className="col-span-2 flex min-h-11 items-center gap-2"><input type="checkbox" name="isActive" defaultChecked={v.isActive} className="h-5 w-5" /> Active</label> : null}
            </ActionForm>
          </div>
        ))}
      </section>
    </div>
  );
}
