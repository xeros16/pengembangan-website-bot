import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const cardStart = source.indexOf('function designerCard(d) {');
const cardEnd = source.indexOf('async function renderDirectory(url)', cardStart);
const cardSource = source.slice(cardStart, cardEnd);
const marker = "if (parts[0] === 'public-ui.js') return res.end(`";
const start = source.indexOf(marker) + marker.length;
let end = -1;
for (let i = start; i < source.length; i += 1) {
  if (source[i] !== '`') continue;
  let slashes = 0;
  for (let j = i - 1; j >= start && source[j] === '\\'; j -= 1) slashes += 1;
  if (slashes % 2 === 0 && source.slice(i + 1, i + 3) === ');') { end = i; break; }
}
assert.notEqual(end, -1);
const publicUi = vm.runInNewContext('`' + source.slice(start, end) + '`', {});

 test('v5.81.0 advances platform, website, public asset and service-worker cache versions', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710','/public-ui.js?v=6710','/pwa-register.js?v=6710','/studio-upload.js?v=6712']) assert.ok(source.includes(asset));
});

test('public navigation assigns aria-current to the active route and parent destinations', () => {
  assert.ok(publicUi.includes("const currentPath=normalizePath(location.pathname)"));
  assert.ok(publicUi.includes("/^\\/(p|designer|work)\\//.test(currentPath)"));
  assert.ok(publicUi.includes("link.setAttribute('aria-current','page')"));
  assert.ok(publicUi.includes("navMore?.classList.toggle('has-current'"));
  assert.ok(source.includes('.nav-primary>a[aria-current="page"]'));
});

test('route matcher marks nested portfolio and support destinations in the correct navigation group', () => {
  const start = publicUi.indexOf("const nav=document.getElementById('main-nav');");
  const end = publicUi.indexOf('const syncNavMore=', start);
  const initializer = publicUi.slice(start, end);
  const makeNavigation = () => {
    const links = ['/', '/discover', '/categories', '/collections', '/favorites', '/shortlist', '/about', '/how-it-works', '/client', '/contact', '/studio'].map(href => ({ href, attrs: {}, getAttribute(){return this.href;}, setAttribute(k,v){this.attrs[k]=v;}, removeAttribute(k){delete this.attrs[k];} }));
    const summary = { attrs:{}, setAttribute(k,v){this.attrs[k]=v;} };
    const navMore = { open:false, current:false, classList:{toggle(name,value){if(name==='has-current')navMore.current=value;}}, querySelector(selector){if(selector==='summary')return summary;if(selector==='a[aria-current="page"]')return links.find(link=>['/collections','/favorites','/shortlist','/about','/how-it-works','/client','/contact'].includes(link.href)&&link.attrs['aria-current']==='page')||null;return null;} };
    const nav = { querySelectorAll:()=>links, querySelector:selector=>selector==='.nav-more'?navMore:null };
    return {links,nav,navMore,summary,document:{getElementById:id=>id==='main-nav'?nav:null,querySelector:()=>null}};
  };
  const profile = makeNavigation();
  vm.runInNewContext(initializer, { document:profile.document, location:{pathname:'/work/ART-1001',origin:'https://pir.test'}, URL, window:{matchMedia:()=>({matches:false,addEventListener(){},addListener(){}})} });
  assert.equal(profile.links.find(link=>link.href==='/discover').attrs['aria-current'],'page');
  assert.equal(profile.navMore.current,false);
  const support = makeNavigation();
  vm.runInNewContext(initializer, { document:support.document, location:{pathname:'/contact',origin:'https://pir.test'}, URL, window:{matchMedia:()=>({matches:false,addEventListener(){},addListener(){}})} });
  assert.equal(support.links.find(link=>link.href==='/contact').attrs['aria-current'],'page');
  assert.equal(support.navMore.current,true);
});

test('discovery designer cards expose a consistent identity, availability, skills and price hierarchy', () => {
  for (const token of ['designer-card-cover','designer-card-portrait','designer-card-badges','designer-card-availability','designer-card-skills','designer-card-price','designer-card-profile-link']) assert.ok(cardSource.includes(token));
  for (const hook of ['data-pv-designer-preview','data-favorite=','data-shortlist=']) assert.ok(cardSource.includes(hook));
  assert.ok(cardSource.includes("/^https:\\/\\//i.test(String(d.avatarUrl || ''))"));
});

test('shared discovery surfaces use semantic tokens and remain responsive', () => {
  assert.ok(source.includes('/* PIR Visuals v5.76.0 — discovery cards, route awareness and shared page rhythm */'));
  for (const token of ['--surface','--surface-raised','--line','--muted','--accent-strong']) assert.ok(source.includes(`var(${token})`));
  assert.ok(source.includes('@media(max-width:900px){.designer-card-heading'));
  assert.ok(source.includes('@media(max-width:600px){#main-content>.hero'));
  assert.ok(source.includes('@media(prefers-reduced-motion:reduce){#main-content .designer-card'));
});

test('server entrypoint can be imported for isolated QA without auto-connecting to MongoDB', () => {
  assert.ok(source.includes("if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href)"));
  assert.ok(source.includes("main().catch(error =>"));
});
