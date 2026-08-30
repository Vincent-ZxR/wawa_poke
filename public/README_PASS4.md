# WAWAWAWA — PASS 4

Cette passe est pensée pour être branchée directement au jeu.

- Cartes 16:9 : 1280x720
- Dézoom visuel : ~0.8
- Crêperie : aucun texte/header dans la carte
- Masks alignés 1:1 avec les cartes
- Grilles collision/interaction : 80x45 à 16 px
- Sprites joueur/compagnons : 64x64, centrés, transparents
- Tiles simples par biome : 16x16
- Atlas global : `data/atlas.json`

## Convention masks
- `masks/walkable/*` : blanc = marchable
- `masks/collision/*` : blanc = collision
- `masks/interaction/*` : blanc = zone d'interaction

Pour le runtime mobile, garde 1280x720 comme coordonnées logiques et adapte seulement l'affichage CSS.
