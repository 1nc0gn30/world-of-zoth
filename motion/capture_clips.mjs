// World of Zoth motion edit: capture raw in-engine clips (deterministic, frame-stepped, real input).
// Run from repo root:  node motion/capture_clips.mjs [clipName,clipName]
// Writes motion/clips/<name>/0000.png ... at the game's native 960x540, 30 fps game time.
import { open } from '../tests/lib.mjs';
import { Bot, smart } from '../tests/bot.mjs';
import fs from 'fs';

const ONLY = process.argv[2] ? process.argv[2].split(',') : null;
const want = n => !ONLY || ONLY.includes(n);
const ROOT = 'motion/clips';
const { browser, page, errors } = await open();
const b = new Bot(page);
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);

let dir = null, n = 0;
const begin = name => { dir = `${ROOT}/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true }); n = 0; b.rec = {}; log('rec', name); };
const end = () => { log('  ->', n, 'frames'); b.rec = null; dir = null; };
b.grab = async () => { const d = await page.evaluate(() => WOZ.frame()); fs.writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.png`, Buffer.from(d.split(',')[1], 'base64')); b.frames++; };

// camera-driven frame: orbit / dolly while stepping the real game loop
async function camFrames(frames, { spd = 0.012, pitch = 0.42, dist = 11, d1 = null, p1 = null } = {}) {
  for (let i = 0; i < frames; i++) {
    const u = i / Math.max(1, frames - 1);
    const d = await page.evaluate(([spd, pitch, dist]) => { const c = G.cam; c.yaw += spd; c.pitch = pitch; c.dist = dist; c.lastDrag = G.t; G.grace = 99; WOZ.step(1); return WOZ.frame(); },
      [spd, p1 == null ? pitch : pitch + (p1 - pitch) * u, d1 == null ? dist : dist + (d1 - dist) * u]);
    fs.writeFileSync(`${dir}/${String(n++).padStart(4, '0')}.png`, Buffer.from(d.split(',')[1], 'base64'));
  }
}

// ---------- 1. title + intro cine ----------
await b.step(40);
if (want('title')) { begin('title'); await b.step(150); end(); }
await b.tap('Enter', 4);
if (want('intro')) { begin('intro'); await b.step(150); end(); }
for (let i = 0; i < 300; i++) { const s = await b.s(); if (s.mode !== 'dialog' && s.mode !== 'cine') break; await b.tap(s.mode === 'cine' ? 'Escape' : 'Enter', 3); }

// late-game crew + all gates so followers and parties look like the full game
await page.evaluate(() => {
  for (const id of ['kitsune', 'ignis', 'vigil', 'nexus', 'kraken', 'chronos', 'athena', 'lycan', 'onyx', 'leviathan', 'aether']) G.recruit(id);
  G.activeL = ['me', 'kitsune', 'ignis', 'vigil'].filter(id => G.roster.includes(id)); WOZ.setLvl(24);
  for (const f of ['gate_open', 'fiber_open', 'streets_open', 'caves_open', 'mirror_key', 'deep_open', 'skyline_open', 'fiber_gold', 'clock_run', 'copy_down', 'core_down']) G.flag(f);
  G.toasts && (G.toasts.length = 0); G.rebuildNPCs();
});

// ---------- 2. zone establishing orbits + runs ----------
const ZONES = ['hub', 'forest', 'relay', 'fiber', 'clock', 'streets', 'foundry', 'caves', 'mirrors', 'deep', 'skyline', 'rooftop'];
for (const [k, z] of ZONES.entries()) {
  if (!want('z_' + z) && !want('zones')) continue;
  await page.evaluate(z => { const Z = G.Z[z]; WOZ.warp(z, Z.spawn.x, Z.spawn.z); G.banner = null; G.grace = 99; G.toasts && (G.toasts.length = 0); }, z);
  await b.step(20);
  begin('z_' + z);
  // alternate orbit direction per zone so cuts feel like a whip
  await camFrames(80, { spd: (k % 2 ? -1 : 1) * 0.014, pitch: 0.5, p1: 0.3, dist: 16, d1: 9 });
  end();
  if (['hub', 'fiber', 'streets', 'caves', 'skyline', 'forest'].includes(z) && (want('zones') || want('run_' + z))) {
    begin('run_' + z);
    await page.evaluate(() => { G.cam.pitch = 0.28; G.cam.dist = 7.5; });
    await b.down('w'); await b.down('Shift');
    for (let i = 0; i < 70; i++) { await page.evaluate(() => { G.grace = 99; }); await b.step(1); if (i === 35) { await b.down('a'); } }
    await b.release(); end();
  }
}

