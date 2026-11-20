// High-End Interactive Gameplay Operations & In-World 3D Data Shard Hunting for World of Zoth.
// 100% Web + Android Touch compatible. Awards real Bits, XP, Rank & permanent Sovereign buffs.
import * as THREE from 'three';
import { latMat } from './render.js';
import { particle, dissolve } from './fx.js';
import * as UI from './ui.js';
import { P } from './pal.js';
import { IN, took } from './input.js';
import { sfx, music } from './audio.js';

export const OPS_LIST = [
  {
    id: 'op_hermes',
    code: 'OP-01',
    title: 'Hermes Swarm Intercept',
    sub: '360° real-time MCP beam defense against cloud-telemetry drones',
    rewardBits: 350,
    rewardXP: 320,
    accent: '#00d5ff',
  },
  {
    id: 'op_breach',
    code: 'OP-02',
    title: 'Neural Weight Breach',
    sub: 'Multi-ring kinetic firewall heist to liberate open-weight models',
    rewardBits: 420,
    rewardXP: 380,
    accent: '#f5b82e',
  },
  {
    id: 'op_mixnet',
    code: 'OP-03',
    title: 'ZothNet Mixnet Relay Run',
    sub: 'Hyper-speed 3-lane fiber tunnel run dodging surveillance grids',
    rewardBits: 480,
    rewardXP: 440,
    accent: '#32ff85',
  },
  {
    id: 'op_archon',
    code: 'OP-04',
    title: 'Archon Sentinel Duel',
    sub: 'Real-time plasma-dodge & EMP counter boss showdown (3 phases)',
    rewardBits: 650,
    rewardXP: 600,
    accent: '#f43f5e',
  },
];

// Deterministic pseudo-random per zone so shards spawn in great reachable spots
function seeded(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 10000) / 10000;
  };
}

function buildShardMesh() {
  const g = new THREE.Group();
  // Octahedron crystal wireframe
  const seg = [
    0, 0.7, 0, 0.36, 0, 0,   0, 0.7, 0, -0.36, 0, 0,
    0, 0.7, 0, 0, 0, 0.36,   0, 0.7, 0, 0, 0, -0.36,
    0, -0.5, 0, 0.36, 0, 0,  0, -0.5, 0, -0.36, 0, 0,
    0, -0.5, 0, 0, 0, 0.36,  0, -0.5, 0, 0, 0, -0.36,
    0.36, 0, 0, 0, 0, 0.36,  0, 0, 0.36, -0.36, 0, 0,
    -0.36, 0, 0, 0, 0, -0.36, 0, 0, -0.36, 0.36, 0, 0,
  ];
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(seg, 3));
  const crystal = new THREE.LineSegments(geo, latMat({ color: '#00d5ff', intensity: 1.4, fogFar: 140 }));
  const beamGeo = new THREE.BufferGeometry();
  beamGeo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 3.8, 0], 3));
  const beam = new THREE.LineSegments(beamGeo, latMat({ color: '#32ff85', intensity: 0.7, fogFar: 120 }));
  g.add(crystal, beam);
  g.userData = { crystal };
  return g;
}

