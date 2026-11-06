import { open, shot } from './lib.mjs';
import { Bot, smart } from './bot.mjs';
const {browser,page,errors}=await open();
const b=new Bot(page); const log=(...a)=>console.log(...a);
await b.step(80); await b.tap('Enter',10);
let s=await b.dialog(); log('after intro',s.mode,s.zone,s.x.toFixed(1),s.z.toFixed(1));
s=await b.goto(4,8.8,{tol:.7}); log('at vigil',s.interact); await shot(page,'shots/a_vigil.png');
await b.talk(); s=await b.dialog(); log('q1',JSON.stringify(s.quests));
s=await b.path([[4,10],[-4,10],[-5,-12],[-1,-16],[0,-26]]); log('walk north',s.mode,s.x.toFixed(1),s.z.toFixed(1));
for(let i=0;i<60&&s.mode==='explore';i++){ s=await b.goto(0,-34,{tol:.5,max:20}); }
await b.step(20); s=await b.s(); log('battle?',s.mode,s.battle&&s.battle.state); await shot(page,'shots/a_battle0.png');
await b.step(30); await shot(page,'shots/a_battle1.png');
s=await b.battle(smart); log('after battle',s.mode,JSON.stringify(s.party.me),JSON.stringify(s.quests));
await page.evaluate(()=>0);
log('errors',errors);
await browser.close();
