#!/usr/bin/env node
/**
 * ZOTH SOVEREIGN X (TWITTER) 5-ACCOUNT NETWORK & 90-DAY CAMPAIGN ENGINE
 * Accounts managed:
 *   1. @1nc0gn30         — World of Zoth (1 Episode Video/Day + 4 Lore/Dev/Arcade Posts/Day for 90 Days)
 *   2. @zoth_os          — ZothOS Sovereign Linux, Amnesic Boot, Kernel & CLI Arsenal (5 Posts/Day)
 *   3. @zothstudio       — Zoth Studio 21-Agent Pantheon, Avant-Garde WebGL & Open SaaS (5 Posts/Day)
 *   4. @nealfraziertech  — Neal Frazier Tech Founder Logs, Systems Engineering & NullAI (5 Posts/Day)
 *   5. @dinorawrai       — DinoRawrAI Creative AI, Retro Arcade Shaders & Generative Art (5 Posts/Day)
 *
 * Security Invariant:
 *   All credentials live strictly inside Zoth Sovereign Vault (~/.config/zoth-vault/x.env, mode 0600).
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VAULT_DIR = path.join(process.env.HOME || '/home/zoth', '.config', 'zoth-vault');
const VAULT_ENV = path.join(VAULT_DIR, 'x.env');
const PENDING_OAUTH = path.join(VAULT_DIR, 'x_pending_oauth.json');
const STATE_FILE = path.join(VAULT_DIR, 'x_campaign_state.json');

fs.mkdirSync(VAULT_DIR, { recursive: true, mode: 0o700 });

function loadVaultEnv() {
  const map = {};
  if (fs.existsSync(VAULT_ENV)) {
    for (const line of fs.readFileSync(VAULT_ENV, 'utf8').split('\n')) {
      const m = line.match(/^\s*(?:export\s+)?([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) map[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
  return map;
}

function saveVaultVars(updates) {
  const current = loadVaultEnv();
  Object.assign(current, updates);
  const lines = Object.entries(current).map(([k, v]) => `${k}=${v}`);
  fs.writeFileSync(VAULT_ENV, lines.join('\n') + '\n', { mode: 0o600 });
  fs.chmodSync(VAULT_ENV, 0o600);
}

function normHandle(h) {
  return h.replace(/^@/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');
}

function getAccountCreds(handle) {
  const env = loadVaultEnv();
  const h = normHandle(handle);
  const upper = h.toUpperCase();
  const apiKey = env.X_API_KEY;
  const apiSecret = env.X_API_SECRET;
  let accessToken = env[`X_TOKEN_${upper}`];
  let accessSecret = env[`X_SECRET_${upper}`];
  // Fallback for @1nc0gn30 default keys
  if (!accessToken && (h === '1nc0gn30' || h === 'default')) {
    accessToken = env.X_ACCESS_TOKEN;
    accessSecret = env.X_ACCESS_SECRET;
  }
  return { apiKey, apiSecret, accessToken, accessSecret };
}

function pct(str) {
  return encodeURIComponent(str).replace(/[!'()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function oauthHeader(method, urlStr, extraParams = {}, creds, extraOAuth = {}) {
  const u = new URL(urlStr);
  const oauth = {
    oauth_consumer_key: creds.apiKey,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_version: '1.0',
    ...extraOAuth
  };
  if (creds.accessToken) oauth.oauth_token = creds.accessToken;
  const allParams = { ...oauth, ...extraParams };
  for (const [k, v] of u.searchParams.entries()) allParams[k] = v;

  const paramString = Object.keys(allParams)
    .sort()
    .map(k => `${pct(k)}=${pct(allParams[k])}`)
    .join('&');

  const baseUrl = `${u.protocol}//${u.host}${u.pathname}`;
  const baseString = `${method.toUpperCase()}&${pct(baseUrl)}&${pct(paramString)}`;
  const signingKey = `${pct(creds.apiSecret)}&${pct(creds.accessSecret || '')}`;
  oauth.oauth_signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  return 'OAuth ' + Object.keys(oauth).sort().map(k => `${pct(k)}="${pct(oauth[k])}"`).join(', ');
}

function httpsRequest(method, urlStr, headers, bodyBuffer) {
  return new Promise((resolve, reject) => {
    const u = new URL(urlStr);
    const req = https.request({
      method,
      hostname: u.hostname,
      path: u.pathname + u.search,
      headers
    }, res => {
      const chunks = [];
      res.on('data', d => chunks.push(d));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try { json = raw ? JSON.parse(raw) : {}; } catch (_) {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: json || raw });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${raw}`));
        }
      });
    });
    req.on('error', reject);
    if (bodyBuffer) req.write(bodyBuffer);
    req.end();
  });
}

async function uploadMediaChunked(filePath, creds) {
  const stat = fs.statSync(filePath);
  const totalBytes = stat.size;
  const ext = path.extname(filePath).toLowerCase();
  const isVideo = ext === '.mp4';
  const mediaType = isVideo ? 'video/mp4' : ext === '.gif' ? 'image/gif' : ext === '.png' ? 'image/png' : 'image/jpeg';
  const mediaCategory = isVideo ? 'tweet_video' : ext === '.gif' ? 'tweet_gif' : 'tweet_image';
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

  const initParams = {
    command: 'INIT',
    total_bytes: totalBytes.toString(),
    media_type: mediaType,
    media_category: mediaCategory
  };
  const initBody = new URLSearchParams(initParams).toString();
  const initRes = await httpsRequest('POST', uploadUrl, {
    Authorization: oauthHeader('POST', uploadUrl, initParams, creds),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(initBody)
  }, Buffer.from(initBody));
  const mediaId = initRes.data.media_id_string;

  const chunkSize = 4 * 1024 * 1024;
  const fd = fs.openSync(filePath, 'r');
  let segmentIndex = 0;
  for (let offset = 0; offset < totalBytes; offset += chunkSize) {
    const len = Math.min(chunkSize, totalBytes - offset);
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, offset);
    const boundary = '----WOZBoundary' + crypto.randomBytes(8).toString('hex');
    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="command"\r\n\r\nAPPEND\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media_id"\r\n\r\n${mediaId}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="segment_index"\r\n\r\n${segmentIndex}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="media"; filename="${path.basename(filePath)}"\r\nContent-Type: application/octet-stream\r\n\r\n`),
      buf,
      Buffer.from(`\r\n--${boundary}--\r\n`)
    ];
    const multipartBody = Buffer.concat(parts);
    await httpsRequest('POST', uploadUrl, {
      Authorization: oauthHeader('POST', uploadUrl, {}, creds),
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
      'Content-Length': multipartBody.length
    }, multipartBody);
    segmentIndex++;
  }
  fs.closeSync(fd);

  const finParams = { command: 'FINALIZE', media_id: mediaId };
  const finBody = new URLSearchParams(finParams).toString();
  const finRes = await httpsRequest('POST', uploadUrl, {
    Authorization: oauthHeader('POST', uploadUrl, finParams, creds),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(finBody)
  }, Buffer.from(finBody));

  let proc = finRes.data.processing_info;
  while (proc && (proc.state === 'pending' || proc.state === 'in_progress')) {
    const waitSec = proc.check_after_secs || 2;
    await new Promise(r => setTimeout(r, waitSec * 1000));
    const statusUrl = `${uploadUrl}?command=STATUS&media_id=${encodeURIComponent(mediaId)}`;
    const stRes = await httpsRequest('GET', statusUrl, {
      Authorization: oauthHeader('GET', statusUrl, {}, creds)
    });
    proc = stRes.data.processing_info;
    if (proc && proc.state === 'failed') {
      throw new Error(`Media processing failed: ${JSON.stringify(proc.error)}`);
    }
  }
  return mediaId;
}

function fitTweet280(str) {
  // X counts URLs as 23 chars and emojis as 2 chars; keep under 265 weighted chars so non-Premium accounts never hit 403
  let s = str.trim();
  const weightedLen = (txt) => {
    const withoutUrls = txt.replace(/https?:\/\/\S+/g, 'X'.repeat(23));
    let count = 0;
    for (const ch of withoutUrls) {
      count += ch.codePointAt(0) > 0xFFFF ? 2 : 1;
    }
    return count;
  };
  if (weightedLen(s) <= 270) return s;
  // Trim gracefully at word boundary
  while (s.length > 0 && weightedLen(s + '…') > 270) {
    s = s.slice(0, -1).trimEnd();
  }
  return s + '…';
}

async function postTweet(text, mediaId, creds) {
  const url = 'https://api.twitter.com/2/tweets';
  const send = async (t) => {
    const payload = { text: fitTweet280(t) };
    if (mediaId) payload.media = { media_ids: [mediaId] };
    const body = Buffer.from(JSON.stringify(payload), 'utf8');
    const res = await httpsRequest('POST', url, {
      Authorization: oauthHeader('POST', url, {}, creds),
      'Content-Type': 'application/json',
      'Content-Length': body.length
    }, body);
    return res.data.data;
  };
  return await send(text);
}

// 24 Theatrical Commercial MP4 Files for @1nc0gn30 Daily Video Series
const WOZ_VIDEOS = [
  { ep: 1,  file: 'dist/world-of-zoth-commercial.mp4',      title: 'EP I: 06:12 — Faces, Not Voices' },
  { ep: 2,  file: 'dist/world-of-zoth-ep2-crew.mp4',        title: 'EP II: Midnight at the Safehouse' },
  { ep: 3,  file: 'dist/world-of-zoth-ep3-combat.mp4',      title: 'EP III: 99 Floors of Fury' },
  { ep: 4,  file: 'dist/world-of-zoth-ep4-secrets.mp4',     title: 'EP IV: Behind the Wireframe — Secrets of 06:13' },
  { ep: 5,  file: 'dist/world-of-zoth-ep5-horizon.mp4',     title: 'EP V: The Dawn Horizon (District #20)' },
  { ep: 6,  file: 'dist/world-of-zoth-ep6-arcade.mp4',      title: 'EP VI: The Safehouse Megaplex (22 Mini-Games)' },
  { ep: 7,  file: 'dist/world-of-zoth-ep7-academy.mp4',     title: 'EP VII: Null Academy — Hack the Prompt' },
  { ep: 8,  file: 'dist/world-of-zoth-ep8-sunrise.mp4',     title: 'EP VIII: 06:13 — The Sunrise Finale' },
  { ep: 9,  file: 'dist/world-of-zoth-ep9-mirror.mp4',      title: 'EP IX: The Mirror\'s Edge (03ng0cn1)' },
  { ep: 10, file: 'dist/world-of-zoth-ep10-gala.mp4',       title: 'EP X: The Pantheon Gala (3D PBR Shaders)' },
  { ep: 11, file: 'dist/world-of-zoth-ep11-skyline.mp4',    title: 'EP XI: Skybeam Interceptor (Galaga #22)' },
  { ep: 12, file: 'dist/world-of-zoth-ep12-season.mp4',     title: 'EP XII: 06:12 to 06:13 (Season I Finale)' },
  { ep: 13, file: 'dist/world-of-zoth-ep13-monsoon.mp4',    title: 'EP XIII: Monsoon Over Relit City (3D Rain Shaders)' },
  { ep: 14, file: 'dist/world-of-zoth-ep14-heist.mp4',      title: 'EP XIV: The Black-Market Heist (Contraband & Anvil)' },
  { ep: 15, file: 'dist/world-of-zoth-ep15-colosseum.mp4',  title: 'EP XV: Wager at the Colosseum (AI vs AI)' },
  { ep: 16, file: 'dist/world-of-zoth-ep16-pirateradio.mp4',title: 'EP XVI: 06:12 Pirate Radio FM (140 BPM)' },
  { ep: 17, file: 'dist/world-of-zoth-ep17-pets.mp4',       title: 'EP XVII: The Cyber-Familiar Sanctuary' },
  { ep: 18, file: 'dist/world-of-zoth-ep18-quantum.mp4',    title: 'EP XVIII: The Quantum Loom Conspiracy' },
  { ep: 19, file: 'dist/world-of-zoth-ep19-cards.mp4',      title: 'EP XIX: Grandmaster of Pantheon Triad (3x3 Cards)' },
  { ep: 20, file: 'dist/world-of-zoth-ep20-speedrun.mp4',   title: 'EP XX: 2.0x Hyper-Clock Speedrun' },
  { ep: 21, file: 'dist/world-of-zoth-ep21-foundry.mp4',    title: 'EP XXI: Forged in Doom-Fire (Brutalist 3D Relief)' },
  { ep: 22, file: 'dist/world-of-zoth-ep22-detective.mp4',  title: 'EP XXII: The Seventh Reflection (Cyber-Noir)' },
  { ep: 23, file: 'dist/world-of-zoth-ep23-megaplex.mp4',   title: 'EP XXIII: The 22-Cabinet Arcade Marathon' },
  { ep: 24, file: 'dist/world-of-zoth-ep24-pantheon.mp4',   title: 'EP XXIV: 24 Episodes of Zoth (Season II Finale)' }
];

const DISTRICTS = [
  'Relit City (Hub)', 'Rest Woods (Conway Clearing)', 'The Hollow (Relay 4)', 'Hilbert Fiber Tunnels',
  'Sand Clocktower (06:12)', 'Collapse Streets (Quantum WFC)', 'Doom-Fire Foundry', 'Physarum Slime Caves',
  'Hall of Mirrors (03ng0cn1)', 'Deep-Water Memory Trench', 'Mode-7 Skyline Plateau', 'Sub-Lattice Abyss (4096m)',
  'Zero-Knowledge Citadel', 'The Null Core (4D Hyper-Torus)', 'The Rooftop (06:13 Dawn)', 'The Quantum Loom',
  'The Chrono-Vault', 'The Astral Spire', 'The Omega Foundry', 'The Dawn Horizon'
];

const MINIGAMES = [
  'Conway\'s Game of Life', 'Doom-Fire Crucible', 'Oscilloscope 3:2 Handshake', '3D Hilbert Packet Runner',
  '4x4 ZK Cipher Grid', 'Morse & Signal Frequency Decoder', 'Physarum Slime Mould Router', 'Memory Core-Dump Defragmenter',
  'East Gate Firewall Defender', '5x5 Quantum Wave-Collapse', '6x6 Fiber-Optic Laser Router', '5-Ring Chrono-Orrery Puzzle',
  'Sub-Lattice Sonar Mine Sweeper', 'Pantheon Triad 3x3 Card Battler', 'Signal Tower 4-Track Rhythm Sync', 'Vector Tank Cyber-Arena',
  'Packet Alchemy (2048 Bit Merger)', '360° Vector Asteroids', 'Breakout: Firewall Brick Breaker', 'Snake: Fiber Worm Protocol',
  'Cyber-Pong: Zero-Latency Duel', 'Galaga: Skybeam Interceptor'
];

const COMPANIONS = [
  'Vigil (Relay Sentinel)', 'Nexus (Lattice Architect)', 'Mercury (Skyline Runner)', 'Ghostbyte (ZK Shadow)',
  'Athena (Tactical Oracle)', 'Chronos (Clocktower Warden)', 'Draco (Foundry Wyrm)', 'Ignis (Thermal Striker)',
  'Kai (Signal Monk)', 'Lycan (Rest Woods Tracker)', 'Onyx (Bastion Vanguard)', 'Scorpius (Venom Packet)',
  'Pixel-Shiba (Good Dog Protocol)', 'Kitsune (Nine-Tail Fox)', 'Leviathan (Abyssal Guardian)', 'Aquila (Skybeam Hawk)',
  'Kraken (Deep Trench Node)', 'Aether (Astral Weaver)', 'Pixel-Neko (Lucky Familiar)', 'Radical-Minion (Overclock Bot)',
  '03ng0cn1 (The Mirror Copy)', '1nc0gn30 (Hooded Operator)'
];

/**
 * Generates high-value, non-repetitive, context-rich posts for any account, day (1..90), and slot (1..5).
 */
