import { open, shot } from './lib.mjs';
const {browser,page,errors}=await open();
await page.keyboard.press('Enter'); await page.evaluate(()=>WOZ.step(5));
const T=async(l)=>{ const t=Date.now(); await page.evaluate(()=>WOZ.step(30)); console.log(l,((Date.now()-t)/30).toFixed(1),'ms/frame'); };
await page.evaluate(()=>{ G.D=null; G.mode='explore'; }); await T('hub');
await page.evaluate(()=>{ G.travel('forest'); }); await page.evaluate(()=>WOZ.step(30)); await T('forest');
await page.evaluate(()=>{ const p=G.player.group.position; p.set(-18.5,0,18.5); }); await page.keyboard.press('e'); await T('sleep1'); await T('sleep2'); await T('sleep3'); await T('sleep4');await T('sleep5'); await T('after');
console.log(await page.evaluate(()=>G.mode)); await shot(page,'shots/perf.png');
console.log(errors); await browser.close();
