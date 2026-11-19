// Pure presentation helpers for Pixel Realm character and pet UI.
export function buildHeroArt(heroStyle) {
  return heroStyle === 'heroine'
    ? ['       ( o.o )  ✦', '        > ^ <', '       /|   |\\', '        /   \\'].join('\n')
    : ['        .-^- .', '       /  ⚔  \\', '      |  o o  |', '       \\  ^  /', '        /|_|\\', '         / \\'].join('\n');
}

export function getPetLabel(game, petCatalog) {
  const pet = game?.pet;
  if (!pet?.species || !petCatalog?.[pet.species]) return 'Belum memiliki pet';
  const catalogPet = petCatalog[pet.species];
  return `${catalogPet.emoji} ${pet.name || catalogPet.name} Lv.${Number(pet.level || 1)}`;
}

export function getPetAttack(game, petCatalog) {
  const pet = game?.pet;
  if (!pet?.species || !petCatalog?.[pet.species]) return 0;
  const catalogPet = petCatalog[pet.species];
  return Number(catalogPet.atk || 0) + (Math.max(1, Number(pet.level || 1)) - 1) * 2 + (pet.evolved ? 8 : 0);
}
