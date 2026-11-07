// Visit every zone (debug warp), step a few frames, screenshot, report frame time + errors.
import { open, shot } from './lib.mjs';
import { Bot } from './bot.mjs';
const {browser,page,errors}=await open(); const b=new Bot(page);
await b.tap('Enter',5); await b.step(5);
await page.evaluate(()=>{ G.D=null; G.mode='explore'; });
const zones=process.argv[2]?process.argv[2].split(','):['hub','forest','relay','fiber','clock','streets','foundry','caves','mirrors','deep','skyline','abyss','citadel','nullcore','rooftop'];
for(const z of zones){
  await page.evaluate(z=>{ const Z=G.Z[z]; WOZ.warp(z,Z.spawn.x,Z.spawn.z); G.banner=null; },z); await b.step(40);
  const t0=Date.now(); await b.step(10); const ms=(Date.now()-t0)/10;
  await page.evaluate(()=>{ G.cam.yaw+=0; }); await shot(page,`shots/z_${z}.png`);
  console.log(z,'ms/frame',ms.toFixed(0),'errors',errors.length);
}
console.log(errors.slice(0,10)); await browser.close();
