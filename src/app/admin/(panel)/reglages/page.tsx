import { ActionForm } from "@/components/admin/ActionForm";
import { getSettings } from "@/lib/settings";
import { saveShopSettings } from "../crud-actions";

export default async function Settings() {
  const s = await getSettings();
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">Réglages de la boutique</h1>
      <ActionForm action={saveShopSettings} submitLabel="Enregistrer" className="card space-y-3 p-4">
        <div><label htmlFor="shopName" className="label">Nom de la boutique</label><input id="shopName" name="shopName" defaultValue={s.shopName} className="input" /></div>
        <div><label htmlFor="whatsapp" className="label">Numéro WhatsApp</label><input id="whatsapp" name="whatsapp" type="tel" defaultValue={s.whatsapp} className="input" /></div>
        <div><label htmlFor="notificationEmail" className="label">E-mail de notification des commandes</label><input id="notificationEmail" name="notificationEmail" type="email" defaultValue={s.notificationEmail} className="input" /></div>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="codEnabled" defaultChecked={s.codEnabled} className="h-5 w-5" /> Paiement à la livraison activé</label>
        <div><label htmlFor="codMaxAmount" className="label">Plafond du paiement à la livraison (FCFA, 0 = sans plafond)</label><input id="codMaxAmount" name="codMaxAmount" type="number" min={0} defaultValue={s.codMaxAmount} className="input" /></div>
        <div><label htmlFor="freeShippingThreshold" className="label">Livraison gratuite à partir de (FCFA, 0 = jamais)</label><input id="freeShippingThreshold" name="freeShippingThreshold" type="number" min={0} defaultValue={s.freeShippingThreshold} className="input" /></div>
        <label className="flex min-h-11 items-center gap-2"><input type="checkbox" name="pickupEnabled" defaultChecked={s.pickupEnabled} className="h-5 w-5" /> Retrait sur place proposé</label>
      </ActionForm>
    </div>
  );
}
