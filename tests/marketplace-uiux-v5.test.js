import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../features/design-marketplace/index.js', import.meta.url), 'utf8');
const readme = fs.readFileSync(new URL('../features/design-marketplace/README.md', import.meta.url), 'utf8');
test('v5.91 Owner dashboard has directory-only help and pagination', () => {
  assert.match(source, /ctx\.isBotOwner\(ctx\.userJid, ctx\.senderIdentityAliases\)/);
  assert.match(source, /const pageSize = 8/);
  for (const command of ['designers', 'pending', 'reports', 'activity']) assert.ok(source.includes(`marketadmin ${command}`));
  assert.match(readme, /portfolio and direct-contact directory/i);
});
test('designer search keeps non-wrapping previous/next pagination', () => {
  assert.match(source, /\['next', 'prev'\]\.includes\(sub\)/);
  assert.match(source, /state\.page < 0/);
  assert.match(source, /state\.page >= pageCount/);
  assert.match(source, /Kamu berada di halaman terakhir/);
});
test('profile onboarding collects opt-in public contact instead of pricing', () => {
  assert.match(source, /Pendaftaran profil portofolio/);
  assert.match(source, /publicWhatsApp/);
  assert.match(source, /Nomor WhatsApp yang ingin ditampilkan pada profil publik/);
  assert.doesNotMatch(source, /wizard\.step === 'priceMin'|wizard\.step === 'priceMax'/);
  assert.match(source, /Nomor ini akan dapat dihubungi siapa pun yang melihat profilmu/);
});
test('legacy order commands are redirected to direct portfolio discovery', () => {
  assert.match(source, /ctx\.command === 'requestdesign'/);
  assert.match(source, /ctx\.command === 'client' \|\| ctx\.command === 'klien'/);
  assert.match(source, /Tidak ada payment atau transaksi melalui bot/);
  assert.match(readme, /checkout, payment gateway, manual payment ledger/i);
});


test('designer can hide a public profile without membership, while publishing requires membership', () => {
  const start = source.indexOf("if (sub === 'status') {");
  const end = source.indexOf("if (sub === 'verified'", start);
  const statusHandler = source.slice(start, end);
  assert.match(statusHandler, /status === 'on' && !await requireMember\(ctx\)/);
  assert.doesNotMatch(statusHandler, /if \(!await requireMember\(ctx\)\)/);
});
