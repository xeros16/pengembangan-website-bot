import {
  buildTypographyPairingStudio,
  buildLayoutStudio,
  buildSocialKit,
  searchDesignResources,
  formatDesignResourceResults,
} from '../design-studio/production-toolkit.js';

export const DESIGN_PRODUCTION_COMMANDS = new Set(['fontstudio', 'layoutstudio', 'socialkit', 'resourcefind']);

export async function handleDesignProductionCommands(ctx) {
  const { command, args = [], reply } = ctx;
  if (command === 'fontstudio') return reply(buildTypographyPairingStudio(args));
  if (command === 'layoutstudio') return reply(buildLayoutStudio(args));
  if (command === 'socialkit') return reply(buildSocialKit(args));
  if (command === 'resourcefind') return reply(formatDesignResourceResults(searchDesignResources(args)));
}
