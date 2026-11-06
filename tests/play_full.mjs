// Full slice playthrough by a scripted player. Real key input; frame-stepped. Optional recording.
import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
import fs from 'fs';
const REC=process.argv.includes('--rec');
const {browser,page,errors}=await open();
const b=new Bot(page); const t0=Date.now(); const log=(...a)=>console.log(((Date.now()-t0)/1000).toFixed(0)+'s',...a);
const result={steps:[]}; const ok=(k,v)=>{ result.steps.push([k,v]); log(v?'[ok]':'[FAIL]',k); };
async function handle(){ let s=await b.s(); for(let i=0;i<20;i++){ if(s.mode==='battle') s=await b.battle(smart); else if(s.mode==='dialog') s=await b.dialog(); else if(s.mode==='transition'||s.mode==='sleep'){ await b.step(10); s=await b.s(); } else break; } return s; }
async function travel(pts,o={}){ let s=await b.s(); const z0=s.zone; for(const [x,z] of pts){ if((await b.s()).zone!==z0) return b.s(); for(let k=0;k<12;k++){ s=await b.goto(x,z,{...o,zone:z0}); if(s.zone!==z0) return s; if(s.mode==='explore'){ const d=Math.hypot(s.x-x,s.z-z); if(d<(o.tol||1.2)+.1) break; } s=await handle(); } } return s; }
async function talkTo(x,z,choose){ let s=await travel([[x,z]],{tol:.8}); s=await b.s(); if(!s.interact){ log('no interact near',x,z,s.x,s.z); } await b.talk(); s=await b.dialog(choose); return handle(); }
async function hunt(id){ for(let k=0;k<40;k++){ let s=await b.s(); if(s.mode!=='explore'){ s=await handle(); continue; } const f=s.foes.find(f=>f.id===id); if(!f) return s; await b.goto(f.x,f.z,{tol:.4,max:25}); } return handle(); }
async function zoneTo(px,pz,zone){ let s; for(let k=0;k<6;k++){ s=await travel([[px,pz]],{tol:.6}); await b.step(30); s=await b.s(); if(s.zone===zone) return s; } return s; }
let s;
await b.step(60); await b.tap('Enter',10); s=await b.dialog(); ok('new game -> hub explore', s.mode==='explore'&&s.zone==='hub');
s=await talkTo(4,9); ok('talked to Vigil (q1 step 1)', s.quests.q1.step===1);
s=await travel([[4,10],[-4,10],[-5,-12],[-1,-16],[0,-26]]); s=await hunt('h_tut'); ok('won tutorial battle (q1 step 2)', s.quests.q1.step===2);
ok('gained xp + level up from the tutorial', s.party.me.lvl>=2);
s=await travel([[-1,-16],[-5,-12],[-4,10]]); s=await talkTo(4,9); ok('reported to Vigil', s.quests.q1.step===3);
s=await talkTo(-6,6.5); ok('Nexus: q2 started', !!s.quests.q2);
// level up on the roaming pair in the north-west
s=await travel([[-8,1.5],[-20,1.5]]); s=await hunt('h_d1'); ok('won roaming fight', !s.foes.find(f=>f.id==='h_d1'));
s=await travel([[-12,1],[-5,-.2]],{tol:.8}); await b.talk(); await b.step(10); s=await b.s(); ok('saved at terminal', s.hasSave);
fs.writeFileSync('tests/save_snapshot.json',JSON.stringify(await page.evaluate(()=>localStorage.getItem('woz.save.v1'))));
// forest
s=await travel([[-8,1.5],[-30,0]]); if(s.zone!=='forest') s=await zoneTo(-50,0,'forest'); ok('entered Rest Woods', s.zone==='forest');
await shot(page,'shots/f_enter.png');
s=await travel([[30,1],[10,-4],[-8,-10]]); s=await handle(); s=await b.s();
if(s.quests.q2.step===0){ s=await talkTo(-21,-12.5); }
ok('Kitsune recruited', s.roster.includes('kitsune'));
for(const [id,path] of [['f_n1',[[-10,0],[5,15],[18,28]]],['f_n2',[[0,20],[-25,5]]],['f_n3',[[-20,-5],[-5,-25]]]]){ s=await travel(path); s=await hunt(id); }
s=await handle(); s=await b.s(); ok('3 embers -> lantern (q2 step 3)', s.quests.q2.step===3 && !!s.inv['foxfire.lantern']);
// rest under the tree
s=await travel([[-18,10],[-18.5,18.5]],{tol:1}); await b.talk(); await b.step(180); s=await b.s(); ok('slept + saved', s.mode==='explore');
s=await travel([[-10,0],[20,0],[40,0]]); if(s.zone!=='hub') s=await zoneTo(50,0,'hub'); ok('back to hub', s.zone==='hub');
s=await talkTo(-6,6.5); ok('Nexus: q3', !!s.quests.q3);
s=await travel([[-8,1.5],[2,1.5],[8,-1.6],[13,-2],[14,-10.5]],{tol:1.2}); await b.talk(); s=await b.dialog(()=>0); ok('Ignis recruited', s.roster.includes('ignis'));
s=await travel([[13,-2],[30,0],[39,0]],{tol:.7}); await b.talk(); s=await b.dialog(()=>0); s=await handle(); ok('beat the red copy', !!s.flags.copy_down);
s=await talkTo(36,6.5); ok('gate open', !!s.flags.gate_open);
s=await travel([[30,1],[10,1.5],[-4,4]]); s=await talkTo(-6,6.5); ok('q4 + Vigil', !!s.quests.q4 && s.roster.includes('vigil'));
s=await travel([[2,1.5],[30,0],[44,0]]); if(s.zone!=='relay') s=await zoneTo(50,0,'relay'); ok('entered the Hollow', s.zone==='relay');
await shot(page,'shots/r_enter.png');
s=await talkTo(-34,4.5,(ch)=>ch[0].includes('lantern')?0:0); ok('Draco check passed', s.quests.q4.step===1);
for(const [x,z,path] of [[4,26,[[-20,10],[0,22]]],[36,20,[[20,26]]],[14,-24,[[30,5],[16,-14]]]]){ s=await travel([...path,[x-2,z-2]],{tol:1.2}); s=await b.s(); log('at pylon?',s.zone,s.x,s.z,s.mode,JSON.stringify(s.interact)); if(!s.interact||!/pylon/.test(JSON.stringify(s.interact))){ s=await travel([[x-1.8,z-1.8]],{tol:.5}); s=await b.s(); log(' retry',s.x,s.z,JSON.stringify(s.interact)); } await b.talk(); s=await handle(); log('pylon',x,z,JSON.stringify(s.quests.q4),s.party.me.lvl); }
ok('3 pylons cut', s.quests.q4.step===2);
s=await travel([[10,-8],[18,-2]]); s=await handle(); s=await b.s(); log('final', s.mode, s.party.me.lvl);
for(let i=0;i<10&&s.mode!=='ending';i++){ s=await travel([[20,0]]); s=await handle(); await b.step(10); s=await b.s(); log('loop',s.mode,JSON.stringify(s.quests.q4)); if(s.mode==='explore' && s.flags.core_started && !s.flags.core_down){ /* lost? */ break; } }
ok('reached the ending', s.mode==='ending'||!!s.flags.core_down);
await b.step(1100); await shot(page,'shots/end.png'); await b.tap('Enter',20); s=await b.s(); ok('q4 done', s.quests.q4&&s.quests.q4.done);
// save/load: the ending autosaves; reload the page and continue
await page.reload(); await page.waitForFunction(()=>window.WOZ&&window.G&&G.mode==='title',null,{timeout:60000}); await b.step(80);
const before=s; await b.tap('Enter',20); s=await b.s(); ok('reload -> continue restores save', s.mode==='explore' && s.quests.q4 && s.quests.q4.done && s.party.me.lvl===before.party.me.lvl && s.roster.length===before.roster.length);
log('final party', JSON.stringify(s.party)); result.party=s.party; result.errors=errors; result.secs=(Date.now()-t0)/1000;
fs.writeFileSync('tests/full_result.json',JSON.stringify(result,null,1)); log('errors',errors);
await browser.close();
