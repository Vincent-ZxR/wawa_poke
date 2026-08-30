// Exemple de collision via mask (Canvas)
export function isWalkable(maskCtx, x, y) {
  const [r] = maskCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  return r > 127;
}

// Exemple d'interaction
export function canInteract(interactionCtx, x, y) {
  const [r] = interactionCtx.getImageData(Math.round(x), Math.round(y), 1, 1).data;
  return r > 127;
}

// Les cartes sont en 1280x720. Conserve ce repère logique,
// puis scale le canvas CSS pour le téléphone.
