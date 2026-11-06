import { open, shot } from './lib.mjs';
const {browser,page,errors}=await open('world-of-zoth.html',{query:''});
await page.waitForTimeout(2500); await page.keyboard.press('Enter'); await page.waitForTimeout(1500);
await page.keyboard.down('w'); await page.waitForTimeout(1200); await page.keyboard.up('w');
const s=await page.evaluate(()=>({mode:G.mode,z:G.player.group.position.z}));
console.log('single-file realtime:',JSON.stringify(s),'errors',JSON.stringify(errors)); await browser.close();