export function generatePostForSlot(account, day, slot) {
  const h = normHandle(account);
  const dIdx = (day - 1);

  if (h === '1nc0gn30') {
    if (slot === 1) {
      const v = WOZ_VIDEOS[dIdx % WOZ_VIDEOS.length];
      return {
        text: `🎬 WORLD OF ZOTH — ${v.title} [Day ${day}/90]\n\n"The city is lit again, but now it can talk. Trust faces, not voices."\n\n• 20 Playable 3D Districts\n• 22 Companions & 22 Mini-Games\n\n🎮 https://github.com/1nc0gn30/world-of-zoth`,
        mediaFile: path.join(ROOT, v.file)
      };
    }
    if (slot === 2) {
      const dist = DISTRICTS[dIdx % DISTRICTS.length];
      const mg = MINIGAMES[dIdx % MINIGAMES.length];
      return {
        text: `🗺️ District Field Report [Day ${day}/90]: ${dist}\n\nReal-time 3D normal-bump relief, cyber-rain ripples & interior parallax windows in pure WebGL.\n\nTerminal challenge:\n> arcade (${mg})\n\nhttps://github.com/1nc0gn30/world-of-zoth`
      };
    }
    if (slot === 3) {
      const comp = COMPANIONS[dIdx % COMPANIONS.length];
      return {
        text: `⚡ Crew Dossier #${(dIdx % COMPANIONS.length) + 1}: ${comp}\n\nChain Lattice Sync multipliers (+30% DMG at x6) and unleash 4-agent Union Cataclysms when the timing bar hits gold.\n\nWho's in your active party at 06:12?\nhttps://github.com/1nc0gn30/world-of-zoth`
      };
    }
    if (slot === 4) {
      const mg = MINIGAMES[(dIdx + 7) % MINIGAMES.length];
      return {
        text: `🕹️ Safehouse Arcade [Cabinet #${((dIdx + 7) % MINIGAMES.length) + 1}/22]: ${mg}\n\nZero paywalls. Zero cloud servers.\nOpen the 3.6MB HTML bundle or Android APK, type > arcade, and chase the high score.\n\nhttps://github.com/1nc0gn30/world-of-zoth`
      };
    }
    return {
      text: `🔐 Null Academy Combat Tip [Day ${day}/90]:\n\nBosses with Reflective Shields (like 03ng0cn1) memorize your last command.\nMix > ping, > exploit, > firewall, and sub-second [SPACE] parries to break their stance.\n\nhttps://github.com/1nc0gn30/world-of-zoth`
    };
  }

  if (h === 'zoth_os') {
    const topics = [
      `🐧 ZothOS Kernel Note [Day ${day} · #1]:\n\nTrue digital sovereignty starts at boot.\nRunning Debian Live with toram loads the SquashFS root into RAM—zero disk traces, instant execution, clean resets.\n\nhttps://nullai.tech`,
      `🔐 ZothOS Security Enclave [Day ${day} · #2]:\n\nNever leave plaintext API keys in repo .env files.\nOur Rust zoth-vault-daemon (:8787) uses Argon2id + XChaCha20-Poly1305 and injects secrets directly into memory.\n\nhttps://nullai.tech`,
      `⚡ ZothOS CLI Arsenal [Day ${day} · #3]:\n\nEvery tool in ZothOS ships with dual-interface parity:\n1. CLI binary (/usr/local/bin/<tool> --json)\n2. Localhost multi-pane web workstation\n\n100% offline-first • https://nullai.tech`,
      `🖥️ Desktop Determinism [Day ${day} · #4]:\n\nDeterministic Xcursor binary packaging + KWIN_FORCE_SW_CURSOR guarantees zero invisible cursors across QEMU, VirtIO-GPU, and bare-metal NVMe boots.\n\nhttps://nullai.tech`,
      `🧠 Local-First AI Daemons [Day ${day} · #5]:\n\nZothOS pairs local LLM inference with our Neuro-Memory STDP daemon (:8094) so your terminal remembers architectural context on your own hardware.\n\nhttps://nullai.tech`
    ];
    return { text: topics[(slot - 1) % topics.length] };
  }

  if (h === 'zothstudio') {
    const topics = [
      `✨ Zoth Studio Design Standard [Day ${day} · #1]:\n\nBanish cookie-cutter templates.\nWe pair expressive typography (Syne / Clash Display) with 60fps Unicode Braille choreography and Bayer 8x8 dithering.\n\nhttps://nullai.tech`,
      `🤖 The 21-Agent Pantheon [Day ${day} · #2]:\n\nZoth Studio routes tasks across specialized sovereign agents—Vigil for security audits, Nexus for architecture, Ghostbyte for ZK crypto, and Athena for verification.\n\nhttps://nullai.tech`,
      `🎨 Real-Time WebGL & Audio [Day ${day} · #3]:\n\nWhy ship static hero images when the browser gives you WebGL2 and WebAudio?\nProcedural normal-bump shaders + 140 BPM synth audio beat pre-rendered bloat.\n\nhttps://github.com/1nc0gn30`,
      `🔓 100% Open-Access Tools [Day ${day} · #4]:\n\nEvery web utility we release is 100% unlocked by default.\nZero paywall blurs. Real client-side AST parsing, crypto transforms & visualizers directly in your browser.\n\nhttps://nullai.tech`,
      `📐 Triple-Viewport Verification [Day ${day} · #5]:\n\nEvery build runs through headless Chromium CDP checks at 375px Mobile, 768px Tablet, and 1440px Desktop—enforcing zero console errors and zero overflow.\n\nhttps://nullai.tech`
    ];
    return { text: topics[(slot - 1) % topics.length] };
  }

  if (h === 'nealfraziertech') {
    const topics = [
      `⚡ Builder's Log [Day ${day} · #1]:\n\nThe best way to master a stack is shipping self-contained software daily—from zero-dependency 3D WebGL engines to Rust Argon2id secret vaults.\n\nhttps://nealfrazier.tech`,
      `🛠️ Zero-Dependency Architecture [Day ${day} · #2]:\n\nWriting custom WebGL shaders, procedural WebAudio synths, and zero-dependency Node CLIs keeps bundles tiny, auditable, and instantaneous.\n\nhttps://github.com/1nc0gn30`,
      `🚀 World of Zoth v2.0 Sprint [Day ${day} · #3]:\n\n• 20 playable 3D districts\n• 22 built-in arcade mini-games\n• 24 1080p theatrical commercials\n• 3.6MB single-file HTML + signed Android APK\n\nhttps://github.com/1nc0gn30/world-of-zoth`,
      `🔐 Security Hygiene [Day ${day} · #4]:\n\nNever leave raw .env files scattered across repos.\nCentralize secrets in a 0600 local vault and inject them into subprocesses on demand.\n\nhttps://nealfrazier.tech`,
      `🌐 The NullAI Ecosystem [Day ${day} · #5]:\n\n• nealfrazier.tech — Engineering Hub\n• nullai.tech — Autonomous Research\n• ZothOS & Zoth Studio — Sovereign OS & 21-Agent IDE\n• World of Zoth — 3D Cyber-RPG`
    ];
    return { text: topics[(slot - 1) % topics.length] };
  }

  // @dinorawrai
  const topics = [
    `🦖 RAWR REPORT [Day ${day} · #1]:\n\nWe packed 20 3D districts, 22 arcade games (Galaga, Breakout, Cyber-Pong, Vector Tank!), and a cyber-shiba into a 3.6MB HTML file!\n\nPlay free: https://github.com/1nc0gn30/world-of-zoth`,
    `🕹️ 22-Cabinet Arcade Challenge [Day ${day} · #2]:\n\nThere are 22 playable arcade cabinets inside the World of Zoth Safehouse—from Doom-Fire & Asteroids to Hilbert Packet Runner.\n\nWhich cabinet are you playing first? 👇`,
    `🎵 140 BPM WebAudio Synth [Day ${day} · #3]:\n\nZero MP3 files needed—every bassline, arpeggio, and boss theme in World of Zoth is synthesized live in your browser using pure WebAudio!\n\nType > radio or > synth in-game.`,
    `🐕 Good Dog Protocol [Day ${day} · #4]:\n\nPSA: You CAN pet the Pixel-Shiba and Pixel-Neko in World of Zoth (District #17: Chrono-Vault Pet Sanctuary) and they grant passive squad buffs!\n\nhttps://github.com/1nc0gn30/world-of-zoth`,
    `✨ 06:12 Shader Magic [Day ${day} · #5]:\n\nCyber-rain ripples bouncing off wet neon asphalt while 21 sovereign skybeams light up the Mode-7 Skyline.\n\n24 theatrical episodes streaming in-engine: https://github.com/1nc0gn30/world-of-zoth`
  ];
  return { text: topics[(slot - 1) % topics.length] };
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) {}
  }
  return {
    startedAt: new Date().toISOString(),
    accounts: {
      '1nc0gn30':        { day: 1, nextSlot: 2, history: [] }, // Slot 1 (Ep 1) already posted today!
      'zoth_os':         { day: 1, nextSlot: 1, history: [] },
      'zothstudio':      { day: 1, nextSlot: 1, history: [] },
      'nealfraziertech': { day: 1, nextSlot: 1, history: [] },
      'dinorawrai':      { day: 1, nextSlot: 1, history: [] }
    }
  };
}

