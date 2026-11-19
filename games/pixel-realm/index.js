import { handleGameCommand } from './commands/game-handler.js';

export const pixelRealmGame = Object.freeze({
  id: 'pixel-realm',
  command: 'pixelrealm',
  name: 'Pixel Realm',
  creator: '@pir.visuals',
  description: 'RPG petualangan WhatsApp dengan karakter, pertarungan, crafting, guild, dan progres tersimpan.',
  handler: handleGameCommand,
});

export { handleGameCommand };
export { getGameImagePath, getGameImageMap } from './images.js';
export { GAME_LOCATIONS, GAME_MONSTERS, GAME_CLASSES } from './data/index.js';
export { createDefaultGame } from './services/game-state.js';
export { PET_CATALOG } from './data/pets.js';
export { normalizeGameState } from './services/normalize-game.js';
export { getPlayerGameState, getPlayerProfileSummary } from './services/player-service.js';
export { buildProfileMessage } from './commands/profile.js';
export { getBossPhase, getBattleIntent, resolveEnemyRetaliation } from './services/combat-service.js';
export { buildHeroArt, getPetLabel, getPetAttack } from './services/character-display.js';
export { GAME_EQUIPMENT } from './data/equipment.js';
export { buildInventoryMessage, buildLootBagMessage } from './commands/inventory.js';
export { buildEquipmentMessage } from './commands/equipment-display.js';
export { handleEquipCommand } from './commands/equip.js';
