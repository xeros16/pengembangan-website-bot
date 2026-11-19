// PIR Assistant is a deterministic intent router over the live command catalog.
// It recommends existing commands; it never executes a suggested action automatically.
import { COMMAND_CATALOG } from '../command-catalog.js';
import { searchCommandsByNeed } from '../command-suggestions.js';

export const PIR_ASSISTANT_COMMANDS = new Set(['asisten']);

function cleanQuery(value) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);
}

export function renderPirAssistantReply(rawQuery, prefix = '.', catalog = COMMAND_CATALOG) {
  const query = cleanQuery(rawQuery);
  if (!query) {
    return [
      '🤖 *PIR ASSISTANT*',
      '',
      'Ceritakan apa yang ingin kamu lakukan. Aku akan mencarikan fitur PIR yang paling relevan berdasarkan katalog perintah.',
      '',
      '*Contoh kebutuhan:*',
      `• ${prefix}asisten aku ingin membuat poster promosi`,
      `• ${prefix}asisten cari lagu dan informasi album`,
      `• ${prefix}asisten cari anime populer`,
      `• ${prefix}asisten unduh video dari tautan publik`,
      `• ${prefix}asisten belajar tipografi untuk pemula`,
      '',
      'Asisten ini memakai pencarian intent pada katalog, bukan AI generatif. Saran tidak menjalankan perintah secara otomatis.',
    ].join('\n');
  }

  const matches = searchCommandsByNeed(query, catalog, 5);
  if (!matches.length) {
    return [
      `🤖 *PIR ASSISTANT — ${query}*`,
      '',
      'Aku belum menemukan fitur yang cukup cocok.',
      `Coba sederhanakan kebutuhan atau gunakan ${prefix}cari ${query}.`,
      `Katalog lengkap: ${prefix}commands • Panduan: ${prefix}help <perintah>`,
    ].join('\n');
  }

  const [best, ...alternatives] = matches;
  const rows = [
    `🤖 *PIR ASSISTANT — ${query}*`,
    '',
    `*Rekomendasi utama: ${prefix}${best.command}*`,
    best.description,
    `Contoh: ${String(best.example || `${prefix}${best.command}`).replace(/(^|\s)\.(?=[a-zA-Z])/g, `$1${prefix}`)}`,
  ];
  if (alternatives.length) {
    rows.push('', '*Fitur terkait:*');
    for (const item of alternatives) {
      rows.push(`• *${prefix}${item.command}* — ${item.description}`);
    }
  }
  rows.push('', 'Pilih perintah yang sesuai untuk melanjutkan. Tidak ada tindakan yang dijalankan otomatis.');
  return rows.join('\n');
}

export async function handlePirAssistantCommand(ctx) {
  if (!PIR_ASSISTANT_COMMANDS.has(ctx.command)) return false;
  return ctx.reply(renderPirAssistantReply((ctx.args || []).join(' '), ctx.PREFIX || '.'));
}
