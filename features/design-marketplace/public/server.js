import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { DesignerProfile, PortfolioItem, DesignService } from '../../../models/design-marketplace.js';
import { DesignerAnalytics } from '../../../models/designer-growth.js';

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]);
const money = value => Number(value) > 0 ? `Rp${Math.round(Number(value)).toLocaleString('id-ID')}` : 'Negosiasi';
const translations = {
  id: { portfolio: 'Portofolio', skills: 'Keahlian', pricing: 'Layanan & Harga', contact: 'Hubungi desainer', available: 'Menerima proyek', unavailable: 'Belum menerima proyek', works: 'Karya pilihan', verified: 'Profil ditinjau PIR', featured: 'Desainer unggulan', empty: 'Belum ada karya yang dipublikasikan.' },
  en: { portfolio: 'Portfolio', skills: 'Skills', pricing: 'Services & Pricing', contact: 'Contact designer', available: 'Available for projects', unavailable: 'Not accepting projects', works: 'Selected work', verified: 'PIR-reviewed profile', featured: 'Featured designer', empty: 'No published work yet.' },
};

function pageShell(title, body) {
  return `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#10131b"><title>${escapeHtml(title)}</title><style>
  :root{color-scheme:dark}*{box-sizing:border-box}body{margin:0;background:#0c1018;color:#edf1f7;font:16px/1.6 Inter,system-ui,sans-serif}.wrap{max-width:980px;margin:auto;padding:28px 18px 60px}.card{background:#151c28;border:1px solid #273244;border-radius:18px;padding:22px;margin:16px 0}.muted{color:#aab5c5}.tag{display:inline-block;background:#202c3e;border-radius:99px;padding:5px 11px;margin:4px;font-size:13px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px}.work{overflow:hidden;padding:0}.work img{width:100%;aspect-ratio:4/3;object-fit:cover;background:#222}.work div{padding:14px}.price{font-weight:700;color:#9bd7c2}a{color:#9bd7c2;text-decoration:none}.btn{display:inline-block;background:#1c8c68;color:white;padding:11px 18px;border-radius:10px;font-weight:700}.hero{padding:30px 0}.hero h1{font-size:clamp(30px,6vw,48px);line-height:1.1;margin:0 0 12px}.status{font-size:14px}.foot{color:#8290a3;text-align:center;font-size:13px;margin-top:32px}
  </style></head><body><main class="wrap">${body}<footer class="foot">Portfolio directory • PIR Visuals · Pemesanan dan pembayaran dilakukan langsung dengan desainer.</footer></main></body></html>`;
}

