// GhostByte — Living 3D Volumetric Companion, Guide & Narrated AI Academy for World of Zoth.
// Zero external API calls at runtime: plays pre-rendered studio neural voice-overs (assets/voice/*.mp3)
// generated with zero-cost Microsoft Edge Neural TTS, with automatic music ducking.
import * as THREE from 'three';
import { latMat } from './render.js';
import { particle } from './fx.js';
import * as UI from './ui.js';
import { P } from './pal.js';
import { IN, took } from './input.js';
import { sfx, duckMusic, cycleMusicDeck, MUSIC_DECK, AU } from './audio.js';

export const GFX_MODES = [
  { name: 'Sovereign HD', bloom: 0.42, sat: 1.18, scan: 0.10, vig: 0.42 },
  { name: 'Cyber Bloom', bloom: 0.72, sat: 1.32, scan: 0.06, vig: 0.36 },
  { name: 'Classic CRT', bloom: 0.05, sat: 1.00, scan: 0.22, vig: 0.58 },
];

export const GB_CHAPTERS = [
  {
    id: 'gb_01_use_ai',
    tag: 'HOW TO USE AI',
    title: '01 Using AI Like a Pro',
    voice: 'assets/voice/gb_01_use_ai.mp3',
    summary: 'Role + Grounded Context + Constraints + Output Example + Tool Verification.',
    lines: [
      'Large Language Models predict tokens from context—they are not mind readers.',
      'Give 4 pillars every time: (1) Role, (2) Real context/files, (3) Hard constraints,',
      'and (4) One concrete example of the exact output format you want.',
      'Never stop at chat: pair models with deterministic compilers, linters, and tests',
      'so the AI verifies its own work instead of hallucinating confident guesses.',
    ],
  },
  {
    id: 'gb_02_history',
    tag: 'AI ORIGINS',
    title: '02 Where AI Started',
    voice: 'assets/voice/gb_02_history.mp3',
    summary: 'Turing (1950) -> Perceptron (1958) -> Backprop (1986) -> AlexNet -> Transformers.',
    lines: [
      '1950: Alan Turing proposed the Imitation Game. 1958: Frank Rosenblatt built',
      'the Mark I Perceptron—the first trainable neural network.',
      '1986: Backpropagation unlocked multi-layer nets. 2012: AlexNet proved GPUs',
      'could crush vision benchmarks. 2017: "Attention Is All You Need" introduced',
      'the Transformer, letting models attend across whole documents in parallel.',
    ],
  },
  {
    id: 'gb_03_nous',
    tag: 'NOUS RESEARCH',
    title: '03 Nous Research & Weights',
    voice: 'assets/voice/gb_03_nous.mp3',
    summary: 'Community-owned weights, steerable reasoning, DisTrO & Psyche decentralized training.',
    lines: [
      'While closed labs locked frontier intelligence behind metered APIs, Nous Research',
      'pioneered open-weight fine-tuning, high-craft synthetic reasoning datasets,',
      'and steerable, non-preachy alignment built for real builders and researchers.',
      'With breakthroughs like DisTrO (distributed low-bandwidth training) and the',
      'Psyche network, Nous proved frontier AI can be trained and owned openly.',
    ],
  },
  {
    id: 'gb_04_hermes',
    tag: 'HERMES AGENT',
    title: '04 Hermes & Hermes Agent',
    voice: 'assets/voice/gb_04_hermes.mp3',
    summary: 'Structured function calling, local MCP tools, persistent memory & Hermes-Zoth.',
    lines: [
      'Nous Hermes models set the open-weight gold standard for reliable tool-calling,',
      'strict JSON schema adherence, and multi-turn agentic planning on local GPUs.',
      'Hermes Agent turns those weights into a sovereign operator: connecting to local',
      'MCP servers, shell sandboxes, and persistent memory (like ZothOS Hermes-Zoth)',
      'so your AI executes real workflows privately on 127.0.0.1.',
    ],
  },
  {
    id: 'gb_05_future',
    tag: 'FUTURE 2026-2030',
    title: '05 Where AI Is Headed',
    voice: 'assets/voice/gb_05_future.mp3',
    summary: 'Local-first multi-agent swarms, STDP Neuro-Memory, WebGPU & FieldKit Physical AI.',
    lines: [
      'The next era moves past passive chat boxes into three sovereign frontiers:',
      '1) Local-First Multi-Agent Swarms collaborating with strict tool boundaries.',
      '2) Biological STDP Neuro-Memory (like Zoth :8094) that consolidates skills over time.',
      '3) Embodied Physical AI & FieldKit: smart-glasses spatial hand grounding (<130ms)',
      'and wearer-only acoustic voice gates operating completely off the cloud.',
    ],
  },
  {
    id: 'gb_06_zothos',
    tag: 'ZOTHOS ECOSYSTEM',
    title: '06 ZothOS & ZothOS-Lite',
    voice: 'assets/voice/gb_06_zothos.mp3',
    summary: 'Debian 13 + KDE Plasma 6 AI workstation OS vs. Amnesic RAM-only Live USB.',
    lines: [
      'ZothOS v3.4.0 (zothos.nullai.tech) is a persistent Debian 13 Trixie + KDE Plasma 6',
      'sovereign AI workstation running 23 loopback daemons: Agent Bridge (:8102),',
      'STDP Neuro-Memory (:8094), Vaelor L1 (:8140), and Hermes-Zoth.',
      'ZothOS-Lite v1.2 boots 100% into RAM (toram) from a live USB with zero disk trace,',
      '56 curated AI models, and ZothNet 3-hop Sphinx mixnet privacy.',
    ],
  },
  {
    id: 'gb_07_studio',
    tag: 'ZOTH STUDIO V2',
    title: '07 Zoth Studio (80 Tools)',
    voice: 'assets/voice/gb_07_studio.mp3',
    summary: '56 in-browser WebGPU utilities + 24 bare-metal CLI daemons. Zero paywalls.',
    lines: [
      'Zoth Studio v2 (zoth.nullai.tech) ships 80 free, open-access developer tools:',
      '56 in-browser & WebGPU engines (JWT Inspector, Vector Search, Prompt Firewall,',
      'WebMCP Inspector, Schema Illustrator, Badge3D) plus 24 CLI/daemon workstations.',
      'Every single tool is 100% unlocked by default—zero paywalls, zero accounts,',
      'zero cloud lock-in, engineered by 1nc0gn30 & GhostByte under NullAI.',
    ],
  },
  {
    id: 'gb_08_local_llm',
    tag: 'LOCAL WEIGHTS',
    title: '08 Local LLMs & Privacy',
    voice: 'assets/voice/gb_08_local_llm.mp3',
    summary: 'Quantization (Q4_K_M / Q8), VRAM math, llama.cpp/Ollama & 127.0.0.1 sovereignty.',
    lines: [
      'Quantization (GGUF Q4_K_M, Q6_K, Q8_0) compresses 7B–70B neural networks to run',
      'at blazing speeds on consumer GPUs, Apple Silicon, and edge workstations.',
      'Rule of thumb: a Q4_K_M model needs ~0.65 GB VRAM per billion parameters plus',
      'KV-cache headroom. When weights stay local on 127.0.0.1, no provider can throttle',
      'your limits, silently swap your model, or train on your private secrets.',
    ],
  },
  {
    id: 'gb_09_security',
    tag: 'AI SECURITY',
    title: '09 AI Red Teaming',
    voice: 'assets/voice/gb_09_security.mp3',
    summary: 'Prompt injection defense, signed RAG, safetensors & least-privilege sandboxes.',
    lines: [
      'An agent with shell or file tools turns a prompt injection into real damage.',
      'Always separate <data> from system instructions, sign RAG knowledge bases,',
      'prefer safetensors over pickle weights, and require human confirmation before',
      'destructive actions. Visit Null Academy in the Hub (20 playable labs) to earn',
      'XP and master real defensive AI security skills.',
    ],
  },
  {
    id: 'gb_10_tactical',
    tag: 'LIVE GUIDE',
    title: '10 Live Tactical Scan',
    voice: 'assets/voice/gb_10_tactical.mp3',
    summary: 'Real-time district intel, quest hints & controls reference.',
    lines: [
      'I hover beside you across all 20 districts of World of Zoth.',
      'Follow the golden 3D lattice trail to your active quest objective, or press [M]',
      'for the full district atlas. Press [C] to phase-dash past patrols, [B] to switch',
      'soundtracks, [H] to cycle Sovereign HD / Cyber Bloom graphics, and [T] for camera.',
      'Tap "Play Voice" anytime to hear my neural narration while you explore!',
    ],
  },
];

