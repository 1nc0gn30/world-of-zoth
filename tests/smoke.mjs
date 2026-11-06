import { open, st, step, shot } from './lib.mjs';
const {browser,page,errors}=await open();
await step(page,90); await shot(page,'shots/t_title.png');
await page.keyboard.press('Enter'); await step(page,30); console.log(JSON.stringify((await st(page)).mode));
await shot(page,'shots/t_intro.png');
console.log('errors',errors.slice(0,20));
await browser.close();
