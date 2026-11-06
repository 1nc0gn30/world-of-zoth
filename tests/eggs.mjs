// Easter-egg checks: every red tag + Minion is reachable and collectable, typed terminal commands, Konami, rooftop, mini-games, achievements.
import { open, shot } from './lib.mjs';
import { Bot } from './bot.mjs';
import fs from 'fs';
const {browser,page,errors}=await open(); const b=new Bot(page);
const res=[]; const ok=(k,v)=>{ res.push([k,!!v]); console.log(v?'[ok]':'[FAIL]',k); };
await b.step(60); await b.tap('Enter',10); await b.dialog();
await page.evaluate(()=>{ for(const f of ['gate_open','fiber_open','streets_open','caves_open','mirror_key','deep_open','skyline_open']) G.flag(f); G.Q.start('s_minion'); G.D=null; G.mode='explore'; });
const MIN=[['hub',-40,30],['forest',38,-40],['relay',-8,-40],['fiber',40,-40],['clock',-36,30],['streets',-40,-6],['caves',-34,30],['deep',30,-36]];
const tags=await page.evaluate(()=>['hub','forest','relay','fiber','clock','streets','foundry','caves','deep'].map(z=>[z,...G.Z[z].tag]));
async function grab(kind,z,x,zz){ await page.evaluate(([z,x,zz])=>{ WOZ.warp(z,x+1,zz+1); G.grace=99; },[z,x,zz]); await b.step(8); let s=await b.s();
  if(!s.interact){ await b.goto(x,zz,{tol:.6,max:60}); await b.release(); s=await b.s(); }
  const label=s.interact; if(label){ await b.talk(); for(let i=0;i<30;i++){ s=await b.s(); if(s.mode==='dialog'){ await b.dialog(); } else break; } }
  return {label, s, pos:[+s.x.toFixed(1),+s.z.toFixed(1)]}; }
for(const [z,x,zz] of tags){ const r=await grab('tag',z,x,zz); ok(`red tag in ${z} reachable (${r.label})`, (await b.s()).flags['tag_'+z]); }
for(const [z,x,zz] of MIN){ const r=await grab('min',z,x,zz); ok(`minion in ${z} reachable (${r.label})`, r.label&&r.label.includes('minion')); }
let s=await b.s(); ok('s_minion done after 8', s.quests.s_minion&&s.quests.s_minion.step>=1||s.quests.s_minion.done);
ok('s_tags done after 9', s.quests.s_tags&&s.quests.s_tags.done);
// Konami
await page.evaluate(()=>{ WOZ.warp('hub',0,10); G.grace=99; }); await b.step(5); const bits0=s.bits;
for(const k of ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA']){ await page.keyboard.down(k); await b.step(1); await page.keyboard.up(k); await b.step(1); }
s=await b.s(); ok('konami: +99 bits', s.flags.konami && s.bits>=bits0+99);
// hidden terminal: walk to the ??? square and type
await page.evaluate(()=>{ WOZ.warp('hub',-12.8,-12.8); G.grace=99; G.menuOpen=false; G.mode='explore'; }); await b.step(5); await b.goto(-14.2,-14.2,{tol:.5,max:60}); await b.release(); s=await b.s(); ok('??? terminal offered', s.interact==='???');
await b.talk(); s=await b.s(); ok('terminal opens', s.mode==='terminal');
const type=async c=>{ for(const ch of c){ await page.keyboard.press(ch===' '?'Space':ch); await b.step(1); } await page.keyboard.press('Enter'); await b.step(6); };
for(const c of ['help','ls -a','crew','date','whoami','trace 03ng0cn1']) await type(c); await b.step(30); await shot(page,'shots/egg_terminal.png');
const term=await page.evaluate(()=>G.term.lines.map(l=>l[0]).join('|')); ok('trace prints "found you"', term.includes('found you')); ok('date says 06:12', term.includes('06:12'));
await type('tomorrow 06:12'); await b.step(60); s=await b.s(); ok('tomorrow 06:12 -> rooftop', s.zone==='rooftop'); await b.step(200); await shot(page,'shots/egg_rooftop.png');
// mini-games
await page.evaluate(()=>{ WOZ.warp('hub',0,10); G.startLife(); }); await b.step(5); await b.tap('Enter',2); await b.step(120); s=await b.s(); ok('life mini-game runs', s.mode==='mini'); await shot(page,'shots/egg_life.png'); await b.tap('Escape',4);
await page.evaluate(()=>{ G.mode='explore'; G.startDoom(); }); await b.step(5); await page.keyboard.down('ArrowUp'); await b.step(330); await page.keyboard.up('ArrowUp'); await shot(page,'shots/egg_doom.png'); await b.tap('Escape',4);
await page.evaluate(()=>{ G.mode='explore'; G.recruit('vigil'); G.startScope(); }); await b.step(5); await page.keyboard.down('ArrowLeft'); await b.step(60); await page.keyboard.up('ArrowLeft'); await b.step(30); await shot(page,'shots/egg_scope.png');
// tune to 3:2: read the current ratio and steer
for(let i=0;i<300;i++){ const m=await page.evaluate(()=>G.mode); if(m!=='mini') break; const a=await page.evaluate(()=>G.mini.ratio?G.mini.ratio():null); if(a==null) break; const k=a<3?'ArrowRight':'ArrowLeft'; if(Math.abs(a-3)<.03){ await b.tap('Enter',4); continue; } await page.keyboard.down(k); await b.step(1); await page.keyboard.up(k); }
await b.step(60);
const ach=await page.evaluate(()=>Object.keys(G.achGot)); console.log('achievements',ach.join(','));
ok('achievements unlocked: konami, terminal, rooftop, trace, handshake', ['konami','terminal','rooftop','trace','handshake'].every(k=>ach.includes(k)));
ok('0 console errors', errors.length===0); console.log(errors.slice(0,5));
fs.writeFileSync('tests/eggs_result.json',JSON.stringify({res,ach,errors},null,1)); await browser.close();
