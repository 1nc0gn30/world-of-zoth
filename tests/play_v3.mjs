// v0.3 check: intro cinematic -> tutorial (move, camera, run, jump, dissipate, map waypoint, checkpoint, talk, first fight) + 720p capture.
import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
import fs from 'fs'; import { spawn, execSync } from 'child_process';
const {browser,page,errors}=await open(); const b=new Bot(page); const res=[]; const ok=(k,v)=>{ res.push([k,!!v]); console.log(v?'[ok]':'[FAIL]',k); };
const D='screenshots/v3'; fs.mkdirSync(D,{recursive:true}); fs.mkdirSync('capture',{recursive:true});
b.startRec=function(file){ this.rec=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','png','-i','-','-vf','scale=1280:720:flags=neighbor','-c:v','libx264','-preset','veryfast','-crf','20','-pix_fmt','yuv420p',file]); };
await b.step(40); await page.evaluate(()=>WOZ.startLog()); b.startRec('capture/v3.mp4');
await b.step(40); await b.tap('Enter',4);
let s=await b.s(); ok('new game starts the intro cinematic', s.mode==='cine');
for(let i=0;i<620;i++){ await b.step(1); if(i===250) await shot(page,`${D}/01-intro-agents.png`); if(i===560) await shot(page,`${D}/02-intro-cursor.png`); }
// jump ahead through the remaining shots with confirm (next shot), then watch the last one
s=await b.s(); ok('intro still running at ~21 s', s.mode==='cine'); for(let i=0;i<2400;i++){ const c=await page.evaluate(()=>[G.cine.shotI,G.cine.st]); if(c[0]===5&&c[1]>7.8) break; if(c[0]<5&&i%40===0) await b.tap('Enter',2); else await b.step(1); } await shot(page,`${D}/03-intro-wake.png`); await b.tap('Escape',6);
s=await b.dialog(); ok('intro hands off to the hub + tutorial', s.mode==='explore'&&s.zone==='hub'); ok('tutorial on', await page.evaluate(()=>G.tut.on));
const ti=()=>page.evaluate(()=>G.tut.i);
await page.keyboard.down('KeyW'); await b.step(70); await page.keyboard.up('KeyW'); await page.keyboard.down('KeyQ'); await b.step(40); await page.keyboard.up('KeyQ');
await page.keyboard.down('ShiftLeft'); await page.keyboard.down('KeyS'); await b.step(70); await page.keyboard.up('KeyS'); await page.keyboard.up('ShiftLeft'); await b.step(5);
ok('tutorial: move, camera, run done', await ti()>=3); await shot(page,`${D}/04-tutorial.png`);
// jump into the hurdle cache
await page.evaluate(()=>{ WOZ.warp('hub',12,25); G.cam.yaw=0; }); await b.step(30); await b.goto(12,23.4,{tol:.4,max:60}); await b.release(); await b.step(4);
await page.keyboard.down('KeyW'); await b.tap(' ',1); await b.step(22); await page.keyboard.up('KeyW'); s=await b.s(); ok('jumped the hurdle', s.z<22.4); await b.goto(12,20,{tol:.6,max:60}); await b.release(); await b.talk(); await b.step(4); ok('hurdle cache opened', (await b.s()).flags.c_hub_j);
// dissipate through the firewall cache
await page.evaluate(()=>{ WOZ.warp('hub',-12,25.5); }); await b.step(30); await b.goto(-12,24.2,{tol:.4,max:60}); await b.release(); await page.evaluate(()=>{ G.cam.yaw=0; }); await b.step(4);
s=await b.s(); await page.keyboard.down('KeyW'); await b.step(2); await b.tap('c',1); await b.step(3); await shot(page,`${D}/05-dissipate.png`); await b.step(10); await page.keyboard.up('KeyW'); s=await b.s(); ok('dissipated through the firewall', s.z<22.4);
await b.goto(-12,20,{tol:.6,max:60}); await b.release(); await b.talk(); await b.step(4); ok('firewall cache opened', (await b.s()).flags.c_hub_d);
// map + waypoint
await b.tap('m',6); ok('map opens', (await b.s()).mode==='map'); await page.keyboard.down('ArrowUp'); await b.step(25); await page.keyboard.up('ArrowUp'); await b.tap('Enter',8); await b.step(20); await shot(page,`${D}/06-map-waypoint.png`);
const wp=await page.evaluate(()=>G.waypoint); ok('waypoint set', !!wp); await b.tap('Escape',6);
await page.evaluate(()=>{ WOZ.warp('hub',0,14); G.cam.yaw=0.6; }); await b.step(40); await shot(page,`${D}/07-compass-minimap.png`);
// checkpoint, Vigil, first fight
await page.evaluate(()=>{ WOZ.warp('hub',-4,-0.5); }); await b.step(12); s=await b.s(); if(s.interact) await b.talk(); await b.step(10);
await page.evaluate(()=>{ WOZ.warp('hub',4,8.6); }); await b.step(12); await b.talk(); s=await b.dialog(); ok('talked to Vigil (q1 step 1)', s.quests.q1.step>=1);
await page.evaluate(()=>{ WOZ.warp('hub',1.2,-32.6); G.grace=0; }); await b.step(30); for(let i=0;i<10;i++){ s=await b.s(); if(s.mode==='battle') break; const f=s.foes.find(f=>f.id==='h_tut'); if(f) await b.goto(f.x,f.z,{tol:.3,max:40}); } await b.release();
s=await b.s(); if(s.mode==='battle'){ await b.step(30); await shot(page,`${D}/08-first-fight.png`); s=await b.battle(smart); }
for(let i=0;i<5;i++){ s=await b.s(); if(s.mode==='dialog') s=await b.dialog(); else break; }
ok('first mission fight won (q1 step 2)', s.quests.q1.step>=2);
await b.step(20); const T=await page.evaluate(()=>({on:G.tut.on,i:G.tut.i,done:G.isFlag('tut_done')})); ok('tutorial complete', T.done); console.log(JSON.stringify(T));
await b.step(60); const frames=b.frames; await b.stopRec(); const dur=frames/30; console.log('capture s',dur.toFixed(1));
const wav=await page.evaluate(d=>WOZ.audio(d),dur); fs.writeFileSync('capture/v3.wav',Buffer.from(wav,'base64'));
execSync('ffmpeg -loglevel error -y -i capture/v3.mp4 -i capture/v3.wav -c:v copy -c:a aac -b:a 160k -shortest dist/world-of-zoth-v0.3-intro-tutorial-720p.mp4');
ok('0 console errors', errors.length===0); console.log(errors.slice(0,5));
fs.writeFileSync('tests/v3_result.json',JSON.stringify({res,errors,dur},null,1)); await browser.close();
