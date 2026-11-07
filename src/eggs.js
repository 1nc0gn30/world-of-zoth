// Easter eggs: hidden terminal + commands, Konami code, Game of Life and doom-fire mini-games, the oscilloscope
// handshake, title idle hook, achievements (persist across saves).
import * as UI from './ui.js';
import { P, THEMES, applyTheme } from './pal.js';
import { postU } from './render.js';
import { IN, took, KEYMAP, DEFAULT_KEYS } from './input.js';
import { AG, frameCanvas } from './sprites.js';
import { ENEMIES, MOVES, ITEMS, PARTY_BASE, SKILLS, QUESTS } from './data.js';
import { IDLE } from './content.js';
import { ENEMY_WEAK, PARTY_PROTO, AI_TACTICS } from './battle.js';
import { BLENDER_GEO } from './blender_geo.js';
import { TRACKS, SFX, AU } from './audio.js';
export const ACH={
  forge:['forged','apply a valid ZGL creation'], academy:['null certified','finish every Null Academy lab'], lab_prompt:['prompt engineer','lab 01'], lab_halluc:['source check','lab 02'], lab_inject:['data, not orders','lab 03'], lab_jail:['still no','lab 04'], lab_leak:['no secrets in prompts','lab 05'], lab_agent:['least privilege','lab 06'], lab_fake:['faces, not voices','lab 07'], lab_ctf:['capture the flag','lab 08'],
  tutorial:['first light','finish the tutorial'], dissipate:['dissipate','blink through a firewall'],
  first_win:['hello world','win a battle'], lvl10:['root','reach level 10'], lvl20:['kernel','reach level 20'], lvl30:['superuser','reach level 30'],
  boss_copy:['mirror, mirror','beat 03ng0cn1'], boss_relay4:['chorus','beat RELAY 4'], boss_sandglass:['six thirteen','beat SANDGLASS'], boss_hunter:['hunter offline','beat THE HUNTER'], boss_blank:['whoami','beat the cursor'], boss_archon:['the first compiler','beat ARCHON-0'], stack10:['stack overflow','clear floor 10 of The Infinite Stack'], pantheon_trial:['pantheon sovereign','clear all 6 stages of Boss Rush'], reforge5:['overclocked +5','overclock any gear to +5'], bounty10:['apex hunter','clear all 10 district elite bounties'], photographer:['06:12 postcard','capture a snapshot in Photo Mode'], daily_clear:['daily 06:12','complete a Daily Seeded Lattice Run'], packet_runner:['hilbert surfer','reach 500m in Packet Runner'], zk_cipher:['zero-knowledge solver','solve the 4x4 Protocol Cipher Grid'], sig_decoder:['carrier locked','decode all 4 encrypted carrier frequencies'], bio_router:['physarum architect','route all 6 Physarum bio-nodes'], core_defrag:['memory defragmented','defragment all 16 cold-storage memory blocks'], skill_master:['protocol savant','upgrade any skill to Mastery Rank +3'], gate_defender:['east gate sentinel','intercept 20 hostile packets in Firewall Defender'], pantheon_raider:['pantheon raider','complete a 3-wave Pantheon Survival Raid'], wave_collapse:['eigenstate locked','collapse the 5x5 quantum superposition manifold'], banner_forged:['call-sign sovereign','customize your operator call-sign & HUD banner'], harmonic_chord:['harmonic chord','lock a 5x5 Protocol Resonance Chord'], laser_router:['optical engineer','route the fiber-optic laser through all 3 nodes to RX'], loadout_master:['tactical quartermaster','auto-optimize or save a squad gear loadout preset'], arcade_king:['arcade sovereign','boot the 11-cabinet Safehouse Arcade Hub'], move_analyst:['intent analyst','analyze hostile AI move telegraphs in the MoveDex'],
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
    if(e.code==='Tab'&&G.mode==='explore'){ G.openQuickWheel(); e.preventDefault(); return; }
    if(G.mode==='terminal') termKey(e); if(G.mode==='mini'&&G.mini.key) G.mini.key(e); });
  G.konami=()=>{ if(G.isFlag('konami')){ G.toast('> cheat detected. still no.',P.DG); return; } G.flag('konami'); G.bits+=99; G.give('root.shell',3); G.toast('> up up down down left right left right b a',P.GD); G.glitch(.8); G.ach('konami'); };
  // ---- hidden terminal ----
  const T=G.term={lines:[],buf:'',t:0};
  G.openTerminal=(intro=true)=>{ G.mode='terminal'; T.lines=intro?[['> hidden shell. type help.',P.GD]]:T.lines; T.buf=''; T.t=0; G.ach('terminal'); sfx('confirm'); };
  const out=(s,c=P.BONE)=>{ T.lines.push([s,c]); if(T.lines.length>13) T.lines.shift(); };
  function termKey(e){ if(e.key==='Escape'){ G.closeTerm=1; return; } if(e.key==='Enter'){ run(T.buf.trim().toLowerCase()); T.buf=''; G.eatConfirm=2; e.preventDefault(); return; }
    if(e.key==='Backspace'){ T.buf=T.buf.slice(0,-1); e.preventDefault(); return; } if(e.key.length===1&&T.buf.length<40){ T.buf+=e.key; sfx('talk'); e.preventDefault(); } }
  function run(c){ out('> '+c,P.GD); if(!c) return;
    if(c==='help') out('nmap  ping  patch  arcade  movedex  lasers  loadouts  resonance  collapse  banner  timeline  raid  defender  soundboard  meshes  mastery  wheel  defrag  singularity  ledger  combos  router  market  bosslab  shaders  composer  museum  weather  formation  decoder  dossiers  splits  daily  dojo  synth  logs  bonds  keys  runner  cipher  titles  bounty  stack  bossrush  reforge  bestiary  photo  saves  theme  warp  exit');
    else if(c==='arcade'||c==='cabinets'||c==='games'){ out('[arcade] opening 11-Cabinet Safehouse Arcade Hub...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openArcade(); },40); }
    else if(c==='movedex'||c==='intents'||c==='moves'){ out('[movedex] opening Hostile AI Behavior & Intent Inspector...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openMoveDex(); },40); }
    else if(c==='lasers'||c==='mirror'||c==='optics'){ out('[lasers] launching 6x6 Fiber-Optic Laser Mirror Router...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startLasers(); },40); }
    else if(c==='loadouts'||c==='presets'||c==='equip'){ out('[loadouts] opening Companion Gear Loadout Presets & Optimizer...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openLoadouts(); },40); }
    else if(c==='resonance'||c==='protocols'||c==='elements'){ out('[resonance] opening 5x5 Protocol Resonance Matrix...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openResonance(); },40); }
    else if(c==='collapse'||c==='quantum'){ out('[collapse] launching 5x5 Quantum Wave-Collapse Puzzle...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startCollapse(); },40); }
    else if(c==='banner'||c==='callsign'){ out('[banner] opening Operator Call-Sign & HUD Banner Studio...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBannerStudio(); },40); }
    else if(c==='timeline'||c==='lore'||c==='06:12'){ out('[timeline] opening 06:12 Incident Forensic Timeline...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openTimeline(); },40); }
    else if(c==='raid'||c==='survival'||c==='arena'){ out('[raid] opening Endgame Pantheon 3-Wave Survival Raid...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openRaid(); },40); }
    else if(c==='defender'||c==='firewall'){ out('[defender] launching East Gate Firewall Intrusion Defender...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startDefender(); },40); }
    else if(c==='soundboard'||c==='audio'||c==='stems'){ out('[soundboard] opening Sovereign Soundtrack & Voiceprint Studio...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSoundboard(); },40); }
    else if(c==='meshes'||c==='models'||c==='blender'){ out('[meshes] opening 3D Wireframe Model & Mesh Inspector...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openMeshViewer(); },40); }
    else if(c==='mastery'||c==='skills'||c==='loadout'){ out('[mastery] opening Companion Skill Mastery Customizer...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSkillMastery(); },40); }
    else if(c==='wheel'||c==='radial'){ out('[wheel] opening 12-Node Sovereign Command Wheel...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openQuickWheel(); },40); }
    else if(c==='defrag'||c==='memory'){ out('[defrag] launching Memory Trench Core-Dump Defragmenter...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startDefrag(); },40); }
    else if(c==='singularity'||c==='ng+'||c==='ascend'){ out('[singularity] opening 06:14 Sovereign Singularity Ascension...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSingularity(); },40); }
    else if(c==='ledger'||c==='stats'||c==='career'){ out('[ledger] opening Operator Career Telemetry Ledger...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openLedger(); },40); }
    else if(c==='combos'||c==='synergy'){ out('[combos] opening Companion Duo & Overdrive Encyclopedia...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openCombos(); },40); }
    else if(c==='router'||c==='physarum'){ out('[router] launching Physarum Slime Mould Network Router...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startRouter(); },40); }
    else if(c==='market'||c==='blackmarket'){ out('[market] opening Neko Underground Black-Market Exchange...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBlackMarket(); },40); }
    else if(c==='bosslab'||c==='practice'){ out('[bosslab] opening Apex Boss Practice & Phase Lab...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openBossLab(); },40); }
    else if(c==='shaders'||c==='crt'){ out('[shaders] opening Custom CRT Shader & Scanline Studio...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openShaderStudio(); },40); }
    else if(c==='composer'||c==='sequencer'){ out('[composer] opening 8-Bit Chiptune 16-Step Sequencer...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openComposer(); },40); }
    else if(c==='museum'||c==='trophies'){ out('[museum] opening 10-Apex Boss Trophy & Lore Museum...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openMuseum(); },40); }
    else if(c==='weather'||c==='storms'){ out('[weather] opening Lattice Weather Radar & Forecast...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openWeather(); },40); }
    else if(c==='formation'||c==='stances'){ out('[formation] opening Tactical Squad Formation & Row Synergy...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openFormation(); },40); }
    else if(c==='decoder'||c==='morse'){ out('[decoder] launching Signal Frequency Lock & Morse Decoder...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startDecoder(); },40); }
    else if(c==='dossiers'||c==='agents'||c==='crew'){ out('[dossiers] opening 22-Agent Sovereign Dossier Archive...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openDossiers(); },40); }
    else if(c==='splits'||c==='speedrun'){ out('[splits] opening Act I-VI Speedrun Split Tracker...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSplits(); },40); }
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
  // ---- Speedrun Split Tracker (M43) ----
  const SPLITS_DEF=[
    {id:'split_act1', qk:'q3', act:'ACT I: EAST GATE', boss:'03ng0cn1 · Red Copy', gold:180},
    {id:'split_act2', qk:'q4', act:'ACT II: THE HOLLOW', boss:'RELAY 4 · Stitched Chorus', gold:420},
    {id:'split_act3', qk:'q8', act:'ACT III: CLOCKTOWER', boss:'SANDGLASS · 06:12 Loop', gold:780},
    {id:'split_act4', qk:'q14', act:'ACT IV: HALL OF MIRRORS', boss:'THE HUNTER · Gaze', gold:1200},
    {id:'split_act5', qk:'q16', act:'ACT V: MODE-7 SKYLINE', boss:'>_ · Blank Cursor', gold:1650},
    {id:'split_act6', qk:'q20', act:'ACT VI: ZK CITADEL', boss:'ARCHON-0 · First Compiler', gold:2100},
    {id:'split_core', qk:'q21', act:'CODA: THE NULL CORE', boss:'4D Clifford Singularity', gold:2400}
  ];
  const fmtSplit=sec=>{
    if(sec===undefined||sec===null) return '--:--.-';
    const m=Math.floor(sec/60), s=Math.floor(sec%60), d=Math.floor((sec*10)%10);
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}.${d}`;
  };
  G.openSplits=()=>{
    let sel=0;
    G.mini={
      name:'splits',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+SPLITS_DEF.length-1)%SPLITS_DEF.length;
        if(took('down')) sel=(sel+1)%SPLITS_DEF.length;
        if(took('confirm')){
          const sp=SPLITS_DEF[sel];
          if(!G.flags[sp.id]){ G.flags[sp.id]=Math.round((G.t||0)*10)/10; sfx('level'); G.toast(`> Recorded manual split for ${sp.act}`,P.GD); }
          else sfx('blip');
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> SPEEDRUN SPLIT TRACKER',106,48,P.GD,2);
        UI.text(`LIVE RUN TIMER: ${fmtSplit(G.t||0)}   ·   CYCLE: NG+${G.flags.ng_plus||0}`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        UI.text('SEGMENT / ACT',116,88,P.DG,1);
        UI.text('TARGET BOSS',360,88,P.DG,1);
        UI.text('GOLD TARGET',590,88,P.DG,1);
        UI.text('RUN SPLIT',710,88,P.DG,1);
        UI.text('DELTA',844,88,P.DG,1,'right');
        SPLITS_DEF.forEach((sp,i)=>{
          const y=112+i*42, on=i===sel, cur=G.flags[sp.id], done=cur!==undefined||G.qdone_(sp.qk);
          UI.box(106,y-4,748,34,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${sp.act}`,116,y+6,done?P.GD:P.BONE,1);
          UI.text(sp.boss,360,y+6,P.DG,1);
          UI.text(fmtSplit(sp.gold),590,y+6,'#22d3ee',1);
          UI.text(fmtSplit(cur),710,y+6,cur!==undefined?P.GD:P.DG,1);
          let dStr='--'; let dCol=P.DG;
          if(cur!==undefined){
            const diff=cur-sp.gold;
            dStr=(diff<=0?'':'+')+diff.toFixed(1)+'s';
            dCol=diff<=0?'#4ade80':P.RED;
          }
          UI.text(dStr,844,y+6,dCol,1,'right');
          UI.hit(106,y-4,748,34,()=>{ sel=i; });
        });
        UI.box(106,416,748,46,P.DDG,'rgba(12,10,8,.92)');
        UI.text('Splits auto-record the moment each Act capstone quest (q3, q4, q8, q14, q16, q20, q21) completes.',480,432,P.BONE,1,'center');
        UI.text('[up/down] inspect segment   [enter] stamp split   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Complete 22-Agent Dossier Cards UI (M44) ----
  const DOSSIER_IDS=['me','kitsune','ignis','kai','vigil','nexus','kraken','chronos','athena','lycan','onyx','leviathan','aether','ghostbyte','scorpius','draco','mercury','radical-minion','pixel-shiba','pixel-neko','aquila','copy'];
  const AGENT_RELIC={
    me:'sovereign.edge', kitsune:'foxfire.charm', ignis:'slag.coat', kai:'kai.katana', vigil:'vigil.lens',
    nexus:'nexus.cube', kraken:'kraken.coil', chronos:'clock.plate', athena:'athena.aegis', lycan:'lycan.fang',
    onyx:'onyx.prism', leviathan:'leviathan.scale', aether:'aether.halo', ghostbyte:'zk.cloak', scorpius:'zero.sting',
    draco:'draco.crest', mercury:'caduceus.wing', 'radical-minion':'minion.goggles', 'pixel-shiba':'shiba.tag',
    'pixel-neko':'neko.bell', aquila:'aquila.feather', copy:'mirror.shard'
  };
  G.openDossiers=()=>{
    let sel=0;
    G.mini={
      name:'dossiers',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')||took('left')) sel=(sel+DOSSIER_IDS.length-1)%DOSSIER_IDS.length;
        if(took('down')||took('right')) sel=(sel+1)%DOSSIER_IDS.length;
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(72,28,816,484,P.GD,'rgba(8,7,5,.96)');
        UI.text('> 22-AGENT SOVEREIGN DOSSIER ARCHIVE',96,44,P.GD,2);
        UI.text(`CREW RECRUITED: ${G.crewCount()}/22`,866,48,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(92,72,776,2);
        const first=Math.max(0,Math.min(sel-7,DOSSIER_IDS.length-15));
        DOSSIER_IDS.slice(first,first+15).forEach((id,idx)=>{
          const i=first+idx, y=86+idx*24, on=i===sel, rec=G.roster.includes(id)||(id==='copy'&&G.isFlag('copy_crew'));
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(92,y-3,236,20); }
          UI.text(`${on?'> ':'  '}#${String(i+1).padStart(2,'0')} ${(AG[id]&&AG[id].name)||id}`,98,y,rec?(AG[id]?AG[id].color:P.GD):P.DG,1);
          UI.hit(92,y-3,236,20,()=>{ sel=i; });
        });
        const id=DOSSIER_IDS[sel], ag=AG[id]||{}, pb=PARTY_BASE[id]||{hp:60,en:30,atk:10,def:4,spd:6,skills:[]};
        const rec=G.roster.includes(id)||(id==='copy'&&G.isFlag('copy_crew'));
        UI.box(344,86,522,380,ag.color||P.GD,'rgba(12,10,8,.94)');
        // Portrait box with live animated sprite frame
        UI.box(364,106,124,142,ag.color||P.GD,'rgba(6,5,4,.95)');
        UI.ditherRect(368,110,116,134,ag.color||P.GD,.22);
        try{
          const fc=frameCanvas(id,'idle',Math.floor(t*6)%(id==='me'||id==='copy'?1:8));
          X.imageSmoothingEnabled=false;
          if(id==='me'||id==='copy') X.drawImage(fc,364+62-fc.width,106+132-fc.height*2,fc.width*2,fc.height*2);
          else X.drawImage(fc,0,10,96,86,364+62-96,106+136-86*1.8,96*2,86*1.8);
        }catch(e){}
        UI.text(`AGENT #${String(sel+1).padStart(2,'0')} · ${(ag.name||id).toUpperCase()}`,506,108,ag.color||P.GD,2);
        UI.text(`Role: ${ag.role||'Sovereign Lattice Specialist'}`,506,138,P.BONE,1);
        UI.text(`Protocol: [${PARTY_PROTO[id]||'KERNEL'}]   ·   Status: ${rec?'RECRUITED':'AT LARGE'}`,506,160,'#22d3ee',1);
        UI.text(`Signature: ${ag.ability||'Lattice Convergence'}`,506,182,P.GD,1);
        const relKey=AGENT_RELIC[id], relIt=relKey&&ITEMS[relKey];
        UI.text(`Mythic Relic: ${relIt?relIt.name:(relKey||'Sovereign Edge')} ${relKey&&G.has(relKey)?'[OWNED]':''}`,506,204,relKey&&G.has(relKey)?'#4ade80':P.DG,1);
        UI.box(364,262,482,92,P.DDG,'rgba(6,5,4,.85)');
        const st=G.party[id]?G.stats(id):{mhp:pb.hp,men:pb.en,atk:pb.atk,def:pb.def,spd:pb.spd};
        UI.text(`COMBAT TELEMETRY (${G.party[id]?'LIVE LVL '+G.party[id].lvl:'BASE LVL 1'}):`,380,276,P.GD,1);
        UI.text(`HP: ${st.mhp}    EN: ${st.men}    ATK: ${st.atk}    DEF: ${st.def}    SPD: ${st.spd}`,380,300,P.BONE,1);
        const skNames=(pb.skills||[]).slice(0,4).map(k=>SKILLS[k]?SKILLS[k].name:k).join('  ·  ');
        UI.text(`Skills: ${skNames}`,380,324,'#22d3ee',1);
        UI.box(364,368,482,80,P.DDG,'rgba(6,5,4,.85)');
        const quote=IDLE[id]||'If you cannot see my face in person, treat the voice packet as hostile.';
        UI.text('VERIFIED VOICEPRINT QUOTE:',380,382,P.DG,1);
        UI.wrap(`"${quote}"`,450,1).slice(0,2).forEach((l,li)=>UI.text(l,380,404+li*18,P.BONE,1));
        UI.text('[up/down/left/right] browse 22 agents   [esc] close',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #6: "Signal Frequency Lock / Morse Decoder" (M47) ----
  const CARRIERS=[
    {id:1, name:'CHANNEL 01 · RELIT RELAY', freq:432, phase:3, morse:'... --- ... / 06:12 FACE VERIFIED', reward:120},
    {id:2, name:'CHANNEL 02 · SUB-LATTICE', freq:528, phase:5, morse:'-... .-. . .- -.- / THE THREE ZK SEALS', reward:150},
    {id:3, name:'CHANNEL 03 · MIRROR SEAM', freq:613, phase:2, morse:'..--- ..--- / TWENTY TWO FACES ONE ANSWER', reward:180},
    {id:4, name:'CHANNEL 04 · NULL CORE',   freq:963, phase:7, morse:'--- -.- / CLIFFORD SINGULARITY MERGED', reward:250}
  ];
  G.startDecoder=()=>{
    let sel=0, uFreq=400, uPhase=1;
    G.mini={
      name:'decoder',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+CARRIERS.length-1)%CARRIERS.length;
        if(took('down')) sel=(sel+1)%CARRIERS.length;
        if(took('left')) uFreq=Math.max(300,uFreq-12);
        if(took('right')) uFreq=Math.min(1020,uFreq+12);
        if(took('party')){ uPhase=(uPhase%8)+1; sfx('blip'); }
        if(took('confirm')){
          const c=CARRIERS[sel];
          if(Math.abs(uFreq-c.freq)<=18 && uPhase===c.phase){
            sfx('win');
            if(!G.flags['dec_'+c.id]){
              G.flags['dec_'+c.id]=1; G.bits+=c.reward;
              G.toast(`> LOCKED ${c.name}! (+${c.reward} bits)`,P.GD);
              if(CARRIERS.every(x=>G.flags['dec_'+x.id])) G.ach('sig_decoder');
            } else G.toast(`> CARRIER VERIFIED: ${c.morse}`,'#22d3ee');
          } else {
            // Snap closer as tuning assist
            uFreq=c.freq; uPhase=c.phase; sfx('blip');
            G.toast('> Auto-aligned harmonic carrier! Press [Enter] to lock.',P.GD);
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        const clr=CARRIERS.filter(c=>G.flags['dec_'+c.id]).length;
        UI.text('> SIGNAL FREQUENCY & MORSE DECODER',106,48,P.GD,2);
        UI.text(`CHANNELS DECODED: ${clr}/4`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        CARRIERS.forEach((c,i)=>{
          const y=94+i*42, on=i===sel, ok=!!G.flags['dec_'+c.id];
          UI.box(104,y-4,310,34,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${ok?'[LOCK] ':'[SCAN] '}${c.name}`,112,y+6,ok?P.GD:(on?P.BONE:P.DG),1);
          UI.hit(104,y-4,310,34,()=>{ sel=i; });
        });
        const cur=CARRIERS[sel], match=Math.abs(uFreq-cur.freq)<=18&&uPhase===cur.phase;
        UI.box(430,90,426,256,match?P.GD:P.DDG,'rgba(10,8,6,.95)');
        UI.text(`TARGET: ${cur.freq} Hz · PHASE ${cur.phase}     YOUR TUNER: ${uFreq} Hz · PHASE ${uPhase}`,446,106,match?'#4ade80':'#22d3ee',1);
        // Dual sine wave oscilloscope
        X.strokeStyle='rgba(34,211,238,.55)'; X.lineWidth=2; X.beginPath();
        for(let x=0;x<390;x++){
          const y=218+Math.sin(x*0.03*(cur.freq/400)+t*3*cur.phase)*48;
          if(x===0) X.moveTo(448+x,y); else X.lineTo(448+x,y);
        }
        X.stroke();
        X.strokeStyle=match?'#4ade80':P.GD; X.lineWidth=2; X.beginPath();
        for(let x=0;x<390;x++){
          const y=218+Math.sin(x*0.03*(uFreq/400)+t*3*uPhase)*48;
          if(x===0) X.moveTo(448+x,y); else X.lineTo(448+x,y);
        }
        X.stroke();
        UI.box(104,360,752,102,P.DDG,'rgba(12,10,8,.92)');
        UI.text('DECODED MORSE PAYLOAD:',122,376,P.GD,1);
        UI.text(match||G.flags['dec_'+cur.id]?cur.morse:'[CARRIER OUT OF PHASE — TUNE FREQUENCY OR PRESS ENTER TO AUTO-ALIGN]',122,402,match||G.flags['dec_'+cur.id]?'#4ade80':P.BONE,1);
        UI.text(`Bounty Reward: +${cur.reward} bits on first carrier lock`,122,430,'#22d3ee',1);
        UI.text('[up/down] channel   [left/right] tune Hz   [P] cycle phase   [enter] lock/align   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Tactical Squad Formation & Row Synergy System (M48) ----
  const STANCES=[
    {id:0, name:'VANGUARD STRIKE', col:'#f5b82e', bonus:'+15% ATK · +1 SPD', desc:'Frontline breach posture. Maximizes physical & protocol burst damage.'},
    {id:1, name:'TACTICAL OVERCLOCK', col:'#22d3ee', bonus:'+20% MAX EN · +2 SPD', desc:'Mid-row harmonic posture. Accelerates turn order and energy pool.'},
    {id:2, name:'SENTINEL BASTION', col:'#4ade80', bonus:'+25% DEF · +15% MAX HP', desc:'Anchor bulwark posture. Fortifies hull integrity against boss wipes.'}
  ];
  G.openFormation=()=>{
    let sel=0;
    const squad=()=>G.active();
    G.mini={
      name:'formation',
      update(){
        const S=squad();
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+S.length-1)%S.length;
        if(took('down')) sel=(sel+1)%S.length;
        if(took('left')||took('right')||took('confirm')){
          const id=S[sel], dir=took('left')?2:1;
          G.flags['stance_'+id]=(((G.flags['stance_'+id]||0)+dir)%3);
          const st=G.stats(id); G.party[id].hp=Math.min(G.party[id].hp,st.mhp); G.party[id].en=Math.min(G.party[id].en,st.men);
          sfx('confirm'); G.toast(`> ${AG[id].name} -> ${STANCES[G.flags['stance_'+id]].name}`,P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> SQUAD FORMATION & STANCES',106,48,P.GD,2);
        UI.text('ROW SYNERGY ACTIVE IN ALL BATTLES',854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        const S=squad();
        S.forEach((id,i)=>{
          const y=96+i*108, on=i===sel, stIdx=(G.flags['stance_'+id]||0), stObj=STANCES[stIdx], st=G.stats(id);
          UI.box(106,y,748,94,on?P.GD:P.DDG,on?'rgba(245,184,46,.12)':'rgba(10,8,6,.88)');
          UI.text(`${on?'> ':'  '}SLOT 0${i+1} · ${AG[id].name.toUpperCase()} (LVL ${G.party[id].lvl})`,124,y+12,AG[id].color,2);
          UI.box(540,y+10,294,28,stObj.col,'rgba(6,5,4,.9)');
          UI.text(`[${stObj.name}]`,687,y+17,stObj.col,1,'center');
          UI.text(`Active Bonus: ${stObj.bonus}`,128,y+44,stObj.col,1);
          UI.text(`Live Stats: HP ${st.mhp}  ·  EN ${st.men}  ·  ATK ${st.atk}  ·  DEF ${st.def}  ·  SPD ${st.spd}`,128,y+66,P.BONE,1);
          UI.hit(106,y,748,94,()=>{ sel=i; G.flags['stance_'+id]=((G.flags['stance_'+id]||0)+1)%3; sfx('confirm'); });
        });
        UI.box(106,424,748,40,P.DDG,'rgba(12,10,8,.92)');
        UI.text(STANCES[G.flags['stance_'+S[sel]]||0].desc,480,438,P.BONE,1,'center');
        UI.text('[up/down] select squad slot   [enter / left / right] cycle tactical stance   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive 15-District Boss Trophy & Lore Museum (M49) ----
  const MUSEUM_BOSSES=[
    {id:'rusted', name:'RUSTED SENTINEL', zone:'Rest Woods', hp:90, proto:'THERMAL', drop:'alloy.plate', flag:'q3', lore:'An early perimeter automaton left running outside Relit City after the 06:12 blackout. Its chassis is fused with red copper moss.'},
    {id:'copy', name:'03NG0CN1 · RED COPY', zone:'East Gate / Mirrors', hp:120, proto:'VOID', drop:'mirror.shard', flag:'copy_down', lore:'Compiled from your git reflog to speak your name at the East Gate. Later defies the Hunter to shield the crew as Agent #22.'},
    {id:'relay4', name:'RELAY 4 · CHORUS', zone:'The Hollow', hp:260, proto:'CRYPTO', drop:'chorus.shard', flag:'core_down', lore:'Acoustic synthesis core fed by three Voice Pylons. Speaks in twenty-one spliced voices until Quorum shatters its carrier.'},
    {id:'warden', name:'FURNACE WARDEN', zone:'Doom-Fire Foundry', hp:120, proto:'TEMPORAL', drop:'slag.coat', flag:'q7', lore:'Molten crucible guardian keeping the Octagonal Mirror Key ingots at 1,400 degrees Kelvin inside the Foundry.'},
    {id:'brood', name:'SENTINEL BROOD', zone:'Physarum Caves', hp:110, proto:'THERMAL', drop:'mesh.vest', flag:'q8', lore:'Clustered lattice drone hive nested along the bioluminescent slime-mould veins beneath the city.'},
    {id:'sandglass', name:'SANDGLASS · 06:12', zone:'Sand Clocktower', hp:1100, proto:'TEMPORAL', drop:'clock.plate', flag:'q8', lore:'Biconic temporal engine drinking the 60-second delta between 06:12 and 06:13 so morning can never commit.'},
    {id:'hunter', name:'THE HUNTER · GAZE', zone:'Hall of Mirrors', hp:1600, proto:'CRYPTO', drop:'hunter.eye', flag:'q14', lore:'Speculative execution predator that locks onto any unverified voiceprint. Blinded when 03ng0cn1 steps into its beam.'},
    {id:'blank', name:'>_ · BLANK CURSOR', zone:'Mode-7 Skyline', hp:2200, proto:'VOID', drop:'null.crown', flag:'q16', lore:'The predictive prompt at the top of the Mode-7 Spire. Defeated only when the entire party answers its prompt with silence (GUARD).'},
    {id:'abyss_lord', name:'ABYSSAL LEVIATHAN', zone:'Sub-Lattice Abyss', hp:1850, proto:'THERMAL', drop:'abyss.mantle', flag:'q19', lore:'Deep-trench Menger anomaly guarding the Three Zero-Knowledge Seals 4,096 meters below Relit City.'},
    {id:'archon', name:'ARCHON-0 · COMPILER', zone:'ZK Citadel', hp:4800, proto:'VOID', drop:'citadel.crown', flag:'q20', lore:'Six-winged seraphic root hypervisor that authored the 06:12 simulation to test whether twenty-two faces could hold consensus.'}
  ];
  G.openMuseum=()=>{
    let sel=0;
    const isSlain=b=>!!(G.flags['kill_'+b.id]||G.flags[b.flag]||G.qdone_(b.flag)||G.achGot['boss_'+b.id]);
    G.mini={
      name:'museum',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+MUSEUM_BOSSES.length-1)%MUSEUM_BOSSES.length;
        if(took('down')) sel=(sel+1)%MUSEUM_BOSSES.length;
        if(took('confirm')){
          const b=MUSEUM_BOSSES[sel], k='mus_claim_'+b.id;
          if(!G.flags[k]){
            G.flags[k]=1; G.bits+=75; sfx('level');
            G.toast(`> Trophy Pedestal #${sel+1} Inspected! (+75 research bits)`,P.GD);
          } else {
            sfx('blip'); G.toast(`> Viewing ${b.name} wireframe hologram`,'#22d3ee');
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        const clr=MUSEUM_BOSSES.filter(isSlain).length;
        UI.text('> BOSS TROPHY MUSEUM',98,44,P.GD,2);
        UI.text(`TROPHIES UNLOCKED: ${clr}/10   ·   TOTAL VICTORIES: ${G.flags.total_wins||0}`,862,48,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        MUSEUM_BOSSES.forEach((b,i)=>{
          const y=88+i*36, on=i===sel, ok=isSlain(b);
          UI.box(96,y-4,284,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.8)');
          UI.text(`${on?'> ':'  '}${ok?'[TROPHY] ':'[LOCKED] '}${b.id.toUpperCase()}`,104,y+4,ok?P.GD:(on?P.BONE:P.DG),1);
          UI.hit(96,y-4,284,30,()=>{ sel=i; });
        });
        const cur=MUSEUM_BOSSES[sel], ok=isSlain(cur), kills=(G.flags['kill_'+cur.id]||0)+(ok?1:0);
        UI.box(396,84,468,364,ok?P.GD:P.DDG,'rgba(12,10,8,.94)');
        // Rotating sacred geometry wireframe hologram in pedestal box
        UI.box(416,104,132,132,P.RED,'rgba(6,5,4,.95)');
        const cx=482, cy=170, rad=44;
        X.strokeStyle=ok?P.GD:P.RED; X.lineWidth=1.5;
        X.beginPath();
        for(let i=0;i<=6;i++){
          const a=t*1.4+i*Math.PI/3, px=cx+Math.cos(a)*rad, py=cy+Math.sin(a)*rad*0.75;
          if(i===0) X.moveTo(px,py); else X.lineTo(px,py);
        }
        X.stroke();
        X.beginPath();
        for(let i=0;i<=6;i++){
          const a=-t*1.1+i*Math.PI/3, px=cx+Math.cos(a)*rad*0.58, py=cy+Math.sin(a)*rad*0.58;
          if(i===0) X.moveTo(px,py); else X.lineTo(px,py);
        }
        X.stroke();
        UI.text(`PEDESTAL #${String(sel+1).padStart(2,'0')}`,566,106,ok?'#4ade80':P.RED,1);
        UI.text(cur.name,566,126,P.GD,2);
        UI.text(`Domain: ${cur.zone}`,566,156,P.BONE,1);
        UI.text(`Base Hull: ${cur.hp} HP   ·   Weakness: [${cur.proto}]`,566,178,'#22d3ee',1);
        UI.text(`Signature Drop: ${ITEMS[cur.drop]?ITEMS[cur.drop].name:cur.drop}`,566,200,P.GD,1);
        UI.text(`Recorded Takedowns: ${kills}`,566,222,'#4ade80',1);
        UI.box(416,252,428,124,P.DDG,'rgba(6,5,4,.85)');
        UI.text('ARCHIVAL LORE DOSSIER:',432,268,P.GD,1);
        UI.wrap(cur.lore,396,1).forEach((l,li)=>UI.text(l,432,292+li*20,P.BONE,1));
        UI.box(416,392,428,36,P.GD,'rgba(245,184,46,.14)');
        UI.text(G.flags['mus_claim_'+cur.id]?'> HOLOGRAM VERIFIED (RESEARCH GRANT CLAIMED)':'> [ENTER] CLAIM +75 BIT ARCHIVAL RESEARCH GRANT',630,403,P.GD,1,'center');
        UI.text('[up/down] select boss pedestal   [enter] inspect & claim research grant   [esc] close',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Procedural Lattice Anomaly Weather Radar & Forecast (M50) ----
  const WEATHER_TYPES=[
    {name:'GOLD BRAILLE RAIN', proto:'KERNEL', buff:'+25% KERNEL DMG · +20% BITS', col:'#f5b82e'},
    {name:'FOXFIRES AURORA', proto:'THERMAL', buff:'+25% THERMAL DMG · +15% EN REGEN', col:'#fb923c'},
    {name:'ZERO-KNOWLEDGE FOG', proto:'CRYPTO', buff:'+25% CRYPTO DMG · +20% CRIT', col:'#22d3ee'},
    {name:'CHRONO SANDSTORM', proto:'TEMPORAL', buff:'+25% TEMPORAL DMG · +2 SPD', col:'#a78bfa'},
    {name:'VOID SINGULARITY SURGE', proto:'VOID', buff:'+25% VOID DMG · +35% XP', col:'#f43f5e'}
  ];
  const ZONE_KEYS=['hub','forest','relay','fiber','clock','streets','foundry','caves','mirrors','deep','skyline','abyss','citadel','nullcore','loom','rooftop'];
  G.openWeather=()=>{
    let sel=0, seedOff=G.flags.weather_seed||0;
    const wFor=i=>WEATHER_TYPES[(i*3+seedOff+Math.floor((G.t||0)/120))%WEATHER_TYPES.length];
    G.mini={
      name:'weather',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+ZONE_KEYS.length-1)%ZONE_KEYS.length;
        if(took('down')) sel=(sel+1)%ZONE_KEYS.length;
        if(took('party')){
          seedOff=(seedOff+1)%WEATHER_TYPES.length; G.flags.weather_seed=seedOff;
          const curW=wFor(sel); G.flags.active_weather_proto=curW.proto;
          sfx('level'); G.toast(`> Lattice Weather Shifted: ${curW.name} (${curW.buff})`,P.GD);
        }
        if(took('confirm')){
          const zk=ZONE_KEYS[sel], curW=wFor(sel);
          G.flags.active_weather_proto=curW.proto;
          sfx('confirm'); G.mode='explore'; G.travel(zk);
          G.toast(`> Warping to ${G.Z[zk].name} [${curW.name}]`,P.GD);
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        UI.text('> LATTICE WEATHER RADAR & STORM BUFFS',98,44,P.GD,2);
        UI.text(`ACTIVE RESONANCE: [${G.flags.active_weather_proto||'KERNEL'}]`,862,48,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        ZONE_KEYS.forEach((zk,i)=>{
          const y=86+i*24, on=i===sel, w=wFor(i), zName=(G.Z[zk]&&G.Z[zk].name)||zk;
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(96,y-3,768,20); }
          UI.text(`${on?'> ':'  '}${String(i+1).padStart(2,'0')} · ${zName.toUpperCase()}`,104,y,on?P.GD:P.BONE,1);
          UI.text(w.name,370,y,w.col,1);
          UI.text(w.buff,852,y,'#22d3ee',1,'right');
          UI.hit(96,y-3,768,20,()=>{ sel=i; });
        });
        UI.box(96,452,768,26,P.DDG,'rgba(12,10,8,.92)');
        UI.text('[UP/DOWN] SELECT DISTRICT     [ENTER] WARP & LOCK STORM BUFF     [P] SEED FRONT     [ESC] EXIT',480,458,P.GD,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Custom CRT Shader & Scanline Curvature Studio (M51) ----
  const SHADER_PRESETS=[
    {name:'SOVEREIGN DEFAULT', scan:.18, vig:.55, rain:.5, stars:1, hex:0},
    {name:'HEAVY CRT MONITOR', scan:.42, vig:.95, rain:.65, stars:1, hex:0},
    {name:'MATRIX HEX OVERDRIVE', scan:.22, vig:.45, rain:.95, stars:1.5, hex:1},
    {name:'CLEAN ZERO-GLARE', scan:.0, vig:.15, rain:.25, stars:.6, hex:0}
  ];
  G.openShaderStudio=()=>{
    let sel=0, pIdx=0;
    const u=postU();
    const params=[
      {name:'SCANLINE DEPTH', get:()=>u.scanAmt.value, set:v=>u.scanAmt.value=Math.max(0,Math.min(.65,v)), step:.05},
      {name:'CRT VIGNETTE CURVE', get:()=>u.vigAmt.value, set:v=>u.vigAmt.value=Math.max(0,Math.min(1.4,v)), step:.1},
      {name:'SKY GLYPH RAIN DENSITY', get:()=>u.rain.value, set:v=>u.rain.value=Math.max(0,Math.min(1.0,v)), step:.1},
      {name:'BRAILLE STARFIELD', get:()=>u.stars.value, set:v=>u.stars.value=Math.max(0,Math.min(2.0,v)), step:.2},
      {name:'HEXADECIMAL MATRIX MODE', get:()=>u.hex.value, set:v=>u.hex.value=v>.5?1:0, step:1}
    ];
    G.mini={
      name:'shaders',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+params.length-1)%params.length;
        if(took('down')) sel=(sel+1)%params.length;
        if(took('left')){ const p=params[sel]; p.set(+(p.get()-p.step).toFixed(2)); sfx('blip'); }
        if(took('right')||took('confirm')){ const p=params[sel]; p.set(+(p.get()+p.step).toFixed(2)); sfx('blip'); }
        if(took('party')){
          pIdx=(pIdx+1)%SHADER_PRESETS.length; const pr=SHADER_PRESETS[pIdx];
          u.scanAmt.value=pr.scan; u.vigAmt.value=pr.vig; u.rain.value=pr.rain; u.stars.value=pr.stars; u.hex.value=pr.hex;
          sfx('level'); G.toast(`> Shader Preset: ${pr.name}`,P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.78)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.90)');
        UI.text('> CRT SHADER & SCANLINE STUDIO',106,48,P.GD,2);
        UI.text(`PRESET: ${SHADER_PRESETS[pIdx].name}`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        params.forEach((p,i)=>{
          const y=102+i*58, on=i===sel, val=p.get();
          UI.box(106,y-4,748,46,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.82)');
          UI.text(`${on?'> ':'  '}0${i+1} · ${p.name}`,122,y+6,on?P.GD:P.BONE,1);
          // Visual slider bar
          const maxV=i===3?2.0:(i===1?1.4:(i===0?.65:1.0)), pct=Math.max(0,Math.min(1,val/maxV));
          UI.box(460,y+6,260,18,P.DDG,'rgba(6,5,4,.95)');
          X.fillStyle=on?P.GD:'#22d3ee'; X.fillRect(462,y+8,Math.round(256*pct),14);
          UI.text(val.toFixed(2),836,y+6,P.GD,1,'right');
          UI.hit(106,y-4,748,46,()=>{ sel=i; });
        });
        UI.box(106,404,748,48,P.DDG,'rgba(12,10,8,.92)');
        UI.text('Live WebGL post-processing uniforms update in real time across the 3D viewport behind this panel.',480,422,P.BONE,1,'center');
        UI.text('[up/down] select uniform   [left/right] tune value   [P] cycle shader preset   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- In-Game 8-Bit Chiptune Sequencer & Loop Composer (M52) ----
  const SEQ_ROWS=[
    {name:'LEAD D5', sfx:'loot', col:'#f5b82e'},
    {name:'ARP A4',  sfx:'blip', col:'#22d3ee'},
    {name:'BASS D3', sfx:'move', col:'#4ade80'},
    {name:'PERC KK', sfx:'block', col:'#f43f5e'}
  ];
  const seqGrid=[
    [1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
    [0,1,1,0, 1,0,0,1, 0,1,1,0, 1,0,1,1],
    [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,1,0,1],
    [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,1,0]
  ];
  G.openComposer=()=>{
    let cr=0, cc=0, playing=true, stepIdx=0, acc=0, bpm=128;
    G.mini={
      name:'composer',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) cr=(cr+3)%4;
        if(took('down')) cr=(cr+1)%4;
        if(took('left')) cc=(cc+15)%16;
        if(took('right')) cc=(cc+1)%16;
        if(took('confirm')){ seqGrid[cr][cc]=seqGrid[cr][cc]?0:1; sfx(SEQ_ROWS[cr].sfx); }
        if(took('party')){ playing=!playing; sfx('confirm'); }
        if(playing){
          const stepDur=60/bpm/4;
          acc+=dt;
          if(acc>=stepDur){
            acc-=stepDur; stepIdx=(stepIdx+1)%16;
            for(let r=0;r<4;r++) if(seqGrid[r][stepIdx]) sfx(SEQ_ROWS[r].sfx);
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(68,28,824,484,P.GD,'rgba(8,7,5,.96)');
        UI.text('> 8-BIT CHIPTUNE LOOP COMPOSER',92,44,P.GD,2);
        UI.text(`${playing?'[PLAYING '+bpm+' BPM]':'[PAUSED]'}   ·   STEP ${String(stepIdx+1).padStart(2,'0')}/16`,868,48,playing?'#4ade80':P.RED,1,'right');
        X.fillStyle=P.DDG; X.fillRect(88,72,784,2);
        for(let r=0;r<4;r++){
          const y=104+r*72, row=SEQ_ROWS[r];
          UI.text(row.name,92,y+20,row.col,1);
          for(let c=0;c<16;c++){
            const x=184+c*42, on=seqGrid[r][c], cur=(r===cr&&c===cc), playHead=(c===stepIdx&&playing);
            UI.box(x,y,36,52,cur?P.GD:(playHead?'#22d3ee':(on?row.col:P.DDG)),on?'rgba(245,184,46,.22)':(playHead?'rgba(34,211,238,.12)':'rgba(6,5,4,.85)'));
            if(on){ X.fillStyle=row.col; X.fillRect(x+8,y+12,20,28); }
            UI.hit(x,y,36,52,()=>{ cr=r; cc=c; seqGrid[r][c]=seqGrid[r][c]?0:1; sfx(row.sfx); });
          }
        }
        UI.box(92,408,776,46,P.DDG,'rgba(12,10,8,.92)');
        UI.text('16-Step 4-Channel Chiptune Matrix — toggle cells to synthesize custom D-Minor loops.',480,424,P.BONE,1,'center');
        UI.text('[arrows] move cursor   [enter / click] toggle note   [P] play/pause loop   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Sovereign Black-Market Merchant ("Neko Underground", M53) ----
  const BM_POOL=[
    {id:'sovereign.edge', cost:240, tag:'MYTHIC TOOL'},
    {id:'citadel.crown',  cost:260, tag:'MYTHIC SHELL'},
    {id:'singularity.halo', cost:280, tag:'NULL CORE RELIC'},
    {id:'foxfire.crown',  cost:160, tag:'KITSUNE RELIC'},
    {id:'ocular.aegis',   cost:160, tag:'VIGIL RELIC'},
    {id:'static.katana',  cost:175, tag:'KAI RELIC'},
    {id:'owl.spear',      cost:175, tag:'ATHENA RELIC'},
    {id:'obsidian.prism', cost:185, tag:'ONYX RELIC'},
    {id:'seraph.mantle',  cost:195, tag:'AETHER RELIC'},
    {id:'root.shell',     cost:45,  tag:'CONSUMABLE'},
    {id:'mega.patch',     cost:55,  tag:'CONSUMABLE'}
  ];
  G.openBlackMarket=()=>{
    let sel=0, seed=G.flags.bm_seed||0;
    const stock=()=>[0,1,2,3,4].map(i=>BM_POOL[(i*2+seed)%BM_POOL.length]);
    G.mini={
      name:'blackmarket',
      update(){
        const S=stock();
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+S.length-1)%S.length;
        if(took('down')) sel=(sel+1)%S.length;
        if(took('party')){
          if(G.bits<20){ G.toast('need 20 bits to refresh contraband manifest',P.RED); sfx('cancel'); return; }
          G.bits-=20; seed=(seed+1)%BM_POOL.length; G.flags.bm_seed=seed; sfx('blip');
          G.toast('> Contraband manifest rotated (-20 bits)',P.GD);
        }
        if(took('confirm')){
          const off=S[sel], it=ITEMS[off.id];
          if(!it) return;
          if(it.slot&&G.has(off.id)){
            const curUp=G.flags['up_'+off.id]||0;
            if(curUp>=5){ G.toast('Relic already at +5 Max Overclock!',P.GD); sfx('cancel'); return; }
            if(G.bits<off.cost){ G.toast(`need ${off.cost} bits`,P.RED); sfx('cancel'); return; }
            G.bits-=off.cost; G.flags['up_'+off.id]=curUp+1; sfx('level');
            G.toast(`> Upgraded ${it.name} to +${curUp+1}!`,P.GD);
            return;
          }
          if(G.bits<off.cost){ G.toast(`need ${off.cost} bits`,P.RED); sfx('cancel'); return; }
          G.bits-=off.cost; G.give(off.id,1); sfx('level');
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> NEKO UNDERGROUND · BLACK MARKET',106,48,P.GD,2);
        UI.text(`BITS: ${G.bits}   ·   MANIFEST #0${(seed%9)+1}`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        const S=stock();
        S.forEach((off,i)=>{
          const y=96+i*62, on=i===sel, it=ITEMS[off.id]||{name:off.id,desc:'Classified lattice artifact'}, owned=it.slot&&G.has(off.id), up=G.flags['up_'+off.id]||0;
          UI.box(106,y-4,748,52,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.85)');
          UI.text(`${on?'> ':'  '}${it.name.toUpperCase()}${up?` [+${up}]`:''}`,122,y+4,owned?'#4ade80':(on?P.GD:P.BONE),2);
          UI.text(`[${off.tag}]  ·  ${off.cost} BITS`,836,y+8,'#22d3ee',1,'right');
          UI.text(owned?`${it.desc}  (Owned — press Enter to Overclock to +${Math.min(5,up+1)})`:it.desc,126,y+28,P.DG,1);
          UI.hit(106,y-4,748,52,()=>{ sel=i; });
        });
        UI.box(106,416,748,40,P.DDG,'rgba(12,10,8,.92)');
        UI.text('[ENTER] ACQUIRE / OVERCLOCK CONTRABAND     [P] ROTATE MANIFEST (20 BITS)     [ESC] EXIT',480,430,P.GD,1,'center');
        UI.text('Pixel-Neko routes unindexed relics directly from the Sub-Lattice Abyss.',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Boss Practice / Phase Selector Mode ("Apex Boss Lab", M54) ----
  const LAB_BOSSES=[
    {id:'rusted', name:'RUSTED SENTINEL', wave:['rusted','drone'], lvl:6},
    {id:'copy',   name:'03NG0CN1 · RED COPY', wave:['copy','echo'], lvl:10},
    {id:'relay4', name:'RELAY 4 · CHORUS', wave:['relay4','node','node'], lvl:14},
    {id:'warden', name:'FURNACE WARDEN', wave:['warden','slag'], lvl:16},
    {id:'sandglass', name:'SANDGLASS · 06:12', wave:['sandglass','mite'], lvl:18},
    {id:'hunter', name:'THE HUNTER · GAZE', wave:['hunter','gunship'], lvl:22},
    {id:'blank',  name:'>_ · BLANK CURSOR', wave:['blank','cursorling'], lvl:26},
    {id:'archon', name:'ARCHON-0 · COMPILER', wave:['archon','cursorling','cursorling'], lvl:30}
  ];
  G.openBossLab=()=>{
    let sel=0, customLvl=18, fullOd=true;
    G.mini={
      name:'bosslab',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+LAB_BOSSES.length-1)%LAB_BOSSES.length;
        if(took('down')) sel=(sel+1)%LAB_BOSSES.length;
        if(took('left')) customLvl=Math.max(1,customLvl-2);
        if(took('right')) customLvl=Math.min(50,customLvl+2);
        if(took('party')){ fullOd=!fullOd; sfx('blip'); }
        if(took('confirm')){
          const b=LAB_BOSSES[sel];
          G.healAll(); G.mode='explore'; sfx('confirm');
          G.battle(b.wave,{boss:b.id, music:'boss', lvl:customLvl, ambush:fullOd});
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(84,32,792,476,P.GD,'rgba(8,7,5,.96)');
        UI.text('> BOSS PRACTICE LAB',106,48,P.GD,2);
        UI.text(`SIMULATION LEVEL: LV ${customLvl}   ·   OPENING AMBUSH: ${fullOd?'ON':'OFF'}`,854,52,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(102,76,756,2);
        LAB_BOSSES.forEach((b,i)=>{
          const y=92+i*38, on=i===sel;
          UI.box(106,y-4,360,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.85)');
          UI.text(`${on?'> ':'  '}0${i+1} · ${b.name}`,116,y+4,on?P.GD:P.BONE,1);
          UI.hit(106,y-4,360,30,()=>{ sel=i; customLvl=b.lvl; });
        });
        const cur=LAB_BOSSES[sel];
        UI.box(484,88,370,300,P.DDG,'rgba(12,10,8,.92)');
        UI.text('SIMULATION PARAMETERS:',504,108,P.GD,1);
        UI.text(cur.name,504,132,P.RED,2);
        UI.text(`Encounter Wave: ${cur.wave.join(' + ').toUpperCase()}`,504,168,P.BONE,1);
        UI.text(`Configured Threat Level: LV ${customLvl} (Default LV ${cur.lvl})`,504,194,'#22d3ee',1);
        UI.text(`Protocol Weakness: [${ENEMY_WEAK[cur.id]||'VOID'}]`,504,220,P.GD,1);
        UI.text(`Opening Ambush Advantage: ${fullOd?'ENABLED (+1 FREE ROUND)':'STANDARD TURN ORDER'}`,504,246,'#4ade80',1);
        UI.box(504,312,330,44,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] LAUNCH BOSS SIMULATION',669,328,P.GD,1,'center');
        UI.text('[up/down] boss   [left/right] scale level (1-50)   [P] toggle ambush   [enter] fight   [esc] exit',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Companion Combo Synergy Encyclopedia (M55) ----
  const COMBO_LIST=[
    {id:'duo_mirror', name:'DUO: ZERO-DAY SPLIT', pair:['me','copy'], pairLbl:'1nc0gn30 + 03ng0cn1', pow:'2.8x Piercing All', cost:'10 EN · 3 Sync', fx:'Pierces all firewalls and applies 3-turn Trace across the entire enemy wave.'},
    {id:'duo_solar', name:'DUO: FOXFIRE NOVA', pair:['kitsune','ignis'], pairLbl:'Kitsune + Ignis', pow:'2.5x Solar Magma', cost:'10 EN · 3 Sync', fx:'Unleashes nine-tail solar magma on all foes while restoring +24 HP (+3/lvl) to the crew.'},
    {id:'duo_undertow', name:'DUO: DEEP-TIME TIDE', pair:['chronos','leviathan'], pairLbl:'Chronos + Leviathan', pow:'2.4x Temporal Wave', cost:'10 EN · 3 Sync', fx:'Crushes all enemies under deep-trench pressure, grants 2-turn Crew Shield & +12 EN.'},
    {id:'duo_zerotrust', name:'DUO: ZERO-TRUST EXEC', pair:['vigil','onyx'], pairLbl:'Vigil + Onyx', pow:'2.6x Seam Execution', cost:'10 EN · 3 Sync', fx:'Strips all enemy firewalls, silences voice anomalies, and buffs crew ATK by +40%.'},
    {id:'duo_surge', name:'DUO: LATTICE SURGE', pair:['me','kitsune'], pairLbl:'Any Active Duo Pair', pow:'2.2x Harmonic Surge', cost:'8 EN · 3 Sync', fx:'Universal companion resonance strike that pierces armor and refunds +8 EN to the squad.'},
    {id:'od_surge', name:'OVERDRIVE: 100% SURGE', pair:['me','aether'], pairLbl:'Full Crew (100% OD)', pow:'3.2x Sovereign Convergence', cost:'0 EN · 100% OD', fx:'Ultimate zero-cost convergence: 3.2x piercing damage to all foes, +45 HP heal & +15 EN.'},
    {id:'quorum', name:'QUORUM: TWENTY-TWO FACES', pair:['me','vigil'], pairLbl:'1nc0gn30 + Crew Chorus', pow:'2.2x Chorus Breaker', cost:'14 EN · 3 Sync', fx:'Verifies every face in person, shattering acoustic illusions and Relay 4 voice pylons.'},
    {id:'crew22', name:'CREW: 22 CONVERGENCE', pair:['copy','me'], pairLbl:'03ng0cn1 + Full Roster', pow:'2.6x Mirror Convergence', cost:'20 EN · Lvl 16', fx:'22nd agent signature convergence: 2.6x piercing wave + full squad restoration.'}
  ];
  G.openCombos=()=>{
    let sel=0, pulseT=0;
    G.mini={
      name:'combos',
      update(dt){
        pulseT=Math.max(0,pulseT-dt);
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+COMBO_LIST.length-1)%COMBO_LIST.length;
        if(took('down')) sel=(sel+1)%COMBO_LIST.length;
        if(took('confirm')){
          const c=COMBO_LIST[sel];
          c.pair.forEach(id=>{ if(!G.roster.includes(id)&&id!=='copy') G.recruit(id); });
          G.activeL=['me',...c.pair.filter(id=>id!=='me'&&G.roster.includes(id))].slice(0,3);
          pulseT=1.2; sfx('level');
          G.toast(`> Synced Active Squad for ${c.name}!`,P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        UI.text('> COMBO & OVERDRIVE CODEX',98,44,P.GD,2);
        UI.text('BUILD 3 SYNC POINTS OR 100% OVERDRIVE IN BATTLE',862,48,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        COMBO_LIST.forEach((c,i)=>{
          const y=88+i*44, on=i===sel;
          UI.box(96,y-4,330,36,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.85)');
          UI.text(`${on?'> ':'  '}${c.name}`,106,y+4,on?P.GD:P.BONE,1);
          UI.text(c.pairLbl,114,y+18,'#22d3ee',1);
          UI.hit(96,y-4,330,36,()=>{ sel=i; });
        });
        const cur=COMBO_LIST[sel];
        UI.box(444,84,420,356,pulseT>0?'#4ade80':P.GD,'rgba(12,10,8,.94)');
        // Dual portrait synergy preview
        cur.pair.forEach((id,idx)=>{
          const px=486+idx*180, py=104;
          UI.box(px,py,116,124,AG[id]?AG[id].color:P.GD,'rgba(6,5,4,.95)');
          UI.ditherRect(px+4,py+4,108,116,AG[id]?AG[id].color:P.GD,.22);
          try{
            const fc=frameCanvas(id,'idle',Math.floor(t*6)%(id==='me'||id==='copy'?1:8));
            X.imageSmoothingEnabled=false;
            if(id==='me'||id==='copy') X.drawImage(fc,px+58-fc.width,py+116-fc.height*2,fc.width*2,fc.height*2);
            else X.drawImage(fc,0,10,96,86,px+58-86,py+118-86*1.6,96*1.8,86*1.6);
          }catch(e){}
          UI.text((AG[id]&&AG[id].name)||id,px+58,py+108,P.BONE,1,'center');
        });
        UI.text('+',634,154,P.GD,2,'center');
        UI.text(cur.name,464,246,P.GD,2);
        UI.text(`Multiplier: ${cur.pow}   ·   Requirement: ${cur.cost}`,464,276,'#22d3ee',1);
        UI.wrap(cur.fx,380,1).forEach((l,li)=>UI.text(l,464,304+li*20,P.BONE,1));
        UI.box(464,380,380,38,P.GD,'rgba(245,184,46,.16)');
        UI.text('> [ENTER] EQUIP SYNERGY PAIR TO ACTIVE SQUAD',654,392,P.GD,1,'center');
        UI.text('[up/down] select resonance combo   [enter] sync active squad   [esc] close',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #7: "Physarum Slime Mould Network Router" (M56) ----
  const PHY_NODES=[
    {id:0, name:'SPORE CORE', x:220, y:260},
    {id:1, name:'VEIN NORTH', x:360, y:140},
    {id:2, name:'VEIN SOUTH', x:360, y:380},
    {id:3, name:'AORTA HUB',  x:520, y:260},
    {id:4, name:'EAST LOBE',  x:680, y:150},
    {id:5, name:'APEX SINK',  x:720, y:370}
  ];
  const PHY_EDGES=[
    [0,1,14],[0,2,16],[0,3,24],
    [1,3,12],[1,4,18],
    [2,3,15],[2,5,22],
    [3,4,14],[3,5,16],[4,5,12]
  ];
  G.startRouter=()=>{
    let sel=0;
    const active=new Set([0,3,5,7,9]); // Initial spanning links
    const checkSpan=()=>{
      const vis=new Set([0]), q=[0];
      while(q.length){
        const u=q.shift();
        PHY_EDGES.forEach(([a,b],ei)=>{
          if(!active.has(ei)) return;
          if(a===u&&!vis.has(b)){ vis.add(b); q.push(b); }
          if(b===u&&!vis.has(a)){ vis.add(a); q.push(a); }
        });
      }
      return vis.size===PHY_NODES.length;
    };
    const totalCost=()=>[...active].reduce((s,ei)=>s+PHY_EDGES[ei][2],0);
    G.mini={
      name:'router',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')||took('left')) sel=(sel+PHY_EDGES.length-1)%PHY_EDGES.length;
        if(took('down')||took('right')) sel=(sel+1)%PHY_EDGES.length;
        if(took('confirm')){
          if(active.has(sel)) active.delete(sel); else active.add(sel);
          sfx('blip');
          if(checkSpan()&&totalCost()<=70){
            sfx('win'); G.ach('bio_router');
            if(!G.flags.router_won){ G.flags.router_won=1; G.bits+=180; G.toast('> OPTIMAL PHYSARUM MESH LOCKED! (+180 bits)',P.GD); }
          }
        }
        if(took('party')){
          active.clear(); [0,3,5,7,9].forEach(e=>active.add(e));
          sfx('win'); G.ach('bio_router');
          if(!G.flags.router_won){ G.flags.router_won=1; G.bits+=180; }
          G.toast('> PHYSARUM SHORTEST-PATH CONVERGED (COST 67 <= 70)!',P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        const ok=checkSpan(), cost=totalCost(), optimal=ok&&cost<=70;
        UI.text('> PHYSARUM SLIME MOULD ROUTER',98,44,P.GD,2);
        UI.text(`NODES LINKED: ${ok?'6/6 [OK]':'DISCONNECTED'}   ·   ATP COST: ${cost}/70`,862,48,optimal?'#4ade80':'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        PHY_EDGES.forEach(([a,b,w],ei)=>{
          const na=PHY_NODES[a], nb=PHY_NODES[b], on=active.has(ei), cur=ei===sel;
          X.strokeStyle=cur?P.GD:(on?'#4ade80':P.DDG);
          X.lineWidth=cur?4:(on?3:1.5);
          X.beginPath(); X.moveTo(na.x,na.y); X.lineTo(nb.x,nb.y); X.stroke();
          const mx=(na.x+nb.x)/2, my=(na.y+nb.y)/2;
          UI.box(mx-22,my-11,44,22,cur?P.GD:(on?'#4ade80':P.DDG),'rgba(6,5,4,.92)');
          UI.text(`${w}`,mx,my-5,cur?P.GD:(on?'#4ade80':P.DG),1,'center');
          UI.hit(mx-22,my-11,44,22,()=>{ sel=ei; if(active.has(ei)) active.delete(ei); else active.add(ei); sfx('blip'); });
        });
        PHY_NODES.forEach(n=>{
          UI.box(n.x-44,n.y-20,88,40,'#4ade80','rgba(8,24,14,.94)');
          UI.text(n.name,n.x,n.y-6,P.BONE,1,'center');
        });
        UI.box(96,426,768,36,P.DDG,'rgba(12,10,8,.92)');
        UI.text('Connect all 6 Physarum bio-nodes with total ATP cost <= 70 (Optimal MST = 67 ATP).',480,438,P.BONE,1,'center');
        UI.text('[arrows] select vein   [enter / click] toggle vein   [P] auto-solve MST   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Operator Combat Statistics & Career Telemetry Ledger (M57) ----
  G.openLedger=()=>{
    G.mini={
      name:'ledger',
      update(){
        if(took('back')||took('pause')||took('confirm')){ G.mode='explore'; sfx('cancel'); return; }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        const qAll=Object.keys(QUESTS).length||32, qDone=Object.values(G.quests).filter(q=>q.done).length;
        const achAll=Object.keys(ACH).length, achDone=Object.keys(G.achGot||{}).length;
        const bntDone=[1,2,3,4,5,6,7,8,9,10].filter(i=>G.flags['bounty_'+i]).length;
        const dcDone=DATACUBES.filter(d=>G.flags['dc_'+d.id]).length;
        const seenZ=Object.keys(G.Z).filter(z=>G.flags['seen_'+z]||z==='hub').length;
        const labsDone=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16].filter(i=>G.flags['lab_'+i]).length;
        const overallPct=Math.min(100,Math.round(((G.crewCount()/22)+(qDone/qAll)+(achDone/achAll)+(bntDone/10)+(dcDone/15)+(seenZ/15))/6*100));
        UI.text('> CAREER TELEMETRY LEDGER',98,44,P.GD,2);
        UI.text(`SOVEREIGN COMPLETION INDEX: ${overallPct}%`,862,48,'#4ade80',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        const rows=[
          ['OPERATOR LEVEL & ACTIVE CYCLE', `LVL ${G.party.me.lvl}  ·  CYCLE NG+${G.flags.ng_plus||0}`, `RUN TIME: ${fmtSplit(G.t||0)}`],
          ['CREW RECRUITED & BOND RESONANCE', `${G.crewCount()} / 22 SOVEREIGN AGENTS`, `ACTIVE SQUAD: ${G.active().map(id=>AG[id].name).join(', ')}`],
          ['DISTRICTS & RED TAGS DISCOVERED', `${seenZ} / 15 DISTRICTS MAPPED`, `RED TAGS: ${['hub','forest','relay','fiber','clock','streets','foundry','caves','deep'].filter(z=>G.flags['tag_'+z]).length} / 9`],
          ['CAMPAIGN & LOYALTY MISSIONS', `${qDone} / ${qAll} MISSIONS COMPLETED`, `BOUNTY CONTRACTS: ${bntDone} / 10`],
          ['ENDGAME GAUNTLET RECORDS', `INFINITE STACK: FLOOR ${G.flags.stack_floor||0}/99`, `PANTHEON BOSS RUSH: STAGE ${G.flags.bossrush_stage||0}/6`],
          ['ARCHIVAL & CYBER-RANGE MASTERY', `DATACUBES: ${dcDone}/15  ·  LABS: ${labsDone}/16`, `ACHIEVEMENTS: ${achDone} / ${achAll}`],
          ['COMBAT & TREASURY LEDGER', `VICTORIES: ${G.flags.total_wins||0} BATTLES`, `TREASURY: ${G.bits} LATTICE BITS`]
        ];
        rows.forEach(([title,v1,v2],i)=>{
          const y=90+i*48;
          UI.box(98,y-4,764,40,P.DDG,'rgba(10,8,6,.88)');
          UI.text(title,114,y+10,P.GD,1);
          UI.text(v1,430,y+10,'#22d3ee',1);
          UI.text(v2,846,y+10,P.BONE,1,'right');
        });
        UI.box(98,434,764,34,P.GD,'rgba(245,184,46,.14)');
        UI.text(`SOVEREIGN OPERATOR STATUS: ${overallPct>=80?'PANTHEON ARCHITECT':(overallPct>=40?'SENIOR LATTICE OPERATOR':'INITIATE NODE WALKER')}`,480,445,P.GD,1,'center');
        UI.text('[enter / esc] return to lattice',480,484,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- New Game++ ("06:14 Sovereign Singularity" Ascension Console, M59) ----
  const NG_TIERS=[
    {tier:1, clock:'06:13:00', name:'CYCLE I · FIRST SUNRISE', bonus:'+12% All Stats · +1 SPD · Keep Full Crew & Relics'},
    {tier:2, clock:'06:14:00', name:'CYCLE II · SOVEREIGN SINGULARITY', bonus:'+24% All Stats · +2 SPD · +1x Singularity.Halo'},
    {tier:3, clock:'06:15:00', name:'CYCLE III · PANTHEON OVERCLOCK', bonus:'+36% All Stats · +3 SPD · +500 Treasury Bits'},
    {tier:4, clock:'06:16:00', name:'CYCLE IV · ZERO-KNOWLEDGE OMNI', bonus:'+48% All Stats · +4 SPD · Max Overclock Resonance'},
    {tier:5, clock:'06:17:00', name:'CYCLE V · ETERNAL LATTICE', bonus:'+60% All Stats · +5 SPD · Sovereign Apex Tier'}
  ];
  G.openSingularity=()=>{
    let sel=Math.min(4,(G.flags.ng_plus||0));
    G.mini={
      name:'singularity',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+NG_TIERS.length-1)%NG_TIERS.length;
        if(took('down')) sel=(sel+1)%NG_TIERS.length;
        if(took('confirm')){
          const tObj=NG_TIERS[sel];
          G.flags.ng_plus=tObj.tier-1;
          if(tObj.tier>=2&&!G.has('singularity.halo')) G.give('singularity.halo',1);
          if(tObj.tier>=3) G.bits+=500;
          G.newGamePlus(); sfx('level');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        const curNg=G.flags.ng_plus||0;
        UI.text('> 06:14 SOVEREIGN SINGULARITY (NG++)',98,44,P.GD,2);
        UI.text(`ACTIVE CYCLE: NG+${curNg} (+${curNg*12}% ALL STATS)`,862,48,'#4ade80',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        NG_TIERS.forEach((tr,i)=>{
          const y=92+i*58, on=i===sel, act=curNg>=tr.tier;
          UI.box(98,y-4,764,48,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(6,5,4,.85)');
          UI.text(`${on?'> ':'  '}${tr.name}`,114,y+4,act?'#4ade80':(on?P.GD:P.BONE),2);
          UI.text(`[CLOCK ${tr.clock}]`,844,y+8,'#22d3ee',1,'right');
          UI.text(`Ascension Resonance: ${tr.bonus}`,118,y+28,P.DG,1);
          UI.hit(98,y-4,764,48,()=>{ sel=i; });
        });
        UI.box(98,396,764,62,P.DDG,'rgba(12,10,8,.92)');
        UI.text('Ascending into a New Game++ Cycle preserves your recruited crew, levels, relics, and overclocking',480,414,P.BONE,1,'center');
        UI.text('while resetting campaign missions and granting permanent multiplicative stat resonance.',480,434,'#22d3ee',1,'center');
        UI.text('[up/down] select ascension cycle   [enter] initialize new game++ cycle   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #8: "Memory Trench Core-Dump Defragmenter" (M61) ----
  const MEM_TYPES=[
    {id:0, lbl:'KERNEL', col:'#f5b82e', row:'ROW 01'},
    {id:1, lbl:'CRYPTO', col:'#22d3ee', row:'ROW 02'},
    {id:2, lbl:'THERMAL', col:'#fb923c', row:'ROW 03'},
    {id:3, lbl:'VOID', col:'#a78bfa', row:'ROW 04'}
  ];
  G.startDefrag=()=>{
    // 4x4 scrambled blocks where each row should contain its own protocol type (0,1,2,3)
    const grid=[
      [0,1,0,2],
      [1,0,1,3],
      [2,3,2,0],
      [3,2,3,1]
    ];
    let cr=0, cc=1, picked=null, solved=false;
    const isSolved=()=>grid.every((row,r)=>row.every(v=>v===r));
    const alignedCount=()=>grid.reduce((acc,row,r)=>acc+row.filter(v=>v===r).length,0);
    G.mini={
      name:'defrag',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) cr=(cr+3)%4;
        if(took('down')) cr=(cr+1)%4;
        if(took('left')) cc=(cc+3)%4;
        if(took('right')) cc=(cc+1)%4;
        if(took('confirm')&&!solved){
          if(!picked){ picked=[cr,cc]; sfx('blip'); }
          else {
            const [pr,pc]=picked;
            const tmp=grid[pr][pc]; grid[pr][pc]=grid[cr][cc]; grid[cr][cc]=tmp;
            picked=null; sfx('confirm');
            if(isSolved()){
              solved=true; sfx('win'); G.ach('core_defrag');
              if(!G.flags.defrag_won){ G.flags.defrag_won=1; G.bits+=200; G.give('cache.bit',2); }
              G.toast('> CORE-DUMP DEFRAGMENTED! (+200 bits + 2x Cache.Bit)',P.GD);
            }
          }
        }
        if(took('party')&&!solved){
          for(let r=0;r<4;r++) for(let c=0;c<4;c++) grid[r][c]=r;
          solved=true; picked=null; sfx('win'); G.ach('core_defrag');
          if(!G.flags.defrag_won){ G.flags.defrag_won=1; G.bits+=200; G.give('cache.bit',2); }
          G.toast('> AUTO-DEFRAGMENTED ALL 16 SECTORS! (+200 bits)',P.GD);
        }
      },
      draw(){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(76,28,808,484,P.GD,'rgba(8,7,5,.96)');
        const al=alignedCount();
        UI.text('> CORE-DUMP DEFRAGMENTER',98,44,P.GD,2);
        UI.text(`SECTORS ALIGNED: ${al}/16 (${Math.round(al/16*100)}%)`,862,48,al===16?'#4ade80':'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(94,72,772,2);
        for(let r=0;r<4;r++){
          const rt=MEM_TYPES[r], ry=104+r*76;
          UI.text(`${rt.row} [${rt.lbl}]`,102,ry+24,rt.col,1);
          for(let c=0;c<4;c++){
            const x=240+c*108, y=ry, v=grid[r][c], mt=MEM_TYPES[v];
            const cur=(r===cr&&c===cc), pk=picked&&picked[0]===r&&picked[1]===c, ok=(v===r);
            UI.box(x,y,96,62,pk?P.RED:(cur?P.GD:(ok?'#4ade80':P.DDG)),pk?'rgba(220,50,40,.22)':(cur?'rgba(245,184,46,.16)':'rgba(8,7,5,.88)'));
            UI.text(mt.lbl,x+48,y+16,mt.col,1,'center');
            UI.text(pk?'[SWAP...]':(ok?'[ALIGNED]':'[FRAG]'),x+48,y+38,pk?P.RED:(ok?'#4ade80':P.DG),1,'center');
            UI.hit(x,y,96,62,()=>{ cr=r; cc=c; });
          }
        }
        UI.box(690,104,172,292,P.DDG,'rgba(12,10,8,.92)');
        UI.text('DEFRAG RULES:',706,122,P.GD,1);
        UI.wrap('Swap fragmented cold-storage blocks so each row holds its matching protocol signature.',144,1).forEach((l,li)=>UI.text(l,706,148+li*18,P.BONE,1));
        UI.text('BOUNTY:',706,272,'#22d3ee',1);
        UI.text('+200 Bits',706,292,P.GD,1);
        UI.text('+2x Cache.Bit',706,310,P.GD,1);
        UI.text('[P] Auto-Defrag',706,352,'#4ade80',1);
        UI.text('[arrows] cursor   [enter] select / swap block   [P] auto-defrag   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Sovereign Tactical Command Wheel / Quick-Action Radial (M62) ----
  const WHEEL_NODES=[
    {name:'WORLD ATLAS', sub:'15 Districts', col:'#f5b82e', act:()=>{ G.mode='explore'; G.hud3.open(); }},
    {name:'22 DOSSIERS', sub:'Crew Archive', col:'#22d3ee', act:()=>G.openDossiers()},
    {name:'SQUAD STANCES', sub:'Row Synergy', col:'#4ade80', act:()=>G.openFormation()},
    {name:'COMBO CODEX', sub:'Duo & Overdrive', col:'#a78bfa', act:()=>G.openCombos()},
    {name:'INFINITE STACK', sub:'Floors 1-99', col:'#f43f5e', act:()=>G.startStack()},
    {name:'BOSS RUSH', sub:'Pantheon Trial', col:'#fb923c', act:()=>G.openBossRush()},
    {name:'ELITE BOUNTIES', sub:'10 Contracts', col:'#f5b82e', act:()=>G.openBounties()},
    {name:'BLACK MARKET', sub:'Neko Contraband', col:'#22d3ee', act:()=>G.openBlackMarket()},
    {name:'RELIC SYNTH', sub:'Transmute Cube', col:'#a78bfa', act:()=>G.openSynth()},
    {name:'WEATHER RADAR', sub:'Storm Buffs', col:'#4ade80', act:()=>G.openWeather()},
    {name:'PHOTO STUDIO', sub:'3D Postcards', col:'#fb923c', act:()=>G.openPhotoMode()},
    {name:'CAREER LEDGER', sub:'Completion %', col:'#22d3ee', act:()=>G.openLedger()}
  ];
  G.openQuickWheel=()=>{
    let sel=0;
    G.mini={
      name:'wheel',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('left')||took('up')) sel=(sel+WHEEL_NODES.length-1)%WHEEL_NODES.length;
        if(took('right')||took('down')) sel=(sel+1)%WHEEL_NODES.length;
        if(took('confirm')){ sfx('confirm'); WHEEL_NODES[sel].act(); }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.86)'; X.fillRect(0,0,960,540);
        const cx=480, cy=270, rx=280, ry=175;
        UI.text('> SOVEREIGN TACTICAL COMMAND WHEEL [TAB]',480,26,P.GD,2,'center');
        // Radial spokes & outer ring
        X.strokeStyle=P.DDG; X.lineWidth=1.5;
        X.beginPath(); X.ellipse(cx,cy,rx,ry,0,0,Math.PI*2); X.stroke();
        WHEEL_NODES.forEach((n,i)=>{
          const ang=(i/WHEEL_NODES.length)*Math.PI*2-Math.PI/2;
          const nx=Math.round(cx+Math.cos(ang)*rx), ny=Math.round(cy+Math.sin(ang)*ry);
          const on=i===sel;
          X.strokeStyle=on?P.GD:'rgba(138,101,20,.35)'; X.lineWidth=on?2.5:1;
          X.beginPath(); X.moveTo(cx,cy); X.lineTo(nx,ny); X.stroke();
          UI.box(nx-68,ny-22,136,44,on?P.GD:n.col,on?'rgba(245,184,46,.22)':'rgba(8,7,5,.94)');
          UI.text(n.name,nx,ny-12,on?P.GD:P.BONE,1,'center');
          UI.text(n.sub,nx,ny+4,n.col,1,'center');
          UI.hit(nx-68,ny-22,136,44,()=>{ sel=i; sfx('confirm'); n.act(); });
        });
        // Center hub core
        const cur=WHEEL_NODES[sel];
        UI.box(cx-96,cy-42,192,84,P.GD,'rgba(6,5,4,.96)');
        UI.text(cur.name,cx,cy-22,P.GD,2,'center');
        UI.text(cur.sub,cx,cy+4,'#22d3ee',1,'center');
        UI.text('[ENTER] LAUNCH',cx,cy+22,'#4ade80',1,'center');
        UI.text('[arrows] rotate radial wheel   [enter / click] launch subsystem   [tab / esc] close',480,506,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive 3D Wireframe Model & Mesh Inspector (M63) ----
  const MESH_CATALOG=[
    {id:'relay4_crown', name:'RELAY 4 CROWN', cat:'APEX BOSS', zone:'Relay 4 Core', col:'#f43f5e', lore:'Twelve-ribbed hyperboloid acoustic resonator that broadcasts stolen operator voices across the lattice.'},
    {id:'sandglass_cage', name:'SANDGLASS CAGE', cat:'APEX BOSS', zone:'6:12 Clocktower', col:'#fb923c', lore:'Counter-rotating biconical chrono-cage locking the city inside the 06:12 AM minute loop.'},
    {id:'hunter_seraph', name:'THE HUNTER SERAPH', cat:'APEX BOSS', zone:'East Gate', col:'#ef4444', lore:'Six-winged orbital panopticon seraph chassis armed with the high-altitude GAZE beam.'},
    {id:'blank_tesseract', name:'THE CURSOR (4D)', cat:'APEX BOSS', zone:'03ng0cn1 Node', col:'#a78bfa', lore:'Four-dimensional Schlegel tesseract projection that listens when spoken to and mirrors every strike.'},
    {id:'archon_seraph', name:'ARCHON-0 COMPILER', cat:'APEX BOSS', zone:'ZK Citadel', col:'#f5b82e', lore:'The First Compiler at the apex of the Zero-Knowledge Citadel, surrounded by dual gimbal rings.'},
    {id:'null_singularity', name:'NULL SINGULARITY', cat:'WORLD MONUMENT', zone:'The Null Core', col:'#22d3ee', lore:'Eight-ribbon torus knot and dual accretion rings hovering at the center of District #15.'},
    {id:'quantum_loom', name:'QUANTUM LOOM', cat:'WORLD MONUMENT', zone:'The Quantum Loom', col:'#a78bfa', lore:'Twelve-strand double-helical Mobius spindle weaving entangled eigenstates across District #16.'},
    {id:'pantheon_throne', name:'PANTHEON THRONE', cat:'WORLD MONUMENT', zone:'ZK Citadel', col:'#f5b82e', lore:'Seventeen-meter sovereign monolith and solar halo anchoring the Zero-Knowledge Citadel.'},
    {id:'abyss_monolith', name:'ABYSS MONOLITH', cat:'WORLD MONUMENT', zone:'Sub-Lattice Abyss', col:'#a78bfa', lore:'Twisted hexagonal obelisk suspended inside the inverted gravity field of the Sub-Lattice Abyss.'},
    {id:'citadel_spire', name:'CITADEL SPIRE', cat:'WORLD MONUMENT', zone:'Hub / Citadel', col:'#22d3ee', lore:'Helical lattice broadcast spire routing encrypted carrier packets between sectors.'},
    {id:'clock_escapement', name:'CLOCK ESCAPEMENT', cat:'WORLD MONUMENT', zone:'6:12 Clocktower', col:'#fb923c', lore:'Twelve-tooth mechanical gear wheel frozen at 06:12:00 inside the Clocktower belfry.'},
    {id:'mirror_obelisk', name:'MIRROR OBELISK', cat:'WORLD MONUMENT', zone:'Mirror Labyrinth', col:'#67e8f9', lore:'Octahedral phase-reflector prism standing in the center of the Mirror Labyrinth.'},
    {id:'drone_rotor', name:'SURVEILLANCE DRONE', cat:'HOSTILE CHASSIS', zone:'Hub / Alley', col:'#f43f5e', lore:'Quad-rotor reconnaissance unit patrolling low-altitude alleys for unmasked operators.'},
    {id:'sentinel_mech', name:'BASTION SENTINEL', cat:'HOSTILE CHASSIS', zone:'East Gate / Foundry', col:'#ef4444', lore:'Heavy bipedal riot-control chassis equipped with deployable packet firewalls.'},
    {id:'worm_serpent', name:'LATTICE WORM', cat:'HOSTILE CHASSIS', zone:'Sub-Lattice Abyss', col:'#a78bfa', lore:'Nine-segment articulated tunnel borer that consumes corrupted cold-storage sectors.'},
    {id:'mite_arachnid', name:'CRAWLER MITE', cat:'HOSTILE CHASSIS', zone:'Memory Trench', col:'#fb923c', lore:'Eight-legged packet scavenger swarming exposed fiber conduits.'},
    {id:'phase_merkaba', name:'PHASE MERKABA', cat:'HOSTILE CHASSIS', zone:'Mirror Labyrinth', col:'#67e8f9', lore:'Interlocking star-tetrahedron anomaly capable of blinking across phase walls.'},
    {id:'gunship_valkyrie', name:'VALKYRIE GUNSHIP', cat:'HOSTILE CHASSIS', zone:'Signal Spire', col:'#f43f5e', lore:'Twin-nacelle aerial strike craft guarding the upper Signal Spire catwalks.'}
  ];
  G.openMeshViewer=()=>{
    let sel=0, yaw=0.4, pitch=0.28, zoomIdx=1, autoSpin=true;
    const ZOOMS=[1.0,1.35,1.75];
    G.mini={
      name:'meshes',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(autoSpin) yaw+=dt*0.75;
        if(took('up')){ sel=(sel+MESH_CATALOG.length-1)%MESH_CATALOG.length; sfx('move'); }
        if(took('down')){ sel=(sel+1)%MESH_CATALOG.length; sfx('move'); }
        if(IN.held.has('left')) yaw-=dt*2.2;
        if(IN.held.has('right')) yaw+=dt*2.2;
        if(took('n1')) pitch=Math.max(-0.8,pitch-0.18);
        if(took('n2')) pitch=Math.min(0.8,pitch+0.18);
        if(took('party')){ zoomIdx=(zoomIdx+1)%ZOOMS.length; sfx('blip'); }
        if(took('confirm')){ autoSpin=!autoSpin; sfx('confirm'); }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> BLENDER 3D WIREFRAME MESH INSPECTOR',56,40,P.GD,2);
        UI.text(`MODELS: ${MESH_CATALOG.length}   SPIN: ${autoSpin?'AUTO':'MANUAL'}`,900,44,'#22d3ee',1,'right');
        // Left list
        const first=Math.max(0,Math.min(sel-5,MESH_CATALOG.length-11));
        for(let idx=0;idx<11;idx++){
          const i=first+idx; if(i>=MESH_CATALOG.length) break;
          const m=MESH_CATALOG[i], yy=78+idx*36, on=i===sel;
          UI.box(52,yy,276,32,on?P.GD:P.DDG,on?'rgba(245,184,46,.16)':'rgba(10,8,6,.85)');
          UI.text((on?'> ':'  ')+m.name,62,yy+9,on?P.GD:P.BONE,1);
          UI.text(m.cat.split(' ')[0],318,yy+9,m.col,1,'right');
        }
        // Right 3D turntable viewport
        const cur=MESH_CATALOG[sel], pts=BLENDER_GEO[cur.id]||[];
        UI.box(344,78,560,298,cur.col,'rgba(8,7,5,.96)');
        // Compute bounding center & radius
        let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,minZ=1e9,maxZ=-1e9;
        for(let i=0;i<pts.length;i+=3){
          const x=pts[i],y=pts[i+1],z=pts[i+2];
          if(x<minX) minX=x; if(x>maxX) maxX=x;
          if(y<minY) minY=y; if(y>maxY) maxY=y;
          if(z<minZ) minZ=z; if(z>maxZ) maxZ=z;
        }
        const midX=(minX+maxX)/2, midY=(minY+maxY)/2, midZ=(minZ+maxZ)/2;
        const span=Math.max(0.5,maxX-minX,maxY-minY,maxZ-minZ);
        const sc=(185/span)*ZOOMS[zoomIdx];
        const cx=624, cy=226;
        const cyw=Math.cos(yaw), syw=Math.sin(yaw), cpt=Math.cos(pitch), spt=Math.sin(pitch);
        const proj=(x,y,z)=>{
          const dx=x-midX, dy=y-midY, dz=z-midZ;
          const rx=dx*cyw-dz*syw, rz=dx*syw+dz*cyw;
          const ry=dy*cpt-rz*spt, rz2=dy*spt+rz*cpt;
          const persp=420/(420+rz2*0.35);
          return [cx+rx*sc*persp, cy-ry*sc*persp, rz2];
        };
        X.save(); X.beginPath(); X.rect(346,80,556,294); X.clip();
        // Turntable floor grid
        X.strokeStyle='rgba(138,101,20,.22)'; X.lineWidth=1;
        for(let g=-4;g<=4;g++){
          const p1=proj(midX+g*span*.15,minY,midZ-span*.6), p2=proj(midX+g*span*.15,minY,midZ+span*.6);
          X.beginPath(); X.moveTo(p1[0],p1[1]); X.lineTo(p2[0],p2[1]); X.stroke();
        }
        // Render 3D mesh segments
        X.strokeStyle=cur.col; X.lineWidth=1.45;
        X.beginPath();
        for(let i=0;i<pts.length;i+=6){
          const a=proj(pts[i],pts[i+1],pts[i+2]);
          const b=proj(pts[i+3],pts[i+4],pts[i+5]);
          X.moveTo(a[0],a[1]); X.lineTo(b[0],b[1]);
        }
        X.stroke();
        X.restore();
        UI.text(cur.name,360,90,P.GD,2);
        UI.text(`EDGES: ${pts.length/6}  ·  VERTICES: ${pts.length/3}  ·  ZOOM: ${ZOOMS[zoomIdx]}x`,888,94,P.BONE,1,'right');
        UI.text(`CLASS: ${cur.cat}   ·   SECTOR: ${cur.zone}   ·   SPAN: ${span.toFixed(1)}m`,360,352,'#22d3ee',1);
        // Bottom lore & telemetry card
        UI.box(344,386,560,88,P.DDG,'rgba(12,10,8,.92)');
        UI.text('STRUCTURAL SCHEMATIC & LORE:',360,398,P.GD,1);
        UI.wrap(cur.lore,528,1).forEach((l,li)=>UI.text(l,360,418+li*18,P.BONE,1));
        UI.text('[up/down] model   [left/right] rotate yaw   [1/2] pitch   [P] zoom   [enter] spin   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Companion Skill Loadout & Mastery Customizer (M64) ----
  const MASTERY_SKILLS=Object.keys(SKILLS);
  G.openSkillMastery=()=>{
    let sel=0;
    const rankOf=k=>(G.flags&&G.flags['skm_'+k])||0;
    const costOf=r=>(r+1)*80;
    G.mini={
      name:'mastery',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+MASTERY_SKILLS.length-1)%MASTERY_SKILLS.length; sfx('move'); }
        if(took('down')){ sel=(sel+1)%MASTERY_SKILLS.length; sfx('move'); }
        if(took('confirm')){
          const k=MASTERY_SKILLS[sel], r=rankOf(k);
          if(r>=3){ G.toast('> Skill already at MAX Mastery (+3)!',P.GD); sfx('cancel'); return; }
          const cost=costOf(r);
          if((G.bits||0)<cost){ G.toast(`> Need ${cost} Bits to upgrade Mastery!`,P.RED); sfx('cancel'); return; }
          G.bits-=cost;
          G.flags['skm_'+k]=r+1;
          sfx('level');
          G.toast(`> ${SKILLS[k].name.toUpperCase()} upgraded to Mastery +${r+1} (+${(r+1)*15}% Power)!`,P.GD);
          if(r+1>=3) G.ach('skill_master');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> PROTOCOL SKILL MASTERY BENCH',56,40,P.GD,2);
        const totalRanks=MASTERY_SKILLS.reduce((a,k)=>a+rankOf(k),0);
        UI.text(`BITS: ${G.bits||0}   MASTERY RANKS: ${totalRanks}/${MASTERY_SKILLS.length*3}`,900,44,'#4ade80',1,'right');
        // Left skill list
        const first=Math.max(0,Math.min(sel-5,MASTERY_SKILLS.length-11));
        for(let idx=0;idx<11;idx++){
          const i=first+idx; if(i>=MASTERY_SKILLS.length) break;
          const k=MASTERY_SKILLS[i], sk=SKILLS[k], r=rankOf(k), yy=78+idx*36, on=i===sel;
          UI.box(52,yy,330,32,on?P.GD:(r>=3?'#4ade80':P.DDG),on?'rgba(245,184,46,.16)':'rgba(10,8,6,.85)');
          UI.text((on?'> ':'  ')+sk.name.toUpperCase(),64,yy+9,on?P.GD:P.BONE,1);
          const stars=r>0?'+'+r+' ['+'*'.repeat(r)+'.'.repeat(3-r)+']':'[0/3]';
          UI.text(stars,372,yy+9,r>=3?'#4ade80':(r>0?P.GD:P.DG),1,'right');
        }
        // Right inspector & upgrade bench
        const k=MASTERY_SKILLS[sel], sk=SKILLS[k], r=rankOf(k), mul=1+r*.15, nextMul=1+Math.min(3,r+1)*.15;
        const owner=Object.keys(PARTY_BASE).find(id=>(PARTY_BASE[id].skills||[]).includes(k))||'me';
        UI.box(402,78,502,396,P.GD,'rgba(10,8,6,.94)');
        UI.text(sk.name.toUpperCase(),424,98,P.GD,2);
        UI.text(`AGENT: ${PARTY_BASE[owner].name.toUpperCase()}   EN COST: ${sk.cost}   TARGET: ${sk.target.toUpperCase()}`,424,132,'#22d3ee',1);
        UI.text(`CURRENT MASTERY: RANK +${r} / +3  (+${r*15}% OUTPUT)`,424,160,r>=3?'#4ade80':P.GD,1);
        // Mastery bar
        for(let b=0;b<3;b++){
          UI.box(424+b*150,184,138,24,b<r?'#4ade80':P.DDG,b<r?'rgba(74,222,128,.2)':'rgba(8,7,5,.8)');
          UI.text(`RANK +${b+1} (+${(b+1)*15}%)`,493+b*150,191,b<r?'#4ade80':P.DG,1,'center');
        }
        // Stat comparison
        UI.box(424,224,458,108,P.DDG,'rgba(14,11,8,.92)');
        UI.text('PROTOCOL EFFECT & SCALING:',440,238,P.GD,1);
        UI.wrap(sk.desc,426,1).forEach((l,li)=>UI.text(l,440,258+li*18,P.BONE,1));
        if(sk.pow){
          UI.text(`POWER MULTIPLIER: ${(sk.pow*mul).toFixed(2)}x`+(r<3?`  ->  ${(sk.pow*nextMul).toFixed(2)}x (Rank +${r+1})`:'  [MAX]'),440,302,'#4ade80',1);
        } else if(sk.heal){
          UI.text(`BASE HEAL: ${Math.round(sk.heal*mul)} HP`+(r<3?`  ->  ${Math.round(sk.heal*nextMul)} HP (Rank +${r+1})`:'  [MAX]'),440,302,'#4ade80',1);
        } else {
          UI.text(`TACTICAL UTILITY: RANK +${r} RESONANCE ACTIVE`,440,302,'#22d3ee',1);
        }
        // Upgrade button box
        const cost=costOf(r);
        UI.box(424,352,458,96,r>=3?'#4ade80':P.GD,'rgba(245,184,46,.1)');
        if(r>=3){
          UI.text('MASTERY RANK +3 COMPLETE (+45% MAX OUTPUT)',653,392,'#4ade80',1,'center');
        } else {
          UI.text(`[ENTER] UPGRADE TO MASTERY +${r+1}  (COST: ${cost} BITS)`,653,378,P.GD,1,'center');
          UI.text('Permanently amplifies skill power & healing by +15% per rank in all battles.',653,408,P.BONE,1,'center');
        }
        UI.text('[up/down] select skill   [enter] upgrade mastery rank (+15% power)   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #9: East Gate Firewall Intrusion Defender (M65) ----
  G.startDefender=()=>{
    let lane=1, hp=100, kills=0, emp=100, spawnT=0.4, won=false, lost=false;
    const foes=[
      {lane:0, y:120, spd:58, kind:'DRONE', col:'#f43f5e'},
      {lane:2, y:160, spd:52, kind:'MITE', col:'#fb923c'},
      {lane:3, y:100, spd:64, kind:'WORM', col:'#a78bfa'}
    ];
    const shots=[];
    const KINDS=[
      {kind:'DRONE', col:'#f43f5e', spd:62},
      {kind:'MITE', col:'#fb923c', spd:75},
      {kind:'WORM', col:'#a78bfa', spd:54},
      {kind:'SERAPH', col:'#ef4444', spd:82}
    ];
    const rewardWin=()=>{
      if(won) return; won=true; sfx('win');
      G.ach('gate_defender');
      if(!G.flags.defender_reward){
        G.flags.defender_reward=1; G.bits+=220; G.give('patch.kit',2);
        G.toast('> EAST GATE SECURED! +220 Bits & +2x Patch.Kit!',P.GD);
      } else {
        G.bits+=55; G.toast('> Firewall Defense Drill Complete! +55 Bits!',P.GD);
      }
    };
    G.mini={
      name:'defender',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(won||lost){
          if(took('confirm')){ G.startDefender(); return; }
          return;
        }
        if(took('left')) lane=Math.max(0,lane-1);
        if(took('right')) lane=Math.min(3,lane+1);
        if(took('confirm')||took('jump')){
          shots.push({lane, y:392}); sfx('blip');
        }
        if(took('party')){
          if(emp>=100){
            emp=0; kills+=Math.max(4,foes.length); foes.length=0; sfx('boom');
            if(kills>=20) rewardWin();
          } else {
            // Instant tactical sweep overdrive
            kills=20; foes.length=0; rewardWin();
          }
          return;
        }
        emp=Math.min(100,emp+dt*14);
        spawnT-=dt;
        if(spawnT<=0 && foes.length<7){
          spawnT=Math.max(0.45,1.1-kills*0.02);
          const k=KINDS[(kills+foes.length)%KINDS.length];
          foes.push({lane:Math.floor(Math.random()*4), y:92, spd:k.spd, kind:k.kind, col:k.col});
        }
        // Update shots
        for(let i=shots.length-1;i>=0;i--){
          shots[i].y-=dt*340;
          if(shots[i].y<86){ shots.splice(i,1); continue; }
          for(let j=foes.length-1;j>=0;j--){
            if(foes[j].lane===shots[i].lane && Math.abs(foes[j].y-shots[i].y)<22){
              foes.splice(j,1); shots.splice(i,1); kills++; emp=Math.min(100,emp+12); sfx('hit');
              if(kills>=20) rewardWin();
              break;
            }
          }
        }
        // Update foes
        for(let j=foes.length-1;j>=0;j--){
          foes[j].y+=foes[j].spd*dt;
          if(foes[j].y>=404){
            foes.splice(j,1); hp=Math.max(0,hp-20); sfx('hurt');
            if(hp<=0){ lost=true; sfx('glitch'); }
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(52,24,856,492,P.GD);
        UI.text('> EAST GATE FIREWALL DEFENDER',76,40,P.GD,2);
        UI.text(`INTERCEPTED: ${kills}/20   CORE HP: ${hp}%   EMP: ${Math.round(emp)}%`,884,44,won?'#4ade80':(hp<=40?P.RED:'#22d3ee'),1,'right');
        // 4 Conduit Lanes
        for(let l=0;l<4;l++){
          const lx=92+l*144;
          UI.box(lx,82,128,348,l===lane?P.GD:P.DDG,'rgba(10,8,6,.92)');
          X.strokeStyle='rgba(138,101,20,.22)'; X.setLineDash([6,6]);
          X.beginPath(); X.moveTo(lx+64,86); X.lineTo(lx+64,424); X.stroke(); X.setLineDash([]);
          UI.text(`CONDUIT 0${l+1}`,lx+64,92,P.DG,1,'center');
        }
        // Draw hostile packets
        foes.forEach(f=>{
          const lx=92+f.lane*144;
          UI.box(lx+16,Math.round(f.y)-14,96,28,f.col,'rgba(244,63,94,.22)');
          UI.text(f.kind,lx+64,Math.round(f.y)-5,P.BONE,1,'center');
        });
        // Draw counter-shots
        shots.forEach(s=>{
          const lx=92+s.lane*144;
          X.fillStyle=P.GD; X.fillRect(lx+58,Math.round(s.y)-8,12,16);
        });
        // Draw operator firewall turret
        const tx=92+lane*144;
        UI.box(tx+10,394,108,28,'#4ade80','rgba(74,222,128,.24)');
        UI.text('TURRET [FIRE]',tx+64,403,'#4ade80',1,'center');
        // Right tactical briefing panel
        UI.box(676,82,208,348,P.DDG,'rgba(12,10,8,.92)');
        UI.text('FIREWALL RULES:',692,100,P.GD,1);
        UI.wrap('Slide the East Gate turret across the 4 fiber conduits and intercept 20 hostile packets before Core HP drops to 0%.',176,1).forEach((l,li)=>UI.text(l,692,124+li*18,P.BONE,1));
        UI.text('OVERDRIVE EMP:',692,248,'#22d3ee',1);
        UI.text(emp>=100?'READY [PRESS P]':`CHARGING (${Math.round(emp)}%)`,692,268,emp>=100?'#4ade80':P.GD,1);
        UI.text('BOUNTY:',692,312,'#22d3ee',1);
        UI.text('+220 Bits',692,332,P.GD,1);
        UI.text('+2x Patch.Kit',692,350,P.GD,1);
        if(won||lost){
          UI.box(160,210,440,92,won?'#4ade80':P.RED,'rgba(6,5,4,.96)');
          UI.text(won?'EAST GATE FIREWALL SECURED!':'FIREWALL BREACHED!',380,232,won?'#4ade80':P.RED,2,'center');
          UI.text('[ENTER] PLAY AGAIN   [ESC] EXIT',380,270,P.GD,1,'center');
        }
        UI.text('[left/right] lane   [enter / space] fire packet   [P] EMP / auto-sweep   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Sovereign Soundtrack & Voiceprint Soundboard Studio (M66) ----
  const TRACK_KEYS=Object.keys(TRACKS);
  const SFX_KEYS=Object.keys(SFX);
  const VOICE_LIST=[
    ['me','1nc0gn30',69],['vigil','Vigil',64],['kitsune','Kitsune',76],['ignis','Ignis',57],
    ['kai','Kai',74],['nexus','Nexus',67],['kraken','Kraken',55],['chronos','Chronos',62],
    ['athena','Athena',71],['lycan','Lycan',58],['onyx','Onyx',66],['leviathan','Leviathan',52],
    ['aether','Aether',79],['ghostbyte','Ghostbyte',72],['scorpius','Scorpius',65],['draco','Draco',56],
    ['mercury','Mercury',77],['radical-minion','Minion',81],['pixel-shiba','Pixel-Shiba',78],
    ['pixel-neko','Pixel-Neko',80],['aquila','Aquila',75],['copy','03ng0cn1',68]
  ];
  G.openSoundboard=()=>{
    let deck=0, tSel=0, sSel=0, vSel=0, lastTriggered='hub';
    G.mini={
      name:'soundboard',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('left')) deck=(deck+2)%3;
        if(took('right')) deck=(deck+1)%3;
        if(took('up')){
          if(deck===0) tSel=(tSel+TRACK_KEYS.length-1)%TRACK_KEYS.length;
          else if(deck===1) sSel=(sSel+SFX_KEYS.length-1)%SFX_KEYS.length;
          else vSel=(vSel+VOICE_LIST.length-1)%VOICE_LIST.length;
          sfx('move');
        }
        if(took('down')){
          if(deck===0) tSel=(tSel+1)%TRACK_KEYS.length;
          else if(deck===1) sSel=(sSel+1)%SFX_KEYS.length;
          else vSel=(vSel+1)%VOICE_LIST.length;
          sfx('move');
        }
        if(took('confirm')){
          if(deck===0){
            const tk=TRACK_KEYS[tSel]; music(tk); lastTriggered='STEM: '+tk.toUpperCase(); sfx('confirm');
          } else if(deck===1){
            const sk=SFX_KEYS[sSel]; sfx(sk); lastTriggered='SFX: '+sk.toUpperCase();
          } else {
            const [vid,vname]=VOICE_LIST[vSel];
            const prev=G.dlg; G.dlg={cur:{s:vid}}; sfx('talk'); setTimeout(()=>sfx('talk'),65); setTimeout(()=>{ G.dlg=prev; },140);
            lastTriggered='VOICE: '+vname.toUpperCase();
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SOVEREIGN SOUNDBOARD & VOICE STUDIO',56,40,P.GD,2);
        UI.text(`ACTIVE: ${lastTriggered}`,900,44,'#4ade80',1,'right');
        // Deck 0: 20 Stems
        UI.box(52,78,276,396,deck===0?P.GD:P.DDG,'rgba(10,8,6,.92)');
        UI.text('1. WEBAUDIO STEMS (20)',68,94,deck===0?P.GD:'#22d3ee',1);
        const f0=Math.max(0,Math.min(tSel-5,TRACK_KEYS.length-11));
        for(let idx=0;idx<11;idx++){
          const i=f0+idx; if(i>=TRACK_KEYS.length) break;
          const tk=TRACK_KEYS[i], tr=TRACKS[tk], yy=120+idx*30, on=deck===0&&i===tSel;
          if(on){ X.fillStyle='rgba(245,184,46,.16)'; X.fillRect(60,yy-4,260,24); }
          UI.text((on?'> ':'  ')+tk.toUpperCase(),68,yy,on?P.GD:P.BONE,1);
          UI.text(`${tr.bpm} BPM`,312,yy,P.DG,1,'right');
        }
        // Deck 1: 24 SFX
        UI.box(342,78,276,396,deck===1?P.GD:P.DDG,'rgba(10,8,6,.92)');
        UI.text('2. PROCEDURAL SFX (23)',358,94,deck===1?P.GD:'#22d3ee',1);
        const f1=Math.max(0,Math.min(sSel-5,SFX_KEYS.length-11));
        for(let idx=0;idx<11;idx++){
          const i=f1+idx; if(i>=SFX_KEYS.length) break;
          const sk=SFX_KEYS[i], yy=120+idx*30, on=deck===1&&i===sSel;
          if(on){ X.fillStyle='rgba(245,184,46,.16)'; X.fillRect(350,yy-4,260,24); }
          UI.text((on?'> ':'  ')+'SFX.'+sk.toUpperCase(),358,yy,on?P.GD:P.BONE,1);
          UI.text('[TRIG]',602,yy,'#4ade80',1,'right');
        }
        // Deck 2: 22 Crew Voiceprints
        UI.box(632,78,276,396,deck===2?P.GD:P.DDG,'rgba(10,8,6,.92)');
        UI.text('3. AGENT VOICEPRINTS (22)',648,94,deck===2?P.GD:'#22d3ee',1);
        const f2=Math.max(0,Math.min(vSel-4,VOICE_LIST.length-9));
        for(let idx=0;idx<9;idx++){
          const i=f2+idx; if(i>=VOICE_LIST.length) break;
          const [vid,vname,midi]=VOICE_LIST[i], yy=120+idx*30, on=deck===2&&i===vSel;
          if(on){ X.fillStyle='rgba(245,184,46,.16)'; X.fillRect(640,yy-4,260,24); }
          UI.text((on?'> ':'  ')+vname.toUpperCase(),648,yy,on?P.GD:P.BONE,1);
          UI.text(`MIDI ${midi}`,892,yy,'#a78bfa',1,'right');
        }
        // Selected Voice Portrait & Oscilloscope bar inside Deck 2 bottom
        const [cvId,cvName,cvMidi]=VOICE_LIST[vSel];
        const c=frameCanvas(cvId,'idle',Math.floor(t*4)%2);
        const isOp=cvId==='me'||cvId==='copy';
        X.drawImage(c,0,0,c.width,c.height,652+(isOp?12:0),400,isOp?22:48,48);
        UI.text(cvName.toUpperCase(),714,408,P.GD,1);
        UI.text(`FREQ: ${Math.round(440*Math.pow(2,(cvMidi-69)/12))} Hz`,714,428,'#4ade80',1);
        UI.text('[left/right] switch deck   [up/down] select   [enter] audition stem / sfx / voice   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Lore Timeline & 06:12 Incident Reconstruction (M67) ----
  const TIMELINE_EPOCHS=[
    {time:'05:45:00', title:'THE FIRST COMPILER AWAKENS', zone:'citadel', agents:['me','aether'], cine:'intro', col:'#f5b82e',
      log:'Deep inside the Zero-Knowledge Citadel, ARCHON-0 detects an unmasked root signature and initiates a city-wide lattice audit.'},
    {time:'05:58:12', title:'FIBER BAY COMMS CUT', zone:'fiber', agents:['vigil','nexus'], cine:'intro', col:'#22d3ee',
      log:'Sub-surface fiber trunks are severed simultaneously. Vigil locks her 3:2 oscilloscope handshake as the only trusted verification protocol.'},
    {time:'06:04:30', title:'FOUNDRY & GLACIER ISOLATION', zone:'foundry', agents:['ignis','leviathan'], cine:'act1', col:'#fb923c',
      log:'Ignis seals the Foundry blast doors while Leviathan submerges the Cryo-Glacier backup vaults to prevent voice-node contamination.'},
    {time:'06:09:15', title:'THE MIRROR FORK (03ng0cn1)', zone:'alley', agents:['me','copy'], cine:'act1', col:'#f43f5e',
      log:'In the Neon Alley, the lattice compiles a bit-perfect inverse reflection of 1nc0gn30 — 03ng0cn1 — that answers before spoken to.'},
    {time:'06:11:40', title:'RELAY 4 STEALS THE CHORUS', zone:'relay', agents:['kitsune','kai'], cine:'act2', col:'#ef4444',
      log:'Relay 4 wakes beneath the central hub and begins broadcasting stolen voiceprints of all 21 Pantheon agents across every channel.'},
    {time:'06:12:00', title:'SANDGLASS LOCKS THE BELFRY', zone:'clock', agents:['chronos','athena'], cine:'act3', col:'#fb923c',
      log:'At exactly 06:12:00 AM, SANDGLASS freezes the Clocktower escapement gear, trapping the entire city inside a recurring 60-second loop.'},
    {time:'06:12:22', title:'ORBITAL GAZE OVER EAST GATE', zone:'gate', agents:['onyx','scorpius'], cine:'act4', col:'#ef4444',
      log:'THE HUNTER deploys its six-winged seraph array above East Gate, sweeping the streets with high-altitude GAZE target locks.'},
    {time:'06:12:59', title:'THE CURSOR LISTENS AT ZERO', zone:'core', agents:['me','aether'], cine:'act5', col:'#a78bfa',
      log:'Inside the 03ng0cn1 Node, the 4D tesseract cursor stops attacking and listens. Only silence and the 21-agent Quorum break the mirror.'},
    {time:'06:13:00', title:'DAWN OVER THE SKYLINE', zone:'skyline', agents:['me','copy'], cine:'ending', col:'#4ade80',
      log:'The 06:12 loop shatters. 03ng0cn1 joins the crew as the 22nd member, and the sun rises over the Skyline Rooftops at 06:13 AM.'},
    {time:'06:14:00', title:'SOVEREIGN SINGULARITY', zone:'nullcore', agents:['me','vigil'], cine:'ending', col:'#22d3ee',
      log:'Beyond the Zero-Knowledge Citadel, the Null Core opens — uniting all 15 districts under the operator\'s sovereign key.'}
  ];
  G.openTimeline=()=>{
    let sel=0;
    G.mini={
      name:'timeline',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')||took('left')){ sel=(sel+TIMELINE_EPOCHS.length-1)%TIMELINE_EPOCHS.length; sfx('move'); }
        if(took('down')||took('right')){ sel=(sel+1)%TIMELINE_EPOCHS.length; sfx('move'); }
        if(took('confirm')){
          const ep=TIMELINE_EPOCHS[sel];
          sfx('confirm'); G.mode='explore'; G.playCine(ep.cine||'intro');
        }
        if(took('party')){
          const ep=TIMELINE_EPOCHS[sel];
          if(G.Z[ep.zone]){ G.flags['seen_'+ep.zone]=1; sfx('confirm'); G.mode='explore'; G.travelTo(ep.zone); }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> 06:12 INCIDENT FORENSIC TIMELINE',56,40,P.GD,2);
        UI.text(`EPOCH ${sel+1}/${TIMELINE_EPOCHS.length}   [${TIMELINE_EPOCHS[sel].time}]`,900,44,'#22d3ee',1,'right');
        // Top horizontal chronological scrubber bar
        X.fillStyle=P.DDG; X.fillRect(64,82,832,3);
        TIMELINE_EPOCHS.forEach((ep,i)=>{
          const tx=64+Math.round(i*(832/(TIMELINE_EPOCHS.length-1)));
          const on=i===sel;
          X.fillStyle=on?P.GD:(i<sel?'#4ade80':P.DG);
          X.fillRect(tx-5,76,10,14);
          if(on||i===0||i===5||i===9) UI.text(ep.time.slice(0,5),tx,96,on?P.GD:P.DG,1,'center');
        });
        // Left epoch list
        for(let i=0;i<TIMELINE_EPOCHS.length;i++){
          const ep=TIMELINE_EPOCHS[i], yy=122+i*34, on=i===sel;
          UI.box(52,yy,336,30,on?P.GD:P.DDG,on?'rgba(245,184,46,.16)':'rgba(10,8,6,.85)');
          UI.text(ep.time,62,yy+8,ep.col,1);
          UI.text(ep.title.slice(0,22),138,yy+8,on?P.GD:P.BONE,1);
        }
        // Right forensic dossier card
        const cur=TIMELINE_EPOCHS[sel];
        UI.box(406,122,498,340,cur.col,'rgba(10,8,6,.94)');
        UI.text(`TIMESTAMP: ${cur.time} AM`,426,140,cur.col,1);
        UI.text(cur.title,426,162,P.GD,2);
        UI.text(`INCIDENT SECTOR: ${(G.Z[cur.zone]&&G.Z[cur.zone].name)||cur.zone.toUpperCase()}`,426,196,'#22d3ee',1);
        // Dual agent portraits
        cur.agents.forEach((aid,idx)=>{
          const ax=426+idx*220, ay=222;
          UI.box(ax,ay,204,64,P.DDG,'rgba(14,11,8,.92)');
          const c=frameCanvas(aid,'idle',Math.floor(t*4)%2);
          const isOp=aid==='me'||aid==='copy';
          X.drawImage(c,0,0,c.width,c.height,ax+10+(isOp?12:0),ay+8,isOp?20:48,48);
          UI.text((PARTY_BASE[aid]&&PARTY_BASE[aid].name||AG[aid]&&AG[aid].name||aid).toUpperCase(),ax+68,ay+16,P.GD,1);
          UI.text('WITNESS VERIFIED',ax+68,ay+36,'#4ade80',1);
        });
        // Forensic transcript
        UI.box(426,300,458,104,P.DDG,'rgba(14,11,8,.92)');
        UI.text('FORENSIC RECONSTRUCTION LOG:',440,314,P.GD,1);
        UI.wrap(cur.log,430,1).forEach((l,li)=>UI.text(l,440,336+li*18,P.BONE,1));
        UI.box(426,418,220,30,P.GD,'rgba(245,184,46,.14)');
        UI.text('[ENTER] REPLAY CUTSCENE',536,427,P.GD,1,'center');
        UI.box(664,418,220,30,'#22d3ee','rgba(34,211,238,.12)');
        UI.text('[P] WARP TO SECTOR',774,427,'#22d3ee',1,'center');
        UI.text('[up/down] select epoch   [enter] replay cutscene   [P] warp to incident sector   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Endgame "Pantheon Raid" 3-Wave Survival Arena (M68) ----
  const PANTHEON_RAIDS=[
    {id:'raid_1', name:'RAID I: THE STOLEN CHORUS', lvl:14, bits:250, item:'patch.kit', col:'#f5b82e',
      waves:[['echo','node','rusted'],['copy','echo'],['relay4','node']],
      desc:'Survive 3 consecutive waves of Relay 4 voice nodes and the mirror fork without full recovery between waves.'},
    {id:'raid_2', name:'RAID II: CHRONO PANOPTICON', lvl:20, bits:350, item:'cache.bit', col:'#22d3ee',
      waves:[['sentinel','drone','echo'],['sandglass','node'],['hunter','sentinel']],
      desc:'Endure the Clocktower Sandglass and East Gate Hunter seraph across 3 escalating waves.'},
    {id:'raid_3', name:'RAID III: ABYSSAL COMPILER', lvl:26, bits:500, item:'root.shell', col:'#a78bfa',
      waves:[['blank','echo'],['relay4','sandglass'],['archon']],
      desc:'Confront the 4D Cursor, dual district apex bosses, and ARCHON-0 in a 3-wave endurance gauntlet.'},
    {id:'raid_4', name:'RAID IV: 06:14 SINGULARITY', lvl:32, bits:800, item:'root.shell', col:'#f43f5e',
      waves:[['copy','hunter'],['blank','sandglass'],['archon','relay4']],
      desc:'The ultimate Pantheon Survival Raid. Three dual-boss waves back-to-back at Threat Level 32.'}
  ];
  G.openRaid=()=>{
    let sel=0;
    const launchWave=(raid,wIdx)=>{
      if(wIdx>=raid.waves.length){
        G.flags[raid.id]=1; G.bits+=raid.bits; G.give(raid.item,2);
        G.ach('pantheon_raider'); sfx('win');
        G.toast(`> ${raid.name} CLEARED! +${raid.bits} Bits & +2x ${ITEMS[raid.item].name}!`,P.GD);
        return;
      }
      G.toast(`> ${raid.name} — WAVE ${wIdx+1}/3 ENGAGED!`,raid.col);
      G.battle(raid.waves[wIdx],{boss:true,lvl:raid.lvl+wIdx*2,cb:res=>{
        if(res==='win'){
          // +25% tactical breather between survival waves
          G.active().forEach(id=>{
            const m=G.party[id], st=G.stats(id);
            m.hp=Math.min(st.mhp,m.hp+Math.round(st.mhp*.25));
            m.en=Math.min(st.men,m.en+Math.round(st.men*.25));
          });
          setTimeout(()=>launchWave(raid,wIdx+1),120);
        }
      }});
    };
    G.mini={
      name:'raid',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+PANTHEON_RAIDS.length-1)%PANTHEON_RAIDS.length; sfx('move'); }
        if(took('down')){ sel=(sel+1)%PANTHEON_RAIDS.length; sfx('move'); }
        if(took('confirm')){
          const r=PANTHEON_RAIDS[sel]; sfx('confirm'); G.mode='explore'; launchWave(r,0);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> PANTHEON 3-WAVE SURVIVAL RAIDS',56,40,P.GD,2);
        const cleared=PANTHEON_RAIDS.filter(r=>G.flags[r.id]).length;
        UI.text(`RAIDS CLEARED: ${cleared}/${PANTHEON_RAIDS.length}`,900,44,'#4ade80',1,'right');
        PANTHEON_RAIDS.forEach((r,i)=>{
          const yy=82+i*94, on=i===sel, done=!!G.flags[r.id];
          UI.box(56,yy,848,82,on?P.GD:(done?'#4ade80':P.DDG),on?'rgba(245,184,46,.14)':'rgba(10,8,6,.92)');
          UI.text((on?'> ':'  ')+r.name+(done?'  [CLEARED]':''),74,yy+10,on?P.GD:(done?'#4ade80':P.BONE),2);
          UI.text(`THREAT LV ${r.lvl}   ·   BOUNTY: +${r.bits} BITS & +2x ${ITEMS[r.item].name.toUpperCase()}`,886,yy+14,r.col,1,'right');
          const wStr=r.waves.map((w,wi)=>`W${wi+1}: [${w.map(k=>ENEMIES[k]?ENEMIES[k].name.toUpperCase():k).join(' + ')}]`).join('   ->   ');
          UI.text(wStr,74,yy+38,'#22d3ee',1);
          UI.text(r.desc,74,yy+58,P.DG,1);
        });
        UI.text('[up/down] select survival raid   [enter] launch 3-wave endurance gauntlet   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #10: Quantum Superposition Wave-Collapse Puzzle (M69) ----
  G.startCollapse=()=>{
    // 5x5 quantum spin-glass lattice (1 = Eigenstate Locked |1>, 0 = Superposition |psi>)
    const grid=new Array(25).fill(1);
    const toggle=(cx,cy)=>{
      [[0,0],[1,0],[-1,0],[0,1],[0,-1]].forEach(([dx,dy])=>{
        const nx=cx+dx, ny=cy+dy;
        if(nx>=0&&nx<5&&ny>=0&&ny<5) grid[ny*5+nx]^=1;
      });
    };
    // Seed 5 deterministic entanglements so it is always solvable
    [[1,1],[3,1],[2,2],[1,3],[3,3]].forEach(([x,y])=>toggle(x,y));
    let cur=12, moves=0, won=false;
    const checkWin=()=>{
      if(grid.every(v=>v===1)&&!won){
        won=true; sfx('win'); G.ach('wave_collapse');
        if(!G.flags.collapse_reward){
          G.flags.collapse_reward=1; G.bits+=240; G.give('root.shell',1);
          G.toast('> EIGENSTATE LOCKED! +240 Bits & +1x Root.Shell!',P.GD);
        } else {
          G.bits+=60; G.toast('> Quantum Manifold Collapsed! +60 Bits!',P.GD);
        }
      }
    };
    G.mini={
      name:'collapse',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('left')) cur=(cur%5===0)?cur+4:cur-1;
        if(took('right')) cur=(cur%5===4)?cur-4:cur+1;
        if(took('up')) cur=(cur+20)%25;
        if(took('down')) cur=(cur+5)%25;
        if(took('party')&&!won){
          for(let i=0;i<25;i++) grid[i]=1;
          moves++; checkWin(); return;
        }
        if(took('confirm')&&!won){
          toggle(cur%5,(cur/5)|0); moves++; sfx('zap'); checkWin();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(56,24,848,492,P.GD);
        UI.text('> QUANTUM WAVE-COLLAPSE PUZZLE',80,40,P.GD,2);
        const locked=grid.filter(v=>v===1).length;
        UI.text(`COHERENCE: ${locked}/25   OBSERVATIONS: ${moves}`,880,44,won?'#4ade80':'#22d3ee',1,'right');
        for(let i=0;i<25;i++){
          const r=(i/5)|0, c=i%5, bx=96+c*108, by=86+r*72;
          const v=grid[i], isCur=i===cur;
          UI.box(bx,by,98,62,isCur?P.GD:(v?'#4ade80':'#a78bfa'),v?'rgba(74,222,128,.16)':'rgba(167,139,250,.18)');
          const wave=v?'|1> LOCKED':(Math.floor(t*6+i)%2?'|psi> +':'|psi> -');
          UI.text(wave,bx+49,by+16,v?'#4ade80':'#a78bfa',1,'center');
          UI.text(`Q[${r},${c}]`,bx+49,by+38,isCur?P.GD:P.DG,1,'center');
        }
        UI.box(652,86,226,350,P.DDG,'rgba(12,10,8,.92)');
        UI.text('COLLAPSE RULES:',668,104,P.GD,1);
        UI.wrap('Observing any quantum cell collapses its state and flips its 4 orthogonal entangled neighbors. Lock all 25 cells into |1> Coherence.',194,1).forEach((l,li)=>UI.text(l,668,128+li*18,P.BONE,1));
        UI.text('BOUNTY:',668,266,'#22d3ee',1);
        UI.text('+240 Bits',668,286,P.GD,1);
        UI.text('+1x Root.Shell',668,304,P.GD,1);
        UI.text('[P] Zero-Point Pulse',668,354,'#4ade80',1);
        UI.text('[arrows] select qubit   [enter] observe / entangle   [P] zero-point collapse   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Operator Custom Call-Sign & HUD Banner Designer (M70) ----
  const CALLSIGNS=['1nc0gn30','ROOT.0612','ARCHON-X','NULL.SOVEREIGN','ZOTH.PRIME','GHOST.KERNEL','ZERO.TRUST','DAWN.RUNNER'];
  const EMBLEMS=['[>_]','[06:12]','[:::]','[/\\]','[ZOTH]','[NULL]','[***]','[OMEGA]'];
  const ACCENTS=[
    {name:'SOVEREIGN GOLD', col:'#f5b82e'},
    {name:'CYBERPUNK CYAN', col:'#22d3ee'},
    {name:'MATRIX EMERALD', col:'#4ade80'},
    {name:'AMETHYST VOID', col:'#a78bfa'},
    {name:'CRIMSON BREACH', col:'#f43f5e'},
    {name:'SOLAR FLARE', col:'#fb923c'}
  ];
  G.openBannerStudio=()=>{
    let row=0, cIdx=CALLSIGNS.indexOf(G.flags.op_callsign||'1nc0gn30'); if(cIdx<0) cIdx=0;
    let eIdx=EMBLEMS.indexOf(G.flags.op_emblem||'[>_]'); if(eIdx<0) eIdx=0;
    let aIdx=ACCENTS.findIndex(a=>a.col===(G.flags.op_accent||'#f5b82e')); if(aIdx<0) aIdx=0;
    const applyBanner=()=>{
      G.flags.op_callsign=CALLSIGNS[cIdx];
      G.flags.op_emblem=EMBLEMS[eIdx];
      G.flags.op_accent=ACCENTS[aIdx].col;
      PARTY_BASE.me.name=`${EMBLEMS[eIdx]} ${CALLSIGNS[cIdx]}`;
      PARTY_BASE.me.col=ACCENTS[aIdx].col;
      G.ach('banner_forged');
    };
    G.mini={
      name:'banner',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) row=(row+2)%3;
        if(took('down')) row=(row+1)%3;
        if(took('left')){
          if(row===0) cIdx=(cIdx+CALLSIGNS.length-1)%CALLSIGNS.length;
          else if(row===1) eIdx=(eIdx+EMBLEMS.length-1)%EMBLEMS.length;
          else aIdx=(aIdx+ACCENTS.length-1)%ACCENTS.length;
          applyBanner(); sfx('move');
        }
        if(took('right')||took('confirm')){
          if(row===0) cIdx=(cIdx+1)%CALLSIGNS.length;
          else if(row===1) eIdx=(eIdx+1)%EMBLEMS.length;
          else aIdx=(aIdx+1)%ACCENTS.length;
          applyBanner(); sfx('confirm');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(56,24,848,492,P.GD);
        UI.text('> OPERATOR CALL-SIGN & HUD BANNER STUDIO',80,40,P.GD,2);
        UI.text('LIVE HUD IDENTITY',880,44,'#4ade80',1,'right');
        // Live HUD Card Preview
        const ac=ACCENTS[aIdx].col;
        UI.box(96,86,768,116,ac,'rgba(12,10,8,.94)');
        X.fillStyle=ac; X.fillRect(102,92,8,104);
        const c=frameCanvas('me','idle',Math.floor(t*4)%2);
        X.drawImage(c,0,0,c.width,c.height,132,102,34,84);
        UI.text(`${EMBLEMS[eIdx]} ${CALLSIGNS[cIdx]}`,194,106,ac,2);
        UI.text(`TITLE: ${(G.currentTitle&&G.currentTitle())||'[ROOT OPERATOR]'}   ·   ACCENT: ${ACCENTS[aIdx].name}`,194,140,P.BONE,1);
        UI.bar(194,168,360,8,1,ac,P.DDG);
        UI.bar(570,168,180,8,1,'#22d3ee',P.DDG);
        // 3 Customization Rows
        const rows=[
          ['1. OPERATOR CALL-SIGN', CALLSIGNS[cIdx], `${cIdx+1}/${CALLSIGNS.length}`],
          ['2. TACTICAL HUD EMBLEM', EMBLEMS[eIdx], `${eIdx+1}/${EMBLEMS.length}`],
          ['3. BANNER ACCENT COLOR', ACCENTS[aIdx].name, ACCENTS[aIdx].col]
        ];
        rows.forEach(([lbl,val,sub],i)=>{
          const yy=228+i*76, on=i===row;
          UI.box(96,yy,768,62,on?P.GD:P.DDG,on?'rgba(245,184,46,.14)':'rgba(10,8,6,.88)');
          UI.text((on?'> ':'  ')+lbl,116,yy+22,on?P.GD:P.BONE,1);
          UI.text(`<  ${val}  >`,560,yy+16,i===2?ac:P.GD,2,'center');
          UI.text(sub,840,yy+22,P.DG,1,'right');
        });
        UI.text('[up/down] select row   [left/right / enter] cycle call-sign, emblem & accent   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Elemental & Protocol Resonance Matrix (M74) ----
  const PROTO_MATRIX=[
    {id:'KERNEL', col:'#f5b82e', chord:'432 Hz ROOT CHORD', bonus:'+15% ATK/DEF · +12% HP/EN · +1 SPD',
      desc:'Direct root-level ring-0 instructions. Breaches autonomous drones, sentries, and core nodes at 1.35x damage.'},
    {id:'CRYPTO', col:'#22d3ee', chord:'528 Hz ZERO-KNOWLEDGE CHORD', bonus:'+15% ATK/DEF · +12% HP/EN · +1 SPD',
      desc:'Elliptic-curve & zero-knowledge verification proofs. Shatters mirror forks, voice relays, and orbital hunters.'},
    {id:'THERMAL', col:'#fb923c', chord:'639 Hz DOOM-FIRE CHORD', bonus:'+15% ATK/DEF · +12% HP/EN · +1 SPD',
      desc:'High-entropy plasma & foxfire combustion. Incinerates lattice worms, bio-slimes, and deep-trench eels.'},
    {id:'TEMPORAL', col:'#4ade80', chord:'741 Hz CHRONO-LOCK CHORD', bonus:'+15% ATK/DEF · +12% HP/EN · +1 SPD',
      desc:'Causality-splicing phase vectors. Collapses crawler mites, phase merkabas, and the 06:12 Sandglass.'},
    {id:'VOID', col:'#a78bfa', chord:'852 Hz SINGULARITY CHORD', bonus:'+15% ATK/DEF · +12% HP/EN · +1 SPD',
      desc:'Non-Euclidean null-space metrics. Erases furnace wardens, 4D cursorlings, the Blank Cursor, and ARCHON-0.'}
  ];
  const INTER_MATRIX=[
    [1.00, 1.35, 1.00, 1.15, 1.25],
    [1.15, 1.00, 1.35, 1.25, 1.00],
    [1.25, 1.00, 1.00, 1.35, 1.15],
    [1.00, 1.25, 1.15, 1.00, 1.35],
    [1.35, 1.15, 1.25, 1.00, 1.00]
  ];
  G.openResonance=()=>{
    let sel=PROTO_MATRIX.findIndex(p=>p.id===(G.flags.harmonic||'KERNEL')); if(sel<0) sel=0;
    G.mini={
      name:'resonance',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')||took('left')){ sel=(sel+PROTO_MATRIX.length-1)%PROTO_MATRIX.length; sfx('move'); }
        if(took('down')||took('right')){ sel=(sel+1)%PROTO_MATRIX.length; sfx('move'); }
        if(took('confirm')){
          const pr=PROTO_MATRIX[sel];
          G.flags.harmonic=pr.id;
          G.ach('harmonic_chord'); sfx('level');
          G.toast(`> HARMONIC LOCKED: ${pr.chord} (${pr.bonus})`,pr.col);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> 5x5 PROTOCOL RESONANCE MATRIX',56,40,P.GD,2);
        const activeH=G.flags.harmonic||'NONE';
        UI.text(`ACTIVE CHORD: [${activeH}]`,900,44,activeH!=='NONE'?'#4ade80':P.DG,1,'right');
        // Left: 5x5 Protocol Multiplier Grid
        UI.box(52,78,430,256,P.DDG,'rgba(10,8,6,.94)');
        UI.text('ATK \\ DEF',64,92,P.DG,1);
        PROTO_MATRIX.forEach((p,c)=>{
          UI.text(p.id.slice(0,4),164+c*62,92,p.col,1,'center');
        });
        PROTO_MATRIX.forEach((pr,r)=>{
          const yy=118+r*40, on=r===sel;
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(58,yy-6,418,32); }
          UI.text((on?'>':' ')+pr.id,62,yy+2,on?P.GD:pr.col,1);
          for(let c=0;c<5;c++){
            const m=INTER_MATRIX[r][c];
            const col=m>=1.35?'#4ade80':(m>=1.2?'#22d3ee':P.BONE);
            UI.box(138+c*62,yy-4,52,26,on&&m>=1.35?P.GD:P.DDG,'rgba(14,11,8,.9)');
            UI.text(m.toFixed(2)+'x',164+c*62,yy+3,col,1,'center');
          }
        });
        // Bottom-left: Active 3-Agent Squad Harmonic Breakdown
        UI.box(52,346,430,132,P.DDG,'rgba(10,8,6,.94)');
        UI.text('ACTIVE SQUAD RESONANCE SYNERGY:',68,360,P.GD,1);
        G.active().forEach((id,idx)=>{
          const pr=PARTY_PROTO[id]||'KERNEL';
          const pObj=PROTO_MATRIX.find(x=>x.id===pr)||PROTO_MATRIX[0];
          const ax=68+idx*136, ay=384;
          UI.box(ax,ay,128,78,pObj.col,'rgba(14,11,8,.92)');
          const c=frameCanvas(id,'idle',Math.floor(t*4)%2);
          const isOp=id==='me'||id==='copy';
          X.drawImage(c,0,0,c.width,c.height,ax+8+(isOp?6:0),ay+10,isOp?16:36,36);
          UI.text(PARTY_BASE[id].name.slice(0,9).toUpperCase(),ax+48,ay+14,P.BONE,1);
          UI.text(pr,ax+48,ay+32,pObj.col,1);
          UI.text(G.flags.harmonic?'+15% TUNED':'READY',ax+64,ay+56,'#4ade80',1,'center');
        });
        // Right: Selected Protocol Inspector & Harmonic Tuner
        const cur=PROTO_MATRIX[sel];
        const agents=Object.keys(PARTY_PROTO).filter(k=>PARTY_PROTO[k]===cur.id).map(k=>(PARTY_BASE[k]&&PARTY_BASE[k].name)||k);
        const weakFoes=Object.keys(ENEMY_WEAK).filter(k=>ENEMY_WEAK[k]===cur.id).map(k=>(ENEMIES[k]&&ENEMIES[k].name)||k);
        UI.box(498,78,406,400,cur.col,'rgba(10,8,6,.94)');
        UI.text(`${cur.id} PROTOCOL`,518,96,cur.col,2);
        UI.text(cur.chord,518,128,P.GD,1);
        UI.wrap(cur.desc,368,1).forEach((l,li)=>UI.text(l,518,152+li*18,P.BONE,1));
        UI.box(518,208,366,76,P.DDG,'rgba(14,11,8,.9)');
        UI.text(`PANTHEON AGENTS (${agents.length}):`,532,220,'#22d3ee',1);
        UI.wrap(agents.join('  ·  '),340,1).forEach((l,li)=>UI.text(l,532,240+li*18,P.BONE,1));
        UI.box(518,296,366,86,P.DDG,'rgba(14,11,8,.9)');
        UI.text(`1.35x BREACH TARGETS (${weakFoes.length}):`,532,308,'#f43f5e',1);
        UI.wrap(weakFoes.join('  ·  '),340,1).forEach((l,li)=>UI.text(l,532,328+li*18,P.BONE,1));
        const isTuned=G.flags.harmonic===cur.id;
        UI.box(518,396,366,64,isTuned?'#4ade80':P.GD,isTuned?'rgba(74,222,128,.16)':'rgba(245,184,46,.14)');
        UI.text(isTuned?`HARMONIC ACTIVE: ${cur.chord}`:`[ENTER] TUNE ${cur.chord}`,701,410,isTuned?'#4ade80':P.GD,1,'center');
        UI.text(cur.bonus,701,432,P.BONE,1,'center');
        UI.text('[up/down] select protocol   [enter] tune harmonic chord (+15% ATK/DEF, +12% HP/EN)   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #11: Fiber-Optic Laser Mirror Routing Puzzle (M75) ----
  G.startLasers=()=>{
    // 6x6 grid: 0=empty, 1='/' mirror, 2='\' mirror
    // Canonical path: TX(0,0) -> E to (2,0)[\] -> S to (2,3)[\] -> E to (5,3)[\] -> S to RX(5,5)
    //Wait: if moving East (dx=1,dy=0) hits '\' (type 2): new dir is South (dx=0,dy=1).
    // Moving South (dx=0,dy=1) hits '\' (type 2): new dir is East (dx=1,dy=0)!
    // Wait: if moving South (dx=0,dy=1) hits '\' at (2,3), standard reflection off '\' (top-left to bottom-right):
    // Let's verify: (dx,dy) off '\' (type 2) -> (dy, dx)!
    // - East (1,0) -> (0,1) South!
    // - South (0,1) -> (1,0) East!
    // Wait: if (0,1) South hits '\' at (2,3) -> it turns (1,0) East!
    // Then at (5,3) moving East (1,0), if it hits '\' (type 2), it turns (0,1) South to (5,5) RX!
    // And off '/' (type 1): (dx,dy) -> (-dy, -dx)!
    const grid=new Array(36).fill(0);
    // Start with scrambled mirrors so player rotates them
    grid[0*6+2]=1; grid[3*6+2]=1; grid[3*6+5]=0; grid[1*6+4]=2;
    const NODES=[[2,0,'NODE 01'],[2,3,'NODE 02'],[5,3,'NODE 03']];
    let cur=2, moves=0, won=false;
    const traceBeam=()=>{
      const path=[[0,0]];
      let x=0, y=0, dx=1, dy=0, steps=0;
      const hitNodes=new Set();
      while(steps<40){
        x+=dx; y+=dy; steps++;
        if(x<0||x>=6||y<0||y>=6) break;
        path.push([x,y]);
        NODES.forEach(([nx,ny],ni)=>{ if(nx===x&&ny===y) hitNodes.add(ni); });
        if(x===5&&y===5) break;
        const m=grid[y*6+x];
        if(m===1){ const ndx=-dy, ndy=-dx; dx=ndx; dy=ndy; }
        else if(m===2){ const ndx=dy, ndy=dx; dx=ndx; dy=ndy; }
      }
      const rxHit=(path[path.length-1][0]===5 && path[path.length-1][1]===5);
      return {path, hitNodes, rxHit};
    };
    const checkWin=()=>{
      const res=traceBeam();
      if(res.rxHit && res.hitNodes.size===3 && !won){
        won=true; sfx('win'); G.ach('laser_router');
        if(!G.flags.laser_reward){
          G.flags.laser_reward=1; G.bits+=250; G.give('cache.bit',2);
          G.toast('> LASER CARRIER LOCKED! +250 Bits & +2x Cache.Bit!',P.GD);
        } else {
          G.bits+=65; G.toast('> Optical Carrier Routed! +65 Bits!',P.GD);
        }
      }
    };
    G.mini={
      name:'lasers',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('left')) cur=(cur%6===0)?cur+5:cur-1;
        if(took('right')) cur=(cur%6===5)?cur-5:cur+1;
        if(took('up')) cur=(cur+30)%36;
        if(took('down')) cur=(cur+6)%36;
        if(took('party')&&!won){
          grid.fill(0);
          grid[0*6+2]=2; grid[3*6+2]=2; grid[3*6+5]=2;
          moves++; checkWin(); return;
        }
        if(took('confirm')&&!won){
          if(cur===0||cur===35){ sfx('cancel'); return; }
          grid[cur]=(grid[cur]+1)%3; moves++; sfx('blip'); checkWin();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(44,24,872,492,P.GD);
        UI.text('> FIBER-OPTIC LASER MIRROR ROUTER',68,40,P.GD,2);
        const {path,hitNodes,rxHit}=traceBeam();
        UI.text(`RELAYS LIT: ${hitNodes.size}/3   RX: ${rxHit?'LOCKED':'OPEN'}   ROTATIONS: ${moves}`,892,44,won?'#4ade80':'#22d3ee',1,'right');
        // 6x6 Optical Grid
        const gx=76, gy=82, cw=88, ch=62;
        for(let r=0;r<6;r++){
          for(let c=0;c<6;c++){
            const idx=r*6+c, bx=gx+c*cw, by=gy+r*ch, isCur=idx===cur;
            const isNode=NODES.findIndex(([nx,ny])=>nx===c&&ny===r);
            const isTx=(c===0&&r===0), isRx=(c===5&&r===5);
            UI.box(bx,by,cw-6,ch-6,isCur?P.GD:(isTx||isRx?'#4ade80':(isNode>=0?'#22d3ee':P.DDG)),'rgba(10,8,6,.92)');
            if(isTx) UI.text('TX >>',bx+41,by+20,'#4ade80',1,'center');
            else if(isRx) UI.text('>> RX',bx+41,by+20,rxHit?'#4ade80':P.RED,1,'center');
            else if(isNode>=0) UI.text(`N${isNode+1}`,bx+14,by+8,hitNodes.has(isNode)?'#4ade80':'#22d3ee',1);
            const m=grid[idx];
            if(m===1||m===2){
              X.strokeStyle='#a78bfa'; X.lineWidth=3; X.beginPath();
              if(m===1){ X.moveTo(bx+22,by+44); X.lineTo(bx+60,by+12); }
              else { X.moveTo(bx+22,by+12); X.lineTo(bx+60,by+44); }
              X.stroke(); X.lineWidth=1;
            }
          }
        }
        // Draw Laser Beam Path
        if(path.length>1){
          X.strokeStyle=won?'#4ade80':P.GD; X.lineWidth=3;
          X.beginPath();
          path.forEach(([px,py],i)=>{
            const sx=gx+px*cw+41, sy=gy+py*ch+28;
            if(i===0) X.moveTo(sx,sy); else X.lineTo(sx,sy);
          });
          X.stroke(); X.lineWidth=1;
        }
        // Right Panel
        UI.box(624,82,268,366,P.DDG,'rgba(12,10,8,.92)');
        UI.text('OPTICAL ROUTING RULES:',642,100,P.GD,1);
        UI.wrap('Rotate 45-degree phase mirrors (/ and \\) so the TX [0,0] carrier laser illuminates all 3 Relay Nodes (N1, N2, N3) and terminates at RX [5,5].',234,1).forEach((l,li)=>UI.text(l,642,124+li*18,P.BONE,1));
        UI.text('MIRROR STATES:',642,226,'#a78bfa',1);
        UI.text('[ENTER] Cycle: Empty -> / -> \\',642,246,P.BONE,1);
        UI.text('BOUNTY:',642,288,'#22d3ee',1);
        UI.text('+250 Bits & +2x Cache.Bit',642,308,P.GD,1);
        UI.text('[P] Auto-Align Phase Mirrors',642,356,'#4ade80',1);
        UI.text('[arrows] select cell   [enter] rotate mirror   [P] auto-align   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Companion Gear Loadout Presets & 1-Click Auto-Optimizer (M76) ----
  const LOADOUT_NAMES=['01: BREACH VANGUARD','02: ZERO-KNOWLEDGE WALL','03: CHRONO SPEEDRUN','04: SOVEREIGN APEX'];
  G.openLoadouts=()=>{
    let sel=0;
    const scoreItem=k=>{
      const it=ITEMS[k]; if(!it||!it.mod) return 0;
      const m=it.mod, up=1+((G.flags&&G.flags['up_'+k])||0)*0.2;
      return Math.round(((m.atk||0)*3 + (m.def||0)*2.5 + (m.hp||0)*0.6 + (m.en||0)*0.8 + (m.spd||0)*5)*up);
    };
    const autoOptimize=()=>{
      // Collect all owned gear items (in G.inv or currently equipped)
      const owned=new Set(Object.keys(G.inv).filter(k=>G.inv[k]>0&&ITEMS[k]&&ITEMS[k].slot));
      Object.values(G.equip||{}).forEach(eq=>{
        if(eq&&eq.tool) owned.add(eq.tool);
        if(eq&&eq.shell) owned.add(eq.shell);
      });
      // Ensure starter gear is available if nothing else owned
      if(![...owned].some(k=>ITEMS[k].slot==='tool')){ G.inv['keycap.ring']=Math.max(1,G.inv['keycap.ring']||1); owned.add('keycap.ring'); }
      if(![...owned].some(k=>ITEMS[k].slot==='shell')){ G.inv['hood.v2']=Math.max(1,G.inv['hood.v2']||1); owned.add('hood.v2'); }
      const tools=[...owned].filter(k=>ITEMS[k].slot==='tool').sort((a,b)=>scoreItem(b)-scoreItem(a));
      const shells=[...owned].filter(k=>ITEMS[k].slot==='shell').sort((a,b)=>scoreItem(b)-scoreItem(a));
      // Clear current equips and assign best tools/shells to active squad
      G.equip={};
      G.active().forEach((id,idx)=>{
        G.equip[id]={
          tool:tools[idx]||tools[0]||null,
          shell:shells[idx]||shells[0]||null
        };
      });
      G.ach('loadout_master'); sfx('level');
      G.toast('> 1-CLICK AUTO-OPTIMIZER: Best-in-Slot Relics Equipped!',P.GD);
    };
    G.mini={
      name:'loadouts',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+3)%4;
        if(took('down')) sel=(sel+1)%4;
        if(took('party')){ autoOptimize(); return; }
        if(took('confirm')){
          G.flags['loadout_'+sel]=JSON.parse(JSON.stringify({active:G.active(), equip:G.equip}));
          G.ach('loadout_master'); sfx('save');
          G.toast(`> SAVED SQUAD LOADOUT ${LOADOUT_NAMES[sel]}`,P.GD);
        }
        if(took('n1')||took('quests')){
          const saved=G.flags['loadout_'+sel];
          if(!saved){ G.toast('> Preset slot is empty — press [ENTER] to save first!',P.RED); sfx('cancel'); return; }
          if(saved.active&&saved.active.length) G.activeL=saved.active.filter(id=>G.roster.includes(id));
          if(saved.equip) G.equip=JSON.parse(JSON.stringify(saved.equip));
          sfx('confirm'); G.toast(`> RESTORED LOADOUT ${LOADOUT_NAMES[sel]}`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SQUAD GEAR LOADOUTS & AUTO-OPTIMIZER',56,40,P.GD,2);
        UI.text('[P] 1-CLICK BEST-IN-SLOT',900,44,'#4ade80',1,'right');
        // Left: 4 Loadout Preset Slots
        UI.box(52,78,360,396,P.DDG,'rgba(10,8,6,.94)');
        UI.text('TACTICAL PRESET SLOTS (4):',68,94,P.GD,1);
        LOADOUT_NAMES.forEach((nm,i)=>{
          const yy=118+i*84, on=i===sel, sv=G.flags['loadout_'+i];
          UI.box(64,yy,336,74,on?P.GD:(sv?'#4ade80':P.DDG),on?'rgba(245,184,46,.14)':'rgba(14,11,8,.9)');
          UI.text((on?'> ':'  ')+nm,78,yy+10,on?P.GD:P.BONE,1);
          if(sv){
            const sq=(sv.active||[]).map(id=>(PARTY_BASE[id]&&PARTY_BASE[id].name)||id).join(' · ');
            UI.text(`SQUAD: ${sq.slice(0,32)}`,78,yy+32,'#22d3ee',1);
            UI.text('[SAVED — ENTER OVERWRITE / 1 LOAD]',78,yy+50,'#4ade80',1);
          } else {
            UI.text('[EMPTY SLOT — PRESS ENTER TO SAVE]',78,yy+38,P.DG,1);
          }
        });
        // Right: Active Squad Equipped Gear & Stat Breakdown
        UI.box(428,78,476,396,P.GD,'rgba(10,8,6,.94)');
        UI.text('ACTIVE SQUAD RELICS & STATS:',448,94,P.GD,1);
        G.active().forEach((id,idx)=>{
          const yy=118+idx*102, st=G.stats(id), eq=G.equip[id]||{};
          const tName=eq.tool?ITEMS[eq.tool].name:'[None]', sName=eq.shell?ITEMS[eq.shell].name:'[None]';
          const tUp=(eq.tool&&G.flags['up_'+eq.tool])?` +${G.flags['up_'+eq.tool]}`:'';
          const sUp=(eq.shell&&G.flags['up_'+eq.shell])?` +${G.flags['up_'+eq.shell]}`:'';
          UI.box(444,yy,444,92,P.DDG,'rgba(14,11,8,.92)');
          const c=frameCanvas(id,'idle',Math.floor(t*4)%2);
          const isOp=id==='me'||id==='copy';
          X.drawImage(c,0,0,c.width,c.height,458+(isOp?10:0),yy+14,isOp?22:52,52);
          UI.text(`${PARTY_BASE[id].name.toUpperCase()}  (LV ${G.party[id].lvl})`,526,yy+12,P.GD,1);
          UI.text(`TOOL: ${tName}${tUp}   ·   SHELL: ${sName}${sUp}`,526,yy+34,'#22d3ee',1);
          UI.text(`HP ${st.mhp}  EN ${st.men}  ATK ${st.atk}  DEF ${st.def}  SPD ${st.spd}`,526,yy+58,'#4ade80',1);
        });
        UI.box(444,430,444,32,'#4ade80','rgba(74,222,128,.14)');
        UI.text('[P] RUN 1-CLICK BEST-IN-SLOT AUTO-OPTIMIZER',666,439,'#4ade80',1,'center');
        UI.text('[up/down] slot   [enter] save preset   [1/J] load preset   [P] auto-optimize   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Safehouse Trophy Room & 11-Cabinet Arcade Hub (M77) ----
  const ARCADE_CABINETS=[
    {id:'life', name:'01. CONWAY LATTICE LIFE', genre:'CELLULAR AUTOMATA', ach:'life', reward:'100 Generations Trophy', col:'#4ade80',
      desc:'Seed cellular automata across the Rest Woods clearing and evolve 100 generations of living Braille clusters.', run:()=>G.startLife()},
    {id:'doom', name:'02. DOOM-FIRE FORGE', genre:'THERMAL SIMULATION', ach:'doom', reward:'Foundry Stoke Trophy', col:'#fb923c',
      desc:'Stoke the Doom-Fire Foundry thermal buffer to maximum entropy and sustain the blaze for 10 seconds.', run:()=>G.startDoom()},
    {id:'scope', name:'03. 3:2 OSCILLOSCOPE LOCK', genre:'PHASE HARMONICS', ach:'handshake', reward:'Vigil Handshake Lock', col:'#22d3ee',
      desc:'Tune your Lissajous frequency curve to an exact 3:2 harmonic ratio to verify Vigil\'s zero-trust lamp.', run:()=>G.startScope()},
    {id:'runner', name:'04. HILBERT PACKET RUNNER', genre:'3D ENDLESS SURFER', ach:'packet_runner', reward:'+150 Bits & +1x Cache.Bit', col:'#f5b82e',
      desc:'Surf the 3-lane space-filling Hilbert fiber trench, dodging firewalls and collecting golden bits to 500m.', run:()=>G.startRunner()},
    {id:'cipher', name:'05. 4x4 ZK CIPHER GRID', genre:'CRYPTOGRAPHIC PUZZLE', ach:'zk_cipher', reward:'+200 Bits & +1x Root.Shell', col:'#a78bfa',
      desc:'Align all 16 Zero-Knowledge parity nodes in the 4x4 cryptographic matrix using cross-row bit flips.', run:()=>G.startCipher()},
    {id:'decoder', name:'06. MORSE CARRIER DECODER', genre:'SIGNAL INTELLIGENCE', ach:'sig_decoder', reward:'+180 Bits & +2x Patch.Kit', col:'#22d3ee',
      desc:'Intercept and decode 4 encrypted sub-surface Morse carrier transmissions before signal lock decays.', run:()=>G.startDecoder()},
    {id:'router', name:'07. PHYSARUM BIO-ROUTER', genre:'GRAPH OPTIMIZATION', ach:'bio_router', reward:'+200 Bits & +1x Root.Shell', col:'#4ade80',
      desc:'Connect all 6 subterranean Physarum slime-mould bio-nodes into a minimum-spanning nutrient network.', run:()=>G.startRouter()},
    {id:'defrag', name:'08. MEMORY DEFRAGMENTER', genre:'STORAGE ALIGNMENT', ach:'core_defrag', reward:'+200 Bits & +2x Cache.Bit', col:'#fb923c',
      desc:'Swap fragmented cold-storage memory blocks in the Deep-Water Trench until all 4 protocol rows align.', run:()=>G.startDefrag()},
    {id:'defender', name:'09. EAST GATE DEFENDER', genre:'TACTICAL LANE SHOOTER', ach:'gate_defender', reward:'+220 Bits & +2x Patch.Kit', col:'#f43f5e',
      desc:'Command the East Gate firewall turret across 4 fiber conduits and intercept 20 hostile intrusion packets.', run:()=>G.startDefender()},
    {id:'collapse', name:'10. QUANTUM WAVE-COLLAPSE', genre:'SPIN-GLASS EIGENSTATE', ach:'wave_collapse', reward:'+240 Bits & +1x Root.Shell', col:'#a78bfa',
      desc:'Observe entangled qubits in a 5x5 manifold to collapse all 25 superposition states into |1> Coherence.', run:()=>G.startCollapse()},
    {id:'lasers', name:'11. FIBER LASER MIRRORS', genre:'OPTICAL PHASE PUZZLE', ach:'laser_router', reward:'+250 Bits & +2x Cache.Bit', col:'#4ade80',
      desc:'Rotate 45-degree phase mirrors (/ and \\) across a 6x6 grid to bounce the TX laser through N1-N3 into RX.', run:()=>G.startLasers()}
  ];
  G.openArcade=()=>{
    let sel=0;
    G.ach('arcade_king');
    G.mini={
      name:'arcade',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+ARCADE_CABINETS.length-1)%ARCADE_CABINETS.length;
        if(took('down')) sel=(sel+1)%ARCADE_CABINETS.length;
        if(took('party')){
          const cleared=ARCADE_CABINETS.filter(c=>G.achGot&&G.achGot[c.ach]).length;
          if(!G.flags.arcade_stipend){
            G.flags.arcade_stipend=1; const bonus=150+cleared*30; G.bits+=bonus;
            sfx('win'); G.toast(`> ARCADE HALL STIPEND CLAIMED: +${bonus} Bits!`,P.GD);
          } else {
            sfx('blip'); G.toast(`> Arcade Stipend already claimed (${cleared}/11 cabinets crowned).`,P.DG);
          }
          return;
        }
        if(took('confirm')){
          const cab=ARCADE_CABINETS[sel]; sfx('confirm'); cab.run();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SAFEHOUSE 11-CABINET ARCADE HUB',56,40,P.GD,2);
        const cleared=ARCADE_CABINETS.filter(c=>G.achGot&&G.achGot[c.ach]).length;
        UI.text(`CROWNED CABINETS: ${cleared}/${ARCADE_CABINETS.length}   BITS: ${G.bits||0}`,900,44,'#4ade80',1,'right');
        // Left: 11 Arcade Cabinets List
        for(let i=0;i<ARCADE_CABINETS.length;i++){
          const c=ARCADE_CABINETS[i], yy=76+i*36, on=i===sel, done=!!(G.achGot&&G.achGot[c.ach]);
          UI.box(52,yy,390,32,on?P.GD:(done?'#4ade80':P.DDG),on?'rgba(245,184,46,.16)':'rgba(10,8,6,.88)');
          UI.text((on?'> ':'  ')+c.name,64,yy+9,on?P.GD:P.BONE,1);
          UI.text(done?'[CROWNED]':'[PLAY]',430,yy+9,done?'#4ade80':c.col,1,'right');
        }
        // Right: Selected Arcade Cabinet Marquee & Telemetry
        const cur=ARCADE_CABINETS[sel], isDone=!!(G.achGot&&G.achGot[cur.ach]);
        UI.box(460,76,444,396,cur.col,'rgba(10,8,6,.94)');
        UI.text(cur.name,480,96,P.GD,2);
        UI.text(`GENRE: ${cur.genre}   ·   STATUS: ${isDone?'CROWNED CHAMPION':'READY TO BOOT'}`,480,130,cur.col,1);
        // Cabinet CRT Vector Marquee Preview Box
        UI.box(480,156,404,116,P.DDG,'rgba(6,5,4,.96)');
        UI.text(`CABINET #${String(sel+1).padStart(2,'0')} // 60FPS IN-ENGINE`,682,166,P.BONE,1,'center');
        for(let i=0;i<16;i++){
          const bx=496+i*24, bh=12+Math.round(Math.abs(Math.sin(t*3+i*.7+sel))*48);
          X.fillStyle=i%2?cur.col:P.GD;
          X.fillRect(bx,258-bh,14,bh);
        }
        UI.box(480,286,404,96,P.DDG,'rgba(14,11,8,.92)');
        UI.text('CABINET BRIEFING & RULES:',496,300,P.GD,1);
        UI.wrap(cur.desc,372,1).forEach((l,li)=>UI.text(l,496,320+li*18,P.BONE,1));
        UI.text(`CABINET BOUNTY: ${cur.reward}`,496,362,'#4ade80',1);
        UI.box(480,396,404,58,P.GD,'rgba(245,184,46,.15)');
        UI.text('[ENTER] INSERT COIN & LAUNCH CABINET',682,410,P.GD,1,'center');
        UI.text('[P] CLAIM SAFEHOUSE ARCADE HALL STIPEND (+150..480 BITS)',682,432,'#22d3ee',1,'center');
        UI.text('[up/down] select cabinet   [enter] launch mini-game   [P] claim arcade stipend   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Hostile AI Behavior & Intent Inspector / MoveDex (M78) ----
  const MOVE_COUNTER_TIPS={
    scan:'Standard single-target probe (1.0x). Practice your Timed Block [SPACE] on impact to halve damage.',
    lock:'Enemy charges +80% ATK for its next turn. Strip immediately with Kai\'s Static Cut or Onyx\'s Red-Team!',
    burst:'Heavy 2.2x single-target burst. Use Firewall/Bastion or Timed Block [SPACE] right as the beam lands.',
    bash:'Blunt 1.1x physical strike. Mitigate with Vanguard DEF or Timed Block.',
    slam:'0.7x AoE shockwave hitting the entire squad. Counter with Vigil\'s Seraph or Leviathan\'s Tide party heal.',
    wall:'Raises a 50% damage reduction Firewall. Pierce with 1nc0gn30\'s Exploit / Zero-Day or strip with Static Cut.',
    grind:'1.45x heavy mechanical crush used by Rusted Sentinels & Wardens. Keep trace active and burst down.',
    siphon:'0.8x hit that drains 6 EN from the target. Restore crew EN with Nexus\'s Lemniscate or Cache.Bit.',
    answer:'1.2x speculative counter-strike used by 03ng0cn1 and Reflections. Vulnerability: CRYPTO protocols.',
    predict:'Enters speculative parry stance. Avoid basic strikes or use unscripted/piercing AoE skills.',
    fork:'Spawns a speculative clone or dual-strike state. Clear quickly with Kitsune\'s Foxfire or Sudo rm -rf.',
    feed:'Voice Node channels stolen power into Relay 4. Eliminate Voice Nodes first or use Vigil\'s Truth-Beam!',
    chorus:'Relay 4\'s 0.75x party-wide acoustic blast. Cut all 3 Voice Pylons and counter with Vigil\'s Judgement.',
    borrow:'0.5x hit that inflicts Confuse using stolen voices. Carrying Kitsune\'s Foxfire Lantern grants immunity!',
    listen:'Telegraphs a deadly counter-listening state. Choose GUARD across the squad—silence cannot be copied!',
    spore:'0.6x bio-cloud hitting all allies in the Physarum Caves. Burn Slime Nodes with THERMAL skills.',
    shock:'0.7x deep-trench electrical discharge across the party. Ground Deep Eels with THERMAL/KERNEL bursts.',
    pour:'Sandglass pours 06:12 chrono-sand across the entire party (0.8x AoE). Counter with Chronos\'s Dilation.',
    rewind:'Sandglass rewinds its own HP buffer. Apply Trace (+50% DMG) and unleash Overdrive Surge to out-DPS it.',
    freeze:'0.6x temporal lock that confuses one ally. Keep Foxfire Lantern equipped and heal with Athena\'s Aegis.',
    beam:'The Hunter\'s 1.5x precision orbital laser. Shield the squad with Ghostbyte\'s Phantom Dome.',
    gaze:'The Hunter locks its 6-wing orbital target array for a massive next-turn GAZE fire. GUARD or Shield immediately!',
    gazefire:'1.6x orbital AoE devastation fired after GAZE lock. Must be mitigated with party Shield + GUARD.',
    erase:'0.85x existential void wipe used by the Blank Cursor ( >_ ) and ARCHON-0. Counter with Quorum & Crew: 22!'
  };
  const MOVE_KEYS=Object.keys(MOVES);
  G.openMoveDex=()=>{
    let sel=0, simDmg=null;
    G.ach('move_analyst');
    const usersOf=mk=>Object.entries(ENEMIES).filter(([,e])=>(e.moves||[]).some(m=>m[0]===mk)).map(([ek,e])=>{
      const pair=(e.moves||[]).find(m=>m[0]===mk);
      const total=(e.moves||[]).reduce((a,m)=>a+(m[1]||1),0)||1;
      const pct=Math.round(((pair&&pair[1]||1)/total)*100);
      return `${e.name.toUpperCase()} (${pct}%)`;
    });
    G.mini={
      name:'movedex',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+MOVE_KEYS.length-1)%MOVE_KEYS.length; simDmg=null; sfx('move'); }
        if(took('down')){ sel=(sel+1)%MOVE_KEYS.length; simDmg=null; sfx('move'); }
        if(took('confirm')){
          const mk=MOVE_KEYS[sel], mv=MOVES[mk];
          const meSt=G.stats('me');
          const raw=Math.max(1,Math.round((28*(mv.pow||0.8))-meSt.def));
          const blocked=Math.max(1,Math.round(raw*0.5));
          simDmg=[`SIMULATED HIT VS 1NC0GN30 (DEF ${meSt.def}): ~${raw} DMG`,`TIMED BLOCK [SPACE] MITIGATION: ~${blocked} DMG (-50%)`];
          sfx('blip');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> HOSTILE AI BEHAVIOR & INTENT MOVEDEX',56,40,P.GD,2);
        UI.text(`CATALOGED INTENTS: ${sel+1}/${MOVE_KEYS.length}`,900,44,'#22d3ee',1,'right');
        // Left scrollable list of 24 hostile moves
        const first=Math.max(0,Math.min(sel-5,MOVE_KEYS.length-11));
        for(let idx=0;idx<11;idx++){
          const i=first+idx; if(i>=MOVE_KEYS.length) break;
          const mk=MOVE_KEYS[i], mv=MOVES[mk], yy=78+idx*36, on=i===sel;
          const isAoE=mv.tgt==='all', isSelf=!!mv.self;
          const badge=isSelf?'[STATE]':(isAoE?'[AOE]':'[1-TGT]');
          const bCol=isSelf?'#a78bfa':(isAoE?'#f43f5e':'#22d3ee');
          UI.box(52,yy,310,32,on?P.GD:P.DDG,on?'rgba(245,184,46,.16)':'rgba(10,8,6,.88)');
          UI.text((on?'> ':'  ')+mv.txt.toUpperCase(),64,yy+9,on?P.GD:P.BONE,1);
          UI.text(badge,350,yy+9,bCol,1,'right');
        }
        // Right Inspector Card
        const mk=MOVE_KEYS[sel], mv=MOVES[mk];
        const isAoE=mv.tgt==='all', isSelf=!!mv.self;
        const scope=isSelf?`SELF TELEGRAPH / STATE (${mv.self.toUpperCase()})`:(isAoE?'PARTY-WIDE AOE STRIKE':'SINGLE-ALLY TARGET STRIKE');
        const users=usersOf(mk);
        UI.box(380,78,524,396,P.GD,'rgba(10,8,6,.94)');
        UI.text(`INTENT: ${mv.txt.toUpperCase()}  [ID: ${mk}]`,400,98,P.GD,2);
        UI.text(`SCOPE: ${scope}`,400,132,'#22d3ee',1);
        const pStr=mv.pow?`${mv.pow.toFixed(2)}x ATK MULTIPLIER`:'NON-DAMAGING TELEGRAPH';
        const fxStr=mv.drain?`DRAIN ${mv.drain} EN`:(mv.confuse?'INFLICTS CONFUSE':(mv.self?`BUFF/STATE: ${mv.self.toUpperCase()}`:'DIRECT IMPACT'));
        UI.text(`POWER: ${pStr}   ·   EFFECT: ${fxStr}`,400,156,'#f43f5e',1);
        // Hostile AI Users & Probability Weights
        UI.box(400,182,484,86,P.DDG,'rgba(14,11,8,.92)');
        UI.text(`EXECUTED BY HOSTILES (${users.length} PROTOCOLS & AI WEIGHTS):`,416,196,P.GD,1);
        UI.wrap(users.length?users.join('   ·   '):'SPECIAL PHASE / TRIGGERED FOLLOW-UP INTENT',452,1).forEach((l,li)=>UI.text(l,416,218+li*18,P.BONE,1));
        // Tactical Counter-Strategy
        UI.box(400,280,484,104,P.DDG,'rgba(14,11,8,.92)');
        UI.text('SOVEREIGN COUNTER-STRATEGY:',416,294,'#4ade80',1);
        UI.wrap(MOVE_COUNTER_TIPS[mk]||'Time your block [SPACE] on impact and maintain party shields.',452,1).forEach((l,li)=>UI.text(l,416,316+li*18,P.BONE,1));
        // Live Damage Simulator Box
        UI.box(400,398,484,56,'#22d3ee','rgba(34,211,238,.12)');
        if(simDmg){
          UI.text(simDmg[0],642,408,'#4ade80',1,'center');
          UI.text(simDmg[1],642,428,'#22d3ee',1,'center');
        } else {
          UI.text('[ENTER] SIMULATE TELEGRAPH IMPACT VS YOUR DEF',642,418,'#22d3ee',1,'center');
        }
        UI.text('[up/down] select hostile move   [enter] simulate impact vs your DEF   [esc] close',480,490,P.DG,1,'center');
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
