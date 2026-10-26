# Identité visuelle

Sujet : produits du terroir du nord ivoirien (karité, miel, mil, maïs), vendus à Abidjan, consultés surtout sur des téléphones Android d'entrée de gamme.

| Jeton | Valeur | Rôle |
| --- | --- | --- |
| Indigo Korhogo (`brand`) | `#1E2B4A` | En-tête, hero, pied de page, structure |
| Miel (`accent`) | `#F2A900` | Boutons d'action, frise, promo |
| Karité (`karite`) | `#F4F0E2` | Fond des images, bloc catégorie karité |
| Mil (`mil`) | `#EDE3C8` | Bloc catégorie céréales |
| Néré (`nere`) | `#2E6B4E` | Couleur de réserve pour une 4ᵉ catégorie |
| Encre (`ink`) | `#141B2D` | Texte |

- **Typographie** : Archivo en largeur étroite (75 %), graisse 800, pour les titres et les prix (esprit enseigne peinte de marché) ; Atkinson Hyperlegible pour le texte (lisibilité sur petits écrans). Polices auto-hébergées (`@fontsource`).
- **Élément signature** : la frise `KorhogoBand` (poisson, chevrons, oiseau, points de semis), inspirée des toiles peintes de Korhogo. Elle n'apparaît qu'en bas du hero et en haut du pied de page.
- **Principes** : fond blanc, alignement à gauche, fiches produit sans bordure ni ombre, chaque catégorie dans la couleur de sa matière, aucune animation décorative.
- Les couleurs définitives de la boutique se règlent dans le bloc `@theme` de `src/app/globals.css` et dans `src/config/shop.ts`.