// ---------- 3D Volumetric GhostByte Follower Mesh ----------
function buildGhostByteMesh() {
  const group = new THREE.Group();
  const pts = [];
  const cols = [];
  const cTop = new THREE.Color('#00d5ff');
  const cMid = new THREE.Color('#32ff85');
  const cBot = new THREE.Color('#f5b82e');
  const tmp = new THREE.Color();

  // Volumetric dome + 6-lobe draped skirt (crisp individual additive voxels, zero white-hot blowout)
  for (let lat = 0; lat <= 8; lat++) {
    const v = lat / 8;
    const phi = v * Math.PI * 0.5;
    const y = 0.36 + Math.cos(phi) * 0.34;
    const r = Math.sin(phi) * 0.32;
    const steps = Math.max(5, Math.round(5 + v * 12));
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      pts.push(Math.cos(a) * r, y, Math.sin(a) * r);
      tmp.copy(cTop).lerp(cMid, v * 0.45);
      cols.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let row = 1; row <= 6; row++) {
    const v = row / 6;
    const y = 0.36 - v * 0.48;
    const baseR = 0.32 + v * 0.08;
    const steps = 16;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const wave = Math.sin(a * 6) * 0.04 * v;
      const r = baseR + wave;
      pts.push(Math.cos(a) * r, y + Math.cos(a * 6) * 0.025 * v, Math.sin(a) * r);
      tmp.copy(cTop).lerp(cBot, v * 0.72);
      cols.push(tmp.r, tmp.g, tmp.b);
    }
  }

  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  pGeo.setAttribute('acol', new THREE.Float32BufferAttribute(cols, 3));
  const body = new THREE.Points(
    pGeo,
    latMat({ color: '#00d5ff', intensity: 0.48, points: true, size: 1.7, vcolor: true, twinkle: 0.18, fogFar: 180 })
  );
  group.add(body);

  // Glowing eyes
  const eyeGeo = new THREE.BufferGeometry();
  eyeGeo.setAttribute('position', new THREE.Float32BufferAttribute([-0.10, 0.42, 0.32, 0.10, 0.42, 0.32], 3));
  const eyes = new THREE.Points(
    eyeGeo,
    latMat({ color: '#ffffff', intensity: 1.4, points: true, size: 3.2, fogFar: 180 })
  );
  group.add(eyes);

  // Dual counter-rotating orbital rings (cyan + gold)
  const mkRing = (rad, col) => {
    const seg = [];
    const n = 28;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2;
      const a1 = ((i + 1) / n) * Math.PI * 2;
      seg.push(Math.cos(a0) * rad, 0, Math.sin(a0) * rad, Math.cos(a1) * rad, 0, Math.sin(a1) * rad);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
    return new THREE.LineSegments(g, latMat({ color: col, intensity: 1.35, fogFar: 160 }));
  };
  const ring1 = mkRing(0.56, '#00d5ff');
  ring1.position.y = 0.26;
  ring1.rotation.x = 0.38;
  const ring2 = mkRing(0.68, '#f5b82e');
  ring2.position.y = 0.22;
  ring2.rotation.x = -0.42;
  ring2.rotation.z = 0.28;
  group.add(ring1, ring2);

  group.userData = { body, ring1, ring2, spinBoost: 0 };
  return group;
}

