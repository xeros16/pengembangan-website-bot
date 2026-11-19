import { COMMAND_CATALOG } from './command-catalog.js';

function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const above = previous[j];
      previous[j] = Math.min(
        previous[j] + 1,
        previous[j - 1] + 1,
        diagonal + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diagonal = above;
    }
  }
  return previous[b.length];
}

/** Return suggestions only; this never executes a command automatically. */
export function findSimilarCommands(input, catalog = COMMAND_CATALOG, limit = 3) {
  const normalized = String(input || '').trim().toLowerCase().replace(/^\.+/, '');
  if (!normalized || normalized.length > 40) return [];

  const candidates = [...new Set(catalog.map(item => String(item.command || '').toLowerCase()))]
    .filter(command => command && command !== normalized)
    .map(command => ({ command, distance: levenshtein(normalized, command) }))
    .filter(({ command, distance }) => {
      const maxDistance = normalized.length <= 3 ? 1 : normalized.length <= 7 ? 2 : 3;
      return distance <= maxDistance || command.startsWith(normalized) || normalized.startsWith(command);
    })
    .sort((a, b) => a.distance - b.distance || a.command.localeCompare(b.command));

  return candidates.slice(0, Math.max(1, Math.min(Number(limit) || 3, 5))).map(item => item.command);
}


const SEARCH_STOP_WORDS = new Set([
  'aku', 'saya', 'kamu', 'sih', 'dong', 'tolong', 'mohon', 'apa', 'bagaimana',
  'gimana', 'caranya', 'cara', 'untuk', 'dengan', 'yang', 'dan', 'atau', 'di',
  'ke', 'dari', 'the', 'a', 'an', 'is', 'how', 'to', 'please', 'fitur', 'perintah',
]);

const SEARCH_SYNONYM_GROUPS = [
  ['poster', 'flyer', 'pamflet', 'spanduk', 'brosur', 'promosi', 'poster acara'],
  ['logo', 'branding', 'identitas', 'brand identity'],
  ['desain', 'design', 'bikin', 'buat', 'membuat', 'rancang', 'merancang', 'creative'],
  ['gambar', 'foto', 'image', 'resize', 'kompres', 'compress', 'crop', 'stiker', 'sticker'],
  ['warna', 'color', 'palette', 'palet', 'kontras', 'hex'],
  ['font', 'huruf', 'tipografi', 'typography', 'fontpair', 'fontstudio'],
  ['belajar', 'pemula', 'tutorial', 'materi', 'latihan', 'teknik'],
  ['jasa', 'desainer', 'designer', 'cari desainer', 'marketplace', 'portofolio', 'portfolio', 'karya', 'profil desainer'],
  ['revisi', 'revision', 'brief', 'spesifikasi', 'serah terima'],
  ['komunitas', 'grup', 'group', 'aturan', 'anggota', 'moderasi', 'mentor', 'mentoring', 'kolaborasi', 'collab', 'rekan', 'achievement', 'pencapaian', 'anti toxic', 'antitoxic', 'toxic', 'kata kasar', 'kata terlarang', 'filter kata', 'blokir kata', 'badword'],
  ['game', 'games', 'permainan', 'main', 'bermain', 'multiplayer', 'rpg'],
  ['aset', 'asset', 'mockup', 'texture', 'ikon', 'icon', 'resource'],
  ['bantuan', 'support', 'help', 'tiket', 'ticket'],
  ['favorit', 'favoritku', 'pintasan', 'shortcut', 'riwayat', 'terakhir', 'recent', 'favorite', 'favorites', 'cepat'],
  ['anime', 'otaku', 'seasonal anime', 'anime musim', 'anime populer', 'sinopsis anime'],
  ['musik', 'music', 'lagu', 'song', 'play', 'audio', 'album', 'penyanyi', 'artis', 'soundtrack'],
  ['suara', 'voice', 'voice note', 'efek suara', 'audio effect', 'bass', 'treble', 'reverb', 'echo', 'karaoke', 'chipmunk', 'robot', 'tempo', '8d'],
  ['cuaca', 'weather', 'hujan', 'suhu', 'kelembapan', 'angin', 'prakiraan', 'gempa', 'magnitudo', 'bmkg'],
  ['download', 'unduh', 'video', 'media', 'youtube', 'tiktok', 'instagram', 'tautan media'],
];

const SEARCH_SYNONYMS = new Map();
for (const group of SEARCH_SYNONYM_GROUPS) {
  for (const term of group) {
    SEARCH_SYNONYMS.set(term, group.filter(item => item !== term));
  }
}

function tokenizeSearchQuery(value) {
  return String(value || '')
    .toLocaleLowerCase('id-ID')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(token => token.length > 1 && !SEARCH_STOP_WORDS.has(token))
    .slice(0, 12);
}

/**
 * Need-based discovery for natural Indonesian/English phrases.
 * Returns catalog entries with a relevance score; it never executes commands.
 */
