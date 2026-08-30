# WAWAWAWA — PASS 5

Cette passe remplace directement la PASS 4 sans changer les chemins utilisés par le jeu.

## Cartes

- 5 cartes 16:9 en 1280×720.
- La serveuse est intégrée derrière le comptoir de la crêperie ; le personnage joueur reste séparé.
- Aucun autre personnage ou compagnon n'est intégré dans les décors.
- Le joueur et le vélo ont été retirés d'Amsterdam.
- Le joueur et le compagnon ont été retirés de Grèce et du Japon.
- Le joueur et les trois compagnons ont été retirés d'Écosse, tout en conservant le feu de camp.
- Les noms des fichiers de carte n'ont pas changé : remplacement direct possible.

## Sprites

- 36 sprites joueur/vélo et 9 sprites compagnons.
- Canevas homogène : 64×64 RGBA.
- Sujet centré géométriquement dans chaque canevas.
- Bord du canevas entièrement transparent.
- Les fragments de cases voisines et les fonds blancs de la PASS 4 ont été supprimés.
- Les frames trop abîmées ont été remplacées par la pose complète la plus proche dans la même direction, afin de conserver tous les noms de fichiers attendus par le jeu.

## Spritesheets ajoutées

- `sprites/sheets/player_walk_sheet.png` : 320×256, 5 colonnes × 4 directions.
- `sprites/sheets/player_bike_sheet.png` : 256×256, 4 colonnes × 4 directions.
- `sprites/sheets/pokemon_breathe_sheet.png` : 192×192, 3 colonnes × 3 compagnons.
- `data/sprites_manifest_pass5.json` : coordonnées exactes de chaque frame.

Ordre des directions dans les planches joueur : `down`, `left`, `right`, `up`.

## Boutons d'interaction

- `sprites/ui/ui_button_interact.png` : état normal du bouton parler/cœur.
- `sprites/ui/ui_button_heart.png` : état appuyé.
- PNG RGBA 128×128, sans texte et sans fond blanc.
- Silhouette et cœur centrés, avec 8 px minimum de marge transparente.

## Masks et coordonnées

- Les 15 masks PASS 4 sont conservés en 1280×720.
- `walkable` : blanc = marchable.
- `collision` : blanc = obstacle.
- `interaction` : blanc = zone d'interaction.
- `data/atlas.json` conserve les positions de spawn et d'interaction.

## Contrôle qualité

Le rapport `data/qa_report_pass5.json` vérifie automatiquement :

- dimensions des cartes et des masks ;
- dimensions de tous les sprites ;
- centrage de chaque zone alpha ;
- transparence des quatre bords de chaque canevas.

Les planches de contrôle sont disponibles dans `debug/`.
