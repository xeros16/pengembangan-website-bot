import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const text = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const boot = text('pir-intro-boot.js');
const intro = text('pir-intro-experience.js');
const server = text('server.js');

function makeBoot({path='/', seen=false, reduced=false, storageFailure=false}={}) {
 const classes=new Set();
 const data=new Map(seen ? [['pir-intro-seen-v20261114q','1']] : []);
 const sandbox={
   location:{pathname:path,search:''},
   sessionStorage:{getItem:key=>{if(storageFailure) throw Error('blocked');return data.get(key);},setItem:(key,value)=>{if(storageFailure)throw Error('blocked');data.set(key,value);}},
   window:{matchMedia:()=>({matches:reduced})},
   document:{documentElement:{classList:{add:(cls)=>classes.add(cls)}}},
   performance:{now:()=>40},URLSearchParams,
 };
 runInNewContext(boot,sandbox);
 return {classes,data};
}
test('intro activates only on first public-page visit',()=>{
 const first=makeBoot();assert(first.classes.has('pv-intro-active'));
 assert.equal(first.data.get('pir-intro-seen-v20261114q'),'1');
 assert.equal(makeBoot({seen:true}).classes.size,0);
 assert.equal(makeBoot({path:'/studio'}).classes.size,0);
});
test('intro never covers page when reduced motion or sessionStorage is unavailable',()=>{
 assert.equal(makeBoot({reduced:true}).classes.size,0);
 assert.equal(makeBoot({storageFailure:true}).classes.size,0);
});
test('intro dismissal removes blocking state and hides overlay',()=>{
 const set=new Set(['pv-intro-active']);
 const classList={contains:k=>set.has(k),add:k=>set.add(k),remove:(...keys)=>keys.forEach(k=>set.delete(k))};
 let skip=null;const scheduled=[];
 const overlay={hidden:false,offsetWidth:100,querySelector:()=>({addEventListener:(event,fn)=>{if(event==='click')skip=fn;}})};
 const listeners={};
 const w={__pvIntroStartedAt:30,location:{href:'http://localhost:3080/'},setTimeout:(fn,ms)=>{scheduled.push({fn,ms});return scheduled.length;},clearTimeout:()=>{},addEventListener:(name,fn)=>{listeners[name]=fn;},removeEventListener:()=>{}};
 const doc={documentElement:{classList},getElementById:()=>overlay,addEventListener:()=>{},readyState:'complete'};
 runInNewContext(intro,{window:w,document:doc,performance:{now:()=>50}});
 assert.equal(typeof skip,'function');skip();
 assert(set.has('pv-intro-exit'));
 for(const t of scheduled){if(t.ms===620)t.fn();}
 assert.equal(overlay.hidden,true);assert.equal(set.has('pv-intro-active'),false);
});
test('new resources are linked in HTML shell and allowed by static route',()=>{
 for(const file of ['pir-intro-experience.css','pir-intro-boot.js','pir-intro-experience.js','pir-intro-sticker.svg','pir-creative-studio-layout.css']) assert(server.includes(file));
 assert(server.includes('id="pv-intro-overlay"'));
 assert(server.includes('id="main-content"'));
 assert(server.includes("script-src 'self'"));
});
test('FAQ typography is consistent without overriding editorial section heading',()=>{
 const css=text('pir-intro-experience.css');
 assert.match(css,/\.pv-faq-list details\s*>\s*summary/);
 assert.match(css,/Trebuchet MS/);
 assert.match(css,/font-weight:600 !important/);
 assert.doesNotMatch(css,/\.pv-faq\s+h2\s*\{/);
});
