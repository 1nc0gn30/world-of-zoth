// v0.2 main-chain playthrough: q1 -> q18 with a generic quest solver.
// Real key input for talking, interacting and every battle (timed hits + blocks). Debug warps (WOZ.warp) replace long walks,
// WOZ.setLvl keeps the party at the act's design level (no grinding in a test).
import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
import fs from 'fs';
const {browser,page,errors}=await open();
const b=new Bot(page); const t0=Date.now(); const log=(...a)=>console.log(((Date.now()-t0)/1000).toFixed(0)+'s',...a);
const result={steps:[],bosses:{}}; const ok=(k,v)=>{ result.steps.push([k,!!v]); log(v?'[ok]':'[FAIL]',k); };
const LV={q1:1,q2:2,q3:3,q4:5,q5:8,q6:9,q7:11,q8:12,q9:14,q10:16,q11:17,q12:19,q13:19,q14:20,q15:22,q16:25,q17:28,q18:28};
const T=()=>page.evaluate(()=>WOZ.target());
async function handle(){ let s=await b.s(); for(let i=0;i<40;i++){ if(s.mode==='battle'){ const types=s.battle.enemies.map(e=>e.type); s=await b.battle(smart); const won=s.mode!=='battle'&&!(s.battle&&s.battle.result==='defeat'); for(const t of types) if(['copy','relay4','sandglass','hunter','blank','warden','brood','rusted'].includes(t)) result.bosses[t]=(result.bosses[t]||0)+1; log('battle',types.join(','),'->',s.mode,'lvl',s.party.me.lvl); }
  else if(s.mode==='dialog') s=await b.dialog();
  else if(['transition','sleep','title'].includes(s.mode)){ if(s.mode==='title'){ await b.tap('Enter',10); } await b.step(20); s=await b.s(); }
  else return s; } return s; }
async function warpNear(z,x,zz){ await page.evaluate(([z,x,zz])=>WOZ.warp(z,x,zz),[z,x,zz]); await b.step(12); await page.evaluate(()=>{ G.grace=0; }); return handle(); }
let s; await b.step(60); await b.tap('Enter',10); s=await b.dialog(); ok('new game', s.mode==='explore');
const FROM=(process.argv.find(a=>a.startsWith('--from='))||'').slice(7);
if(FROM){ await page.evaluate(n=>WOZ.skipTo(n),FROM); s=await handle(); log('skipped to',FROM,'roster',s.roster.length); }
let lastKey='', stuck=0, shots=0;
for(let it=0; it<500; it++){
  s=await handle(); if(s.mode==='final'){ break; }
  const t=await T(); if(!t){ log('no target'); break; }
  const key=t.q+':'+t.step+':'+(t.pending?'p':''); if(key===lastKey) stuck++; else { stuck=0; lastKey=key; log('->',key,t.kind||'',JSON.stringify(t.mark)); }
  if(stuck>8){ log('STUCK on',key, JSON.stringify(t), s.zone, s.x.toFixed(1), s.z.toFixed(1)); break; }
  const want=LV[t.q]; if(want&&s.party.me.lvl<want){ await page.evaluate(l=>WOZ.setLvl(l),want); }
  if(t.kind==='rest'){ await warpNear('forest',-18.5,17.2); await b.talk(); await b.step(200); s=await handle(); continue; }
  if(t.kind==='mirror'){ // try a wrong pillar once (reflection battle), then the true one
    const j=s.flags.mir_0?4:0; const [x,z]=t.pil[j]; await warpNear('mirrors',x*.8,z*.8); await b.talk(); s=await handle(); continue; }
  const m=t.mark; if(!m){ log('no mark',JSON.stringify(t)); break; }
  const [z,x,zz]=m;
  const offs=[[0,0],[1.4,0],[0,1.4],[-1.4,0],[0,-1.4],[2.2,2.2],[-2.2,-2.2]]; const o=offs[stuck%offs.length];
  if(s.zone!==z || Math.hypot(s.x-x,s.z-zz)>3 || stuck) s=await warpNear(z,x+o[0]*(stuck?1:0)+(stuck?0:1.2),zz+o[1]*(stuck?1:0)+(stuck?0:1.2));
  if(s.mode!=='explore') continue;
  if(s.interact){ await b.talk(); s=await handle(); continue; }
  const f=s.foes&&s.foes.filter(f=>Math.hypot(f.x-x,f.z-zz)<14).sort((a,c)=>Math.hypot(a.x-s.x,a.z-s.z)-Math.hypot(c.x-s.x,c.z-s.z))[0];
  if(f){ await b.goto(f.x,f.z,{tol:.4,max:120}); await b.release(); s=await handle(); continue; }
  await b.goto(x,zz,{tol:.8,max:80}); await b.release(); s=await b.s(); if(s.interact){ await b.talk(); s=await handle(); }
  if(['fiber','clock','streets','foundry','caves','mirrors','deep','skyline'].includes(s.zone)&&!result['shot_'+s.zone]){ result['shot_'+s.zone]=1; }
}
s=await b.s(); const Q=s.quests;
for(const k of Object.keys(LV)) ok(`${k} done`, Q[k]&&Q[k].done);
ok('copy beaten (act 1 boss)', s.flags.copy_down); ok('RELAY 4 beaten (act 2 boss)', s.flags.core_down);
ok('SANDGLASS beaten (act 3 boss)', s.flags.clock_run); ok('THE HUNTER beaten (act 4 boss)', Q.q14&&Q.q14.done); ok('>_ beaten (act 5 boss)', s.flags.blank_down);
ok('final ending reached', s.mode==='final'); await b.step(400); await shot(page,'shots/v2_final.png');
log('roster',s.roster.length,s.roster.join(','),'lvl',s.party.me.lvl);
// save / load: the q17 win and the q18 ending autosave
const before=s; await page.reload(); await page.waitForFunction(()=>window.WOZ&&window.G&&G.mode==='title',null,{timeout:60000}); await b.step(80);
await b.tap('Enter',20); s=await b.s();
ok('reload -> continue restores save', s.mode==='explore' && s.quests.q17 && s.quests.q17.done && s.roster.length===before.roster.length && s.party.me.lvl===before.party.me.lvl);
result.roster=before.roster; result.lvl=before.party.me.lvl; result.errors=errors; result.secs=(Date.now()-t0)/1000;
fs.writeFileSync('tests/v2_result.json',JSON.stringify(result,null,1)); log('errors',errors.length,errors.slice(0,5));
await browser.close();
