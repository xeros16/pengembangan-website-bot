import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const models = fs.readFileSync(new URL('../models.js', import.meta.url), 'utf8');
const rootPackage = JSON.parse(fs.readFileSync(new URL('../../package.json', import.meta.url), 'utf8'));
const rootLock = JSON.parse(fs.readFileSync(new URL('../../package-lock.json', import.meta.url), 'utf8'));
const websitePackage = JSON.parse(fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const websiteLock = JSON.parse(fs.readFileSync(new URL('../package-lock.json', import.meta.url), 'utf8'));

test('v5.86.0 advances platform, website package, cache and public asset versions together', () => {
  assert.equal(rootPackage.version, '6.7.2');
  assert.equal(rootLock.version, '6.7.2');
  assert.equal(rootLock.packages[''].version, '6.7.2');
  assert.equal(websitePackage.version, '3.50.0');
  assert.equal(websiteLock.version, '3.50.0');
  assert.ok(source.includes("version: '6.7.2'"));
  assert.ok(source.includes("const CACHE='pir-visuals-public-v46'"));
  for (const asset of ['/icon.svg?v=6710', '/public-ui.js?v=6710', '/pwa-register.js?v=6710', '/vendor/gsap.min.js?v=6710', '/vendor/ScrollTrigger.min.js?v=6710']) {
    assert.ok(source.includes(asset), 'missing cache-busted asset ' + asset);
  }
});

test('project lifecycle exposes only valid next stages and makes completed/cancelled terminal', () => {
  assert.ok(source.includes('const CLIENT_PROJECT_STATUS_TRANSITIONS = Object.freeze({'));
  assert.ok(source.includes("brief_received: ['discovery','in_progress','cancelled']"));
  assert.ok(source.includes("discovery: ['in_progress','review','completed','cancelled']"));
  assert.ok(source.includes("in_progress: ['review','completed','cancelled']"));
  assert.ok(source.includes("review: ['in_progress','completed','cancelled']"));
  assert.ok(source.includes('completed: []'));
  assert.ok(source.includes('cancelled: []'));
  assert.ok(source.includes('function clientProjectStatusChoices(status)'));
  assert.ok(source.includes('function isClientProjectClosed(status)'));
});

test('designer cannot reopen a closed project or bypass the transition map', () => {
  assert.ok(source.includes('if (isClientProjectClosed(project.status))'));
  assert.ok(source.includes('const allowedStatuses = clientProjectStatusChoices(project.status)'));
  assert.ok(source.includes('!allowedStatuses.includes(status)'));
  assert.ok(source.includes('Proyek sudah ditutup.'));
  assert.ok(source.includes('Pilih tahap berikutnya yang tersedia'));
});

test('concurrent project status writes use an optimistic version check', () => {
  assert.ok(source.includes('const versionFilter = project.__v == null ? { __v:{ $exists:false } } : { __v:Number(project.__v) };'));
  assert.ok(source.includes('...versionFilter'));
  assert.ok(source.includes('$inc:{ __v:1 }'));
  assert.ok(source.includes('Status proyek baru saja berubah di sesi lain.'));
});

test('project lifecycle synchronizes the lead pipeline without overwriting manual terminal outcomes', () => {
  assert.ok(source.includes('async function markProjectLeadContacted(project)'));
  assert.ok(source.includes("status:'new' },\n    { $set:{ status:'contacted' } }"));
  assert.ok(source.includes('async function syncLeadPipelineFromProject(project, status)'));
  assert.ok(source.includes("status:{ $ne:'closed' } }, { $set:{ status:'won' }"));
  assert.ok(source.includes("status:{ $ne:'won' } }, { $set:{ status:'closed' }"));
  assert.ok(source.includes("status:{ $in:['new','contacted'] } }, { $set:{ status:'qualified' }"));
  assert.ok(source.includes('if (portalInviteSent) await markProjectLeadContacted({ leadId, designerId });'));
  assert.ok(source.includes('await markProjectLeadContacted(project);'));
  assert.ok(source.includes('await syncLeadPipelineFromProject(project,status);'));
});

test('client and designer workspaces switch to a clear read-only state after completion or cancellation', () => {
  assert.ok(source.includes('const closedNotice = isClosed ?'));
  assert.ok(source.includes('const messageComposer = isClosed'));
  assert.ok(source.includes('const updateComposer = isClosed'));
  assert.ok(source.includes('pv-project-closed-state'));
  assert.ok(source.includes('pv-project-readonly-note'));
  assert.ok(source.includes("['completed','cancelled'].includes(project.status)"));
});

test('designer and client timelines display the same status milestones', () => {
  assert.ok(source.includes('function renderClientProjectWorkspace'));
  assert.ok(source.includes('function renderDesignerProjectWorkspace'));
  assert.ok(source.includes('CLIENT_PROJECT_STATUS_LABELS[item.status] || item.status'));
  assert.ok(source.includes('aria-current="step"'));
});

test('Designer Studio project list has summary cards, accessible search, status filters and empty feedback', () => {
  assert.ok(source.includes('pv-project-summary'));
  assert.ok(source.includes('pv-project-toolbar'));
  assert.ok(source.includes('id="pv-project-search" type="search"'));
  assert.ok(source.includes('id="pv-project-status-filter"'));
  assert.ok(source.includes('id="pv-project-filter-count" role="status" aria-live="polite"'));
  assert.ok(source.includes('id="pv-project-filter-empty" hidden'));
  assert.ok(source.includes('data-pv-project-card'));
  assert.ok(source.includes('data-pv-project-group="${group}"'));
});

test('project list filters search client names and titles while grouping active, review and terminal projects', () => {
  assert.ok(source.includes('const syncProjectFilters=()=>'));
  assert.ok(source.includes("(projectSearch?.value||'').trim().toLocaleLowerCase('id-ID')"));
  assert.ok(source.includes('card.dataset.pvProjectSearch'));
  assert.ok(source.includes('card.dataset.pvProjectGroup===status'));
  assert.ok(source.includes('projectCards.forEach(card=>'));
  assert.ok(source.includes('if(projectEmpty)projectEmpty.hidden=visible!==0'));
});

test('workspace lifecycle changes preserve the existing project models and private access boundaries', () => {
  assert.ok(models.includes("collection: 'clientprojects'"));
  assert.ok(models.includes("collection: 'clientprojectupdates'"));
  assert.ok(models.includes("collection: 'clientprojectsessions'"));
  assert.ok(source.includes('validClientCsrf(req,form,session)'));
  assert.ok(source.includes('session.projectId !== parts[2]'));
  assert.ok(source.includes('ClientProject.findOne({projectId:parts[2],designerId:session.designerId})'));
  assert.ok(source.includes("'cache-control':'no-store'"));
});

test('project workflow styling remains theme-token based and responsive', () => {
  assert.ok(source.includes('.pv-project-summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))'));
  assert.ok(source.includes('.pv-project-toolbar{display:grid;grid-template-columns:minmax(180px,1.4fr)'));
  assert.ok(source.includes('.pv-project-closed-state,.pv-project-readonly-note'));
  assert.ok(source.includes('@media(max-width:760px){'));
  assert.ok(source.includes('@media(max-width:520px){.pv-project-summary'));
});


test('project lifecycle helpers enforce the workflow and map lead pipeline outcomes', async () => {
  const start = source.indexOf('const CLIENT_PROJECT_STATUS_TRANSITIONS = Object.freeze({');
  const end = source.indexOf('async function sendClientProjectAccessEmail', start);
  assert.ok(start >= 0 && end > start);
  const calls = [];
  const sandbox = {
    CLIENT_PROJECT_STATUS_LABELS: {
      brief_received:'Brief diterima', discovery:'Discovery', in_progress:'Dikerjakan',
      review:'Review', completed:'Selesai', cancelled:'Dibatalkan',
    },
    DesignerLead: { updateOne: async (...args) => { calls.push(args); return { modifiedCount:1 }; } },
  };
  vm.runInNewContext(source.slice(start,end) + '\nthis.projectHelpers={clientProjectStatusChoices,isClientProjectClosed,markProjectLeadContacted,syncLeadPipelineFromProject};', sandbox);
  const helpers = sandbox.projectHelpers;
  assert.deepEqual(Array.from(helpers.clientProjectStatusChoices('brief_received')), ['brief_received','discovery','in_progress','cancelled']);
  assert.deepEqual(Array.from(helpers.clientProjectStatusChoices('review')), ['review','in_progress','completed','cancelled']);
  assert.equal(helpers.isClientProjectClosed('completed'), true);
  assert.equal(helpers.isClientProjectClosed('cancelled'), true);
  assert.equal(helpers.isClientProjectClosed('review'), false);
  const project = { leadId:'LD-1', designerId:'DS-1' };
  await helpers.markProjectLeadContacted(project);
  await helpers.syncLeadPipelineFromProject(project,'review');
  await helpers.syncLeadPipelineFromProject(project,'completed');
  await helpers.syncLeadPipelineFromProject(project,'cancelled');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][0])), { leadId:'LD-1', designerId:'DS-1', status:'new' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), { $set:{ status:'contacted' } });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][0].status)), { $in:['new','contacted'] });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1][1])), { $set:{ status:'qualified' } });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2][0].status)), { $ne:'closed' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[2][1])), { $set:{ status:'won' } });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[3][0].status)), { $ne:'won' });
  assert.deepEqual(JSON.parse(JSON.stringify(calls[3][1])), { $set:{ status:'closed' } });
});

