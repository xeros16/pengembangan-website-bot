function clean(value, max) {
  return String(value ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

export function isPrivateNotificationContext(ctx = {}) {
  return !ctx.isGroup && !String(ctx.remoteJid || '').endsWith('@g.us');
}

export function formatWebsiteNotificationRows(rows = [], profileName = 'Designer', mode = 'unread', unreadCount = 0) {
  const dateText = value => {
    if (!value) return 'Waktu tidak tersedia';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Waktu tidak tersedia';
    return date.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium', timeStyle: 'short' });
  };
  const lines = rows.map((row, index) => {
    const title = clean(row.title || 'Notifikasi website', 120);
    const message = clean(row.message || '', 500);
    return `${index + 1}. *${title}*\n${message ? `${message}\n` : ''}${dateText(row.createdAt)}${row.readAt ? ' · dibaca' : ' · baru'}`;
  });
  return `🔔 *NOTIFIKASI DESIGNER STUDIO*\n${clean(profileName, 80)} · ${rows.length} notifikasi${mode === 'all' ? ' terbaru' : ' baru'}\n\n${lines.join('\n\n')}\n\n${mode === 'all' ? 'Gunakan .portfolio notifikasi untuk membaca notifikasi baru.' : `Sisa notifikasi belum dibaca: ${Math.max(0, Number(unreadCount) || 0)}.`}`;
}
