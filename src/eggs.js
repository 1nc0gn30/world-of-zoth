// Easter eggs: hidden terminal + commands, Konami code, Game of Life and doom-fire mini-games, the oscilloscope
// handshake, title idle hook, achievements (persist across saves).
import * as UI from './ui.js';
import { P } from './pal.js';
import { IN, took } from './input.js';
import { AG } from './sprites.js';
import { ENEMIES } from './data.js';
import { ENEMY_WEAK } from './battle.js';
export const ACH={
  forge:['forged','apply a valid ZGL creation'], academy:['null certified','finish every Null Academy lab'], lab_prompt:['prompt engineer','lab 01'], lab_halluc:['source check','lab 02'], lab_inject:['data, not orders','lab 03'], lab_jail:['still no','lab 04'], lab_leak:['no secrets in prompts','lab 05'], lab_agent:['least privilege','lab 06'], lab_fake:['faces, not voices','lab 07'], lab_ctf:['capture the flag','lab 08'],
  tutorial:['first light','finish the tutorial'], dissipate:['dissipate','blink through a firewall'],
  first_win:['hello world','win a battle'], lvl10:['root','reach level 10'], lvl20:['kernel','reach level 20'], lvl30:['superuser','reach level 30'],
  boss_copy:['mirror, mirror','beat 03ng0cn1'], boss_relay4:['chorus','beat RELAY 4'], boss_sandglass:['six thirteen','beat SANDGLASS'], boss_hunter:['hunter offline','beat THE HUNTER'], boss_blank:['whoami','beat the cursor'], boss_archon:['the first compiler','beat ARCHON-0'], stack10:['stack overflow','clear floor 10 of The Infinite Stack'],
  ending:['tomorrow 06:12','see the sunrise'], crew22:['crew: 22','count the copy in'], recruit20:['twenty-one','recruit every agent'],
  konami:['up up down down','enter the old code'], terminal:['ls -a','find the hidden terminal'], whoami:['the wordmark','ask the terminal who you are'], rooftop:['06:12','find the rooftop'],
  early:['early riser','sleep at the rest tree at 06:12 real time'], sleep3:['rest well','sleep under the tree three times'], handshake:['handshake: ok','lock the oscilloscope with Vigil'],
  life:['conway','run 100 generations of Life'], doom:['doom-fire','keep the fire lit for 10 seconds'], tags:['district 9/9','find every red tag'], minions:['eight of me','find every Minion'], goodboy:['good dog','pet Pixel-Shiba ten times'], trace:['found you','trace the copy'],
};
export function initEggs(G,{music,sfx}){
  let got={}; try{ got=JSON.parse(localStorage.getItem('woz.ach')||'{}'); }catch(e){}
  G.achGot=got;
  G.ach=k=>{ if(!ACH[k]||got[k]) return; got[k]=Date.now(); try{ localStorage.setItem('woz.ach',JSON.stringify(got)); }catch(e){} G.toast('achievement: '+ACH[k][0],P.GD); sfx('level'); };
  G.checkAch=()=>{ const l=G.party.me&&G.party.me.lvl||1; if(l>=10) G.ach('lvl10'); if(l>=20) G.ach('lvl20'); if(l>=30) G.ach('lvl30'); if(G.roster.length>=21) G.ach('recruit20'); if(G.crewCount()>=22) G.ach('crew22'); };
  G.crewCount=()=>G.roster.length+(G.isFlag('copy_crew')?1:0);
  // ---- Konami code: works anywhere ----
  const KC=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA']; let kc=0;
  addEventListener('keydown',e=>{ kc=(e.code===KC[kc])?kc+1:(e.code===KC[0]?1:0); if(kc===KC.length){ kc=0; G.konami(); }
    if(e.code==='Backquote'&&G.mode==='explore'){ G.openTerminal(true); e.preventDefault(); return; }
    if(G.mode==='terminal') termKey(e); if(G.mode==='mini'&&G.mini.key) G.mini.key(e); });
  G.konami=()=>{ if(G.isFlag('konami')){ G.toast('> cheat detected. still no.',P.DG); return; } G.flag('konami'); G.bits+=99; G.give('root.shell',3); G.toast('> up up down down left right left right b a',P.GD); G.glitch(.8); G.ach('konami'); };
  // ---- hidden terminal ----
  const T=G.term={lines:[],buf:'',t:0};
  G.openTerminal=(intro=true)=>{ G.mode='terminal'; T.lines=intro?[['> hidden shell. type help.',P.GD]]:T.lines; T.buf=''; T.t=0; G.ach('terminal'); sfx('confirm'); };
  const out=(s,c=P.BONE)=>{ T.lines.push([s,c]); if(T.lines.length>13) T.lines.shift(); };
  function termKey(e){ if(e.key==='Escape'){ G.closeTerm=1; return; } if(e.key==='Enter'){ run(T.buf.trim().toLowerCase()); T.buf=''; G.eatConfirm=2; e.preventDefault(); return; }
    if(e.key==='Backspace'){ T.buf=T.buf.slice(0,-1); e.preventDefault(); return; } if(e.key.length===1&&T.buf.length<40){ T.buf+=e.key; sfx('talk'); e.preventDefault(); } }
  function run(c){ out('> '+c,P.GD); if(!c) return;
    if(c==='help') out('nmap  ping  patch  bounty  stack  bestiary  warp <zone>  whoami  crew  life  doom  exit');
    else if(c==='stack'){ out('[stack] opening The Infinite Stack (floors 1-99)...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startStack(); },40); }
    else if(c==='bestiary'){ out('[bestiary] opening Hostile Protocol Encyclopedia...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBestiary(); },40); }
    else if(c==='nmap'){
      const z=G.zone; const fn=(G.foes||[]).filter(f=>f.alive).length, nn=(G.npcs||[]).length, pn=(z.portals||[]).length;
      G.scanT=45; G.trailOn=true; sfx('blip');
      out(`[nmap] scanning ${z.name} (lvl ${z.lvl||1})...`,P.GD);
      out(`hostiles: ${fn}  |  agents: ${nn}  |  portals: ${pn}  |  radar boosted 45s`,P.BONE);
    }
    else if(c==='ping'){
      G.trailOn=true; G.scanT=Math.max(G.scanT||0,12); sfx('blip');
      const nt=G.navTarget&&G.navTarget();
      if(nt){ const p=G.player.group.position; const d=Math.round(Math.hypot(nt.x-p.x,nt.z-p.z)); out(`[ping] target: ${nt.label} (${d}m) — 3D golden trail locked`,P.GD); }
      else out('[ping] no active mission target in range.',P.DG);
    }
    else if(c==='patch'){
      G.active().forEach(id=>{ const s=G.stats(id), m=G.party[id]; m.hp=s.mhp; m.en=s.men; });
      sfx('heal'); out('[patch] party HP & EN restored to 100%.',P.GD);
    }
    else if(c==='bounty'){
      const tier=(G.flags.sub_tier||0)+1; G.flags.sub_tier=tier;
      const pools=[['drone','echo','drone'],['sentinel','worm','mite'],['phase','slag','slime'],['gunship','eel','cursorling'],['warden','gunship','cursorling']];
      const foes=pools[Math.min(pools.length-1,Math.floor((tier-1)/2))];
      out(`[sub-lattice] spawning tier ${tier} anomaly contract...`,P.RED);
      G.closeTerm=1; setTimeout(()=>{ G.mode='explore'; G.battle(foes,{lvl:(G.zone.lvl||1)+tier*2, ambush:false}); },60);
    }
    else if(c==='warp'||c.startsWith('warp ')){
      const arg=c.slice(5).trim(); const Z=G.Z||{};
      if(!arg||!Z[arg]){ out('zones: '+Object.keys(Z).join('  '),P.DG); }
      else { out(`[warp] routing to ${Z[arg].name}...`,P.GD); G.closeTerm=1; setTimeout(()=>{ G.mode='explore'; G.travelTo(arg); },50); }
    }
    else if(c==='ls -a'||c==='ls'){ out('.  ..  .faces  .voices  .crew22  .tomorrow_0612  .up_up_down_down'); }
    else if(c==='whoami'){ T.lines=T.lines.slice(-4); out('',P.BONE); T.word=G.t; G.ach('whoami'); }
    else if(c==='crew'){ const n=G.crewCount(); out('crew: '+n,n>=22?P.GD:P.BONE); if(n>=22){ out('> the 22nd was always there.',P.DG); G.ach('crew22'); } }
    else if(c==='date'||c==='time') out('> 06:12');
    else if(c==='connect') { out('> maze: ok'); out('> disconnect'); }
    else if(c==='life'){ G.mode='explore'; startLife(); }
    else if(c==='doom'){ G.mode='explore'; startDoom(); }
    else if(c==='trace 03ng0cn1'||c==='trace copy'){ out('found you',P.RED); out('> 03ng0cn1 is your name, backwards.',P.DG); G.ach('trace'); G.glitch(.5); sfx('red'); }
    else if(c==='tomorrow 06:12'||c==='tomorrow 0612'){ out('> see you at sunrise.',P.GD); setTimeout(()=>{},0); G.mode='explore'; G.travelTo('rooftop'); G.ach('rooftop'); }
    else if(c.startsWith('sudo')) out('> nice try.',P.DG);
    else if(c==='konami') out('> up up down down left right left right b a',P.DG);
    else if(c==='exit'||c==='quit') G.closeTerm=1;
    else out('command not found: '+c,P.DG); }
  // tap-able command chips so the shell works on touch screens without a keyboard
  const CHIPS=['help','nmap','ping','patch','bounty','stack','bestiary','warp','whoami','crew','life','doom','exit'];
  const chipRects=()=>{ const R=[]; let x=160, y=402; for(const c of CHIPS){ const w=UI.textW(c)+16; if(x+w>810){ x=160; y+=26; } R.push({c,x,y,w,h:20}); x+=w+8; } return R; };
  G.updateTerminal=dt=>{ T.t+=dt; if(G.closeTerm){ G.closeTerm=0; IN.pressed.clear(); G.mode='explore'; return; } if(IN.clicks.length){ const k=IN.clicks[0]; IN.clicks.length=0; const hit=chipRects().find(r=>k.x>=r.x&&k.x<=r.x+r.w&&k.y>=r.y-4&&k.y<=r.y+r.h+4); if(hit){ sfx('talk'); run(hit.c); } else if(IN.touch&&(k.x<140||k.x>820||k.y<60||k.y>480)) G.mode='explore'; } };
  G.drawTerminal=t=>{ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.88)'; X.fillRect(0,0,960,540); UI.box(140,60,680,420); UI.text('> shell',160,74,P.GD,2);
    T.lines.forEach(([l,c],i)=>UI.text(l,160,110+i*20,c,1)); if(T.word!=null&&T.lines.length>6) T.word=null; const y=110+T.lines.length*20; UI.text('> '+T.buf,160,y,P.GD); UI.cursor(160+UI.textW('> '+T.buf)+2,y+1,t);
    if(T.word!=null){ const r=Math.min(1,(G.t-T.word)/1.4); UI.dotText('1nc0gn30',480,300,6,P.GD,r,r<1?.2:0,t); }
    chipRects().forEach(r=>{ X.strokeStyle=P.DG; X.strokeRect(r.x+.5,r.y+.5,r.w,r.h); UI.text(r.c,r.x+8,r.y+4,P.GD,1); });
    UI.text('[esc] close'+(IN.touch?'  (tap outside to close)':''),800,460,P.DG,1,'right'); };
  // ---- mini-games ----
  function startLife(){ const n=96, m=54, g=new Uint8Array(n*m); for(let i=0;i<g.length;i++) g[i]=Math.random()<.18?1:0; let run=true, gen=0, acc=0;
    G.mini={ name:'life', update(dt){ if(took('back')||took('pause')){ G.mode='explore'; return; } if(took('confirm')) run=!run;
        IN.clicks.forEach(c=>{ const x=Math.floor(c.x/10), y=Math.floor(c.y/10); if(x<n&&y<m) g[y*n+x]^=1; }); IN.clicks.length=0;
        acc+=dt; if(run&&acc>.08){ acc=0; const o=new Uint8Array(n*m); for(let y=0;y<m;y++) for(let x=0;x<n;x++){ let c=0; for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++) if(i||j) c+=g[((y+j+m)%m)*n+((x+i+n)%n)]; const v=g[y*n+x]; o[y*n+x]=(v&&(c===2||c===3))||(!v&&c===3)?1:0; } g.set(o); gen++; if(gen===100) G.ach('life'); } },
      draw(t){ const X=UI.ctx; X.fillStyle=P.BK; X.fillRect(0,0,960,540); X.fillStyle=P.GD; X.beginPath(); for(let y=0;y<m;y++) for(let x=0;x<n;x++) if(g[y*n+x]){ X.moveTo(x*10+8.4,y*10+5); X.arc(x*10+5,y*10+5,3.4,0,7); } X.fill();
        UI.box(10,500,520,30); UI.text(`> life  gen ${gen}   [confirm] run/pause  [click] toggle  [x] exit`,20,509,P.BONE); } };
    G.mode='mini'; sfx('confirm'); }
  function startDoom(){ const W=160, H=90, f=new Uint8Array(W*H); let heat=36, tt=0, oc=null, ox, img, rgb; const pal=[P.BK,'#1a1306',P.DDG,'#5a420e',P.DG,'#c48f22',P.GD,'#ffd27a',P.BONE];
    G.mini={ name:'doom', update(dt){ if(took('back')||took('pause')){ G.mode='explore'; return; } if(IN.held.has('up')||took('confirm')) heat=Math.min(36,heat+2); if(IN.held.has('down')) heat=Math.max(0,heat-2);
        for(let x=0;x<W;x++) f[(H-1)*W+x]=heat; for(let y=0;y<H-1;y++) for(let x=0;x<W;x++){ const src=(y+1)*W+x; const r=Math.floor(Math.random()*3); const dst=y*W+Math.min(W-1,Math.max(0,x-r+1)); f[dst]=Math.max(0,f[src]-(r&1)); }
        if(heat>20){ tt+=dt; if(tt>10) G.ach('doom'); } },
      draw(){ const X=UI.ctx; if(!oc){ oc=document.createElement('canvas'); oc.width=W; oc.height=H; ox=oc.getContext('2d'); img=ox.createImageData(W,H); rgb=pal.map(h=>{ const c=parseInt(h.slice(1),16); return [c>>16,(c>>8)&255,c&255]; }); }
        const d=img.data; for(let i=0;i<W*H;i++){ const c=rgb[Math.min(8,Math.floor(f[i]/4.5))]; d[i*4]=c[0]; d[i*4+1]=c[1]; d[i*4+2]=c[2]; d[i*4+3]=255; } ox.putImageData(img,0,0);
        X.imageSmoothingEnabled=false; X.drawImage(oc,0,0,960,540);
        UI.box(10,500,460,30); UI.text('> doom-fire   [up] stoke  [down] smother  [x] exit',20,509,P.BONE); } };
    G.mode='mini'; sfx('confirm'); }
  G.startLife=startLife; G.startDoom=startDoom;
  // ---- Hostile Bestiary & Protocol Encyclopedia (M18) ----
  const PROTO_COUNTERS={
    KERNEL:'1nc0gn30, Kai, Pixel-Shiba, Pixel-Neko, Aquila',
    CRYPTO:'Vigil, Athena, Ghostbyte, Scorpius',
    THERMAL:'Kitsune, Ignis, Lycan, Draco',
    TEMPORAL:'Nexus, Kraken, Chronos, Leviathan, Mercury, Radical-Minion',
    VOID:'Onyx, Aether, 03ng0cn1'
  };
  G.openBestiary=()=>{
    const keys=Object.keys(ENEMIES); let sel=0;
    G.mini={
      name:'bestiary',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+keys.length-1)%keys.length;
        if(took('down')) sel=(sel+1)%keys.length;
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> HOSTILE BESTIARY',106,48,P.GD,2);
        UI.text(`PROTOCOL ENCYCLOPEDIA  ·  ${keys.length} SIGNATURES`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        const first=Math.max(0,Math.min(sel-7,keys.length-15));
        keys.slice(first,first+15).forEach((k,idx)=>{
          const i=first+idx, e=ENEMIES[k], y=92+idx*24, on=i===sel, wk=ENEMY_WEAK[k]||'KERNEL';
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(102,y-3,296,20); }
          UI.text(`${on?'> ':'  '}${e.boss?'[BOSS] ':'       '}${e.name}`,108,y,e.boss?P.RED:(on?P.GD:P.BONE),1);
          UI.text(`[${wk.slice(0,4)}]`,390,y,'#22d3ee',1,'right');
          UI.hit(102,y-3,296,20,()=>{ sel=i; });
        });
        const k=keys[sel], e=ENEMIES[k], wk=ENEMY_WEAK[k]||'KERNEL';
        UI.box(412,90,444,376,e.boss?P.RED:P.DDG,'rgba(12,10,8,.92)');
        UI.text(e.name.toUpperCase(),432,106,e.boss?P.RED:P.GD,2);
        UI.text(`Classification: ${e.boss?'SOVEREIGN APEX BOSS':'SUB-LATTICE HOSTILE UNIT'}   ·   Mesh: ${e.mesh}`,432,134,P.DG,1);
        UI.box(432,158,404,64,P.DDG,'rgba(6,5,4,.85)');
        UI.text(`BASE STATS (LV 1):   HP ${e.hp}   ·   ATK ${e.atk}   ·   DEF ${e.def}   ·   SPD ${e.spd}`,444,168,P.BONE,1);
        UI.text(`BOUNTY PAYOUT:   +${e.xp} XP  ·  +${e.bits} bits  ·  Voice Mimic: ${e.voice?'YES':'NO'}`,444,192,P.GD,1);
        UI.box(432,234,404,76,'#22d3ee','rgba(8,22,28,.45)');
        UI.text(`PROTOCOL WEAKNESS: [${wk}]  (1.35x Breach + 15% OD)`,444,244,'#22d3ee',1);
        UI.wrap(`Counter Agents (${wk}): ${PROTO_COUNTERS[wk]}`,380,1).forEach((l,li)=>UI.text(l,444,266+li*16,P.BONE,1));
        const mvs=(e.moves||[]).map(m=>m[0]).join('  ·  ');
        UI.text(`KNOWN ATTACK PATTERNS:  ${mvs||'standard strike'}`,432,328,P.GD,1);
        const drp=(e.drop||[]).map(d=>`${d[0]} (${Math.round(d[1]*100)}%)`).join('  ·  ')||'none';
        UI.text(`SALVAGE DROPS:          ${drp}`,432,354,P.BONE,1);
        if(e.mirror) UI.text('WARNING: Reflects repeated consecutive player commands!',432,386,P.RED,1);
        UI.text('[up/down] browse signatures   [esc] close encyclopedia',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- The Infinite Stack (Procedural Rogue-Lite Dungeon Mode: Floors 1-99) ----
  const MUTATORS=[
    ['OVERCLOCK','+35% starting Overdrive gauge & +10 EN on entry'],
    ['HYPER-CHAIN','Begin encounter at +2 Sync Chain multiplier'],
    ['CRYO-LATTICE','Enemy defenses reduced; Thermal/Crypto breach bonus'],
    ['QUANTUM BOUNTY','+50% bit & XP payout on floor completion'],
    ['BOSS ANOMALY','Sovereign Apex Guardian blocks every 5th floor']
  ];
  function stackWave(fl){
    if(fl%5===0){
      const bosses=[['copy','echo','echo'],['sandglass','wisp','wisp'],['hunter','hound','hound'],['relay4','node','node'],['archon','cursorling','cursorling']];
      return bosses[Math.min(bosses.length-1,Math.floor(fl/5)-1)];
    }
    const tiers=[
      ['drone','mite','drone'],['echo','worm','drone'],['sentinel','wisp','mite'],
      ['phase','slag','slime'],['gunship','eel','sentinel'],['warden','hound','phase'],
      ['cursorling','warden','gunship'],['cursorling','cursorling','warden']
    ];
    return tiers[Math.min(tiers.length-1,Math.floor((fl-1)/3))];
  }
  G.startStack=()=>{
    let sel=0;
    G.mini={
      name:'stack',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')||took('left')){ sel=(sel+2)%3; sfx('move'); }
        if(took('down')||took('right')){ sel=(sel+1)%3; sfx('move'); }
        if(took('confirm')) act(sel);
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.92)'; X.fillRect(0,0,960,540);
        const bx=150, by=54, bw=660, bh=432; UI.box(bx,by,bw,bh,P.GD,'rgba(8,7,5,.96)');
        const best=G.flags.stack_floor||0, fl=Math.min(99,best+1);
        const mut=MUTATORS[(fl%5===0)?4:(fl%4)];
        const wave=stackWave(fl), lvl=4+fl*2, isBoss=fl%5===0;
        UI.text('> THE INFINITE STACK',bx+22,by+18,P.GD,2);
        UI.text(`ROGUE-LITE GAUNTLET  ·  MAX FLOOR: ${best}/99`,bx+bw-22,by+22,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(bx+18,by+48,bw-36,2);
        UI.box(bx+22,by+64,bw-44,124,isBoss?P.RED:P.DDG,'rgba(14,11,8,.9)');
        UI.text(`NEXT BREACH: FLOOR ${String(fl).padStart(2,'0')}  ${isBoss?'[BOSS ANOMALY]':'[SECTOR WAVE]'}`,bx+36,by+76,isBoss?P.RED:P.GD,2);
        UI.text(`Threat Level: lv ${lvl}   ·   Hostile Signature: ${wave.join(' + ').toUpperCase()}`,bx+36,by+108,P.BONE,1);
        UI.text(`Active Mutator: ${mut[0]} — ${mut[1]}`,bx+36,by+130,'#a78bfa',1);
        UI.text(`Floor Reward: +${fl*25} bits  ·  ${isBoss?'Guaranteed Mythic / Root Shell Drop':'XP & Lattice Loot'}`,bx+36,by+152,P.DG,1);
        // Party status strip
        UI.text('ACTIVE SQUAD STATUS:',bx+22,by+204,P.DG,1);
        G.active().forEach((id,i)=>{
          const m=G.party[id], s=G.stats(id), px=bx+22+i*208, py=by+222;
          UI.box(px,py,196,48,P.DDG,'rgba(6,5,4,.85)');
          UI.text(`${id==='me'?'1nc0gn30':AG[id].name} (lv${m.lvl})`,px+10,py+6,id==='me'?P.GD:AG[id].color,1);
          UI.text(`HP ${m.hp}/${s.mhp}   EN ${m.en}/${s.men}`,px+10,py+24,P.BONE,1);
        });
        const opts=[
          [`> BREACH FLOOR ${String(fl).padStart(2,'0')} (${isBoss?'BOSS WAVE':'LAUNCH COMBAT'})`,()=>act(0)],
          [`> PATCH SQUAD HP/EN (25 bits  ·  you have ${G.bits} bits)`,()=>act(1)],
          [`> EXIT INFINITE STACK`,()=>act(2)]
        ];
        opts.forEach((o,i)=>{
          const oy=by+292+i*36, on=i===sel;
          UI.box(bx+22,oy,bw-44,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(o[0],bx+36,oy+8,on?P.GD:P.BONE,1);
          UI.hit(bx+22,oy,bw-44,30,()=>{ sel=i; act(i); });
        });
        UI.text('[up/down] select   [enter] confirm   [esc] leave',bx+bw/2,by+bh-24,P.DG,1,'center');
      }
    };
    function act(i){
      const best=G.flags.stack_floor||0, fl=Math.min(99,best+1);
      if(i===0){
        const wave=stackWave(fl), isBoss=fl%5===0, mutIdx=(fl%5===0)?4:(fl%4);
        sfx('confirm'); G.mode='explore';
        if(mutIdx===0){ G.active().forEach(id=>{ const s=G.stats(id); G.party[id].en=Math.min(s.men,G.party[id].en+10); }); }
        G.battle(wave,{lvl:4+fl*2, boss:isBoss, music:isBoss?'boss':'battle', ambush:mutIdx===0||mutIdx===1, stackFloor:fl});
      } else if(i===1){
        if(G.bits<25){ G.toast('need 25 bits to patch squad',P.RED); sfx('cancel'); return; }
        G.bits-=25; G.healAll(); sfx('heal'); G.toast('squad patched to 100% HP/EN',P.GD);
      } else {
        G.mode='explore'; sfx('cancel');
      }
    }
    G.mode='mini'; sfx('confirm');
  };
  // oscilloscope handshake (EP12): bring your curve to 3:2 and lock it
  G.startScope=()=>{ let a=1.6, tt=0, done=0; const vc=AG.vigil.color;
    G.mini={ name:'scope', ratio:()=>a, update(dt){ tt+=dt; if(took('back')){ G.mode='explore'; return; } if(IN.held.has('left')) a=Math.max(1,a-dt*.6); if(IN.held.has('right')) a=Math.min(5,a+dt*.6);
        if(took('confirm')&&!done){ if(Math.abs(a-3)<.06){ done=tt; sfx('win'); G.ach('handshake'); G.flag('handshake'); } else { sfx('cancel'); G.toast('no lock. 3:2.',P.DG); } } if(done&&tt-done>2.6) G.mode='explore'; },
      draw(t){ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.92)'; X.fillRect(0,0,960,540); UI.box(220,60,520,400);
        const cv=(fa,fb,ph,col,cx,cy,r)=>{ X.fillStyle=col; for(let i=0;i<900;i++){ const s=i/900*Math.PI*2; X.fillRect(Math.round(cx+Math.sin(fa*s+ph)*r),Math.round(cy+Math.sin(fb*s)*r),2,2); } };
        const lock=done||Math.abs(a-3)<.06; cv(a,2,t*(lock?0:1.3),P.GD,480,250,150); cv(3,2,.0,vc,480,250,150);
        UI.text(done?'> handshake':'> handshake: '+a.toFixed(2)+' : 2',480,420,P.GD,2,'center'); if(done) UI.text('ok',480,446,P.GD,2,'center'); else UI.text('[<- ->] tune   [confirm] lock at 3:2   [x] leave',480,446,P.DG,1,'center'); } };
    G.mode='mini'; };
  G.updateMini=dt=>G.mini&&G.mini.update(dt); G.drawMini=t=>G.mini&&G.mini.draw(t);
}
