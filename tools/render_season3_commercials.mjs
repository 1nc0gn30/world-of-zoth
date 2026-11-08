#!/usr/bin/env node
/**
 * Render Season III (Episodes 25-36) of World of Zoth in 1080p MP4 with synthesized 144 BPM Drift-Phonk / Chiptune Audio
 * Uses file:// URL directly with /opt/google/chrome/chrome (zero HTTP servers opened).
 */
import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawn } from 'node:child_process';
import { chromium } from 'playwright-core';

const ROOT = '/home/zoth/Desktop/world-of-zoth';
const DIST = path.join(ROOT, 'dist');
const HTML_URL = `file://${path.join(ROOT, 'world-of-zoth.html')}?capture=1`;

const SEASON_3 = [
  { ep: 25, slug: 'world-of-zoth-ep25-citadel.mp4', dur: 29, freq: 110.0 },
  { ep: 26, slug: 'world-of-zoth-ep26-abyss.mp4',   dur: 29, freq: 98.0 },
  { ep: 27, slug: 'world-of-zoth-ep27-fiber.mp4',   dur: 29, freq: 130.81 },
  { ep: 28, slug: 'world-of-zoth-ep28-forest.mp4',  dur: 29, freq: 146.83 },
  { ep: 29, slug: 'world-of-zoth-ep29-skybeam.mp4', dur: 29, freq: 123.47 },
  { ep: 30, slug: 'world-of-zoth-ep30-orrery.mp4',  dur: 29, freq: 116.54 },
  { ep: 31, slug: 'world-of-zoth-ep31-physarum.mp4',dur: 29, freq: 103.83 },
  { ep: 32, slug: 'world-of-zoth-ep32-lycan.mp4',   dur: 29, freq: 92.50 },
  { ep: 33, slug: 'world-of-zoth-ep33-engine.mp4',  dur: 29, freq: 138.59 },
  { ep: 34, slug: 'world-of-zoth-ep34-manifesto.mp4',dur:29, freq: 123.47 },
  { ep: 35, slug: 'world-of-zoth-ep35-eve.mp4',     dur: 29, freq: 146.83 },
  { ep: 36, slug: 'world-of-zoth-ep36-trilogy.mp4', dur: 30, freq: 110.0 },
];

function synthAudioWav(wavPath, durationSec, baseFreq, seedIdx) {
  const sr = 44100;
  const totalSamples = Math.floor(sr * durationSec);
  const buf = Buffer.alloc(44 + totalSamples * 2);

  // WAV Header
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + totalSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // Mono
  buf.writeUInt32LE(sr, 24);
  buf.writeUInt32LE(sr * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(totalSamples * 2, 40);

  const scale = [1, 1.1892, 1.3348, 1.4983, 1.5874, 1.7818, 2.0];
  const bpm = 140 + (seedIdx % 3) * 4;
  const stepSec = (60 / bpm) / 4;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sr;
    const step = Math.floor(t / stepSec);
    const stepPhase = (t % stepSec) / stepSec;

    // Sub bass + kick envelope
    const kickEnv = (step % 4 === 0) ? Math.exp(-stepPhase * 12) : 0;
    const kickFreq = 52 + 95 * Math.exp(-stepPhase * 28);
    const kick = Math.sin(2 * Math.PI * kickFreq * t) * kickEnv * 0.45;

    // Arpeggio lead (cowbell / chiptune harmonic)
    const noteIdx = (step * 3 + seedIdx) % scale.length;
    const leadFreq = baseFreq * 2 * scale[noteIdx];
    const leadEnv = Math.exp(-stepPhase * 6.5);
    const lead = (Math.sin(2 * Math.PI * leadFreq * t) + 0.35 * Math.sin(2 * Math.PI * leadFreq * 2.01 * t)) * leadEnv * 0.22;

    // Pad drone
    const pad = Math.sin(2 * Math.PI * baseFreq * t) * 0.16 + Math.sin(2 * Math.PI * baseFreq * 1.4983 * t) * 0.11;

    // Fade in / out
    const fade = Math.min(1, t / 0.6, (durationSec - t) / 0.8);
    const sample = Math.max(-0.95, Math.min(0.95, (kick + lead + pad) * fade));
    buf.writeInt16LE(Math.floor(sample * 32767), 44 + i * 2);
  }
  fs.writeFileSync(wavPath, buf);
}

async function main() {
  const browser = await chromium.launch({
    executablePath: '/opt/google/chrome/chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu-vsync', '--allow-file-access-from-files']
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();
  await page.goto(HTML_URL, { waitUntil: 'load' });
  await page.waitForFunction(() => window.WOZ && window.WOZ.G && typeof window.WOZ.G.openCommercial === 'function');

  for (let idx = 0; idx < SEASON_3.length; idx++) {
    const item = SEASON_3[idx];
    const outMp4 = path.join(DIST, item.slug);
    const wavPath = `/tmp/woz_ep${item.ep}.wav`;
    console.log(`[Season III] Synthesizing audio + rendering EP ${item.ep} -> ${item.slug} ...`);
    synthAudioWav(wavPath, item.dur, item.freq, item.ep);

    // Launch commercial episode (0-indexed: ep - 1)
    await page.evaluate((epZero) => {
      window.WOZ.G.openCommercial(epZero);
      window.WOZ.step(1);
    }, item.ep - 1);

    const fps = 24;
    const totalFrames = item.dur * fps;
    const ff = spawn('/usr/bin/ffmpeg', [
      '-y',
      '-f', 'image2pipe',
      '-vcodec', 'mjpeg',
      '-r', String(fps),
      '-i', '-',
      '-i', wavPath,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-crf', '20',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '192k',
      '-shortest',
      '-movflags', '+faststart',
      outMp4
    ], { stdio: ['pipe', 'ignore', 'ignore'] });

    for (let f = 0; f < totalFrames; f++) {
      // Advance 1.25 engine ticks per 24fps frame (= 30fps simulation speed)
      const b64 = await page.evaluate((steps) => {
        window.WOZ.step(steps);
        return window.WOZ.frame('image/jpeg').split(',')[1];
      }, f % 2 === 0 ? 1 : 2);
      const jpgBuf = Buffer.from(b64, 'base64');
      if (!ff.stdin.write(jpgBuf)) {
        await new Promise(r => ff.stdin.once('drain', r));
      }
      if (f === 48 && (item.ep === 25 || item.ep === 36)) {
        fs.writeFileSync(`/tmp/verify_ep${item.ep}_frame.jpg`, jpgBuf);
      }
    }
    ff.stdin.end();
    await new Promise((resolve, reject) => {
      ff.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)));
    });
    fs.unlinkSync(wavPath);
    const stat = fs.statSync(outMp4);
    console.log(`  ✓ Rendered ${item.slug} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
  }

  await browser.close();
  console.log('All 12 Season III 1080p episodes rendered!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