// ---------- 3. battles (real timed hits + parries) ----------
async function fight(maxF) {
  const f0 = b.frames; let killed = false;
  for (let i = 0; i < 6000; i++) {
    const s = await b.s();
    if (s.mode === 'dialog') { if (!s.dialog.done) await b.step(3); else { await b.step(10); await b.tap('Enter', 2); } continue; }
    if (s.mode !== 'battle') break; const B = s.battle;
    if (!killed && b.frames - f0 > maxF) { killed = true; await page.evaluate(() => { G.B.enemies.forEach(e => { e.hp = 1; e.st.p2 = 1; }); G.B.flags.bq = 1; }); }
    if (B.state === 'menu') { await b.step(5); const idx = killed ? 0 : smart(B, s); const dn = (idx - B.menu + B.opts.length) % B.opts.length; for (let j = 0; j < dn; j++) await b.tap('ArrowDown', 2); await b.tap('Enter', 3); }
    else if (B.state === 'target') { await b.step(3); await b.tap('Enter', 2); }
    else if (B.state === 'timing') { const t = await page.evaluate(() => G.B.timing.t); if (t >= .69 && t < .74) await b.tap(' ', 1); else await b.step(1); }
    else if (B.state === 'wait') { const q = await page.evaluate(() => G.B.block ? { st: G.B.st, res: G.B.block.res } : null); if (q && q.res === null && q.st >= .52 && q.st < .58) await b.tap(' ', 1); else await b.step(1); }
    else if (B.state === 'victory' || B.state === 'defeat') { await b.step(45); await b.tap('Enter', 4); }
    else await b.step(2);
    if (b.frames - f0 > maxF + 400) break;
  }
}
const battles = [
  ['b_drones', 'hub', 0, 4, ['drone', 'drone', 'sentinel'], 'battle', 360],
  ['b_copy', 'hub', 6, 0, ['copy'], 'boss', 360],
  ['b_hunter', 'mirrors', 0, 4, ['hunter'], 'boss', 420],
  ['b_blank', 'skyline', 0, -26, ['blank'], 'final', 520],
];
for (const [name, z, x, zz, foes, mus, maxF] of battles) {
  if (!want(name) && !want('battles')) continue;
  await page.evaluate(([z, x, zz, foes, mus]) => { WOZ.warp(z, x, zz); G.grace = 99; G.healAll && G.healAll(); G.battle(foes, { music: mus }); }, [z, x, zz, foes, mus]);
  begin(name); await b.step(2); await fight(maxF); end();
  await page.evaluate(() => { G.B = null; G.mode = 'explore'; G.healAll && G.healAll(); });
}

// ---------- 4. hidden terminal + sunrise ending ----------
if (want('terminal')) {
  await page.evaluate(() => { WOZ.warp('hub', -12.8, -12.8); G.grace = 99; }); await b.step(20);
  begin('terminal'); await b.tap('e', 8);
  for (const c of ['crew', 'trace 03ng0cn1']) { for (const ch of c) { await page.keyboard.press(ch === ' ' ? 'Space' : ch); await b.step(2); } await page.keyboard.press('Enter'); await b.step(30); }
  end(); await page.keyboard.press('Escape'); await b.step(4);
}
if (want('sunrise')) {
  await page.evaluate(() => { G.flag('copy_crew'); G.finalEnding(); });
  await b.step(60); begin('sunrise'); await b.step(330); end();
}

log('errors', errors.slice(0, 10));
await browser.close();
