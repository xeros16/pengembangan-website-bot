import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const get = file => fs.readFileSync(new URL('../' + file, import.meta.url), 'utf8');
const intro = get('pir-intro-experience.js');
const top = get('pir-back-to-top.js');
const html = get('server.js');
function harness({ active = false, path='/', url='http://localhost:3080/' } = {}) {
  const classes=new Set(active?['pv-intro-active']:[]), listeners={}, timers=new Map();
  let id=0, clock=2000, navigations=[];
  const overlay={ hidden: !active, offsetWidth:120, querySelector:()=>({addEventListener:(event,handler)=>{listeners['skip:'+event]=handler}}) };
  const root={classList:{contains:key=>classes.has(key),add:key=>classes.add(key),remove:(...keys)=>keys.forEach(key=>classes.delete(key))}};
  const window={__pvIntroStartedAt:active?1000:undefined,
    location:{pathname:path,href:url,assign:where=>navigations.push(where)},
    matchMedia:()=>({matches:false}),history:{state:null,replaceState:()=>{}},
    setTimeout:(fn,ms)=>{const key=++id;timers.set(key,{fn,ms});return key},clearTimeout:key=>timers.delete(key),
    addEventListener:(name,fn)=>{listeners['window:'+name]=fn},removeEventListener:()=>{}
  };
  const document={documentElement:root,getElementById:()=>overlay,
    addEventListener:(name,fn)=>{listeners['document:'+name]=fn}}
  const sessionStorage={setItem:()=>{}};
  vm.runInNewContext(intro,{document,window,sessionStorage,performance:{now:()=>clock},URL,Element:class{} });
  return {window,classes,listeners,timers,overlay,navigations,clock:(t)=>{clock=t},
    tick:(ms)=>{for(const [id,x] of [...timers])if(x.ms===ms){timers.delete(id);x.fn();return true;}return false;},
    clickLogo:()=>{let prevented=false;const el={closest:()=>({target:''})};
      const event={target:{parentElement:el},button:0,defaultPrevented:false,preventDefault:()=>{prevented=true}};
      listeners['document:click'](event);return prevented;}
  };
}
test('intro holds for 2.15s and closes after another 0.45s (2.6s total)',()=>{
  const x=harness({active:true});
  assert(x.classes.has('pv-intro-active'));
  assert([...x.timers.values()].some(t=>t.ms >= 1100 && t.ms <= 1250));
  assert(x.tick(1150), 'hold should account for the elapsed intro boot time');
  assert(x.classes.has('pv-intro-exit'));
  assert(x.tick(450));
  assert(!x.classes.has('pv-intro-active'));
  assert(x.overlay.hidden);
});
test('clicking brand on home reveals intro without reloading home',()=>{
  const x=harness();
  assert.equal(x.clickLogo(),true);
  assert(x.classes.has('pv-intro-active'));
  assert.equal(x.navigations.length,0);
  assert(x.tick(2150));
  assert(x.tick(450));
  assert.equal(x.navigations.length,0);
});
test('clicking brand from directory plays intro BEFORE redirecting',()=>{
  const x=harness({path:'/discover',url:'http://localhost:3080/discover'});
  assert.equal(x.clickLogo(),true);
  assert(x.classes.has('pv-intro-active'));
  assert.equal(x.navigations.length,0);
  assert(x.tick(2150));
  assert.deepEqual(x.navigations,['/']);
});
test('skip button dismisses intro promptly, and can redirect if already heading home',()=>{
  const x=harness();x.clickLogo();x.listeners['skip:click']();
  assert(x.classes.has('pv-intro-exit'));assert(x.tick(450));
  assert(!x.classes.has('pv-intro-active'));
});
test('top anchor has a native fallback and an isolated instant click handler',()=>{
  const listener={},attr={},classes=new Set();let scrollY=800,scrolled=null;
  class Element {closest(){return button;}}
  const button={classList:{toggle:(name,v)=>v?classes.add(name):classes.delete(name)},setAttribute:(name,v)=>attr[name]=v,
    getAttribute:()=> '#pv-page-top', tabIndex:0};
  const documentRoot={classList:{add:name=>classes.add(name)}};
  const doc={querySelector:()=>button,getElementById:()=>({}),documentElement:documentRoot,
    scrollingElement:{scrollTop:800},addEventListener:(name,fn)=>listener['document:'+name]=fn};
  const win={get scrollY(){return scrollY},requestAnimationFrame:fn=>{fn();return 1},
    addEventListener:(name,fn)=>listener['window:'+name]=fn,
    scrollTo:args=>{scrolled=args;scrollY=args.top;doc.scrollingElement.scrollTop=args.top}};
  vm.runInNewContext(top,{window:win,document:doc,Element});
  assert(classes.has('is-visible'));assert(classes.has('pv-top-ready'));
  assert.equal(attr['aria-hidden'],'false');
  let prevented=false,stopped=false;
  listener['document:click']({target:new Element(),button:0,preventDefault:()=>prevented=true,
    stopImmediatePropagation:()=>stopped=true});
  assert(prevented && stopped);
  assert.equal(scrolled.top,0);assert.equal(scrolled.behavior,'instant');
  assert.equal(doc.scrollingElement.scrollTop,0);
  listener['window:scroll']();
  assert(!classes.has('is-visible'));
});
test('server bundles new assets and reserves overlay before site header',()=>{
  assert.match(html,/pir-back-to-top\.js\?v=20261114t/);
  assert.match(html,/pir-intro-experience\.js\?v=20261114t/);
  assert.match(html,/pv-intro-progress/);
  assert(html.indexOf('id="pv-intro-overlay"') < html.indexOf('<header class="site-nav"'));
  assert(html.includes("'pir-back-to-top.js'"));
});
