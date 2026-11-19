import { pixelRealmGame } from './pixel-realm/index.js';
import { handleGuessGame } from './guess-game/commands/game-handler.js';
import { numberGuessGame } from './tebak-angka/index.js';
import { scrambleWordGame } from './acak-kata/index.js';
import { mysteryGame } from './misteri/index.js';
import { multiplayerGame } from './multiplayer/index.js';
import { playerSystemGame } from './player-system/index.js';
import { rewardsGame, recordMissionProgress } from './rewards/index.js';
import { GAME_COMMAND_METADATA } from './command-metadata.js';

const runtimeHandlers = new Map([
  [pixelRealmGame.command, pixelRealmGame.handler],
  ['tebak', handleGuessGame],
  [numberGuessGame.command, numberGuessGame.handler],
  [scrambleWordGame.command, scrambleWordGame.handler],
  [mysteryGame.command, mysteryGame.handler],
  [multiplayerGame.command, multiplayerGame.handler],
  [playerSystemGame.command, playerSystemGame.handler],
  [rewardsGame.command, rewardsGame.handler],
]);

const runtimeMetadata = {
  pixelrealm: { id: 'pixel-realm', creator: '@pir.visuals' },
  angka: { id: 'tebak-angka' },
  acak: { id: 'acak-kata' },
  misteri: { id: 'misteri-detektif' },
};

// Metadata is the single source for command catalog/help and runtime registry labels.
export const GAME_REGISTRY = new Map(GAME_COMMAND_METADATA.map(game => {
  const handler = runtimeHandlers.get(game.command);
  if (typeof handler !== 'function') {
    throw new Error(`Game handler tidak terdaftar untuk command: ${game.command}`);
  }
  return [game.command, Object.freeze({ ...runtimeMetadata[game.command], ...game, handler })];
}));

export function getAvailableGames() {
  return [...GAME_REGISTRY.values()];
}

export async function dispatchGameCommand(command, context) {
  const game = GAME_REGISTRY.get(String(command || '').toLowerCase());
  if (!game) return false;
  if (game.command !== 'player' && game.command !== 'mission' && context?.User && (context?.getDbReady?.() ?? context?.dbReady ?? true)) {
    await recordMissionProgress(context.User, context.userJid || context.phoneJid, 'games').catch(() => {});
  }
  await game.handler(context);
  return true;
}
