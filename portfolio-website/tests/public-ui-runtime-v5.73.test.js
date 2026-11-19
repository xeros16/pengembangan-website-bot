import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const marker = "if (parts[0] === 'public-ui.js') return res.end(`";
const templateStart = source.indexOf(marker);
assert.notEqual(templateStart, -1, 'public-ui.js route must exist');
const contentStart = templateStart + marker.length;
let templateEnd = -1;
for (let index = contentStart; index < source.length; index += 1) {
  if (source[index] !== '`') continue;
  let backslashes = 0;
  for (let cursor = index - 1; cursor >= contentStart && source[cursor] === '\\'; cursor -= 1) backslashes += 1;
  if (backslashes % 2 === 0 && source.slice(index + 1, index + 3) === ');') {
    templateEnd = index;
    break;
  }
}
assert.notEqual(templateEnd, -1, 'public-ui.js template must close cleanly');
const emittedScript = vm.runInNewContext('`' + source.slice(contentStart, templateEnd) + '`', {});

test('the JavaScript actually emitted by the public-ui route parses successfully', () => {
  assert.doesNotThrow(() => new vm.Script(emittedScript));
});

test('quick-view avatar validation keeps HTTPS and same-origin profile paths after template interpolation', () => {
  assert.ok(emittedScript.includes(String.raw`const safeAvatar=/^https:\/\//i.test(avatar)||/^\/profile-avatar\/DSN-`));
  assert.ok(emittedScript.includes(String.raw`(?:\?v=[A-Za-z0-9_.-]+)?$/i.test(avatar)`));
});

test('motion preference is initialized before selected-work filtering', () => {
  assert.ok(emittedScript.indexOf('const motionReduced=') < emittedScript.indexOf("const workExplorer=document.querySelector('[data-pv-work-explorer]')"));
  assert.ok(emittedScript.includes('cards.forEach((card,index)=>{'));
});

test('Lainnya disclosure updates aria-expanded synchronously', () => {
  assert.ok(emittedScript.includes("navMoreSummary?.addEventListener('click',event=>{event.preventDefault();navMore.open=!navMore.open;syncNavMore();});"));
});
