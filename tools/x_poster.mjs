#!/usr/bin/env node
/**
 * World of Zoth — Zero-Dependency X (Twitter) Video & Thread Publisher
 * Supports:
 *   - OAuth 1.0a HMAC-SHA1 signing (zero npm dependencies, pure Node `crypto` + `https`)
 *   - Chunked MP4 video upload (`INIT` -> `APPEND` -> `FINALIZE` -> `STATUS` polling) via `upload.twitter.com/1.1/media/upload.json`
 *   - PNG/JPG/GIF image upload
 *   - v2 Tweet & Thread publishing via `api.twitter.com/2/tweets`
 *   - Built-in 24-Episode Commercial Campaign Presets (`--ep 1..24`, `--thread`, `--dry-run`)
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Load secrets from Zoth Sovereign Vault (~/.config/zoth-vault/x.env or zoth-vault CLI)
const ZOTH_VAULT_FILE = path.join(process.env.HOME || '', '.config', 'zoth-vault', 'x.env');
if (fs.existsSync(ZOTH_VAULT_FILE)) {
  for (const line of fs.readFileSync(ZOTH_VAULT_FILE, 'utf8').split('\n')) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
    }
  }
}
for (const k of ['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_SECRET', 'X_BEARER_TOKEN', 'X_CLIENT_ID', 'X_CLIENT_SECRET']) {
  if (!process.env[k]) {
    try {
      const val = execSync(`zoth-vault get ${k} 2>/dev/null`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      if (val) process.env[k] = val;
    } catch (_) {}
  }
}

const EPISODE_CAMPAIGN = [
  { ep: 1,  file: 'dist/world-of-zoth-commercial.mp4',      title: 'EP I: 06:12 — Faces, Not Voices',              hook: 'The city is lit again, but now it can talk.\n\nStep into the 3D WebGL lattice of WORLD OF ZOTH — 20 playable districts, 22 companions, 22 arcade mini-games, 100% in-browser & Android.\n\nTrust faces, not voices.' },
  { ep: 2,  file: 'dist/world-of-zoth-ep2-crew.mp4',        title: 'EP II: Midnight at the Safehouse',              hook: '22 sovereign companions. Zero cloud dependencies.\n\nEpisode II of the World of Zoth theatrical anthology takes you inside the Safehouse at 06:12.' },
  { ep: 3,  file: 'dist/world-of-zoth-ep3-combat.mp4',      title: 'EP III: 99 Floors of Fury',                     hook: 'Terminal verbs as combat strikes: > ping, > exploit, > firewall, > sudo rm -rf.\n\nWatch Episode III: 99 Floors of Fury — precision parries, reflective boss shields & 21-skybeam Quorum Ultimates.' },
  { ep: 4,  file: 'dist/world-of-zoth-ep4-secrets.mp4',     title: 'EP IV: Behind the Wireframe — Secrets of 06:13', hook: 'What hides beneath the 3D lattice after 06:12?\n\nEpisode IV reveals the secret Rooftop sector, the 4D Clifford hyper-torus Null Core, and the mysteries of 06:13.' },
  { ep: 5,  file: 'dist/world-of-zoth-ep5-horizon.mp4',     title: 'EP V: The Dawn Horizon (District #20)',         hook: 'Welcome to District #20: The Dawn Horizon.\n\nAnchored by Blender 4.3 procedural wireframe monuments, real-time 3D normal-bump shaders & synthesized WebAudio.' },
  { ep: 6,  file: 'dist/world-of-zoth-ep6-arcade.mp4',      title: 'EP VI: The Safehouse Megaplex',                 hook: 'Why build one game when you can hide 22 playable arcade cabinets inside the Safehouse?\n\nEpisode VI tours the Safehouse Arcade Megaplex in World of Zoth.' },
  { ep: 7,  file: 'dist/world-of-zoth-ep7-academy.mp4',     title: 'EP VII: Null Academy: Hack the Prompt',         hook: '16 interactive AI-Security & Cryptography Labs built directly into a 3D cyber-RPG.\n\nEpisode VII: Null Academy — Hack the Prompt.' },
  { ep: 8,  file: 'dist/world-of-zoth-ep8-sunrise.mp4',     title: 'EP VIII: 06:13: The Sunrise Finale',            hook: 'For years the Sand Clocktower froze the city at 06:12.\n\nEpisode VIII: The clock strikes 06:13, and the Braille sun rises over the Mode-7 Skyline.' },
  { ep: 9,  file: 'dist/world-of-zoth-ep9-mirror.mp4',      title: 'EP IX: The Mirror\'s Edge (03ng0cn1)',          hook: 'Your reflection memorized every command you ever typed.\n\nEpisode IX: 03ng0cn1 steps out of the Hall of Mirrors to join your squad as Companion #22.' },
  { ep: 10, file: 'dist/world-of-zoth-ep10-gala.mp4',       title: 'EP X: The Pantheon Gala (3D PBR Shaders)',      hook: 'Real-time world-space FBM normal-bump relief, wet cyber-rain ripples, and interior parallax windows — all in a single self-contained HTML file.\n\nEpisode X: The Pantheon Gala.' },
  { ep: 11, file: 'dist/world-of-zoth-ep11-skyline.mp4',    title: 'EP XI: Skybeam Interceptor (Galaga #22)',       hook: 'Mini-Game #22 has landed in the Safehouse Arcade: Galaga — Skybeam Interceptor.\n\nWatch Episode XI as Mercury & Aquila defend the Mode-7 Skyline.' },
  { ep: 12, file: 'dist/world-of-zoth-ep12-season.mp4',     title: 'EP XII: 06:12 to 06:13 (Season I Finale)',      hook: '20 Playable 3D Districts. 22 Sovereign Companions. 22 Built-In Arcade Mini-Games.\n\nEpisode XII: The Season I Finale of World of Zoth.' },
  { ep: 13, file: 'dist/world-of-zoth-ep13-monsoon.mp4',    title: 'EP XIII: Monsoon Over Relit City',              hook: 'Season II Premiere — Episode XIII: Monsoon Over Relit City.\n\nConcentric raindrop ripples in wet asphalt puddles and anodized 3D architectural relief.' },
  { ep: 14, file: 'dist/world-of-zoth-ep14-heist.mp4',      title: 'EP XIV: The Black-Market Heist',                hook: 'Smuggling zero-day relics with Ghostbyte & forging +15 gear at the Foundry Anvil.\n\nEpisode XIV: The Black-Market Heist.' },
  { ep: 15, file: 'dist/world-of-zoth-ep15-colosseum.mp4',  title: 'EP XV: Wager at the Colosseum',                 hook: 'Place your bits on AI vs AI boss showdowns in the Zero-Knowledge Citadel.\n\nEpisode XV: Wager at the Colosseum.' },
  { ep: 16, file: 'dist/world-of-zoth-ep16-pirateradio.mp4',title: 'EP XVI: 06:12 Pirate Radio FM',                 hook: 'Broadcasting live from the Hilbert Fiber Tunnels at 140 BPM.\n\nEpisode XVI: 06:12 Pirate Radio FM — procedural WebAudio chiptunes, darksynth & phonk.' },
  { ep: 17, file: 'dist/world-of-zoth-ep17-pets.mp4',       title: 'EP XVII: The Cyber-Familiar Sanctuary',         hook: 'Every operator needs a loyal cyber-shiba.\n\nEpisode XVII: Inside the Chrono-Vault Pet Sanctuary & Sub-Lattice Fishing.' },
  { ep: 18, file: 'dist/world-of-zoth-ep18-quantum.mp4',    title: 'EP XVIII: The Quantum Loom Conspiracy',         hook: 'Before you take a step in Collapse Streets, the city exists in quantum superposition.\n\nEpisode XVIII: The Quantum Loom Conspiracy.' },
  { ep: 19, file: 'dist/world-of-zoth-ep19-cards.mp4',      title: 'EP XIX: Grandmaster of Pantheon Triad',         hook: 'Fancy a round of Pantheon Triad?\n\nEpisode XIX: High-stakes 3x3 directional card battles atop the Astral Spire.' },
  { ep: 20, file: 'dist/world-of-zoth-ep20-speedrun.mp4',   title: 'EP XX: 2.0x Hyper-Clock Speedrun',              hook: 'Tap [V] to engage 2.0x HYPER-CLOCK.\n\nEpisode XX: Blasting across all 20 districts of World of Zoth at double engine speed.' },
  { ep: 21, file: 'dist/world-of-zoth-ep21-foundry.mp4',    title: 'EP XXI: Forged in Doom-Fire',                   hook: 'Crank 3D surface relief to 1.85 Brutalist mode inside the Doom-Fire Foundry.\n\nEpisode XXI: Forged in Doom-Fire.' },
  { ep: 22, file: 'dist/world-of-zoth-ep22-detective.mp4',  title: 'EP XXII: The Seventh Reflection (Noir)',        hook: 'Seven mirrors in the octagon. Eight reflections staring back.\n\nEpisode XXII: The Seventh Reflection — a cyber-noir mystery inside World of Zoth.' },
  { ep: 23, file: 'dist/world-of-zoth-ep23-megaplex.mp4',   title: 'EP XXIII: The 22-Cabinet Arcade Marathon',      hook: 'Breakout, Snake, Cyber-Pong, Galaga, Asteroids, Vector Tank, Triad & 15 more.\n\nEpisode XXIII: Conquering the 22-Cabinet Safehouse Arcade Marathon.' },
  { ep: 24, file: 'dist/world-of-zoth-ep24-pantheon.mp4',   title: 'EP XXIV: 24 Episodes of Zoth (Grand Finale)',   hook: '24 Theatrical Films. 20 3D Worlds. 22 Companions. 22 Mini-Games. 1 Sovereign Saga.\n\nWatch Episode XXIV — the Season II Grand Finale of WORLD OF ZOTH.' }
];

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
  const mediaType = isVideo ? 'video/mp4' : ext === '.gif' ? 'image/gif' : 'image/jpeg';
  const mediaCategory = isVideo ? 'tweet_video' : ext === '.gif' ? 'tweet_gif' : 'tweet_image';
  const uploadUrl = 'https://upload.twitter.com/1.1/media/upload.json';

  // 1. INIT
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
  console.log(`[X-UPLOAD] INIT media_id=${mediaId} (${(totalBytes / 1048576).toFixed(2)} MB)`);

  // 2. APPEND (4 MB chunks)
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
    console.log(`[X-UPLOAD] APPEND segment ${segmentIndex} (${Math.min(100, Math.round(((offset + len) / totalBytes) * 100))}%)`);
    segmentIndex++;
  }
  fs.closeSync(fd);

  // 3. FINALIZE
  const finParams = { command: 'FINALIZE', media_id: mediaId };
  const finBody = new URLSearchParams(finParams).toString();
  const finRes = await httpsRequest('POST', uploadUrl, {
    Authorization: oauthHeader('POST', uploadUrl, finParams, creds),
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(finBody)
  }, Buffer.from(finBody));

  // 4. STATUS polling if processing_info present
  let proc = finRes.data.processing_info;
  while (proc && (proc.state === 'pending' || proc.state === 'in_progress')) {
    const waitSec = proc.check_after_secs || 3;
    console.log(`[X-UPLOAD] Processing video (${proc.state})... waiting ${waitSec}s`);
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
  console.log(`[X-UPLOAD] Ready: media_id=${mediaId}`);
  return mediaId;
}

async function postTweet(text, mediaId, replyToId, creds) {
  const url = 'https://api.twitter.com/2/tweets';
  const payload = { text };
  if (mediaId) payload.media = { media_ids: [mediaId] };
  if (replyToId) payload.reply = { in_reply_to_tweet_id: replyToId };
  const body = Buffer.from(JSON.stringify(payload), 'utf8');
  const res = await httpsRequest('POST', url, {
    Authorization: oauthHeader('POST', url, {}, creds),
    'Content-Type': 'application/json',
    'Content-Length': body.length
  }, body);
  return res.data.data;
}

async function main() {
  const args = process.argv.slice(2);
  const creds = {
    apiKey: process.env.X_API_KEY || process.env.TWITTER_API_KEY,
    apiSecret: process.env.X_API_SECRET || process.env.TWITTER_API_SECRET,
    accessToken: process.env.X_ACCESS_TOKEN || process.env.TWITTER_ACCESS_TOKEN,
    accessSecret: process.env.X_ACCESS_SECRET || process.env.TWITTER_ACCESS_SECRET
  };

  if (args.includes('--request-token')) {
    const callback = args[args.indexOf('--request-token') + 1] || 'oob';
    const reqUrl = 'https://api.twitter.com/oauth/request_token';
    const auth = oauthHeader('POST', reqUrl, {}, { apiKey: creds.apiKey, apiSecret: creds.apiSecret }, { oauth_callback: callback });
    const res = await httpsRequest('POST', reqUrl, { Authorization: auth });
    const parsed = Object.fromEntries(new URLSearchParams(res.data));
    fs.writeFileSync('/tmp/x_oauth_req.json', JSON.stringify(parsed, null, 2));
    console.log('\n🔗 Open this URL while logged in as @1nc0gn30 (or whichever account you want to post from):');
    console.log(`https://api.twitter.com/oauth/authorize?oauth_token=${parsed.oauth_token}\n`);
    return;
  }

  if (args.includes('--verifier')) {
    const verifier = args[args.indexOf('--verifier') + 1];
    const reqData = JSON.parse(fs.readFileSync('/tmp/x_oauth_req.json', 'utf8'));
    const accUrl = 'https://api.twitter.com/oauth/access_token';
    const auth = oauthHeader('POST', accUrl, { oauth_verifier: verifier }, {
      apiKey: creds.apiKey,
      apiSecret: creds.apiSecret,
      accessToken: reqData.oauth_token,
      accessSecret: reqData.oauth_token_secret
    }, { oauth_verifier: verifier });
    const body = `oauth_verifier=${ encodeURIComponent(verifier) }`;
    const res = await httpsRequest('POST', accUrl, {
      Authorization: auth,
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body)
    }, Buffer.from(body));
    const parsed = Object.fromEntries(new URLSearchParams(res.data));
    console.log(`✅ Authorized @${parsed.screen_name} (user_id=${parsed.user_id})`);
    console.log(`X_ACCESS_TOKEN=${parsed.oauth_token}`);
    console.log(`X_ACCESS_SECRET=${parsed.oauth_token_secret}`);
    return;
  }

  const dryRun = args.includes('--dry-run');
  const epIdx = args.indexOf('--ep');
  const epNum = epIdx !== -1 ? parseInt(args[epIdx + 1], 10) : 1;
  const customTextIdx = args.indexOf('--text');
  const customFileIdx = args.indexOf('--file');

  const epObj = EPISODE_CAMPAIGN.find(e => e.ep === epNum) || EPISODE_CAMPAIGN[0];
  const filePath = path.resolve(ROOT, customFileIdx !== -1 ? args[customFileIdx + 1] : epObj.file);
  const tweetText = customTextIdx !== -1
    ? args[customTextIdx + 1]
    : `${epObj.hook}\n\n🎮 Play Free in Browser / APK: https://github.com/1nc0gn30/world-of-zoth\n⚡ Engineered by @1nc0gn30 • NullAI Platform`;

  console.log('====================================================');
  console.log(`🎬 WORLD OF ZOTH — X (TWITTER) PUBLISHER`);
  console.log(`Episode : #${epObj.ep} — ${epObj.title}`);
  console.log(`Video   : ${filePath} (${fs.existsSync(filePath) ? (fs.statSync(filePath).size / 1048576).toFixed(2) + ' MB' : 'MISSING'})`);
  console.log('----------------------------------------------------');
  console.log(tweetText);
  console.log('====================================================');

  if (dryRun) {
    console.log('[DRY-RUN] Verified payload & video path. Ready for live X API keys.');
    return;
  }

  if (!creds.apiKey || !creds.apiSecret || !creds.accessToken || !creds.accessSecret) {
    console.error('Missing X API credentials. Set X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET in ~/.x_env or .env');
    process.exit(1);
  }

  const mediaId = fs.existsSync(filePath) ? await uploadMediaChunked(filePath, creds) : null;
  const tweet = await postTweet(tweetText, mediaId, null, creds);
  console.log(`✅ LIVE ON X: https://x.com/1nc0gn30/status/${tweet.id}`);
}

main().catch(err => {
  console.error('❌ X Poster Error:', err.message);
  process.exit(1);
});