export function searchCommandsByNeed(query, catalog = COMMAND_CATALOG, limit = 8) {
  const normalized = String(query || '').toLocaleLowerCase('id-ID').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
  if (!normalized || normalized.length > 120) return [];
  const tokens = tokenizeSearchQuery(normalized);
  if (!tokens.length) return [];

  const expanded = new Map();
  for (const token of tokens) {
    expanded.set(token, Math.max(expanded.get(token) || 0, 1));
    for (const synonym of SEARCH_SYNONYMS.get(token) || []) {
      expanded.set(synonym, Math.max(expanded.get(synonym) || 0, 0.45));
    }
  }

  const results = catalog.map(item => {
    const command = String(item.command || '').toLocaleLowerCase('id-ID');
    const category = String(item.category || '').toLocaleLowerCase('id-ID');
    const description = String(item.description || '').toLocaleLowerCase('id-ID');
    const example = String(item.example || '').toLocaleLowerCase('id-ID');
    const searchable = `${command} ${category} ${description} ${example}`;
    let score = 0;

    if (command === normalized || command === normalized.replace(/\s+/g, '')) score += 20;
    if (searchable.includes(normalized)) score += 9;

    for (const [token, weight] of expanded) {
      if (command.includes(token)) score += 5 * weight;
      if (category.includes(token)) score += 3 * weight;
      if (description.includes(token)) score += 2.2 * weight;
      if (example.includes(token)) score += 1.4 * weight;
    }

    // Intent boosts make everyday requests lead to complete workflows, not merely
    // commands whose descriptions happen to contain one matching word.
    const intentRules = [
      [/poster|flyer|pamflet|spanduk|brosur|logo|branding|desain|design|bikin|buat|membuat/, new Set(['wizard', 'brief', 'briefbuilder', 'creative', 'designflow', 'layout', 'layoutstudio', 'designqa', 'checklist', 'designreview', 'handoff']), 4.5],
      [/gambar|foto|image|resize|ukuran|kompres|compress|crop|stiker|sticker/, new Set(['info', 'imageinfo', 'ratio', 'resize', 'compress', 'crop', 'imgconvert', 'sticker', 'hd']), 4.5],
      [/jasa|desainer|designer|marketplace|portofolio|portfolio|karya/, new Set(['design', 'designer', 'portfolio', 'studio']), 4.5],
      [/belajar|pemula|tutorial|materi|latihan|teknik/, new Set(['designlearn', 'explain', 'designinspire', 'designchallenge', 'typography', 'fontpair', 'tutorial']), 4.5],
      [/komunitas|grup|group|aturan|anggota|moderasi|mentor|mentoring|kolaborasi|collab|rekan|achievement|pencapaian|kata kasar|kata terlarang|filter kata|blokir kata|antitoxic|toxic/, new Set(['designcommunity', 'cohort', 'rules', 'ticket', 'report', 'reports', 'antitoxic', 'antilink', 'antispam', 'menu', 'akses']), 4.5],
      [/game|permainan|main|bermain|multiplayer|rpg/, new Set(['games', 'game', 'player', 'mission', 'multi', 'pr', 'pixelrealm']), 4.5],
      [/anime|otaku|sinopsis/, new Set(['anime']), 5.5],
      [/design battle|kompetisi desain|lomba desain|tantangan grup|battle desain/, new Set(['designchallenge']), 5.8],
      [/design season|season desain|kompetisi beberapa ronde|lomba desain bertahap|kompetisi ronde/, new Set(['designseason']), 5.9],
      [/simpan aset|koleksi aset desain|asset library|bagikan referensi desain|kelola aset desain/, new Set(['assetstudio']), 5.6],
      [/profil kontribusi|kontribusi desainer|milestone komunitas|badge komunitas|perkembangan desainer|growth insights/, new Set(['designcommunity', 'designchallenge']), 5.3],
      [/learning cohort|kelompok belajar|kelas desain|milestone belajar|check.in belajar/, new Set(['cohort', 'designlearn', 'designcommunity']), 5.5],
      [/format media|format video|format audio|cek format|estimasi ukuran media/, new Set(['mediaformat', 'dl', 'download']), 5.2],
      [/status proteksi|status moderasi|pengaturan grup|preset proteksi|keamanan grup/, new Set(['modstatus', 'modpreset', 'antilink', 'antispam']), 5.2],
      [/voice|voice note|efek suara|efek audio|bass|treble|reverb|echo|karaoke|chipmunk|robot|tempo|8d/, new Set(['voice', 'bass', 'treble', 'echo', 'reverb', 'karaoke', 'tempo']), 6.1],
      [/cuaca|weather|hujan|suhu|kelembapan|prakiraan cuaca/, new Set(['cuaca', 'weather']), 6.2],
      [/gempa|magnitudo|bmkg|gempa bumi/, new Set(['gempa']), 6.2],
      [/musik|music|lagu|song|play|audio|album|penyanyi|artis|soundtrack/, new Set(['music', 'song', 'play', 'lagu', 'dl', 'download']), 5.8],
      [/download|unduh|video|media|youtube|tiktok|instagram/, new Set(['dl', 'download', 'music', 'song']), 4.8],
      [/favorit|pintasan|shortcut|riwayat|terakhir|recent|favorite|favorites|perintah yang sering/, new Set(['cepat']), 7],
    ];
    for (const [pattern, commands, bonus] of intentRules) {
      if (pattern.test(normalized) && commands.has(command)) score += bonus;
    }

    // Prefer canonical actionable commands over aliases and navigation-only entries.
    if (/\balias\b/i.test(description) || /^alias\b/i.test(String(item.permission || ''))) score -= 5;
    if (/poster|flyer|pamflet|logo|desain|design|bikin|buat|membuat/.test(normalized) && command === 'wizard') score += 5;
    if (['help', 'menu', 'commands', 'perintah', 'daftarperintah', 'cari'].includes(command)) score -= 8;
    return { ...item, score: Number(score.toFixed(2)) };
  }).filter(item => item.score >= 1.5);

  return results
    .sort((a, b) => b.score - a.score || String(a.command).localeCompare(String(b.command), 'id'))
    .slice(0, Math.max(1, Math.min(Number(limit) || 8, 12)));
}
