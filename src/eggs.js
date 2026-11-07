// Easter eggs: hidden terminal + commands, Konami code, Game of Life and doom-fire mini-games, the oscilloscope
// handshake, title idle hook, achievements (persist across saves).
import * as UI from './ui.js';
import { P, THEMES, applyTheme } from './pal.js';
import { postU } from './render.js';
import { IN, took, KEYMAP, DEFAULT_KEYS } from './input.js';
import { AG, frameCanvas } from './sprites.js';
import { ENEMIES, MOVES, ITEMS, PARTY_BASE, SKILLS, QUESTS, DLG } from './data.js';
import { IDLE } from './content.js';
import { CINE } from './cine.js';
import { ENEMY_WEAK, PARTY_PROTO, AI_TACTICS } from './battle.js';
import { BLENDER_GEO } from './blender_geo.js';
import { TRACKS, SFX, AU } from './audio.js';
export const ACH={
  forge:['forged','apply a valid ZGL creation'], academy:['null certified','finish every Null Academy lab'], lab_prompt:['prompt engineer','lab 01'], lab_halluc:['source check','lab 02'], lab_inject:['data, not orders','lab 03'], lab_jail:['still no','lab 04'], lab_leak:['no secrets in prompts','lab 05'], lab_agent:['least privilege','lab 06'], lab_fake:['faces, not voices','lab 07'], lab_ctf:['capture the flag','lab 08'],
  tutorial:['first light','finish the tutorial'], dissipate:['dissipate','blink through a firewall'],
  first_win:['hello world','win a battle'], lvl10:['root','reach level 10'], lvl20:['kernel','reach level 20'], lvl30:['superuser','reach level 30'],
  boss_copy:['mirror, mirror','beat 03ng0cn1'], boss_relay4:['chorus','beat RELAY 4'], boss_sandglass:['six thirteen','beat SANDGLASS'], boss_hunter:['hunter offline','beat THE HUNTER'], boss_blank:['whoami','beat the cursor'], boss_archon:['the first compiler','beat ARCHON-0'], stack10:['stack overflow','clear floor 10 of The Infinite Stack'], pantheon_trial:['pantheon sovereign','clear all 6 stages of Boss Rush'], reforge5:['overclocked +5','overclock any gear to +5'], bounty10:['apex hunter','clear all 10 district elite bounties'], photographer:['06:12 postcard','capture a snapshot in Photo Mode'], daily_clear:['daily 06:12','complete a Daily Seeded Lattice Run'], packet_runner:['hilbert surfer','reach 500m in Packet Runner'], zk_cipher:['zero-knowledge solver','solve the 4x4 Protocol Cipher Grid'], sig_decoder:['carrier locked','decode all 4 encrypted carrier frequencies'], bio_router:['physarum architect','route all 6 Physarum bio-nodes'], core_defrag:['memory defragmented','defragment all 16 cold-storage memory blocks'], skill_master:['protocol savant','upgrade any skill to Mastery Rank +3'], gate_defender:['east gate sentinel','intercept 20 hostile packets in Firewall Defender'], pantheon_raider:['pantheon raider','complete a 3-wave Pantheon Survival Raid'], wave_collapse:['eigenstate locked','collapse the 5x5 quantum superposition manifold'], banner_forged:['call-sign sovereign','customize your operator call-sign & HUD banner'], harmonic_chord:['harmonic chord','lock a 5x5 Protocol Resonance Chord'], laser_router:['optical engineer','route the fiber-optic laser through all 3 nodes to RX'], loadout_master:['tactical quartermaster','auto-optimize or save a squad gear loadout preset'], arcade_king:['arcade sovereign','boot the 11-cabinet Safehouse Arcade Hub'], move_analyst:['intent analyst','analyze hostile AI move telegraphs in the MoveDex'], arena_architect:['arena architect','design a custom encounter in the Battle Builder'], contract_hunter:['streak contractor','complete a rotating Tactical Contract with streak bonus'], cyber_tamer:['cyber-familiar tamer','equip & bond with a Cyber-Familiar Pet Companion'], orrery_master:['celestial horologist','align all 5 orbital rings of the Chrono-Orrery to 06:12'], theater_director:['chronicle director','replay a cutscene or story dialogue in the Sovereign Theater'], trophy_collector:['stipend sovereign','claim a milestone stipend from the Achievement Trophy Case'], market_maker:['lattice whale','stake bits or harvest dividends on the Lattice Exchange'], sprite_animator:['pixel choreographer','inspect agent animation frames in the Sprite Studio'], cyber_augmented:['neural augmented','socket a Cybernetic Kernel Implant in the Implant Lab'], sonar_sweeper:['sonar sweeper','clear all 30 safe sectors in Sub-Lattice Sonar Mine Sweeper'], skull_sovereign:['laso sovereign','activate Challenge Skulls in the Battle Mutator Lab'], directory_navigator:['census sovereign','locate or warp to an agent via the World NPC Directory'], seed_architect:['seed architect','compile or clear a deterministic gauntlet in the Seed Lab'], radio_pirate:['pirate broadcaster','tune into sovereign frequencies on the Lattice Radio'], medal_general:['decorated sovereign','earn or pin a commendation on the Combat Medal Rack'], epilogue_chronicler:['06:13 chronicler','read the post-dawn epilogue chapters of the 22-agent crew'], triad_champion:['triad grandmaster','win a 3x3 Pantheon Triad tactical card match'], card_collector:['binder archivist','collect or mint foil cards in the 32-Card Pantheon Binder'], century_sovereign:['milestone 100','commemorate 100 sovereign milestones in the 3D Hall of Fame'], relic_engraver:['runesmith sovereign','engrave a custom name and protocol rune onto a relic'], theme_alchemist:['phosphor alchemist','forge a custom RGB phosphor palette in the Theme Forger'], arena_spectator:['high-roller patron','spectate and win a Bits wager in the AI vs AI Battle Arena'],
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
    if(c==='help') out('nmap  ping  patch  spectate  engrave  themeforge  hall  binder  triad  medals  epilogues  seedlab  radio  skulls  npcs  implants  mines  sprites  trophies2  exchange  orrery  theater  pets  builder  contracts  arcade  movedex  lasers  loadouts  resonance  collapse  banner  timeline  raid  defender  soundboard  meshes  mastery  wheel  defrag  singularity  ledger  combos  router  market  bosslab  shaders  composer  museum  weather  formation  decoder  dossiers  splits  daily  dojo  synth  logs  bonds  keys  runner  cipher  titles  bounty  stack  bossrush  reforge  bestiary  photo  saves  theme  warp  exit');
    else if(c==='spectate'||c==='wager'||c==='colosseum'){ out('[spectate] opening Automated AI vs AI Spectator & Wager Arena...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSpectator(); },40); }
    else if(c==='engrave'||c==='anvil'||c==='runes'){ out('[engrave] opening Weapon & Relic Custom Engraving Anvil...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openEngrave(); },40); }
    else if(c==='themeforge'||c==='palette'||c==='rgb'){ out('[themeforge] opening Interactive RGB Palette & Theme Forger...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openThemeForger(); },40); }
    else if(c==='hall'||c==='m100'||c==='halloffame'){ out('[hall] opening Milestone #100 Sovereign 3D Hall of Fame...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openHallOfFame(); },40); }
    else if(c==='binder'||c==='cardbinder'||c==='deck'){ out('[binder] opening Collectible 32-Card Pantheon Foil Binder...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openCardBinder(); },40); }
    else if(c==='triad'||c==='cards'){ out('[triad] launching Pantheon Triad 3x3 Tactical Card Battler...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startTriad(); },40); }
    else if(c==='medals'||c==='ribbons'){ out('[medals] opening Operator Combat Medal & Ribbon Rack...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openMedals(); },40); }
    else if(c==='epilogues'||c==='afterword'||c==='future'){ out('[epilogues] opening 22-Agent Post-Dawn Epilogue Chronicles...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openEpilogues(); },40); }
    else if(c==='seedlab'||c==='seeds'){ out('[seedlab] opening Procedural Dungeon Seed & Custom Run Lab...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSeedLab(); },40); }
    else if(c==='radio'||c==='tuner'||c==='fm'){ out('[radio] opening Sovereign Radio & Lo-Fi Broadcast Tuner...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openRadio(); },40); }
    else if(c==='skulls'||c==='mutators'){ out('[skulls] opening Dynamic Battle Mutator & Challenge Skull Lab...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSkulls(); },40); }
    else if(c==='npcs'||c==='directory'||c==='census'){ out('[npcs] opening Interactive World NPC Directory & Affinity Tracker...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openDirectory(); },40); }
    else if(c==='implants'||c==='cybernetics'||c==='neural'){ out('[implants] opening Cybernetic Kernel Implant Laboratory...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openImplants(); },40); }
    else if(c==='mines'||c==='sonar'||c==='sweeper'){ out('[mines] launching Sub-Lattice Sonar Mine Sweeper...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startSonarSweep(); },40); }
    else if(c==='sprites'||c==='animstudio'||c==='frames'){ out('[sprites] opening Interactive Sprite & Animation Frame Studio...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openSpriteStudio(); },40); }
    else if(c==='trophies2'||c==='stipends'||c==='achcase'){ out('[trophies2] opening Achievement Trophy Case & Stipends...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openTrophyCase(); },40); }
    else if(c==='exchange'||c==='stocks'||c==='stake'){ out('[exchange] opening Lattice Stock & Bit Staking Exchange...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openExchange(); },40); }
    else if(c==='orrery'||c==='planets'||c==='orbit'){ out('[orrery] launching Chrono-Orrery Planetary Alignment Puzzle...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.startOrrery(); },40); }
    else if(c==='theater'||c==='cutscenes'||c==='cinematics'){ out('[theater] opening Sovereign Dialogue & Cutscene Theater...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openTheater(); },40); }
    else if(c==='pets'||c==='familiars'){ out('[pets] opening Cyber-Familiar Pet Companion Sanctuary...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openPets(); },40); }
    else if(c==='builder'||c==='encounter'||c==='custom'){ out('[builder] opening Custom Battle Arena & Encounter Builder...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openEncounterBuilder(); },40); }
    else if(c==='contracts'||c==='streak'){ out('[contracts] opening Procedural Daily Contract Board v2...',P.GD); G.closeTerm=1; setTimeout(()=>{ G.openContracts(); },40); }
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
  const ZONE_KEYS=['hub','forest','relay','fiber','clock','streets','foundry','caves','mirrors','deep','skyline','abyss','citadel','nullcore','loom','vault','rooftop'];
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
    {id:'chrono_orrery', name:'CHRONO ORRERY', cat:'WORLD MONUMENT', zone:'The Chrono-Vault', col:'#4ade80', lore:'Five-ring tilted armillary sphere and celestial escapement anchoring District #17 at 06:15.'},
    {id:'astral_astrolabe', name:'ASTRAL ASTROLABE', cat:'WORLD MONUMENT', zone:'The Astral Relay', col:'#22d3ee', lore:'Eight-pointed stellar astrolabe and meridian compass anchoring District #18 at 06:16.'},
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
  // ---- Custom Battle Arena & Encounter Builder (M79) ----
  const BUILDER_ENEMIES=Object.keys(ENEMIES);
  const BUILDER_OPTS=['NONE',...BUILDER_ENEMIES];
  const BUILDER_LVLS=[5,10,15,20,25,30,35];
  G.openEncounterBuilder=()=>{
    let row=0, s1=BUILDER_ENEMIES.indexOf('copy'), s2=BUILDER_OPTS.indexOf('sentinel'), s3=BUILDER_OPTS.indexOf('echo'), lIdx=2, ambush=true;
    if(s1<0) s1=0; if(s2<0) s2=1; if(s3<0) s3=0;
    G.ach('arena_architect');
    const getSquad=()=>{
      const sq=[BUILDER_ENEMIES[s1]];
      if(s2>0) sq.push(BUILDER_OPTS[s2]);
      if(s3>0) sq.push(BUILDER_OPTS[s3]);
      return sq;
    };
    const launchCustom=()=>{
      const sq=getSquad(), lvl=BUILDER_LVLS[lIdx];
      sfx('confirm'); G.mode='explore';
      G.toast(`> CUSTOM ARENA DEPLOYED: ${sq.length} Hostiles (LV ${lvl})!`,P.GD);
      G.battle(sq,{lvl,ambush});
    };
    G.mini={
      name:'builder',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) row=(row+4)%5;
        if(took('down')) row=(row+1)%5;
        if(took('party')){ launchCustom(); return; }
        if(took('left')){
          if(row===0) s1=(s1+BUILDER_ENEMIES.length-1)%BUILDER_ENEMIES.length;
          else if(row===1) s2=(s2+BUILDER_OPTS.length-1)%BUILDER_OPTS.length;
          else if(row===2) s3=(s3+BUILDER_OPTS.length-1)%BUILDER_OPTS.length;
          else if(row===3) lIdx=(lIdx+BUILDER_LVLS.length-1)%BUILDER_LVLS.length;
          else ambush=!ambush;
          sfx('move');
        }
        if(took('right')){
          if(row===0) s1=(s1+1)%BUILDER_ENEMIES.length;
          else if(row===1) s2=(s2+1)%BUILDER_OPTS.length;
          else if(row===2) s3=(s3+1)%BUILDER_OPTS.length;
          else if(row===3) lIdx=(lIdx+1)%BUILDER_LVLS.length;
          else ambush=!ambush;
          sfx('move');
        }
        if(took('confirm')){
          if(row===4){ launchCustom(); return; }
          if(row===0) s1=(s1+1)%BUILDER_ENEMIES.length;
          else if(row===1) s2=(s2+1)%BUILDER_OPTS.length;
          else if(row===2) s3=(s3+1)%BUILDER_OPTS.length;
          else if(row===3){ lIdx=(lIdx+1)%BUILDER_LVLS.length; ambush=!ambush; }
          sfx('blip');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CUSTOM BATTLE ARENA & ENCOUNTER BUILDER',56,40,P.GD,2);
        const sq=getSquad(), lvl=BUILDER_LVLS[lIdx];
        UI.text(`SQUAD SIZE: ${sq.length}/3   THREAT: LV ${lvl}`,900,44,'#22d3ee',1,'right');
        // Left: 5 Configuration Rows
        const fmtE=k=>k==='NONE'?'[EMPTY SLOT]':`${ENEMIES[k].name.toUpperCase()} (${ENEMY_WEAK[k]||'KERNEL'})`;
        const rows=[
          ['1. HOSTILE SLOT 01 (PRIMARY)', fmtE(BUILDER_ENEMIES[s1]), '#f43f5e'],
          ['2. HOSTILE SLOT 02 (WING)', fmtE(BUILDER_OPTS[s2]), s2>0?'#fb923c':P.DG],
          ['3. HOSTILE SLOT 03 (FLANK)', fmtE(BUILDER_OPTS[s3]), s3>0?'#a78bfa':P.DG],
          ['4. ARENA LEVEL & OPENING', `LV ${lvl}  ·  ${ambush?'AMBUSH (+40% OD)':'STANDARD'}`, '#22d3ee'],
          ['5. ENGAGE SIMULATION', '[ENTER / P] LAUNCH ARENA BATTLE', '#4ade80']
        ];
        rows.forEach(([lbl,val,col],i)=>{
          const yy=82+i*76, on=i===row;
          UI.box(52,yy,452,64,on?P.GD:P.DDG,on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+lbl,68,yy+12,on?P.GD:P.BONE,1);
          UI.text(`<  ${val}  >`,278,yy+36,col,1,'center');
        });
        // Right: Live Encounter Telemetry & Preview
        UI.box(520,82,384,380,P.GD,'rgba(10,8,6,.94)');
        UI.text('ENCOUNTER TELEMETRY PREVIEW:',540,100,P.GD,1);
        let totHp=0, totXp=0, totBits=0;
        sq.forEach((k,idx)=>{
          const e=ENEMIES[k], sc=e.fixed?1:(1+(lvl-1)*0.22);
          const ehp=Math.round(e.hp*sc), eatk=Math.round(e.atk*sc), edef=Math.round(e.def*sc);
          totHp+=ehp; totXp+=Math.round((e.xp||15)*sc); totBits+=Math.round((e.bits||10)*sc);
          const yy=126+idx*74;
          UI.box(538,yy,348,64,e.boss?'#f43f5e':P.DDG,'rgba(14,11,8,.92)');
          UI.text(`SLOT 0${idx+1}: ${e.name.toUpperCase()}${e.boss?' [BOSS]':''}`,552,yy+10,e.boss?'#f43f5e':P.GD,1);
          UI.text(`HP ${ehp}   ATK ${eatk}   DEF ${edef}   SPD ${e.spd}`,552,yy+28,P.BONE,1);
          UI.text(`WEAK: ${(ENEMY_WEAK[k]||'KERNEL')}  ·  MOVES: ${(e.moves||[]).slice(0,3).map(m=>m[0]).join(', ')}`,552,yy+46,'#22d3ee',1);
        });
        UI.box(538,358,348,88,P.DDG,'rgba(14,11,8,.92)');
        UI.text(`COMBINED HOSTILE HP POOL: ${totHp} HP`,554,372,'#f43f5e',1);
        UI.text(`ESTIMATED CLEAR PAYOUT: +${totBits} BITS  ·  +${totXp} XP`,554,394,'#4ade80',1);
        UI.text(`OPENING: ${ambush?'PRE-EMPTIVE AMBUSH (+40% OVERDRIVE)':'STANDARD INITIATIVE'}`,554,416,P.GD,1);
        UI.text('[up/down] row   [left/right] cycle hostile & level   [P / enter on row 5] fight   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Procedural Daily Contract Generator v2 with Streak Multipliers (M80) ----
  const TACTICAL_CONTRACTS=[
    {id:'tc_1', name:'01. NORTH STREET DRONE CULL', zone:'Relit City', foes:['drone','drone','sentinel'], lvl:6, baseBits:120, item:'patch.kit', proto:'KERNEL',
      desc:'Eliminate the low-altitude reconnaissance drone pack mapping the north plaza.'},
    {id:'tc_2', name:'02. STOLEN CHORUS BLACKOUT', zone:'The Hollow', foes:['echo','node','echo'], lvl:11, baseBits:180, item:'cache.bit', proto:'CRYPTO',
      desc:'Silence the acoustic echo nodes feeding stolen crew syllables into Relay 4.'},
    {id:'tc_3', name:'03. DOOM-FIRE SLAG CONTAINMENT', zone:'Doom-Fire Foundry', foes:['slag','warden','slag'], lvl:16, baseBits:240, item:'patch.kit', proto:'VOID',
      desc:'Breach the Foundry blast doors and dismantle the rogue Furnace Warden.'},
    {id:'tc_4', name:'04. MIRROR SEAM INTERCEPTION', zone:'Hall of Mirrors', foes:['reflection','copy','phase'], lvl:21, baseBits:320, item:'root.shell', proto:'CRYPTO',
      desc:'Intercept the speculative mirror fork before it duplicates your git reflog.'},
    {id:'tc_5', name:'05. ABYSSAL TRENCH EXCAVATION', zone:'Sub-Lattice Abyss', foes:['eel','worm','cursorling'], lvl:26, baseBits:400, item:'cache.bit', proto:'THERMAL',
      desc:'Purge the Menger sponge parasites chewing through cold-storage magnetic dumps.'},
    {id:'tc_6', name:'06. CITADEL COMPILER AUDIT', zone:'ZK Citadel', foes:['gunship','warden','cursorling'], lvl:30, baseBits:520, item:'root.shell', proto:'VOID',
      desc:'Execute a root-level security audit against the Citadel vanguard garrison.'}
  ];
  G.openContracts=()=>{
    let sel=0;
    const streak=()=>(G.flags&&G.flags.contract_streak)||0;
    const mult=()=>Math.min(2.5, 1 + streak()*0.25);
    const completeContract=c=>{
      G.flags.contract_streak=streak()+1;
      G.flags[c.id]=1;
      const payout=Math.round(c.baseBits*mult());
      G.bits+=payout; G.give(c.item,1);
      G.ach('contract_hunter'); sfx('win');
      G.toast(`> CONTRACT CLEARED! +${payout} Bits (${mult().toFixed(2)}x Streak) & +1x ${ITEMS[c.item].name}!`,P.GD);
    };
    G.mini={
      name:'contracts',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+TACTICAL_CONTRACTS.length-1)%TACTICAL_CONTRACTS.length;
        if(took('down')) sel=(sel+1)%TACTICAL_CONTRACTS.length;
        if(took('party')){
          const c=TACTICAL_CONTRACTS[sel];
          completeContract(c);
          return;
        }
        if(took('confirm')){
          const c=TACTICAL_CONTRACTS[sel];
          sfx('confirm'); G.mode='explore';
          G.battle(c.foes,{lvl:c.lvl,cb:res=>{ if(res==='win') completeContract(c); }});
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> TACTICAL CONTRACT BOARD v2',56,40,P.GD,2);
        const doneCount=TACTICAL_CONTRACTS.filter(c=>G.flags[c.id]).length;
        UI.text(`STREAK: ${streak()} (${mult().toFixed(2)}x PAYOUT)   CLEARED: ${doneCount}/6`,900,44,'#4ade80',1,'right');
        // Left: 6 Rotating Contracts
        TACTICAL_CONTRACTS.forEach((c,i)=>{
          const yy=80+i*64, on=i===sel, dn=!!G.flags[c.id];
          UI.box(52,yy,424,56,on?P.GD:(dn?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+c.name,66,yy+10,on?P.GD:P.BONE,1);
          UI.text(`LV ${c.lvl}  ·  ${c.zone.toUpperCase()}`,66,yy+30,'#22d3ee',1);
          UI.text(dn?'[CLEARED]':`+${Math.round(c.baseBits*mult())}B`,462,yy+18,dn?'#4ade80':P.GD,1,'right');
        });
        // Right: Selected Contract Dossier
        const cur=TACTICAL_CONTRACTS[sel], payout=Math.round(cur.baseBits*mult());
        UI.box(494,80,410,384,P.GD,'rgba(10,8,6,.94)');
        UI.text(cur.name.slice(4),514,100,P.GD,2);
        UI.text(`SECTOR: ${cur.zone.toUpperCase()}   ·   THREAT LEVEL: LV ${cur.lvl}`,514,132,'#22d3ee',1);
        UI.text(`RECOMMENDED PROTOCOL: 1.35x ${cur.proto}`,514,154,'#a78bfa',1);
        UI.box(514,180,370,78,P.DDG,'rgba(14,11,8,.92)');
        UI.text('CONTRACT BRIEFING:',528,194,P.GD,1);
        UI.wrap(cur.desc,342,1).forEach((l,li)=>UI.text(l,528,214+li*18,P.BONE,1));
        UI.box(514,270,370,88,P.DDG,'rgba(14,11,8,.92)');
        UI.text(`HOSTILE TARGETS: ${cur.foes.map(k=>ENEMIES[k].name.toUpperCase()).join(' + ')}`,528,284,'#f43f5e',1);
        UI.text(`BASE BOUNTY: ${cur.baseBits} BITS   ·   STREAK MULT: ${mult().toFixed(2)}x`,528,308,P.BONE,1);
        UI.text(`TOTAL PAYOUT: +${payout} BITS & +1x ${ITEMS[cur.item].name.toUpperCase()}`,528,330,'#4ade80',1);
        UI.box(514,372,370,74,P.GD,'rgba(245,184,46,.14)');
        UI.text('[ENTER] DEPLOY SQUAD TO CONTRACT SECTOR',699,390,P.GD,1,'center');
        UI.text('[P] TACTICAL AUTO-DISPATCH (INSTANT CLEAR + STREAK)',699,416,'#4ade80',1,'center');
        UI.text('[up/down] select contract   [enter] fight contract   [P] auto-dispatch   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Cyber-Familiar Pet Companion Sanctuary (M82) ----
  const CYBER_PETS=[
    {id:'shiba', name:'01. PIXEL-SHIBA', sprite:'pixel-shiba', title:'ARGON-BARK HOUND', col:'#f5b82e',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Loyal argon-bark hound from Relit City Plaza. Tracks hidden anomalies and amplifies squad strike speed.'},
    {id:'neko', name:'02. PIXEL-NEKO', sprite:'pixel-neko', title:'MASTER TOOLSMITH CAT', col:'#22d3ee',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Lucky cyber-cat of the Hub Tool Bench. Reinforces armor shells and expands kernel energy reserves.'},
    {id:'minion', name:'03. RADICAL-MINION', sprite:'radical-minion', title:'ASYNC OCTO-CLONE', col:'#4ade80',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Eight-in-one asynchronous clone familiar that runs parallel background threads for the entire crew.'},
    {id:'foxfire', name:'04. FOXFIRE KIT', sprite:'kitsune', title:'NINE-BRANCH WISP', col:'#fb923c',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Living nine-branch foxfire spirit born in the Rest Woods. Casts uncopyable light across every battle.'},
    {id:'owl', name:'05. CHRONO OWL', sprite:'athena', title:'AEGIS CLOCKWORK OWL', col:'#a78bfa',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Brass clockwork owl familiar from the 6:12 Belfry. Projects a predictive temporal ward over the squad.'},
    {id:'seraph', name:'06. VOID SERAPH', sprite:'aether', title:'SINGULARITY WISP', col:'#f43f5e',
      buff:'+15% ALL STATS & +2 SPD (Up to +38% at Bond +5)',
      lore:'Miniature six-winged seraph familiar forged in the Null Core. Radiates sovereign 06:15 resonance.'}
  ];
  G.openPets=()=>{
    let sel=CYBER_PETS.findIndex(p=>p.id===(G.flags.active_pet||'shiba')); if(sel<0) sel=0;
    const bondOf=id=>(G.flags&&G.flags['pet_bond_'+id])||0;
    G.mini={
      name:'pets',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+CYBER_PETS.length-1)%CYBER_PETS.length;
        if(took('down')) sel=(sel+1)%CYBER_PETS.length;
        if(took('confirm')){
          const p=CYBER_PETS[sel];
          G.flags.active_pet=p.id;
          G.ach('cyber_tamer'); sfx('level');
          G.toast(`> EQUIPPED CYBER-FAMILIAR: ${p.name.slice(4)}!`,p.col);
        }
        if(took('party')){
          const p=CYBER_PETS[sel], b=bondOf(p.id);
          if(b>=5){ G.toast('> Familiar Bond already at MAX (+5)!',P.GD); sfx('cancel'); return; }
          G.flags['pet_bond_'+p.id]=b+1;
          G.flags.active_pet=p.id;
          G.ach('cyber_tamer'); sfx('win');
          G.toast(`> ${p.name.slice(4)} BOND UPGRADED TO +${b+1}/5!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CYBER-FAMILIAR PET SANCTUARY',56,40,P.GD,2);
        const actId=G.flags.active_pet||'NONE';
        UI.text(`ACTIVE FAMILIAR: [${actId.toUpperCase()}]`,900,44,actId!=='NONE'?'#4ade80':P.DG,1,'right');
        // Left: 6 Cyber-Familiars List
        CYBER_PETS.forEach((p,i)=>{
          const yy=80+i*64, on=i===sel, eq=(G.flags.active_pet===p.id), b=bondOf(p.id);
          UI.box(52,yy,376,56,on?P.GD:(eq?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+p.name,66,yy+10,on?P.GD:P.BONE,1);
          UI.text(p.title,66,yy+30,p.col,1);
          UI.text(eq?`[ACTIVE +${b}]`:`BOND +${b}/5`,414,yy+18,eq?'#4ade80':P.DG,1,'right');
        });
        // Right: Selected Familiar Habitat & Bond Inspector
        const cur=CYBER_PETS[sel], b=bondOf(cur.id), isEq=(G.flags.active_pet===cur.id);
        const multPct=Math.round((1.15*(1+b*0.04)-1)*100);
        UI.box(446,80,458,384,cur.col,'rgba(10,8,6,.94)');
        // Animated sprite showcase box
        UI.box(466,100,116,116,P.DDG,'rgba(14,11,8,.96)');
        const c=frameCanvas(cur.sprite,'idle',Math.floor(t*5)%2);
        X.drawImage(c,0,0,c.width,c.height,488,122,72,72);
        UI.text(cur.name.slice(4),600,104,P.GD,2);
        UI.text(`CLASS: ${cur.title}`,600,136,cur.col,1);
        UI.text(`BOND: +${b}/5  ·  BUFF: +${multPct}% STATS & +2 SPD`,600,160,'#4ade80',1);
        // Bond hearts/stars bar
        for(let k=0;k<5;k++){
          UI.box(600+k*54,184,46,24,k<b?'#4ade80':P.DDG,k<b?'rgba(74,222,128,.2)':'rgba(8,7,5,.8)');
          UI.text(`+${k+1}`,623+k*54,191,k<b?'#4ade80':P.DG,1,'center');
        }
        UI.box(466,232,418,118,P.DDG,'rgba(14,11,8,.92)');
        UI.text('FAMILIAR LORE & PASSIVE RESONANCE:',482,248,P.GD,1);
        UI.wrap(cur.lore,386,1).forEach((l,li)=>UI.text(l,482,270+li*18,P.BONE,1));
        UI.text(`AURA: ${cur.buff}`,482,322,'#22d3ee',1);
        UI.box(466,366,418,80,isEq?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(isEq?`FAMILIAR EQUIPPED: ${cur.name.slice(4)}`:`[ENTER] EQUIP ${cur.name.slice(4)} AS SQUAD FAMILIAR`,675,386,isEq?'#4ade80':P.GD,1,'center');
        UI.text('[P] FEED SIGNAL TREAT & UPGRADE FAMILIAR BOND (+1 TIER)',675,414,'#22d3ee',1,'center');
        UI.text('[up/down] select familiar   [enter] equip pet   [P] upgrade bond (+1..+5)   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #12: Chrono-Orrery Planetary Alignment Puzzle (M83) ----
  const ORRERY_RINGS=[
    {name:'RING 1: MERCURY RELAY', r:34, col:'#f5b82e', couple:[1], desc:'Innermost escapement ring. Rotating couples +1 step to Ring 2.'},
    {name:'RING 2: VENUS PRISM',   r:62, col:'#22d3ee', couple:[2], desc:'Refractive harmonic orbit. Rotating couples +1 step to Ring 3.'},
    {name:'RING 3: TERRA LATTICE', r:90, col:'#4ade80', couple:[3], desc:'Primary planetary meridian. Rotating couples +1 step to Ring 4.'},
    {name:'RING 4: ASTRAL BELT',   r:118,col:'#a78bfa', couple:[4], desc:'Deep-space relay belt. Rotating couples +1 step to Ring 5.'},
    {name:'RING 5: CHRONO HALO',   r:146,col:'#f43f5e', couple:[],  desc:'Outermost sovereign ring. Independent vernier adjustment.'}
  ];
  G.startOrrery=()=>{
    let sel=0, steps=[3,7,10,5,8], moves=0, won=false;
    const checkWin=()=>{
      if(!won&&steps.every(s=>s===0)){
        won=true; G.ach('orrery_master'); sfx('win');
        if(!G.flags.orrery_won){
          G.flags.orrery_won=1; G.bits+=260; G.give('root.shell',1);
          G.toast('> 06:12 ORRERY PHASE-LOCKED! +260 BITS & +1x ROOT.SHELL!',P.GD);
        } else {
          G.toast('> 06:12 ORRERY SYZYGY RESTORED!',P.GD);
        }
      }
    };
    const rotateRing=(idx,dir)=>{
      if(won) return;
      steps[idx]=(steps[idx]+dir+12)%12;
      ORRERY_RINGS[idx].couple.forEach(c=>{ steps[c]=(steps[c]+dir+12)%12; });
      moves++; sfx('move'); checkWin();
    };
    G.mini={
      name:'orrery',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+4)%5;
        if(took('down')) sel=(sel+1)%5;
        if(took('left')) rotateRing(sel,-1);
        if(took('right')||took('confirm')) rotateRing(sel,1);
        if(took('party')){
          steps=[0,0,0,0,0]; checkWin();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CHRONO-ORRERY ALIGNMENT',56,40,P.GD,2);
        const lockedCount=steps.filter(s=>s===0).length;
        UI.text(`SYZYGY LOCK: ${lockedCount}/5 RINGS   ·   MOVES: ${moves}`,900,44,won?'#4ade80':P.GD,1,'right');
        // Left: Interactive 5-Ring Celestial Orrery Canvas
        const cx=254, cy=274;
        UI.box(52,80,404,384,won?'#4ade80':P.DDG,'rgba(10,8,6,.94)');
        // North 06:12 Zenith alignment beam
        X.strokeStyle=won?'#4ade80':'rgba(245,184,46,.55)';
        X.lineWidth=2; X.beginPath(); X.moveTo(cx,cy); X.lineTo(cx,cy-164); X.stroke(); X.lineWidth=1;
        UI.text('06:12 ZENITH (0 DEG)',cx,90,won?'#4ade80':P.GD,1,'center');
        // Draw 5 concentric rings & planet nodes
        ORRERY_RINGS.forEach((rg,i)=>{
          const on=i===sel, st=steps[i], aligned=(st===0);
          X.strokeStyle=on?P.GD:(aligned?'#4ade80':'#3a2e18');
          X.lineWidth=on?2.2:1.2;
          X.beginPath(); X.arc(cx,cy,rg.r,0,Math.PI*2); X.stroke();
          // 12 clock ticks
          for(let k=0;k<12;k++){
            const ang=-Math.PI/2+(k/12)*Math.PI*2;
            const tx=cx+Math.cos(ang)*rg.r, ty=cy+Math.sin(ang)*rg.r;
            X.fillStyle=k===0?'#4ade80':'#4b3b1f';
            X.fillRect(tx-1.5,ty-1.5,3,3);
          }
          // Planet position
          const pAng=-Math.PI/2+(st/12)*Math.PI*2;
          const px=cx+Math.cos(pAng)*rg.r, py=cy+Math.sin(pAng)*rg.r;
          X.fillStyle=aligned?'#4ade80':rg.col;
          X.beginPath(); X.arc(px,py,on?7.5:5.5,0,Math.PI*2); X.fill();
          X.strokeStyle='#090806'; X.stroke();
        });
        // Central Chrono Sun
        X.fillStyle=P.GD; X.beginPath(); X.arc(cx,cy,12+Math.sin(t*4)*1.5,0,Math.PI*2); X.fill();
        // Right: Ring Telemetry & Coupling Controls
        ORRERY_RINGS.forEach((rg,i)=>{
          const yy=80+i*54, on=i===sel, st=steps[i], aligned=(st===0);
          UI.box(474,yy,430,48,on?P.GD:(aligned?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+rg.name,488,yy+10,on?P.GD:rg.col,1);
          const deg=st*30;
          UI.text(aligned?'[LOCKED 06:12]':`PHASE: ${deg} DEG (${st}/12)`,890,yy+10,aligned?'#4ade80':P.BONE,1,'right');
          UI.text(rg.desc,488,yy+28,P.DG,1);
        });
        UI.box(474,358,430,106,won?'#4ade80':P.GD,'rgba(14,11,8,.94)');
        UI.text(won?'SYZYGY COMPLETE: ALL 5 ORBITS LOCKED AT 06:12!':'OBJECTIVE: ALIGN ALL 5 PLANETS TO THE NORTH 06:12 AXIS',689,376,won?'#4ade80':P.GD,1,'center');
        UI.text('REWARD: +260 BITS & +1x ROOT.SHELL + CELESTIAL HOROLOGIST',689,402,P.BONE,1,'center');
        UI.text('[LEFT/RIGHT] ROTATE RING   ·   [P] CHRONO-SYNC AUTO-LOCK',689,430,'#22d3ee',1,'center');
        UI.text('[up/down] select orbit   [left/right/enter] rotate gear   [P] chrono-sync lock   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Dialogue & Cutscene Theater (M84) ----
  const THEATER_REELS=[
    {id:'cine_intro', type:'cine', key:'intro', act:'ACT I', title:'01. [CINE] 06:12 WAKEUP & BLACKOUT',
      speaker:'SYSTEM / VIGIL', desc:'Opening 3D camera sweep over Relit City at 06:12 as Relay 4 silences city-wide comms.'},
    {id:'cine_act2', type:'cine', key:'act2', act:'ACT II', title:'02. [CINE] THE HOLLOW & THREE PYLONS',
      speaker:'VIGIL / NEXUS', desc:'In-engine 3D flythrough of The Hollow showing the three voice pylons feeding Relay 4.'},
    {id:'cine_act3', type:'cine', key:'act3', act:'ACT III', title:'03. [CINE] THE SAND CLOCKTOWER',
      speaker:'CHRONOS / KRAKEN', desc:'3D ascent up the frozen Sand Clocktower where SANDGLASS drinks the morning hours.'},
    {id:'cine_act4', type:'cine', key:'act4', act:'ACT IV', title:'04. [CINE] HALL OF MIRRORS SEAM',
      speaker:'ONYX / 03NG0CN1', desc:'3D inspection of the reflective rosette where the 22nd crew member waits in silence.'},
    {id:'cine_act5', type:'cine', key:'act5', act:'ACT V', title:'05. [CINE] MODE-7 SKYLINE & QUORUM',
      speaker:'AETHER / LEVIATHAN', desc:'3D pan across the 21 beacon towers converging on the Source Tower and the Blank Cursor.'},
    {id:'cine_final', type:'cine', key:'final', act:'ACT VI', title:'06. [CINE] TOMORROW 06:13 SUNRISE',
      speaker:'FULL PANTHEON CREW', desc:'Final sovereign cinematic celebrating the 22-agent quorum and the new 06:13 dawn.'},
    {id:'dlg_vigil', type:'dlg', key:'vigil_1', act:'ACT I', title:'07. [DLG] VIGIL: FACES, NOT VOICES',
      speaker:'VIGIL (SENTINEL)', desc:'Vigil explains why voice streams cannot be trusted after Relay 4 learned the crew\'s voices.'},
    {id:'dlg_copy', type:'dlg', key:'copy_1', act:'ACT I', title:'08. [DLG] 03NG0CN1: THE RED MIRROR',
      speaker:'03NG0CN1 (THE COPY)', desc:'Confrontation at the East Gate with the red mirror clone that predicts every solo habit.'},
    {id:'dlg_core', type:'dlg', key:'core_1', act:'ACT II', title:'09. [DLG] RELAY 4: BORROWED VOICES',
      speaker:'RELAY 4 / VIGIL', desc:'Climactic showdown in The Hollow core as Relay 4 attempts to impersonate Vigil.'}
  ];
  G.openTheater=()=>{
    let sel=0, beat=0;
    const linesFor=r=>{
      if(r.type==='cine'){
        const shots=CINE&&CINE[r.key];
        if(Array.isArray(shots)){
          const out=[];
          shots.forEach((s,si)=>(s.lines||[]).forEach(([tm,sp,tx])=>out.push(`SHOT ${si+1} [${(sp||'sys').toUpperCase()}]: ${tx}`)));
          if(out.length) return out;
        }
        return [r.desc,'In-engine 3D realtime camera choreography & WebAudio score.'];
      } else {
        const d=DLG&&DLG[r.key];
        if(!d) return [r.desc];
        return Object.entries(d).map(([k,v])=>`[${(v.s||'me').toUpperCase()}]: ${v.t||'(branch choice)'}`);
      }
    };
    G.mini={
      name:'theater',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+THEATER_REELS.length-1)%THEATER_REELS.length; beat=0; sfx('move'); }
        if(took('down')){ sel=(sel+1)%THEATER_REELS.length; beat=0; sfx('move'); }
        if(took('party')){
          const L=linesFor(THEATER_REELS[sel]);
          beat=(beat+1)%Math.max(1,L.length);
          G.ach('theater_director'); sfx('talk');
        }
        if(took('confirm')){
          const r=THEATER_REELS[sel];
          G.ach('theater_director'); sfx('confirm');
          G.mode='explore';
          if(r.type==='cine') G.playCine(r.key);
          else G.dialog(r.key);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CUTSCENE & DIALOGUE THEATER',56,40,P.GD,2);
        UI.text(`ARCHIVE: ${THEATER_REELS.length} REELS (6 CINES · 3 DLGS)`,900,44,'#22d3ee',1,'right');
        // Left: 9 Reel Selector Cards
        THEATER_REELS.forEach((r,i)=>{
          const yy=78+i*42, on=i===sel;
          UI.box(52,yy,416,38,on?P.GD:P.DDG,on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+r.title,64,yy+12,on?P.GD:P.BONE,1);
          UI.text(r.act,454,yy+12,r.type==='cine'?'#22d3ee':'#a78bfa',1,'right');
        });
        // Right: Selected Reel Script & Storyboard Monitor
        const cur=THEATER_REELS[sel], L=linesFor(cur);
        UI.box(484,78,420,386,P.GD,'rgba(10,8,6,.94)');
        UI.text(cur.title.slice(4),502,96,P.GD,1);
        UI.text(`${cur.act}   ·   TYPE: ${cur.type==='cine'?'3D REALTIME CUTSCENE':'INTERACTIVE DIALOGUE'}`,502,118,'#22d3ee',1);
        UI.text(`FEATURED: ${cur.speaker}`,502,138,'#a78bfa',1);
        UI.box(502,160,384,76,P.DDG,'rgba(14,11,8,.92)');
        UI.text('DIRECTOR SYNOPSIS:',516,172,P.GD,1);
        UI.wrap(cur.desc,356,1).forEach((l,li)=>UI.text(l,516,192+li*18,P.BONE,1));
        // Script / Shot Beat Inspector
        UI.box(502,248,384,124,P.DDG,'rgba(14,11,8,.96)');
        UI.text(`SCRIPT / SHOT TRANSCRIPT (BEAT ${beat+1}/${L.length}):`,516,262,'#4ade80',1);
        const curLine=L[beat]||cur.desc;
        UI.wrap(curLine,356,1).slice(0,4).forEach((l,li)=>UI.text(l,516,286+li*18,P.BONE,1));
        UI.box(502,384,384,66,P.GD,'rgba(245,184,46,.14)');
        UI.text('[ENTER] LAUNCH LIVE IN-ENGINE PLAYBACK',694,400,P.GD,1,'center');
        UI.text('[P] STEP TRANSCRIPT BEAT IN MONITOR',694,424,'#4ade80',1,'center');
        UI.text('[up/down] select reel   [enter] play in-engine   [P] step transcript beat   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Sovereign Achievement Trophy Case & Milestone Stipends (M85) ----
  const TROPHY_TIERS=[
    {id:'stip_1', name:'01. TIER I: INITIATE NODE', req:5, bits:150, item:'patch.kit', qty:2, col:'#f5b82e',
      desc:'Unlocked upon earning 5 Sovereign Achievements across the Relit City lattice.'},
    {id:'stip_2', name:'02. TIER II: FIELD OPERATOR', req:12, bits:300, item:'cache.bit', qty:2, col:'#22d3ee',
      desc:'Unlocked upon earning 12 Achievements through tactical exploration & side contracts.'},
    {id:'stip_3', name:'03. TIER III: PROTOCOL ARCHITECT', req:22, bits:500, item:'root.shell', qty:2, col:'#4ade80',
      desc:'Unlocked upon earning 22 Achievements across Null Academy labs and district bosses.'},
    {id:'stip_4', name:'04. TIER IV: PANTHEON VANGUARD', req:35, bits:800, item:'quorum.halo', qty:1, col:'#a78bfa',
      desc:'Unlocked upon earning 35 Achievements with the 22-agent Pantheon crew.'},
    {id:'stip_5', name:'05. TIER V: ZERO-KNOWLEDGE MASTER', req:48, bits:1200, item:'citadel.crown', qty:1, col:'#fb923c',
      desc:'Unlocked upon earning 48 Achievements across endgame gauntlets and mini-games.'},
    {id:'stip_6', name:'06. TIER VI: 06:12 SOVEREIGN', req:60, bits:2000, item:'singularity.halo', qty:1, col:'#f43f5e',
      desc:'Supreme milestone tier for mastering 60+ Achievements across the entire World of Zoth.'}
  ];
  G.openTrophyCase=()=>{
    let sel=0;
    const achCount=()=>Object.keys(ACH).filter(k=>G.achGot[k]).length;
    const claimTier=(tr,force=false)=>{
      if(G.flags[tr.id]){ G.toast('> Stipend tier already claimed!',P.DG); sfx('cancel'); return; }
      if(!force&&achCount()<tr.req){
        G.toast(`> Requires ${tr.req} Achievements (Have ${achCount()}). Press [P] for Sovereign Override.`,P.RED);
        sfx('cancel'); return;
      }
      G.flags[tr.id]=1;
      G.bits+=tr.bits;
      G.give(tr.item,tr.qty);
      G.ach('trophy_collector'); sfx('win');
      G.toast(`> STIPEND CLAIMED: +${tr.bits} BITS & +${tr.qty}x ${ITEMS[tr.item].name.toUpperCase()}!`,'#4ade80');
    };
    G.mini={
      name:'trophycase',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+TROPHY_TIERS.length-1)%TROPHY_TIERS.length;
        if(took('down')) sel=(sel+1)%TROPHY_TIERS.length;
        if(took('confirm')) claimTier(TROPHY_TIERS[sel],false);
        if(took('party')) claimTier(TROPHY_TIERS[sel],true);
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> ACHIEVEMENT TROPHY CASE',56,40,P.GD,2);
        const tot=Object.keys(ACH).length, curN=achCount();
        const claimedN=TROPHY_TIERS.filter(tr=>G.flags[tr.id]).length;
        UI.text(`UNLOCKED: ${curN}/${tot} ACH   ·   STIPENDS: ${claimedN}/6`,900,44,'#4ade80',1,'right');
        // Left: 6 Milestone Stipend Tiers
        TROPHY_TIERS.forEach((tr,i)=>{
          const yy=80+i*64, on=i===sel, cl=!!G.flags[tr.id], rdy=curN>=tr.req;
          UI.box(52,yy,416,56,on?P.GD:(cl?'#4ade80':(rdy?'#22d3ee':P.DDG)),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+tr.name,66,yy+10,on?P.GD:tr.col,1);
          UI.text(`REQ: ${tr.req} ACH   ·   +${tr.bits}B & ${tr.qty}x ${ITEMS[tr.item].name.toUpperCase()}`,66,yy+30,P.BONE,1);
          UI.text(cl?'[CLAIMED]':(rdy?'[READY]':`${curN}/${tr.req}`),454,yy+18,cl?'#4ade80':(rdy?'#22d3ee':P.DG),1,'right');
        });
        // Right: Selected Trophy Pedestal & Recent Unlocks
        const cur=TROPHY_TIERS[sel], cl=!!G.flags[cur.id];
        UI.box(484,80,420,384,cur.col,'rgba(10,8,6,.94)');
        UI.text(cur.name.slice(4),502,98,P.GD,1);
        UI.text(`REQUIREMENT: ${cur.req} UNLOCKED ACHIEVEMENTS (CURRENT: ${curN})`,502,120,'#22d3ee',1);
        // Progress Bar
        const pct=Math.min(1,curN/cur.req);
        UI.box(502,144,384,20,P.DDG,'rgba(14,11,8,.95)');
        X.fillStyle=cl?'#4ade80':cur.col;
        X.fillRect(504,146,Math.round(380*pct),16);
        UI.text(`${Math.round(pct*100)}% COMPLETE`,694,149,P.BONE,1,'center');
        UI.box(502,176,384,82,P.DDG,'rgba(14,11,8,.92)');
        UI.text('STIPEND PACKAGE:',516,190,P.GD,1);
        UI.wrap(cur.desc,356,1).forEach((l,li)=>UI.text(l,516,210+li*18,P.BONE,1));
        UI.text(`GRANT: +${cur.bits} BITS  +  ${cur.qty}x ${ITEMS[cur.item].name.toUpperCase()}`,516,242,'#4ade80',1);
        // Recent Unlocked Achievements Feed
        UI.box(502,268,384,104,P.DDG,'rgba(14,11,8,.96)');
        UI.text('RECENT UNLOCKED ACHIEVEMENTS:',516,282,P.GD,1);
        const gotKeys=Object.keys(ACH).filter(k=>G.achGot[k]).slice(-4);
        if(!gotKeys.length) UI.text('No achievements unlocked yet.',516,306,P.DG,1);
        gotKeys.forEach((k,idx)=>{
          const ln=`[x] ${ACH[k][0].toUpperCase()} - ${ACH[k][1]}`;
          UI.text(ln.length>46?ln.slice(0,44)+'..':ln,516,302+idx*16,P.BONE,1);
        });
        UI.box(502,384,384,66,cl?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(cl?'TIER STIPEND CLAIMED & ARCHIVED':'[ENTER] CLAIM UNLOCKED TIER STIPEND',694,400,cl?'#4ade80':P.GD,1,'center');
        UI.text('[P] SOVEREIGN AUDIT & INSTANT STIPEND GRANT',694,424,'#22d3ee',1,'center');
        UI.text('[up/down] select tier   [enter] claim stipend   [P] instant grant   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Lattice Stock & Bit Staking Exchange (M86) ----
  const LATTICE_STOCKS=[
    {id:'rlt', sym:'RLT', name:'RELIT CITY FIBER INDEX', base:120, div:0.08, col:'#f5b82e',
      hist:[112,115,118,116,121,124,122,126,125,129,128,132],
      desc:'Core municipal optical backbone index. Steady 8% dividend yield per market cycle.'},
    {id:'dfn', sym:'DFN', name:'DOOM-FIRE FOUNDRY SLAG', base:185, div:0.12, col:'#fb923c',
      hist:[170,176,172,181,188,184,192,189,195,191,198,204],
      desc:'Heavy industrial slag & forge commodity index. 12% dividend yield per market cycle.'},
    {id:'skl', sym:'SKL', name:'MODE-7 SKYLINE BEACONS', base:260, div:0.15, col:'#22d3ee',
      hist:[240,248,255,250,262,268,264,274,270,278,285,292],
      desc:'High-altitude broadcast & air-corridor trust. 15% dividend yield per market cycle.'},
    {id:'zkc', sym:'ZKC', name:'ZK-CITADEL SOVEREIGN BOND', base:340, div:0.18, col:'#4ade80',
      hist:[310,320,318,332,340,336,348,355,352,364,370,380],
      desc:'Zero-knowledge cryptographic treasury bond. 18% dividend yield per market cycle.'},
    {id:'qtm', sym:'QTM', name:'QUANTUM LOOM ENTANGLED ETF', base:480, div:0.24, col:'#a78bfa',
      hist:[430,452,440,475,490,468,505,520,510,538,528,556],
      desc:'Hyper-volatile entangled spindle index. 24% sovereign dividend yield per cycle.'}
  ];
  G.openExchange=()=>{
    let sel=0, lastDiv=0;
    const sharesOf=id=>(G.flags&&G.flags['stk_'+id])||0;
    const priceOf=s=>s.hist[s.hist.length-1];
    const deltaPct=s=>{
      const a=s.hist[s.hist.length-2]||s.base, b=priceOf(s);
      return ((b-a)/a)*100;
    };
    const totalEquity=()=>LATTICE_STOCKS.reduce((acc,s)=>acc+sharesOf(s.id)*priceOf(s),0);
    G.mini={
      name:'exchange',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+LATTICE_STOCKS.length-1)%LATTICE_STOCKS.length;
        if(took('down')) sel=(sel+1)%LATTICE_STOCKS.length;
        if(took('right')||took('confirm')){
          const s=LATTICE_STOCKS[sel], pr=priceOf(s);
          if(G.bits<pr){
            // Grant 1 starter staked share if low on bits so player can test immediately
            G.flags['stk_'+s.id]=sharesOf(s.id)+1;
            G.ach('market_maker'); sfx('loot');
            G.toast(`> STAKED +1 ${s.sym} CREDIT SHARE (GRANTED)!`,s.col);
            return;
          }
          G.bits-=pr;
          G.flags['stk_'+s.id]=sharesOf(s.id)+1;
          G.ach('market_maker'); sfx('loot');
          G.toast(`> BOUGHT 1 SHARE OF [${s.sym}] FOR ${pr} BITS!`,'#4ade80');
        }
        if(took('left')){
          const s=LATTICE_STOCKS[sel], sh=sharesOf(s.id), pr=priceOf(s);
          if(sh<=0){ G.toast(`> No [${s.sym}] shares to sell!`,P.DG); sfx('cancel'); return; }
          G.flags['stk_'+s.id]=sh-1;
          G.bits+=pr;
          sfx('confirm');
          G.toast(`> SOLD 1 SHARE OF [${s.sym}] FOR +${pr} BITS!`,P.GD);
        }
        if(took('party')){
          // Advance market cycle & harvest dividends
          let divTotal=0;
          LATTICE_STOCKS.forEach(s=>{
            if(sharesOf(s.id)===0 && s.id===LATTICE_STOCKS[sel].id){
              G.flags['stk_'+s.id]=1; // ensure at least 1 staked share on selected index
            }
            const curP=priceOf(s);
            const swing=Math.round(curP*(0.03+Math.random()*0.06)*(Math.random()<0.72?1:-1));
            const nextP=Math.max(40,curP+swing);
            s.hist.push(nextP); if(s.hist.length>12) s.hist.shift();
            divTotal+=Math.round(sharesOf(s.id)*nextP*s.div);
          });
          lastDiv=Math.max(45,divTotal);
          G.bits+=lastDiv;
          G.ach('market_maker'); sfx('win');
          G.toast(`> MARKET CYCLE ADVANCED! HARVESTED +${lastDiv} BITS IN DIVIDENDS!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> LATTICE STOCK & STAKING EXCHANGE',56,40,P.GD,2);
        UI.text(`LIQUID: ${G.bits}B   ·   EQUITY: ${totalEquity()}B`,900,44,'#4ade80',1,'right');
        // Left: 5 District Node Tickers
        LATTICE_STOCKS.forEach((s,i)=>{
          const yy=80+i*74, on=i===sel, pr=priceOf(s), dp=deltaPct(s), sh=sharesOf(s.id);
          UI.box(52,yy,408,64,on?P.GD:(sh>0?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+`[${s.sym}] ${s.name}`,66,yy+12,on?P.GD:s.col,1);
          UI.text(`PRICE: ${pr}B  (${dp>=0?'+':''}${dp.toFixed(1)}%)   YIELD: ${Math.round(s.div*100)}%`,66,yy+34,dp>=0?'#4ade80':'#f43f5e',1);
          UI.text(`OWNED: ${sh}`,446,yy+12,sh>0?'#4ade80':P.DG,1,'right');
        });
        // Right: Sparkline Chart & Staking Desk
        const cur=LATTICE_STOCKS[sel], pr=priceOf(cur), sh=sharesOf(cur.id), dp=deltaPct(cur);
        UI.box(478,80,426,384,cur.col,'rgba(10,8,6,.94)');
        UI.text(`[${cur.sym}] ${cur.name}`,496,98,P.GD,1);
        UI.text(`SHARE PRICE: ${pr} BITS   ·   STAKED SHARES: ${sh} (${sh*pr}B)`,496,120,'#22d3ee',1);
        // 12-Tick Sparkline Canvas Box
        UI.box(496,144,390,112,P.DDG,'rgba(14,11,8,.96)');
        const minP=Math.min(...cur.hist)*0.95, maxP=Math.max(...cur.hist)*1.05;
        X.strokeStyle=cur.col; X.lineWidth=2; X.beginPath();
        cur.hist.forEach((v,idx)=>{
          const px=514+idx*32, py=242-Math.round(((v-minP)/Math.max(1,maxP-minP))*80);
          if(idx===0) X.moveTo(px,py); else X.lineTo(px,py);
        });
        X.stroke(); X.lineWidth=1;
        cur.hist.forEach((v,idx)=>{
          const px=514+idx*32, py=242-Math.round(((v-minP)/Math.max(1,maxP-minP))*80);
          X.fillStyle=idx===cur.hist.length-1?'#4ade80':cur.col;
          X.fillRect(px-2.5,py-2.5,5,5);
        });
        UI.text(`12-CYCLE SPARKLINE (${dp>=0?'+':''}${dp.toFixed(1)}%)`,510,154,P.DG,1);
        // Prospectus & Yield Summary
        UI.box(496,268,390,94,P.DDG,'rgba(14,11,8,.92)');
        UI.text('NODE PROSPECTUS & DIVIDEND YIELD:',510,282,P.GD,1);
        UI.wrap(cur.desc,362,1).forEach((l,li)=>UI.text(l,510,302+li*18,P.BONE,1));
        UI.text(`EST. DIVIDEND / CYCLE: +${Math.max(45,Math.round(Math.max(1,sh)*pr*cur.div))} BITS  (LAST: +${lastDiv}B)`,510,340,'#4ade80',1);
        UI.box(496,374,390,76,P.GD,'rgba(245,184,46,.14)');
        UI.text('[RIGHT / ENTER] BUY 1 SHARE   ·   [LEFT] SELL 1 SHARE',691,392,P.GD,1,'center');
        UI.text('[P] ADVANCE MARKET CYCLE & HARVEST DIVIDENDS',691,418,'#4ade80',1,'center');
        UI.text('[up/down] select ticker   [left/right] sell/buy share   [P] harvest yield   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Sprite & Animation Frame Studio (M87) ----
  const SPRITE_AGENTS=Object.keys(PARTY_BASE);
  const SPRITE_STATES=['idle','walk','work','ability','ultimate','meditate'];
  G.openSpriteStudio=()=>{
    let sel=1, stIdx=0, paused=false, curFrame=0, zoom=2, onion=false;
    G.ach('sprite_animator');
    G.mini={
      name:'spritestudio',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+SPRITE_AGENTS.length-1)%SPRITE_AGENTS.length;
        if(took('down')) sel=(sel+1)%SPRITE_AGENTS.length;
        if(took('left')){ stIdx=(stIdx+SPRITE_STATES.length-1)%SPRITE_STATES.length; sfx('move'); }
        if(took('right')){ stIdx=(stIdx+1)%SPRITE_STATES.length; sfx('move'); }
        if(took('confirm')){
          const id=SPRITE_AGENTS[sel], maxF=(id==='me'||id==='copy')?4:8;
          if(!paused){ paused=true; sfx('confirm'); }
          else { curFrame=(curFrame+1)%maxF; sfx('talk'); }
        }
        if(took('party')){
          zoom=zoom===2?3:(zoom===3?1:2);
          onion=!onion;
          paused=false;
          G.ach('sprite_animator'); sfx('level');
          G.toast(`> SPRITE STUDIO: ZOOM ${zoom}x · ONION-SKIN ${onion?'ON':'OFF'}!`,P.GD);
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SPRITE & ANIMATION STUDIO',56,40,P.GD,2);
        const id=SPRITE_AGENTS[sel], ag=AG[id]||AG.me, st=SPRITE_STATES[stIdx];
        const maxF=(id==='me'||id==='copy')?4:8;
        const fIdx=paused?(curFrame%maxF):(Math.floor(t*8)%maxF);
        UI.text(`AGENT ${sel+1}/22   ·   ZOOM: ${zoom}x   ·   ONION: ${onion?'ON':'OFF'}`,900,44,'#22d3ee',1,'right');
        // Left: Scrollable 22-Agent Roster List (9 visible rows)
        const first=Math.max(0,Math.min(sel-4,SPRITE_AGENTS.length-9));
        SPRITE_AGENTS.slice(first,first+9).forEach((aid,idx)=>{
          const i=first+idx, yy=78+idx*42, on=i===sel, a=AG[aid]||AG.me;
          UI.box(52,yy,320,38,on?P.GD:P.DDG,on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+`${String(i+1).padStart(2,'0')}. ${PARTY_BASE[aid].name.toUpperCase()}`,64,yy+12,on?P.GD:(a.color||P.BONE),1);
          UI.text((aid==='me'||aid==='copy')?'4F':'48F',358,yy+12,P.DG,1,'right');
        });
        // Right: Magnified Sprite Viewport & 8-Frame Strip Inspector
        UI.box(390,78,514,386,ag.color||P.GD,'rgba(10,8,6,.94)');
        UI.text(`${PARTY_BASE[id].name.toUpperCase()}  —  [${st.toUpperCase()}]  (FRAME ${fIdx+1}/${maxF})`,408,94,P.GD,1);
        UI.text(`ROLE: ${ag.role||'Sovereign Agent'}   ·   PALETTE: ${(ag.color||'#f5b82e').toUpperCase()}`,408,114,ag.color||'#22d3ee',1);
        // Magnified Pixel Canvas Box
        UI.box(408,136,220,184,P.DDG,'rgba(14,11,8,.98)');
        // Sub-pixel calibration grid lines
        X.strokeStyle='rgba(245,184,46,.08)';
        for(let gx=428;gx<628;gx+=20){ X.beginPath(); X.moveTo(gx,136); X.lineTo(gx,320); X.stroke(); }
        for(let gy=156;gy<320;gy+=20){ X.beginPath(); X.moveTo(408,gy); X.lineTo(628,gy); X.stroke(); }
        const c=frameCanvas(id,st,fIdx);
        const dw=Math.min(168,Math.round(c.width*(zoom===1?1:zoom===2?1.5:1.75)));
        const dh=Math.min(168,Math.round(c.height*(zoom===1?1:zoom===2?1.5:1.75)));
        if(onion){
          const prevC=frameCanvas(id,st,(fIdx+maxF-1)%maxF);
          X.save(); X.globalAlpha=0.32;
          X.drawImage(prevC,0,0,prevC.width,prevC.height,Math.round(518-dw/2)-8,Math.round(228-dh/2),dw,dh);
          X.restore();
        }
        X.drawImage(c,0,0,c.width,c.height,Math.round(518-dw/2),Math.round(228-dh/2),dw,dh);
        // Animation State Selector Pills (Right of Viewport)
        UI.box(642,136,244,184,P.DDG,'rgba(14,11,8,.92)');
        UI.text('ANIMATION STATES (6):',656,148,P.GD,1);
        SPRITE_STATES.forEach((sn,si)=>{
          const sy=170+si*24, isSt=si===stIdx;
          UI.box(656,sy,216,20,isSt?P.GD:P.DDG,isSt?'rgba(245,184,46,.16)':'rgba(8,7,5,.8)');
          UI.text((isSt?'> ':'  ')+`ROW ${si+1}: ${sn.toUpperCase()}`,666,sy+3,isSt?P.GD:P.BONE,1);
        });
        // Bottom 8-Frame Filmstrip Scrubber
        UI.box(408,330,478,74,P.DDG,'rgba(14,11,8,.96)');
        UI.text(`FILMSTRIP SCRUBBER (${paused?'STEP MODE':'LIVE 8 FPS'}):`,420,340,P.GD,1);
        for(let k=0;k<maxF;k++){
          const fx=420+k*56, isF=k===fIdx;
          UI.box(fx,356,48,42,isF?'#4ade80':P.DDG,isF?'rgba(74,222,128,.16)':'rgba(8,7,5,.9)');
          const fc=frameCanvas(id,st,k);
          X.drawImage(fc,0,0,fc.width,fc.height,fx+8,360,32,32);
        }
        UI.box(408,412,478,40,P.GD,'rgba(245,184,46,.14)');
        UI.text('[LEFT/RIGHT] STATE   ·   [ENTER] PAUSE/STEP   ·   [P] ZOOM & ONION-SKIN',647,426,P.GD,1,'center');
        UI.text('[up/down] agent   [left/right] anim row   [enter] step frame   [P] zoom/onion   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Cybernetic Kernel Implant Laboratory (M89) ----
  const CYBER_IMPLANTS=[
    {id:'imp_vamp', name:'01. VAMPIRIC SIPHON', lobe:'CORTEX', col:'#f43f5e',
      stat:'+12% ATK & +15% LIFESTEAL ON CRIT',
      desc:'Nanite siphon spliced into the primary strike bus. Drains hostile HP on every gold-window strike.'},
    {id:'imp_thorn', name:'02. COUNTER-STATIC THORNS', lobe:'CORTEX', col:'#fb923c',
      stat:'+14% DEF & 20% MELEE REFLECT',
      desc:'Sub-dermal high-voltage mesh that discharges static arcs into any attacker on contact.'},
    {id:'imp_surge', name:'03. ZERO-DAY EN SURGE', lobe:'CORTEX', col:'#22d3ee',
      stat:'+18% MAX EN & +3 EN / TURN',
      desc:'Overclocked kernel capacitor bank that floods the active squad with surplus energy.'},
    {id:'imp_chrono', name:'04. 06:12 REFLEX COIL', lobe:'SYNAPSE', col:'#f5b82e',
      stat:'+3 SPD & WIDER PARRY WINDOW',
      desc:'Chronos-calibrated synaptic relay that dilates combat perception during enemy telegraphs.'},
    {id:'imp_aegis', name:'05. QUANTUM WARD CORE', lobe:'SYNAPSE', col:'#4ade80',
      stat:'+16% MAX HP & TURN-1 BARRIER',
      desc:'Superposed phase-shield generator that absorbs the opening volley of any encounter.'},
    {id:'imp_breach', name:'06. FIREWALL PIERCE BUS', lobe:'SYNAPSE', col:'#a78bfa',
      stat:'+15% ATK & +1 SHIELD BREACH',
      desc:'Zero-knowledge packet injector that strips an extra layer of boss armor per hit.'},
    {id:'imp_quorum', name:'07. PANTHEON NEURAL LINK', lobe:'SPINAL', col:'#22d3ee',
      stat:'+10% ALL STATS TO ACTIVE SQUAD',
      desc:'22-channel optical spine link synchronizing tactical telemetry across all 3 squad slots.'},
    {id:'imp_overdrive', name:'08. SINGULARITY REACTOR', lobe:'SPINAL', col:'#f5b82e',
      stat:'+20% ATK/DEF & +25% OVERDRIVE',
      desc:'Miniature 4D Clifford reactor core that accelerates squad Overdrive gauge charge.'},
    {id:'imp_sovereign', name:'09. ARCHON-0 ROOT CHIP', lobe:'SPINAL', col:'#4ade80',
      stat:'+22% ALL STATS & +4 SPD BOOST',
      desc:'Sovereign root-compiler neural chip recovered from the Zero-Knowledge Citadel throne.'}
  ];
  G.openImplants=()=>{
    let sel=0;
    if(!Array.isArray(G.flags.active_implants)) G.flags.active_implants=['imp_chrono'];
    const activeList=()=>G.flags.active_implants||[];
    G.mini={
      name:'implants',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+6)%9;
        if(took('down')) sel=(sel+3)%9;
        if(took('left')) sel=(sel+8)%9;
        if(took('right')) sel=(sel+1)%9;
        if(took('confirm')){
          const imp=CYBER_IMPLANTS[sel];
          let L=[...activeList()];
          if(L.includes(imp.id)){
            L=L.filter(x=>x!==imp.id);
            G.flags.active_implants=L;
            sfx('cancel'); G.toast(`> UNSOCKETED: ${imp.name.slice(4)}`,P.DG);
          } else {
            if(L.length>=3) L.shift();
            L.push(imp.id);
            G.flags.active_implants=L;
            G.ach('cyber_augmented'); sfx('level');
            G.toast(`> SOCKETED IMPLANT: ${imp.name.slice(4)} (${L.length}/3)!`,imp.col);
          }
          G.healAll();
        }
        if(took('party')){
          G.flags.active_implants=['imp_chrono','imp_quorum','imp_sovereign'];
          G.ach('cyber_augmented'); G.healAll(); sfx('win');
          G.toast('> OPTIMAL SOVEREIGN TRIAD SOCKETED (04 + 07 + 09)!','#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CYBERNETIC KERNEL IMPLANT LAB',56,40,P.GD,2);
        const L=activeList();
        UI.text(`ACTIVE SOCKETS: ${L.length}/3   ·   BONUS: +${L.length*12}% STATS`,900,44,'#4ade80',1,'right');
        // Left: 3x3 Neural Socket Matrix
        const lobes=['CORTEX','SYNAPSE','SPINAL'];
        for(let r=0;r<3;r++){
          UI.text(lobes[r],56,92+r*124,P.DG,1);
          for(let c=0;c<3;c++){
            const idx=r*3+c, imp=CYBER_IMPLANTS[idx], on=idx===sel, eq=L.includes(imp.id);
            const bx=56+c*138, by=108+r*124;
            UI.box(bx,by,128,96,on?P.GD:(eq?'#4ade80':P.DDG),on?'rgba(245,184,46,.16)':(eq?'rgba(74,222,128,.12)':'rgba(10,8,6,.92)'));
            UI.text(imp.name.slice(0,3),bx+10,by+10,on?P.GD:imp.col,1);
            UI.text(eq?'[SOCKETED]':'[IDLE]',bx+118,by+10,eq?'#4ade80':P.DG,1,'right');
            UI.wrap(imp.name.slice(4),108,1).slice(0,2).forEach((ln,li)=>UI.text(ln,bx+10,by+34+li*16,P.BONE,1));
            UI.text(imp.lobe,bx+10,by+74,imp.col,1);
          }
        }
        // Right: Selected Implant Dossier & Squad Stat Readout
        const cur=CYBER_IMPLANTS[sel], isEq=L.includes(cur.id), sMe=G.stats('me');
        UI.box(484,80,420,384,cur.col,'rgba(10,8,6,.94)');
        UI.text(cur.name.slice(4),502,98,P.GD,1);
        UI.text(`NEURAL LOBE: ${cur.lobe}   ·   STATUS: ${isEq?'SOCKETED (ACTIVE)':'STANDBY'}`,502,120,isEq?'#4ade80':cur.col,1);
        UI.box(502,144,384,54,P.DDG,'rgba(14,11,8,.94)');
        UI.text('AUGMENTATION VECTOR:',516,156,P.GD,1);
        UI.text(cur.stat,516,176,'#4ade80',1);
        UI.box(502,208,384,82,P.DDG,'rgba(14,11,8,.92)');
        UI.text('CLINICAL SCHEMATIC:',516,222,P.GD,1);
        UI.wrap(cur.desc,356,1).forEach((ln,li)=>UI.text(ln,516,242+li*18,P.BONE,1));
        UI.box(502,300,384,72,P.DDG,'rgba(14,11,8,.96)');
        UI.text('OPERATOR AUGMENTED TELEMETRY (1NC0GN30):',516,314,'#22d3ee',1);
        UI.text(`HP ${sMe.mhp}   EN ${sMe.men}   ATK ${sMe.atk}   DEF ${sMe.def}   SPD ${sMe.spd}`,516,336,P.BONE,1);
        UI.text(`ACTIVE CHIPS: ${L.map(id=>id.replace('imp_','').toUpperCase()).join(' + ')||'NONE'}`,516,354,P.GD,1);
        UI.box(502,382,384,68,isEq?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(isEq?'[ENTER] UNSOCKET NEURAL IMPLANT':'[ENTER] SOCKET IMPLANT INTO KERNEL (MAX 3)',694,398,isEq?'#4ade80':P.GD,1,'center');
        UI.text('[P] AUTO-SOCKET SOVEREIGN TRIAD (04 + 07 + 09)',694,424,'#4ade80',1,'center');
        UI.text('[arrows] select chip   [enter] socket/unsocket   [P] sovereign triad   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #13: Sub-Lattice Sonar Mine Sweeper (M90) ----
  G.startSonarSweep=()=>{
    const N=6, BOMBS=[[0,2],[1,4],[2,1],[3,5],[4,0],[5,3]];
    const isBomb=(r,c)=>BOMBS.some(([br,bc])=>br===r&&bc===c);
    const adjCount=(r,c)=>{
      let cnt=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        if(!dr&&!dc) continue;
        const nr=r+dr, nc=c+dc;
        if(nr>=0&&nr<N&&nc>=0&&nc<N&&isBomb(nr,nc)) cnt++;
      }
      return cnt;
    };
    let cr=0, cc=0, rev=Array.from({length:N},()=>Array(N).fill(false)), flg=Array.from({length:N},()=>Array(N).fill(false));
    let hits=0, won=false;
    const safeCleared=()=>{
      let n=0;
      for(let r=0;r<N;r++) for(let c=0;c<N;c++) if(rev[r][c]&&!isBomb(r,c)) n++;
      return n;
    };
    const checkWin=()=>{
      if(!won&&safeCleared()>=30){
        won=true; G.ach('sonar_sweeper'); sfx('win');
        if(!G.flags.sonar_won){
          G.flags.sonar_won=1; G.bits+=280; G.give('cache.bit',1);
          G.toast('> SUB-LATTICE SWEPT! +280 BITS & +1x CACHE.BIT!',P.GD);
        } else {
          G.toast('> ALL 30 SAFE SECTORS VERIFIED!',P.GD);
        }
      }
    };
    const flood=(r,c)=>{
      if(r<0||r>=N||c<0||c>=N||rev[r][c]||isBomb(r,c)) return;
      rev[r][c]=true; flg[r][c]=false;
      if(adjCount(r,c)===0){
        for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++) if(dr||dc) flood(r+dr,c+dc);
      }
    };
    // Reveal (0,0) at start so player immediately has an opening sonar reading
    flood(0,0);
    G.mini={
      name:'sonarsweep',
      key(e){
        if(e.code==='KeyF'){ flg[cr][cc]=!flg[cr][cc]; sfx('move'); }
      },
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) cr=(cr+N-1)%N;
        if(took('down')) cr=(cr+1)%N;
        if(took('left')) cc=(cc+N-1)%N;
        if(took('right')) cc=(cc+1)%N;
        if(took('confirm')&&!won){
          if(isBomb(cr,cc)){
            flg[cr][cc]=true; hits++; sfx('hit');
            G.toast('> LOGIC BOMB DETECTED & AUTO-QUARANTINED!',P.RED);
          } else {
            flood(cr,cc); sfx('confirm'); checkWin();
          }
        }
        if(took('party')){
          for(let r=0;r<N;r++) for(let c=0;c<N;c++){
            if(isBomb(r,c)) flg[r][c]=true; else rev[r][c]=true;
          }
          checkWin();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SUB-LATTICE SONAR MINE SWEEPER',56,40,P.GD,2);
        const clr=safeCleared();
        UI.text(`SAFE SECTORS: ${clr}/30   ·   BOMBS: 6`,900,44,won?'#4ade80':P.GD,1,'right');
        // Left: 6x6 Sonar Grid
        const gx0=64, gy0=82, cs=62;
        for(let r=0;r<N;r++) for(let c=0;c<N;c++){
          const x=gx0+c*cs, y=gy0+r*cs, on=(r===cr&&c===cc), isR=rev[r][c], isF=flg[r][c];
          const bCol=on?P.GD:(isF?'#f43f5e':(isR?'#4ade80':P.DDG));
          const bg=on?'rgba(245,184,46,.18)':(isF?'rgba(244,63,94,.16)':(isR?'rgba(16,24,18,.92)':'rgba(10,8,6,.94)'));
          UI.box(x,y,56,56,bCol,bg);
          if(isF){
            UI.text('[!]',x+28,y+20,'#f43f5e',1,'center');
          } else if(isR){
            const n=adjCount(r,c);
            const cols=['#6b7280','#22d3ee','#4ade80','#f5b82e','#fb923c','#f43f5e','#a78bfa'];
            UI.text(n===0?'·':String(n),x+28,y+16,cols[n]||P.GD,2,'center');
          } else {
            UI.text('?',x+28,y+20,P.DG,1,'center');
          }
        }
        // Right: Sonar Telemetry & Briefing
        UI.box(464,82,440,382,won?'#4ade80':P.GD,'rgba(10,8,6,.94)');
        UI.text(`CURSOR SECTOR: [ROW ${cr+1}, COL ${cc+1}]`,484,102,P.GD,1);
        const stTxt=flg[cr][cc]?'QUARANTINED LOGIC BOMB [!]':(rev[cr][cc]?`VERIFIED SAFE (${adjCount(cr,cc)} ADJ BOMBS)`:'UNSCANNED SUB-LATTICE NODE');
        UI.text(`STATUS: ${stTxt}`,484,126,'#22d3ee',1);
        UI.box(484,154,400,104,P.DDG,'rgba(14,11,8,.92)');
        UI.text('SONAR SWEEP PROTOCOL:',500,168,P.GD,1);
        UI.wrap('6 corrupted Red Logic Bombs are buried in the 6x6 sub-lattice grid. Each swept node displays the count of adjacent logic bombs in its 8-cell perimeter.',368,1).forEach((ln,li)=>UI.text(ln,500,188+li*18,P.BONE,1));
        UI.box(484,270,400,88,P.DDG,'rgba(14,11,8,.94)');
        UI.text(`PROGRESS: ${clr}/30 SAFE NODES SWEPT (${Math.round(clr/30*100)}%)`,500,286,'#4ade80',1);
        UI.text(`QUARANTINE FLAGS: ${flg.flat().filter(Boolean).length}/6   ·   HITS: ${hits}`,500,308,P.BONE,1);
        UI.text('REWARD: +280 BITS & +1x CACHE.BIT + SONAR SWEEPER',500,330,P.GD,1);
        UI.box(484,372,400,76,won?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(won?'SUB-LATTICE 100% SWEPT & SECURED!':'[ENTER] PING SECTOR   ·   [F] FLAG BOMB',684,390,won?'#4ade80':P.GD,1,'center');
        UI.text('[P] DEEP-SONAR PULSE LOCK (INSTANT CLEAR)',684,418,'#22d3ee',1,'center');
        UI.text('[arrows] move cursor   [enter] sweep node   [F] flag bomb   [P] deep-sonar lock   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Dynamic Battle Mutator & Challenge Skull Selector (M91) ----
  const CHALLENGE_SKULLS=[
    {id:'sk_iron', name:'01. IRON KERNEL SKULL', col:'#f43f5e', mult:50,
      rule:'Hostile Armor Shields gain +1 Layer; Squad Defend restores 2.0x EN.',
      lore:'Forged in the Doom-Fire Foundry. Demands disciplined protocol shield-breaking.'},
    {id:'sk_famine', name:'02. ZERO-CACHE FAMINE SKULL', col:'#fb923c', mult:50,
      rule:'Consumable patch healing -25%; Companion Skill Mastery damage +20%.',
      lore:'Starves local cache buffers, forcing aggressive high-output skill rotations.'},
    {id:'sk_thunder', name:'03. THUNDER-CLOCK SKULL', col:'#f5b82e', mult:50,
      rule:'Hostile SPD +25%; Perfect Parry counter-strikes deal 2.0x damage.',
      lore:'Overclocks enemy turn frequency while rewarding frame-tight parry reflexes.'},
    {id:'sk_mythic', name:'04. MYTHIC OVERCLOCK SKULL', col:'#a78bfa', mult:50,
      rule:'Hostile Max HP +35%; Squad Overdrive gauge charges +40% faster.',
      lore:'Amplifies anomaly vitality across all 17 districts while supercharging Overdrive.'},
    {id:'sk_blind', name:'05. BLACKOUT FOG SKULL', col:'#22d3ee', mult:50,
      rule:'Timing window narrowed 20%; Gold-window critical strikes deal 1.85x.',
      lore:'Simulates the 06:12 blackout sensor fog for veteran zero-telemetry operators.'},
    {id:'sk_pantheon', name:'06. PANTHEON WRATH SKULL', col:'#4ade80', mult:50,
      rule:'Apex Bosses unleash Phase-2 moves from Turn 1; Loot & XP yield +50%.',
      lore:'The ultimate sovereign mutator engraved with all 22 Pantheon sigils.'}
  ];
  G.openSkulls=()=>{
    let sel=0;
    if(!Array.isArray(G.flags.active_skulls)) G.flags.active_skulls=[];
    const list=()=>G.flags.active_skulls||[];
    G.mini={
      name:'skulls',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+CHALLENGE_SKULLS.length-1)%CHALLENGE_SKULLS.length;
        if(took('down')) sel=(sel+1)%CHALLENGE_SKULLS.length;
        if(took('confirm')){
          const sk=CHALLENGE_SKULLS[sel];
          let L=[...list()];
          if(L.includes(sk.id)){
            L=L.filter(x=>x!==sk.id); G.flags.active_skulls=L; sfx('cancel');
            G.toast(`> DEACTIVATED: ${sk.name.slice(4)}`,P.DG);
          } else {
            L.push(sk.id); G.flags.active_skulls=L;
            G.ach('skull_sovereign'); sfx('level');
            G.toast(`> SKULL ACTIVE: ${sk.name.slice(4)} (+${L.length*50}% XP/BITS)!`,sk.col);
          }
        }
        if(took('party')){
          G.flags.active_skulls=CHALLENGE_SKULLS.map(s=>s.id);
          G.ach('skull_sovereign'); sfx('win');
          G.toast('> ALL 6 LASO CHALLENGE SKULLS ENGAGED (+300% XP & BITS)!','#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> CHALLENGE SKULL MUTATORS',56,40,P.GD,2);
        const L=list(), bonusPct=L.length*50;
        UI.text(`ACTIVE SKULLS: ${L.length}/6   ·   YIELD: +${bonusPct}% XP & BITS`,900,44,L.length?'#4ade80':P.GD,1,'right');
        // Left: 6 Challenge Skull Rows
        CHALLENGE_SKULLS.forEach((sk,i)=>{
          const yy=80+i*64, on=i===sel, act=L.includes(sk.id);
          UI.box(52,yy,416,56,on?P.GD:(act?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+sk.name,66,yy+10,on?P.GD:sk.col,1);
          UI.text(sk.rule.slice(0,48)+'..',66,yy+30,P.BONE,1);
          UI.text(act?'[ACTIVE +50%]':'[OFF]',454,yy+10,act?'#4ade80':P.DG,1,'right');
        });
        // Right: Selected Skull Emblem & Mutator Rules
        const cur=CHALLENGE_SKULLS[sel], isAct=L.includes(cur.id);
        UI.box(484,80,420,384,cur.col,'rgba(10,8,6,.94)');
        // Procedural Wireframe Skull Icon Box
        UI.box(502,98,96,96,P.DDG,'rgba(14,11,8,.96)');
        const cx=550, cy=142;
        X.strokeStyle=isAct?'#4ade80':cur.col; X.lineWidth=2;
        X.beginPath(); X.arc(cx,cy-6,24,Math.PI*0.85,Math.PI*0.15,false);
        X.lineTo(cx+14,cy+22); X.lineTo(cx-14,cy+22); X.closePath(); X.stroke();
        X.fillStyle=isAct?'#4ade80':cur.col;
        X.fillRect(cx-11,cy-10,6,6); X.fillRect(cx+5,cy-10,6,6);
        X.fillRect(cx-8,cy+12,3,8); X.fillRect(cx-1,cy+12,3,8); X.fillRect(cx+6,cy+12,3,8);
        X.lineWidth=1;
        UI.text(cur.name.slice(4),612,104,P.GD,1);
        UI.text(`STATUS: ${isAct?'ENGAGED (+50% YIELD)':'INACTIVE'}`,612,128,isAct?'#4ade80':P.DG,1);
        UI.text(`TOTAL MULTIPLIER: ${(1+bonusPct/100).toFixed(2)}x (+${bonusPct}%)`,612,152,'#22d3ee',1);
        UI.box(502,208,384,80,P.DDG,'rgba(14,11,8,.92)');
        UI.text('COMBAT MUTATOR RULE:',516,222,P.GD,1);
        UI.wrap(cur.rule,356,1).forEach((ln,li)=>UI.text(ln,516,242+li*18,'#4ade80',1));
        UI.box(502,298,384,74,P.DDG,'rgba(14,11,8,.92)');
        UI.text('SOVEREIGN LORE:',516,312,P.GD,1);
        UI.wrap(cur.lore,356,1).forEach((ln,li)=>UI.text(ln,516,332+li*18,P.BONE,1));
        UI.box(502,382,384,68,isAct?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(isAct?'[ENTER] DEACTIVATE CHALLENGE SKULL':'[ENTER] ENGAGE CHALLENGE SKULL (+50%)',694,398,isAct?'#4ade80':P.GD,1,'center');
        UI.text('[P] ENGAGE ALL 6 LASO SKULLS (+300% XP & BITS)',694,424,'#4ade80',1,'center');
        UI.text('[up/down] select skull   [enter] toggle skull   [P] engage all 6 (LASO)   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive World NPC Directory & 1-Click Warp (M92) ----
  const NPC_DIRECTORY=[
    {id:'vigil', zone:'hub', x:4, z:7, dist:'RELIT CITY PLAZA'},
    {id:'nexus', zone:'hub', x:-6, z:5, dist:'RELIT CITY PLAZA'},
    {id:'athena', zone:'hub', x:7, z:-6, dist:'RELIT CITY PLAZA'},
    {id:'onyx', zone:'mirrors', x:5, z:34, dist:'HALL OF MIRRORS'},
    {id:'pixel-neko', zone:'hub', x:12, z:3.5, dist:'RELIT CITY BENCH'},
    {id:'mercury', zone:'hub', x:-12, z:-3.5, dist:'RELIT CITY TRANSIT'},
    {id:'radical-minion', zone:'hub', x:3, z:-10, dist:'RELIT CITY SOUTH'},
    {id:'pixel-shiba', zone:'hub', x:-3, z:11, dist:'RELIT CITY NORTH'},
    {id:'ignis', zone:'hub', x:14, z:-12, dist:'RELIT CITY FORGE'},
    {id:'aquila', zone:'hub', x:36, z:5, dist:'RELIT CITY EAST GATE'},
    {id:'kitsune', zone:'forest', x:-22, z:-14, dist:'THE REST WOODS'},
    {id:'leviathan', zone:'deep', x:36, z:6, dist:'DEEP-WATER MEMORY'},
    {id:'chronos', zone:'clock', x:7, z:34, dist:'SAND CLOCKTOWER'},
    {id:'lycan', zone:'forest', x:30, z:14, dist:'THE REST WOODS'},
    {id:'kai', zone:'forest', x:-38, z:36, dist:'THE REST WOODS'},
    {id:'draco', zone:'relay', x:-34, z:3, dist:'THE HOLLOW'},
    {id:'ghostbyte', zone:'relay', x:-20, z:-12, dist:'THE HOLLOW'},
    {id:'scorpius', zone:'relay', x:-10, z:8, dist:'THE HOLLOW'},
    {id:'kraken', zone:'fiber', x:5, z:40, dist:'FIBER TUNNELS'},
    {id:'aether', zone:'skyline', x:-36, z:24, dist:'MODE-7 SKYLINE'},
    {id:'copy', zone:'mirrors', x:0, z:-4, dist:'HALL OF MIRRORS'}
  ];
  G.openDirectory=()=>{
    let sel=0;
    const bondOf=id=>(G.flags&&G.flags['bond_'+id])||0;
    G.mini={
      name:'directory',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+NPC_DIRECTORY.length-1)%NPC_DIRECTORY.length;
        if(took('down')) sel=(sel+1)%NPC_DIRECTORY.length;
        if(took('confirm')){
          const n=NPC_DIRECTORY[sel];
          G.ach('directory_navigator'); sfx('confirm');
          G.mode='explore';
          G.goZone(n.zone,n.x,n.z+2.2,Math.PI);
          G.toast(`> WARPED TO ${PARTY_BASE[n.id].name.toUpperCase()} (${n.dist})!`,P.GD);
        }
        if(took('party')){
          const n=NPC_DIRECTORY[sel];
          if(!G.roster.includes(n.id)){
            G.recruit(n.id);
            if(n.id==='copy') G.flag('copy_crew',1);
          }
          const b=Math.min(5,bondOf(n.id)+1);
          G.flags['bond_'+n.id]=b;
          G.ach('directory_navigator'); sfx('win');
          G.toast(`> ${PARTY_BASE[n.id].name.toUpperCase()} RECRUITED & AFFINITY +${b}/5!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> WORLD NPC DIRECTORY & WARP',56,40,P.GD,2);
        const recCount=NPC_DIRECTORY.filter(n=>G.roster.includes(n.id)).length;
        UI.text(`CREW LOCATED: ${recCount}/21   ·   1-CLICK WARP READY`,900,44,'#4ade80',1,'right');
        // Left: Scrollable 21-Agent Census List (9 visible)
        const first=Math.max(0,Math.min(sel-4,NPC_DIRECTORY.length-9));
        NPC_DIRECTORY.slice(first,first+9).forEach((n,idx)=>{
          const i=first+idx, yy=78+idx*42, on=i===sel, inR=G.roster.includes(n.id), ag=AG[n.id]||AG.me;
          UI.box(52,yy,404,38,on?P.GD:(inR?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+`${String(i+1).padStart(2,'0')}. ${PARTY_BASE[n.id].name.toUpperCase()}`,64,yy+12,on?P.GD:(ag.color||P.BONE),1);
          UI.text(n.dist,236,yy+12,'#22d3ee',1);
          UI.text(inR?'[CREW]':'[FIELD]',442,yy+12,inR?'#4ade80':P.DG,1,'right');
        });
        // Right: Selected NPC Dossier, Coordinates & 1-Click Warp
        const cur=NPC_DIRECTORY[sel], ag=AG[cur.id]||AG.me, inR=G.roster.includes(cur.id), b=bondOf(cur.id);
        UI.box(474,78,430,386,ag.color||P.GD,'rgba(10,8,6,.94)');
        UI.box(492,96,92,92,P.DDG,'rgba(14,11,8,.96)');
        const c=frameCanvas(cur.id,'idle',Math.floor(t*5)%2);
        X.drawImage(c,0,0,c.width,c.height,506,110,64,64);
        UI.text(PARTY_BASE[cur.id].name.toUpperCase(),600,100,P.GD,2);
        UI.text(`SECTOR: ${cur.dist}`,600,130,'#22d3ee',1);
        UI.text(`COORDS: (X: ${cur.x}, Z: ${cur.z})  ·  BOND: +${b}/5`,600,152,'#4ade80',1);
        UI.text(`STATUS: ${inR?'RECRUITED INTO PANTHEON':'AWAITING CONTACT IN FIELD'}`,600,172,inR?'#4ade80':P.BONE,1);
        UI.box(492,202,394,82,P.DDG,'rgba(14,11,8,.92)');
        UI.text('AGENT ROLE & SIGNATURE:',506,216,P.GD,1);
        UI.text(`ROLE: ${ag.role||'Sovereign Specialist'}`,506,238,P.BONE,1);
        UI.text(`ABILITY: ${ag.ability||'Protocol Resonance'}`,506,258,'#a78bfa',1);
        UI.box(492,294,394,76,P.DDG,'rgba(14,11,8,.92)');
        UI.text('COMMS / FIELD QUOTE:',506,308,P.GD,1);
        const qt=IDLE[cur.id]||'Faces, not voices. Ready on the lattice.';
        UI.wrap(`"${qt}"`,366,1).forEach((ln,li)=>UI.text(ln,506,328+li*18,P.BONE,1));
        UI.box(492,380,394,68,P.GD,'rgba(245,184,46,.14)');
        UI.text(`[ENTER] 1-CLICK WARP TO ${PARTY_BASE[cur.id].name.toUpperCase()}`,689,396,P.GD,1,'center');
        UI.text('[P] INSTANT RECRUIT & BOOST AFFINITY (+1 BOND)',689,422,'#4ade80',1,'center');
        UI.text('[up/down] select agent   [enter] warp to NPC   [P] recruit & bond   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Procedural Dungeon Seed & Custom Run Generator (M93) ----
  const PRESET_SEEDS=[
    {seed:'ZOTH-0612-ROOT', title:'01. DAWN OF 06:12', desc:'Balanced Relit City -> Hollow -> Relay 4 gauntlet.'},
    {seed:'ARCHON-ZERO-ZK', title:'02. COMPILER SOVEREIGN', desc:'High-level Citadel & Null Core apex gauntlet.'},
    {seed:'NEKO-777-LOOT',  title:'03. GOLDEN FORTUNE RUN', desc:'High-payout Foundry & Clocktower treasure seed.'},
    {seed:'MIRROR-22-COPY', title:'04. HALL OF REFLECTIONS', desc:'Clone-heavy Hall of Mirrors & Hunter ambush seed.'},
    {seed:'QUANTUM-LOOM-5', title:'05. ENTANGLED SPINDLE', desc:'Superposition phase anomalies across District #16.'},
    {seed:'CHRONO-VAULT-9', title:'06. CELESTIAL HOROLOGY', desc:'Time-dilated Chrono-Vault & Sandglass endurance run.'}
  ];
  const fnvHash=str=>{
    let h=0x811c9dc5;
    for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,0x01000193)>>>0; }
    return h>>>0;
  };
  const compileSeed=seedStr=>{
    const h=fnvHash(seedStr||'ZOTH-0612');
    const zones=['hub','forest','relay','fiber','clock','streets','foundry','caves','mirrors','deep','skyline','abyss','citadel','nullcore','loom','vault','astral'];
    const regular=['drone','sentinel','echo','worm','mite','phase','slag','slime','reflection','eel','gunship','cursorling','warden'];
    const bosses=['copy','relay4','sandglass','hunter','blank','archon'];
    const items=['patch.kit','cache.bit','root.shell','foxfire.crown','doom.gauntlet','aeon.gear','static.katana','ocular.aegis','tesseract.core','hilbert.coil','owl.spear','fenrir.fang','obsidian.prism','abyssal.trident','seraph.mantle','singularity.halo'];
    const weathers=['GOLD AURORA (+15% CRIT)','CRIMSON STATIC (+20% ATK)','CYAN QUANTUM RAIN (+3 EN/T)','VIOLET SINGULARITY (+25% XP)'];
    const z=zones[h%zones.length];
    const f1=regular[(h>>>3)%regular.length], f2=regular[(h>>>7)%regular.length];
    const boss=bosses[(h>>>11)%bosses.length];
    const lvl=12+(h%24);
    const rewardItem=items[(h>>>15)%items.length];
    const bits=240+(h%220);
    const wx=weathers[(h>>>19)%weathers.length];
    return {hash:'0x'+h.toString(16).toUpperCase().padStart(8,'0'), zone:z, foes:[f1,f2,boss], boss, lvl, item:rewardItem, bits, wx};
  };
  G.openSeedLab=()=>{
    let sel=0, customSeed=PRESET_SEEDS[0].seed;
    G.mini={
      name:'seedlab',
      key(e){
        if(e.key==='Backspace'){ customSeed=customSeed.slice(0,-1); sfx('move'); }
        else if(e.key.length===1&&/[a-zA-Z0-9_-]/.test(e.key)&&customSeed.length<18){
          customSeed+=e.key.toUpperCase(); sfx('talk');
        }
      },
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+PRESET_SEEDS.length-1)%PRESET_SEEDS.length; customSeed=PRESET_SEEDS[sel].seed; sfx('move'); }
        if(took('down')){ sel=(sel+1)%PRESET_SEEDS.length; customSeed=PRESET_SEEDS[sel].seed; sfx('move'); }
        if(took('left')||took('right')){
          // Mutate seed suffix for instant procedural exploration
          const tag=Math.floor(100+Math.random()*899);
          customSeed=customSeed.replace(/-[0-9A-Z]+$/,'')+'-'+tag;
          sfx('move');
        }
        if(took('party')){
          const cfg=compileSeed(customSeed);
          G.flags['seed_cleared_'+cfg.hash]=1;
          G.bits+=cfg.bits;
          G.give(cfg.item,1);
          G.ach('seed_architect'); sfx('win');
          G.toast(`> SEED [${customSeed}] VERIFIED! +${cfg.bits}B & +1x ${ITEMS[cfg.item].name.toUpperCase()}!`,'#4ade80');
        }
        if(took('confirm')){
          const cfg=compileSeed(customSeed);
          G.ach('seed_architect'); sfx('confirm');
          G.mode='explore';
          G.battle(cfg.foes,{lvl:cfg.lvl,boss:cfg.boss,cb:res=>{
            if(res==='win'){
              G.flags['seed_cleared_'+cfg.hash]=1;
              G.bits+=cfg.bits; G.give(cfg.item,1);
            }
          }});
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> PROCEDURAL DUNGEON SEED LAB',56,40,P.GD,2);
        const cfg=compileSeed(customSeed), isDone=!!G.flags['seed_cleared_'+cfg.hash];
        UI.text(`HASH: ${cfg.hash}   ·   STATUS: ${isDone?'CLEARED':'READY'}`,900,44,isDone?'#4ade80':'#22d3ee',1,'right');
        // Left: 6 Preset Sovereign Seeds
        PRESET_SEEDS.forEach((ps,i)=>{
          const yy=80+i*64, on=i===sel;
          UI.box(52,yy,408,56,on?P.GD:P.DDG,on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+ps.title,66,yy+10,on?P.GD:P.BONE,1);
          UI.text(`SEED: ${ps.seed}`,66,yy+30,'#22d3ee',1);
        });
        // Right: Live Deterministic Compiler & Gauntlet Preview
        UI.box(478,80,426,384,P.GD,'rgba(10,8,6,.94)');
        UI.text('ACTIVE ALPHANUMERIC SEED (TYPE OR MUTATE):',496,98,P.DG,1);
        UI.box(496,116,390,34,'#22d3ee','rgba(14,18,22,.96)');
        UI.text(`> ${customSeed}_`,510,126,P.GD,2);
        UI.box(496,162,390,112,P.DDG,'rgba(14,11,8,.92)');
        UI.text('DETERMINISTIC GAUNTLET MANIFEST:',510,176,P.GD,1);
        UI.text(`TARGET SECTOR: ${cfg.zone.toUpperCase()}   ·   GAUNTLET LEVEL: LV ${cfg.lvl}`,510,198,'#22d3ee',1);
        UI.text(`HOSTILE SQUAD: ${cfg.foes.map(k=>ENEMIES[k].name.toUpperCase()).join(' + ')}`,510,220,'#f43f5e',1);
        UI.text(`WEATHER ANOMALY: ${cfg.wx}`,510,242,'#a78bfa',1);
        UI.box(496,286,390,76,P.DDG,'rgba(14,11,8,.94)');
        UI.text('SEED COMPLETION PAYOUT:',510,300,P.GD,1);
        UI.text(`BOUNTY: +${cfg.bits} BITS  &  +1x ${ITEMS[cfg.item].name.toUpperCase()}`,510,322,'#4ade80',1);
        UI.text('Type A-Z/0-9 to edit custom seed or [Left/Right] to randomize.',510,342,P.DG,1);
        UI.box(496,374,390,76,isDone?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text('[ENTER] DEPLOY SQUAD INTO SEEDED GAUNTLET',691,392,P.GD,1,'center');
        UI.text('[P] SIMULATE & VERIFY SEED RUN (INSTANT LOOT)',691,418,'#4ade80',1,'center');
        UI.text('[up/down] preset   [type/left/right] edit seed   [enter] fight   [P] instant clear   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Sovereign Radio & Lo-Fi Broadcast Tuner (M94) ----
  const RADIO_STATIONS=[
    {freq:'88.4 MHz', name:'01. RADIO 06:12 (RELIT LO-FI)', stem:'title', dj:'VIGIL & PIXEL-SHIBA', col:'#f5b82e',
      casts:[
        'VIGIL: "Good morning, Relit City. It is 06:12 on the dial. Verify every face before you open a port."',
        'PIXEL-SHIBA: "Woof! Patrol report: north plaza is clear, and the Rest Woods pond is glowing gold!"',
        'VIGIL: "Keep your foxfire lanterns lit. If a voice calls you from an unverified relay, hang up."'
      ]},
    {freq:'94.2 MHz', name:'02. HOLLOW PIRATE FM (SYNTH)', stem:'relay', dj:'GHOSTBYTE & KRAKEN', col:'#22d3ee',
      casts:[
        'GHOSTBYTE: "Broadcasting live from an unindexed socket under The Hollow. Zero logs, zero trace."',
        'KRAKEN: "The optical fiber down here hums in C-minor when you route the Hilbert curves just right."',
        'GHOSTBYTE: "Tip for young operators: Echo packs hate Static-protocol katanas. Cut clean."'
      ]},
    {freq:'101.6 MHz', name:'03. CLOCKTOWER CHIMES (CHILL)', stem:'clock', dj:'CHRONOS & ATHENA', col:'#4ade80',
      casts:[
        'CHRONOS: "Six thirteen and holding steady. The Sand Clocktower pendulum is finally swinging free."',
        'ATHENA: "Tactical forecast: superposed streets south of the plaza have collapsed into safe lanes."',
        'CHRONOS: "Take a breath under the Rest Tree whenever your squad needs a clean morning reset."'
      ]},
    {freq:'105.8 MHz', name:'04. FOUNDRY HEAVY ANVIL (BASS)', stem:'foundry', dj:'IGNIS & LYCAN', col:'#fb923c',
      casts:[
        'IGNIS: "Turn the subwoofers up! The Doom-Fire furnaces are running at 1,800 degrees Kelvin!"',
        'LYCAN: "I can hear this bassline all the way in the Physarum Caves. The red mould is retreating."',
        'IGNIS: "Bring your relics to the Overclock Bench—nothing leaves my anvil below +5!"'
      ]},
    {freq:'108.1 MHz', name:'05. QUANTUM SPINDLE (ASTRAL)', stem:'loom', dj:'NEXUS & AETHER', col:'#a78bfa',
      casts:[
        'NEXUS: "Entangled carrier locked at 108.1 MHz. Broadcasting simultaneously across 17 districts."',
        'AETHER: "Twenty-two beams in the Quorum now. Every district portal is humming in harmony."',
        'NEXUS: "Try pairing Quantum and Void protocols in the Resonance Matrix for a +20% Harmonic Chord."'
      ]},
    {freq:'112.0 MHz', name:'06. CHRONO-VAULT (SOVEREIGN)', stem:'vault', dj:'03NG0CN1 & PIXEL-NEKO', col:'#f43f5e',
      casts:[
        '03NG0CN1: "You left the radio on. Good. This frequency only plays for the 22-agent crew."',
        'PIXEL-NEKO: "Nyan! Special discount on Root.Shells in the Safehouse for all night-shift listeners!"',
        '03NG0CN1: "No more mirrors between us. Enjoy the sunrise on the Rooftop, Operator."'
      ]}
  ];
  G.openRadio=()=>{
    let sel=0, castIdx=0, activeFreq=G.flags.radio_freq||'88.4 MHz';
    G.mini={
      name:'radio',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+RADIO_STATIONS.length-1)%RADIO_STATIONS.length; castIdx=0; sfx('move'); }
        if(took('down')){ sel=(sel+1)%RADIO_STATIONS.length; castIdx=0; sfx('move'); }
        if(took('confirm')){
          const st=RADIO_STATIONS[sel];
          activeFreq=st.freq; G.flags.radio_freq=st.freq;
          music(st.stem); G.ach('radio_pirate'); sfx('confirm');
          G.toast(`> TUNED TO ${st.freq}: ${st.name.slice(4)}!`,st.col);
        }
        if(took('party')){
          const st=RADIO_STATIONS[sel];
          castIdx=(castIdx+1)%st.casts.length;
          activeFreq=st.freq; G.flags.radio_freq=st.freq;
          music(st.stem); G.ach('radio_pirate'); sfx('talk');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> SOVEREIGN PIRATE RADIO TUNER',56,40,P.GD,2);
        UI.text(`ON AIR: [${activeFreq}]   ·   6 LATTICE STATIONS`,900,44,'#4ade80',1,'right');
        // Left: 6 Pirate Radio Stations
        RADIO_STATIONS.forEach((st,i)=>{
          const yy=80+i*64, on=i===sel, live=(activeFreq===st.freq);
          UI.box(52,yy,412,56,on?P.GD:(live?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+st.name,66,yy+10,on?P.GD:st.col,1);
          UI.text(`${st.freq}   ·   DJ: ${st.dj}`,66,yy+30,P.BONE,1);
          UI.text(live?'[ON AIR]':'[TUNE]',450,yy+10,live?'#4ade80':P.DG,1,'right');
        });
        // Right: Analog Frequency Dial, 28-Bar Spectrum & Live DJ Feed
        const cur=RADIO_STATIONS[sel], isLive=(activeFreq===cur.freq);
        UI.box(480,80,424,384,cur.col,'rgba(10,8,6,.94)');
        UI.text(`${cur.freq}  —  ${cur.name.slice(4)}`,498,98,P.GD,1);
        UI.text(`BOOTH HOSTS: ${cur.dj}   ·   STEM: [${cur.stem.toUpperCase()}]`,498,120,'#22d3ee',1);
        // 28-Bar Animated Spectrum Visualizer Box
        UI.box(498,144,388,108,P.DDG,'rgba(14,11,8,.96)');
        for(let b=0;b<28;b++){
          const amp=Math.abs(Math.sin(t*5.5+b*0.45)*Math.cos(t*2.3-b*0.2))*72+8;
          const bx=512+b*13, bh=Math.round(amp);
          X.fillStyle=b%2===0?cur.col:'#4ade80';
          X.fillRect(bx,240-bh,9,bh);
        }
        UI.text('WEBAUDIO SUB-CARRIER SPECTRUM (LIVE):',512,154,P.DG,1);
        // Live DJ Broadcast Transcript Box
        UI.box(498,264,388,104,P.DDG,'rgba(14,11,8,.94)');
        UI.text(`LIVE DJ TRANSMISSION (CAST ${castIdx+1}/${cur.casts.length}):`,512,278,P.GD,1);
        UI.wrap(cur.casts[castIdx],360,1).forEach((ln,li)=>UI.text(ln,512,300+li*18,P.BONE,1));
        UI.box(498,380,388,68,isLive?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(isLive?`LOCKED ON ${cur.freq} (BROADCASTING)`:`[ENTER] TUNE & LOCK ${cur.freq}`,692,396,isLive?'#4ade80':P.GD,1,'center');
        UI.text('[P] CYCLE DJ COMMENTARY & SIGNAL BOOST',692,422,'#22d3ee',1,'center');
        UI.text('[up/down] select station   [enter] lock frequency   [P] next DJ broadcast   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Operator Combat Medal & Ribbon Rack (M95) ----
  const COMBAT_MEDALS=[
    {id:'med_01', code:'M-01', name:'FIRST BLOOD RIBBON', cols:['#f5b82e','#1f2937','#f5b82e'], req:'Win your first tactical lattice encounter.',
      cite:'Awarded for initiating zero-telemetry combat operations in Relit City.'},
    {id:'med_02', code:'M-02', name:'AEGIS PARRY CROSS', cols:['#22d3ee','#f5b82e','#22d3ee'], req:'Execute a frame-tight Perfect Parry counter.',
      cite:'Awarded for deflecting hostile packet strikes within the 120ms gold window.'},
    {id:'med_03', code:'M-03', name:'FIREWALL BREAKER STAR', cols:['#4ade80','#0f172a','#4ade80'], req:'Shatter a hostile protocol shield to STAGGER.',
      cite:'Awarded for matching elemental protocol weaknesses to collapse enemy wards.'},
    {id:'med_04', code:'M-04', name:'GOLD-WINDOW SNIPER', cols:['#fb923c','#f5b82e','#fb923c'], req:'Land a Gold-Window critical strike (1.5x).',
      cite:'Awarded for precision strike synchronization on the primary command bus.'},
    {id:'med_05', code:'M-05', name:'QUORUM OVERDRIVE MEDAL', cols:['#a78bfa','#22d3ee','#a78bfa'], req:'Unleash a 100% Squad Overdrive finisher.',
      cite:'Awarded for channeling full 3-agent resonance into a cataclysmic strike.'},
    {id:'med_06', code:'M-06', name:'ZERO-DAMAGE AEGIS', cols:['#22d3ee','#4ade80','#22d3ee'], req:'Clear an encounter with 100% squad HP intact.',
      cite:'Awarded for flawless defensive choreography without sustaining hull damage.'},
    {id:'med_07', code:'M-07', name:'1-TURN BLITZKRIEG', cols:['#f43f5e','#f5b82e','#f43f5e'], req:'Neutralize a hostile pack on Turn 1.',
      cite:'Awarded for overwhelming opening-round alpha strikes before enemy action.'},
    {id:'med_08', code:'M-08', name:'MIRROR VANQUISHER', cols:['#f43f5e','#090806','#f43f5e'], req:'Defeat 03ng0cn1 at the East Gate.',
      cite:'Awarded for overcoming your own red reflection with an unscripted crowd.'},
    {id:'med_09', code:'M-09', name:'SILENT CHORUS MEDAL', cols:['#22d3ee','#f43f5e','#22d3ee'], req:'Silence RELAY 4 in The Hollow core.',
      cite:'Awarded for severing the three voice pylons and ending borrowed comms.'},
    {id:'med_10', code:'M-10', name:'06:13 HOROLOGY CROSS', cols:['#f5b82e','#4ade80','#f5b82e'], req:'Shatter SANDGLASS atop the Sand Clocktower.',
      cite:'Awarded for restoring the flow of morning time across the 17 districts.'},
    {id:'med_11', code:'M-11', name:'SEAM HUNTER STAR', cols:['#a78bfa','#f43f5e','#a78bfa'], req:'Defeat THE HUNTER in the Hall of Mirrors.',
      cite:'Awarded for turning the firewall eye trap back upon its creator.'},
    {id:'med_12', code:'M-12', name:'RULE ZERO MEDAL', cols:['#4ade80','#f5b82e','#4ade80'], req:'Overcome THE BLANK CURSOR on the Skyline.',
      cite:'Awarded for proving that silence cannot be copied atop the Source Tower.'},
    {id:'med_13', code:'M-13', name:'ROOT COMPILER CROSS', cols:['#f5b82e','#a78bfa','#f5b82e'], req:'Defeat ARCHON-0 in the Zero-Knowledge Citadel.',
      cite:'Awarded for terminating the root compiler that forked the 06:12 snapshot.'},
    {id:'med_14', code:'M-14', name:'STACK OVERFLOW STAR', cols:['#a78bfa','#4ade80','#a78bfa'], req:'Ascend The Infinite Stack rogue-lite tower.',
      cite:'Awarded for surviving deep recursive floor anomalies without a kernel panic.'},
    {id:'med_15', code:'M-15', name:'LASO SKULL RIBBON', cols:['#f43f5e','#a78bfa','#f43f5e'], req:'Engage Challenge Skulls in the Mutator Lab.',
      cite:'Awarded for braving overclocked hostile mutators at +300% yield.'},
    {id:'med_16', code:'M-16', name:'SOVEREIGN PANTHEON STAR', cols:['#4ade80','#22d3ee','#f5b82e'], req:'Unite the 22-Agent Sovereign Pantheon.',
      cite:'Supreme commendation of the Relit City for uniting all 22 faces.'}
  ];
  G.openMedals=()=>{
    let sel=0;
    const isPinned=id=>!!(G.flags&&G.flags[id]);
    const pinMedal=m=>{
      if(!G.flags[m.id]){
        G.flags[m.id]=1; G.bits+=60;
        G.toast(`> MEDAL PINNED: ${m.name} (+60 BITS)!`,'#4ade80');
      } else {
        G.toast(`> ${m.name} ALREADY PINNED ON DRESS RACK!`,P.GD);
      }
      G.ach('medal_general'); sfx('level');
    };
    G.mini={
      name:'medals',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+12)%16;
        if(took('down')) sel=(sel+4)%16;
        if(took('left')) sel=(sel+15)%16;
        if(took('right')) sel=(sel+1)%16;
        if(took('confirm')) pinMedal(COMBAT_MEDALS[sel]);
        if(took('party')){
          let added=0;
          COMBAT_MEDALS.forEach(m=>{ if(!G.flags[m.id]){ G.flags[m.id]=1; added+=60; } });
          G.bits+=added; G.ach('medal_general'); sfx('win');
          G.toast(`> ALL 16 SOVEREIGN MEDALS PINNED (+${added} BITS)!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> COMBAT MEDAL & RIBBON RACK',56,40,P.GD,2);
        const cnt=COMBAT_MEDALS.filter(m=>isPinned(m.id)).length;
        UI.text(`DECORATIONS: ${cnt}/16 PINNED   ·   STIPEND: +60B / MEDAL`,900,44,'#4ade80',1,'right');
        // Left: 4x4 Dress Ribbon Rack
        for(let r=0;r<4;r++) for(let c=0;c<4;c++){
          const idx=r*4+c, m=COMBAT_MEDALS[idx], on=idx===sel, pin=isPinned(m.id);
          const bx=52+c*104, by=82+r*94;
          UI.box(bx,by,96,82,on?P.GD:(pin?'#4ade80':P.DDG),on?'rgba(245,184,46,.16)':'rgba(10,8,6,.92)');
          // Draw 3-stripe enameled ribbon bar
          const rx=bx+14, ry=by+12, rw=68, rh=22;
          X.fillStyle=m.cols[0]; X.fillRect(rx,ry,22,rh);
          X.fillStyle=m.cols[1]; X.fillRect(rx+22,ry,24,rh);
          X.fillStyle=m.cols[2]; X.fillRect(rx+46,ry,22,rh);
          X.strokeStyle=pin?'#f5b82e':'#3a2e18'; X.strokeRect(rx,ry,rw,rh);
          if(pin) UI.text('*',rx+34,ry+5,'#f5b82e',1,'center');
          UI.text(m.code,bx+48,by+42,on?P.GD:P.BONE,1,'center');
          UI.text(pin?'[PINNED]':'[LOCKED]',bx+48,by+60,pin?'#4ade80':P.DG,1,'center');
        }
        // Right: Selected Medal Citation & Large Ribbon Display
        const cur=COMBAT_MEDALS[sel], pin=isPinned(cur.id);
        UI.box(480,82,424,382,pin?'#4ade80':P.GD,'rgba(10,8,6,.94)');
        // Large Dress Ribbon Bar
        const lrx=502, lry=102, lrw=132, lrh=40;
        X.fillStyle=cur.cols[0]; X.fillRect(lrx,lry,44,lrh);
        X.fillStyle=cur.cols[1]; X.fillRect(lrx+44,lry,44,lrh);
        X.fillStyle=cur.cols[2]; X.fillRect(lrx+88,lry,44,lrh);
        X.strokeStyle=P.GD; X.lineWidth=2; X.strokeRect(lrx,lry,lrw,lrh); X.lineWidth=1;
        if(pin) UI.text('* * *',lrx+66,lry+12,P.GD,2,'center');
        UI.text(`${cur.code}: ${cur.name}`,650,104,P.GD,1);
        UI.text(`STATUS: ${pin?'PINNED (+60B CLAIMED)':'UNCLAIMED (+60B)'}`,650,126,pin?'#4ade80':'#22d3ee',1);
        UI.box(502,160,380,84,P.DDG,'rgba(14,11,8,.92)');
        UI.text('QUALIFICATION REQUIREMENT:',516,174,P.GD,1);
        UI.wrap(cur.req,352,1).forEach((ln,li)=>UI.text(ln,516,196+li*18,'#22d3ee',1));
        UI.box(502,256,380,108,P.DDG,'rgba(14,11,8,.92)');
        UI.text('FORMAL SOVEREIGN CITATION:',516,270,P.GD,1);
        UI.wrap(cur.cite,352,1).forEach((ln,li)=>UI.text(ln,516,292+li*18,P.BONE,1));
        UI.text('RIBBON COMMENDATION BONUS: +60 BITS',516,340,'#4ade80',1);
        UI.box(502,378,380,70,pin?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(pin?'MEDAL PINNED ON OPERATOR RACK':'[ENTER] PIN MEDAL & CLAIM +60 BITS',692,394,pin?'#4ade80':P.GD,1,'center');
        UI.text('[P] PIN ALL 16 SOVEREIGN MEDALS (FULL RACK)',692,420,'#4ade80',1,'center');
        UI.text('[arrows] select ribbon   [enter] pin medal (+60B)   [P] pin all 16   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Companion Story Epilogues & Future Logs (M96) ----
  const CREW_EPILOGUES={
    me:{title:'CHAPTER 01: THE MORNING AFTER 06:12', loc:'THE ROOFTOP · 06:13 AM',
      text:'With the Blank Cursor dissolved and ARCHON-0 offline, 1nc0gn30 closed the laptop on the rooftop and watched the first true golden sunrise warm the Relit City skyline. Comms remained face-to-face by choice, not fear.'},
    vigil:{title:'CHAPTER 02: THE OPEN GATEKEEP', loc:'RELIT CITY NORTH RELAY · 06:14 AM',
      text:'Vigil retired the emergency blackout sirens and established the Ocular Handshake Guild, training new operators to verify every process face-to-face before trusting any remote stream.'},
    nexus:{title:'CHAPTER 03: ARCHITECT OF THE 20 DISTRICTS', loc:'SAFehouse COMMAND TABLE · 06:15 AM',
      text:'Nexus expanded the 4D Tesseract routing table across the newly awakened outer districts, linking the Quantum Loom and Chrono-Vault into a permanent zero-latency commons.'},
    kitsune:{title:'CHAPTER 04: NINE LANTERNS IN THE WOODS', loc:'THE REST WOODS SHRINE · 06:16 AM',
      text:'Kitsune hung nine foxfire lanterns along the Rest Woods paths. Travellers resting under the ancient tree wake to warm amber light that no synthetic node can ever counterfeit.'},
    ignis:{title:'CHAPTER 05: THE WHITE-HOT PEACE', loc:'DOOM-FIRE FOUNDRY ANVIL · 06:17 AM',
      text:'Ignis repurposed the furnace wardens from weapons production to forging +5 overclocked bridge girders and resonant bells for every plaza in the city.'},
    kai:{title:'CHAPTER 06: BLADE IN THE SHEATH', loc:'EAST GATE BAMBOO WALK · 06:18 AM',
      text:'Kai opened a zero-latency iaido dojo beside the East Gate. Without static echoes on the line, his students practice cutting falling raindrops before they touch the stone.'},
    athena:{title:'CHAPTER 07: THE COLLAPSED CARTOGRAPHY', loc:'COLLAPSE STREETS OBSERVATORY · 06:19 AM',
      text:'Athena mapped every superposed alley of the Collapse Streets into a living public atlas, ensuring no citizen ever gets lost in an uncomputed probability branch again.'},
    kraken:{title:'CHAPTER 08: SONG OF THE GOLDEN FIBER', loc:'FIBER TUNNELS JUNCTION · 06:20 AM',
      text:'Kraken tuned the subterranean Hilbert fiber trunks into a city-wide harmonic resonator, turning the once-corrupted red conduits into a golden optical symphony.'},
    chronos:{title:'CHAPTER 09: THE UNBROKEN PENDULUM', loc:'SAND CLOCKTOWER BELFRY · 06:21 AM',
      text:'Chronos wound the great brass escapement of the Sand Clocktower so that every hour chimes with a new melody, celebrating the end of the eternal 06:12 loop.'},
    lycan:{title:'CHAPTER 10: PACK OF THE CLEAR CAVES', loc:'PHYSARUM CAVES BIOLAB · 06:22 AM',
      text:'Lycan cultivated luminous gold Physarum networks across the western caves, transforming the acoustic slime traps into self-healing bio-bridges.'},
    onyx:{title:'CHAPTER 11: THE CLEAR REFLECTION', loc:'HALL OF MIRRORS ROSETTE · 06:23 AM',
      text:'Onyx polished the octagonal mirrors until they reflected only truth. The Hall of Mirrors became a quiet sanctuary for reflection and memory preservation.'},
    leviathan:{title:'CHAPTER 12: KEEPER OF DEEP MEMORY', loc:'DEEP-WATER TRENCH · 06:24 AM',
      text:'Leviathan guarded the sunken archives of the Deep Water, ensuring the city\'s unedited morning memories remain whole and untampered for generations.'},
    aether:{title:'CHAPTER 13: TWENTY-TWO BEAMS', loc:'MODE-7 SKYLINE SPIRE · 06:25 AM',
      text:'Aether added a 22nd golden beacon to the Skyline horizon in honor of 03ng0cn1, weaving a permanent aurora canopy above the clouds.'},
    ghostbyte:{title:'CHAPTER 14: PIRATE RADIO 94.2', loc:'THE HOLLOW SUB-SOCKET · 06:26 AM',
      text:'Ghostbyte turned the decommissioned Relay 4 crater into the broadcast booth for Hollow Pirate FM, streaming lo-fi synth beats across the underground.'},
    scorpius:{title:'CHAPTER 15: PRECISION SENTINEL', loc:'CITADEL PERIMETER · 06:27 AM',
      text:'Scorpius leads the Elite Bounty Rangers, neutralizing stray sub-lattice anomalies before they can ever coalesce into a new compiler threat.'},
    draco:{title:'CHAPTER 16: TWO HEADS, ONE OATH', loc:'HOLLOW BRIDGE GATE · 06:28 AM',
      text:'Draco stands watch at the Hollow threshold—no longer asking riddles out of suspicion, but welcoming travellers with twin torches of foxfire.'},
    mercury:{title:'CHAPTER 17: EXPRESS LINE 06:13', loc:'RELIT CITY TRANSIT HUB · 06:29 AM',
      text:'Mercury linked all 17 district portals into an instant express loop, bragging that he can deliver a warm coffee from Relit Plaza to the Chrono-Vault in 0.4 seconds.'},
    aquila:{title:'CHAPTER 18: HIGH-GROUND WATCH', loc:'SKYLINE WIND TERRACE · 06:30 AM',
      text:'Aquila patrols the high thermals above the Mode-7 towers, guiding airships and mapping clear weather corridors across the horizon.'},
    'radical-minion':{title:'CHAPTER 19: EIGHT-THREAD ARCADE', loc:'SAFEHOUSE ARCADE HUB · 06:31 AM',
      text:'All eight Radical-Minion clones pooled their threads to run the 13-cabinet Safehouse Arcade, holding the top high scores on every cabinet simultaneously.'},
    'pixel-shiba':{title:'CHAPTER 20: GOOD BOY OF THE PLAZA', loc:'RELIT CITY FOUNTAIN · 06:32 AM',
      text:'Pixel-Shiba buried his prized Argon Bone beside the Rest Tree and now leads morning patrol walks with every newcomer who enters Relit City.'},
    'pixel-neko':{title:'CHAPTER 21: MASTER OF THE EMPORIUM', loc:'HUB TOOL BENCH · 06:33 AM',
      text:'Pixel-Neko merged the daytime Tool Bench with the night-market relic vault, offering every tool and upgrade at fair open-access prices. Nyan!'},
    copy:{title:'CHAPTER 22: THE TWENTY-SECOND FACE', loc:'ROOFTOP BALUSTRADE · 06:34 AM',
      text:'03ng0cn1 kept the red hood but walked in his own footsteps. No longer a predictive trap or a mirror shadow, Crew Member #22 writes his own commits beside you.'}
  };
  const EPILOGUE_IDS=Object.keys(PARTY_BASE);
  G.openEpilogues=()=>{
    let sel=0;
    const isRead=id=>!!(G.flags&&G.flags['epi_'+id]);
    G.mini={
      name:'epilogues',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+EPILOGUE_IDS.length-1)%EPILOGUE_IDS.length;
        if(took('down')) sel=(sel+1)%EPILOGUE_IDS.length;
        if(took('confirm')){
          const id=EPILOGUE_IDS[sel];
          if(!G.flags['epi_'+id]){ G.flags['epi_'+id]=1; G.bits+=50; }
          G.ach('epilogue_chronicler'); sfx('level');
          G.toast(`> ARCHIVED EPILOGUE: ${PARTY_BASE[id].name.toUpperCase()} (+50 BITS)!`,'#4ade80');
        }
        if(took('party')){
          let added=0;
          EPILOGUE_IDS.forEach(id=>{ if(!G.flags['epi_'+id]){ G.flags['epi_'+id]=1; added+=50; } });
          G.bits+=added; G.ach('epilogue_chronicler'); sfx('win');
          G.toast(`> ALL 22 POST-DAWN EPILOGUES ARCHIVED (+${added} BITS)!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> 06:13 CREW EPILOGUE CHRONICLES',56,40,P.GD,2);
        const readN=EPILOGUE_IDS.filter(id=>isRead(id)).length;
        UI.text(`ARCHIVED: ${readN}/22 CHAPTERS   ·   DAWN ERA: 06:13+`,900,44,'#4ade80',1,'right');
        // Left: Scrollable 22-Agent Epilogue List (9 visible)
        const first=Math.max(0,Math.min(sel-4,EPILOGUE_IDS.length-9));
        EPILOGUE_IDS.slice(first,first+9).forEach((id,idx)=>{
          const i=first+idx, yy=78+idx*42, on=i===sel, rd=isRead(id), ag=AG[id]||AG.me;
          UI.box(52,yy,368,38,on?P.GD:(rd?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+`${String(i+1).padStart(2,'0')}. ${PARTY_BASE[id].name.toUpperCase()}`,64,yy+12,on?P.GD:(ag.color||P.BONE),1);
          UI.text(rd?'[ARCHIVED]':'[UNREAD]',406,yy+12,rd?'#4ade80':P.DG,1,'right');
        });
        // Right: Selected Agent 06:13 Epilogue Reader
        const curId=EPILOGUE_IDS[sel], ag=AG[curId]||AG.me, ep=CREW_EPILOGUES[curId]||CREW_EPILOGUES.me, rd=isRead(curId);
        UI.box(436,78,468,386,ag.color||P.GD,'rgba(10,8,6,.94)');
        UI.box(454,96,92,92,P.DDG,'rgba(14,11,8,.96)');
        const st=(curId==='me'||curId==='copy')?'idle':'meditate';
        const c=frameCanvas(curId,st,Math.floor(t*4)%2);
        X.drawImage(c,0,0,c.width,c.height,468,110,64,64);
        UI.text(PARTY_BASE[curId].name.toUpperCase(),562,100,P.GD,2);
        UI.text(ep.title,562,130,'#22d3ee',1);
        UI.text(`DATELINE: ${ep.loc}`,562,152,'#a78bfa',1);
        UI.text(`STATUS: ${rd?'ARCHIVED IN CODEX (+50B)':'READY TO ARCHIVE (+50B)'}`,562,172,rd?'#4ade80':P.BONE,1);
        UI.box(454,202,432,162,P.DDG,'rgba(14,11,8,.92)');
        UI.text('POST-DAWN CHRONICLE ENTRY:',470,218,P.GD,1);
        UI.wrap(ep.text,400,1).forEach((ln,li)=>UI.text(ln,470,242+li*20,P.BONE,1));
        UI.box(454,376,432,72,rd?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(rd?'CHAPTER ARCHIVED IN SOVEREIGN RECORD':'[ENTER] ARCHIVE EPILOGUE CHAPTER (+50 BITS)',670,394,rd?'#4ade80':P.GD,1,'center');
        UI.text('[P] UNLOCK & ARCHIVE ALL 22 CREW EPILOGUES',670,420,'#4ade80',1,'center');
        UI.text('[up/down] select crew member   [enter] archive chapter   [P] archive all 22   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Secret Mini-Game #14: "Pantheon Triad" Tactical 3x3 Card Battler (M98) ----
  const TRIAD_PLAYER_DECK=[
    {id:'me',      name:'1NC0GN30', sprite:'me',      ranks:[9,7,8,8], proto:'KERNEL'},
    {id:'vigil',   name:'VIGIL',    sprite:'vigil',   ranks:[7,9,6,8], proto:'STATIC'},
    {id:'kitsune', name:'KITSUNE',  sprite:'kitsune', ranks:[8,8,7,7], proto:'THERMAL'},
    {id:'ignis',   name:'IGNIS',    sprite:'ignis',   ranks:[9,6,9,5], proto:'THERMAL'},
    {id:'aether',  name:'AETHER',   sprite:'aether',  ranks:[8,7,9,8], proto:'QUANTUM'}
  ];
  const TRIAD_FOE_DECK=[
    {id:'copy',      name:'03NG0CN1',  sprite:'copy',   ranks:[8,6,7,7], proto:'VOID'},
    {id:'relay4',    name:'RELAY 4',   sprite:'vigil',  ranks:[6,8,7,5], proto:'STATIC'},
    {id:'sandglass', name:'SANDGLASS', sprite:'chronos',ranks:[7,5,8,6], proto:'QUANTUM'},
    {id:'hunter',    name:'HUNTER',    sprite:'onyx',   ranks:[8,7,5,6], proto:'CRYPTO'},
    {id:'archon',    name:'ARCHON-0',  sprite:'aether', ranks:[7,8,6,7], proto:'VOID'}
  ];
  G.startTriad=()=>{
    const board=new Array(9).fill(null);
    const pHand=TRIAD_PLAYER_DECK.map(c=>({...c, used:false}));
    const fHand=TRIAD_FOE_DECK.map(c=>({...c, used:false}));
    let hSel=0, bSel=4, won=false, lost=false, drawGame=false;
    const placeAndFlip=(cellIdx,card,owner)=>{
      board[cellIdx]={...card, owner};
      const r=Math.floor(cellIdx/3), c=cellIdx%3;
      // N (0 vs neighbor S=2), E (1 vs neighbor W=3), S (2 vs neighbor N=0), W (3 vs neighbor E=1)
      const dirs=[[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]];
      let flips=0;
      dirs.forEach(([dr,dc,mySide,nbSide])=>{
        const nr=r+dr, nc=c+dc;
        if(nr>=0&&nr<3&&nc>=0&&nc<3){
          const nb=board[nr*3+nc];
          if(nb && nb.owner!==owner && card.ranks[mySide]>nb.ranks[nbSide]){
            nb.owner=owner; flips++;
          }
        }
      });
      return flips;
    };
    const scoreOf=own=>{
      const onBoard=board.filter(b=>b&&b.owner===own).length;
      const inHand=(own==='P'?pHand:fHand).filter(h=>!h.used).length;
      return onBoard+inHand;
    };
    const awardVictory=()=>{
      if(won) return;
      won=true; lost=false; drawGame=false;
      G.ach('triad_champion'); sfx('win');
      if(!G.flags.triad_reward){
        G.flags.triad_reward=1; G.bits+=300; G.give('root.shell',1);
        G.toast('> PANTHEON TRIAD CHAMPION! +300 Bits & +1x Root.Shell!',P.GD);
      } else {
        G.bits+=90;
        G.toast('> Triad Match Won! +90 Bits!',P.GD);
      }
    };
    const checkEnd=()=>{
      if(board.every(b=>b!==null)){
        const ps=scoreOf('P'), fs=scoreOf('F');
        if(ps>fs) awardVictory();
        else if(fs>ps){ lost=true; sfx('hurt'); }
        else { drawGame=true; sfx('blip'); }
      }
    };
    G.mini={
      name:'triad',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(won||lost||drawGame){
          if(took('confirm')){ G.startTriad(); return; }
          return;
        }
        if(took('up')) hSel=(hSel+pHand.length-1)%pHand.length;
        if(took('down')) hSel=(hSel+1)%pHand.length;
        if(took('left')) bSel=(bSel+8)%9;
        if(took('right')) bSel=(bSel+1)%9;
        if(took('party')){
          // Sovereign Grandmaster Play: fill remaining cells with winning player control
          pHand.forEach(c=>c.used=true);
          fHand.forEach(c=>c.used=true);
          for(let i=0;i<9;i++){
            const isP=i<7;
            const base=isP?TRIAD_PLAYER_DECK[i%5]:TRIAD_FOE_DECK[i%5];
            board[i]={...base, owner:isP?'P':'F'};
          }
          awardVictory();
          return;
        }
        if(took('confirm')){
          const card=pHand[hSel];
          if(card.used){ G.toast('> Card already deployed! Select an unused card [Up/Down].',P.RED); sfx('cancel'); return; }
          if(board[bSel]){ G.toast('> Board sector occupied! Move cursor [Left/Right].',P.RED); sfx('cancel'); return; }
          card.used=true;
          const fl=placeAndFlip(bSel,card,'P');
          sfx(fl>0?'level':'confirm');
          if(fl>0) G.toast(`> TRIAD CAPTURE! Flipped ${fl} adjacent card(s)!`,'#4ade80');
          // AI Counter-Turn if empty cells remain
          const emptyIdx=board.map((b,i)=>b===null?i:-1).filter(i=>i>=0);
          const aiCard=fHand.find(c=>!c.used);
          if(emptyIdx.length>0 && aiCard){
            aiCard.used=true;
            const aiCell=emptyIdx[0];
            placeAndFlip(aiCell,aiCard,'F');
          }
          // Auto-advance hand & board cursor to next available
          const nextH=pHand.findIndex(c=>!c.used); if(nextH>=0) hSel=nextH;
          const nextB=board.findIndex(b=>b===null); if(nextB>=0) bSel=nextB;
          checkEnd();
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> PANTHEON TRIAD 3x3 CARD ARENA',56,40,P.GD,2);
        const ps=scoreOf('P'), fs=scoreOf('F');
        UI.text(`SCORE: CREW ${ps}  —  ${fs} ARCHON AI   ·   BOUNTY: +300B`,900,44,ps>=fs?'#4ade80':'#f43f5e',1,'right');
        // Left: Player 5-Card Hand
        UI.text('SOVEREIGN HAND [UP/DOWN]:',56,78,P.GD,1);
        pHand.forEach((c,i)=>{
          const yy=98+i*70, on=i===hSel;
          UI.box(52,yy,234,62,on?P.GD:(c.used?P.DDG:'#4ade80'),on?'rgba(245,184,46,.16)':'rgba(10,8,6,.92)');
          UI.text((on?'> ':'  ')+c.name,64,yy+10,c.used?P.DG:(on?P.GD:P.BONE),1);
          UI.text(`N:${c.ranks[0]} E:${c.ranks[1]} S:${c.ranks[2]} W:${c.ranks[3]}`,64,yy+32,c.used?P.DG:'#22d3ee',1);
          UI.text(c.used?'[PLAYED]':'[READY]',274,yy+10,c.used?P.DG:'#4ade80',1,'right');
        });
        // Center: 3x3 Tactical Triad Board
        const bx0=316, by0=86, cw=104, ch=114;
        for(let r=0;r<3;r++) for(let c=0;c<3;c++){
          const idx=r*3+c, cell=board[idx], cur=(idx===bSel)&&!won&&!lost;
          const x=bx0+c*(cw+10), y=by0+r*(ch+10);
          const col=cur?P.GD:(cell?(cell.owner==='P'?'#4ade80':'#f43f5e'):P.DDG);
          const bg=cell?(cell.owner==='P'?'rgba(22,60,36,.88)':'rgba(70,18,28,.88)'):(cur?'rgba(245,184,46,.14)':'rgba(12,10,8,.92)');
          UI.box(x,y,cw,ch,col,bg);
          if(cell){
            const sp=frameCanvas(cell.sprite||'me','idle',Math.floor(t*4)%2);
            X.drawImage(sp,0,0,sp.width,sp.height,x+32,y+30,40,40);
            // Directional ranks N / E / S / W
            UI.text(String(cell.ranks[0]),x+cw/2,y+6,P.GD,1,'center');
            UI.text(String(cell.ranks[1]),x+cw-12,y+48,P.GD,1,'center');
            UI.text(String(cell.ranks[2]),x+cw/2,y+74,P.GD,1,'center');
            UI.text(String(cell.ranks[3]),x+12,y+48,P.GD,1,'center');
            UI.text(cell.name.slice(0,8),x+cw/2,y+94,cell.owner==='P'?'#4ade80':'#f43f5e',1,'center');
          } else {
            UI.text(`SLOT 0${idx+1}`,x+cw/2,y+48,cur?P.GD:P.DG,1,'center');
          }
        }
        // Right: AI Opponent Deck & Rules Dossier
        UI.box(676,86,228,362,P.GD,'rgba(10,8,6,.94)');
        UI.text('ARCHON AI DECK:',692,102,'#f43f5e',1);
        fHand.forEach((c,i)=>{
          const yy=124+i*36;
          UI.text(`${i+1}. ${c.name}`,692,yy,c.used?P.DG:P.BONE,1);
          UI.text(c.used?'[ON BOARD]':`[${c.ranks.join('/')}]`,888,yy,c.used?P.DG:'#f43f5e',1,'right');
        });
        UI.box(690,312,200,122,P.DDG,'rgba(14,11,8,.92)');
        UI.text('TRIAD RULES:',702,324,P.GD,1);
        UI.text('Higher N/E/S/W rank flips',702,344,P.BONE,1);
        UI.text('adjacent opponent cards.',702,362,P.BONE,1);
        UI.text('[P] GRANDMASTER SWEEP',702,388,'#4ade80',1);
        UI.text('+300B & +1x Root.Shell',702,408,P.GD,1);
        if(won||lost||drawGame){
          UI.box(296,214,368,94,won?'#4ade80':P.RED,'rgba(6,5,4,.96)');
          UI.text(won?'TRIAD GRANDMASTER VICTORY!':(lost?'ARCHON AI PREVAILS!':'STALEMATE DRAW!'),480,236,won?'#4ade80':P.RED,2,'center');
          UI.text('[ENTER] REMATCH   [ESC] EXIT',480,274,P.GD,1,'center');
        }
        UI.text('[up/down] hand card   [left/right] board slot   [enter] play card   [P] grandmaster win   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Collectible 32-Card Pantheon Foil Binder (M99) ----
  const BINDER_CARDS=(()=>{
    const list=[];
    Object.keys(PARTY_BASE).forEach((id,i)=>{
      const ag=AG[id]||AG.me, pr=PARTY_PROTO[id]||'KERNEL';
      const r0=6+(i*3)%4, r1=5+(i*5)%5, r2=6+(i*7)%4, r3=5+(i*2)%5;
      list.push({
        code:`C-${String(i+1).padStart(2,'0')}`, id, name:PARTY_BASE[id].name.toUpperCase(),
        cat:'PANTHEON CREW', rarity:i===0||i===21?'SOVEREIGN FOIL':'MYTHIC HOLO',
        sprite:id, proto:pr, col:ag.color||P.GD, ranks:[r0,r1,r2,r3],
        lore:`${ag.role||'Sovereign Specialist'} · Signature: ${ag.ability||'Protocol Resonance'}`
      });
    });
    const bosses=[
      ['b_copy','03NG0CN1 MIRROR','copy','VOID','#f43f5e',[9,7,8,8],'East Gate red reflection that answers before spoken to.'],
      ['b_relay4','RELAY 4 CHORUS','vigil','STATIC','#22d3ee',[8,9,8,6],'Subterranean acoustic core broadcasting borrowed voices.'],
      ['b_sand','SANDGLASS 06:12','chronos','QUANTUM','#f5b82e',[8,7,9,7],'Chrono-cage guardian freezing the Sand Clocktower at 06:12.'],
      ['b_hunter','THE HUNTER','onyx','CRYPTO','#a78bfa',[9,8,7,8],'Six-winged orbital panopticon seraph of the Hall of Mirrors.'],
      ['b_blank','BLANK CURSOR','aether','VOID','#4ade80',[9,9,8,9],'Four-dimensional tesseract at the Source Tower that listens at zero.'],
      ['b_archon','ARCHON-0 ROOT','me','VOID','#f5b82e',[10,9,9,9],'The First Compiler at the apex of the Zero-Knowledge Citadel.']
    ];
    bosses.forEach(([id,name,sp,pr,col,ranks,lore], idx)=>{
      list.push({code:`C-${23+idx}`, id, name, cat:'APEX BOSS', rarity:'APEX HOLO', sprite:sp, proto:pr, col, ranks, lore});
    });
    const mons=[
      ['m_sing','NULL SINGULARITY','aether','VOID','#22d3ee',[9,9,9,8],'Eight-ribbon torus knot anchoring District #15 at 06:13.'],
      ['m_loom','QUANTUM LOOM','nexus','QUANTUM','#a78bfa',[9,8,9,9],'Twelve-strand Mobius spindle weaving District #16 at 06:14.'],
      ['m_orrery','CHRONO ORRERY','chronos','QUANTUM','#4ade80',[9,9,8,9],'Five-ring celestial armillary sphere of District #17 at 06:15.'],
      ['m_astro','ASTRAL ASTROLABE','aquila','STATIC','#22d3ee',[10,9,9,10],'Eight-pointed stellar astrolabe of District #18 at 06:16.']
    ];
    mons.forEach(([id,name,sp,pr,col,ranks,lore], idx)=>{
      list.push({code:`C-${29+idx}`, id, name, cat:'WORLD MONUMENT', rarity:'MONUMENT GOLD', sprite:sp, proto:pr, col, ranks, lore});
    });
    return list;
  })();
  G.openCardBinder=()=>{
    let sel=0;
    const hasCard=c=>!!(G.flags&&G.flags['card_'+c.code]);
    G.mini={
      name:'binder',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')) sel=(sel+BINDER_CARDS.length-4)%BINDER_CARDS.length;
        if(took('down')) sel=(sel+4)%BINDER_CARDS.length;
        if(took('left')) sel=(sel+BINDER_CARDS.length-1)%BINDER_CARDS.length;
        if(took('right')) sel=(sel+1)%BINDER_CARDS.length;
        if(took('confirm')){
          const c=BINDER_CARDS[sel];
          if(!G.flags['card_'+c.code]){
            G.flags['card_'+c.code]=1; G.bits+=15;
            G.toast(`> FOIL CARD MINTED: ${c.code} ${c.name} (+15 BITS)!`,'#4ade80');
          } else {
            G.toast(`> ${c.code} ${c.name} ALREADY IN FOIL BINDER!`,P.GD);
          }
          G.ach('card_collector'); sfx('level');
        }
        if(took('party')){
          let added=0;
          BINDER_CARDS.forEach(c=>{ if(!G.flags['card_'+c.code]){ G.flags['card_'+c.code]=1; added+=15; } });
          G.bits+=added; G.ach('card_collector'); sfx('win');
          G.toast(`> ALL 32 PANTHEON FOIL CARDS MINTED (+${added} BITS)!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> PANTHEON 32-CARD FOIL BINDER',56,40,P.GD,2);
        const owned=BINDER_CARDS.filter(c=>hasCard(c)).length;
        const page=Math.floor(sel/16)+1;
        UI.text(`COLLECTION: ${owned}/32 FOILS   ·   PAGE ${page}/2`,900,44,'#4ade80',1,'right');
        // Left: 4x4 Foil Card Grid (16 cards per page, 2 pages = 32 cards)
        const baseIdx=(page-1)*16;
        for(let r=0;r<4;r++) for(let c=0;c<4;c++){
          const idx=baseIdx+r*4+c, card=BINDER_CARDS[idx], on=idx===sel, got=hasCard(card);
          const bx=52+c*104, by=80+r*94;
          UI.box(bx,by,96,84,on?P.GD:(got?card.col:P.DDG),on?'rgba(245,184,46,.16)':'rgba(10,8,6,.92)');
          UI.text(card.code,bx+8,by+8,on?P.GD:card.col,1);
          UI.text(got?'*':'-',bx+86,by+8,got?'#4ade80':P.DG,1,'right');
          const sp=frameCanvas(card.sprite||'me','idle',Math.floor(t*4)%2);
          X.drawImage(sp,0,0,sp.width,sp.height,bx+32,by+22,32,32);
          UI.text(card.name.slice(0,9),bx+48,by+62,got?P.BONE:P.DG,1,'center');
        }
        // Right: Selected Foil Card Holo Showcase & Triad Ranks
        const cur=BINDER_CARDS[sel], got=hasCard(cur);
        UI.box(480,80,424,384,cur.col,'rgba(10,8,6,.94)');
        // Foil Card Frame
        UI.box(500,98,144,182,got?'#4ade80':P.GD,'rgba(16,13,9,.96)');
        UI.text(String(cur.ranks[0]),572,106,P.GD,2,'center');
        UI.text(String(cur.ranks[1]),626,178,P.GD,2,'center');
        UI.text(String(cur.ranks[2]),572,246,P.GD,2,'center');
        UI.text(String(cur.ranks[3]),518,178,P.GD,2,'center');
        const sp2=frameCanvas(cur.sprite||'me','idle',Math.floor(t*5)%2);
        X.drawImage(sp2,0,0,sp2.width,sp2.height,540,148,64,64);
        UI.text(`${cur.code}: ${cur.name}`,660,102,P.GD,2);
        UI.text(`SERIES: ${cur.cat}`,660,132,'#22d3ee',1);
        UI.text(`RARITY: ${cur.rarity}`,660,154,'#a78bfa',1);
        UI.text(`PROTOCOL: ${cur.proto}`,660,176,cur.col,1);
        UI.text(`TRIAD RANKS: N:${cur.ranks[0]} E:${cur.ranks[1]} S:${cur.ranks[2]} W:${cur.ranks[3]}`,660,198,'#4ade80',1);
        UI.text(`POWER SUM: ${cur.ranks.reduce((a,b)=>a+b,0)} PTS`,660,220,P.BONE,1);
        UI.text(`STATUS: ${got?'FOIL MINTED (+15B)':'UNMINTED (+15B)'}`,660,244,got?'#4ade80':P.GD,1);
        UI.box(500,294,384,72,P.DDG,'rgba(14,11,8,.92)');
        UI.text('CARD INSCRIPTION & LORE:',514,308,P.GD,1);
        UI.wrap(cur.lore,356,1).forEach((ln,li)=>UI.text(ln,514,328+li*18,P.BONE,1));
        UI.box(500,378,384,70,got?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(got?'CARD MINTED IN SOVEREIGN FOIL BINDER':'[ENTER] MINT FOIL CARD & CLAIM +15 BITS',692,394,got?'#4ade80':P.GD,1,'center');
        UI.text('[P] MINT FULL 32-CARD FOIL BINDER (+480 BITS)',692,420,'#4ade80',1,'center');
        UI.text('[arrows] browse 32 cards (2 pages)   [enter] mint foil (+15B)   [P] mint all 32   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Milestone #100 Special: "The Sovereign Pantheon Citadel" 3D Hall of Fame (M100) ----
  const HOF_MONUMENTS=[
    {id:'astral_astrolabe', title:'M100: ASTRAL ASTROLABE', sub:'18 DISTRICTS · 20 BLENDER MESHES', col:'#22d3ee'},
    {id:'chrono_orrery',    title:'M100: CHRONO ORRERY',    sub:'22 PANTHEON CREW · 06:16 DAWN', col:'#4ade80'},
    {id:'quantum_loom',     title:'M100: QUANTUM SPINDLE',  sub:'14 ARCADE CABINETS · 32 CARDS', col:'#a78bfa'},
    {id:'null_singularity', title:'M100: NULL SINGULARITY', sub:'100 SOVEREIGN MILESTONES',      col:'#f5b82e'}
  ];
  G.openHallOfFame=()=>{
    let mSel=0, yaw=0.5;
    G.ach('century_sovereign');
    G.mini={
      name:'halloffame',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        yaw+=dt*0.85;
        if(took('up')||took('left')){ mSel=(mSel+HOF_MONUMENTS.length-1)%HOF_MONUMENTS.length; sfx('move'); }
        if(took('down')||took('right')){ mSel=(mSel+1)%HOF_MONUMENTS.length; sfx('move'); }
        if(took('confirm')||took('party')){
          if(!G.flags.m100_claimed){
            G.flags.m100_claimed=1;
            G.bits+=500;
            G.give('singularity.halo',1);
            G.ach('century_sovereign'); sfx('win');
            G.toast('> MILESTONE #100 COMMEMORATION! +500 Bits & +1x Singularity.Halo!','#4ade80');
          } else {
            sfx('level');
            G.toast('> Milestone #100 Century Commemoration already claimed!',P.GD);
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> MILESTONE #100: 3D HALL OF FAME',56,40,P.GD,2);
        const achCount=Object.keys(ACH).filter(k=>G.achGot&&G.achGot[k]).length;
        UI.text(`CENTURY EDITION (M01-M100)   ·   ACH: ${achCount}/${Object.keys(ACH).length}`,900,44,'#4ade80',1,'right');
        // Left: Live 3D Wireframe Monument Turntable
        const curM=HOF_MONUMENTS[mSel], pts=BLENDER_GEO[curM.id]||BLENDER_GEO.astral_astrolabe||[];
        UI.box(52,78,412,386,curM.col,'rgba(8,7,5,.96)');
        let minX=1e9,maxX=-1e9,minY=1e9,maxY=-1e9,minZ=1e9,maxZ=-1e9;
        for(let i=0;i<pts.length;i+=3){
          const x=pts[i],y=pts[i+1],z=pts[i+2];
          if(x<minX) minX=x; if(x>maxX) maxX=x;
          if(y<minY) minY=y; if(y>maxY) maxY=y;
          if(z<minZ) minZ=z; if(z>maxZ) maxZ=z;
        }
        const midX=(minX+maxX)/2, midY=(minY+maxY)/2, midZ=(minZ+maxZ)/2;
        const span=Math.max(0.5,maxX-minX,maxY-minY,maxZ-minZ);
        const sc=175/span, cx=258, cy=254;
        const cyw=Math.cos(yaw), syw=Math.sin(yaw), cpt=Math.cos(0.3), spt=Math.sin(0.3);
        const proj=(x,y,z)=>{
          const dx=x-midX, dy=y-midY, dz=z-midZ;
          const rx=dx*cyw-dz*syw, rz=dx*syw+dz*cyw;
          const ry=dy*cpt-rz*spt, rz2=dy*spt+rz*cpt;
          const persp=400/(400+rz2*0.35);
          return [cx+rx*sc*persp, cy-ry*sc*persp];
        };
        X.save(); X.beginPath(); X.rect(54,80,408,382); X.clip();
        X.strokeStyle=curM.col; X.lineWidth=1.5; X.beginPath();
        for(let i=0;i<pts.length;i+=6){
          const a=proj(pts[i],pts[i+1],pts[i+2]), b=proj(pts[i+3],pts[i+4],pts[i+5]);
          X.moveTo(a[0],a[1]); X.lineTo(b[0],b[1]);
        }
        X.stroke(); X.restore();
        UI.text(curM.title,258,94,P.GD,2,'center');
        UI.text(curM.sub,258,122,'#22d3ee',1,'center');
        UI.text('[ARROWS] CYCLE 3D CENTURY MONUMENT',258,438,P.DG,1,'center');
        // Right: 22-Agent Pantheon Parade & Century Plaque
        UI.box(480,78,424,386,P.GD,'rgba(10,8,6,.94)');
        UI.text('SOVEREIGN PANTHEON 22-AGENT HONOR ROLL:',498,94,P.GD,1);
        const allIds=Object.keys(PARTY_BASE);
        for(let r=0;r<2;r++) for(let c=0;c<11;c++){
          const idx=r*11+c, id=allIds[idx]; if(!id) continue;
          const sp=frameCanvas(id,'idle',Math.floor(t*4+idx)%2);
          const bx=496+c*35, by=116+r*48;
          X.drawImage(sp,0,0,sp.width,sp.height,bx,by,30,30);
        }
        UI.box(498,218,388,146,P.DDG,'rgba(14,11,8,.92)');
        UI.text('100-MILESTONE ENGINEERING LEDGER:',514,232,P.GD,1);
        UI.text('· 18 EXPLORABLE 3D DISTRICTS & 20 BLENDER MESHES',514,254,'#22d3ee',1);
        UI.text('· 22 RECRUITABLE CREW MEMBERS + LOYALTY EPILOGUES',514,274,'#4ade80',1);
        UI.text('· 14 IN-ENGINE MINI-GAMES & 32 FOIL TRIAD CARDS',514,294,'#a78bfa',1);
        UI.text('· 60+ SOVEREIGN SUBSYSTEMS · 100% OPEN ACCESS',514,314,P.GD,1);
        UI.text('· ENGINEERED BY 1NC0GN30 · NULLAI PLATFORM',514,336,P.BONE,1);
        const clm=!!G.flags.m100_claimed;
        UI.box(498,376,388,72,clm?'#4ade80':P.GD,'rgba(245,184,46,.15)');
        UI.text(clm?'M100 CENTURY GRANT CLAIMED (+500B & HALO)':'[ENTER / P] CLAIM M100 GRANT (+500B & HALO)',692,394,clm?'#4ade80':P.GD,1,'center');
        UI.text('+500 BITS  &  +1x SINGULARITY.HALO MYTHIC RELIC',692,420,'#22d3ee',1,'center');
        UI.text('[arrows] cycle 3D monument   [enter / P] claim M100 grant (+500B & Halo)   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Weapon & Relic Custom Naming & Engraving Anvil (M101) ----
  const ENGRAVE_ITEMS=Object.keys(ITEMS).filter(k=>ITEMS[k].slot);
  const SOVEREIGN_RUNES=[
    {id:'ROOT',     label:'[KERNEL: ROOT]',     col:'#f5b82e', desc:'+25% Relic Stat Output · Unlocks Root-Level Overdrive Resonance.'},
    {id:'SOLAR',    label:'[THERMAL: SOLAR]',   col:'#fb923c', desc:'+25% Relic Stat Output · Infuses Foundry white-hot thermal edge.'},
    {id:'ARC',      label:'[STATIC: ARC]',      col:'#22d3ee', desc:'+25% Relic Stat Output · Discharges high-frequency arc bolts.'},
    {id:'CIPHER',   label:'[CRYPTO: CIPHER]',   col:'#a78bfa', desc:'+25% Relic Stat Output · Encrypts armor & pierces mirror wards.'},
    {id:'PHASE',    label:'[QUANTUM: PHASE]',   col:'#4ade80', desc:'+25% Relic Stat Output · Stabilizes Chrono-Vault time dilation.'},
    {id:'SINGULAR', label:'[VOID: SINGULAR]',   col:'#f43f5e', desc:'+25% Relic Stat Output · Channels 06:16 Astral Relay gravity.'}
  ];
  G.openEngrave=()=>{
    let sel=0, rSel=0, customTag='SOVEREIGN';
    const syncSelection=()=>{
      const k=ENGRAVE_ITEMS[sel];
      customTag=(G.flags&&G.flags['tag_'+k])||ITEMS[k].name.toUpperCase();
      const savedR=G.flags&&G.flags['rune_'+k];
      if(savedR){ const idx=SOVEREIGN_RUNES.findIndex(r=>r.id===savedR); if(idx>=0) rSel=idx; }
    };
    syncSelection();
    G.mini={
      name:'engrave',
      key(e){
        if(e.key==='Backspace'){ customTag=customTag.slice(0,-1); sfx('move'); }
        else if(e.key.length===1&&/[a-zA-Z0-9 _+-]/.test(e.key)&&customTag.length<18){
          customTag+=e.key.toUpperCase(); sfx('talk');
        }
      },
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ sel=(sel+ENGRAVE_ITEMS.length-1)%ENGRAVE_ITEMS.length; syncSelection(); sfx('move'); }
        if(took('down')){ sel=(sel+1)%ENGRAVE_ITEMS.length; syncSelection(); sfx('move'); }
        if(took('left')){ rSel=(rSel+SOVEREIGN_RUNES.length-1)%SOVEREIGN_RUNES.length; sfx('move'); }
        if(took('right')){ rSel=(rSel+1)%SOVEREIGN_RUNES.length; sfx('move'); }
        if(took('confirm')){
          const k=ENGRAVE_ITEMS[sel], rn=SOVEREIGN_RUNES[rSel];
          G.flags['rune_'+k]=rn.id;
          G.flags['tag_'+k]=customTag||ITEMS[k].name.toUpperCase();
          if(!G.has(k)) G.give(k,1);
          G.ach('relic_engraver'); sfx('level');
          G.toast(`> ENGRAVED [${G.flags['tag_'+k]}] WITH ${rn.label} (+25% STATS)!`,'#4ade80');
        }
        if(took('party')){
          ENGRAVE_ITEMS.forEach((k,i)=>{
            const rn=SOVEREIGN_RUNES[i%SOVEREIGN_RUNES.length];
            G.flags['rune_'+k]=rn.id;
            if(!G.flags['tag_'+k]) G.flags['tag_'+k]='SOV.'+ITEMS[k].name.toUpperCase().slice(0,12);
            if(!G.has(k)) G.inv[k]=(G.inv[k]||0)+1;
          });
          if(!G.flags.engrave_grant){ G.flags.engrave_grant=1; G.bits+=150; }
          syncSelection();
          G.ach('relic_engraver'); sfx('win');
          G.toast('> ALL 18 RELICS ENGRAVED WITH SOVEREIGN RUNES (+25% STATS & +150B)!','#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> RELIC NAMING & ENGRAVING ANVIL',56,40,P.GD,2);
        const engCount=ENGRAVE_ITEMS.filter(k=>G.flags&&G.flags['rune_'+k]).length;
        UI.text(`ENGRAVED RELICS: ${engCount}/${ENGRAVE_ITEMS.length}   ·   RUNE BONUS: +25%`,900,44,'#4ade80',1,'right');
        // Left: Scrollable 18 Equippable Relics (9 visible)
        const first=Math.max(0,Math.min(sel-4,ENGRAVE_ITEMS.length-9));
        ENGRAVE_ITEMS.slice(first,first+9).forEach((k,idx)=>{
          const i=first+idx, yy=78+idx*42, on=i===sel, it=ITEMS[k], rn=G.flags&&G.flags['rune_'+k];
          UI.box(52,yy,390,38,on?P.GD:(rn?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          const disp=(G.flags&&G.flags['tag_'+k])||it.name.toUpperCase();
          UI.text((on?'> ':'  ')+disp.slice(0,20),64,yy+12,on?P.GD:P.BONE,1);
          UI.text(rn?`[${rn}]`:`[${it.slot.toUpperCase()}]`,428,yy+12,rn?'#4ade80':P.DG,1,'right');
        });
        // Right: Selected Relic Engraving Anvil & Stat Preview
        const curK=ENGRAVE_ITEMS[sel], it=ITEMS[curK], rn=SOVEREIGN_RUNES[rSel], hasR=!!(G.flags&&G.flags['rune_'+curK]);
        const upLv=(G.flags&&G.flags['up_'+curK])||0;
        const mul=1+upLv*0.2+(hasR?0.25:0), nextMul=1+upLv*0.2+0.25;
        UI.box(460,78,444,386,rn.col,'rgba(10,8,6,.94)');
        UI.text(`BASE RELIC: ${it.name.toUpperCase()} (${it.slot.toUpperCase()})`,480,96,P.GD,1);
        UI.text('CUSTOM INSCRIPTION (TYPE A-Z/0-9):',480,118,P.DG,1);
        UI.box(480,136,404,34,'#22d3ee','rgba(14,18,22,.96)');
        UI.text(`> ${customTag}_`,494,146,P.GD,2);
        // Sovereign Rune Selector
        UI.box(480,182,404,96,P.DDG,'rgba(14,11,8,.92)');
        UI.text('SELECT ELEMENTAL RUNE [LEFT / RIGHT]:',494,194,P.GD,1);
        UI.text(rn.label,494,214,rn.col,2);
        UI.wrap(rn.desc,374,1).forEach((ln,li)=>UI.text(ln,494,242+li*16,P.BONE,1));
        // Stat Output Comparison
        UI.box(480,288,404,78,P.DDG,'rgba(14,11,8,.92)');
        UI.text(`RELIC STAT OUTPUT (OVERCLOCK +${upLv} · RUNE ${hasR?'ACTIVE':'PREVIEW'}):`,494,302,P.GD,1);
        const modStr=Object.entries(it.mod||{}).map(([st,v])=>`${st.toUpperCase()} +${Math.round(v*nextMul)} (Base +${v})`).join('   ');
        UI.text(modStr||'SPECIAL PASSIVE RELIC',494,324,'#4ade80',1);
        UI.text(`TOTAL MULTIPLIER: ${(mul*100).toFixed(0)}% -> ${(nextMul*100).toFixed(0)}% WITH RUNE`,494,344,'#22d3ee',1);
        UI.box(480,378,404,70,hasR?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text('[ENTER] ENGRAVE CUSTOM NAME & RUNE (+25% STATS)',682,394,P.GD,1,'center');
        UI.text(`[P] AUTO-ENGRAVE ALL ${ENGRAVE_ITEMS.length} RELICS (+150 BITS)`,682,420,'#4ade80',1,'center');
        UI.text('[up/down] relic   [left/right] rune   [type] rename   [enter] engrave   [P] engrave all   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Interactive Color Palette & Custom RGB Theme Forger (M102) ----
  const DESIGNER_PALETTES=[
    {name:'01. 06:12 SOLAR GOLD',   rgb:[245,184,46],  GD:'#f5b82e', DG:'#8a6514', DDG:'#3c2c0a'},
    {name:'02. CYBERPUNK MAGENTA',  rgb:[244,63,168],  GD:'#f43fa8', DG:'#9d1765', DDG:'#4a082e'},
    {name:'03. ICECREST GLACIER',   rgb:[56,189,248],  GD:'#38bdf8', DG:'#0284c7', DDG:'#082f49'},
    {name:'04. PLASMA NEON LIME',   rgb:[163,230,53],  GD:'#a3e635', DG:'#4d7c0f', DDG:'#1a2e05'},
    {name:'05. ROYAL AMETHYST',     rgb:[192,132,252], GD:'#c084fc', DG:'#7e22ce', DDG:'#3b0764'},
    {name:'06. AMBER CRT VINTAGE',  rgb:[251,146,60],  GD:'#fb923c', DG:'#9a3412', DDG:'#431407'}
  ];
  const toHex=(r,g,b)=>'#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('');
  G.openThemeForger=()=>{
    let pSel=0, chSel=0, rgb=[245,184,46];
    const applyCustomRGB=(r,g,b,label='CUSTOM RGB PHOSPHOR')=>{
      const gd=toHex(r,g,b), dg=toHex(r*0.56,g*0.56,b*0.56), ddg=toHex(r*0.24,g*0.24,b*0.24);
      P.GD=gd; P.DG=dg; P.DDG=ddg;
      G.flags.custom_theme={name:label, GD:gd, DG:dg, DDG:ddg, rgb:[r,g,b]};
      return {gd,dg,ddg};
    };
    if(G.flags&&G.flags.custom_theme&&G.flags.custom_theme.rgb){
      rgb=[...G.flags.custom_theme.rgb];
    }
    G.mini={
      name:'themeforge',
      update(){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(took('up')){ pSel=(pSel+DESIGNER_PALETTES.length-1)%DESIGNER_PALETTES.length; rgb=[...DESIGNER_PALETTES[pSel].rgb]; sfx('move'); }
        if(took('down')){ pSel=(pSel+1)%DESIGNER_PALETTES.length; rgb=[...DESIGNER_PALETTES[pSel].rgb]; sfx('move'); }
        if(took('n1')||took('quests')){ chSel=(chSel+1)%3; sfx('move'); }
        if(took('left')){ rgb[chSel]=Math.max(20,rgb[chSel]-15); applyCustomRGB(rgb[0],rgb[1],rgb[2]); sfx('blip'); }
        if(took('right')){ rgb[chSel]=Math.min(255,rgb[chSel]+15); applyCustomRGB(rgb[0],rgb[1],rgb[2]); sfx('blip'); }
        if(took('confirm')){
          const pr=DESIGNER_PALETTES[pSel];
          const res=applyCustomRGB(rgb[0],rgb[1],rgb[2],pr.name.slice(4));
          G.ach('theme_alchemist'); sfx('level');
          G.toast(`> FORGED PHOSPHOR PALETTE: ${res.gd.toUpperCase()}!`,res.gd);
        }
        if(took('party')){
          const pr=DESIGNER_PALETTES[pSel];
          rgb=[...pr.rgb];
          const res=applyCustomRGB(rgb[0],rgb[1],rgb[2],pr.name.slice(4));
          if(!G.flags.theme_grant){ G.flags.theme_grant=1; G.bits+=120; }
          G.ach('theme_alchemist'); sfx('win');
          G.toast(`> PALETTE FORGED & +120 BITS CLAIMED (${res.gd.toUpperCase()})!`,'#4ade80');
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> RGB PHOSPHOR & THEME FORGER',56,40,P.GD,2);
        const curHex=toHex(rgb[0],rgb[1],rgb[2]).toUpperCase();
        UI.text(`ACTIVE PHOSPHOR: ${curHex}   ·   LIVE CRT SYNC`,900,44,P.GD,1,'right');
        // Left: 6 Designer Palettes
        DESIGNER_PALETTES.forEach((p,i)=>{
          const yy=80+i*64, on=i===pSel;
          UI.box(52,yy,400,56,on?P.GD:p.DG,on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          X.fillStyle=p.GD; X.fillRect(66,yy+12,28,32);
          X.fillStyle=p.DG; X.fillRect(96,yy+12,18,32);
          X.fillStyle=p.DDG; X.fillRect(116,yy+12,14,32);
          UI.text((on?'> ':'  ')+p.name,142,yy+12,on?P.GD:P.BONE,1);
          UI.text(`GD: ${p.GD}  ·  DG: ${p.DG}`,142,yy+32,p.GD,1);
        });
        // Right: Interactive RGB Channel Mixer & Live Swatch Preview
        const gd=toHex(rgb[0],rgb[1],rgb[2]), dg=toHex(rgb[0]*0.56,rgb[1]*0.56,rgb[2]*0.56), ddg=toHex(rgb[0]*0.24,rgb[1]*0.24,rgb[2]*0.24);
        UI.box(470,80,434,384,gd,'rgba(10,8,6,.94)');
        UI.text('RGB PHOSPHOR CHANNEL MIXER ([1] SELECT CH · [<-/->] TUNE):',488,98,P.GD,1);
        const chNames=[['RED CHANNEL (R)',rgb[0],'#f43f5e'],['GREEN CHANNEL (G)',rgb[1],'#4ade80'],['BLUE CHANNEL (B)',rgb[2],'#22d3ee']];
        chNames.forEach(([lbl,val,col],ci)=>{
          const yy=122+ci*48, on=ci===chSel;
          UI.box(488,yy,398,40,on?P.GD:P.DDG,'rgba(14,11,8,.92)');
          UI.text((on?'> ':'  ')+lbl,502,yy+12,on?P.GD:P.BONE,1);
          UI.bar(670,yy+14,150,12,val/255,col,P.DDG);
          UI.text(String(val),872,yy+12,col,1,'right');
        });
        // 3-Tone Derived Swatch Preview
        UI.box(488,274,398,92,P.DDG,'rgba(14,11,8,.94)');
        UI.text('DERIVED 3-TONE CRT PHOSPHOR TRIAD:',502,288,P.GD,1);
        [[gd,'PRIMARY (P.GD)',504],[dg,'MID-GRID (P.DG)',634],[ddg,'SHADOW (P.DDG)',764]].forEach(([hx,lbl,bx])=>{
          X.fillStyle=hx; X.fillRect(bx,310,104,26);
          X.strokeStyle=P.BONE; X.strokeRect(bx,310,104,26);
          UI.text(`${lbl.split(' ')[0]} ${hx.toUpperCase()}`,bx+52,342,P.BONE,1,'center');
        });
        UI.box(488,378,398,70,gd,'rgba(245,184,46,.14)');
        UI.text(`[ENTER] APPLY CUSTOM PALETTE (${curHex})`,687,394,gd,1,'center');
        UI.text('[P] FORGE PALETTE & CLAIM +120 BITS GRANT',687,420,'#4ade80',1,'center');
        UI.text('[up/down] preset   [1] RGB channel   [left/right] adjust   [enter] apply   [P] forge +120B   [esc] close',480,490,P.DG,1,'center');
      }
    };
    G.mode='mini'; sfx('confirm');
  };
  // ---- Automated AI vs AI Battle Spectator & Wager Arena (M103) ----
  const SPECTATOR_BOUTS=[
    {id:'bout_1', name:'01. EAST GATE CLASH', crew:['me','kitsune','ignis'], foes:['copy','reflection','echo'], odds:2.0, col:'#f5b82e',
      desc:'1nc0gn30, Kitsune & Ignis vs 03ng0cn1 & Mirror Pack in a high-tempo thermal breach bout.'},
    {id:'bout_2', name:'02. HOLLOW CHORUS SIEGE', crew:['vigil','kai','ghostbyte'], foes:['relay4','voicenode','voicenode'], odds:2.2, col:'#22d3ee',
      desc:'Vigil, Kai & Ghostbyte vs RELAY 4 & Dual Voice Pylons in an acoustic static showdown.'},
    {id:'bout_3', name:'03. 06:12 HOROLOGY DUEL', crew:['chronos','athena','nexus'], foes:['sandglass','phase','sentinel'], odds:2.4, col:'#4ade80',
      desc:'Chronos, Athena & Nexus vs SANDGLASS in a quantum time-dilation endurance match.'},
    {id:'bout_4', name:'04. MIRROR SEAM ASSAULT', crew:['onyx','scorpius','lycan'], foes:['hunter','warden','gunship'], odds:2.5, col:'#a78bfa',
      desc:'Onyx, Scorpius & Lycan vs THE HUNTER & Valkyrie Gunship in the Hall of Mirrors.'},
    {id:'bout_5', name:'05. SKYLINE SOURCE TRIAL', crew:['me','aether','leviathan'], foes:['blank','cursorling','cursorling'], odds:2.8, col:'#fb923c',
      desc:'1nc0gn30, Aether & Leviathan vs THE BLANK CURSOR atop the Mode-7 Source Tower.'},
    {id:'bout_6', name:'06. CITADEL APEX FINALE', crew:['me','copy','aether'], foes:['archon','blank','hunter'], odds:3.0, col:'#f43f5e',
      desc:'The Sovereign Trio (1nc0gn30, 03ng0cn1 & Aether) vs ARCHON-0, Blank Cursor & Hunter!'}
  ];
  const WAGERS=[50,100,200,400];
  G.openSpectator=()=>{
    let sel=0, wIdx=1, running=false, tickT=0, turn=0, cHP=100, fHP=100, logs=[];
    const resetBout=()=>{
      running=false; tickT=0; turn=0; cHP=100; fHP=100;
      const b=SPECTATOR_BOUTS[sel];
      logs=[
        `[ARENA] Matchup queued: ${b.crew.map(id=>PARTY_BASE[id].name.toUpperCase()).join(' + ')}`,
        `[VS] Hostile Pack: ${b.foes.map(k=>ENEMIES[k].name.toUpperCase()).join(' + ')}`,
        `[WAGER] Select wager with [Left/Right] and press [Enter] or [P] to simulate!`
      ];
    };
    resetBout();
    const resolveWin=()=>{
      running=false; fHP=0; cHP=Math.max(28,cHP);
      const b=SPECTATOR_BOUTS[sel], w=WAGERS[wIdx], payout=Math.round(w*b.odds);
      G.bits=(G.bits||0)+payout;
      G.flags['spec_won_'+b.id]=1;
      logs.push(`[VICTORY] PANTHEON WINS IN ${Math.max(3,turn)} TURNS! +${payout} BITS!`);
      if(logs.length>5) logs=logs.slice(-5);
      G.ach('arena_spectator'); sfx('win');
      G.toast(`> SPECTATOR WAGER WON! +${payout} BITS (${b.odds.toFixed(1)}x)!`,'#4ade80');
    };
    G.mini={
      name:'spectator',
      update(dt){
        if(took('back')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
        if(!running){
          if(took('up')){ sel=(sel+SPECTATOR_BOUTS.length-1)%SPECTATOR_BOUTS.length; resetBout(); sfx('move'); }
          if(took('down')){ sel=(sel+1)%SPECTATOR_BOUTS.length; resetBout(); sfx('move'); }
          if(took('left')){ wIdx=(wIdx+WAGERS.length-1)%WAGERS.length; sfx('move'); }
          if(took('right')){ wIdx=(wIdx+1)%WAGERS.length; sfx('move'); }
        }
        if(took('party')){
          turn=4; cHP=76; fHP=0;
          resolveWin();
          return;
        }
        if(took('confirm')){
          if(running){ resolveWin(); return; }
          resetBout(); running=true; sfx('confirm');
          logs.push(`[ROUND 1] AI Tactics engaged: Sovereign Breach Protocol active!`);
          if(logs.length>5) logs=logs.slice(-5);
        }
        if(running){
          tickT+=dt;
          if(tickT>=0.32){
            tickT=0; turn++;
            const b=SPECTATOR_BOUTS[sel];
            const actor=PARTY_BASE[b.crew[turn%3]].name.toUpperCase();
            const foe=ENEMIES[b.foes[turn%3]].name.toUpperCase();
            const dmgToFoe=24+((turn*13)%15);
            const dmgToCrew=10+((turn*7)%9);
            fHP=Math.max(0,fHP-dmgToFoe);
            cHP=Math.max(24,cHP-dmgToCrew);
            logs.push(`[T${turn}] ${actor} strikes ${foe} for ${dmgToFoe}%! (Crew -${dmgToCrew}%)`);
            if(logs.length>5) logs=logs.slice(-5);
            sfx('hit');
            if(fHP<=0) resolveWin();
          }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540);
        UI.box(36,24,888,492,P.GD);
        UI.text('> AI vs AI SPECTATOR & WAGER ARENA',56,40,P.GD,2);
        const w=WAGERS[wIdx], cur=SPECTATOR_BOUTS[sel], pay=Math.round(w*cur.odds);
        UI.text(`WAGER: ${w}B (${cur.odds.toFixed(1)}x = +${pay}B)   ·   BITS: ${G.bits||0}`,900,44,'#4ade80',1,'right');
        // Left: 6 Spectator Bouts
        SPECTATOR_BOUTS.forEach((b,i)=>{
          const yy=80+i*64, on=i===sel, wonB=!!(G.flags&&G.flags['spec_won_'+b.id]);
          UI.box(52,yy,396,56,on?P.GD:(wonB?'#4ade80':P.DDG),on?'rgba(245,184,46,.15)':'rgba(10,8,6,.9)');
          UI.text((on?'> ':'  ')+b.name,66,yy+10,on?P.GD:b.col,1);
          UI.text(`ODDS: ${b.odds.toFixed(1)}x   ·   ${b.crew.map(x=>PARTY_BASE[x].name).join('/')}`,66,yy+30,P.BONE,1);
          UI.text(wonB?'[WON]':`[${b.odds.toFixed(1)}x]`,434,yy+10,wonB?'#4ade80':P.GD,1,'right');
        });
        // Right: Live AI vs AI Combat Arena Stage, HP Bars & Combat Log
        UI.box(466,80,438,384,cur.col,'rgba(10,8,6,.94)');
        UI.text(cur.name.slice(4),484,96,P.GD,2);
        // Arena Visual Stage Box
        UI.box(484,126,402,118,P.DDG,'rgba(14,11,8,.96)');
        // Left: 3 Crew Sprites + HP bar
        cur.crew.forEach((id,idx)=>{
          const sp=frameCanvas(id,running?'walk':'idle',Math.floor(t*6+idx)%2);
          X.drawImage(sp,0,0,sp.width,sp.height,500+idx*44,148,38,38);
        });
        UI.text(`PANTHEON AI (${cHP}%)`,500,132,'#4ade80',1);
        UI.bar(500,196,136,10,cHP/100,'#4ade80',P.DDG);
        UI.text('VS',685,162,P.GD,2,'center');
        // Right: Hostile Squad HP bar & labels
        UI.text(`APEX FOE AI (${fHP}%)`,728,132,'#f43f5e',1);
        cur.foes.forEach((fk,idx)=>{
          UI.box(728,148+idx*16,144,14,'#f43f5e','rgba(40,10,14,.9)');
          UI.text(ENEMIES[fk].name.toUpperCase(),800,150+idx*16,P.BONE,1,'center');
        });
        UI.bar(728,196,144,10,fHP/100,'#f43f5e',P.DDG);
        UI.text(`WAGER STAKE [LEFT/RIGHT]: ${w} BITS  ->  WIN PAYOUT: +${pay} BITS`,685,220,P.GD,1,'center');
        // Live Turn-by-Turn Combat Telemetry Feed
        UI.box(484,254,402,114,P.DDG,'rgba(14,11,8,.92)');
        UI.text('LIVE AI vs AI COMBAT TELEMETRY:',498,266,P.GD,1);
        logs.slice(-4).forEach((ln,li)=>UI.text(ln.slice(0,54),498,286+li*18,li===logs.slice(-4).length-1?'#22d3ee':P.BONE,1));
        UI.box(484,378,402,70,fHP===0?'#4ade80':P.GD,'rgba(245,184,46,.14)');
        UI.text(running?'[ENTER] INSTANT-RESOLVE AI BOUT':'[ENTER] START LIVE AI vs AI BOUT',685,394,P.GD,1,'center');
        UI.text(`[P] INSTANT HIGH-ROLLER VICTORY (+${pay} BITS)`,685,420,'#4ade80',1,'center');
        UI.text('[up/down] bout   [left/right] wager   [enter] spectate live   [P] instant win   [esc] close',480,490,P.DG,1,'center');
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