// ---------- Live 2D HUD Canvas Portrait of 3D GhostByte ----------
function drawGhostPortrait(X, cx, cy, rad, t, speaking) {
  X.save();
  // Soft cyan radial aura
  const grd = X.createRadialGradient(cx, cy, 4, cx, cy, rad);
  grd.addColorStop(0, speaking ? 'rgba(0,213,255,0.34)' : 'rgba(0,213,255,0.18)');
  grd.addColorStop(1, 'rgba(4,7,14,0)');
  X.fillStyle = grd;
  X.beginPath();
  X.arc(cx, cy, rad, 0, Math.PI * 2);
  X.fill();

  // Orbital ring
  X.strokeStyle = 'rgba(245,184,46,0.55)';
  X.lineWidth = 1.2;
  X.beginPath();
  X.ellipse(cx, cy + rad * 0.16, rad * 0.78, rad * 0.22, Math.sin(t * 0.9) * 0.18, 0, Math.PI * 2);
  X.stroke();

  // 3D projected voxel dome + skirt
  const rot = t * (speaking ? 1.5 : 0.75);
  for (let lat = 0; lat <= 7; lat++) {
    const v = lat / 7;
    const phi = v * Math.PI * 0.5;
    const y0 = -Math.cos(phi) * rad * 0.52;
    const r0 = Math.sin(phi) * rad * 0.48;
    const n = Math.max(5, Math.round(5 + v * 10));
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + rot;
      const sx = cx + Math.cos(a) * r0;
      const sy = cy + y0 + Math.sin(a) * r0 * 0.16;
      const front = Math.sin(a) > -0.2;
      X.fillStyle = front ? '#00d5ff' : 'rgba(0,213,255,0.38)';
      X.fillRect(Math.round(sx), Math.round(sy), front ? 2.4 : 1.6, front ? 2.4 : 1.6);
    }
  }
  for (let row = 1; row <= 5; row++) {
    const v = row / 5;
    const y0 = v * rad * 0.58;
    const r0 = rad * (0.48 + v * 0.1);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + rot;
      const sx = cx + Math.cos(a) * r0;
      const sy = cy + y0 + Math.sin(a * 3 + t * 4) * 3 * v;
      X.fillStyle = v > 0.65 ? '#f5b82e' : '#32ff85';
      X.fillRect(Math.round(sx), Math.round(sy), 2, 2);
    }
  }
  // Glowing eyes
  const blink = Math.sin(t * 1.9) > 0.96 ? 1 : 4;
  X.fillStyle = '#ffffff';
  X.fillRect(cx - 10, cy - 8, 5, blink);
  X.fillRect(cx + 5, cy - 8, 5, blink);

  // Live audio waveform bars when narrating
  if (speaking) {
    for (let i = 0; i < 12; i++) {
      const bh = 3 + Math.abs(Math.sin(t * 11 + i * 0.7)) * 12;
      X.fillStyle = i % 2 ? '#00d5ff' : '#32ff85';
      X.fillRect(cx - 34 + i * 6, cy + rad * 0.78 - bh / 2, 3, bh);
    }
  }
  X.restore();
}

