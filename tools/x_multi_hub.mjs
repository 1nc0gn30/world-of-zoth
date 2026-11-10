#!/usr/bin/env node
/**
 * ZOTH SOVEREIGN X (TWITTER) MULTI-ACCOUNT MEDIA & CAROUSEL ENGINE
 * Strict Brand Siloing:
 *   • @1nc0gn30         — Strictly World of Zoth & 1nc0gn30 (24 1080p Commercials + 4-Image Gameplay Carousels)
 *   • @zoth_os          — Strictly ZothOS Linux, Amnesic Boot, Security Enclave & Kernel (1080p Reels + 4-Image OS Carousels)
 *   • @nullaitech  — Strictly NullAI Platform Systems Architecture, Web Perf & Dev Tools (1080p Reels + 4-Image Tool Carousels)
 *   • @dinorawrai       — PAUSED & 100% ISOLATED until dedicated DinoRawrAI folder is configured (zero cross-brand links)
 *   • @zothstudio       — PAUSED until account password recovery
 *
 * Every post attaches either:
 *   - A 1080p MP4 Video, OR
 *   - A 4-Image High-Resolution Carousel (media_ids: [id1, id2, id3, id4])
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VAULT_DIR = path.join(process.env.HOME || '/home/zoth', '.config', 'zoth-vault');
const VAULT_ENV = path.join(VAULT_DIR, 'x.env');
const PENDING_OAUTH = path.join(VAULT_DIR, 'x_pending_oauth.json');
const STATE_FILE = path.join(VAULT_DIR, 'x_campaign_state.json');
const WEEKLY_QUEUE_FILE = path.join(ROOT, 'tools', 'weekly_content_queue.json');
const TOOL_SHOWCASES_FILE = path.join(ROOT, 'tools', 'zoth_studio_tool_showcases.json');

// Active accounts right now (dinorawrai & zothstudio strictly paused)
const ACTIVE_ACCOUNTS = ['1nc0gn30', 'zoth_os', 'nullaitech'];

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
  let s = str.trim();
  const weightedLen = (txt) => {
    const withoutUrls = txt.replace(/https?:\/\/\S+/g, 'X'.repeat(23));
    let count = 0;
    for (const ch of withoutUrls) {
      count += ch.codePointAt(0) > 0xFFFF ? 2 : 1;
    }
    return count;
  };
  if (weightedLen(s) <= 272) return s;
  while (s.length > 0 && weightedLen(s + '…') > 272) {
    s = s.slice(0, -1).trimEnd();
  }
  return s + '…';
}

async function postTweet(text, mediaIds, creds) {
  const url = 'https://api.twitter.com/2/tweets';
  const payload = { text: fitTweet280(text) };
  if (Array.isArray(mediaIds) && mediaIds.length > 0) {
    payload.media = { media_ids: mediaIds.slice(0, 4) };
  }
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const res = await httpsRequest('POST', url, {
    Authorization: oauthHeader('POST', url, {}, creds),
    'Content-Type': 'application/json',
    'Content-Length': body.length
  }, body);
  return res.data.data;
}

// ============================================================================
// 1. @1nc0gn30 — STRICTLY WORLD OF ZOTH & 1NC0GN30 MEDIA POOLS
// ============================================================================
const WOZ_VIDEOS = [
  { ep: 1,  file: path.join(ROOT, 'dist/world-of-zoth-commercial.mp4'),      title: 'EP I: 06:12 — Faces, Not Voices' },
  { ep: 2,  file: path.join(ROOT, 'dist/world-of-zoth-ep2-crew.mp4'),        title: 'EP II: Midnight at the Safehouse' },
  { ep: 3,  file: path.join(ROOT, 'dist/world-of-zoth-ep3-combat.mp4'),      title: 'EP III: 99 Floors of Fury' },
  { ep: 4,  file: path.join(ROOT, 'dist/world-of-zoth-ep4-secrets.mp4'),     title: 'EP IV: Behind the Wireframe — Secrets of 06:13' },
  { ep: 5,  file: path.join(ROOT, 'dist/world-of-zoth-ep5-horizon.mp4'),     title: 'EP V: The Dawn Horizon (District #20)' },
  { ep: 6,  file: path.join(ROOT, 'dist/world-of-zoth-ep6-arcade.mp4'),      title: 'EP VI: The Safehouse Megaplex (22 Mini-Games)' },
  { ep: 7,  file: path.join(ROOT, 'dist/world-of-zoth-ep7-academy.mp4'),     title: 'EP VII: Null Academy — Hack the Prompt' },
  { ep: 8,  file: path.join(ROOT, 'dist/world-of-zoth-ep8-sunrise.mp4'),     title: 'EP VIII: 06:13 — The Sunrise Finale' },
  { ep: 9,  file: path.join(ROOT, 'dist/world-of-zoth-ep9-mirror.mp4'),      title: 'EP IX: The Mirror\'s Edge (03ng0cn1)' },
  { ep: 10, file: path.join(ROOT, 'dist/world-of-zoth-ep10-gala.mp4'),       title: 'EP X: The Pantheon Gala (3D PBR Shaders)' },
  { ep: 11, file: path.join(ROOT, 'dist/world-of-zoth-ep11-skyline.mp4'),    title: 'EP XI: Skybeam Interceptor (Galaga #22)' },
  { ep: 12, file: path.join(ROOT, 'dist/world-of-zoth-ep12-season.mp4'),     title: 'EP XII: 06:12 to 06:13 (Season I Finale)' },
  { ep: 13, file: path.join(ROOT, 'dist/world-of-zoth-ep13-monsoon.mp4'),    title: 'EP XIII: Monsoon Over Relit City' },
  { ep: 14, file: path.join(ROOT, 'dist/world-of-zoth-ep14-heist.mp4'),      title: 'EP XIV: The Black-Market Heist' },
  { ep: 15, file: path.join(ROOT, 'dist/world-of-zoth-ep15-colosseum.mp4'),  title: 'EP XV: Wager at the Colosseum' },
  { ep: 16, file: path.join(ROOT, 'dist/world-of-zoth-ep16-pirateradio.mp4'),title: 'EP XVI: 06:12 Pirate Radio FM' },
  { ep: 17, file: path.join(ROOT, 'dist/world-of-zoth-ep17-pets.mp4'),       title: 'EP XVII: The Cyber-Familiar Sanctuary' },
  { ep: 18, file: path.join(ROOT, 'dist/world-of-zoth-ep18-quantum.mp4'),    title: 'EP XVIII: The Quantum Loom Conspiracy' },
  { ep: 19, file: path.join(ROOT, 'dist/world-of-zoth-ep19-cards.mp4'),      title: 'EP XIX: Grandmaster of Pantheon Triad' },
  { ep: 20, file: path.join(ROOT, 'dist/world-of-zoth-ep20-speedrun.mp4'),   title: 'EP XX: 2.0x Hyper-Clock Speedrun' },
  { ep: 21, file: path.join(ROOT, 'dist/world-of-zoth-ep21-foundry.mp4'),    title: 'EP XXI: Forged in Doom-Fire' },
  { ep: 22, file: path.join(ROOT, 'dist/world-of-zoth-ep22-detective.mp4'),  title: 'EP XXII: The Seventh Reflection (Cyber-Noir)' },
  { ep: 23, file: path.join(ROOT, 'dist/world-of-zoth-ep23-megaplex.mp4'),   title: 'EP XXIII: The 22-Cabinet Arcade Marathon' },
  { ep: 24, file: path.join(ROOT, 'dist/world-of-zoth-ep24-pantheon.mp4'),   title: 'EP XXIV: 24 Episodes of Zoth (Season II Finale)' }
];

const WOZ_BONUS_VIDEOS = [
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_REAL-LIFE-ALEXA65-TRAILER-16x9.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_REAL-LIFE-ALEXA65-REEL-9x16.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_REAL-LIFE-COMEDY-RTX-ON.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_VOICED-SEASON3-CINEMA-TRAILER.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_VOICED-COMEDY-BOSS-READS-STATS.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_VOICED-COMEDY-MERCURY-SPEEDRUN-ROCK.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_V2-LAUNCH-EDIT.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_MOTION-EDIT.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_THE-MOVIE.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/world-of-zoth_CREW-SHOWCASE.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_THE-MOVIE.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_SITE-SHOWREEL.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_MOTION-EDIT.mp4',
  path.join(ROOT, 'assets/world-of-zoth-trailer.mp4')
];

const WOZ_DISTRICT_SHOTS = [
  'z_hub.png', 'z_forest.png', 'z_relay.png', 'z_fiber.png', 'z_clock.png',
  'z_streets.png', 'z_foundry.png', 'z_caves.png', 'z_mirrors.png', 'z_deep.png',
  'z_skyline.png', 'z_abyss.png', 'z_citadel.png', 'z_nullcore.png', 'z_rooftop.png',
  'z_loom.png', 'z_vault.png', 'z_astral.png', 'z_omega.png', 'z_horizon.png'
].map(f => path.join(ROOT, 'shots', f));

const WOZ_BATTLE_SHOTS = [
  path.join(ROOT, 'assets/woz_v04_battle_sync.jpg'),
  path.join(ROOT, 'assets/woz_v04_blender_hunter.jpg'),
  path.join(ROOT, 'assets/woz_v04_party_copy.jpg'),
  path.join(ROOT, 'assets/woz_v04_codex.jpg'),
  path.join(ROOT, 'assets/woz_v04_hud.jpg'),
  path.join(ROOT, 'assets/woz_v04_skyline_spire.jpg'),
  path.join(ROOT, 'shots/z_archon_battle.jpg'),
  path.join(ROOT, 'shots/battle-03.png'),
  path.join(ROOT, 'shots/battle-05.png'),
  path.join(ROOT, 'shots/battle-06.png'),
  path.join(ROOT, 'shots/battle-11.png'),
  path.join(ROOT, 'shots/battle-12.png')
];

const WOZ_ARCADE_SHOTS = [
  path.join(ROOT, 'shots/egg_doom.png'),
  path.join(ROOT, 'shots/egg_life.png'),
  path.join(ROOT, 'shots/egg_scope.png'),
  path.join(ROOT, 'shots/egg_terminal.png'),
  path.join(ROOT, 'shots/egg_rooftop.png'),
  path.join(ROOT, 'screenshots/1-title.png'),
  path.join(ROOT, 'screenshots/2-vigil-dialogue.png'),
  path.join(ROOT, 'screenshots/3-battle-parry.png'),
  path.join(ROOT, 'screenshots/4-forest-party-battle.png'),
  path.join(ROOT, 'screenshots/5-the-hollow.png'),
  path.join(ROOT, 'screenshots/6-ending.png'),
  path.join(ROOT, 'assets/motion_edit_contact_sheet.jpg')
];

// ============================================================================
// 2. @zoth_os — STRICTLY ZOTHOS LINUX, KERNEL & SECURITY ENCLAVE MEDIA POOLS
// ============================================================================
const ZOTHOS_VIDEOS = [
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-SOVEREIGN-BRIDGE-COMMERCIAL.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-TORAM-RAM-ONLY-OS.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-MUSE-MEETS-ANTIGRAVITY.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/zoth-os/zoth-os-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/zoth-os-website/zoth-os-website-reel-16x9.mp4',
  '/home/zoth/NullAITech/media-assets/zothos-lite-cot-motion-edit.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/envguard-secrets-vault/envguard-secrets-vault-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/anderson-security-sentinel/anderson-security-sentinel-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/neuro-memory-daemon/neuro-memory-daemon-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/payload-entropy-studio/payload-entropy-studio-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/jwt-inspector-guard/jwt-inspector-guard-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/web-security-guard/web-security-guard-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/sovereign-agent-bridge/sovereign-agent-bridge-reel-16x9.mp4'
];

const ZOTHOS_IMAGES = [
  '/home/zoth/nullaitech-upgrade/art-v2/zoth-os/zoth-os-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/zoth-os-website/zoth-os-website-hero-16x9.png',
  '/home/zoth/Pictures/1nc0gn30-campaign/01-zothos-your-rules.png',
  '/home/zoth/Pictures/1nc0gn30-campaign/05-zothos-your-world.png',
  '/home/zoth/Pictures/1nc0gn30-campaign/07-local-power.png',
  '/home/zoth/Pictures/1nc0gn30-campaign/04-no-kings.png',
  '/home/zoth/NullAITech/media-assets/zothos-lite-cot-motion-sheet.png',
  '/home/zoth/nullaitech-upgrade/art-v2/envguard-secrets-vault/envguard-secrets-vault-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/anderson-security-sentinel/anderson-security-sentinel-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/neuro-memory-daemon/neuro-memory-daemon-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/payload-entropy-studio/payload-entropy-studio-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/jwt-inspector-guard/jwt-inspector-guard-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/web-security-guard/web-security-guard-hero-16x9.png',
  '/home/zoth/NullAITech/video-production/tool-69-zoth-os/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-74-zothos-lite/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-26-envguard-secrets-vault/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-13-anderson-security-sentinel/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-31-hexstrike-arsenal/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-30-ghidra-mcp-bridge/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-60-yara-sigma-forge/thumbnail.jpg'
].filter(p => fs.existsSync(p));

// ============================================================================
// 3. @nullaitech — STRICTLY NULLAI PLATFORM ENGINEERING MEDIA POOLS
// ============================================================================
const NFT_VIDEOS = [
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-AI-TOASTER-SUBSCRIPTION.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-ONE-LINE-HOTFIX.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-900-COOKIE-PARTNERS.mp4',
  '/home/zoth/Desktop/zoth-1nc0gn30-videos/out/1nc0gn30_VOICED-COMEDY-BOTS-SCRAPE-ENV.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/aeo-graph-engine/aeo-graph-engine-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/cwv-speed-engine/cwv-speed-engine-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/polyglot-framework-exporter/polyglot-framework-exporter-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/schema-illustrator-studio/schema-illustrator-studio-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/regex-droid-builder/regex-droid-builder-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/cron-rhythm-studio/cron-rhythm-studio-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/badge3d-coin-generator/badge3d-coin-generator-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/subsweep-lead-scanner/subsweep-lead-scanner-reel-16x9.mp4',
  '/home/zoth/nullaitech-upgrade/reels-v2/city-desk/city-desk-reel-16x9.mp4',
  '/home/zoth/NullAITech/video-production/tool-01-zoth-swarm-multiplexer/video_tool_01_zoth_swarm_multiplexer.mp4'
].filter(p => fs.existsSync(p));

const NFT_IMAGES = [
  '/home/zoth/nullaitech-upgrade/art-v2/aeo-graph-engine/aeo-graph-engine-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/cwv-speed-engine/cwv-speed-engine-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/polyglot-framework-exporter/polyglot-framework-exporter-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/schema-illustrator-studio/schema-illustrator-studio-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/regex-droid-builder/regex-droid-builder-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/cron-rhythm-studio/cron-rhythm-studio-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/badge3d-coin-generator/badge3d-coin-generator-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/subsweep-lead-scanner/subsweep-lead-scanner-hero-16x9.png',
  '/home/zoth/nullaitech-upgrade/art-v2/city-desk/city-desk-hero-16x9.png',
  '/home/zoth/NullAITech/video-production/tool-03-aeo-graph-engine/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-20-cwv-speed-engine/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-43-polyglot-framework-exporter/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-50-schema-illustrator-studio/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-48-regex-droid-builder/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-19-cron-rhythm-studio/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-56-vector-search-engine/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-59-webmcp-protocol-inspector/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-47-pwa-manifest-builder/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-49-robots-txt-auditor/thumbnail.jpg',
  '/home/zoth/NullAITech/video-production/tool-17-certpath-roadmap-studio/thumbnail.jpg'
].filter(p => fs.existsSync(p));

function pick4Images(pool, startIdx) {
  const out = [];
  for (let i = 0; i < 4 && pool.length > 0; i++) {
    out.push(pool[(startIdx + i) % pool.length]);
  }
  return out;
}

export function generatePostForSlot(account, day, slot) {
  const h = normHandle(account);
  const dIdx = day - 1;

  // 0. For @1nc0gn30 Slot 5, feature the Live-Action Real-Life World of Zoth (ARRI Alexa 65) & Voiced Cinema Reels
  if (h === '1nc0gn30' && slot === 5) {
    const bv = WOZ_BONUS_VIDEOS[dIdx % WOZ_BONUS_VIDEOS.length];
    if (fs.existsSync(bv)) {
      return {
        text: `🎥 WORLD OF ZOTH — IN REAL LIFE (ARRI Alexa 65 · 06:12) [Day ${day}/90]\n\nWhat if World of Zoth wasn't CGI, but a real physical plaza of wet black basalt, recessed glowing brass channels, and a 60m smoked-glass Nullcore gyroscope?\n\nPlay free in browser: https://1nc0gn30.si #IndieDev #Cinema #WebGL #SciFi`,
        mediaFiles: [bv]
      };
    }
  }

  // 0b. For @zoth_os, @nullaitech, and @zothstudio, showcase Live Working Zoth Studio Tool Videos on Slots 1, 3, 4, 5
  if ((h === 'zoth_os' || h === 'nullaitech' || h === 'zothstudio') && [1, 3, 4, 5].includes(slot) && fs.existsSync(TOOL_SHOWCASES_FILE)) {
    try {
      const showcases = JSON.parse(fs.readFileSync(TOOL_SHOWCASES_FILE, 'utf8'));
      const pool = showcases.filter(item =>
        (h === 'zothstudio' || item.account === h) &&
        item.videoFile &&
        fs.existsSync(item.videoFile)
      );
      if (pool.length > 0) {
        const pickIdx = (dIdx * 4 + [1, 3, 4, 5].indexOf(slot)) % pool.length;
        const chosen = pool[pickIdx];
        return {
          text: chosen.text,
          mediaFiles: [chosen.videoFile]
        };
      }
    } catch (_) {}
  }

  // Check curated Weekly Content Queue (105 posts + 252 custom 1080p 4-slide carousel decks)
  if (fs.existsSync(WEEKLY_QUEUE_FILE)) {
    try {
      const q = JSON.parse(fs.readFileSync(WEEKLY_QUEUE_FILE, 'utf8'));
      const list = q.accounts && q.accounts[h];
      if (Array.isArray(list)) {
        const wDay = (dIdx % 7) + 1;
        const match = list.find(item => item.day === wDay && item.slot === slot);
        if (match && Array.isArray(match.mediaFiles) && match.mediaFiles.every(f => fs.existsSync(f))) {
          // For @1nc0gn30 Slot 1, always advance through all 24 episodes across the 90 days
          if (h === '1nc0gn30' && slot === 1) {
            const v = WOZ_VIDEOS[dIdx % WOZ_VIDEOS.length];
            return {
              text: `🎬 WORLD OF ZOTH — ${v.title} [Day ${day}/90]\n\n"The city is lit again, but now it can talk. Trust faces, not voices."\n\n• 20 Playable 3D WebGL Districts\n• 22 Companions & 22 Mini-Games\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieDev #WebGL #CyberRPG`,
              mediaFiles: [v.file]
            };
          }
          return {
            text: match.text.replace(/Day \d+\/90/g, `Day ${day}/90`).replace(/Day \d+ ·/g, `Day ${day} ·`),
            mediaFiles: match.mediaFiles
          };
        }
      }
    } catch (_) {}
  }

  // ── 1. @1nc0gn30 (Strictly World of Zoth & 1nc0gn30 Saga) ──
  if (h === '1nc0gn30') {
    if (slot === 1) {
      const v = WOZ_VIDEOS[dIdx % WOZ_VIDEOS.length];
      return {
        text: `🎬 WORLD OF ZOTH — ${v.title} [Day ${day}/90]\n\n"The city is lit again, but now it can talk. Trust faces, not voices."\n\n• 20 Playable 3D WebGL Districts\n• 22 Companions & 22 Mini-Games\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieDev #WebGL #CyberRPG`,
        mediaFiles: [v.file]
      };
    }
    if (slot === 2) {
      return {
        text: `🗺️ 3D Lattice Architecture [Day ${day}/90]\n\nEvery facade in World of Zoth computes procedural world-space FBM normal-bump relief, wet cyber-rain ripples & interior parallax windows in pure WebGL—zero external textures.\n\nhttps://github.com/1nc0gn30/world-of-zoth #GameDev #Shaders #WebGL`,
        mediaFiles: pick4Images(WOZ_DISTRICT_SHOTS, dIdx * 4)
      };
    }
    if (slot === 3) {
      return {
        text: `⚔️ Terminal Command Combat [Day ${day}/90]\n\nTurn-based tactical strikes driven by real terminal verbs (> ping, > exploit, > firewall).\nChain x6 Lattice Syncs (+30% DMG) and time sub-second parries against reflective bosses.\n\nhttps://github.com/1nc0gn30/world-of-zoth #IndieGames #RPG #PixelArt`,
        mediaFiles: pick4Images(WOZ_BATTLE_SHOTS, dIdx * 3)
      };
    }
    if (slot === 4) {
      return {
        text: `🕹️ Inside the 22-Cabinet Safehouse Megaplex [Day ${day}/90]\n\nFrom Conway's Game of Life, Doom-Fire & 3:2 Oscilloscope Handshakes to Galaga, Breakout & Pantheon Triad—all packed inside a 3.6MB HTML file.\n\nhttps://github.com/1nc0gn30/world-of-zoth #RetroGaming #JavaScript`,
        mediaFiles: pick4Images(WOZ_ARCADE_SHOTS, dIdx * 3)
      };
    }
    const bv = WOZ_BONUS_VIDEOS[dIdx % WOZ_BONUS_VIDEOS.length];
    return {
      text: `⚡ 06:12 Director's Cut Reel [Day ${day}/90]\n\n140 BPM procedural WebAudio synthesis + 22 Blender 4.3 wireframe monuments across 20 playable districts.\n100% open-access in browser & Android APK.\n\nhttps://github.com/1nc0gn30/world-of-zoth #CreativeCoding #IndieGameDev`,
      mediaFiles: [bv]
    };
  }

  // ── 2. @zoth_os (Strictly ZothOS Linux, Amnesic Boot, Security Enclave & Kernel) ──
  if (h === 'zoth_os') {
    if (slot === 1) {
      const v = ZOTHOS_VIDEOS[dIdx % ZOTHOS_VIDEOS.length];
      return {
        text: `🐧 ZothOS Sovereign Linux [Day ${day} · #1]\n\nBooting Debian Live with toram loads the entire SquashFS root into RAM—delivering zero disk forensics, instant binary execution, and clean amnesic resets on power-off.\n\n#Linux #CyberSecurity #Privacy #OpenSource`,
        mediaFiles: [v]
      };
    }
    if (slot === 2) {
      return {
        text: `🔐 Zero-Leak Secrets Architecture [Day ${day} · #2]\n\nPlaintext .env files on disk are a prime credential-harvesting target.\nZothOS uses a local Rust daemon (:8787) with Argon2id (64MiB) + XChaCha20-Poly1305 to inject keys directly into RAM via execvpe.\n\n#InfoSec #RustLang #DevSecOps`,
        mediaFiles: pick4Images(ZOTHOS_IMAGES, dIdx * 4)
      };
    }
    if (slot === 3) {
      return {
        text: `⚡ CLI + Localhost Workstation Parity [Day ${day} · #3]\n\nEvery security and analysis utility in ZothOS ships with both:\n1. A scriptable CLI binary (--json)\n2. A zero-cloud local web workstation\n\nPipe it in bash or inspect visually—100% offline.\n\n#LinuxAdmin #SysAdmin #CLI`,
        mediaFiles: pick4Images(ZOTHOS_IMAGES, dIdx * 4 + 4)
      };
    }
    if (slot === 4) {
      return {
        text: `🖥️ Live ISO Desktop Hardening [Day ${day} · #4]\n\nWhen building custom Debian Live SquashFS images for KDE Plasma 6 & XFCE, enforcing Xcursor binary integrity + KWIN_FORCE_SW_CURSOR eliminates invisible cursors across QEMU & bare-metal NVMe.\n\n#LinuxDesktop #Kernel #OSDev`,
        mediaFiles: pick4Images(ZOTHOS_IMAGES, dIdx * 4 + 8)
      };
    }
    const v2 = ZOTHOS_VIDEOS[(dIdx + 5) % ZOTHOS_VIDEOS.length];
    return {
      text: `🧠 Local-First AI & Defense Enclave [Day ${day} · #5]\n\nYour operating system should never phone home to analyze your code or network traffic.\nZothOS runs YARA/Sigma auditing, payload entropy analysis, and local LLM memory strictly on-device.\n\n#LocalAI #AppSec #Linux`,
      mediaFiles: [v2]
    };
  }

  // ── 3. @nullaitech (Strictly NullAI Platform Systems Architecture & Engineering) ──
  if (h === 'nullaitech') {
    if (slot === 1) {
      const v = NFT_VIDEOS[dIdx % NFT_VIDEOS.length];
      return {
        text: `⚡ Systems Architecture Note [Day ${day} · #1]\n\nThe fastest web applications do the heavy lifting client-side.\nBy running AST parsing, schema validation, and cryptographic transforms directly in the browser, you eliminate server latency and cloud lock-in.\n\nhttps://nullai.tech #SoftwareEngineering #WebDev`,
        mediaFiles: [v]
      };
    }
    if (slot === 2) {
      return {
        text: `📐 Answer Engine Optimization (AEO) & Schema Graphs [Day ${day} · #2]\n\nModern discovery requires structured @graph JSON-LD pairing SoftwareApplication + FAQPage entities alongside clean robots.txt rules so AI crawlers cite your architecture accurately.\n\nhttps://nullai.tech #SEO #AEO #WebPerformance`,
        mediaFiles: pick4Images(NFT_IMAGES, dIdx * 4)
      };
    }
    if (slot === 3) {
      return {
        text: `🚀 Core Web Vitals & Zero-Dependency Discipline [Day ${day} · #3]\n\nEvery third-party script costs main-thread blocking time (INP) and layout stability (CLS).\nAuditing bundle entropy and shipping lean, self-contained modules keeps load times sub-100ms.\n\nhttps://nullai.tech #JavaScript #Performance #FullStack`,
        mediaFiles: pick4Images(NFT_IMAGES, dIdx * 4 + 4)
      };
    }
    if (slot === 4) {
      return {
        text: `🛠️ Automated Multi-Viewport UI Verification [Day ${day} · #4]\n\nNever deploy blind.\nRunning headless Chromium CDP checks across 375px Mobile, 768px Tablet, and 1440px Desktop guarantees zero console errors and zero horizontal overflow before production push.\n\nhttps://nullai.tech #DevOps #Frontend #Testing`,
        mediaFiles: pick4Images(NFT_IMAGES, dIdx * 4 + 8)
      };
    }
    const v2 = NFT_VIDEOS[(dIdx + 4) % NFT_VIDEOS.length];
    return {
      text: `🔓 Building Open-Access Developer Tools [Day ${day} · #5]\n\nDeveloper utilities should solve problems immediately when you open the page—no paywall blurs, no forced signups, just clean engineering.\n\nExplore our latest builds: https://nullai.tech #BuildInPublic #OpenSource #Tech`,
      mediaFiles: [v2]
    };
  }

  return null;
}

function loadState() {
  if (fs.existsSync(STATE_FILE)) {
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch (_) {}
  }
  return {
    startedAt: new Date().toISOString(),
    accounts: {
      '1nc0gn30':        { day: 1, nextSlot: 3, history: [] },
      'zoth_os':         { day: 1, nextSlot: 2, history: [] },
      'nullaitech': { day: 1, nextSlot: 2, history: [] },
      'dinorawrai':      { day: 1, nextSlot: 1, paused: true, history: [] },
      'zothstudio':      { day: 1, nextSlot: 1, paused: true, history: [] }
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

  if (args.includes('--request-batch')) {
    const count = parseInt(args[args.indexOf('--request-batch') + 1] || '1', 10);
    let pending = {};
    if (fs.existsSync(PENDING_OAUTH)) {
      try { pending = JSON.parse(fs.readFileSync(PENDING_OAUTH, 'utf8')); } catch (_) {}
    }
    for (let i = 0; i < count; i++) {
      const reqUrl = 'https://api.twitter.com/oauth/request_token';
      const auth = oauthHeader('POST', reqUrl, {}, baseCreds, { oauth_callback: 'oob' });
      const res = await httpsRequest('POST', reqUrl, { Authorization: auth });
      const parsed = Object.fromEntries(new URLSearchParams(res.data));
      pending[parsed.oauth_token] = {
        oauth_token_secret: parsed.oauth_token_secret,
        created_at: new Date().toISOString()
      };
      console.log(`https://api.twitter.com/oauth/authorize?oauth_token=${parsed.oauth_token}`);
    }
    fs.writeFileSync(PENDING_OAUTH, JSON.stringify(pending, null, 2), { mode: 0o600 });
    return;
  }

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
      if (!matched) console.error(`❌ Could not exchange PIN ${pin}.`);
    }
    return;
  }

  if (args.includes('--status')) {
    const handles = ['1nc0gn30', 'zoth_os', 'nullaitech', 'dinorawrai', 'zothstudio'];
    const st = loadState();
    console.log('==============================================================================');
    console.log('🔐 ZOTH VAULT — BRAND-ISOLATED X NETWORK & 90-DAY VIDEO/CAROUSEL STATUS');
    console.log('==============================================================================');
    for (const h of handles) {
      const c = getAccountCreds(h);
      const connected = Boolean(c.accessToken && c.accessSecret);
      const isActive = ACTIVE_ACCOUNTS.includes(h);
      const ast = st.accounts[h] || { day: 1, nextSlot: 1, history: [] };
      const statusLabel = !connected
        ? '⏳ AWAITING OAUTH'
        : isActive
          ? '🟢 ACTIVE (Video + 4-Img Carousels)'
          : '⏸️  PAUSED (Awaiting Brand Folder)';
      console.log(`• @${h.padEnd(16)} : ${statusLabel.padEnd(36)} | Day ${ast.day}/90 · Next Slot ${ast.nextSlot}/5`);
    }
    console.log('==============================================================================');
    return;
  }

  if (args.includes('--run-slot')) {
    const targetAcc = args.includes('--account')
      ? [normHandle(args[args.indexOf('--account') + 1])]
      : ACTIVE_ACCOUNTS;
    const forceSlot = args.includes('--slot') ? parseInt(args[args.indexOf('--slot') + 1], 10) : null;
    const dryRun = args.includes('--dry-run');
    const st = loadState();

    for (const h of targetAcc) {
      if (!ACTIVE_ACCOUNTS.includes(h)) {
        console.log(`⏸️  Skipping @${h} (paused until dedicated brand folder is configured)`);
        continue;
      }
      const creds = getAccountCreds(h);
      if (!creds.accessToken || !creds.accessSecret) {
        console.log(`⏭️  Skipping @${h} (not yet connected in Zoth Vault)`);
        continue;
      }
      if (!st.accounts[h]) st.accounts[h] = { day: 1, nextSlot: 1, history: [] };
      const ast = st.accounts[h];
      if (ast.day > 90) continue;

      const slotToRun = forceSlot || ast.nextSlot;
      const payload = generatePostForSlot(h, ast.day, slotToRun);
      if (!payload) continue;

      console.log(`\n🚀 [@${h}] Day ${ast.day}/90 · Slot ${slotToRun}/5`);
      console.log(payload.text);
      console.log(`📎 Media (${payload.mediaFiles.length}):`, payload.mediaFiles.map(f => path.basename(f)).join(', '));

      if (!dryRun) {
        try {
          const mediaIds = [];
          for (const mf of payload.mediaFiles.slice(0, 4)) {
            if (fs.existsSync(mf)) {
              const id = await uploadMediaChunked(mf, creds);
              mediaIds.push(id);
            }
          }
          const tweet = await postTweet(payload.text, mediaIds, creds);
          const url = `https://x.com/${h}/status/${tweet.id}`;
          console.log(`✅ LIVE WITH MEDIA (${mediaIds.length} attached): ${url}`);
          ast.history.push({
            day: ast.day,
            slot: slotToRun,
            id: tweet.id,
            mediaCount: mediaIds.length,
            url,
            at: new Date().toISOString()
          });
          if (!forceSlot) {
            ast.nextSlot++;
            if (ast.nextSlot > 5) {
              ast.nextSlot = 1;
              ast.day++;
            }
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