export function startPublicPortfolioServer() {
  if (globalThis.__designerPortfolioServer) return globalThis.__designerPortfolioServer;
  const port = Math.max(1, Math.min(65535, Number(process.env.PORTFOLIO_WEB_PORT || 3080)));
  const host = process.env.PORTFOLIO_WEB_HOST || '0.0.0.0';
  const publicBase = String(process.env.PORTFOLIO_PUBLIC_BASE_URL || `http://localhost:${port}`).replace(/\/$/, '');
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', publicBase);
      const parts = url.pathname.split('/').filter(Boolean);
      if (parts[0] === 'health') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ ok: true, service: 'designer-portfolio' })); }
      if (parts[0] === 'qr' && parts[1]) {
        const profile = await DesignerProfile.findOne({ designerId: parts[1].toUpperCase(), isPublic: true }).lean();
        if (!profile) { res.writeHead(404); return res.end('Not found'); }
        const target = `${publicBase}/designer/${encodeURIComponent(profile.designerId)}`;
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=12&data=${encodeURIComponent(target)}`;
        res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'content-security-policy': "default-src 'self'; img-src https://api.qrserver.com; style-src 'unsafe-inline'" });
        return res.end(pageShell(`QR ${profile.displayName}`, `<section class="card" style="text-align:center"><h1>QR Portfolio</h1><p>${escapeHtml(profile.displayName)}</p><img width="320" height="320" alt="QR portfolio" src="${qrUrl}"><p><a href="${target}">${target}</a></p><p class="muted">QR dibuat oleh layanan QR pihak ketiga.</p></section>`));
      }
      if (parts[0] === 'contact' && parts[1]) {
        const profile = await DesignerProfile.findOne({ designerId: parts[1].toUpperCase(), isPublic: true, acceptsOrders: true }).lean();
        if (!profile || !/^\d{8,15}$/.test(String(profile.contactPhone || ''))) { res.writeHead(404); return res.end('Contact unavailable'); }
        await DesignerAnalytics.updateOne({ designerId: profile.designerId }, { $inc: { contactClicks: 1 }, $set: { lastViewedAt: new Date() } }, { upsert: true });
        res.writeHead(302, { location: `https://wa.me/${profile.contactPhone}` }); return res.end();
      }
      if (parts[0] === 'media' && parts[1]) {
        const item = await PortfolioItem.findOne({ itemId: parts[1].toUpperCase(), moderationStatus: 'approved' }).lean();
        if (!item) { res.writeHead(404); return res.end('Not found'); }
        const uploadRoot = path.resolve(process.cwd(), process.env.PORTFOLIO_UPLOAD_DIR || 'uploads/portfolio');
        const file = path.resolve(process.cwd(), item.imagePath || '');
        if (!file.startsWith(`${uploadRoot}${path.sep}`)) { res.writeHead(404); return res.end('Not found'); }
        const ext = path.extname(file).toLowerCase();
        const type = ({ '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' })[ext];
        if (!type || !fs.existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
        await DesignerAnalytics.updateOne({ designerId: item.designerId }, { $inc: { portfolioViews: 1 } }, { upsert: true });
        res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
        return fs.createReadStream(file).pipe(res);
      }
      if (parts[0] !== 'designer' || !parts[1]) { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pageShell('PIR Visuals — Designer Directory', `<section class="hero"><h1>Temukan desainer kreatif.</h1><p class="muted">Portofolio, keahlian, layanan, dan harga dari komunitas desainer.</p><p>Gunakan bot WhatsApp untuk mencari desainer, atau buka tautan profil publik yang dibagikan oleh desainer.</p></section>`)); }
      const profile = await DesignerProfile.findOne({ designerId: parts[1].toUpperCase(), isPublic: true }).lean();
      if (!profile) { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); return res.end(pageShell('Profil tidak ditemukan', '<h1>Profil tidak tersedia</h1><p class="muted">Profil mungkin disembunyikan atau tidak ditemukan.</p>')); }
      const lang = url.searchParams.get('lang') === 'en' ? 'en' : (profile.language === 'en' ? 'en' : 'id');
      const t = translations[lang];
      await DesignerAnalytics.updateOne({ designerId: profile.designerId }, { $inc: { profileViews: 1, 'daily.$[day].views': 1 }, $set: { lastViewedAt: new Date() }, $setOnInsert: { designerId: profile.designerId } }, { arrayFilters: [{ 'day.date': new Date().toISOString().slice(0, 10) }], upsert: true }).catch(async () => DesignerAnalytics.updateOne({ designerId: profile.designerId }, { $inc: { profileViews: 1 }, $set: { lastViewedAt: new Date() } }, { upsert: true }));
      const [works, services, analytics] = await Promise.all([
        PortfolioItem.find({ designerId: profile.designerId, moderationStatus: 'approved' }).sort({ featured: -1, createdAt: -1 }).limit(24).lean(),
        DesignService.find({ designerId: profile.designerId, isActive: true }).sort({ price: 1 }).limit(20).lean(),
        DesignerAnalytics.findOne({ designerId: profile.designerId }).lean(),
      ]);
      const chips = (profile.specialties || []).map(s => `<span class="tag">${escapeHtml(s)}</span>`).join('');
      const workCards = works.map(w => `<article class="card work"><img loading="lazy" src="/media/${encodeURIComponent(w.itemId)}" alt="${escapeHtml(w.title)}"><div><strong>${escapeHtml(w.title)}</strong><p class="muted">${escapeHtml(w.category)} · ${escapeHtml((w.styles || []).join(', '))}</p><span class="price">${money(w.priceFrom)}</span></div></article>`).join('');
      const serviceCards = services.map(s => `<article class="card"><strong>${escapeHtml(s.title)}</strong><p class="muted">${escapeHtml(s.packageName)} · ${escapeHtml(s.category)}</p><p>${escapeHtml(s.description)}</p><p class="price">${money(s.price)}</p><p class="muted">${s.deliveryDays} days · ${s.revisionCount} revisions</p></article>`).join('');
      const badges = `${profile.isVerified ? `<span class="tag" title="Profil ditinjau tim PIR; bukan verifikasi transaksi">✓ ${t.verified}</span>` : ''}${profile.isFeatured ? `<span class="tag">★ ${t.featured}</span>` : ''}`;
      const contact = profile.acceptsOrders && profile.contactPhone ? `<a class="btn" href="/contact/${encodeURIComponent(profile.designerId)}">${t.contact} ↗</a>` : `<span class="muted">${t.unavailable}</span>`;
      const body = `<section class="hero"><div>${badges}</div><h1>${escapeHtml(profile.displayName)}</h1><p class="muted">${escapeHtml(profile.experience || '')}${profile.location ? ` · ${escapeHtml(profile.location)}` : ''}</p><p>${escapeHtml(profile.bio || '')}</p><div>${chips}</div><p class="status">${profile.acceptsOrders ? `🟢 ${t.available}` : `⚪ ${t.unavailable}`}</p>${contact}</section><section class="card"><h2>${t.skills}</h2><p>${chips || '—'}</p><p class="muted">${escapeHtml(profile.softwareSkills || '')}</p><p class="muted">Harga mulai: ${money(profile.priceMin)}${profile.priceMax ? ` – ${money(profile.priceMax)}` : ''}</p></section><h2>${t.works}</h2><section class="grid">${workCards || `<p class="muted">${t.empty}</p>`}</section><h2>${t.pricing}</h2><section class="grid">${serviceCards || '<p class="muted">Belum ada layanan aktif.</p>'}</section><section class="card"><p class="muted">${lang === 'en' ? 'Profile views' : 'Dilihat'}: ${analytics?.profileViews || 0} · ${lang === 'en' ? 'Portfolio views' : 'Preview karya'}: ${analytics?.portfolioViews || 0}</p><a href="?lang=id">Indonesia</a> · <a href="?lang=en">English</a></section>`;
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'self'; img-src 'self' data:; style-src 'unsafe-inline'" });
      return res.end(pageShell(`${profile.displayName} — Portfolio`, body));
    } catch (error) { console.error('[PORTFOLIO WEB]', error.message); res.writeHead(500, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('Internal server error'); }
  });
  server.listen(port, host, () => console.log(`[PORTFOLIO WEB] Listening on ${host}:${port} · public base ${publicBase}`));
  server.on('error', error => console.error('[PORTFOLIO WEB ERROR]', error.message));
  globalThis.__designerPortfolioServer = server;
  return server;
}
