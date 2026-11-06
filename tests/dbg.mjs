import { open, shot } from './lib.mjs';
import { Bot } from './bot.mjs';
const {browser,page,errors}=await open(); const b=new Bot(page);
await b.tap('Enter',5);
await page.evaluate(()=>{ G.D=null; G.mode='explore'; G.quests={q1:{step:3,done:true},q2:{step:3,done:true}}; G.qstart('q3'); G.recruit('ignis'); const p=G.player.group.position; p.set(36,0,1); WOZ.step(5); });
let s=await b.s(); console.log(JSON.stringify(s.npcs.filter(n=>n.x>20)), s.mode);
await b.goto(38.5,0,{tol:.6}); s=await b.s(); console.log(s.x,s.z,s.interact,s.mode);
await b.talk(); s=await b.s(); console.log(s.mode, JSON.stringify(s.dialog));
await shot(page,'shots/dbg.png'); console.log(errors); await browser.close();
