export function shouldSendGroupGreeting(action, group = {}) {
  if (action === 'add') return group.welcomeEnabled !== false;
  if (action === 'remove') return group.goodbyeEnabled === true;
  return false;
}

export function buildGroupGreeting({ action, participant, groupName, rules, template }) {
  const isWelcome = action === 'add';
  const defaultText = isWelcome
    ? `👋 Selamat datang di *${groupName || 'grup'}*!\n\nBaca aturan grup berikut:\n{rules}\n\nBaru bergabung? Ketik .mulai untuk panduan sesuai kebutuhanmu. Gunakan .menu untuk melihat kategori, .cari <kebutuhan> untuk menemukan fitur, dan .rules untuk membaca aturan. Jika perlu bantuan, ketik .ticket buka <subjek>.`
    : `👋 {name} telah meninggalkan grup *{group}*!`;
  const message = typeof template === 'string' && template.trim() ? template.trim() : defaultText;
  return message
    .replaceAll('{name}', `@${String(participant || '').split('@')[0]}`)
    .replaceAll('{group}', groupName || 'grup')
    .replaceAll('{rules}', rules || 'Belum ada aturan grup.');
}