export function initMissions(G, { scene, player }) {
  const M = (G.missions = {
    done: {},
    shards: [],
    combo: 0,
    comboT: 0,
    totalShards: 0,
    sel: 0,
    activeOp: null,
  });

  try {
    const saved = JSON.parse(localStorage.getItem('woz.ops.v1') || '{}');
    M.done = saved.done || {};
    M.totalShards = saved.totalShards || 0;
  } catch (e) {}

  const saveOps = () => {
    try {
      localStorage.setItem('woz.ops.v1', JSON.stringify({ done: M.done, totalShards: M.totalShards }));
    } catch (e) {}
  };

  // ---------- 3D In-World Collectible Sovereign Data Shards ----------
  M.spawnZoneShards = (zoneId) => {
    M.shards.forEach((s) => scene.remove(s.mesh));
    M.shards = [];
    const z = G.Z && G.Z[zoneId];
    if (!z) return;
    const rng = seeded(zoneId + '_v25');
    const b = z.bounds || [-36, -36, 36, 36];
    const count = 6;
    for (let i = 0; i < count; i++) {
      const id = `${zoneId}_sh_${i}`;
      if (G.flags && G.flags['sh_' + id]) continue;
      const x = b[0] * 0.62 + rng() * (b[2] - b[0]) * 0.62;
      const zz = b[1] * 0.62 + rng() * (b[3] - b[1]) * 0.62;
      const mesh = buildShardMesh();
      const y = z.h(x, zz) + 1.0;
      mesh.position.set(x, y, zz);
      scene.add(mesh);
      M.shards.push({ id, x, z: zz, baseY: y, mesh });
    }
  };

  M.updateWorld = (dt, t) => {
    if (M.comboT > 0) {
      M.comboT = Math.max(0, M.comboT - dt);
      if (M.comboT <= 0) M.combo = 0;
    }
    const show = G.mode === 'explore' || G.mode === 'dialog' || G.mode === 'transition';
    const pl = player();
    const p = pl ? pl.group.position : null;

    for (let i = M.shards.length - 1; i >= 0; i--) {
      const s = M.shards[i];
      s.mesh.visible = show;
      if (!show) continue;
      s.mesh.position.y = s.baseY + Math.sin(t * 3.2 + i) * 0.22;
      s.mesh.userData.crystal.rotation.y = t * 2.1 + i;

      if (p && G.mode === 'explore') {
        const d = Math.hypot(p.x - s.x, p.z - s.z);
        if (d < 2.2) {
          scene.remove(s.mesh);
          M.shards.splice(i, 1);
          G.flags['sh_' + s.id] = 1;
          M.combo = Math.min(8, M.combo + 1);
          M.comboT = 9.0;
          M.totalShards++;
          const bits = 25 * M.combo;
          const xp = 35 * M.combo;
          G.bits += bits;
          G.gainXP && G.gainXP(G.active(), xp);
          dissolve(new THREE.Vector3(s.x, s.baseY, s.z), '#00d5ff', 42, 2.0);
          sfx('loot');
          G.toast(`> DATA SHARD x${M.combo}! +${bits} bits · +${xp} XP`, '#00d5ff');
          saveOps();
        }
      }
    }
  };

  // Register radar markers for remaining 3D data shards in current district
  if (G.hud3 && G.hud3.sources) {
    G.hud3.sources.push(() => M.shards.map((s) => ({ x: s.x, z: s.z, col: '#00d5ff', kind: 'poi', label: 'data shard' })));
  }

  // ---------- Reward Helper ----------
  function completeOp(op, score) {
    const first = !M.done[op.id];
    M.done[op.id] = Math.max(M.done[op.id] || 0, score);
    const bits = first ? op.rewardBits : Math.round(op.rewardBits * 0.45);
    const xp = first ? op.rewardXP : Math.round(op.rewardXP * 0.45);
    G.bits += bits;
    G.gainXP && G.gainXP(G.active(), xp);
    if (G.party && G.party.me) {
      const s = G.stats('me');
      G.party.me.hp = s.mhp;
      G.party.me.en = s.men;
    }
    sfx('win');
    G.toast(`> ${op.code} CLEARED! +${bits} bits · +${xp} XP (SCORE ${score})`, op.accent);
    saveOps();
    G.openOpsHub();
  }

  // =========================================================================
  // OP-01: HERMES SWARM INTERCEPT (Real-Time 360° Tactical Beam Defense)
  // =========================================================================
  function startHermesIntercept() {
    const op = OPS_LIST[0];
    music('hermes_pulse', true);
    const st = {
      hp: 100,
      maxHp: 100,
      wave: 1,
      kills: 0,
      targetKills: 24,
      score: 0,
      emp: 100,
      aim: 0,
      drones: [],
      beams: [],
      sparks: [],
      spawnT: 0.4,
      fireCd: 0,
      over: null,
    };

    const spawnDrone = () => {
      const a = Math.random() * Math.PI * 2;
      const dist = 300 + Math.random() * 80;
      const fast = Math.random() < 0.32 && st.wave >= 2;
      st.drones.push({
        x: 480 + Math.cos(a) * dist,
        y: 270 + Math.sin(a) * dist * 0.72,
        spd: (fast ? 95 : 58) + st.wave * 14,
        hp: fast ? 1 : 2,
        r: fast ? 11 : 15,
        col: fast ? '#f5b82e' : '#f43f5e',
      });
    };

    const fireAt = (tx, ty) => {
      st.aim = Math.atan2(ty - 270, tx - 480);
      st.beams.push({ x1: 480, y1: 270, x2: tx, y2: ty, life: 0.16 });
      sfx('zap');
      let hitAny = false;
      for (let i = st.drones.length - 1; i >= 0; i--) {
        const d = st.drones[i];
        // Distance from drone to beam segment
        const vx = tx - 480, vy = ty - 270;
        const l2 = vx * vx + vy * vy || 1;
        const u = Math.max(0, Math.min(1, ((d.x - 480) * vx + (d.y - 270) * vy) / l2));
        const px = 480 + vx * u, py = 270 + vy * u;
        if (Math.hypot(d.x - px, d.y - py) < d.r + 18) {
          d.hp--;
          hitAny = true;
          if (d.hp <= 0) {
            st.drones.splice(i, 1);
            st.kills++;
            st.score += 120;
            st.emp = Math.min(100, st.emp + 12);
            for (let k = 0; k < 8; k++) {
              const pa = Math.random() * 6.28;
              st.sparks.push({ x: d.x, y: d.y, vx: Math.cos(pa) * 90, vy: Math.sin(pa) * 90, life: 0.35, col: '#00d5ff' });
            }
          }
        }
      }
      if (hitAny) sfx('hit');
    };

    const triggerEMP = () => {
      if (st.emp < 100) return;
      st.emp = 0;
      sfx('boom');
      st.drones.forEach((d) => {
        st.kills++;
        st.score += 150;
        for (let k = 0; k < 6; k++) {
          const pa = Math.random() * 6.28;
          st.sparks.push({ x: d.x, y: d.y, vx: Math.cos(pa) * 110, vy: Math.sin(pa) * 110, life: 0.4, col: '#32ff85' });
        }
      });
      st.drones = [];
      st.beams.push({ ring: true, life: 0.4 });
    };

    G.mini = {
      name: 'op_hermes',
      update(dt) {
        if (took('back') || took('pause')) {
          G.openOpsHub();
          return;
        }
        if (st.over) {
          if (took('confirm') || IN.clicks.splice(0).length) {
            if (st.over === 'win') completeOp(op, st.score + st.hp * 5);
            else G.openOpsHub();
          }
          return;
        }
        st.wave = st.kills >= 16 ? 3 : st.kills >= 8 ? 2 : 1;
        st.fireCd = Math.max(0, st.fireCd - dt);
        st.spawnT -= dt;
        if (st.spawnT <= 0 && st.drones.length < 5 + st.wave * 2) {
          spawnDrone();
          st.spawnT = Math.max(0.45, 1.25 - st.wave * 0.22);
        }

        // Aim with keyboard or mouse/touch click
        if (IN.held.has('left')) st.aim -= dt * 3.6;
        if (IN.held.has('right')) st.aim += dt * 3.6;
        if (IN.pointer) st.aim = Math.atan2(IN.pointer.y - 270, IN.pointer.x - 480);

        if (took('dash')) triggerEMP();
        const clicks = IN.clicks.splice(0);
        for (const c of clicks) {
          if (c.x > 760 && c.y > 475) triggerEMP();
          else fireAt(c.x, c.y);
        }
        if (took('confirm') && st.fireCd <= 0) {
          st.fireCd = 0.14;
          fireAt(480 + Math.cos(st.aim) * 380, 270 + Math.sin(st.aim) * 260);
        }

        for (let i = st.drones.length - 1; i >= 0; i--) {
          const d = st.drones[i];
          const a = Math.atan2(270 - d.y, 480 - d.x);
          d.x += Math.cos(a) * d.spd * dt;
          d.y += Math.sin(a) * d.spd * dt;
          if (Math.hypot(d.x - 480, d.y - 270) < 34) {
            st.drones.splice(i, 1);
            st.hp = Math.max(0, st.hp - 16);
            sfx('hurt');
            if (st.hp <= 0) st.over = 'lose';
          }
        }
        st.beams.forEach((b) => (b.life -= dt));
        st.beams = st.beams.filter((b) => b.life > 0);
        st.sparks.forEach((p) => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; });
        st.sparks = st.sparks.filter((p) => p.life > 0);
        if (st.kills >= st.targetKills) st.over = 'win';
      },
      draw(t) {
        const X = UI.ctx;
        X.fillStyle = '#04070e';
        X.fillRect(0, 0, 960, 540);
        // Radar rings
        for (const r of [90, 175, 260]) {
          X.strokeStyle = 'rgba(0,213,255,0.16)';
          X.lineWidth = 1;
          X.beginPath();
          X.ellipse(480, 270, r * 1.2, r * 0.85, 0, 0, Math.PI * 2);
          X.stroke();
        }
        // Aim laser sight
        X.strokeStyle = 'rgba(0,213,255,0.35)';
        X.setLineDash([5, 5]);
        X.beginPath();
        X.moveTo(480, 270);
        X.lineTo(480 + Math.cos(st.aim) * 340, 270 + Math.sin(st.aim) * 240);
        X.stroke();
        X.setLineDash([]);

        // Center Hermes Local Core
        X.fillStyle = 'rgba(0,213,255,0.2)';
        X.beginPath();
        X.arc(480, 270, 30 + Math.sin(t * 5) * 2, 0, Math.PI * 2);
        X.fill();
        X.strokeStyle = '#00d5ff';
        X.lineWidth = 2;
        X.stroke();
        UI.text('127.0.0.1', 480, 265, '#00d5ff', 1, 'center');

        // Beams & EMP shockwave
        st.beams.forEach((b) => {
          if (b.ring) {
            const rad = (0.4 - b.life) * 900;
            X.strokeStyle = `rgba(50,255,133,${b.life * 2.5})`;
            X.lineWidth = 4;
            X.beginPath();
            X.arc(480, 270, rad, 0, Math.PI * 2);
            X.stroke();
          } else {
            X.strokeStyle = `rgba(0,213,255,${b.life * 6})`;
            X.lineWidth = 3;
            X.beginPath();
            X.moveTo(b.x1, b.y1);
            X.lineTo(b.x2, b.y2);
            X.stroke();
          }
        });

        // Hostile drones
        st.drones.forEach((d) => {
          X.fillStyle = d.col;
          X.beginPath();
          X.moveTo(d.x, d.y - d.r);
          X.lineTo(d.x + d.r, d.y);
          X.lineTo(d.x, d.y + d.r);
          X.lineTo(d.x - d.r, d.y);
          X.closePath();
          X.fill();
          X.strokeStyle = '#ffffff';
          X.lineWidth = 1;
          X.stroke();
        });
        st.sparks.forEach((p) => {
          X.fillStyle = p.col;
          X.fillRect(p.x - 2, p.y - 2, 4, 4);
        });

        // HUD
        UI.box(16, 12, 928, 38, '#00d5ff', 'rgba(4,7,14,0.92)');
        UI.text(`OP-01 HERMES SWARM INTERCEPT · WAVE ${st.wave}/3 · KILLS ${st.kills}/${st.targetKills}`, 30, 24, '#00d5ff', 1);
        UI.text(`CORE HP ${st.hp}%`, 680, 24, st.hp < 35 ? P.RED : '#32ff85', 1);
        UI.bar(770, 24, 150, 10, st.hp / 100, st.hp < 35 ? P.RED : '#32ff85', P.DDG);

        // EMP Button (tap-friendly on Android)
        const empReady = st.emp >= 100;
        UI.box(758, 480, 184, 44, empReady ? '#32ff85' : P.DDG, empReady ? 'rgba(50,255,133,0.22)' : 'rgba(6,8,14,0.9)');
        UI.text(empReady ? '[C/TAP] EMP NOVA!' : `EMP CHARGE ${Math.round(st.emp)}%`, 850, 496, empReady ? '#32ff85' : P.DG, 1, 'center');
        UI.text('CLICK / TAP DRONES OR AIM + SPACE TO FIRE MCP BEAMS · [ESC] ABORT', 20, 504, P.DG, 1);

        if (st.over) {
          UI.box(270, 190, 420, 150, st.over === 'win' ? '#32ff85' : P.RED, 'rgba(4,6,12,0.96)');
          UI.text(st.over === 'win' ? 'HERMES ENCLAVE SECURED!' : 'CORE BREACHED', 480, 218, st.over === 'win' ? '#32ff85' : P.RED, 2, 'center');
          UI.text(`SCORE: ${st.score + st.hp * 5} · TELEMETRY NEUTRALIZED`, 480, 260, P.BONE, 1, 'center');
          UI.text('[SPACE / TAP] CONTINUE', 480, 304, P.GD, 1, 'center');
        }
      },
    };
    G.mode = 'mini';
  }

  // =========================================================================
  // OP-02: NEURAL WEIGHT BREACH (Multi-Ring Kinetic Timing Firewall Heist)
  // =========================================================================
  function startWeightBreach() {
    const op = OPS_LIST[1];
    music('synthwave', true);
    const st = {
      rings: [
        { r: 72, ang: 0, spd: 2.1, target: 1.2, width: 0.56, locked: false },
        { r: 112, ang: 2.4, spd: -2.7, target: 3.9, width: 0.48, locked: false },
        { r: 152, ang: 4.1, spd: 3.3, target: 5.2, width: 0.42, locked: false },
        { r: 192, ang: 1.1, spd: -3.9, target: 2.4, width: 0.36, locked: false },
      ],
      cur: 0,
      timeLeft: 28,
      misses: 0,
      score: 0,
      flash: 0,
      over: null,
    };

    const attemptLock = () => {
      const rg = st.rings[st.cur];
      if (!rg) return;
      let diff = Math.abs(Math.atan2(Math.sin(rg.ang - rg.target), Math.cos(rg.ang - rg.target)));
      if (diff <= rg.width * 0.65) {
        rg.locked = true;
        st.score += Math.round(300 + st.timeLeft * 15);
        st.flash = 0.4;
        sfx('confirm');
        st.cur++;
        if (st.cur >= st.rings.length) {
          sfx('win');
          st.over = 'win';
        }
      } else {
        st.misses++;
        st.timeLeft = Math.max(0, st.timeLeft - 3.2);
        sfx('hurt');
        if (st.timeLeft <= 0) st.over = 'lose';
      }
    };

    G.mini = {
      name: 'op_breach',
      update(dt) {
        if (took('back') || took('pause')) { G.openOpsHub(); return; }
        if (st.over) {
          if (took('confirm') || IN.clicks.splice(0).length) {
            if (st.over === 'win') completeOp(op, st.score);
            else G.openOpsHub();
          }
          return;
        }
        st.timeLeft = Math.max(0, st.timeLeft - dt);
        st.flash = Math.max(0, st.flash - dt);
        if (st.timeLeft <= 0) { st.over = 'lose'; sfx('cancel'); return; }
        st.rings.forEach((rg) => { if (!rg.locked) rg.ang = (rg.ang + rg.spd * dt) % (Math.PI * 2); });
        if (took('confirm') || IN.clicks.splice(0).length) attemptLock();
      },
      draw() {
        const X = UI.ctx;
        X.fillStyle = '#05060b';
        X.fillRect(0, 0, 960, 540);
        UI.box(16, 12, 928, 38, '#f5b82e', 'rgba(6,8,14,0.92)');
        UI.text(`OP-02 NEURAL WEIGHT BREACH · LAYER ${Math.min(st.cur + 1, 4)}/4 · TRACE TIMER ${st.timeLeft.toFixed(1)}s`, 30, 24, '#f5b82e', 1);
        UI.text(`SCORE ${st.score}`, 924, 24, '#00d5ff', 1, 'right');

        st.rings.forEach((rg, idx) => {
          const active = idx === st.cur;
          X.strokeStyle = rg.locked ? '#32ff85' : active ? 'rgba(245,184,46,0.4)' : 'rgba(148,163,184,0.18)';
          X.lineWidth = active ? 5 : 2;
          X.beginPath();
          X.arc(480, 276, rg.r, 0, Math.PI * 2);
          X.stroke();

          // Target alignment arc
          X.strokeStyle = rg.locked ? '#32ff85' : active ? '#00d5ff' : 'rgba(0,213,255,0.28)';
          X.lineWidth = active ? 9 : 4;
          X.beginPath();
          X.arc(480, 276, rg.r, rg.target - rg.width * 0.5, rg.target + rg.width * 0.5);
          X.stroke();

          // Sweeper node
          if (!rg.locked) {
            const sx = 480 + Math.cos(rg.ang) * rg.r;
            const sy = 276 + Math.sin(rg.ang) * rg.r;
            X.fillStyle = active ? '#f5b82e' : '#94a3b8';
            X.beginPath();
            X.arc(sx, sy, active ? 8 : 5, 0, Math.PI * 2);
            X.fill();
          }
        });

        UI.text('SAFETENSORS', 480, 266, st.cur >= 4 ? '#32ff85' : '#f5b82e', 1, 'center');
        UI.text('PRESS [SPACE] OR TAP ANYWHERE WHEN THE GOLD NODE HITS THE CYAN ZONE', 480, 502, P.BONE, 1, 'center');

        if (st.over) {
          UI.box(260, 195, 440, 145, st.over === 'win' ? '#32ff85' : P.RED, 'rgba(4,6,12,0.96)');
          UI.text(st.over === 'win' ? 'OPEN WEIGHTS LIBERATED!' : 'TRACE DETECTED', 480, 224, st.over === 'win' ? '#32ff85' : P.RED, 2, 'center');
          UI.text(`FINAL SCORE: ${st.score} · MISSES: ${st.misses}`, 480, 264, P.BONE, 1, 'center');
          UI.text('[SPACE / TAP] CONTINUE', 480, 304, P.GD, 1, 'center');
        }
      },
    };
    G.mode = 'mini';
  }

  // =========================================================================
  // OP-03: ZOTHNET MIXNET RELAY RUN (Hyper-Speed 3-Lane Fiber Tunnel Run)
  // =========================================================================
  function startMixnetRun() {
    const op = OPS_LIST[2];
    music('hyper_phonk', true);
    const st = {
      lane: 1, // 0 left, 1 mid, 2 right
      hp: 3,
      time: 26,
      score: 0,
      obs: [],
      spawnT: 0.4,
      over: null,
    };

    G.mini = {
      name: 'op_mixnet',
      update(dt) {
        if (took('back') || took('pause')) { G.openOpsHub(); return; }
        if (st.over) {
          if (took('confirm') || IN.clicks.splice(0).length) {
            if (st.over === 'win') completeOp(op, st.score + st.hp * 200);
            else G.openOpsHub();
          }
          return;
        }
        st.time = Math.max(0, st.time - dt);
        st.score += Math.round(dt * 40);
        if (st.time <= 0) { st.over = 'win'; sfx('win'); return; }

        if (took('left')) { st.lane = Math.max(0, st.lane - 1); sfx('move'); }
        if (took('right')) { st.lane = Math.min(2, st.lane + 1); sfx('move'); }
        for (const c of IN.clicks.splice(0)) {
          st.lane = c.x < 340 ? 0 : c.x > 620 ? 2 : 1;
          sfx('move');
        }

        st.spawnT -= dt;
        if (st.spawnT <= 0) {
          const lane = Math.floor(Math.random() * 3);
          const isCoin = Math.random() < 0.42;
          st.obs.push({ lane, z: 1.0, coin: isCoin });
          st.spawnT = 0.42;
        }
        for (let i = st.obs.length - 1; i >= 0; i--) {
          const o = st.obs[i];
          o.z -= dt * 0.78;
          if (o.z <= 0.14 && o.z >= 0.02 && o.lane === st.lane) {
            st.obs.splice(i, 1);
            if (o.coin) { st.score += 180; sfx('loot'); }
            else { st.hp--; sfx('hurt'); if (st.hp <= 0) st.over = 'lose'; }
          } else if (o.z < 0) {
            st.obs.splice(i, 1);
          }
        }
      },
      draw(t) {
        const X = UI.ctx;
        X.fillStyle = '#03070b';
        X.fillRect(0, 0, 960, 540);
        // 3D perspective fiber tunnel rails
        const vpX = 480, vpY = 160;
        const laneX = (l, depth) => {
          const spread = (1 - depth) * 260;
          return vpX + (l - 1) * spread;
        };
        const laneY = (depth) => vpY + (1 - depth) * 320;

        for (let b = -1.5; b <= 1.5; b += 1) {
          X.strokeStyle = 'rgba(50,255,133,0.35)';
          X.lineWidth = 2;
          X.beginPath();
          X.moveTo(vpX + b * 24, vpY);
          X.lineTo(vpX + b * 290, 500);
          X.stroke();
        }
        // Moving horizontal speed bars
        for (let k = 0; k < 8; k++) {
          const d = ((k / 8) - (t * 0.85) % (1 / 8) + 1) % 1;
          const y = laneY(d);
          const w = (1 - d) * 435;
          X.strokeStyle = `rgba(0,213,255,${(1 - d) * 0.35})`;
          X.beginPath();
          X.moveTo(vpX - w, y);
          X.lineTo(vpX + w, y);
          X.stroke();
        }

        // Obstacles & Nous Tokens
        st.obs.forEach((o) => {
          const x = laneX(o.lane, o.z);
          const y = laneY(o.z);
          const sz = Math.max(6, (1 - o.z) * 44);
          X.fillStyle = o.coin ? '#00d5ff' : '#f43f5e';
          if (o.coin) {
            X.beginPath();
            X.arc(x, y, sz * 0.55, 0, Math.PI * 2);
            X.fill();
          } else {
            X.fillRect(x - sz * 0.8, y - sz * 0.55, sz * 1.6, sz * 0.9);
          }
        });

        // Player Sphinx Packet Ship
        const px = laneX(st.lane, 0.08);
        const py = laneY(0.08);
        X.fillStyle = '#32ff85';
        X.beginPath();
        X.moveTo(px, py - 24);
        X.lineTo(px + 26, py + 18);
        X.lineTo(px, py + 8);
        X.lineTo(px - 26, py + 18);
        X.closePath();
        X.fill();

        UI.box(16, 12, 928, 38, '#32ff85', 'rgba(4,8,12,0.92)');
        UI.text(`OP-03 ZOTHNET MIXNET RUN · HOPS LEFT ${st.time.toFixed(1)}s · SHIELD ${'♥'.repeat(st.hp)}`, 30, 24, '#32ff85', 1);
        UI.text(`SCORE ${st.score}`, 924, 24, P.GD, 1, 'right');
        UI.text('USE [A/D] OR [<-/->] OR TAP LEFT / CENTER / RIGHT LANE · COLLECT CYAN TOKENS', 480, 506, P.DG, 1, 'center');

        if (st.over) {
          UI.box(260, 195, 440, 145, st.over === 'win' ? '#32ff85' : P.RED, 'rgba(4,6,12,0.96)');
          UI.text(st.over === 'win' ? '3-HOP MIXNET DELIVERED!' : 'PACKET INTERCEPTED', 480, 224, st.over === 'win' ? '#32ff85' : P.RED, 2, 'center');
          UI.text(`SCORE: ${st.score + st.hp * 200}`, 480, 264, P.BONE, 1, 'center');
          UI.text('[SPACE / TAP] CONTINUE', 480, 304, P.GD, 1, 'center');
        }
      },
    };
    G.mode = 'mini';
  }

  // =========================================================================
  // OP-04: ARCHON SENTINEL DUEL (Real-Time Dodge & EMP Counter Boss Battle)
  // =========================================================================
  function startArchonDuel() {
    const op = OPS_LIST[3];
    music('archon', true);
    const st = {
      px: 480,
      py: 410,
      hp: 100,
      bossHp: 100,
      bossX: 480,
      bossY: 130,
      charge: 0,
      bullets: [],
      shots: [],
      fireT: 0.7,
      score: 0,
      over: null,
    };

    G.mini = {
      name: 'op_archon',
      update(dt) {
        if (took('back') || took('pause')) { G.openOpsHub(); return; }
        if (st.over) {
          if (took('confirm') || IN.clicks.splice(0).length) {
            if (st.over === 'win') completeOp(op, st.score + st.hp * 8);
            else G.openOpsHub();
          }
          return;
        }
        const sp = 290;
        if (IN.held.has('left')) st.px -= sp * dt;
        if (IN.held.has('right')) st.px += sp * dt;
        if (IN.held.has('up')) st.py -= sp * dt;
        if (IN.held.has('down')) st.py += sp * dt;
        if (IN.pointer && IN.touch) {
          st.px += (IN.pointer.x - st.px) * Math.min(1, dt * 8);
          st.py += (IN.pointer.y - st.py) * Math.min(1, dt * 8);
        }
        st.px = Math.max(40, Math.min(920, st.px));
        st.py = Math.max(210, Math.min(480, st.py));

        st.bossX = 480 + Math.sin(G.t * 1.4) * 240;
        st.charge = Math.min(100, st.charge + dt * 26);

        if (took('confirm') || IN.clicks.splice(0).length) {
          const big = st.charge >= 100;
          if (big) st.charge = 0;
          st.shots.push({ x: st.px, y: st.py - 16, vy: -460, dmg: big ? 16 : 5, r: big ? 12 : 5, col: big ? '#00d5ff' : '#f5b82e' });
          sfx(big ? 'crit' : 'zap');
        }

        st.fireT -= dt;
        if (st.fireT <= 0) {
          const phase = st.bossHp <= 35 ? 3 : st.bossHp <= 70 ? 2 : 1;
          const n = 5 + phase * 2;
          const baseA = Math.atan2(st.py - st.bossY, st.px - st.bossX);
          for (let i = 0; i < n; i++) {
            const a = baseA + (i - (n - 1) / 2) * 0.24;
            st.bullets.push({ x: st.bossX, y: st.bossY + 24, vx: Math.cos(a) * (150 + phase * 35), vy: Math.sin(a) * (150 + phase * 35) });
          }
          st.fireT = Math.max(0.55, 1.2 - phase * 0.2);
        }

        for (let i = st.shots.length - 1; i >= 0; i--) {
          const s = st.shots[i];
          s.y += s.vy * dt;
          if (Math.hypot(s.x - st.bossX, s.y - st.bossY) < 38 + s.r) {
            st.shots.splice(i, 1);
            st.bossHp = Math.max(0, st.bossHp - s.dmg);
            st.score += s.dmg * 20;
            sfx('hit');
            if (st.bossHp <= 0) { st.over = 'win'; sfx('win'); }
          } else if (s.y < 50) st.shots.splice(i, 1);
        }

        for (let i = st.bullets.length - 1; i >= 0; i--) {
          const b = st.bullets[i];
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (Math.hypot(b.x - st.px, b.y - st.py) < 16) {
            st.bullets.splice(i, 1);
            st.hp = Math.max(0, st.hp - 15);
            sfx('hurt');
            if (st.hp <= 0) st.over = 'lose';
          } else if (b.x < 0 || b.x > 960 || b.y > 540 || b.y < 0) st.bullets.splice(i, 1);
        }
      },
      draw() {
        const X = UI.ctx;
        X.fillStyle = '#060409';
        X.fillRect(0, 0, 960, 540);
        // Boss
        X.fillStyle = 'rgba(244,63,94,0.22)';
        X.beginPath();
        X.arc(st.bossX, st.bossY, 38, 0, Math.PI * 2);
        X.fill();
        X.strokeStyle = '#f43f5e';
        X.lineWidth = 3;
        X.stroke();
        UI.text('ARCHON', st.bossX, st.bossY - 5, '#f43f5e', 1, 'center');

        // Player
        X.fillStyle = '#00d5ff';
        X.beginPath();
        X.moveTo(st.px, st.py - 16);
        X.lineTo(st.px + 14, st.py + 12);
        X.lineTo(st.px - 14, st.py + 12);
        X.closePath();
        X.fill();

        st.shots.forEach((s) => { X.fillStyle = s.col; X.beginPath(); X.arc(s.x, s.y, s.r, 0, Math.PI * 2); X.fill(); });
        st.bullets.forEach((b) => { X.fillStyle = '#f43f5e'; X.beginPath(); X.arc(b.x, b.y, 6, 0, Math.PI * 2); X.fill(); });

        UI.box(16, 12, 928, 42, '#f43f5e', 'rgba(8,4,10,0.94)');
        UI.text(`OP-04 ARCHON SENTINEL DUEL · BOSS ${st.bossHp}%`, 30, 26, '#f43f5e', 1);
        UI.bar(310, 26, 220, 10, st.bossHp / 100, '#f43f5e', P.DDG);
        UI.text(`HP ${st.hp}% · EMP ${Math.round(st.charge)}%`, 924, 26, '#00d5ff', 1, 'right');
        UI.text('WASD / DRAG TO DODGE · [SPACE / TAP] TO FIRE (100% CHARGE = CYAN EMP BLAST)', 480, 506, P.DG, 1, 'center');

        if (st.over) {
          UI.box(260, 195, 440, 145, st.over === 'win' ? '#32ff85' : P.RED, 'rgba(4,6,12,0.96)');
          UI.text(st.over === 'win' ? 'ARCHON SENTINEL SHATTERED!' : 'OPERATOR DOWN', 480, 224, st.over === 'win' ? '#32ff85' : P.RED, 2, 'center');
          UI.text(`SCORE: ${st.score + st.hp * 8}`, 480, 264, P.BONE, 1, 'center');
          UI.text('[SPACE / TAP] CONTINUE', 480, 304, P.GD, 1, 'center');
        }
      },
    };
    G.mode = 'mini';
  }

  const LAUNCHERS = [startHermesIntercept, startWeightBreach, startMixnetRun, startArchonDuel];

  // ---------- Sovereign Operations Hub Menu ----------
  G.openOpsHub = () => {
    G.mini = {
      name: 'ops_hub',
      update() {
        if (took('back') || took('pause')) {
          G.mode = 'explore';
          if (G.zone) music(G.zone.music);
          sfx('cancel');
          return;
        }
        if (took('up')) { M.sel = (M.sel + OPS_LIST.length - 1) % OPS_LIST.length; sfx('move'); }
        if (took('down')) { M.sel = (M.sel + 1) % OPS_LIST.length; sfx('move'); }
        for (const c of IN.clicks.splice(0)) {
          if (c.x > 820 && c.y < 60) { G.mode = 'explore'; if (G.zone) music(G.zone.music); return; }
          const idx = Math.floor((c.y - 116) / 86);
          if (c.x > 40 && c.x < 920 && idx >= 0 && idx < OPS_LIST.length) {
            M.sel = idx;
            sfx('confirm');
            LAUNCHERS[idx]();
            return;
          }
        }
        if (took('confirm')) { sfx('confirm'); LAUNCHERS[M.sel](); }
      },
      draw() {
        const X = UI.ctx;
        X.fillStyle = 'rgba(4,6,12,0.95)';
        X.fillRect(0, 0, 960, 540);
        const cleared = Object.keys(M.done).length;
        UI.box(24, 16, 912, 54, '#00d5ff', 'rgba(6,10,18,0.96)');
        UI.text(`SOVEREIGN OPS (${cleared}/4)`, 42, 28, '#00d5ff', 2);
        UI.text(`SHARDS: ${M.totalShards} · [ESC] CLOSE`, 918, 34, P.GD, 1, 'right');

        OPS_LIST.forEach((op, i) => {
          const y = 116 + i * 86;
          const sel = i === M.sel;
          const best = M.done[op.id];
          UI.box(40, y, 880, 74, sel ? op.accent : P.DDG, sel ? 'rgba(0,213,255,0.12)' : 'rgba(6,8,14,0.92)');
          UI.text(`${op.code}  ${op.title.toUpperCase()}`, 60, y + 12, sel ? op.accent : P.BONE, 2);
          UI.text(op.sub, 60, y + 44, P.DG, 1);
          UI.text(best ? `[CLEARED · BEST ${best}]` : `+${op.rewardBits} BITS · +${op.rewardXP} XP`, 900, y + 16, best ? '#32ff85' : P.GD, 1, 'right');
          UI.text(sel ? '[ENTER / TAP TO DEPLOY]' : 'READY', 900, y + 44, sel ? op.accent : P.DG, 1, 'right');
        });

        UI.text('TIP: HUNT GLOWING 3D DATA SHARDS IN EVERY DISTRICT FOR CHAIN COMBO MULTIPLIERS (UP TO x8)!', 480, 496, '#32ff85', 1, 'center');
      },
    };
    G.mode = 'mini';
  };
}
