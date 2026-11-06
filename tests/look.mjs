import { open, shot } from './lib.mjs';
const [zone,x,z,yaw,name]=process.argv.slice(2);
const {browser,page,errors}=await open();
await page.evaluate(([zone,x,z,yaw])=>{ WOZ.step(5); G.mode='explore'; },[zone,+x,+z,+yaw]);
await page.keyboard.press('Enter'); await page.evaluate(()=>WOZ.step(5));
await page.evaluate(([zone,x,z,yaw])=>{ G.D=null; G.mode='explore'; G.travel(zone); WOZ.step(30); const p=G.player.group.position; p.x=x; p.z=z; G.cam.yaw=yaw; G.cam.lastDrag=G.t; WOZ.step(60); },[zone,+x,+z,+yaw]);
await shot(page,'shots/'+name+'.png'); console.log(errors); await browser.close();