export function initGhostByte(G, { scene, player, postU }) {
  const mesh = buildGhostByteMesh();
  scene.add(mesh);

  const GB = (G.ghostbyte = {
    mesh,
    voiceOn: true,
    gfxIdx: 0,
    camIdx: 0,
    sel: 0,
    speaking: false,
    currentClip: null,
    audio: null,
    progress: 0,
    greeted: false,
  });

  function stopVoice() {
    if (GB.audio) {
      try {
        GB.audio.pause();
        GB.audio.currentTime = 0;
      } catch (e) {}
      GB.audio = null;
    }
    GB.speaking = false;
    GB.currentClip = null;
    GB.progress = 0;
    duckMusic(false);
  }

  function playVoice(url, label) {
    stopVoice();
    if (!GB.voiceOn || !url) return;
    try {
      const a = new Audio(url);
      a.volume = 0.95;
      GB.audio = a;
      GB.currentClip = label || url;
      GB.speaking = true;
      GB.mesh.userData.spinBoost = 2.4;
      duckMusic(true);
      a.addEventListener('timeupdate', () => {
        if (a.duration > 0) GB.progress = a.currentTime / a.duration;
      });
      a.addEventListener('ended', () => {
        GB.speaking = false;
        GB.progress = 1;
        duckMusic(false);
      });
      a.addEventListener('error', () => {
        GB.speaking = false;
        duckMusic(false);
      });
      const p = a.play();
      if (p && p.catch) p.catch(() => { GB.speaking = false; duckMusic(false); });
    } catch (e) {
      GB.speaking = false;
      duckMusic(false);
    }
  }

  GB.playVoice = playVoice;
  GB.stopVoice = stopVoice;

  G.toggleVoice = () => {
    GB.voiceOn = !GB.voiceOn;
    if (!GB.voiceOn) stopVoice();
    G.toast(`> GHOSTBYTE NEURAL VOICE: ${GB.voiceOn ? 'ON' : 'MUTED'}`, GB.voiceOn ? '#00d5ff' : P.DG);
    sfx('blip');
  };

  G.cycleGfxMode = () => {
    GB.gfxIdx = (GB.gfxIdx + 1) % GFX_MODES.length;
    const m = GFX_MODES[GB.gfxIdx];
    const u = postU();
    if (u.bloomAmt) u.bloomAmt.value = m.bloom;
    if (u.satAmt) u.satAmt.value = m.sat;
    if (u.scanAmt) u.scanAmt.value = m.scan;
    if (u.vigAmt) u.vigAmt.value = m.vig;
    G.toast(`> GRAPHICS [H]: ${m.name.toUpperCase()}`, '#00d5ff');
    sfx('confirm');
  };

  G.cycleCamView = () => {
    const views = [
      { name: 'Standard 3rd-Person', dist: 7.5, pitch: 0.32 },
      { name: 'Cinematic Close', dist: 4.9, pitch: 0.22 },
      { name: 'Tactical High-Orbit', dist: 12.2, pitch: 0.56 },
    ];
    GB.camIdx = (GB.camIdx + 1) % views.length;
    const v = views[GB.camIdx];
    G.cam.dist = v.dist;
    G.cam.pitch = v.pitch;
    G.toast(`> CAMERA [T]: ${v.name.toUpperCase()}`, P.GD);
    sfx('blip');
  };

  G.cycleMusic = () => {
    const item = cycleMusicDeck();
    G.toast(`> MUSIC [B]: ${item.name}`, '#32ff85');
    sfx('blip');
  };

  G.openGhostByte = (chapterIdx) => {
    if (typeof chapterIdx === 'number') GB.sel = Math.max(0, Math.min(GB_CHAPTERS.length - 1, chapterIdx));
    GB.prevMode = G.mode === 'ghost' ? GB.prevMode || 'explore' : G.mode;
    G.mode = 'ghost';
    sfx('confirm');
    const ch = GB_CHAPTERS[GB.sel];
    if (ch && GB.voiceOn && !GB.speaking) playVoice(ch.voice, ch.title);
  };

  GB.greet = () => {
    if (GB.greeted) return;
    GB.greeted = true;
    G.toast('> GhostByte online! Press [G] for AI Academy & Voice Guide', '#00d5ff');
    if (GB.voiceOn) playVoice('assets/voice/gb_intro.mp3', 'GhostByte Intro');
  };

  // Per-frame 3D hover update alongside player
  GB.update3D = (dt, t) => {
    const show = G.mode === 'explore' || G.mode === 'dialog' || G.mode === 'ghost' || G.mode === 'transition';
    mesh.visible = show;
    if (!show) return;
    const pl = player();
    if (!pl) return;
    const p = pl.group.position;
    const yaw = pl.facing || 0;
    // Float cleanly over the player's right shoulder
    const sideX = Math.cos(yaw) * 1.18 - Math.sin(yaw) * 0.55;
    const sideZ = -Math.sin(yaw) * 1.18 - Math.cos(yaw) * 0.55;
    const targetX = p.x + sideX;
    const targetY = p.y + 1.55 + Math.sin(t * 2.8) * 0.16;
    const targetZ = p.z + sideZ;
    const k = 1 - Math.pow(0.004, dt);
    mesh.position.x += (targetX - mesh.position.x) * k;
    mesh.position.y += (targetY - mesh.position.y) * k;
    mesh.position.z += (targetZ - mesh.position.z) * k;

    const ud = mesh.userData;
    ud.spinBoost = Math.max(0, ud.spinBoost - dt * 1.8);
    mesh.rotation.y += dt * (0.9 + ud.spinBoost * 4.2);
    ud.ring1.rotation.y += dt * (1.8 + ud.spinBoost * 3);
    ud.ring2.rotation.y -= dt * (1.4 + ud.spinBoost * 2.5);

    if (Math.random() < dt * (GB.speaking ? 14 : 5)) {
      particle(
        mesh.position.x + (Math.random() - 0.5) * 0.4,
        mesh.position.y + 0.1,
        mesh.position.z + (Math.random() - 0.5) * 0.4,
        0,
        0.45,
        0,
        0.55,
        Math.random() < 0.65 ? '#00d5ff' : P.GD,
        0.92,
        0,
        0.09
      );
    }
  };

  // Interactive Guide UI input
  GB.updateUI = () => {
    if (took('back') || took('pause') || took('ghost')) {
      G.mode = GB.prevMode || 'explore';
      sfx('cancel');
      return;
    }
    if (took('up')) {
      GB.sel = (GB.sel + GB_CHAPTERS.length - 1) % GB_CHAPTERS.length;
      sfx('move');
    }
    if (took('down')) {
      GB.sel = (GB.sel + 1) % GB_CHAPTERS.length;
      sfx('move');
    }
    if (took('confirm')) {
      const ch = GB_CHAPTERS[GB.sel];
      if (GB.speaking && GB.currentClip === ch.title) stopVoice();
      else playVoice(ch.voice, ch.title);
    }
    if (took('bgm')) G.cycleMusic();
    if (took('gfx')) G.cycleGfxMode();
    if (took('voice')) G.toggleVoice();
  };

  // Interactive Guide UI renderer (960x540 crisp overlay)
  GB.drawUI = (t) => {
    const X = UI.ctx;
    X.fillStyle = 'rgba(4,6,12,0.92)';
    X.fillRect(0, 0, 960, 540);

    // Header
    UI.box(20, 14, 920, 44, '#00d5ff', 'rgba(6,10,18,0.96)');
    UI.text('GHOSTBYTE · 3D AI COMPANION & SOVEREIGN ACADEMY', 36, 24, '#00d5ff', 2);
    UI.text('[G/ESC] close', 924, 28, P.DG, 1, 'right');
    UI.hit(830, 18, 104, 34, () => { G.mode = GB.prevMode || 'explore'; sfx('cancel'); });

    // Left Column: 10 AI Chapters List
    UI.box(20, 66, 306, 408, P.DDG, 'rgba(6,8,14,0.94)');
    UI.text('AI ACADEMY CHAPTERS (NEURAL VO)', 32, 76, P.GD, 1);
    GB_CHAPTERS.forEach((ch, i) => {
      const y = 98 + i * 36;
      const sel = i === GB.sel;
      if (sel) {
        X.fillStyle = 'rgba(0,213,255,0.16)';
        X.fillRect(26, y - 4, 294, 32);
        X.fillStyle = '#00d5ff';
        X.fillRect(26, y - 4, 3, 32);
      }
      UI.text(ch.title.slice(0, 29), 36, y + 2, sel ? '#00d5ff' : P.BONE, 1);
      UI.text(ch.tag, 36, y + 15, sel ? '#32ff85' : P.DG, 1);
      UI.hit(26, y - 4, 294, 32, () => {
        GB.sel = i;
        sfx('move');
        if (GB.voiceOn) playVoice(ch.voice, ch.title);
      });
    });

    // Right Column: Active Chapter + Live 3D GhostByte Portrait + Voice Player
    const ch = GB_CHAPTERS[GB.sel];
    UI.box(338, 66, 602, 408, '#00d5ff', 'rgba(6,9,16,0.95)');
    drawGhostPortrait(X, 412, 138, 56, t, GB.speaking);

    UI.text(ch.tag + '  ·  NARRATED BY GHOSTBYTE', 484, 82, '#32ff85', 1);
    UI.text(ch.title.slice(0, 26), 484, 100, '#00d5ff', 2);
    UI.wrap(ch.summary, 436, 1).slice(0, 2).forEach((l, idx) => UI.text(l, 484, 130 + idx * 16, P.GD, 1));

    // Voice-Over Play/Stop Control Bar
    const playLbl = GB.speaking && GB.currentClip === ch.title ? '[SPACE] STOP NARRATION' : '[SPACE] PLAY NEURAL VOICE';
    UI.box(484, 168, 224, 28, '#00d5ff', GB.speaking ? 'rgba(0,213,255,0.22)' : 'rgba(6,10,18,0.9)');
    UI.text(playLbl, 596, 177, '#00d5ff', 1, 'center');
    UI.hit(484, 168, 224, 28, () => {
      if (GB.speaking && GB.currentClip === ch.title) stopVoice();
      else playVoice(ch.voice, ch.title);
    });

    UI.box(718, 168, 206, 28, P.DDG, 'rgba(6,10,18,0.9)');
    UI.text(`VOICE [N]: ${GB.voiceOn ? 'NEURAL ON' : 'MUTED'}`, 821, 177, GB.voiceOn ? '#32ff85' : P.DG, 1, 'center');
    UI.hit(718, 168, 206, 28, () => G.toggleVoice());

    // Voice progress bar
    UI.bar(484, 202, 440, 5, GB.speaking ? GB.progress : 0, '#00d5ff', 'rgba(0,213,255,0.16)');

    // Lesson Body
    let ly = 224;
    ch.lines.forEach((line) => {
      UI.text(line, 358, ly, P.BONE, 1);
      ly += 22;
    });

    // Live District Intel footer inside chapter 10 or bottom strip
    if (G.zone) {
      UI.box(356, 356, 566, 50, P.DDG, 'rgba(4,6,10,0.85)');
      UI.text(`LIVE TELEMETRY · DISTRICT: ${G.zone.name.toUpperCase()} · TRACK: ${(MUSIC_DECK[AU.deckIdx] || MUSIC_DECK[0]).name.slice(0, 34)}`, 368, 366, P.GD, 1);
      const q = G.navTarget ? G.navTarget() : null;
      UI.text(q ? `ACTIVE TRAIL: ${q.label.toUpperCase()} (${Math.round(Math.hypot(q.x - player().group.position.x, q.z - player().group.position.z))}m)` : 'EXPLORE FREELY · VISIT NULL ACADEMY IN THE HUB FOR 20 PLAYABLE LABS', 368, 384, '#32ff85', 1);
    }

    // Bottom Action Bar: Music Deck, Graphics Mode, Sovereign Ops, Null Academy
    const btns = [
      { x: 20, w: 222, lbl: `[B] MUSIC: ${(MUSIC_DECK[AU.deckIdx] || MUSIC_DECK[0]).name.split('·')[0].trim().slice(0, 14)}`, col: '#32ff85', fn: () => G.cycleMusic() },
      { x: 250, w: 205, lbl: `[H] GFX: ${GFX_MODES[GB.gfxIdx].name.toUpperCase()}`, col: '#00d5ff', fn: () => G.cycleGfxMode() },
      { x: 463, w: 228, lbl: '[O] SOVEREIGN OPS (4 MISSIONS)', col: '#f5b82e', fn: () => { stopVoice(); G.openOpsHub && G.openOpsHub(); } },
      { x: 699, w: 241, lbl: 'NULL ACADEMY (20 AI LABS)', col: '#a855f7', fn: () => { stopVoice(); G.openAcademy && G.openAcademy(); } },
    ];
    btns.forEach((b) => {
      UI.box(b.x, 484, b.w, 38, b.col, 'rgba(6,10,18,0.95)');
      UI.text(b.lbl, b.x + b.w / 2, 498, b.col, 1, 'center');
      UI.hit(b.x, 484, b.w, 38, b.fn);
    });
  };
}
