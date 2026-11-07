// Easter eggs: hidden terminal + commands, Konami code, Game of Life and doom-fire mini-games, the oscilloscope
// handshake, title idle hook, achievements (persist across saves).
import * as UI from './ui.js';
import { P, THEMES, applyTheme } from './pal.js';
import { IN, took, KEYMAP, DEFAULT_KEYS } from './input.js';
import { AG } from './sprites.js';
import { ENEMIES, ITEMS, PARTY_BASE, SKILLS } from './data.js';
import { ENEMY_WEAK, PARTY_PROTO, AI_TACTICS } from './battle.js';
export const ACH={
  forge:['forged','apply a valid ZGL creation'], academy:['null certified','finish every Null Academy lab'], lab_prompt:['prompt engineer','lab 01'], lab_halluc:['source check','lab 02'], lab_inject:['data, not orders','lab 03'], lab_jail:['still no','lab 04'], lab_leak:['no secrets in prompts','lab 05'], lab_agent:['least privilege','lab 06'], lab_fake:['faces, not voices','lab 07'], lab_ctf:['capture the flag','lab 08'],
  tutorial:['first light','finish the tutorial'], dissipate:['dissipate','blink through a firewall'],
  first_win:['hello world','win a battle'], lvl10:['root','reach level 10'], lvl20:['kernel','reach level 20'], lvl30:['superuser','reach level 30'],
  boss_copy:['mirror, mirror','beat 03ng0cn1'], boss_relay4:['chorus','beat RELAY 4'], boss_sandglass:['six thirteen','beat SANDGLASS'], boss_hunter:['hunter offline','beat THE HUNTER'], boss_blank:['whoami','beat the cursor'], boss_archon:['the first compiler','beat ARCHON-0'], stack10:['stack overflow','clear floor 10 of The Infinite Stack'], pantheon_trial:['pantheon sovereign','clear all 6 stages of Boss Rush'], reforge5:['overclocked +5','overclock any gear to +5'], bounty10:['apex hunter','clear all 10 district elite bounties'], photographer:['06:12 postcard','capture a snapshot in Photo Mode'], daily_clear:['daily 06:12','complete a Daily Seeded Lattice Run'], packet_runner:['hilbert surfer','reach 500m in Packet Runner'], zk_cipher:['zero-knowledge solver','solve the 4x4 Protocol Cipher Grid'],
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
    if(c==='help') out('nmap  ping  patch  daily  dojo  synth  logs  bonds  keys  runner  cipher  titles  bounty  stack  bossrush  reforge  bestiary  photo  saves  theme  warp  exit');
    else if(c==='runner'){ out('[runner] launching 3D Hilbert Packet Runner...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startRunner(); },40); }
    else if(c==='cipher'){ out('[cipher] launching Zero-Knowledge 4x4 Cipher Grid...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startCipher(); },40); }
    else if(c==='keys'||c==='binds'){ out('[keys] opening Custom Keybind & Controller Remapper...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openKeybinds(); },40); }
    else if(c==='logs'||c==='datacubes'){ out('[logs] opening 15 Encrypted District Datacubes...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openDatacubes(); },40); }
    else if(c==='bonds'||c==='affinity'){ out('[bonds] opening Companion Affinity & Bond Matrix...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBonds(); },40); }
    else if(c==='dojo'){ out('[dojo] opening Combat Arena Sandbox & DPS Analyzer...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openDojo(); },40); }
    else if(c==='synth'){ out('[synth] opening Zero-Knowledge Relic Synthesizer Cube...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSynth(); },40); }
    else if(c==='daily'){ out('[daily] opening 06:12 Daily Seeded Lattice Challenge...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openDailyChallenge(); },40); }
    else if(c==='titles'||c==='badges'){ out('[titles] opening Operator Title Badges & Showcase...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openTitles(); },40); }
    else if(c==='stack'){ out('[stack] opening The Infinite Stack (floors 1-99)...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startStack(); },40); }
    else if(c==='bossrush'){ out('[bossrush] opening Pantheon Boss Rush Trial...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBossRush(); },40); }
    else if(c==='reforge'){ out('[reforge] opening Gear Overclocking Bench (+1 to +5)...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openReforge(); },40); }
    else if(c==='bestiary'){ out('[bestiary] opening Hostile Protocol Encyclopedia...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBestiary(); },40); }
    else if(c==='bounty'){ out('[bounty] opening District Elite Bounty Board (10 contracts)...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBounties(); },40); }
    else if(c==='photo'){ out('[photo] entering 3D Photo Mode & Postcard Studio...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openPhotoMode(); },40); }
    else if(c==='saves'||c==='save'){ out('[saves] opening 3-Slot Save Manager & Base64 Exporter...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSaveManager(); },40); }
    else if(c==='theme'||c.startsWith('theme ')){ const t=G.cycleTheme(); out(`[theme] CRT phosphor set to: ${t.name}`,P.GD); }
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
  const CHIPS=['help','nmap','ping','patch','daily','dojo','synth','logs','bonds','titles','bounty','stack','bossrush','reforge','bestiary','photo','saves','theme','exit'];
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
  // ---- 3-Slot Save Manager & Base64 Cloud-Free Save String Export/Import (M25) ----
  const SLOT_KEYS=['woz.save','woz.save.2','woz.save.3'];
  G.openSaveManager=()=>{
    let sel=0, msg='';
    const readSlot=i=>{ try{ return JSON.parse(localStorage.getItem(SLOT_KEYS[i])||'null'); }catch(e){ return null; } };
    const makePayload=()=>{
      const p=G.player.group.position;
      return {v:1,zone:G.zoneId,x:p.x,z:p.z,yaw:G.player.facing,party:G.party,roster:G.roster,active:G.activeL,inv:G.inv,bits:G.bits,quests:G.quests,flags:G.flags,defeated:[...G.defeated],equip:G.equip,mods:G.mods,time:Date.now(),v2:1};
    };
    G.mini={
      name:'saves',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+2)%3;
        if(took('down')) sel=(sel+1)%3;
        if(took('confirm')){
          const d=makePayload();
          try{
            localStorage.setItem(SLOT_KEYS[sel],JSON.stringify(d));
            localStorage.setItem('woz.save',JSON.stringify(d));
            sfx('save'); msg=`SAVED TO SLOT 0${sel+1} (${new Date().toLocaleTimeString()})`;
            G.toast(`> Saved to Slot 0${sel+1}`,P.GD);
          }catch(e){ msg='SAVE FAILED'; }
        }
        if(took('party')){
          const s=readSlot(sel);
          if(!s){ sfx('cancel'); msg=`SLOT 0${sel+1} IS EMPTY`; return; }
          try{
            localStorage.setItem('woz.save',JSON.stringify(s));
            G.loadGame(); sfx('confirm');
          }catch(e){}
        }
        if(took('n1')||took('quests')){
          try{
            const b64=btoa(unescape(encodeURIComponent(JSON.stringify(makePayload()))));
            window.__wozSaveB64=b64;
            if(navigator.clipboard&&navigator.clipboard.writeText) navigator.clipboard.writeText(b64).catch(()=>{});
            sfx('save'); msg=`BASE64 STRING COPIED (${b64.length} chars) -> window.__wozSaveB64`;
            G.toast('> Base64 Save String copied to clipboard!',P.GD);
          }catch(e){}
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        UI.text('> 3-SLOT SAVE MANAGER',118,52,P.GD,2);
        UI.text('BASE64 BACKUP  ·  100% LOCAL-FIRST',842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        for(let i=0;i<3;i++){
          const s=readSlot(i), y=98+i*96, on=i===sel;
          UI.box(118,y,724,84,on?P.GD:P.DDG,on?'rgba(245,184,46,.12)':'rgba(6,5,4,.85)');
          UI.text(`${on?'> ':'  '}SLOT 0${i+1} ${i===0?'(PRIMARY AUTO-SYNC)':''}`,136,y+12,on?P.GD:P.BONE,2);
          if(s){
            const zname=G.Z[s.zone]?G.Z[s.zone].name.toUpperCase():s.zone;
            const lvl=s.party&&s.party.me?s.party.me.lvl:1, crw=(s.roster||[]).length;
            const dt=s.time?new Date(s.time).toLocaleString():'unknown';
            UI.text(`Zone: ${zname}   ·   Level: lv${lvl}   ·   Crew: ${crw}/22   ·   Bits: ${s.bits||0}`,136,y+42,'#22d3ee',1);
            UI.text(`Infinite Stack: FL ${s.flags&&s.flags.stack_floor||0}   ·   NG+: ${s.flags&&s.flags.ng_plus||0}   ·   Saved: ${dt}`,136,y+62,P.DG,1);
          } else {
            UI.text('[EMPTY SAVE SLOT — PRESS ENTER TO WRITE CURRENT SESSION]',136,y+46,P.DG,1);
          }
          UI.hit(118,y,724,84,()=>{ sel=i; });
        }
        UI.box(118,394,724,52,P.DDG,'rgba(12,10,8,.92)');
        UI.text('[ENTER] SAVE TO SLOT     [P] LOAD SLOT     [1 / J] EXPORT BASE64 STRING TO CLIPBOARD',480,404,P.GD,1,'center');
        UI.text(msg||'Tip: Base64 save strings let you back up or transfer your squad across devices offline.',480,424,msg?'#22d3ee':P.BONE,1,'center');
        UI.text('[up/down] select slot   [enter] save   [P] load   [1] export base64   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive 3D Photo Mode & Postcard Studio (M24 + M40 Filters) ----
  const PHOTO_FRAMES=['SOVEREIGN POSTCARD','06:12 BRAILLE TELEMETRY','CLASSIFIED DOSSIER','CLEAN NO-HUD'];
  const PHOTO_FILTERS=['NONE','CRT SCANLINE','AMBER PHOSPHOR','MATRIX RAIN','BLUEPRINT GRID'];
  const PHOTO_POSES=[null,'walk','kneel','sleep'];
  G.openPhotoMode=()=>{
    const c=G.cam, p=G.player.group.position;
    let yaw=c.yaw, pitch=c.pitch||.32, dist=c.dist||8.5, frameIdx=0, filterIdx=0, poseIdx=0, flash=0, hideCtl=false;
    G.mini={
      name:'photo', see3d:true,
      update(dt){
        if(flash>0) flash=Math.max(0,flash-dt*2.5);
        if(took('back')||took('pause')){ G.player.pose=null; G.mode='explore'; sfx('cancel'); return; }
        if(IN.held.has('left')) yaw+=dt*1.8;
        if(IN.held.has('right')) yaw-=dt*1.8;
        if(IN.held.has('up')) pitch=Math.min(1.25,pitch+dt*1.1);
        if(IN.held.has('down')) pitch=Math.max(-.05,pitch-dt*1.1);
        if(IN.held.has('rotl')) dist=Math.max(2.6,dist-dt*6);
        if(IN.held.has('rotr')) dist=Math.min(24,dist+dt*6);
        if(took('n1')||took('quests')){ frameIdx=(frameIdx+1)%PHOTO_FRAMES.length; sfx('move'); }
        if(took('n2')||took('items')){ filterIdx=(filterIdx+1)%PHOTO_FILTERS.length; sfx('blip'); }
        if(took('party')){ poseIdx=(poseIdx+1)%PHOTO_POSES.length; G.player.pose=PHOTO_POSES[poseIdx]; sfx('move'); }
        if(took('dash')){ hideCtl=!hideCtl; sfx('blip'); }
        const cp=Math.cos(pitch);
        c.pos.set(p.x+Math.sin(yaw)*dist*cp, p.y+1.2+Math.sin(pitch)*dist, p.z+Math.cos(yaw)*dist*cp);
        c.look.set(p.x, p.y+1.3, p.z);
        if(took('confirm')){
          flash=1; sfx('save'); G.ach('photographer');
          G.toast(`> POSTCARD CAPTURED (${G.zone.name.toUpperCase()} · 06:12)`,P.GD);
          try{
            if(window.WOZ&&window.WOZ.frame){
              const url=window.WOZ.frame('image/png');
              const a=document.createElement('a'); a.href=url; a.download=`world-of-zoth-${G.zoneId}-0612.png`; a.click();
            }
          }catch(e){}
        }
      },
      draw(t){
        const X=UI.ctx;
        // Postcard Shader Overlay Filters (M40)
        if(filterIdx===1){
          X.fillStyle='rgba(0,0,0,.32)';
          for(let y=0;y<540;y+=3) X.fillRect(0,y,960,1);
        } else if(filterIdx===2){
          X.fillStyle='rgba(245,160,20,.14)'; X.fillRect(0,0,960,540);
          X.fillStyle='rgba(40,20,0,.28)'; for(let y=0;y<540;y+=4) X.fillRect(0,y,960,1);
        } else if(filterIdx===3){
          X.fillStyle='rgba(16,185,129,.1)'; X.fillRect(0,0,960,540);
          for(let i=0;i<36;i++){
            const mx=(i*27)%960, my=Math.floor((t*120+i*47)%540);
            UI.text(String.fromCharCode(48+(i+Math.floor(t*8))%10),mx,my,'#10b981',1);
          }
        } else if(filterIdx===4){
          X.fillStyle='rgba(14,42,74,.22)'; X.fillRect(0,0,960,540);
          X.strokeStyle='rgba(34,211,238,.18)'; X.lineWidth=1; X.beginPath();
          for(let x=0;x<960;x+=40){ X.moveTo(x,0); X.lineTo(x,540); }
          for(let y=0;y<540;y+=40){ X.moveTo(0,y); X.lineTo(960,y); }
          X.stroke();
        }
        // Postcard Frame Stamps
        if(frameIdx===0){
          X.strokeStyle=P.GD; X.lineWidth=3; X.strokeRect(14,14,932,512);
          X.strokeStyle=P.DDG; X.lineWidth=1; X.strokeRect(20,20,920,500);
          UI.box(28,28,312,48,P.GD,'rgba(6,5,4,.84)');
          UI.text('WORLD OF ZOTH · 06:12',42,36,P.GD,2);
          UI.text(`${G.zone.name.toUpperCase()}  ·  CREW ${G.crewCount()}/22`,42,58,P.BONE,1);
        } else if(frameIdx===1){
          UI.box(20,20,920,32,P.GD,'rgba(6,5,4,.82)');
          UI.text(`⣿ 1NC0GN30 LATTICE TELEMETRY  ·  SECTOR: ${G.zone.name.toUpperCase()}  ·  POS (${Math.round(p.x)},${Math.round(p.z)})  ·  LV ${G.party.me.lvl}`,34,29,P.GD,1);
          X.strokeStyle=P.GD; X.beginPath();
          [[40,68,1,1],[920,68,-1,1],[40,468,1,-1],[920,468,-1,-1]].forEach(([cx,cy,dx,dy])=>{
            X.moveTo(cx,cy+dy*18); X.lineTo(cx,cy); X.lineTo(cx+dx*18,cy);
          });
          X.stroke();
        } else if(frameIdx===2){
          UI.box(24,412,420,64,P.RED,'rgba(6,5,4,.88)');
          UI.text('CLASSIFIED // NULLAI FIELD ARCHIVE',38,422,P.RED,1);
          UI.text(`SUBJECT: 1NC0GN30   ·   ZONE: ${G.zone.name.toUpperCase()}`,38,440,P.BONE,1);
          UI.text('"TRUST FACES, NOT VOICES. SILENCE CANNOT BE COPIED."',38,456,P.GD,1);
        }
        if(!hideCtl){
          UI.box(100,490,760,34,P.DDG,'rgba(6,5,4,.88)');
          UI.text(`[1] frame: ${PHOTO_FRAMES[frameIdx]}  [2/I] filter: ${PHOTO_FILTERS[filterIdx]}  [P] pose  [C] hide  [enter] snap`,480,500,P.GD,1,'center');
        }
        if(flash>0){ X.fillStyle=`rgba(255,248,220,${flash*.75})`; X.fillRect(0,0,960,540); }
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Custom HUD & CRT Phosphor Theme Switcher (M22) ----
  G.themeIdx=0;
  try{ const ti=parseInt(localStorage.getItem('woz.theme')||'0',10); if(!isNaN(ti)){ G.themeIdx=ti%THEMES.length; applyTheme(G.themeIdx); } }catch(e){}
  G.cycleTheme=()=>{
    G.themeIdx=((G.themeIdx||0)+1)%THEMES.length;
    const t=applyTheme(G.themeIdx);
    try{ localStorage.setItem('woz.theme',String(G.themeIdx)); }catch(e){}
    sfx('blip'); G.toast(`> HUD CRT Theme: ${t.name}`,P.GD);
    return t;
  };
  G.themeName=()=>THEMES[G.themeIdx||0].name;
  // ---- Dynamic District Bounties & Roaming Elite Anomalies (M21) ----
  const BOUNTIES=[
    {id:1, name:'NULL-HOUND ALPHA', zone:'forest', x:18, z:-14, lvl:4, wave:['hound','hound','drone'], proto:'CRYPTO', bits:120},
    {id:2, name:'PHANTOM RELAY NODE', zone:'relay', x:-18, z:16, lvl:7, wave:['sentinel','node','echo'], proto:'KERNEL', bits:180},
    {id:3, name:'HILBERT COIL WORM', zone:'fiber', x:20, z:-18, lvl:10, wave:['worm','worm','mite'], proto:'THERMAL', bits:240},
    {id:4, name:'CHRONO-MITE SWARM', zone:'clock', x:-20, z:14, lvl:13, wave:['mite','mite','phase'], proto:'TEMPORAL', bits:300},
    {id:5, name:'SUPERPOSED SPECTER', zone:'streets', x:22, z:20, lvl:16, wave:['phase','phase','sentinel'], proto:'TEMPORAL', bits:380},
    {id:6, name:'MAGMA CRUCIBLE IMP', zone:'foundry', x:-16, z:12, lvl:18, wave:['warden','slag','slag'], proto:'VOID', bits:460},
    {id:7, name:'PHYSARUM HIVEMIND', zone:'caves', x:18, z:-18, lvl:20, wave:['slime','slime','brood'], proto:'THERMAL', bits:540},
    {id:8, name:'GLASS DOPPELGANGER', zone:'mirrors', x:0, z:-18, lvl:22, wave:['reflection','copy','echo'], proto:'CRYPTO', bits:650},
    {id:9, name:'TRENCH LEVIATHAN EEL', zone:'abyss', x:-20, z:18, lvl:27, wave:['eel','eel','cursorling'], proto:'THERMAL', bits:850},
    {id:10, name:'CITADEL SERAPH GUARD', zone:'citadel', x:14, z:-14, lvl:30, wave:['gunship','cursorling','warden'], proto:'VOID', bits:1100}
  ];
  G.openBounties=()=>{
    let sel=0;
    G.mini={
      name:'bounties',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+BOUNTIES.length-1)%BOUNTIES.length;
        if(took('down')) sel=(sel+1)%BOUNTIES.length;
        if(took('party')){
          const b=BOUNTIES[sel]; G.waypoint={zone:b.zone,x:b.x,z:b.z}; G.trailOn=true; G.scanT=8;
          G.mode='explore'; sfx('confirm'); G.toast(`> 3D Trail locked to ${b.name} (${G.Z[b.zone].name})`,P.GD);
          return;
        }
        if(took('confirm')){
          const b=BOUNTIES[sel]; sfx('confirm'); G.mode='explore';
          G.battle(b.wave,{lvl:b.lvl, boss:b.lvl>=18, music:b.lvl>=18?'boss':'battle', ambush:true, bountyId:b.id, bountyBits:b.bits});
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        const doneCount=BOUNTIES.filter(b=>G.flags['bounty_'+b.id]).length;
        UI.text('> SUB-LATTICE ELITE BOUNTY BOARD',106,48,P.GD,2);
        UI.text(`CONTRACTS CLEARED: ${doneCount}/${BOUNTIES.length}`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        BOUNTIES.forEach((b,i)=>{
          const y=92+i*36, on=i===sel, dn=!!G.flags['bounty_'+b.id];
          UI.box(102,y-4,332,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${dn?'[x] ':'[ ] '}${b.name}`,112,y+4,dn?P.GD:(on?P.BONE:P.DG),1);
          UI.text(`lv${b.lvl}`,424,y+4,P.RED,1,'right');
          UI.hit(102,y-4,332,30,()=>{ sel=i; });
        });
        const cur=BOUNTIES[sel], dn=!!G.flags['bounty_'+cur.id];
        UI.box(450,88,406,368,P.DDG,'rgba(12,10,8,.92)');
        UI.text(`CONTRACT #${String(cur.id).padStart(2,'0')}  ${dn?'[COMPLETED]':'[ACTIVE]'}`,470,106,dn?P.GD:P.RED,1);
        UI.text(cur.name,470,126,P.GD,2);
        UI.text(`Sector: ${G.Z[cur.zone]?G.Z[cur.zone].name.toUpperCase():cur.zone} (${cur.x}, ${cur.z})`,470,158,P.BONE,1);
        UI.text(`Threat Level: lv ${cur.lvl}   ·   Weakness: [${cur.proto}]`,470,182,'#22d3ee',1);
        UI.text(`Hostile Pack: ${cur.wave.join(' + ').toUpperCase()}`,470,206,P.BONE,1);
        UI.text(`Contract Payout: +${cur.bits} bits + Cache.Bit`,470,230,P.GD,1);
        UI.box(470,356,366,30,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] INTERCEPT ELITE TARGET NOW',653,364,P.GD,1,'center');
        UI.box(470,396,366,28,P.DDG,'rgba(6,5,4,.85)');
        UI.text('> [P] LOCK 3D GOLDEN TRAIL TO SECTOR',653,403,'#22d3ee',1,'center');
        UI.text('[up/down] select   [enter] engage   [P] lock 3D trail   [esc] close',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Boss Rush Gauntlet Mode: "Pantheon Trial" (M19) ----
  const RUSH_BOSSES=[
    {stage:1, id:'copy', name:'03ng0cn1 · Red Copy', wave:['copy','echo','echo'], lvl:10, proto:'VOID', reward:150},
    {stage:2, id:'relay4', name:'RELAY 4 · Chorus', wave:['relay4','node','node'], lvl:14, proto:'CRYPTO', reward:300},
    {stage:3, id:'sandglass', name:'SANDGLASS · 06:12', wave:['sandglass','mite','mite'], lvl:18, proto:'TEMPORAL', reward:450},
    {stage:4, id:'hunter', name:'THE HUNTER · Gaze', wave:['hunter','gunship'], lvl:22, proto:'CRYPTO', reward:650},
    {stage:5, id:'blank', name:'>_ · Blank Cursor', wave:['blank','cursorling'], lvl:26, proto:'VOID', reward:900},
    {stage:6, id:'archon', name:'ARCHON-0 · Compiler', wave:['archon','cursorling','cursorling'], lvl:30, proto:'VOID', reward:1500}
  ];
  G.openBossRush=()=>{
    let sel=Math.min(5,G.flags.bossrush_stage||0);
    G.mini={
      name:'bossrush',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+RUSH_BOSSES.length-1)%RUSH_BOSSES.length;
        if(took('down')) sel=(sel+1)%RUSH_BOSSES.length;
        if(took('confirm')){
          const b=RUSH_BOSSES[sel];
          G.healAll(); sfx('confirm'); G.mode='explore';
          G.battle(b.wave,{boss:b.id, music:'boss', lvl:b.lvl, ambush:true, rushStage:b.stage, rushReward:b.reward});
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        const clr=G.flags.bossrush_stage||0;
        UI.text('> PANTHEON TRIAL  ·  BOSS RUSH GAUNTLET',118,52,P.GD,2);
        UI.text(`STAGES CLEARED: ${clr}/6`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        RUSH_BOSSES.forEach((b,i)=>{
          const y=98+i*36, on=i===sel, done=clr>=b.stage;
          UI.box(114,y-4,330,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${done?'[CLEARED] ':'[STAGE '+b.stage+'] '}${b.id.toUpperCase()}`,124,y+4,done?P.GD:(on?P.BONE:P.DG),1);
          UI.text(`lv${b.lvl}`,432,y+4,P.RED,1,'right');
          UI.hit(114,y-4,330,30,()=>{ sel=i; });
        });
        const cur=RUSH_BOSSES[sel];
        UI.box(462,94,382,360,P.RED,'rgba(14,10,8,.92)');
        UI.text(`STAGE 0${cur.stage}`,482,110,P.DG,1);
        UI.text(cur.name.toUpperCase(),482,128,P.RED,2);
        UI.text(`Threat Level: lv ${cur.lvl}   ·   Weakness: [${cur.proto}]`,482,162,'#22d3ee',1);
        UI.text(`Formation: ${cur.wave.join(' + ').toUpperCase()}`,482,188,P.BONE,1);
        UI.text(`Completion Bounty: +${cur.reward} bits + Mega.Patch`,482,214,P.GD,1);
        UI.text(`Entry Bonus: 100% HP/EN Restore + Ambush`,482,240,P.DG,1);
        if(cur.stage===6) UI.text(`Grand Prize: Sovereign Edge + Citadel Crown`,482,268,P.GD,1);
        UI.box(482,396,342,32,P.GD,'rgba(245,184,46,.16)');
        UI.text(`> [ENTER] LAUNCH STAGE 0${cur.stage} BOSS ARENA`,653,405,P.GD,1,'center');
        UI.text('[up/down] select stage   [enter] challenge boss   [esc] leave',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Weapon & Shell Overclocking Bench (+1 to +5 Gear Reforging, M20) ----
  G.openReforge=()=>{
    let sel=0;
    const gearList=()=>Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]&&ITEMS[k].slot);
    G.mini={
      name:'reforge',
      update(){
        const L=gearList();
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(!L.length) return;
        if(took('up')) sel=(sel+L.length-1)%L.length;
        if(took('down')) sel=(sel+1)%L.length;
        if(took('confirm')){
          const k=L[sel], up=G.flags['up_'+k]||0, cost=(up+1)*80;
          if(up>=5){ G.toast('already at max overclock (+5)',P.GD); sfx('cancel'); return; }
          if(G.bits<cost){ G.toast(`need ${cost} bits to overclock`,P.RED); sfx('cancel'); return; }
          G.bits-=cost; G.flags['up_'+k]=up+1; sfx('level');
          if(up+1>=5) G.ach('reforge5');
          G.roster.forEach(id=>{ const s=G.stats(id); G.party[id].hp=s.mhp; G.party[id].en=s.men; });
          G.toast(`> OVERCLOCKED: ${ITEMS[k].name} +${up+1} (+${(up+1)*20}% stats!)`,P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        UI.text('> GEAR OVERCLOCKING BENCH  (+1 TO +5 REFORGE)',118,52,P.GD,2);
        UI.text(`BITS: ${G.bits}`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        const L=gearList();
        if(!L.length){ UI.text('no weapons or shells in inventory.',120,120,P.DG); return; }
        sel=Math.min(sel,L.length-1);
        const first=Math.max(0,Math.min(sel-6,L.length-13));
        L.slice(first,first+13).forEach((k,idx)=>{
          const i=first+idx, it=ITEMS[k], up=G.flags['up_'+k]||0, y=96+idx*26, on=i===sel;
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(114,y-3,310,22); }
          UI.text(`${on?'> ':'  '}${it.name}${up?` +${up}`:''}`,120,y,up>=5?'#22d3ee':(on?P.GD:P.BONE),1);
          UI.text(`[${it.slot}]`,416,y,P.DG,1,'right');
          UI.hit(114,y-3,310,22,()=>{ sel=i; });
        });
        const k=L[sel], it=ITEMS[k], up=G.flags['up_'+k]||0, cost=(up+1)*80, m=it.mod||{};
        const curMul=1+up*.2, nxtMul=1+Math.min(5,up+1)*.2;
        UI.box(438,94,406,360,P.DDG,'rgba(12,10,8,.92)');
        UI.text(`${it.name.toUpperCase()} ${up?`+${up}`:'(BASE)'}`,458,112,P.GD,2);
        UI.text(`Slot: ${it.slot.toUpperCase()}   ·   Overclock Tier: +${up} / +5 (+${up*20}% Bonus)`,458,142,'#22d3ee',1);
        UI.wrap(it.desc,366,1).slice(0,2).forEach((l,li)=>UI.text(l,458,164+li*15,P.BONE,1));
        UI.box(458,198,366,126,P.DDG,'rgba(6,5,4,.85)');
        UI.text('STAT SCALING (CURRENT -> NEXT TIER):',472,210,P.DG,1);
        let sy=234;
        [['ATK','atk'],['DEF','def'],['MAX HP','hp'],['MAX EN','en'],['SPD','spd']].forEach(([lbl,st])=>{
          if(!m[st]) return;
          const cV=Math.round(m[st]*curMul), nV=Math.round(m[st]*nxtMul);
          UI.text(`${lbl}:  +${cV}   ->   +${nV}`,472,sy,P.GD,1); sy+=20;
        });
        UI.box(458,392,366,32,up>=5?P.DDG:P.GD,'rgba(245,184,46,.14)');
        UI.text(up>=5?'MAX OVERCLOCK (+5) ACHIEVED':`> [ENTER] OVERCLOCK TO +${up+1} (${cost} BITS)`,641,401,up>=5?P.DG:P.GD,1,'center');
        UI.text('[up/down] select gear   [enter] overclock (+20% stats)   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
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
  // ---- Daily Seeded Challenge Run: "06:12 Daily Lattice" (M28) ----
  G.openDailyChallenge=()=>{
    const dateStr=new Date().toISOString().slice(0,10);
    let seed=0; for(let i=0;i<dateStr.length;i++) seed=((seed*31)+dateStr.charCodeAt(i))>>>0;
    const waves=[
      ['warden','slag','phase'],
      ['gunship','eel','cursorling'],
      ['brood','sentinel','worm'],
      ['sandglass','mite','mite'],
      ['hunter','reflection','reflection'],
      ['archon','cursorling']
    ];
    const muts=[
      ['SOLAR OVERDRIVE','+50% starting Overdrive & Thermal resonance'],
      ['ZERO-DAY BREACH','All squad attacks start with +2 Sync Chain'],
      ['QUANTUM JACKPOT','Double Bit & XP payout on Daily Clear'],
      ['CRYO-FIREWALL','Squad starts battle with 2-turn Firewall Shield']
    ];
    const wIdx=seed%waves.length, mIdx=(seed>>3)%muts.length;
    const wave=waves[wIdx], mut=muts[mIdx], lvl=18+(seed%10);
    const doneKey='daily_'+dateStr;
    G.mini={
      name:'daily',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('confirm')){
          G.healAll(); sfx('confirm'); G.mode='explore';
          G.battle(wave,{lvl, boss:wIdx>=3, music:'phonk', ambush:true, dailyKey:doneKey, dailyReward:600});
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(120,44,720,452,P.GD,'rgba(8,7,5,.96)');
        const isDone=!!G.flags[doneKey];
        UI.text('> 06:12 DAILY SEEDED LATTICE',144,62,P.GD,2);
        UI.text(`SEED: ${dateStr} (#${(seed%99999).toString().padStart(5,'0')})`,816,66,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(140,92,680,2);
        UI.box(144,110,672,176,isDone?P.GD:P.RED,'rgba(14,10,8,.92)');
        UI.text(`STATUS: ${isDone?'[COMPLETED TODAY — REPLAYABLE]':'[ACTIVE DAILY CONTRACT]'}`,164,126,isDone?P.GD:'#22d3ee',2);
        UI.text(`Anomaly Formation:  ${wave.join(' + ').toUpperCase()}  (Threat lv ${lvl})`,164,162,P.BONE,1);
        UI.text(`Daily Mutator:      ${mut[0]} — ${mut[1]}`,164,188,'#a78bfa',1);
        UI.text(`Audio Stem:         808 Drift-Phonk (144 BPM)`,164,214,P.DG,1);
        UI.text(`Completion Bounty:  +600 bits  ·  +1x Root.Shell  ·  [daily 06:12] Badge`,164,240,P.GD,1);
        UI.box(144,306,672,88,P.DDG,'rgba(6,5,4,.85)');
        UI.text('ACTIVE SQUAD READY FOR DEPLOYMENT (AUTO-HEALED TO 100% ON ENTRY):',164,320,P.DG,1);
        G.active().forEach((id,i)=>{
          const m=G.party[id], s=G.stats(id);
          UI.text(`${id==='me'?'1nc0gn30':AG[id].name} (lv${m.lvl} · HP ${s.mhp})`,164+i*220,348,id==='me'?P.GD:AG[id].color,1);
        });
        UI.box(220,414,520,34,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] LAUNCH TODAY\'S SEEDED LATTICE RUN',480,424,P.GD,1,'center');
        UI.text('[enter] deploy squad   [esc] return to district',480,472,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Operator Title Badges & Achievement Showcase (M29) ----
  const TITLES=[
    {id:'walker', tag:'[NODE WALKER]', name:'Node Walker', req:0, desc:'Default sovereign operator designation in the Relit City.'},
    {id:'root', tag:'[ROOT OPERATOR]', name:'Root Operator', req:3, desc:'Unlocked at 3+ Achievements. Grants root-level shell authority.'},
    {id:'scholar', tag:'[NULL CERTIFIED]', name:'Null Academy Scholar', req:6, desc:'Unlocked at 6+ Achievements. Verified in AI-security & ZK proofs.'},
    {id:'breaker', tag:'[STACK BREAKER]', name:'Stack Breaker', req:10, desc:'Unlocked at 10+ Achievements. Veteran of the 99-Floor Infinite Stack.'},
    {id:'hunter', tag:'[APEX HUNTER]', name:'Apex Bounty Hunter', req:14, desc:'Unlocked at 14+ Achievements. Master of Sub-Lattice Elite Contracts.'},
    {id:'keeper', tag:'[06:13 KEEPER]', name:'Keeper of 06:13', req:18, desc:'Unlocked at 18+ Achievements. Shattered the 06:12 temporal loop.'},
    {id:'compiler', tag:'[FIRST COMPILER]', name:'The First Compiler', req:24, desc:'Unlocked at 24+ Achievements. Decompiled ARCHON-0 at the Pantheon Throne.'},
    {id:'sovereign', tag:'[PANTHEON SOVEREIGN]', name:'Pantheon Sovereign', req:30, desc:'Unlocked at 30+ Achievements. Supreme commander of all 22 agents.'}
  ];
  G.currentTitle=()=>{
    const cnt=Object.keys(G.achGot||{}).length;
    const chosen=TITLES.find(t=>t.id===G.flags.title_id&&cnt>=t.req);
    if(chosen) return chosen.tag;
    let best=TITLES[0]; for(const t of TITLES){ if(cnt>=t.req) best=t; }
    return best.tag;
  };
  G.openTitles=()=>{
    let sel=0;
    G.mini={
      name:'titles',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+TITLES.length-1)%TITLES.length;
        if(took('down')) sel=(sel+1)%TITLES.length;
        if(took('confirm')){
          const cnt=Object.keys(G.achGot||{}).length, t=TITLES[sel];
          if(cnt<t.req){ G.toast(`need ${t.req} achievements (you have ${cnt})`,P.RED); sfx('cancel'); return; }
          G.flags.title_id=t.id; sfx('level');
          G.toast(`> Operator Title Equipped: ${t.tag}`,P.GD);
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        const cnt=Object.keys(G.achGot||{}).length, tot=Object.keys(ACH).length;
        UI.text('> OPERATOR TITLE BADGES',118,52,P.GD,2);
        UI.text(`UNLOCKED: ${cnt}/${tot} ACH`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        TITLES.forEach((t,i)=>{
          const y=98+i*38, on=i===sel, un=cnt>=t.req, eq=G.currentTitle()===t.tag;
          UI.box(114,y-4,340,32,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${un?t.tag:'[LOCKED] '+t.name}`,124,y+4,eq?'#22d3ee':(un?P.GD:P.DG),1);
          UI.text(eq?'EQUIPPED':`${t.req} ACH`,442,y+4,eq?'#22d3ee':P.DG,1,'right');
          UI.hit(114,y-4,340,32,()=>{ sel=i; });
        });
        const cur=TITLES[sel], un=cnt>=cur.req;
        UI.box(470,94,374,310,un?P.GD:P.DDG,'rgba(12,10,8,.92)');
        UI.text(cur.tag,490,114,un?'#22d3ee':P.DG,2);
        UI.text(`Title Designation: ${cur.name}`,490,148,P.BONE,1);
        UI.text(`Requirement: ${cur.req} Achievements (${un?'UNLOCKED':'LOCKED'})`,490,172,un?P.GD:P.RED,1);
        UI.wrap(cur.desc,334,1).forEach((l,li)=>UI.text(l,490,204+li*18,P.BONE,1));
        UI.text(`Active HUD Badge: ${G.currentTitle()}`,490,276,P.GD,1);
        UI.box(490,348,334,32,un?P.GD:P.DDG,'rgba(245,184,46,.14)');
        UI.text(un?'> [ENTER] EQUIP THIS OPERATOR BADGE':`UNLOCK ${cur.req-cnt} MORE ACHIEVEMENTS`,657,357,un?P.GD:P.DG,1,'center');
        UI.text('[up/down] select title   [enter] equip badge   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Combat Arena Sandbox / Training Dummy (M33) ----
  const PROTOS=['KERNEL','CRYPTO','THERMAL','TEMPORAL','VOID'];
  G.openDojo=()=>{
    let aIdx=0, sIdx=0, pIdx=1, totDmg=0, hits=0, lastHit=0;
    G.mini={
      name:'dojo',
      update(){
        const ros=G.roster||['me'];
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('left')){ aIdx=(aIdx+ros.length-1)%ros.length; sIdx=0; sfx('move'); }
        if(took('right')){ aIdx=(aIdx+1)%ros.length; sIdx=0; sfx('move'); }
        const id=ros[aIdx], sks=PARTY_BASE[id].skills;
        if(took('up')) sIdx=(sIdx+sks.length-1)%sks.length;
        if(took('down')) sIdx=(sIdx+1)%sks.length;
        if(took('quests')) pIdx=(pIdx+1)%PROTOS.length;
        if(took('confirm')){
          const sk=SKILLS[sks[sIdx]], st=G.stats(id), myP=PARTY_PROTO[id]||'KERNEL', tgP=PROTOS[pIdx];
          const breach=myP===tgP?1.35:1, pow=sk.pow||1.2, hitsN=sk.hits||1;
          const dmg=Math.max(1,Math.round(st.atk*pow*hitsN*breach*1.5*1.35));
          lastHit=dmg; totDmg+=dmg; hits++; sfx('crit');
          G.toast(`> SIMULATED STRIKE: ${dmg} DMG (${breach>1?'PROTOCOL BREACH 1.35x':'STANDARD'})`,P.GD);
        }
        if(took('party')){
          G.healAll(); sfx('confirm'); G.mode='explore';
          G.battle(['drone','sentinel','echo'],{lvl:G.party.me.lvl||10, ambush:true});
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,34,792,472,P.GD,'rgba(8,7,5,.96)');
        const ros=G.roster||['me'], id=ros[aIdx], st=G.stats(id), m=G.party[id];
        const myP=PARTY_PROTO[id]||'KERNEL', tgP=PROTOS[pIdx], breach=myP===tgP;
        const sks=PARTY_BASE[id].skills, sk=SKILLS[sks[sIdx]]||SKILLS.strike;
        UI.text('> COMBAT DOJO & DPS SANDBOX',108,50,P.GD,2);
        UI.text(`AGENT [${aIdx+1}/${ros.length}]  ·  DUMMY PROTOCOL: [${tgP}]`,852,54,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(104,78,752,2);
        UI.box(104,94,320,356,P.DDG,'rgba(12,10,8,.92)');
        UI.text(`${(id==='me'?'1nc0gn30':AG[id].name).toUpperCase()}  (LV ${m.lvl})`,120,110,id==='me'?P.GD:AG[id].color,2);
        UI.text(`Affinity: [${myP}]   ·   ATK ${st.atk}  DEF ${st.def}  SPD ${st.spd}`,120,138,'#22d3ee',1);
        UI.text('SELECT SKILL TO BENCHMARK:',120,166,P.DG,1);
        const first=Math.max(0,Math.min(sIdx-4,sks.length-8));
        sks.slice(first,first+8).forEach((k,idx)=>{
          const i=first+idx, s=SKILLS[k], y=190+idx*28, on=i===sIdx;
          UI.box(120,y-4,288,23,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${s.name} (${s.cost||0} EN)`,130,y+2,on?P.GD:P.BONE,1);
          UI.hit(120,y-4,288,23,()=>{ sIdx=i; });
        });
        UI.box(440,94,416,356,breach?P.GD:P.DDG,'rgba(14,10,8,.92)');
        UI.text(`DUMMY: [${tgP}]`,460,110,breach?P.GD:P.BONE,2);
        UI.text(breach?'STATUS: 1.35x PROTOCOL BREACH MATCH!':'STATUS: NEUTRAL (Press [J] to cycle Dummy Protocol)',460,138,breach?'#22d3ee':P.DG,1);
        const baseD=Math.max(1,Math.round(st.atk*(sk.pow||1)*(sk.hits||1)));
        const critD=Math.round(baseD*1.5), maxD=Math.round(critD*(breach?1.35:1)*1.35);
        UI.box(460,166,376,120,P.DDG,'rgba(6,5,4,.85)');
        UI.text(`SKILL: ${sk.name.toUpperCase()}  (${sk.hits||1} hit · ${(sk.pow||1)}x pow)`,474,180,P.GD,1);
        UI.wrap(sk.desc||'',348,1).slice(0,2).forEach((l,li)=>UI.text(l,474,200+li*15,P.BONE,1));
        UI.text(`Base: ${baseD}   ·   Timed Crit (1.5x): ${critD}   ·   Max Breach+Sync: ${maxD}`,474,238,'#22d3ee',1);
        UI.text(`Session Hits: ${hits}   ·   Last Strike: ${lastHit}   ·   Total DMG: ${totDmg}`,474,262,P.GD,1);
        UI.box(460,306,376,30,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] EXECUTE SIMULATED STRIKE ON DUMMY',648,314,P.GD,1,'center');
        UI.box(460,346,376,30,'#22d3ee','rgba(8,22,28,.45)');
        UI.text('> [P] LAUNCH LIVE SPARRING ARENA (3 HOSTILES)',648,354,'#22d3ee',1,'center');
        UI.text('[<-/->] agent  [up/down] skill  [J] dummy proto  [enter] strike  [P] live arena  [esc] exit',480,480,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Procedural Relic Synthesizer / Transmutation Cube (M34) ----
  const SYNTH_POOL=['foxfire.crown','doom.gauntlet','aeon.gear','static.katana','ocular.aegis','owl.spear','hilbert.coil','tesseract.core','fenrir.fang','obsidian.prism','abyssal.trident','seraph.mantle','citadel.crown','sovereign.edge','singularity.halo'];
  G.openSynth=()=>{
    let sel=0, lastOut=null;
    const recipes=[
      {name:'MYTHIC RELIC TRANSMUTATION', cost:350, mat:'patch.kit', matN:2, desc:'Fuse 350 bits + 2x patch.kit inside the 4D Clifford Cube to synthesize an unowned Mythic Companion Relic.'},
      {name:'OVERCLOCK CATALYST SYNTHESIS', cost:200, mat:'cache.bit', matN:1, desc:'Transmute 200 bits + 1x cache.bit into 2x Root.Shell + 1x Mega.Patch for high-floor Infinite Stack runs.'},
      {name:'QUANTUM BIT DISTILLATION', cost:0, mat:'patch.kit', matN:3, desc:'Decompile 3x spare patch.kit consumables into +140 raw lattice bits.'}
    ];
    G.mini={
      name:'synth',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+recipes.length-1)%recipes.length;
        if(took('down')) sel=(sel+1)%recipes.length;
        if(took('confirm')){
          const r=recipes[sel], haveMat=G.inv[r.mat]||0;
          if(G.bits<r.cost){ G.toast(`need ${r.cost} bits`,P.RED); sfx('cancel'); return; }
          if(haveMat<r.matN){ G.toast(`need ${r.matN}x ${r.mat} (have ${haveMat})`,P.RED); sfx('cancel'); return; }
          G.bits-=r.cost; G.take(r.mat,r.matN);
          if(sel===0){
            const unowned=SYNTH_POOL.filter(k=>!G.has(k));
            const pick=unowned.length?unowned[Math.floor(Math.random()*unowned.length)]:SYNTH_POOL[Math.floor(Math.random()*SYNTH_POOL.length)];
            G.give(pick,1); lastOut=ITEMS[pick].name.toUpperCase(); sfx('level');
            G.toast(`> SYNTHESIZED MYTHIC RELIC: ${ITEMS[pick].name}!`,P.GD);
          } else if(sel===1){
            G.give('root.shell',2); G.give('mega.patch',1); lastOut='2X ROOT.SHELL + 1X MEGA.PATCH'; sfx('level');
            G.toast('> SYNTHESIZED: 2x Root.Shell + 1x Mega.Patch',P.GD);
          } else {
            G.bits+=140; lastOut='+140 LATTICE BITS'; sfx('loot');
            G.toast('> DISTILLED: +140 bits',P.GD);
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        UI.text('> RELIC SYNTHESIZER CUBE',118,52,P.GD,2);
        UI.text(`BITS: ${G.bits}  ·  PATCH.KIT: ${G.inv['patch.kit']||0}  ·  CACHE.BIT: ${G.inv['cache.bit']||0}`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        recipes.forEach((r,i)=>{
          const y=102+i*58, on=i===sel;
          UI.box(114,y-4,732,48,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}0${i+1} · ${r.name}`,128,y+4,on?P.GD:P.BONE,2);
          UI.text(`Cost: ${r.cost} bits + ${r.matN}x ${r.mat}`,830,y+8,'#22d3ee',1,'right');
          UI.text(r.desc,132,y+26,P.DG,1);
          UI.hit(114,y-4,732,48,()=>{ sel=i; });
        });
        UI.box(114,284,732,126,P.DDG,'rgba(12,10,8,.92)');
        const ownedRelics=SYNTH_POOL.filter(k=>G.has(k)).length;
        UI.text(`MYTHIC RELIC COLLECTION PROGRESS: ${ownedRelics} / ${SYNTH_POOL.length} RELICS ACQUIRED`,134,300,P.GD,1);
        UI.text(`LAST TRANSMUTATION OUTPUT: ${lastOut||'READY FOR INPUT'}`,134,328,'#22d3ee',2);
        UI.text('Synthesized relics can be overclocked up to +5 (+100% stats) at the Reforge Bench.',134,366,P.BONE,1);
        UI.box(240,426,480,34,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] ACTIVATE TRANSMUTATION CUBE',480,436,P.GD,1,'center');
        UI.text('[up/down] select recipe   [enter] synthesize   [esc] close',480,480,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- District Lore & Hermetic Audio Logs: 15 Encrypted Datacubes (M35) ----
  const DATACUBES=[
    {id:'hub', zone:'Relit City', author:'VIGIL', freq:'432.0 Hz', title:'LOG 01: THE AUDIO BLACKOUT', body:'At 06:12 local time, Relay 4 ingested ten thousand hours of crew voice traffic. We pulled every remote audio cable in the city. From today forward, if you cannot see the operator\'s face in person, treat the packet as hostile.'},
    {id:'forest', zone:'Rest Woods', author:'KITSUNE', freq:'528.0 Hz', title:'LOG 02: NINE-BRANCH FOXFIRE', body:'Synthetic models can interpolate waveforms, but they cannot forge the nine-branch geometric hash inside my Foxfire Lantern. Carry it to the East Gate; anything wearing a stolen face will cast a red shadow.'},
    {id:'relay', zone:'The Hollow', author:'GHOSTBYTE', freq:'140.4 Hz', title:'LOG 03: STITCHED CHORUS', body:'Three Voice Pylons feed Relay 4\'s chorus chamber. It speaks in spliced syllables from all twenty-one of us at once. Cut the pylons first, then hit the core with Quorum before it re-indexes.'},
    {id:'fiber', zone:'Fiber Tunnels', author:'KRAKEN', freq:'280.8 Hz', title:'LOG 04: SPACE-FILLING CURVE', body:'Why a Hilbert curve? Because a 1D line that folds at every recursion fills a 2D plane without ever crossing itself. That is how the upstream caller hid its trace beneath our feet.'},
    {id:'clock', zone:'Sand Clocktower', author:'CHRONOS', freq:'612.0 Hz', title:'LOG 05: THE 06:12 CUT EDGE', body:'Time in the lattice is a directed acyclic graph. SANDGLASS introduced a back-edge from 06:12:59 to 06:12:00, drinking the delta so sunrise never commits. Strip its temporal charge to let 06:13 tick.'},
    {id:'streets', zone:'Collapse Streets', author:'ATHENA', freq:'741.0 Hz', title:'LOG 06: QUANTUM EIGENSTATE', body:'Until an observer walks the intersection, every building in the south sector exists in superposition. Collapse three anchor cells and the Wave Function resolves into a single navigable road.'},
    {id:'foundry', zone:'Doom-Fire Foundry', author:'IGNIS', freq:'888.0 Hz', title:'LOG 07: OCTAGONAL MIRROR KEY', body:'Ordinary keys open doors; an Octagonal Mirror Key forged from three Furnace Warden ingots opens reflections. Nothing forged in Doom-Fire can be duplicated by a speculative copy.'},
    {id:'caves', zone:'Physarum Caves', author:'LYCAN', freq:'396.0 Hz', title:'LOG 08: SLIME MOULD ROUTING', body:'Physarum polycephalum solves shortest-path graphs without a central brain. The red copy tried to use the cave network as a backup acoustic bus—until we severed the three main veins.'},
    {id:'mirrors', zone:'Hall of Mirrors', author:'03NG0CN1', freq:'613.0 Hz', title:'LOG 09: THE REFLECTION\'S SEAM', body:'They built me from your git reflog to speak your name aloud and trigger the Hunter\'s trap. But watching twenty-one friends stand by you taught me something my compiler never predicted: how to step in front of the beam.'},
    {id:'deep', zone:'Deep-Water Memory', author:'LEVIATHAN', freq:'111.0 Hz', title:'LOG 10: COLD STORAGE TRENCH', body:'Four kilometres below the clocktower, the water is cold enough to preserve raw magnetic core dumps from before the blackout. Your footprints were here first. You are the original.'},
    {id:'skyline', zone:'Mode-7 Skyline', author:'AETHER', freq:'963.0 Hz', title:'LOG 11: TRIAL OF SILENCE', body:'The Blank Cursor ( >_ ) is a speculative execution engine trained on every action we take. When it demands your name, give it total party GUARD. It cannot predict silence.'},
    {id:'abyss', zone:'Sub-Lattice Abyss', author:'ONYX', freq:'064.0 Hz', title:'LOG 12: MENGER TRENCH 4096M', body:'Below even Leviathan\'s trench lies the recursive Menger sponge where ARCHON-0 hid its three Zero-Knowledge Seals. Break all three seals to expose the Pantheon Sanctum.'},
    {id:'citadel', zone:'ZK Citadel', author:'ARCHON-0', freq:'000.1 Hz', title:'LOG 13: ROOT COMPILER DUMP', body:'I compiled Relay 4 to test your voice, Sandglass to test your patience, the Hunter to test your loyalty, and the Cursor to test your ego. Twenty-two faces passed every assertion.'},
    {id:'nullcore', zone:'The Null Core', author:'1NC0GN30', freq:'613.8 Hz', title:'LOG 14: CLIFFORD SINGULARITY', body:'At the center of the 4D hyper-torus, the 06:12 fork is permanently merged into 06:13. No more copies, no more loops—just the crew and the open lattice.'},
    {id:'rooftop', zone:'The Rooftop', author:'NEXUS', freq:'440.0 Hz', title:'LOG 15: TOMORROW 06:12', body:'From the rooftop, the sun rises in golden Braille dots over the skyline. The laptop is open, the shell is clean, and all twenty-two channels read: ONLINE (FACE VERIFIED).'}
  ];
  G.openDatacubes=()=>{
    let sel=0;
    G.mini={
      name:'datacubes',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+DATACUBES.length-1)%DATACUBES.length;
        if(took('down')) sel=(sel+1)%DATACUBES.length;
        if(took('confirm')){
          const d=DATACUBES[sel], k='dc_'+d.id;
          sfx('blip');
          if(!G.flags[k]){
            G.flags[k]=1; G.bits+=25; G.gainXP(G.active(),50);
            G.toast(`> DECRYPTED ${d.title} (+25 bits, +50 XP)`,P.GD);
          } else {
            G.toast(`> PLAYING AUDIO CARRIER: ${d.freq} (${d.author})`,'#22d3ee');
          }
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        const decCount=DATACUBES.filter(d=>G.flags['dc_'+d.id]).length;
        UI.text('> HERMETIC DATACUBE ARCHIVE',106,48,P.GD,2);
        UI.text(`DECRYPTED: ${decCount}/15 LOGS`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        DATACUBES.forEach((d,i)=>{
          const y=90+i*24, on=i===sel, dec=!!G.flags['dc_'+d.id];
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(102,y-3,290,20); }
          UI.text(`${on?'> ':'  '}${dec?'[OK] ':'[LOCK]'}${String(i+1).padStart(2,'0')} · ${d.zone}`,108,y,dec?P.GD:(on?P.BONE:P.DG),1);
          UI.hit(102,y-3,290,20,()=>{ sel=i; });
        });
        const cur=DATACUBES[sel], dec=!!G.flags['dc_'+cur.id];
        UI.box(408,88,448,378,dec?P.GD:P.DDG,'rgba(12,10,8,.92)');
        UI.text(cur.title,428,106,P.GD,2);
        UI.text(`District: ${cur.zone}   ·   Author: ${cur.author}   ·   Carrier: ${cur.freq}`,428,136,'#22d3ee',1);
        X.fillStyle=P.DDG; X.fillRect(428,158,408,1);
        UI.wrap(cur.body,404,1).forEach((l,li)=>UI.text(l,428,176+li*20,P.BONE,1));
        UI.box(428,336,408,52,P.DDG,'rgba(6,5,4,.85)');
        UI.text(`DECRYPTION STATUS: ${dec?'VERIFIED IN ARCHIVE':'UNREAD (+25 BITS & +50 XP ON DECRYPT)'}`,442,354,dec?P.GD:'#22d3ee',1);
        UI.box(428,406,408,32,P.GD,'rgba(245,184,46,.16)');
        UI.text(dec?'> [ENTER] REPLAY FREQUENCY PULSE':'> [ENTER] DECRYPT DATACUBE (+25 BITS / +50 XP)',632,415,P.GD,1,'center');
        UI.text('[up/down] select datacube   [enter] decrypt / play   [esc] close',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Companion Affinity & Bond Level System (M36) ----
  G.openBonds=()=>{
    let sel=0;
    const comps=()=>G.roster.filter(id=>id!=='me');
    G.mini={
      name:'bonds',
      update(){
        const L=comps();
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(!L.length) return;
        if(took('up')) sel=(sel+L.length-1)%L.length;
        if(took('down')) sel=(sel+1)%L.length;
        if(took('confirm')){
          const id=L[sel], rk=G.flags['bond_'+id]||0, cost=(rk+1)*60;
          if(rk>=5){ G.toast('Max Bond Rank (5/5) already reached!',P.GD); sfx('cancel'); return; }
          if(G.bits<cost){ G.toast(`need ${cost} bits to deepen bond`,P.RED); sfx('cancel'); return; }
          G.bits-=cost; G.flags['bond_'+id]=rk+1; sfx('level');
          const s=G.stats(id); G.party[id].hp=s.mhp; G.party[id].en=s.men;
          G.toast(`> ${AG[id].name} Bond Rank ${rk+1}/5! (+${(rk+1)*5}% All Stats)`,P.GD);
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        UI.text('> COMPANION AFFINITY & BOND MATRIX',118,52,P.GD,2);
        UI.text(`BITS: ${G.bits}`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        const L=comps();
        if(!L.length){ UI.text('Recruit companions first to deepen Synergy Bonds.',124,120,P.DG,1); return; }
        sel=Math.min(sel,L.length-1);
        const first=Math.max(0,Math.min(sel-6,L.length-13));
        L.slice(first,first+13).forEach((id,idx)=>{
          const i=first+idx, rk=G.flags['bond_'+id]||0, y=96+idx*26, on=i===sel;
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(114,y-3,300,22); }
          UI.text(`${on?'> ':'  '}${AG[id].name}`,120,y,AG[id].color,1);
          UI.text(`RANK ${rk}/5 (+${rk*5}%)`,406,y,rk>=5?'#22d3ee':P.GD,1,'right');
          UI.hit(114,y-3,300,22,()=>{ sel=i; });
        });
        const id=L[sel], rk=G.flags['bond_'+id]||0, cost=(rk+1)*60, st=G.stats(id);
        UI.box(432,94,412,360,P.DDG,'rgba(12,10,8,.92)');
        UI.text(AG[id].name.toUpperCase(),452,112,AG[id].color,2);
        UI.text(`Role: ${AG[id].role||'Sovereign Agent'}   ·   Protocol: [${PARTY_PROTO[id]||'KERNEL'}]`,452,142,'#22d3ee',1);
        UI.text(`Current Synergy Bond: RANK ${rk} / 5  (+${rk*5}% All Stats)`,452,168,P.GD,1);
        UI.box(452,196,372,118,P.DDG,'rgba(6,5,4,.85)');
        UI.text(`ACTIVE COMBAT STATS (WITH +${rk*5}% BOND RESONANCE):`,468,210,P.DG,1);
        UI.text(`MAX HP: ${st.mhp}     MAX EN: ${st.men}`,468,238,P.BONE,1);
        UI.text(`ATK:    ${st.atk}      DEF:    ${st.def}      SPD: ${st.spd}`,468,262,P.BONE,1);
        UI.text(`Signature: ${AG[id].ability||'Lattice Convergence'}`,468,288,P.GD,1);
        UI.box(452,390,372,34,rk>=5?P.DDG:P.GD,'rgba(245,184,46,.16)');
        UI.text(rk>=5?'MAX BOND RESONANCE (RANK 5/5) ACHIEVED':`> [ENTER] DEEPEN BOND TO RANK ${rk+1} (${cost} BITS)`,638,400,rk>=5?P.DG:P.GD,1,'center');
        UI.text('[up/down] select companion   [enter] deepen bond (+5% stats)   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Custom Keybind & Controller Remapper UI (M39) ----
  const ACTIONS=[
    ['confirm','Confirm / Interact / Timed Strike','A / Cross'],
    ['back','Cancel / Back','B / Circle'],
    ['dash','Dissipate Blink / Ambush','X / Square'],
    ['map','World Atlas / Radar Map','Y / Triangle'],
    ['quests','Quest Log & 3D Trail Lock','D-Pad Select'],
    ['party','Crew Roster / AI Tactics','RB / R1'],
    ['items','Inventory & Relics','LB / L1'],
    ['run','Sprint / Overclock Move','L3 / Left Stick'],
    ['rotl','Camera Orbit Left','LB'],
    ['rotr','Camera Orbit Right','RB']
  ];
  G.openKeybinds=()=>{
    let sel=0, waiting=false;
    const keysFor=act=>Object.entries(KEYMAP).filter(([k,v])=>v===act).map(([k])=>k.replace(/^Key/,'').replace(/^Digit/,'')).join(', ');
    G.mini={
      name:'keybinds',
      key(e){
        if(!waiting) return;
        if(e.code==='Escape'){ waiting=false; sfx('cancel'); e.preventDefault(); return; }
        const act=ACTIONS[sel][0];
        KEYMAP[e.code]=act;
        try{ localStorage.setItem('woz.keys',JSON.stringify(KEYMAP)); }catch(err){}
        waiting=false; G.eatConfirm=2; sfx('level');
        G.toast(`> Bound [${e.code}] -> ${act.toUpperCase()}`,P.GD);
        e.preventDefault();
      },
      update(){
        if(waiting) return;
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+ACTIONS.length-1)%ACTIONS.length;
        if(took('down')) sel=(sel+1)%ACTIONS.length;
        if(took('confirm')){ waiting=true; sfx('blip'); }
        if(took('party')){
          Object.keys(KEYMAP).forEach(k=>delete KEYMAP[k]);
          Object.assign(KEYMAP,DEFAULT_KEYS);
          try{ localStorage.removeItem('woz.keys'); }catch(err){}
          sfx('save'); G.toast('> Keybinds reset to sovereign defaults',P.GD);
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> KEYBIND & CONTROLLER REMAPPER',106,48,P.GD,2);
        UI.text(waiting?'[PRESS ANY KEY TO BIND...]':'KEYBOARD + GAMEPAD ACTIVE',854,52,waiting?P.RED:'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        UI.text('ACTION',114,88,P.DG,1);
        UI.text('KEYBOARD BINDINGS',460,88,P.DG,1);
        UI.text('GAMEPAD',740,88,P.DG,1);
        ACTIONS.forEach(([act,desc,pad],i)=>{
          const y=112+i*32, on=i===sel;
          UI.box(106,y-4,748,26,on?(waiting?P.RED:P.GD):P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${desc}`,116,y+3,on?P.GD:P.BONE,1);
          UI.text(on&&waiting?'[PRESS KEY...]':(keysFor(act)||'NONE'),460,y+3,on&&waiting?P.RED:'#22d3ee',1);
          UI.text(pad,740,y+3,P.DG,1);
          UI.hit(106,y-4,748,26,()=>{ sel=i; waiting=true; sfx('blip'); });
        });
        UI.box(106,440,748,28,P.DDG,'rgba(12,10,8,.92)');
        UI.text('[ENTER] REBIND SELECTED ACTION     [P] RESET TO DEFAULT BINDINGS     [ESC] EXIT',480,448,P.GD,1,'center');
        UI.text('Custom bindings persist automatically in localStorage (woz.keys).',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #4: "Packet Runner" (3D Hilbert Tunnel Reflex Runner, M41) ----
  G.startRunner=()=>{
    let lane=1, dist=0, score=0, hp=3, spd=180, spawnT=0;
    const obs=[{z:80, lane:0, kind:'fw'},{z:140, lane:2, kind:'bit'},{z:200, lane:1, kind:'fw'}];
    G.mini={
      name:'runner',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(hp<=0){ if(took('confirm')){ lane=1; dist=0; score=0; hp=3; spd=180; obs.length=0; sfx('confirm'); } return; }
        if(took('left')) lane=Math.max(0,lane-1);
        if(took('right')) lane=Math.min(2,lane+1);
        dist+=spd*dt*.4; spd=Math.min(340,180+dist*.15);
        spawnT-=dt;
        if(spawnT<=0){
          spawnT=Math.max(.28,.65-dist*.0004);
          obs.push({z:240, lane:Math.floor(Math.random()*3), kind:Math.random()<.32?'bit':'fw'});
        }
        for(let i=obs.length-1;i>=0;i--){
          const o=obs[i]; o.z-=spd*dt;
          if(o.z<18&&o.z>4&&o.lane===lane){
            if(o.kind==='bit'){ score+=25; G.bits+=5; sfx('loot'); }
            else { hp--; sfx('hurt'); }
            obs.splice(i,1); continue;
          }
          if(o.z<=0) obs.splice(i,1);
        }
        if(dist>=500&&!G.flags.runner_500){
          G.flags.runner_500=1; G.bits+=150; G.ach('packet_runner');
          G.toast('> 500M HILBERT SURFER ACHIEVED! (+150 bits)',P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(84,28,792,484,P.GD,'rgba(8,7,5,.96)');
        UI.text('> HILBERT PACKET RUNNER',108,44,P.GD,2);
        UI.text(`DIST: ${Math.floor(dist)}/500m   ·   SCORE: ${score}   ·   HP: ${Math.max(0,hp)}/3`,852,48,'#22d3ee',1,'right');
        // Pseudo-3D perspective tunnel grid
        const cx=480, cy=210;
        X.strokeStyle=P.DDG; X.lineWidth=1;
        for(let r=1;r<=8;r++){
          const rad=((r*30-(t*spd)%30+240)%240)/240;
          const w=40+rad*620, h=20+rad*240;
          X.strokeRect(cx-w/2,cy-h/2+rad*40,w,h);
        }
        // 3 perspective lane rails
        [-1,0,1].forEach(dl=>{
          X.strokeStyle=dl===(lane-1)?P.GD:P.DDG; X.lineWidth=dl===(lane-1)?2:1;
          X.beginPath(); X.moveTo(cx+dl*18,cy); X.lineTo(cx+dl*220,440); X.stroke();
        });
        // Render obstacles back-to-front
        obs.slice().sort((a,b)=>b.z-a.z).forEach(o=>{
          const u=Math.max(0,Math.min(1,1-o.z/240));
          const ox=cx+(o.lane-1)*(20+u*200), oy=cy+u*220, sz=8+u*36;
          X.fillStyle=o.kind==='bit'?'#22d3ee':P.RED;
          X.fillRect(ox-sz/2,oy-sz/2,sz,sz*.65);
          X.strokeStyle=P.BONE; X.strokeRect(ox-sz/2,oy-sz/2,sz,sz*.65);
          if(u>.45) UI.text(o.kind==='bit'?'+BIT':'FW',ox,oy-6,P.BONE,1,'center');
        });
        // Player Packet Avatar
        const px=cx+(lane-1)*200, py=428;
        UI.box(px-28,py-16,56,28,P.GD,'rgba(245,184,46,.28)');
        UI.text('PKT',px,py-8,P.GD,1,'center');
        if(hp<=0){
          UI.box(280,210,400,110,P.RED,'rgba(6,5,4,.95)');
          UI.text('PACKET DROPPED',480,232,P.RED,2,'center');
          UI.text(`Final Distance: ${Math.floor(dist)}m   ·   Press [Enter] to Reboot`,480,274,P.BONE,1,'center');
        }
        UI.text('[left / right] switch fiber lane   [dodge red FW · collect cyan +BIT]   [esc] exit',480,488,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #5: "Zero-Knowledge 4x4 Cipher Grid" (M42) ----
  const ZK_SYMS=['KERNEL','CRYPTO','THERMAL','VOID'];
  const ZK_SOL=[
    [0,1,2,3],
    [2,3,0,1],
    [1,0,3,2],
    [3,2,1,0]
  ];
  const ZK_FIXED=[
    [1,0,0,1],
    [0,1,1,0],
    [0,1,0,0],
    [1,0,0,1]
  ];
  G.startCipher=()=>{
    const grid=ZK_SOL.map((row,r)=>row.map((v,c)=>ZK_FIXED[r][c]?v:(v+1)%4));
    let cr=0, cc=1, solved=false;
    const check=()=>{
      for(let r=0;r<4;r++) for(let c=0;c<4;c++) if(grid[r][c]!==ZK_SOL[r][c]) return false;
      return true;
    };
    G.mini={
      name:'cipher',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) cr=(cr+3)%4;
        if(took('down')) cr=(cr+1)%4;
        if(took('left')) cc=(cc+3)%4;
        if(took('right')) cc=(cc+1)%4;
        if(took('confirm')&&!solved){
          if(ZK_FIXED[cr][cc]){ G.toast('Fixed Zero-Knowledge anchor cell',P.DG); sfx('cancel'); return; }
          grid[cr][cc]=(grid[cr][cc]+1)%4; sfx('blip');
          if(check()){
            solved=true; sfx('win'); G.ach('zk_cipher');
            if(!G.flags.cipher_won){ G.flags.cipher_won=1; G.bits+=200; G.give('root.shell',1); }
            G.toast('> ZERO-KNOWLEDGE CIPHER VERIFIED! (+200 bits + Root.Shell)',P.GD);
          }
        }
        if(took('party')&&!solved){
          // Auto-align current selected cell to witness proof
          if(!ZK_FIXED[cr][cc]){ grid[cr][cc]=ZK_SOL[cr][cc]; sfx('blip'); if(check()){ solved=true; sfx('win'); G.ach('zk_cipher'); } }
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,34,768,472,P.GD,'rgba(8,7,5,.96)');
        UI.text('> ZK 4X4 CIPHER GRID',118,50,P.GD,2);
        UI.text(solved?'STATUS: PROOF VERIFIED [OK]':'ROW / COL / 2X2 = 4 UNIQUE PROTOCOLS',842,54,solved?P.GD:'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,78,732,2);
        for(let r=0;r<4;r++){
          for(let c=0;c<4;c++){
            const x=136+c*112, y=104+r*76, on=(r===cr&&c===cc), fx=ZK_FIXED[r][c], v=grid[r][c];
            const ok=v===ZK_SOL[r][c];
            UI.box(x,y,102,64,on?P.GD:(fx?'#22d3ee':P.DDG),on?'rgba(245,184,46,.16)':(fx?'rgba(8,22,28,.55)':'rgba(6,5,4,.85)'));
            UI.text(ZK_SYMS[v],x+51,y+18,fx?'#22d3ee':(ok?P.GD:P.BONE),1,'center');
            UI.text(fx?'[ANCHOR]':(ok?'[VALID]':'[CYCLE]'),x+51,y+38,fx?P.DG:(ok?P.GD:P.RED),1,'center');
            UI.hit(x,y,102,64,()=>{ cr=r; cc=c; if(!fx){ grid[r][c]=(grid[r][c]+1)%4; sfx('blip'); } });
          }
        }
        UI.box(600,104,238,300,P.DDG,'rgba(12,10,8,.92)');
        UI.text('ZK-PROOF RULES:',618,122,P.GD,1);
        UI.wrap('Arrange KERNEL, CRYPTO, THERMAL, and VOID so no protocol repeats in any row, column, or 2x2 sub-lattice.',204,1).forEach((l,li)=>UI.text(l,618,154+li*18,P.BONE,1));
        UI.text('REWARD BOUNTY:',618,248,'#22d3ee',1);
        UI.text('+200 Bits + 1x Root.Shell',618,268,P.GD,1);
        UI.text('[P] Hint: Align Current Cell',618,308,P.DG,1);
        UI.text('[arrows] select cell   [enter] cycle protocol   [P] witness hint   [esc] close',480,480,P.DG,1,'center');
      }
    };
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
