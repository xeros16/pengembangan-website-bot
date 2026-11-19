const fs = require('fs');
const path = require('path');
const s = fs.readFileSync('server.js','utf8');
const rawCSS = [...s.slice(0,s.indexOf('</style><link rel="stylesheet"')).matchAll(/<style>([\s\S]*?)<\/style>/g)].map(m=>m[1]);
console.log('inline layers',rawCSS.length, rawCSS.map(x=>x.length));
const original = s.slice(s.indexOf('function renderInfoPage('),s.indexOf('\nfunction renderMoodboardPage('));
const escapeHtml = txt=>String(txt).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const renderInfoPage = Function('escapeHtml','pageShell', original+';return renderInfoPage;')(escapeHtml, (_title,body)=>body);
const business = renderInfoPage('for-business');
const shortlistMatch=s.match(/const body = `(<section class="shortlist-hero"[\s\S]*?)`;/);
if(!shortlistMatch)throw new Error('no shortlist');
const shortlist=shortlistMatch[1];
const directory=`<section class="hero"><span class="eyebrow">Creative talent directory</span><h1>Temukan desainer yang tepat untuk ide besarmu.</h1><p class="muted">Jelajahi portfolio, bandingkan skill dan harga, lalu hubungi desainer secara langsung tanpa perantara.</p><div class="stat-grid"><div class="stat"><strong>0</strong><span class="muted">Desainer publik</span></div><div class="stat"><strong>0</strong><span class="muted">Profil ditinjau PIR</span></div><div class="stat"><strong>0</strong><span class="muted">Workspace brief aktif</span></div></div></section><section class="pv-match-finder"><div class="pv-match-finder-copy"><span class="eyebrow">GUIDED FINDER</span><h2>Mulai dari kebutuhanmu.</h2><p>Pilih spesialis sesuai gaya dan layanan.</p></div><form class="pv-match-finder-form"><label>Bidang yang kamu butuhkan<select><option>Pilih kategori</option></select></label><label>Lokasi<input placeholder="Bandung"></label></form></section><section class="pv-discovery-shell"><div class="section-head"><div><span class="eyebrow">SMART DISCOVERY</span><h2>Cari talenta</h2><p class="muted">Gunakan filter untuk menemukan kecocokan.</p></div></div><form class="search-panel pv-discovery-filters"><label>Kata kunci<input placeholder="Nama, skill"></label></form><section class="section-head"><h2>Desainer pilihan</h2></section><div class="card empty-state"><h2>Direktori sedang menanti karya pertamanya</h2><p class="muted">Belum ada profil publik.</p><a class="btn" href="#">Mulai membangun profil</a></div></section>`;
const nav=`<header class="site-nav"><a class="brand" href="/"><span class="brand-emblem">◉</span><span class="brand-copy"><strong>PIR VISUALS</strong><small>CREATIVE TALENT NETWORK</small></span></a><nav class="nav-links"><div class="nav-primary"><a href="/">Beranda</a><a href="/discover">Jelajahi</a><a href="/for-business">Untuk Bisnis</a></div></nav></header>`;
const links=['visual-system.css','editorial-theme.css','company-editorial.css','pir-permanent-theme.css','pir-footer-refinement.css','pir-motion-refinement.css','pir-motion-polish.css','pir-site-consistency.css','pir-intro-experience.css','pir-party-paper.css','pir-page-harmony.css'].map(f=>`<link rel="stylesheet" href="/${f}">`).join('');
for(const [name,html] of Object.entries({business,shortlist,directory})) {
  const file = `<!doctype html><html lang="id" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">${rawCSS.map(x=>`<style>${x}</style>`).join('')}${links}</head><body><main id="main-content" class="wrap">${nav}${html}</main></body></html>`;
  fs.mkdirSync('qa-public',{recursive:true});fs.writeFileSync(`qa-public/${name}.html`,file);console.log(name,html.length);
}
