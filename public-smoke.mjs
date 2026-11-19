process.env.PORTFOLIO_WEB_HOST='127.0.0.1';
process.env.PORTFOLIO_WEB_PORT='39837';
process.env.PORTFOLIO_PUBLIC_BASE_URL='http://127.0.0.1:39837';
const { startPublicPortfolioServer } = await import('./portfolio-website/server.js');
const server = startPublicPortfolioServer();
for (const path of ['/about','/how-it-works','/for-business','/privacy','/contact','/company-editorial.css']) {
 const r=await fetch('http://127.0.0.1:39837'+path);
 const body=await r.text();
 console.log(path,r.status,body.length,(path.includes('css')?'company-editorial-hero':path.includes('business')?'Solusi kreatif':'PIR Visuals'),body.includes(path.includes('css')?'company-editorial-hero':path.includes('business')?'Solusi kreatif':'PIR Visuals'));
 if(r.status!==200)process.exitCode=1;
}
await new Promise(r=>server.close(r));
