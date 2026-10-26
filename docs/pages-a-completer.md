# Pages d'information : informations à compléter

Les pages Livraison, Contact, À propos, Retours, CGV, Confidentialité et Mentions légales sont rédigées uniquement avec :

- les informations confirmées par la boutique : nom **Noh's Shop**, « alimentaire et divers », **Abidjan**, téléphone et WhatsApp **+225 01 01 11 40 70**, **miel de Korhogo 100 % naturel** (bannière) ;
- le fonctionnement réel du site (commande sans compte, prix en FCFA, frais de livraison affichés avant confirmation, suivi de commande, données enregistrées).

Rien n'a été inventé : pas d'adresse, pas d'horaires, pas de conditions commerciales. Les éléments ci-dessous manquent. Une fois connus, ajoutez-les dans **Admin → Pages** (ou dans **Admin → Réglages / Livraison** pour les valeurs chiffrées).

## ⚠️ Valeurs déjà actives sur le site, à confirmer en priorité

Ces valeurs ont été mises par défaut pendant le développement. Le site les applique réellement (calcul du total à la commande) et les pages les affichent automatiquement.

| Valeur | Valeur actuelle (provisoire) | Où la modifier |
| --- | --- | --- |
| Frais de livraison par commune | 1 500 FCFA (Abidjan), 2 500 FCFA (Bingerville, Anyama, Songon), 5 000 FCFA (intérieur du pays) | Admin → Livraison |
| Délais indicatifs | « 24 à 48 h », « 3 à 5 jours » pour l'intérieur | Admin → Livraison |
| Communes desservies | les 14 zones de départ | Admin → Livraison (désactiver une zone) |
| Livraison offerte à partir de | 50 000 FCFA | Admin → Réglages (0 = jamais offerte) |
| Plafond du paiement à la livraison | 100 000 FCFA | Admin → Réglages (0 = sans plafond) |
| Retrait sur place proposé | oui, adresse « communiquée sur WhatsApp » | Admin → Réglages (case à cocher) |

## Contact et À propos

- [ ] Adresse physique de la boutique ou du point de retrait (si vous souhaitez l'afficher)
- [ ] Horaires de réponse ou d'ouverture
- [ ] Adresse e-mail de contact (celle de la configuration, `contact@example.com`, est un exemple et n'est pas affichée)
- [ ] Quelques lignes sur l'histoire de la boutique, la provenance des produits (Korhogo ?), vos fournisseurs
- [ ] Liens Facebook, Instagram ou TikTok si vous en créez (la rubrique « Suivez-nous » réapparaît automatiquement)

## Livraison

- [ ] Jours et heures de livraison
- [ ] Mode de livraison à l'intérieur du pays (livreur, car, transporteur…) et qui paie les frais éventuels
- [ ] Que se passe-t-il si le client est absent ou injoignable
- [ ] Adresse et horaires du retrait sur place (ou désactiver le retrait)

## Retours et réclamations

- [ ] Délai pour signaler un problème après réception
- [ ] Produits acceptés ou non en retour (produits alimentaires ouverts, cosmétiques…)
- [ ] Solution proposée : échange, avoir, remboursement ? Selon quel moyen et quel délai ?
- [ ] Jusqu'à quand une commande peut être modifiée ou annulée

## CGV

- [ ] Nom légal du vendeur (personne ou entreprise) et forme juridique
- [ ] Numéro RCCM et numéro de compte contribuable (NCC), le cas échéant
- [ ] Mention des taxes (prix TTC ou non)
- [ ] Conditions de remboursement (voir Retours)
- [ ] Droit applicable et règlement des litiges

## Confidentialité

- [ ] Responsable du traitement des données (nom et coordonnées)
- [ ] Durée de conservation des informations de commande
- [ ] Déclaration ou autorisation auprès de l'ARTCI, si elle s'applique à votre activité
- [ ] Prestataires qui recevront des données quand ils seront activés : envoi d'e-mails (ex. Resend), SMS, paiement en ligne (CinetPay)

## Mentions légales

- [ ] Nom légal de l'éditeur, forme juridique, RCCM / NCC
- [ ] Adresse du siège ou de l'éditeur
- [ ] Nom du responsable de la publication
- [ ] Adresse postale de l'hébergeur Vercel Inc. (à reprendre sur vercel.com/legal)
