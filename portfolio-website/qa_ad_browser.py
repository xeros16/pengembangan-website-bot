import asyncio, re, json, pathlib
from playwright.async_api import async_playwright
root=pathlib.Path(__file__).parent
src=(root/'server.js').read_text()
start=src.index('<style>',src.index('function pageShell'))+len('<style>')
end=src.index('</style><link rel="stylesheet" href="/visual-system.css',start)
inline=src[start:end]
csspaths=['visual-system.css','editorial-theme.css','company-editorial.css','pir-permanent-theme.css','pir-footer-refinement.css','pir-motion-refinement.css','pir-motion-polish.css','pir-site-consistency.css','pir-intro-experience.css','pir-party-paper.css','pir-page-harmony.css','pir-public-polish.css']
styles=''.join('<style>'+ (root/p).read_text()+'</style>' for p in csspaths)
nav='''<header class="site-nav">
<a class="brand" href="/"><img class="brand-emblem" src="/icon.svg"><span class="brand-copy"><strong>PIR VISUALS</strong><small>CREATIVE TALENT NETWORK</small></span></a>
<button class="nav-toggle" aria-expanded="true" aria-controls="main-nav"><span class="nav-toggle-label">Menu</span><span class="nav-toggle-icon">☰</span></button>
<nav class="nav-links open" id="main-nav"><div class="nav-primary"><a href="/" aria-current="page">Beranda</a><a href="/discover">Jelajahi</a><a href="/for-business">Untuk Bisnis</a><a href="/commands">Semua Fitur Bot</a></div>
<details class="nav-more" open><summary>Lainnya <span>⌄</span></summary><div class="nav-more-menu"><a href="/shortlist">Shortlist</a><a href="/categories">Kategori</a><a href="/about">Tentang</a></div></details>
<div class="nav-actions"><a href="/studio" class="nav-cta">Portal desainer ↗</a><button class="nav-action-button" data-command-open>Cari</button><button class="nav-action-button" data-motion-toggle>On</button></div></nav></header>'''
category='''<main class="category-editorial"><header class="category-intro"><div class="category-intro-copy"><span class="eyebrow">THE CREATIVE INDEX / PIR VISUALS</span><h1>Find your<br><em>creative language.</em></h1><p>Setiap kebutuhan visual punya pendekatan yang berbeda.</p></div><aside class="category-intro-note"><span>10 CREATIVE DISCIPLINES</span><strong>One idea.<br>Many ways to make it real.</strong><p>Jelajahi bidang kreatif.</p></aside></header></main>'''
shortlist='''<section class="shortlist-hero"><span class="eyebrow">CLIENT WORKSPACE</span><h1>Compare your<br><em>creative shortlist.</em></h1><p>Pilih maksimal empat desainer, bandingkan spesialisasi dan harga.</p><div class="shortlist-actions"><a href="/discover" class="btn btn-secondary">Temukan desainer</a></div></section><section class="shortlist-results"><div class="shortlist-toolbar"><div><span class="eyebrow">YOUR SELECTION</span><h2>0 designers selected</h2></div><button class="btn btn-secondary">Hapus semua</button></div><div id="shortlist-results"><div class="card empty-state"><h2>Shortlist kamu masih kosong</h2><p>Tambahkan desainer dari Discover.</p><a class="btn">Jelajahi desainer ↗</a></div></div></section>'''
head='<meta name="viewport" content="width=device-width,initial-scale=1"><base href="http://test.local/"><style>'+inline+'</style>'+styles

async def main():
  async with async_playwright() as p:
    browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-gpu'])
    rows=[]
    for name,body in [('category',category),('shortlist',shortlist)]:
      for width in [390,520,768,1365,1920]:
        pg=await browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
        await pg.route('**/pir-footer-seal.svg',lambda route: route.fulfill(status=200,body=(root/'pir-footer-seal.svg').read_text(),content_type='image/svg+xml'))
        await pg.set_content('<!doctype html><html lang="id" data-theme="light"><head>'+head+'</head><body><div id="pv-page-top"></div><main class="wrap" id="main-content">'+nav+body+'</main></body></html>',wait_until='domcontentloaded')
        await pg.wait_for_timeout(160)
        if width > 1180:
          await pg.evaluate("document.querySelector('.nav-links').classList.remove('open'); document.querySelector('.nav-more').removeAttribute('open');")
        result=await pg.evaluate('''(name)=>{
         const b=el=>{const r=el.getBoundingClientRect();return {x:Math.round(r.x),right:Math.round(r.right),width:Math.round(r.width),top:Math.round(r.top),bottom:Math.round(r.bottom)}};
         const n=document.querySelector('.nav-links'); const item=n.querySelector('.nav-primary a:nth-child(2)');const navStyle=getComputedStyle(n);
         const info={width:innerWidth,scrollWidth:document.documentElement.scrollWidth,menu:b(n),menuBg:navStyle.backgroundColor,menuColor:navStyle.color,linkColor:getComputedStyle(item).color,linkBg:getComputedStyle(item).backgroundColor};
         if(name==='category')info.category=b(document.querySelector('.category-intro'));
         else {const hero=document.querySelector('.shortlist-hero');const res=document.querySelector('.shortlist-results');info.hero=b(hero);info.results=b(res);info.gap=Math.round(res.getBoundingClientRect().top-hero.getBoundingClientRect().bottom);info.sealBackground=getComputedStyle(hero,'::after').backgroundImage;info.sealDisplay=getComputedStyle(hero,'::after').display;}
         return info;
        }''',name)
        rows.append({'route':name,**result})
        if width in (390,1365):
          await pg.screenshot(path=str(root/f'qa_ad_{name}_{width}.png'),full_page=True)
        await pg.close()
    await browser.close()
    (root/'qa_ad_results.json').write_text(json.dumps(rows,indent=2))
    print(json.dumps(rows,indent=2))
asyncio.run(main())