test('the emitted project filter JavaScript filters actual cards and announces empty results', () => {
  const marker = "if (parts[0] === 'public-ui.js') return res.end(`";
  const routeStart = source.indexOf(marker);
  const templateStart = source.indexOf('`', routeStart) + 1;
  const templateEnd = source.indexOf('`);', templateStart);
  assert.ok(routeStart >= 0 && templateStart > 0 && templateEnd > templateStart);
  const raw = source.slice(templateStart,templateEnd);
  const runtime = vm.runInNewContext('`' + raw + '`');
  const blockStart = runtime.indexOf('const projectFilterPanel=document.querySelector(\'.pv-projects-panel\');');
  const blockEnd = runtime.indexOf('update();shortlistUpdate();})();',blockStart);
  assert.ok(blockStart >= 0 && blockEnd > blockStart);
  const makeInput = value => ({
    value, listeners:{},
    addEventListener(type,callback){ this.listeners[type]=callback; },
    dispatch(type){ this.listeners[type]?.({ type }); },
  });
  const search=makeInput('');
  const status=makeInput('all');
  const count={textContent:''};
  const empty={hidden:true};
  const cards=[
    {dataset:{pvProjectSearch:'brand identity client alfa',pvProjectGroup:'active'},hidden:false},
    {dataset:{pvProjectSearch:'illustration client beta',pvProjectGroup:'review'},hidden:false},
    {dataset:{pvProjectSearch:'packaging client gamma',pvProjectGroup:'completed'},hidden:false},
  ];
  const panel={
    querySelector(selector){ return ({
      '#pv-project-search':search,
      '#pv-project-status-filter':status,
      '#pv-project-filter-count':count,
      '#pv-project-filter-empty':empty,
    })[selector] || null; },
    querySelectorAll(selector){ return selector==='[data-pv-project-card]'?cards:[]; },
  };
  const document={querySelector(selector){return selector==='.pv-projects-panel'?panel:null;}};
  vm.runInNewContext(runtime.slice(blockStart,blockEnd),{document});
  search.value='beta'; search.dispatch('input');
  assert.deepEqual(cards.map(card=>!card.hidden),[false,true,false]);
  assert.equal(count.textContent,'Menampilkan 1 dari 3 ruang proyek.');
  status.value='completed'; search.value=''; status.dispatch('change');
  assert.deepEqual(cards.map(card=>!card.hidden),[false,false,true]);
  assert.equal(empty.hidden,true);
  status.value='cancelled'; status.dispatch('change');
  assert.deepEqual(cards.map(card=>!card.hidden),[false,false,false]);
  assert.equal(count.textContent,'Menampilkan 0 dari 3 ruang proyek.');
  assert.equal(empty.hidden,false);
});
