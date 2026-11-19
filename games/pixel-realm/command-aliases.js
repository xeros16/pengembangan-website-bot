const COMMAND_ALIASES = Object.freeze({
  start: 'mulai', begin: 'mulai',
  name: 'nama',
  class: 'kelas',
  confirm: 'konfirmasi',
  cancel: 'batalsetup',
  profile: 'status',
  explore: 'jelajah',
  inventory: 'inventori',
  shop: 'toko',
  help: 'bantuan',
  guide: 'bantuan',
  map: 'peta',
});

const PET_IDS = new Set(['fox', 'wolf', 'slime', 'dragon']);

/** Normalize the short `.pr` command family into Pixel Realm's canonical subcommands. */
export function normalizePixelRealmArgs(input = []) {
  const args = Array.isArray(input) ? input.map(value => String(value)) : String(input || '').trim().split(/\s+/).filter(Boolean);
  if (!args.length) return ['menu'];
  const first = args[0].toLowerCase();
  if (PET_IDS.has(first)) return ['pet', 'adopsi', first, ...args.slice(1)];
  if (first === 'pet' && PET_IDS.has((args[1] || '').toLowerCase())) {
    return ['pet', 'adopsi', args[1].toLowerCase(), ...args.slice(2)];
  }
  return [COMMAND_ALIASES[first] || first, ...args.slice(1)];
}

export const PIXEL_REALM_PET_SHORTCUTS = Object.freeze([...PET_IDS]);
