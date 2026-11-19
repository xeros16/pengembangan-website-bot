import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const roots = ['index.js','games','features','models','tests','scripts','portfolio-website'];
const files=[];
function walk(p){ if(!fs.existsSync(p)) return; const st=fs.statSync(p); if(st.isDirectory()){ if(['node_modules','.git'].includes(path.basename(p))) return; for(const n of fs.readdirSync(p)) walk(path.join(p,n)); } else if(p.endsWith('.js')) files.push(p); }
for(const r of roots) walk(r);
for(const f of [...new Set(files)]) { execFileSync(process.execPath,['--check',f],{stdio:'inherit'}); }
console.log(`Syntax OK: ${new Set(files).size} JavaScript files`);
