# Identité visuelle

Boutique : **Noh's Shop – Alimentaire et divers**. Sujet : produits du terroir du nord ivoirien (karité, miel, mil, maïs), vendus à Abidjan, consultés surtout sur des téléphones Android d'entrée de gamme.

Couleurs tirées du logo Noh's Shop (vert des feuilles, or de la goutte de karité et de l'épi).

| Jeton | Valeur | Rôle |
| --- | --- | --- |
| Vert (`brand`) | `#014322` | En-tête, hero, pied de page, structure |
| Or (`accent`) | `#E59900` | Boutons d'action, frise, promo |
| Karité (`karite`) | `#F4F0E2` | Fond des images, bloc catégorie karité |
| Mil (`mil`) | `#EDE3C8` | Bloc catégorie céréales |
| Néré (`nere`) | `#2E6B4E` | Couleur de réserve pour une 4ᵉ catégorie |
| Encre (`ink`) | `#13201A` | Texte |

- **Logo** : sur fond vert, l'emblème est posé sur une pastille blanche (en-tête) et le logo complet sur un bloc blanc (pied de page), car le vert du logo disparaîtrait sur le vert du site.
- **Typographie** : Archivo en largeur étroite (75 %), graisse 800, pour les titres et les prix (esprit enseigne peinte de marché) ; Atkinson Hyperlegible pour le texte (lisibilité sur petits écrans). Polices auto-hébergées (`@fontsource`).
- **Élément signature** : la frise `KorhogoBand` (poisson, chevrons, oiseau, points de semis), inspirée des toiles peintes de Korhogo. Elle n'apparaît qu'en bas du hero et en haut du pied de page.
- **Principes** : fond blanc, alignement à gauche, fiches produit sans bordure ni ombre, chaque catégorie dans la couleur de sa matière, aucune animation décorative.
- Les couleurs définitives de la boutique se règlent dans le bloc `@theme` de `src/app/globals.css` et dans `src/config/shop.ts`.

## Animations
- **Un seul moment au chargement** : la frise du hero se dévoile de gauche à droite (`.anim-reveal`, 900 ms).
- **Retours aux actions** : bouton « Ajouté ✓ » pendant 1,5 s et rebond de la pastille du panier (`.anim-pop`), messages de confirmation en fondu (`.anim-feedback`), dans la boutique et l'admin.
- CSS uniquement (aucune bibliothèque), propriétés peu coûteuses (`transform`, `opacity`, `clip-path`) pour les téléphones d'entrée de gamme.
- **« Réduire les animations »** (réglage du téléphone) : le rebond et le déplacement sont supprimés, le dévoilement et les messages deviennent des fondus de 150 ms, et les transitions de couleur sont conservées.
