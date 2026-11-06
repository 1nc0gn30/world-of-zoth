// Record a real gameplay segment (scripted player, real key events) to a 1920x1080 MP4 with the in-game audio rendered offline.
import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const OUT='capture'; fs.mkdirSync(OUT,{recursive:true});
const {browser,page,errors}=await open();
const b=new Bot(page); const log=(...a)=>console.log(...a);
let shotN=0; const snap=async(n)=>{ await shot(page,`${OUT}/shot-${String(++shotN).padStart(2,'0')}-${n}.png`); };
await b.step(40);
await page.evaluate(()=>WOZ.startLog()); b.startRec(`${OUT}/video.mp4`);
await b.step(50);                                   // title
await b.tap('Enter',6);
async function read(choose=()=>0,hold=18){ for(let i=0;i<600;i++){ const s=await b.s(); if(s.mode!=='dialog') return; if(!s.dialog.done){ await b.step(4); continue; } await b.step(hold); const c=s.dialog.choices; if(c){ const k=choose(c); for(let j=0;j<k;j++) await b.tap('ArrowDown',6); await b.tap('Enter',3);} else await b.tap('Enter',3); } }
await read(()=>0,14);
await snap('hub-start');
async function walk(x,z,o={}){ return b.goto(x,z,{tol:.7,...o}); }
await walk(4,8.8);
await b.talk(); await b.step(40); await snap('vigil-dialog');
await read(c=>c.length>1?1:0,16); log('after vigil',JSON.stringify((await b.s()).quests));
await b.path([[4,11],[-4,11],[-5,-12],[-1,-17]],{tol:1,run:true});
{ const s=await b.s(); log('north',s.mode,s.x.toFixed(1),s.z.toFixed(1),JSON.stringify(s.foes)); }
await snap('north-street');
for(let k=0;k<30;k++){ const s=await b.s(); if(s.mode!=='explore') break; const f=s.foes.find(f=>f.id==='h_tut'); if(!f) break; await b.goto(f.x,f.z,{tol:.4,max:12,run:true}); }
await b.step(36); await snap('battle-intro');
// battle by hand-ish: ping with perfect timing, guard once, ping again
let shotBattle=false;
for(let i=0;i<2400;i++){ const s=await b.s(); if(s.mode!=='battle') break; const B=s.battle;
  if(B.state==='menu'){ await b.step(12); await b.tap('Enter',6); continue; }
  if(B.state==='target'){ await b.step(8); await b.tap('Enter',2); continue; }
  if(B.state==='timing'){ const t=await page.evaluate(()=>G.B.timing.t); if(!shotBattle&&t>.5){ shotBattle=true; await snap('timed-strike'); } if(t>=.695&&t<.74) await b.tap(' ',1); else await b.step(1); continue; }
  if(B.state==='wait'){ const q=await page.evaluate(()=>G.B.block?{st:G.B.st,res:G.B.block.res}:null); if(q&&q.res===null&&q.st>=.52&&q.st<.58){ await b.tap(' ',1); await b.step(3); await snap('block'); } else await b.step(1); continue; }
  if(B.state==='victory'){ await b.step(50); await snap('victory-levelup'); await b.step(30); await b.tap('Enter',4); continue; }
  await b.step(1); }
await b.step(20);
await b.path([[-1,-17],[-5,-12]],{tol:1,run:true}); await b.tap('e',2); await b.step(40); await snap('scan-pulse');
const frames=b.frames; await b.stopRec(); const dur=frames/30;
log('frames',frames,'dur',dur.toFixed(1));
const wav=await page.evaluate(d=>WOZ.audio(d),dur); fs.writeFileSync(`${OUT}/audio.wav`,Buffer.from(wav,'base64'));
execSync(`ffmpeg -loglevel error -y -i ${OUT}/video.mp4 -i ${OUT}/audio.wav -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest ${OUT}/world-of-zoth-gameplay-1920x1080.mp4`);
log('state',JSON.stringify((await b.s()).party.me)); log('errors',errors); await browser.close();
