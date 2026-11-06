// v0.2 trailer: ~80 s, 1920x1080, real key input; debug warps between zones; in-game audio rendered offline.
import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
import fs from 'fs'; import { execSync } from 'child_process';
const OUT='capture'; fs.mkdirSync(OUT,{recursive:true}); fs.mkdirSync('screenshots/v2',{recursive:true});
const {browser,page,errors}=await open();
const b=new Bot(page); const log=(...a)=>console.log(...a);
let shotN=0; const snap=async(n)=>{ await shot(page,`screenshots/v2/${String(++shotN).padStart(2,'0')}-${n}.png`); };
await b.step(40);
await page.evaluate(()=>WOZ.startLog()); b.startRec(`${OUT}/video.mp4`);
await b.step(80); await b.tap('Enter',6);
for(let i=0;i<300;i++){ const s=await b.s(); if(s.mode!=='dialog') break; await b.step(6); await b.tap('Enter',2); }
// late-game crew so the follower line and battle party look like the full game
await page.evaluate(()=>{ for(const id of ['kitsune','ignis','vigil','nexus','kraken','chronos','athena','lycan','onyx']) G.recruit(id); G.activeL=['me','kitsune','ignis','vigil'].filter(id=>G.roster.includes(id)); WOZ.setLvl(24);
  for(const f of ['gate_open','fiber_open','streets_open','caves_open','mirror_key','deep_open','skyline_open','fiber_gold','clock_run','copy_down']) G.flag(f); G.toasts&&(G.toasts.length=0); G.rebuildNPCs(); });
async function cruise(z,x,zz,path,frames=135,name){ await page.evaluate(([z,x,zz])=>{ WOZ.warp(z,x,zz); G.grace=99; },[z,x,zz]); await b.step(4);
  const per=Math.floor(frames/path.length); let snapped=false;
  for(const [px,pz] of path){ await b.goto(px,pz,{tol:1,run:true,max:per}); if(!snapped&&name){ snapped=true; await snap(name); } }
  await b.release(); }
await cruise('hub',0,14,[[0,-4],[-6,-12]],120,'hub');
await cruise('fiber',0,40,[[0,26],[-10,14]],130,'fiber-tunnels');
await cruise('clock',0,36,[[0,24],[6,14]],120);
await cruise('streets',0,40,[[0,26],[10,16]],120,'collapse-streets');
await cruise('foundry',0,36,[[0,20],[0,6]],120);
await cruise('caves',0,36,[[0,22],[-10,10]],120,'physarum-caves');
await cruise('mirrors',0,38,[[0,24],[0,12]],120);
await cruise('deep',0,36,[[0,22],[8,10]],120,'deep-water');
await cruise('skyline',0,40,[[0,24],[0,8]],140,'mode7-skyline');
async function fight(maxF,shotName){ const f00=b.frames; let shotB=false, killed=false;
  for(let i=0;i<6000;i++){ const s=await b.s(); if(s.mode==='dialog'){ if(!s.dialog.done) await b.step(3); else { await b.step(14); await b.tap('Enter',2); } continue; } if(s.mode!=='battle') break; const B=s.battle;
    if(!killed&&b.frames-f00>maxF){ killed=true; await page.evaluate(()=>G.B.enemies.forEach(e=>{ e.hp=1; e.st.p2=1; })); await page.evaluate(()=>{ G.B.flags.bq=1; }); }
    if(B.state==='menu'){ await b.step(6); const idx=killed?0:smart(B,s); const dn=(idx-B.menu+B.opts.length)%B.opts.length; for(let j=0;j<dn;j++) await b.tap('ArrowDown',2); await b.tap('Enter',3); }
    else if(B.state==='target'){ await b.step(4); await b.tap('Enter',2); }
    else if(B.state==='timing'){ const t=await page.evaluate(()=>G.B.timing.t); if(t>=.69&&t<.74) await b.tap(' ',1); else await b.step(1); if(!shotB&&t>.5&&shotName){ shotB=true; await snap(shotName); } }
    else if(B.state==='wait'){ const q=await page.evaluate(()=>G.B.block?{st:G.B.st,res:G.B.block.res}:null); if(q&&q.res===null&&q.st>=.52&&q.st<.58) await b.tap(' ',1); else await b.step(1); }
    else if(B.state==='victory'||B.state==='defeat'){ await b.step(50); await b.tap('Enter',4); }
    else await b.step(2); } }
// boss fight: THE HUNTER in the mirrors, played with timed hits and blocks
await page.evaluate(()=>{ WOZ.warp('mirrors',0,4); G.grace=99; G.battle(['hunter'],{music:'boss'}); }); await b.step(2);
await fight(330,'boss-hunter');
// the cursor
await page.evaluate(()=>{ WOZ.warp('skyline',0,-26); G.grace=99; }); await b.step(6); await b.goto(0,-31,{tol:1,max:50}); await b.release(); await b.step(10);
await page.evaluate(()=>{ G.battle(['blank'],{music:'final'}); }); await b.step(2); await fight(200,'boss-cursor');
// hidden terminal egg
await page.evaluate(()=>{ WOZ.warp('hub',-12.8,-12.8); G.grace=99; }); await b.step(20); await b.tap('e',10);
for(const c of ['crew','trace 03ng0cn1']){ for(const ch of c) { await page.keyboard.press(ch===' '?'Space':ch); await b.step(2); } await page.keyboard.press('Enter'); await b.step(40); }
await snap('hidden-terminal'); await page.keyboard.press('Escape'); await b.step(4);
// ending: sunrise at 06:12
await page.evaluate(()=>{ G.flag('copy_crew'); G.finalEnding(); }); await b.step(330); await snap('sunrise-0612');
const frames=b.frames; await b.stopRec(); const dur=frames/30; log('frames',frames,'dur',dur.toFixed(1));
const wav=await page.evaluate(d=>WOZ.audio(d),dur); fs.writeFileSync(`${OUT}/audio.wav`,Buffer.from(wav,'base64'));
fs.mkdirSync('dist',{recursive:true});
execSync(`ffmpeg -loglevel error -y -i ${OUT}/video.mp4 -i ${OUT}/audio.wav -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest dist/world-of-zoth-trailer-v0.2-1920x1080.mp4`);
log('errors',errors); await browser.close();
