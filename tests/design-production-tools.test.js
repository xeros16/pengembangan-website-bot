import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildTypographyPairingStudio, buildLayoutStudio, buildSocialKit,
  searchDesignResources, formatDesignResourceResults,
} from '../features/design-studio/production-toolkit.js';
import { handleDesignProductionCommands, DESIGN_PRODUCTION_COMMANDS } from '../features/commands/design-production-tools.js';

test('empat perintah studio terdaftar dalam katalog dan router', () => {
  for (const command of ['fontstudio', 'layoutstudio', 'socialkit', 'resourcefind']) {
    assert.ok(DESIGN_PRODUCTION_COMMANDS.has(command));
  }
});

test('typography pairing memilih mood dan jenis desain serta menyertakan hierarki', () => {
  const result = buildTypographyPairingStudio(['elegan', 'poster']);
  assert.match(result, /Playfair Display/);
  assert.match(result, /Inter/);
  assert.match(result, /HIERARKI|Contoh hierarki/i);
  assert.match(result, /40–56 px/);
  assert.match(buildTypographyPairingStudio(['futuristik']), /Space Grotesk/);
});

test('layout studio menyediakan grid dan komposisi untuk empat jenis', () => {
  for (const kind of ['poster', 'feed', 'banner', 'web']) {
    const result = buildLayoutStudio([kind]);
    assert.match(result, /Grid:/);
    assert.match(result, /Urutan hierarki:/);
    assert.doesNotMatch(result, /undefined|NaN/);
  }
  assert.match(buildLayoutStudio(['unknown']), /Pilih jenis/);
});

test('social toolkit mencakup preset kanal, safe area dan carousel', () => {
  const story = buildSocialKit(['instagram_story']);
  assert.match(story, /1080×1920/);
  assert.match(story, /Safe area/);
  assert.match(story, /carousel/);
  assert.match(buildSocialKit(['youtube_banner']), /1546×423/);
  assert.match(buildSocialKit(['unknown']), /SOCIAL MEDIA DESIGN TOOLKIT/);
});

test('resource finder mengelompokkan sumber dan mengingatkan pemeriksaan lisensi', () => {
  const fonts = searchDesignResources(['font']);
  assert.ok(fonts.rows.length >= 2);
  assert.match(formatDesignResourceResults(fonts), /Lisensi:/);
  assert.match(formatDesignResourceResults(fonts), /komersial/);
  assert.ok(searchDesignResources(['icon', 'ui']).rows.length >= 1);
  assert.match(formatDesignResourceResults(searchDesignResources(['bad'])), /Kategori:/);
});

test('command handler mengirim hasil ke reply', async () => {
  let output = '';
  await handleDesignProductionCommands({ command: 'layoutstudio', args: ['web'], reply: async value => { output = value; } });
  assert.match(output, /WEBSITE/);
});