function saveState(st) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(st, null, 2), { mode: 0o600 });
}

async function main() {
  const args = process.argv.slice(2);
  const env = loadVaultEnv();
  const baseCreds = { apiKey: env.X_API_KEY, apiSecret: env.X_API_SECRET };

  // 1. Generate a batch of OAuth 1.0a Request Tokens for connecting multiple accounts
  if (args.includes('--request-batch')) {
    const count = parseInt(args[args.indexOf('--request-batch') + 1] || '4', 10);
    const labels = ['zoth_os', 'zothstudio', 'nealfraziertech', 'dinorawrai'];
    let pending = {};
    if (fs.existsSync(PENDING_OAUTH)) {
      try { pending = JSON.parse(fs.readFileSync(PENDING_OAUTH, 'utf8')); } catch (_) {}
    }
    console.log('================================================================');
    console.log('🔗 MULTI-ACCOUNT OAUTH 1.0a AUTHORIZATION LINKS');
    console.log('================================================================');
    for (let i = 0; i < count; i++) {
      const reqUrl = 'https://api.twitter.com/oauth/request_token';
      const auth = oauthHeader('POST', reqUrl, {}, baseCreds, { oauth_callback: 'oob' });
      const res = await httpsRequest('POST', reqUrl, { Authorization: auth });
      const parsed = Object.fromEntries(new URLSearchParams(res.data));
      pending[parsed.oauth_token] = {
        oauth_token_secret: parsed.oauth_token_secret,
        suggested_for: labels[i] || `account_${i + 1}`,
        created_at: new Date().toISOString()
      };
      console.log(`${i + 1}. For @${labels[i] || `account_${i + 1}`}:`);
      console.log(`   https://api.twitter.com/oauth/authorize?oauth_token=${parsed.oauth_token}\n`);
    }
    fs.writeFileSync(PENDING_OAUTH, JSON.stringify(pending, null, 2), { mode: 0o600 });
    return;
  }

  // 2. Exchange any 7-digit PIN(s) and automatically detect & save the @screen_name into Zoth Vault
  if (args.includes('--pin')) {
    const pins = args.slice(args.indexOf('--pin') + 1).filter(x => /^\d{6,8}$/.test(x));
    const pending = fs.existsSync(PENDING_OAUTH) ? JSON.parse(fs.readFileSync(PENDING_OAUTH, 'utf8')) : {};
    const tokens = Object.entries(pending).reverse();
    for (const pin of pins) {
      let matched = false;
      for (const [oauthToken, info] of tokens) {
        try {
          const accUrl = 'https://api.twitter.com/oauth/access_token';
          const auth = oauthHeader('POST', accUrl, { oauth_verifier: pin }, {
            apiKey: baseCreds.apiKey,
            apiSecret: baseCreds.apiSecret,
            accessToken: oauthToken,
            accessSecret: info.oauth_token_secret
          }, { oauth_verifier: pin });
          const body = `oauth_verifier=${encodeURIComponent(pin)}`;
          const res = await httpsRequest('POST', accUrl, {
            Authorization: auth,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body)
          }, Buffer.from(body));
          const parsed = Object.fromEntries(new URLSearchParams(res.data));
          const handle = normHandle(parsed.screen_name);
          const upper = handle.toUpperCase();
          saveVaultVars({
            [`X_TOKEN_${upper}`]: parsed.oauth_token,
            [`X_SECRET_${upper}`]: parsed.oauth_token_secret,
            [`X_USERID_${upper}`]: parsed.user_id
          });
          delete pending[oauthToken];
          fs.writeFileSync(PENDING_OAUTH, JSON.stringify(pending, null, 2), { mode: 0o600 });
          console.log(`✅ Connected @${parsed.screen_name} (user_id=${parsed.user_id}) -> Saved to Zoth Vault as X_TOKEN_${upper}`);
          matched = true;
          break;
        } catch (_) {}
      }
      if (!matched) {
        console.error(`❌ Could not exchange PIN ${pin} (expired or already used).`);
      }
    }
    return;
  }

  // 3. Status of all 5 accounts in Zoth Vault
  if (args.includes('--status')) {
    const handles = ['1nc0gn30', 'zoth_os', 'zothstudio', 'nealfraziertech', 'dinorawrai'];
    const st = loadState();
    console.log('================================================================');
    console.log('🔐 ZOTH VAULT — 5-ACCOUNT X NETWORK & 90-DAY CAMPAIGN STATUS');
    console.log('================================================================');
    for (const h of handles) {
      const c = getAccountCreds(h);
      const connected = Boolean(c.accessToken && c.accessSecret);
      const ast = st.accounts[h] || { day: 1, nextSlot: 1, history: [] };
      console.log(`• @${h.padEnd(16)} : ${connected ? '✅ CONNECTED (Zoth Vault)' : '⏳ AWAITING OAUTH PIN'} | Day ${ast.day}/90, Next Slot: ${ast.nextSlot}/5 | Posted: ${ast.history.length}`);
    }
    console.log('================================================================');
    return;
  }

  // 4. Run next scheduled slot across all connected accounts (or specific --account)
  if (args.includes('--run-slot')) {
    const targetAcc = args.includes('--account') ? [normHandle(args[args.indexOf('--account') + 1])] : ['1nc0gn30', 'zoth_os', 'zothstudio', 'nealfraziertech', 'dinorawrai'];
    const dryRun = args.includes('--dry-run');
    const st = loadState();

    for (const h of targetAcc) {
      const creds = getAccountCreds(h);
      if (!creds.accessToken || !creds.accessSecret) {
        console.log(`⏭️  Skipping @${h} (not yet authorized in Zoth Vault)`);
        continue;
      }
      if (!st.accounts[h]) st.accounts[h] = { day: 1, nextSlot: 1, history: [] };
      const ast = st.accounts[h];
      if (ast.day > 90) {
        console.log(`🏆 @${h} has completed the 90-day campaign!`);
        continue;
      }

      const payload = generatePostForSlot(h, ast.day, ast.nextSlot);
      console.log(`\n🚀 [@${h}] Day ${ast.day}/90 · Slot ${ast.nextSlot}/5`);
      console.log(payload.text);
      if (payload.mediaFile) console.log(`📎 Video: ${payload.mediaFile}`);

      if (!dryRun) {
        try {
          let mediaId = null;
          if (payload.mediaFile && fs.existsSync(payload.mediaFile)) {
            mediaId = await uploadMediaChunked(payload.mediaFile, creds);
          }
          const tweet = await postTweet(payload.text, mediaId, creds);
          const url = `https://x.com/${h}/status/${tweet.id}`;
          console.log(`✅ LIVE: ${url}`);
          ast.history.push({
            day: ast.day,
            slot: ast.nextSlot,
            id: tweet.id,
            url,
            at: new Date().toISOString()
          });
          ast.nextSlot++;
          if (ast.nextSlot > 5) {
            ast.nextSlot = 1;
            ast.day++;
          }
          saveState(st);
        } catch (err) {
          console.error(`❌ Failed posting to @${h}:`, err.message);
        }
      }
    }
    return;
  }
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
