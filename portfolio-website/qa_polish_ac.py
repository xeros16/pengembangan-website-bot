import re, json
from pathlib import Path
from playwright.sync_api import sync_playwright
src=Path('server.js').read_text()
raw_css=re.findall(r'<style>(.*?)</style>',src[:src.index('</style><link rel="stylesheet"')+8],flags=re.S)
css_links=['visual-system.css','editorial-theme.css','company-editorial.css','pir-permanent-theme.css','pir-footer-refinement.css','pir-motion-refinement.css','pir-motion-polish.css','pir-site-consistency.css','pir-intro-experience.css','pir-party-paper.css','pir-page-harmony.css','pir-public-polish.css']
nav='<header class="site-nav"><div class="brand"><span>PIR VISUALS</span></div></header>'
manifesto='<section class="pv-home"><section class="pv-manifesto"><div class="pv-manifesto-copy"><p>Kerja yang bermakna.</p><div class="pv-manifesto-points"><div><b>01</b><span>Jelajahi karya dan profil</span></div><div><b>02</b><span>Bandingkan layanan dan harga</span></div><div><b>03</b><span>Hubungi desainer secara langsung</span></div></div></div></section></section>'
support='<section class="support-hero"><div class="support-hero-main"><span class="eyebrow">PIR VISUALS · CUSTOMER CARE</span><h1>Let’s make<br><em>things clearer.</em></h1><p>Ada pertanyaan tentang akun, portfolio, kerja sama, atau penggunaan platform?</p><div class="support-hours">JAM LAYANAN · Senin–Jumat</div></div><aside class="support-hero-aside"><span class="support-aside-index">SUPPORT / 01</span><strong>Help for every part of your creative journey.</strong></aside></section>'
category='<header class="category-intro"><div class="category-intro-copy"><span class="eyebrow">THE CREATIVE INDEX / PIR VISUALS</span><h1>Find your creative language.</h1><p>Jelajahi setiap bidang kreativitas</p></div><aside class="category-intro-note">Creative disciplines</aside></header>'
shortlist='<section class="shortlist-hero"><span class="eyebrow">Your shortlist</span><h1>Desainer favoritmu.</h1><p>Bandingkan dan simpan karya.</p></section><section class="shortlist-results"><div class="shortlist-toolbar"><h2>0 designers selected</h2><button>Hapus semua</button></div><div id="shortlist-results"><div class="empty-state"><h2>Shortlist kamu masih kosong</h2><p>Tambahkan desainer.</p></div></div></section>'
with sync_playwright() as p:
 b=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 results=[]
 for width in [390,768,1365,1920]:
  page=b.new_page(viewport={'width':width,'height':920},device_scale_factor=1)
  for key,body in [('contact',support),('categories',category),('shortlist',shortlist),('home',manifesto)]:
   html='<!DOCTYPE html><html data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'+''.join('<style>'+v+'</style>' for v in raw_css)+''.join('<style>'+Path(css).read_text()+'</style>' for css in css_links)+'</head><body><main class="wrap" id="main-content">'+nav+body+'</main></body></html>'
   page.set_content(html,wait_until='load')
   page.wait_for_timeout(50)
   out=page.evaluate('''(key)=>{const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,left:r.left,right:r.right,top:r.top,bottom:r.bottom}};const css=s=>{const e=document.querySelector(s);if(!e)return {};const v=getComputedStyle(e);return {color:v.color,fill:v.webkitTextFillColor,background:v.backgroundColor,gap:v.rowGap,animation:v.animationName,opacity:v.opacity}};return {key,width:innerWidth,scrollWidth:document.documentElement.scrollWidth,contact:css('.support-hero-main h1'),contactEm:css('.support-hero-main em'),support:rect('.support-hero'),cat:rect('.category-intro'),shortHero:rect('.shortlist-hero'),shortResults:rect('.shortlist-results'),manifesto:Array.from(document.querySelectorAll('.pv-manifesto-points>div')).map(e=>{const r=e.getBoundingClientRect(),t=e.querySelector('span').getBoundingClientRect();return {top:r.top,bottom:r.bottom,textCenter:t.top+t.height/2,rowCenter:r.top+r.height/2,delta:+((t.top+t.height/2)-(r.top+r.height/2)).toFixed(2),height:r.height}}),list:css('.pv-manifesto-points'),animation:css('.category-intro::before')}}''',key)
   results.append(out)
   if width==1365 and key in ['contact','categories','shortlist']:
    page.screenshot(path=f'qa_ac_{key}_1365.png')
  page.close()
 b.close()
print(json.dumps(results,indent=2))
