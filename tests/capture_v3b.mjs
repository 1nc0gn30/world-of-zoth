// ~60 s 720p preview of v0.3.1 Phase B (Academy, lab, safehouse decorate, forge w/ mocked endpoint, ZGL editor). Local only.
import { open } from './lib.mjs'; import { Bot } from './bot.mjs'; import fs from 'fs'; import { spawn, execSync } from 'child_process';
const {browser,page,errors}=await open(); const b=new Bot(page); fs.mkdirSync('capture',{recursive:true});
const MOCK='https://mock.forge.test/v1'; const src=fs.readFileSync('tests/play_v3b.mjs','utf8'); const VALID=eval(src.match(/const VALID=(.*);\nconst BAD/)[1]);
await page.route(MOCK+'/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({choices:[{message:{content:VALID}}]})}));
b.startRec=function(file){ this.rec=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','png','-i','-','-vf','scale=1280:720:flags=neighbor','-c:v','libx264','-preset','veryfast','-crf','26','-pix_fmt','yuv420p',file]); };
await b.step(40); await b.tap('Enter',4); await b.step(20); await b.tap('Escape',6); await b.dialog(); await page.evaluate(()=>{ G.tut&&(G.tut.on=false); G.flag('house_open'); WOZ.warp('hub',9,-4); G.cam.yaw=0; }); await b.step(40);
b.startRec('capture/v3b.mp4');
await page.keyboard.down('KeyW'); await b.step(50); await page.keyboard.up('KeyW'); await b.step(20); await b.talk(); await b.step(90);
await page.evaluate(()=>G.runLab('lab_inject')); await b.step(100); for(let k=0;k<6;k++){ const st=await page.evaluate(()=>G.labState()); if(st.finished) break; if(st.kind==='pick'){ const w=st.ans===0?1:0; await page.evaluate(w=>G.pickLab(w),w); await b.step(45); await page.evaluate(a=>G.pickLab(a),st.ans); await b.step(60); } else if(st.kind==='type'){ break; } else { await page.evaluate(()=>G.pickLab(0)); await b.step(60); } }
await page.evaluate(()=>{ G.mode='explore'; WOZ.warp('hub',-9,13); G.cam.yaw=Math.PI*0+0; }); await b.step(30); await page.keyboard.down('KeyW'); await b.step(40); await page.keyboard.up('KeyW'); await b.talk(); await b.step(60);
await page.evaluate(()=>G.decorate()); await b.step(20);
for(const [id,x,y,r] of [['bed',1,1,0],['desk',4,1,0],['shelf',8,0,0],['plant',12,1,0],['sofa',3,7,90],['lamp',0,4,0],['rug',7,5,0],['crate',12,8,0],['plant',0,9,0]]){ await page.evaluate(([id,x,y,r])=>G.decoMove(x,y,id,r),[id,x,y,r]); await b.step(14); await page.evaluate(()=>G.decoPlace()); await b.step(10); }
await b.step(30); await b.tap('Escape',20);
await page.evaluate(m=>{ localStorage.setItem('woz.ai.url',m); localStorage.setItem('woz.ai.key','sk-demo'); G.openForge(); },MOCK); await b.step(90);
await page.evaluate(()=>G.forge.call('a gold fox mask sprite with a cape')); await b.step(120);
await page.evaluate(()=>{ G.mode='explore'; WOZ.warp('house',0,4); G.cam.yaw=0; }); await b.step(30); await page.keyboard.down('KeyA'); await b.step(40); await page.keyboard.up('KeyA'); await b.step(60);
await page.evaluate(()=>{ G.openZGLEditor(); G.zglEd.name('glyph'); }); await b.step(20);
for(let i=0;i<16;i++){ await page.evaluate(i=>{ G.zglEd.set(i,i,'4'); G.zglEd.set(15-i,i,'3'); G.zglEd.set(i,0,'5'); G.zglEd.set(i,15,'5'); },i); await b.step(5); }
await b.step(30); await page.evaluate(()=>G.zglEd.save()); await b.step(60); await page.evaluate(()=>{ localStorage.removeItem('woz.ai.key'); G.mode='explore'; }); await b.step(40);
const frames=b.frames; await b.stopRec(); console.log('frames',frames,'errors',errors.length);
execSync('ffmpeg -loglevel error -y -i capture/v3b.mp4 -c:v libx264 -crf 28 -preset medium -pix_fmt yuv420p -movflags +faststart dist/world-of-zoth-v0.3.1-preview.mp4');
await browser.close();
