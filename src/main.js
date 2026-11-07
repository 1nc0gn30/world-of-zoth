// World of Zoth — vertical slice. Main loop, game state, exploration, dialogue, menus, title and ending.
import * as THREE from 'three';
import { initRender, draw, scene, camera, U, postU, NW, NH } from './render.js';
import { loadAll, Billboard, AG, frameCanvas, IMGS } from './sprites.js';
import { buildZones, collide, lifeStep } from './world.js';
import { initInput, IN, axis, took, endFrame, press, pollPad } from './input.js';
import { initHud3 } from './hud3.js';
import { initCine } from './cine.js';
import { initTut } from './tut3.js';
import { initLabs } from './labs.js';
import { initHouse } from './house.js';
import { initForge } from './forge.js';
import { ZPAL, spriteCanvas } from './zgl.js';
import { initAudio, music, sfx, AU, renderLog } from './audio.js';
import { initFX, updateFX, burst, dissolve, particle, ringFx, enemyMesh, animEnemy, FX } from './fx.js';
import { segs, ring, latMat } from './geo.js';
import * as UI from './ui.js';
import { P } from './pal.js';
import { PARTY_BASE, GROW, SKILLS, ITEMS, QUESTS, MARK, NPCS, SPAWNS, DLG, talkFor, SHOP } from './data.js';
import { Battle } from './battle.js';
import { MODULES, IDLE, QDEF, CODEX } from './content.js';
import { initQuests } from './quests.js';
import { buildZones2, tagMesh } from './zones2.js';
import { initEggs, ACH } from './eggs.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const SAVE_KEY='woz.save.v1'; const LARGE=()=>G.settings.large;
const G=window.G={ Q:null, mode:'boot', t:0, zone:null, zoneId:'hub', Z:null, party:{}, roster:['me'], activeL:['me'], inv:{}, bits:0, quests:{}, flags:{}, defeated:new Set(),
  settings:{music:true,sfx:true,noTiming:false,large:('ontouchstart' in window)||/android/i.test(navigator.userAgent)}, equip:{}, mods:{}, toasts:[], cam:{yaw:Math.PI, pitch:.32, dist:7.5, pos:V(0,5,20), look:V(0,1,0), lastDrag:-9}, shakeT:0, flashT:0, glitchT:0, fadeV:0 };
// ---------------- canvases ----------------
const screen=document.getElementById('screen'), glc=document.createElement('canvas'); glc.width=960; glc.height=540;
function fit(){ const s=Math.min(innerWidth/960,innerHeight/540); screen.style.width=Math.floor(960*s)+'px'; screen.style.height=Math.floor(540*s)+'px'; }
addEventListener('resize',fit); fit();
const toCanvas=e=>{ const r=screen.getBoundingClientRect(); return {x:(e.clientX-r.left)/r.width*960, y:(e.clientY-r.top)/r.height*540}; };
initRender(glc); UI.initUI(screen); initInput(screen,toCanvas); initFX(scene); G.scene=scene; G.camera=camera;
['keydown','pointerdown'].forEach(ev=>addEventListener(ev,()=>{ initAudio(); },{capture:true}));
// ---------------- state helpers used by dialogue/battle ----------------
Object.assign(G,{
  qhas:k=>!!G.quests[k], qstep:k=>G.quests[k]?G.quests[k].step:-1, qdone_:k=>!!(G.quests[k]&&G.quests[k].done),
  qstart(k){ if(!G.quests[k]){ G.quests[k]={step:0,done:false}; G.pinnedQuest=k; G.trailOn=true; G.scanT=Math.max(G.scanT||0,2.8); G.toast('quest & trail locked: '+QUESTS[k].title,P.GD); sfx('confirm'); G._refresh&&G._refresh(); } },
  qset(k,s){ G.qstart(k); G.quests[k].step=s; G.pinnedQuest=k; G.scanT=Math.max(G.scanT||0,2.2); G.toast('> '+G.stepText(k),P.BONE); G.rebuildFoes&&G.rebuildFoes(); },
  _refresh(){ if(G.rebuildNPCs&&G.mode!=='battle') G.rebuildNPCs(); },
  qdone(k){ G.qstart(k); G.quests[k].done=true; G.toast('[done] '+QUESTS[k].title,P.GD); sfx('win'); },
  flag(k,v=1){ G.flags[k]=v; }, isFlag:k=>!!G.flags[k],
  give(it,n=1){ G.inv[it]=(G.inv[it]||0)+n; G.toast(`+${n} ${ITEMS[it].name}`,P.GD); sfx('loot'); },
  take(it,n=1){ G.inv[it]=Math.max(0,(G.inv[it]||0)-n); }, has:it=>(G.inv[it]||0)>0,
  inParty:id=>G.roster.includes(id), active:()=>G.activeL.filter(id=>G.roster.includes(id)),
  recruit(id){ if(G.roster.includes(id)) return; const me=G.party.me; G.party[id]={lvl:me.lvl,xp:0,hp:0,en:0}; const s=G.stats(id); G.party[id].hp=s.mhp; G.party[id].en=s.men; G.roster.push(id);
    if(G.activeL.length<3) G.activeL.push(id); G.toast(`${PARTY_BASE[id].name} joins the crew`+(G.activeL.includes(id)?'':' (reserve)'),AG[id].color); sfx('level'); G.rebuildNPCs(); },
  stats(id){ const m=G.party[id], B=PARTY_BASE[id], l=m.lvl-1; const s={mhp:B.hp+Math.round(GROW.hp*l*(id==='ignis'?1.2:1)), men:B.en+GROW.en*l, atk:B.atk+GROW.atk*l, def:B.def+GROW.def*l, spd:B.spd};
    const eq=G.equip[id]||{}; for(const sl of ['tool','shell']){ const k=eq[sl], it=k&&ITEMS[k]; if(it&&it.mod){ const mul=1+((G.flags&&G.flags['up_'+k])||0)*.2+((G.flags&&G.flags['rune_'+k])?0.25:0); s.atk+=Math.round((it.mod.atk||0)*mul); s.def+=Math.round((it.mod.def||0)*mul); s.mhp+=Math.round((it.mod.hp||0)*mul); s.men+=Math.round((it.mod.en||0)*mul); s.spd+=Math.round((it.mod.spd||0)*mul); } }
    if(id==='me'){ if(G.has('mirror.shard')) s.spd+=2; const M=G.mods; if(M.o1) s.atk=Math.round(s.atk*1.1); if(M.d1) s.mhp=Math.round(s.mhp*1.15); if(M.t1) s.men=Math.round(s.men*1.2); }
    else if(G.flags&&G.flags['bond_'+id]){ const bm=1+G.flags['bond_'+id]*.05; s.mhp=Math.round(s.mhp*bm); s.men=Math.round(s.men*bm); s.atk=Math.round(s.atk*bm); s.def=Math.round(s.def*bm); }
    const stc=(G.flags&&G.flags['stance_'+id])||0;
    if(stc===0){ s.atk=Math.round(s.atk*1.15); s.spd+=1; }
    else if(stc===1){ s.men=Math.round(s.men*1.2); s.spd+=2; }
    else if(stc===2){ s.def=Math.round(s.def*1.25); s.mhp=Math.round(s.mhp*1.15); }
    const ngTier=(G.flags&&G.flags.ng_plus)||0;
    if(ngTier>0){ const nm=1+ngTier*.12; s.mhp=Math.round(s.mhp*nm); s.men=Math.round(s.men*nm); s.atk=Math.round(s.atk*nm); s.def=Math.round(s.def*nm); s.spd+=ngTier; }
    if(G.flags&&G.flags.harmonic){ s.mhp=Math.round(s.mhp*1.12); s.men=Math.round(s.men*1.12); s.atk=Math.round(s.atk*1.15); s.def=Math.round(s.def*1.15); s.spd+=1; }
    if(G.flags&&G.flags.active_pet){ const pb=1+((G.flags['pet_bond_'+G.flags.active_pet]||0)*0.04); s.mhp=Math.round(s.mhp*1.15*pb); s.men=Math.round(s.men*1.15*pb); s.atk=Math.round(s.atk*1.15*pb); s.def=Math.round(s.def*1.15*pb); s.spd+=2; }
    if(G.flags&&Array.isArray(G.flags.active_implants)&&G.flags.active_implants.length){ const ib=1+G.flags.active_implants.length*0.12; s.mhp=Math.round(s.mhp*ib); s.men=Math.round(s.men*ib); s.atk=Math.round(s.atk*ib); s.def=Math.round(s.def*ib); s.spd+=G.flags.active_implants.length*2; }
    if(G.flags){ s.mhp+=(G.flags['gym_'+id+'_hp']||0)*12; s.men+=(G.flags['gym_'+id+'_en']||0)*6; s.atk+=(G.flags['gym_'+id+'_atk']||0)*4; s.def+=(G.flags['gym_'+id+'_def']||0)*4; s.spd+=(G.flags['gym_'+id+'_spd']||0)*1; }
    return s; },
  modPoints(){ return Math.floor((G.party.me.lvl)/4)-Object.keys(G.mods).length; },
  equipNext(k){ const it=ITEMS[k]; if(!it||!it.slot) return; const holder=G.roster.find(id=>(G.equip[id]||{})[it.slot]===k); let i=holder?G.roster.indexOf(holder)+1:0;
    if(holder){ G.equip[holder][it.slot]=null; } if(i<G.roster.length){ const id=G.roster[i]; G.equip[id]=G.equip[id]||{}; G.equip[id][it.slot]=k; G.toast(`${it.name} > ${PARTY_BASE[id].name}`,P.GD); } else G.toast(`${it.name} unequipped`,P.DG);
    G.roster.forEach(id=>{ const s=G.stats(id), m=G.party[id]; m.hp=Math.min(m.hp,s.mhp); m.en=Math.min(m.en,s.men); }); sfx('confirm'); },
  holderOf(k){ const it=ITEMS[k]; return it&&it.slot&&G.roster.find(id=>(G.equip[id]||{})[it.slot]===k); },
  nextXP:l=>9+(l-1)*24+(l-1)*(l-1)*5,
  gainXP(ids,xp){ const skM=1+((G.flags&&Array.isArray(G.flags.active_skulls))?G.flags.active_skulls.length*0.5:0); xp=Math.round(xp*skM); const ups=[]; ids.forEach(id=>{ const m=G.party[id]; if(m.lvl>=30){ m.xp=0; return; } m.xp+=xp; while(m.lvl<30&&m.xp>=G.nextXP(m.lvl)){ m.xp-=G.nextXP(m.lvl); const a=G.stats(id); m.lvl++; const b=G.stats(id); m.hp=Math.min(b.mhp,m.hp+(b.mhp-a.mhp)+10); m.en=b.men;
      let learn=null; for(const k of PARTY_BASE[id].skills) if(SKILLS[k].lvl===m.lvl) learn=SKILLS[k].name; ups.push({name:PARTY_BASE[id].name,lvl:m.lvl,learn}); if(id==='me'&&m.lvl%4===0) G.toast('+1 kernel module point (menu > mods)',P.GD); } }); G.checkAch&&G.checkAch(); return ups; },
  healAll(){ G.roster.forEach(id=>{ const s=G.stats(id); G.party[id].hp=s.mhp; G.party[id].en=s.men; }); G.toast('party restored',P.GD); },
  sfx, shake(v){ G.shakeT=Math.max(G.shakeT,v); }, flashFx(v){ G.flashT=Math.max(G.flashT,v); }, glitch(v){ G.glitchT=Math.max(G.glitchT,v); },
  toast(t,c=P.BONE){ G.toasts.push({t,c,life:3.2}); if(G.toasts.length>5) G.toasts.shift(); },
  stepText(k){ if(QDEF[k]&&G.Q){ const t=G.Q.stepText(k); if(t) return t; } const q=G.quests[k], Q=QUESTS[k]; if(!q) return ''; let s=Q.steps[Math.min(q.step,Q.steps.length-1)];
    if(k==='q2'&&q.step===1) s=s.replace('0/3',(G.inv['signal.ember']||0)+'/3'); if(k==='q4'&&q.step===1) s=s.replace('0/3',['p1','p2','p3'].filter(p=>G.flags['cut_'+p]).length+'/3'); return s; },
});
// ---------------- boot ----------------
let player, npcs=[], foes=[], followers=[], beacon, navTrail, navPosArr, interact=null, trail=[];
async function boot(){
  await loadAll(); G.Z=buildZones(); buildZones2(G.Z); initQuests(G); initEggs(G,{music,sfx}); initHud3(G,{player:()=>player,trackQuest,markFor,portalToward}); G.Z.hub.checkpoints=[[-5,-2,'save terminal']]; G.Z.forest.checkpoints=[[-20,20,'rest tree']];
  initCine(G,{scene,camera,enterZone,Billboard,AG,PARTY_BASE,player:()=>player}); initTut(G,{player:()=>player}); initLabs(G); initHouse(G,{scene,applyLook:()=>applyLook()}); initForge(G);
  G.enterZone=enterZone; G.Billboard=Billboard;
  try{ G.cosmetics=JSON.parse(localStorage.getItem('woz.cos')||'{}'); }catch(e){ G.cosmetics={}; }
  G.goZone=(id,x,z,yaw)=>transition(()=>enterZone(id,false,x,z,yaw));
  G.hud3.sources.push(z=>z==='hub'?[{x:9,z:-9,col:'#7fd1c8',label:'null academy',kind:'poi'}]:[]);
  { const od=G.qdone, CM={q3:'act2',q4:'act3',q8:'act4',q14:'act5',q16:'final'}, SM={q3:'split_act1',q4:'split_act2',q8:'split_act3',q14:'split_act4',q16:'split_act5',q20:'split_act6',q21:'split_core'}; G.qdone=k=>{ const was=G.qdone_(k); od(k); if(!was&&SM[k]&&!G.flags[SM[k]]) G.flags[SM[k]]=Math.round((G.t||0)*10)/10; if(!was&&CM[k]&&!G.isFlag('cine_'+CM[k])&&!G.noCine) G.pendingCine=CM[k]; }; }
  Object.entries(G.Z).forEach(([k,z])=>{ if(z.tag&&G.Q.TAG_ZONES.includes(k)){ const m=tagMesh(); m.position.set(z.tag[0],z.h(z.tag[0],z.tag[1]),z.tag[1]); z.group.add(m); z.tagMesh=m; } }); Object.values(G.Z).forEach(z=>{ z.group.visible=false; scene.add(z.group); });
  player=G.player=new Billboard('me'); scene.add(player.group);
  // objective beacon: dashed lattice pillar + spinning braille ring
  beacon=new THREE.Group(); const a=[]; for(let y=0;y<14;y+=.7) a.push(0,y,0,0,y+.35,0); const b=[]; ring(b,0,0,0,.9,32,2); const bl=segs(a,latMat({color:P.GD,intensity:1.6,fogFar:200})); const br=segs(b,latMat({color:P.GD,intensity:2,fogFar:200})); br.position.y=.3; beacon.add(bl,br); beacon.userData.ring=br; scene.add(beacon);
  // 3D golden mission guide trail: dynamic buffer geometry with double rails + animated marching chevrons
  navPosArr=new Float32Array(1800*3);
  const navGeo=new THREE.BufferGeometry(); navGeo.setAttribute('position',new THREE.BufferAttribute(navPosArr,3)); navGeo.setDrawRange(0,0);
  navTrail=new THREE.LineSegments(navGeo,latMat({color:P.GD,intensity:1.28,fogFar:180})); navTrail.frustumCulled=false; scene.add(navTrail);
  newGame(); G.mode='title'; enterZone('hub',true); G.titleT=0; music('title');
  if(new URLSearchParams(location.search).has('capture')) WOZ.manual=true;
  if(new URLSearchParams(location.search).has('commercial')){
    const ep=parseInt(new URLSearchParams(location.search).get('commercial')||'1',10)-1;
    G.openCommercial(isNaN(ep)?0:ep);
  }
  requestAnimationFrame(loop);
}
function newGame(ngPlus=false){
  if(ngPlus){
    const ng=(G.flags&&G.flags.ng_plus||0)+1, sf=G.flags&&G.flags.stack_floor||0;
    G.quests={}; G.flags={ng_plus:ng,stack_floor:sf,fasttravel:1}; G.defeated=new Set();
    G.roster.forEach(id=>{ const s=G.stats(id); G.party[id].hp=s.mhp; G.party[id].en=s.men; });
    return;
  }
  G.equip={}; G.mods={};
  G.party={me:{lvl:1,xp:0,hp:60,en:30}}; G.roster=['me']; G.activeL=['me']; G.inv={'patch.kit':2,'cache.bit':1}; G.bits=20; G.quests={}; G.flags={}; G.defeated=new Set();
  const s=G.stats('me'); G.party.me.hp=s.mhp; G.party.me.en=s.men;
}
G.newGamePlus=()=>{ newGame(true); enterZone('hub',false,0,16,Math.PI); G.mode='explore'; G.qstart('q1'); G.toast(`> CYCLE 06:13 (NG+${G.flags.ng_plus}) INITIALIZED`,P.GD); };
// ---------------- zones ----------------
function enterZone(id,silent=false,sx,sz,syaw){
  if(G.zone) G.zone.group.visible=false; const z=G.zone=G.Z[id]; G.zoneId=id; z.group.visible=true;
  const p=player.group.position; p.set(sx??z.spawn.x,0,sz??z.spawn.z); p.y=z.h(p.x,p.z); player.facing=syaw??z.spawn.yaw; G.cam.yaw=player.facing+Math.PI; G.cam.pos.set(p.x+Math.sin(G.cam.yaw)*8,p.y+4,p.z+Math.cos(G.cam.yaw)*8);
  const u=postU(); u.rain.value=z.sky.rain; u.rainCol.value.set(z.sky.rainCol); u.hex.value=z.sky.hex; u.stars.value=z.sky.stars;
  trail=[]; for(let i=0;i<60;i++) trail.push(p.clone());
  if(G.flags.core_down) coreDown();
  Object.values(G.Z).forEach(zz=>{ if(zz.tagMesh) zz.tagMesh.visible=!G.flags['tag_'+zz.id]; });
  if(id==='fiber'&&G.flags.fiber_gold) z.objs.gold(); if(id==='clock') z.objs.clockT.run=!!G.flags.clock_run;
  G.rebuildNPCs(); rebuildFoes(); G.grace=1.5; G.onZone3&&G.onZone3(); if(G.Q) G.Q.onZone(id);
  if(!silent){ G.banner={t0:G.t,t:0,name:z.name,sub:z.sub}; music(z.music); U.pulse2.value.set(p.x,0,p.z,U.time.value); G.glitch(.4); }
}
G.rebuildNPCs=function(){
  npcs.forEach(n=>scene.remove(n.sp.group)); npcs=[]; followers.forEach(f=>scene.remove(f.sp.group)); followers=[];
  if(!G.zone) return;
  NPCS.filter(n=>n.zone===G.zoneId && (n.keep||!G.roster.includes(n.id)) && (!n.cond||n.cond(G))).forEach(n=>{ let x=n.x, z=n.z; if(n.id==='copy'&&n.dyn){ const pl=G.Z.mirrors.objs.pil[4]; x=pl[0]*.82; z=pl[1]*.82; } const sp=new Billboard(n.id==='copy'?'copy':n.id); sp.group.position.set(x,G.zone.h(x,z),z); scene.add(sp.group); npcs.push({...n,x,z,sp}); });
  if(G.Q) G.Q.props().forEach(pr=>{ const sp=new Billboard(pr.id); sp.group.position.set(pr.x,G.zone.h(pr.x,pr.z),pr.z); sp.group.scale.setScalar(.6); scene.add(sp.group); npcs.push({id:pr.id,x:pr.x,z:pr.z,sp,prop:true}); });
  if(G.zoneId==='mirrors'&&!G.qdone_('q12')){ G.Z.mirrors.objs.pil.forEach(([x,z],j)=>{ if(G.flags['mir_'+j]) return; const sp=new Billboard('copy'); const ix=x*.82, iz=z*.82; sp.group.position.set(ix,0,iz); scene.add(sp.group); npcs.push({id:'copy',x:ix,z:iz,sp,reflect:j!==4,refl:true}); }); }
  if(G.zoneId==='hub' && G.qhas('q3') && !G.isFlag('copy_down')){ const sp=new Billboard('copy'); sp.group.position.set(41,0,0); sp.facing=-Math.PI/2; scene.add(sp.group); npcs.push({id:'copy',x:41,z:0,sp,red:true}); }
  if(G.zoneId==='house') G.house.visitors().forEach(v=>{ const sp=new Billboard(v.id); sp.group.position.set(v.x,0,v.z); scene.add(sp.group); npcs.push({id:v.id,x:v.x,z:v.z,sp,prop:true}); });
  G.active().filter(id=>id!=='me').forEach((id,i)=>{ const sp=new Billboard(id); sp.group.position.copy(player.group.position); scene.add(sp.group); followers.push({id,sp,i}); });
};
G.rebuildFoes=()=>rebuildFoes();
function rebuildFoes(){
  foes.forEach(f=>scene.remove(f.obj.group)); foes=[];
  SPAWNS.filter(s=>s.zone===G.zoneId && !G.defeated.has(s.id) && (!s.cond||s.cond(G))).forEach(s=>{
    let obj; if(s.mesh==='echo'){ obj=new Billboard('copy'); } else obj={group:enemyMesh(s.mesh)};
    obj.group.position.set(s.x,G.zone.h(s.x,s.z),s.z); scene.add(obj.group); foes.push({s,obj,home:V(s.x,0,s.z),ang:Math.random()*6,stun:0}); });
}
function coreDown(){ G.Z.relay.objs.core.traverse(o=>{ if(o.material&&o.material.uniforms&&o.material.uniforms.color) o.material.uniforms.color.value.set(P.DG); }); }
G.travel=function(id){ transition(()=>enterZone(id)); };
function transition(fn){ G.mode='transition'; G.trT=0; G.trFn=fn; sfx('door'); }
// ---------------- battles ----------------
G.battle=function(types,opts={}){ G.pendingBattle={types,opts}; };
function startBattle(types,opts){ G.mode='battle'; G.zone.group.children.forEach(o=>{ if(o.userData.keep===undefined) o.userData.keep=o.visible; });
  // keep the ground lattice, dissolve props: hide solids and buildings near the arena
  const C=player.group.position; G.zone.group.children.forEach((o,i)=>{ if(i<=2) return; let c=o.position, r=0; if(o.geometry){ if(!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); c=o.geometry.boundingSphere.center.clone().add(o.position); r=o.geometry.boundingSphere.radius; } else if(o.isGroup){ c=o.position; r=4; }
    if(r<30 && Math.hypot(c.x-C.x,c.z-C.z)<r+12) o.visible=false; }); npcs.forEach(n=>n.sp.group.visible=false); followers.forEach(f=>f.sp.group.visible=false); foes.forEach(f=>f.obj.group.visible=false); beacon.visible=false; if(navTrail) navTrail.visible=false;
  G.glitch(.6); G.flashFx(.5); U.pulse.value.set(player.group.position.x,0,player.group.position.z,U.time.value);
  G.B=new Battle(G,types,opts); }
G.endBattle=function(B){
  G.zone.group.children.forEach(o=>o.visible=o.userData.keep!==undefined?o.userData.keep:true); npcs.forEach(n=>n.sp.group.visible=true); followers.forEach(f=>f.sp.group.visible=true); foes.forEach(f=>f.obj.group.visible=true);
  const o=B.opts; G.B=null; G.mode='explore'; G.grace=2; G.glitch(.3);
  if(B.result==='lose'){ G.ach&&0; G.healAll(); G.bits=Math.floor(G.bits*.75); transition(()=>{ enterZone('forest',false,-17,22,Math.PI); G.toast('you wake under the rest tree.',P.BONE); }); return; }
  if(B.result==='run'){ if(o.foe) o.foe.stun=4; return; }
  if(o.foe){ G.defeated.add(o.foe.s.id); scene.remove(o.foe.obj.group); foes=foes.filter(f=>f!==o.foe); }
  if(o.spawn) { G.defeated.add(o.spawn); rebuildFoes(); }
  if(o.tag==='tut'){ G.qset('q1',2); }
  if(o.tag==='ember'){ if((G.inv['signal.ember']||0)>=3 && G.qstep('q2')===1){ G.qset('q2',2); if(G.roster.includes('kitsune')) o.after='kitsune_4'; } else G.toast('> '+G.stepText('q2')); }
  if(o.tag==='rust'){ G.qset('k1',1); }
  if(o.pylon){ G.flag('cut_'+o.pylon,1); const py=G.Z.relay.objs.pylons[o.pylon]; py.lines.visible=false; py.rings.visible=false; py.dead.visible=true; dissolve(py.g.position.clone().add(V(0,4,0)),P.RED,120,6);
    const n=['p1','p2','p3'].filter(p=>G.flags['cut_'+p]).length; if(n>=3) G.qset('q4',2); else G.toast('> '+G.stepText('q4')); }
  if(o.boss==='copy') G.flag('copy_down',1);
  if(o.boss==='relay4') G.flag('core_down',1), coreDown();
  if(o.boss) G.flags['kill_'+o.boss]=(G.flags['kill_'+o.boss]||0)+1;
  G.flags.total_wins=(G.flags.total_wins||0)+1;
  if(o.dailyKey){
    G.flags[o.dailyKey]=1; G.bits+=(o.dailyReward||600); G.give('root.shell',1);
    G.ach('daily_clear');
    G.toast(`> 06:12 DAILY CHALLENGE CLEARED! +${o.dailyReward||600} bits + Root.Shell`,P.GD);
    G.rebuildNPCs();
    setTimeout(()=>{ if(G.mode==='explore'&&G.openDailyChallenge) G.openDailyChallenge(); },260);
    return;
  }
  if(o.bountyId){
    G.flags['bounty_'+o.bountyId]=1; G.bits+=(o.bountyBits||150); G.give('cache.bit',1);
    const clr=[1,2,3,4,5,6,7,8,9,10].filter(i=>G.flags['bounty_'+i]).length;
    if(clr>=10) G.ach('bounty10');
    G.toast(`> BOUNTY #${o.bountyId} CLEARED! +${o.bountyBits||150} bits (${clr}/10)`,P.GD);
    G.rebuildNPCs();
    setTimeout(()=>{ if(G.mode==='explore'&&G.openBounties) G.openBounties(); },260);
    return;
  }
  if(o.rushStage){
    const st=o.rushStage; G.flags.bossrush_stage=Math.max(G.flags.bossrush_stage||0,st);
    G.bits+=(o.rushReward||200); G.give('mega.patch',1);
    if(st===6){ G.ach('pantheon_trial'); G.give('citadel.crown',1); G.give('sovereign.edge',1); }
    G.toast(`> PANTHEON TRIAL STAGE 0${st} CLEARED! +${o.rushReward||200} bits`,P.GD);
    G.rebuildNPCs();
    setTimeout(()=>{ if(G.mode==='explore'&&G.openBossRush) G.openBossRush(); },260);
    return;
  }
  if(o.endlessWave){
    const wv=o.endlessWave; G.flags.endless_wave=Math.max(G.flags.endless_wave||0,wv);
    const bonus=o.endlessReward||(150+wv*35); G.bits+=bonus;
    if(wv%5===0) G.give('root.shell',1);
    G.ach('endless_survivor');
    G.toast(`> ENDLESS BOSS WAVE ${wv} CLEARED! +${bonus} bits`,P.GD);
    G.rebuildNPCs();
    setTimeout(()=>{ if(G.mode==='explore'&&G.openEndlessBoss) G.openEndlessBoss(); },260);
    return;
  }
  if(o.stackFloor){
    const fl=o.stackFloor; G.flags.stack_floor=Math.max(G.flags.stack_floor||0,fl);
    const bonus=fl*25; G.bits+=bonus;
    if(fl%5===0) G.give('root.shell',1);
    if(fl===10){ G.ach('stack10'); G.give('sovereign.edge',1); }
    G.toast(`> STACK FLOOR ${fl} CLEARED! +${bonus} bits`,P.GD);
    G.rebuildNPCs();
    setTimeout(()=>{ if(G.mode==='explore'&&G.startStack) G.startStack(); },260);
    return;
  }
  if(G.Q) G.Q.onWin(o);
  if(o.after) G.dialog(o.after);
  G.rebuildNPCs();
};
// ---------------- dialogue ----------------
G.dialog=function(id,cb){ const d=DLG[id]; if(!d) return; G.D={id,d,node:'a',typed:0,sel:0,cb,t:0}; G.prevMode=G.mode==='dialog'?G.prevMode:G.mode; G.mode='dialog'; enterNode(); };
function enterNode(){ const D=G.D, n=D.d[D.node]; D.typed=0; D.sel=0; D.t=0; if(n.do) n.do(G); D.choices=n.ch?n.ch.filter(c=>!c[3]||c[3](G)):null; }
function advance(next){ const D=G.D; if(next){ D.node=next; enterNode(); return; } G.D=null; G.mode=G.prevMode==='battle'&&G.B?'battle':'explore'; if(G.mode==='battle'){ } if(D.cb) D.cb(); if(G.mode==='explore'&&G.pendingEnding){ } }
function updateDialog(dt){ const D=G.D, n=D.d[D.node]; D.t+=dt; const len=n.t.length; const before=Math.floor(D.typed); D.typed=Math.min(len,D.typed+dt*48); if(Math.floor(D.typed)>before && Math.floor(D.typed)%3===0 && n.t[Math.floor(D.typed)]!==' ') sfx('talk');
  const done=D.typed>=len;
  if(done && D.choices){ if(took('up')){ D.sel=(D.sel+D.choices.length-1)%D.choices.length; sfx('move'); } if(took('down')){ D.sel=(D.sel+1)%D.choices.length; sfx('move'); }
    for(let i=1;i<=4;i++) if(took('n'+i)&&i<=D.choices.length){ D.sel=i-1; pick(); return; } }
  if(took('confirm')||(IN.clicks.length&&!D.choices)){ if(!done){ D.typed=len; return; } if(D.choices){ pick(); return; } sfx('blip'); advance(n.n); }
  function pick(){ const c=D.choices[D.sel]; sfx('confirm'); if(c[2]) c[2](G); advance(c[1]); }
}
const SPK={ me:['1nc0gn30',P.GD], copy:['03ng0cn1',P.RED], relay4:['RELAY 4',P.RED], 'vigil?':['Vigil?',P.RED], blank:['>_',P.RED], sandglass:['SANDGLASS',P.RED], hunter:['THE HUNTER',P.RED] };
function spk(s){ if(SPK[s]) return SPK[s]; return [AG[s].name,AG[s].color]; }
function drawDialog(t){
  const D=G.D, n=D.d[D.node], X=UI.ctx; const [name,col]=spk(n.s);
  // speaker close-up panel with a dither wash in their colour (EP14 layout)
  const px=16, py=330, pw=156, ph=196; UI.box(px,py,pw,ph,col==='#dc3228'?P.RED2:P.DDG,'rgba(6,5,4,.95)');
  const talking=D.typed<n.t.length; const amp=talking?.35+.25*Math.abs(Math.sin(t*14)):.18;
  UI.ditherRect(px+4,py+4,pw-8,ph-8,col,amp);
  if(n.s==='relay4'||n.s==='vigil?'||n.s==='blank'||n.s==='sandglass'||n.s==='hunter'){ for(let i=0;i<500;i++){ X.fillStyle=Math.random()<.5?P.RED:P.RED2; X.fillRect(px+6+Math.random()*(pw-12)|0,py+6+Math.random()*(ph-12)|0,2,2); } UI.text(n.s==='blank'?'>_':'no face',px+pw/2,py+ph/2-6,P.RED,n.s==='blank'?3:1,'center'); }
  else { const c=frameCanvas(n.s==='me'?'me':n.s==='copy'?'copy':n.s,'idle',Math.floor(t*6)%(n.s==='me'||n.s==='copy'?1:8)); X.imageSmoothingEnabled=false;
    if(n.s==='me'||n.s==='copy'){ const k=3; X.drawImage(c,px+pw/2-c.width*k/2,py+ph-8-c.height*k,c.width*k,c.height*k); }
    else { const k=2.6; X.drawImage(c,0,10,96,86,px+pw/2-96*k/2,py+ph-6-86*k+12,96*k,86*k); } }
  const bx=182, by=400, bw=762, bh=126; UI.box(bx,by,bw,bh,col==='#dc3228'?P.RED2:P.DDG);
  UI.text(name,bx+16,by+10,col,2);
  const shown=n.t.slice(0,Math.floor(D.typed)); const mirror=n.mirror&&D.t<.6;
  UI.wrap(shown,bw-36,2).slice(0,3).forEach((l,i)=>UI.text(l,bx+16,by+40+i*26,P.BONE,2,'left',mirror));
  if(D.typed>=n.t.length){
    if(D.choices){ const cw=Math.max(...D.choices.map(c=>UI.textW(c[0])))+50, ch=D.choices.length*22+14, cx=bx+bw-cw, cy=by-ch-6; UI.box(cx,cy,cw,ch);
      D.choices.forEach((c,i)=>{ const y=cy+8+i*22, sel=i===D.sel; if(sel){ X.fillStyle='rgba(245,184,46,.12)'; X.fillRect(cx+4,y-3,cw-8,20);} UI.text(`${i+1} > ${c[0]}`,cx+12,y,sel?P.GD:P.BONE); UI.hit(cx+4,y-3,cw-8,20,()=>{ D.sel=i; sfx('confirm'); if(c[2]) c[2](G); advance(c[1]); }); }); }
    else UI.cursor(bx+bw-20,by+bh-18,t); }
}
// ---------------- interactables ----------------
function interactables(){
  const L=G.Q?G.Q.interactables():[]; if(G.extraInteract) L.push(...G.extraInteract()); L.push(...G.house.inter()); if(G.zoneId==='hub') L.push({x:9,z:-9,r:2,label:'null academy  (ai labs)',col:'#7fd1c8',act:()=>G.openAcademy()}); npcs.forEach(n=>{ if(n.prop||n.refl) return; L.push({x:n.sp.group.position.x,z:n.sp.group.position.z,r:n.red?4.5:3.6,label:n.red?(n.zone==='mirrors'?'talk  03ng0cn1':'confront  '+'03ng0cn1'):'talk  '+AG[n.id].name,col:n.red?P.RED:AG[n.id].color,act:()=>talkTo(n),npc:n}); });
  if(G.zoneId==='hub'){ L.push({x:-14.2,z:-14.2,r:1.8,label:'???',col:P.DG,act:()=>G.openTerminal()}); L.push({x:-9,z:-9,r:2.2,label:'infinite stack  (floors 1-99)',col:'#a78bfa',act:()=>G.startStack()}); L.push({x:-12,z:3.5,r:2.2,label:'elite  bounties (10 contracts)',col:P.RED,act:()=>G.openBounties()}); L.push({x:14.5,z:3.5,r:2.2,label:'overclock  bench (+1 to +5)',col:'#22d3ee',act:()=>G.openReforge()}); if(G.roster.includes('vigil')) L.push({x:3.6,z:3.6,r:1.5,label:'vigil\'s lamp  (handshake)',col:AG.vigil.color,act:()=>G.startScope()}); if(G.roster.includes('pixel-neko')) L.push({x:12,z:3.5,r:2.6,label:'tool  bench',col:P.GD,act:()=>G.dialog('neko_bench')}); }
  if(G.zoneId==='citadel'){ L.push({x:0,z:12,r:3.2,label:'the infinite stack  (floors 1-99)',col:'#a78bfa',act:()=>G.startStack()}); L.push({x:0,z:-8,r:3.2,label:'pantheon trial  (boss rush)',col:P.RED,act:()=>G.openBossRush()}); }
  if(G.zoneId==='nullcore'){ L.push({x:0,z:14,r:3.2,label:'06:12 daily lattice  (seeded run)',col:'#22d3ee',act:()=>G.openDailyChallenge()}); L.push({x:-14,z:0,r:3.0,label:'operator title  showcase',col:P.GD,act:()=>G.openTitles()}); L.push({x:14,z:0,r:3.0,label:'relic synthesizer  cube',col:'#a78bfa',act:()=>G.openSynth()}); }
  if(G.zoneId==='loom'){ L.push({x:0,z:12,r:3.2,label:'quantum wave-collapse  (5x5)',col:'#a78bfa',act:()=>G.startCollapse()}); L.push({x:-14,z:0,r:3.0,label:'protocol resonance  matrix',col:'#22d3ee',act:()=>G.openResonance()}); L.push({x:14,z:0,r:3.0,label:'laser mirror  router (6x6)',col:P.GD,act:()=>G.startLasers()}); }
  if(G.zoneId==='vault'){ L.push({x:0,z:12,r:3.2,label:'chrono-orrery  puzzle (5 rings)',col:P.GD,act:()=>G.startOrrery()}); L.push({x:-14,z:0,r:3.0,label:'cyber-familiar  pets (6)',col:'#4ade80',act:()=>G.openPets()}); L.push({x:14,z:0,r:3.0,label:'cutscene & dialogue  theater',col:'#22d3ee',act:()=>G.openTheater()}); }
  if(G.zoneId==='astral'){ L.push({x:0,z:12,r:3.2,label:'pantheon triad  3x3 card table',col:'#22d3ee',act:()=>G.startTriad()}); L.push({x:-14,z:0,r:3.0,label:'m100 sovereign  hall of fame',col:P.GD,act:()=>G.openHallOfFame()}); L.push({x:14,z:0,r:3.0,label:'signal tower  rhythm sync',col:'#4ade80',act:()=>G.startRhythm()}); }
  if(G.zoneId==='omega'){ L.push({x:0,z:12,r:3.2,label:'zgl 3d world  blueprint studio',col:'#fb923c',act:()=>G.openBlueprintStudio()}); L.push({x:-14,z:0,r:3.0,label:'endless boss  survival gauntlet',col:P.RED,act:()=>G.openEndlessBoss()}); L.push({x:14,z:0,r:3.0,label:'vector tank  cyber-arena',col:'#22d3ee',act:()=>G.startVectorTank()}); }
  if(G.zoneId==='horizon'){ L.push({x:0,z:12,r:3.2,label:'asteroids: 360°  debris field',col:'#fde047',act:()=>G.startAsteroids()}); L.push({x:-14,z:0,r:3.0,label:'story scene  creator studio',col:'#22d3ee',act:()=>G.openSceneMaker()}); L.push({x:14,z:0,r:3.0,label:'watch movie  commercials (4)',col:'#4ade80',act:()=>G.openCommercial(0)}); }
  if(G.zoneId==='forest') L.push({x:-28,z:-20,r:1.8,label:'watch  the life clearing',col:P.DG,act:()=>G.startLife()});
  if(G.zoneId==='foundry') L.push({x:0,z:-27,r:3,label:'stare into  the fire',col:P.DG,act:()=>G.startDoom()});
  if(G.zoneId==='rooftop'){ L.push({x:0,z:-4,r:2.4,label:'open  laptop',col:P.GD,act:()=>G.dialog('rooftop_laptop')}); L.push({x:0,z:7.5,r:2,label:'stairs  down',col:P.DG,act:()=>G.dialog('rooftop_exit')}); }
  if(G.zoneId==='hub') L.push({x:-5,z:-2,r:2.8,label:'save  terminal',col:P.GD,act:()=>{ saveGame(); G.healAll(); G.tut.saved=true; }});
  if(G.zoneId==='forest') L.push({x:-20,z:20,r:3.2,label:'rest  under the tree',col:P.GD,act:()=>startSleep()});
  if(G.zoneId==='relay' && G.qstep('q4')===1) Object.entries(G.Z.relay.objs.pylons).forEach(([id,p])=>{ if(!G.flags['cut_'+id]) L.push({x:p.x,z:p.z,r:4,label:'cut  voice pylon',col:P.RED,act:()=>{ G.cur=id; G.dialog('pylon_1'); }}); });
  return L;
}
function talkTo(n){ if(n.red&&n.zone!=='mirrors'){ G.dialog('copy_1'); return; } if(G.Q&&G.Q.talk(n.id)) return;
  if(n.id==='mercury'){ const ch=Object.keys(G.Z).filter(z=>z!==G.zoneId&&!G.Z[z].secret&&(G.flags['seen_'+z]||z==='hub')&&(z!=='relay'||G.isFlag('gate_open'))).map(z=>[G.Z[z].name,null,()=>G.travelTo(z)]); ch.push(['No thanks.',null]); DLG.mercury_1.a.ch=ch; G.dialog('mercury_1'); return; }
  if(n.id==='vigil'&&G.qdone_('q4')){ G.dialog('vigil_scope'); return; }
  if(n.id==='pixel-shiba'&&G.isFlag('shiba_gift')&&!G.qhas('s_shiba')&&!(QDEF.s_shiba.avail(G))){ G.dialog('shiba_pet'); return; }
  let d=talkFor(n.id,G); if(d&&/_idle$/.test(d)&&IDLE[n.id]&&Math.random()<.5) d=null; if(n.id==='pixel-shiba'&&d==='shiba_2'){ d='shiba_pet'; }
  if(d) G.dialog(d); else { DLG.__idle={a:{s:n.id,t:IDLE[n.id]||'...',n:null}}; G.dialog('__idle'); } }
G.travelTo=z=>{ G.pendingTravel=z; };
// ---------------- sleep (EP10 pose) ----------------
function startSleep(){ if(G.Q&&G.Q.onRest()) return; G.mode='sleep'; G.slT=0; sfx('sleep'); music(null); G.flags.sleeps=(G.flags.sleeps||0)+1; if(G.flags.sleeps>=3) G.ach('sleep3'); const d=new Date(); if(d.getHours()===6&&d.getMinutes()===12) G.ach('early'); }
function updateSleep(dt){ G.slT+=dt; const t=G.slT; player.pose=t<.8?'kneel':'sleep'; player.facing=0;
  if(t>1.2&&Math.random()<dt*2.5){ const p=player.group.position; particle(p.x+.3,p.y+1.9,p.z,.15,.6,0,2.2,P.GD,.99,0,.1); }
  G.fadeV=t<2.6?0:Math.min(1,(t-2.6)/1.0); if(t>3.6&&!G.slDone){ G.slDone=1; G.healAll(); SPAWNS.filter(s=>s.respawn).forEach(s=>G.defeated.delete(s.id)); rebuildFoes(); saveGame(true); }
  if(t>4.2){ G.fadeV=Math.max(0,1-(t-4.2)); } if(t>5.2){ player.pose=null; G.mode='explore'; G.slDone=0; G.fadeV=0; music(G.zone.music); G.toast('> 06:12   morning. the swarms came back.',P.DG); } }
// ---------------- save / load ----------------
function saveGame(quiet){ const p=player.group.position; const s={v:1,zone:G.zoneId,x:p.x,z:p.z,yaw:player.facing,party:G.party,roster:G.roster,active:G.activeL,inv:G.inv,bits:G.bits,quests:G.quests,flags:G.flags,defeated:[...G.defeated],equip:G.equip,mods:G.mods,time:Date.now(),v2:1};
  try{ localStorage.setItem(SAVE_KEY,JSON.stringify(s)); if(!quiet) G.toast('[ok] saved',P.GD); sfx('save'); return true; }catch(e){ G.toast('save failed',P.RED); return false; } }
function hasSave(){ try{ return !!localStorage.getItem(SAVE_KEY); }catch(e){ return false; } }
function loadGame(){ let s; try{ s=JSON.parse(localStorage.getItem(SAVE_KEY)); }catch(e){} if(!s) { G.toast('no save found'); return false; }
  Object.assign(G,{party:s.party,roster:s.roster,activeL:s.active,inv:s.inv,bits:s.bits,quests:s.quests,flags:s.flags,defeated:new Set(s.defeated),equip:s.equip||{},mods:s.mods||{}});
  if(!s.v2){ G.equip.me=G.equip.me||{}; if(G.inv['keycap.ring']) G.equip.me.tool='keycap.ring'; if(G.inv['hood.v2']) G.equip.me.shell='hood.v2'; if(G.flags.ended){ G.flags.act2_done=1; } }
  if(G.flags.gate_open&&G.quests.q3&&!G.quests.q3.done&&G.quests.q3.step===1) G.quests.q3.step=2;
  enterZone(s.zone,false,s.x,s.z,s.yaw); G.mode='explore'; G.menu=null; G.toast('[ok] loaded',P.GD); return true; }
G.saveGame=saveGame; G.loadGame=loadGame;
// ---------------- shop ----------------
G.openShop=()=>{ G.shop={sel:0}; G.mode='shop'; };
function updateShop(){ const S=G.shop; if(took('up')){ S.sel=(S.sel+SHOP.length)%(SHOP.length+1); } if(took('down')) S.sel=(S.sel+1)%(SHOP.length+1);
  if(took('back')||took('pause')){ G.mode='explore'; G.shop=null; sfx('cancel'); return; }
  if(took('confirm')) shopBuy(S.sel); }
function shopBuy(i){ if(i>=SHOP.length){ G.mode='explore'; G.shop=null; return; } const k=SHOP[i], it=ITEMS[k]; if(it.slot&&G.has(k)){ G.toast('already owned'); sfx('cancel'); return; }
  if(G.bits<it.price){ G.toast('not enough bits',P.ASH); sfx('cancel'); return; } G.bits-=it.price; G.give(k,1); }
function drawShop(t){ const S=G.shop, x=250, y=20, w=460; UI.box(x,y,w,60+SHOP.length*36+30); UI.text('> tool bench',x+16,y+12,AG['pixel-neko'].color,2); UI.text(`bits: ${G.bits}`,x+w-16,y+18,P.GD,1,'right');
  SHOP.forEach((k,i)=>{ const it=ITEMS[k], yy=y+52+i*36, sel=i===S.sel; if(sel){ UI.ctx.fillStyle='rgba(245,184,46,.12)'; UI.ctx.fillRect(x+8,yy-4,w-16,34); }
    UI.text('> '+it.name+(it.slot&&G.has(k)?'  [owned]':''),x+16,yy,sel?P.GD:P.BONE); UI.text(it.price+' bits',x+w-16,yy,P.DG,1,'right'); UI.text(it.desc,x+30,yy+15,P.DG); UI.hit(x+8,yy-4,w-16,34,()=>{ S.sel=i; shopBuy(i); }); });
  const yy=y+52+SHOP.length*36; UI.text((S.sel===SHOP.length?'> ':'  ')+'leave',x+16,yy,S.sel===SHOP.length?P.GD:P.BONE); UI.hit(x+8,yy-4,w-16,22,()=>{ G.mode='explore'; G.shop=null; }); }
// ---------------- pause menu ----------------
const TABS=['quests','party','items','mods','story','log','system'];
function openMenu(tab=0){ G.menu={tab,sel:0}; G.mode='menu'; sfx('confirm'); }
function sysOpts(){ return [['save game',()=>saveGame()],['sovereign master control center (88 tools)',()=>{ G.menu=null; G.openMasterHub(); }],['16-hour marathon credits monument',()=>{ G.menu=null; G.openCredits(); }],['watch movie commercials (4 episodes)',()=>{ G.menu=null; G.openCommercial(0); }],[`game speed multiplier ([V] key): ${(G.gameSpeed||1).toFixed(1)}x`,()=>G.cycleSpeed&&G.cycleSpeed()],['pantheon union skills & 22-crew resonance',()=>{ G.menu=null; G.openUnionSkills(); }],['morse, binary & hex cipher translator',()=>{ G.menu=null; G.openTranslator(); }],['sovereign operator id card & png badge',()=>{ G.menu=null; G.openIDCard(); }],['breakout: firewall brick breaker (mini #19)',()=>{ G.menu=null; G.startBreakout(); }],['complete item & relic compendium (itemdex)',()=>{ G.menu=null; G.openItemDex(); }],['snake: fiber worm protocol (mini #20)',()=>{ G.menu=null; G.startWormGame(); }],['asteroids: 360° debris field (mini #18)',()=>{ G.menu=null; G.startAsteroids(); }],['custom dialogue & story scene creator',()=>{ G.menu=null; G.openSceneMaker(); }],['sovereign command wheel (12-node radial)',()=>{ G.menu=null; G.openQuickWheel(); }],['sovereign relic capsule machine (100% free)',()=>{ G.menu=null; G.openRelicCapsules(); }],['19-district world tour autopilot',()=>{ G.menu=null; G.openWorldTour(); }],['packet alchemy / 2048 bit merger (mini #17)',()=>{ G.menu=null; G.startBitMerge(); }],['tactical combat log & damage analyzer',()=>{ G.menu=null; G.openCombatLog(); }],['zgl 3d world & prop blueprint studio',()=>{ G.menu=null; G.openBlueprintStudio(); }],['endless boss survival gauntlet (wave ∞)',()=>{ G.menu=null; G.openEndlessBoss(); }],['vector tank cyber-arena (mini-game #16)',()=>{ G.menu=null; G.startVectorTank(); }],['companion training regimen & stat gym',()=>{ G.menu=null; G.openGym(); }],['lattice news wire & underground bbs (18)',()=>{ G.menu=null; G.openBBS(); }],['engine & webgl telemetry profiler',()=>{ G.menu=null; G.openProfiler(); }],['interactive quest flowchart & graph',()=>{ G.menu=null; G.openQuestGraph(); }],['signal tower rhythm sync (4-track)',()=>{ G.menu=null; G.startRhythm(); }],['zk hexadecimal vault cracker (8 vaults)',()=>{ G.menu=null; G.openVaultCracker(); }],['ai vs ai battle spectator & wager arena',()=>{ G.menu=null; G.openSpectator(); }],['relic custom naming & engraving anvil',()=>{ G.menu=null; G.openEngrave(); }],['rgb phosphor palette & theme forger',()=>{ G.menu=null; G.openThemeForger(); }],['m100: sovereign 3d hall of fame',()=>{ G.menu=null; G.openHallOfFame(); }],['pantheon 32-card foil binder',()=>{ G.menu=null; G.openCardBinder(); }],['pantheon triad 3x3 card battler',()=>{ G.menu=null; G.startTriad(); }],['operator combat medal & ribbon rack (16)',()=>{ G.menu=null; G.openMedals(); }],['06:13 companion epilogue chronicles (22)',()=>{ G.menu=null; G.openEpilogues(); }],['procedural dungeon seed lab',()=>{ G.menu=null; G.openSeedLab(); }],['sovereign pirate radio tuner (6 fm)',()=>{ G.menu=null; G.openRadio(); }],['battle mutators & challenge skulls (6)',()=>{ G.menu=null; G.openSkulls(); }],['world npc directory & 1-click warp (21)',()=>{ G.menu=null; G.openDirectory(); }],['cybernetic kernel implant lab (9)',()=>{ G.menu=null; G.openImplants(); }],['sub-lattice sonar mine sweeper (6x6)',()=>{ G.menu=null; G.startSonarSweep(); }],['sprite & animation frame studio (22)',()=>{ G.menu=null; G.openSpriteStudio(); }],['achievement trophy case & stipends',()=>{ G.menu=null; G.openTrophyCase(); }],['lattice stock & bit staking exchange',()=>{ G.menu=null; G.openExchange(); }],['chrono-orrery planetary puzzle (5 rings)',()=>{ G.menu=null; G.startOrrery(); }],['sovereign cutscene & dialogue theater',()=>{ G.menu=null; G.openTheater(); }],['cyber-familiar pet companions (6)',()=>{ G.menu=null; G.openPets(); }],['custom battle arena & encounter builder',()=>{ G.menu=null; G.openEncounterBuilder(); }],['tactical contract board v2 (streaks)',()=>{ G.menu=null; G.openContracts(); }],['safehouse 11-cabinet arcade hub',()=>{ G.menu=null; G.openArcade(); }],['hostile ai behavior & intent movedex',()=>{ G.menu=null; G.openMoveDex(); }],['squad gear loadouts & auto-optimizer',()=>{ G.menu=null; G.openLoadouts(); }],['fiber-optic laser mirror router (6x6)',()=>{ G.menu=null; G.startLasers(); }],['protocol resonance matrix (5x5 chords)',()=>{ G.menu=null; G.openResonance(); }],['operator call-sign & hud banner studio',()=>{ G.menu=null; G.openBannerStudio(); }],['quantum wave-collapse 5x5 puzzle',()=>{ G.menu=null; G.startCollapse(); }],['06:12 incident forensic timeline (10 epochs)',()=>{ G.menu=null; G.openTimeline(); }],['pantheon 3-wave survival raids (4)',()=>{ G.menu=null; G.openRaid(); }],['east gate firewall defender (arcade)',()=>{ G.menu=null; G.startDefender(); }],['sovereign soundboard & voice studio',()=>{ G.menu=null; G.openSoundboard(); }],['protocol skill mastery bench (+1 to +3)',()=>{ G.menu=null; G.openSkillMastery(); }],['blender 3d wireframe mesh inspector (17)',()=>{ G.menu=null; G.openMeshViewer(); }],['memory trench core-dump defragmenter',()=>{ G.menu=null; G.startDefrag(); }],['save slot manager & base64 backup',()=>{ G.menu=null; G.openSaveManager(); }],['06:12 daily seeded challenge run',()=>{ G.menu=null; G.openDailyChallenge(); }],[`06:12 nightmare mode (1.5x foes · 2x loot): ${G.settings.nightmare?'ON':'OFF'}`,()=>{ G.settings.nightmare=!G.settings.nightmare; G.toast('06:12 Nightmare Mode: '+(G.settings.nightmare?'ON (1.5x Foes, 2x Loot)':'OFF'),G.settings.nightmare?P.RED:P.GD); }],['operator career telemetry ledger',()=>{ G.menu=null; G.openLedger(); }],['companion combo & overdrive codex',()=>{ G.menu=null; G.openCombos(); }],['physarum slime mould router',()=>{ G.menu=null; G.startRouter(); }],['neko underground black market',()=>{ G.menu=null; G.openBlackMarket(); }],['apex boss practice laboratory',()=>{ G.menu=null; G.openBossLab(); }],['crt shader & scanline studio',()=>{ G.menu=null; G.openShaderStudio(); }],['8-bit chiptune loop composer',()=>{ G.menu=null; G.openComposer(); }],['boss trophy & lore museum',()=>{ G.menu=null; G.openMuseum(); }],['lattice weather radar & storm buffs',()=>{ G.menu=null; G.openWeather(); }],['tactical squad formation & stances',()=>{ G.menu=null; G.openFormation(); }],['signal frequency & morse decoder',()=>{ G.menu=null; G.startDecoder(); }],['22-agent sovereign dossier cards',()=>{ G.menu=null; G.openDossiers(); }],['speedrun split tracker (acts i-vi)',()=>{ G.menu=null; G.openSplits(); }],['hilbert packet runner (3d mini-game)',()=>{ G.menu=null; G.startRunner(); }],['zero-knowledge 4x4 cipher grid',()=>{ G.menu=null; G.startCipher(); }],['safehouse jukebox & waveform visualizer',()=>{ G.menu=null; G.openJukebox(); }],['custom keybind & controller remapper',()=>{ G.menu=null; G.openKeybinds(); }],['combat dojo & dps sandbox',()=>{ G.menu=null; G.openDojo(); }],['zero-knowledge relic synthesizer',()=>{ G.menu=null; G.openSynth(); }],['hermetic datacube archive (15 logs)',()=>{ G.menu=null; G.openDatacubes(); }],['companion affinity & bond matrix',()=>{ G.menu=null; G.openBonds(); }],['operator title badges & showcase',()=>{ G.menu=null; G.openTitles(); }],[`ai battle tactics: ${['manual','companion: breach','companion: support','full squad: auto'][G.aiTactic||0]}`,()=>{ G.aiTactic=((G.aiTactic||0)+1)%4; G.toast('AI Battle Tactics: '+['MANUAL','COMPANION: BREACH','COMPANION: SUPPORT','FULL SQUAD: AUTO'][G.aiTactic],P.GD); }],[`3d mission guide trail: ${G.trailOn!==false?'on':'off'}`,()=>{ G.trailOn=G.trailOn===false; G.toast('mission guide trail: '+(G.trailOn?'on':'off'),P.GD); }],['3d photo mode & postcard studio',()=>{ G.menu=null; G.openPhotoMode(); }],[`hud crt phosphor: ${G.themeName?G.themeName():'gold 1nc0gn30'}`,()=>G.cycleTheme&&G.cycleTheme()],[`speedrun & telemetry hud: ${G.settings.telemetry?'on':'off'}`,()=>{ G.settings.telemetry=!G.settings.telemetry; }],['district elite bounties (10)',()=>{ G.menu=null; G.openBounties(); }],['the infinite stack (rogue-lite)',()=>{ G.menu=null; G.startStack(); }],['pantheon boss rush trial',()=>{ G.menu=null; G.openBossRush(); }],['gear overclocking bench (+1 to +5)',()=>{ G.menu=null; G.openReforge(); }],['hostile bestiary & protocols',()=>{ G.menu=null; G.openBestiary(); }],['crew campfire banter (synergy)',()=>{ G.menu=null; G.openBanter(); }],['new game+ (cycle 06:13 / 06:14 singularity)',()=>{ G.menu=null; G.openSingularity(); }],['story codex (5 acts)',()=>{ G.menu.tab=4; G.menu.sel=0; }],['ai forge (optional, your key)',()=>{ G.menu=null; G.openForge(); }],['map',()=>{ G.menu=null; G.mode='explore'; G.hud3.open(); }],['replay intro',()=>{ G.menu=null; G.mode='explore'; G.playCine('intro'); }],...(G.tut&&G.tut.on?[['skip tutorial',()=>{ G.skipTut(); }]]:[]),['load game',()=>loadGame()],...(G.isFlag('fasttravel')?[['fast travel (mercury)',()=>{ G.menu=null; G.mode='explore'; talkTo({id:'mercury'}); }]]:[]),[`large text: ${G.settings.large?'on':'off'}`,()=>{ G.settings.large=!G.settings.large; }],[`music: ${G.settings.music?'on':'off'}`,()=>{ G.settings.music=!G.settings.music; AU.musicOn=G.settings.music; if(AU.music) AU.music.gain.value=G.settings.music?.55:0; }],
  [`sfx: ${G.settings.sfx?'on':'off'}`,()=>{ G.settings.sfx=!G.settings.sfx; AU.on=G.settings.sfx; }],[`timed strikes: ${G.settings.noTiming?'off (auto)':'on'}`,()=>{ G.settings.noTiming=!G.settings.noTiming; }],['quit to title',()=>{ G.menu=null; G.mode='title'; G.titleT=0; music('title'); }],['resume',()=>{ G.menu=null; G.mode='explore'; }]]; }
function itemList(){ return Object.entries(G.inv).filter(([k,n])=>n>0); }
function questList(){ return Object.keys(G.quests).sort((a,b)=>(G.quests[a].done-G.quests[b].done)||((QUESTS[a].side?1:0)-(QUESTS[b].side?1:0))); }
function updateMenu(){ const M=G.menu; if(took('pause')||took('back')){ G.menu=null; G.mode='explore'; sfx('cancel'); return; }
  const NT=TABS.length; if(took('left')){ M.tab=(M.tab+NT-1)%NT; M.sel=0; sfx('move'); } if(took('right')){ M.tab=(M.tab+1)%NT; M.sel=0; sfx('move'); }
  const n=M.tab===1?G.roster.length:M.tab===2?itemList().length:M.tab===3?MODK.length:M.tab===4?CODEX.length:M.tab===5?Object.keys(ACH).length:M.tab===6?sysOpts().length:questList().length;
  if(n){ if(took('up')){ M.sel=(M.sel+n-1)%n; sfx('move'); } if(took('down')){ M.sel=(M.sel+1)%n; sfx('move'); } }
  if(took('confirm')) menuAct(M.tab,M.sel); }
const MODK=Object.keys(MODULES);
function menuAct(tab,i){ if(tab===0){ const ks=questList(), k=ks[i]; if(!k||G.quests[k].done) return; G.pinnedQuest=k; G.trailOn=true; G.scanT=3; sfx('confirm'); G.toast('> 3d trail locked: '+QUESTS[k].title,P.GD); }
  if(tab===6){ const o=sysOpts()[i]; if(o){ sfx('confirm'); o[1](); } }
  if(tab===4){ const ch=CODEX[i]; if(ch&&ch.cine){ sfx('confirm'); G.menu=null; G.mode='explore'; G.playCine(ch.cine); } }
  if(tab===3){ const k=MODK[i], m=MODULES[k]; if(!m||G.mods[k]) return; if(m.req&&!G.mods[m.req]){ G.toast('needs '+MODULES[m.req].name,P.DG); sfx('cancel'); return; } if(G.modPoints()<=0){ G.toast('no module points (one every 4 levels)',P.DG); sfx('cancel'); return; } G.mods[k]=1; G.toast('module loaded: '+m.name,P.GD); sfx('level'); }
  if(tab===1){ const id=G.roster[i]; if(id==='me') return; if(G.activeL.includes(id)) G.activeL=G.activeL.filter(x=>x!==id); else if(G.activeL.length<3) G.activeL.push(id); else { G.toast('party is full (3)'); return; } sfx('confirm'); G.rebuildNPCs(); }
  if(tab===2){ const [k]=itemList()[i]||[]; const it=ITEMS[k]; if(it&&it.slot){ G.equipNext(k); return; } if(!it||!it.use) return; const ids=G.active(); const tg=ids.map(id=>[id,G.party[id],G.stats(id)]).sort((a,b)=>a[1].hp/a[2].mhp-b[1].hp/b[2].mhp)[0];
    if(it.use==='heal'){ tg[1].hp=Math.min(tg[2].mhp,tg[1].hp+it.v); } else if(it.use==='en'){ tg[1].en=Math.min(tg[2].men,tg[1].en+it.v); } else return; G.take(k); sfx('heal'); G.toast(`${it.name} > ${PARTY_BASE[tg[0]].name}`,P.GD); } }
function drawMenu(t){ const M=G.menu, X=UI.ctx; X.fillStyle='rgba(6,5,4,.78)'; X.fillRect(0,0,960,540); UI.box(96,46,768,448);
  TABS.forEach((tb,i)=>{ const x=116+i*104; UI.text((i===M.tab?'> ':'  ')+tb,x,62,i===M.tab?P.GD:P.DG,1); UI.hit(x,56,98,22,()=>{ M.tab=i; M.sel=0; }); });
  X.fillStyle=P.DDG; X.fillRect(110,84,740,2); const x=122; let y=98;
  if(M.tab===0){ const ks=questList(), trk=trackQuest(); if(!ks.length) UI.text('no quests yet.',x,y,P.DG);
    UI.text('> select a mission & press [enter] to lock 3d guide trail  ·  trail: '+(G.trailOn!==false?'ON':'OFF'),x,y,P.DG); y+=20;
    const pend=G.Q&&G.Q.pending(); if(pend){ UI.text('[next] '+QUESTS[pend.k].title+'  > '+pend.text,x,y,P.GD); y+=22; }
    const done=ks.filter(k=>G.quests[k].done).length; UI.text(`missions done: ${done}`,842,98,P.DG,1,'right');
    ks.forEach((k,i)=>{ if(y>460) return; if(G.quests[k].done&&i>0&&y>380) return; const q=G.quests[k], Q=QUESTS[k], sel=i===M.sel, isTrk=k===trk&&!q.done;
      const y0=y; if(sel){ X.fillStyle='rgba(245,184,46,.1)'; X.fillRect(x-6,y-3,726,38); }
      UI.text((q.done?'[done] ':isTrk?'[trail locked] ':'[active] ')+(Q.act?'act '+['','I','II','III','IV','V','VI'][Q.act]+'  ':'')+Q.title+(Q.side?'  (side)':''),x,y,q.done?P.DG:(sel||isTrk?P.GD:P.BONE)); y+=18;
      if(!q.done){ Q.steps.forEach((s,j)=>{ if(j>q.step||j<q.step-1) return; const txt=j===q.step?G.stepText(k):s; UI.wrap((j<q.step?'  [ok] ':'  > ')+txt,700).forEach(l=>{ UI.text(l,x+10,y,j<q.step?P.DG:P.BONE); y+=16; }); }); }
      UI.hit(x-6,y0-3,726,Math.max(22,y-y0+4),()=>{ M.sel=i; menuAct(0,i); }); y+=8; }); }
  if(M.tab===1){ UI.text(`pantheon crew: ${G.crewCount?G.crewCount():G.roster.length}/22.  confirm toggles active squad (max 3).`,x,y,P.DG); y+=22; const first=Math.max(0,Math.min(M.sel-2,G.roster.length-5));
    G.roster.forEach((id,i)=>{ if(i<first||i>=first+5) return; const m=G.party[id], s=G.stats(id), sel=i===M.sel, on=G.activeL.includes(id), col=id==='me'?P.GD:AG[id].color; if(sel){ X.fillStyle='rgba(245,184,46,.1)'; X.fillRect(x-6,y-4,728,68); }
      const isOp=id==='me'||id==='copy'; const c=frameCanvas(id,'idle',0); X.drawImage(c,0,0,c.width,c.height,x+(isOp?14:0),y-2,isOp?22:56,isOp?56:56);
      UI.text(PARTY_BASE[id].name+(on?'  [active]':'  [reserve]'),x+68,y,col); UI.text(AG[id]&&AG[id].role?AG[id].role:'',x+230,y,P.DG); UI.text(`lv ${m.lvl}  xp ${m.xp}/${G.nextXP(m.lvl)}`,x+714,y,P.DG,1,'right');
      UI.text(`HP ${m.hp}/${s.mhp}   EN ${m.en}/${s.men}   ATK ${s.atk}   DEF ${s.def}   SPD ${s.spd}`,x+68,y+16,P.BONE); const eq=G.equip[id]||{}; UI.text(`tool: ${eq.tool?ITEMS[eq.tool].name:'-'}   shell: ${eq.shell?ITEMS[eq.shell].name:'-'}`,x+430,y+16,P.DG);
      const sk=PARTY_BASE[id].skills.filter(k=>!SKILLS[k].lvl||m.lvl>=SKILLS[k].lvl).map(k=>SKILLS[k].name).join(' · '); const nx=PARTY_BASE[id].skills.find(k=>SKILLS[k].lvl>m.lvl); UI.text('> '+sk+(nx?`   (lv${SKILLS[nx].lvl}: ${SKILLS[nx].name})`:''),x+68,y+32,P.DG);
      if(AG[id]&&AG[id].ability) UI.text('signature: '+AG[id].ability,x+68,y+47,P.DDG);
      UI.hit(x-6,y-4,728,68,()=>{ M.sel=i; menuAct(1,i); }); y+=71; }); }
  if(M.tab===2){ UI.text(`bits: ${G.bits}    gear: confirm moves it to the next crew member`,x,y,P.GD); y+=22; const L=itemList(); const first=Math.max(0,Math.min(M.sel-8,L.length-17)); L.forEach(([k,n],i)=>{ if(i<first||i>=first+17) return; const it=ITEMS[k], sel=i===M.sel, ho=G.holderOf(k); UI.text((sel?'> ':'  ')+it.name+'  x'+n+(it.key?'  [key]':it.slot?(ho?`  [on ${PARTY_BASE[ho].name}]`:'  [gear]'):''),x,y,sel?P.GD:P.BONE); UI.text(it.desc,x+300,y,P.DG); UI.hit(x-6,y-3,720,18,()=>{ M.sel=i; menuAct(2,i); }); y+=20; }); }
  if(M.tab===3){ UI.text(`kernel modules: ${G.modPoints()} point(s) free. one point every 4 levels.`,x,y,P.GD); y+=26;
    ['offense','defense','tech'].forEach((br,b)=>{ const bx=x+b*240; UI.text(br,bx,y,P.DG); MODK.filter(k=>MODULES[k].branch===br).forEach((k,j)=>{ const i=MODK.indexOf(k), m=MODULES[k], on=G.mods[k], sel=i===M.sel, yy=y+22+j*64;
      UI.box(bx,yy,226,56,on?P.GD:(sel?P.DG:P.DDG)); UI.text((on?'[x] ':'[ ] ')+m.name,bx+10,yy+8,on?P.GD:(sel?P.BONE:P.DG)); UI.wrap(m.desc,206).forEach((l,li)=>UI.text(l,bx+10,yy+24+li*14,P.DG)); if(j<2) UI.text('|',bx+110,yy+56,P.DDG);
      UI.hit(bx,yy,226,56,()=>{ M.sel=i; menuAct(3,i); }); }); }); }
  if(M.tab===4){
    UI.text('> master story codex  ·  up/down select act  ·  [enter] watch act cinematic',x,y,P.GD); y+=22;
    CODEX.forEach((c,i)=>{ const sel=i===M.sel, un=c.unlocked(G), dn=c.done(G); const yy=y+i*24;
      if(sel){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(x-6,yy-3,246,21); }
      const st=dn?'[done] ':un?'[open] ':'[lock] ';
      UI.text((sel?'> ':'  ')+st+c.act+': '+(c.short||c.title),x,yy,dn?P.GD:(un?P.BONE:P.DDG));
      UI.hit(x-6,yy-3,248,21,()=>{ M.sel=i; }); });
    const cur=CODEX[M.sel]||CODEX[0]; const rx=x+262, ry=y-2;
    UI.box(rx,ry,466,336,P.DDG,'rgba(8,7,5,.9)');
    UI.text(cur.act+' — '+cur.title.toUpperCase(),rx+14,ry+12,P.GD,2);
    let ly=ry+40; UI.wrap(cur.quote,444,1).forEach(l=>{ UI.text(l,rx+14,ly,'#f5b82e'); ly+=15; });
    ly+=6; cur.lore.forEach(p=>{ UI.wrap(p,444,1).forEach(l=>{ if(ly<ry+268){ UI.text(l,rx+14,ly,P.BONE); ly+=14; } }); ly+=6; });
    const qstr=cur.quests.map(qk=>(G.qdone_(qk)?'[x] ':'[ ] ')+(QUESTS[qk]?QUESTS[qk].title:qk)).join('   ');
    UI.wrap('missions: '+qstr,444,1).slice(0,2).forEach((l,li)=>UI.text(l,rx+14,ry+276+li*14,P.DG));
    UI.box(rx+14,ry+306,240,22,P.GD,'rgba(245,184,46,.12)'); UI.text('> [enter] play '+cur.act.toLowerCase()+' cutscene',rx+24,ry+311,P.GD);
    UI.hit(rx+14,ry+306,240,22,()=>menuAct(4,M.sel));
  }
  if(M.tab===5){ const ks=Object.keys(ACH); const n=ks.filter(k=>G.achGot[k]).length; UI.text(`achievements ${n}/${ks.length}  (up/down scroll)`,x,y,P.GD); y+=22;
    const firstRow=Math.max(0,Math.min(Math.floor(M.sel/2)-6,Math.ceil(ks.length/2)-16));
    ks.forEach((k,i)=>{ const row=Math.floor(i/2)-firstRow; if(row<0||row>=16) return; const got=G.achGot[k], cx=x+(i%2)*360, cy=y+row*21; UI.text((got?'[x] ':'[ ] ')+ACH[k][0],cx,cy,got?P.GD:P.DG); UI.text(got?ACH[k][1]:'???',cx+164,cy,P.DG); }); }
  if(M.tab===6){ const S=sysOpts(), first=Math.max(0,Math.min(M.sel-6,S.length-12));
    S.slice(first,first+12).forEach((o,idx)=>{ const i=first+idx, sel=i===M.sel; UI.text((sel?'> ':'  ')+o[0],x,y,sel?P.GD:P.BONE); UI.hit(x-6,y-3,360,18,()=>{ M.sel=i; menuAct(6,i); }); y+=20; });
    y=346; ['controls','move: WASD / arrows (shift: run)   camera: drag mouse, Q/R, wheel','talk / confirm / sonar: E, space, enter    back: X, backspace','menu: esc / tab   quests: J   items: I   party: P   map: M','battle: space in the gold = crit (+sync chain); [P] = AI tactics','touch: left stick, A = confirm, B = back, = menu'].forEach((l,i)=>{ UI.text(l,x,y,i?P.DG:P.GD); y+=16; }); }
  UI.text('[<- ->] tabs   [esc] close',848,474,P.DG,1,'right'); UI.text('<',106,470,P.GD,2); UI.hit(98,460,30,30,()=>press('left')); UI.text('>',840,62,P.GD,1); UI.hit(814,52,50,30,()=>press('right')); }
// ---------------- explore ----------------
const tmp=V(0,0,0);
function updateExplore(dt){
  const c=G.cam; if(G.grace>0) G.grace-=dt;
  if(took('map')){ G.hud3.open(); return; } if(took('pause')){ openMenu(0); return; } if(took('quests')){ openMenu(0); return; } if(took('items')){ openMenu(2); return; } if(took('party')){ openMenu(1); return; }
  // camera control
  if(IN.drag.dx||IN.drag.dy){ c.yaw-=IN.drag.dx*.009; c.pitch=Math.max(.08,Math.min(1.1,c.pitch+IN.drag.dy*.006)); c.lastDrag=G.t; }
  if(IN.held.has('rotl')){ c.yaw+=dt*2; c.lastDrag=G.t; } if(IN.held.has('rotr')){ c.yaw-=dt*2; c.lastDrag=G.t; }
  c.dist=Math.max(4.5,Math.min(13,c.dist+IN.wheel*.6));
  const a=axis(); const F=V(-Math.sin(c.yaw),0,-Math.cos(c.yaw)), R=V(Math.cos(c.yaw),0,-Math.sin(c.yaw)); const mv=F.multiplyScalar(a.y).add(R.multiplyScalar(a.x));
  const p=player.group.position; const run=IN.held.has('run'); const sp=WOZ.manual?(run?8:5):(run?11.5:6.8);
  player.moving=mv.lengthSq()>.01; player.run=run;
  // ---- v0.3 moves: jump (lattice landing), dissipate (braille blink, i-frames, cooldown), crouch ----
  const M3=G.mv3||(G.mv3={jy:0,vy:0,cd:0,diss:0,dx:0,dz:0,crouch:false}); M3.cd=Math.max(0,M3.cd-dt);
  if(took('jump')){ IN.pressed.delete('confirm'); if(M3.jy<=0.001&&M3.diss<=0){ M3.vy=8.2; sfx('blip'); G.ev3&&G.ev3('jump'); } }
  if(took('dash')&&M3.cd<=0&&M3.diss<=0){ M3.diss=.32; M3.cd=WOZ.manual?1.4:0.9; const f=player.moving?player.facing:player.facing; M3.dx=Math.sin(f); M3.dz=Math.cos(f); G.grace=Math.max(G.grace,.6); sfx('zap'); dissolve(p.clone().add(V(0,1,0)),P.GD,40,1.4); G.ev3&&G.ev3('dash'); }
  M3.crouch=IN.held.has('crouch')&&M3.jy<=0; player.group.scale.y=M3.crouch?.72:1;
  const pre=p.clone();
  const dashSpd=WOZ.manual?16:21;
  if(M3.diss>0){ M3.diss-=dt; p.x+=M3.dx*dashSpd*dt; p.z+=M3.dz*dashSpd*dt; player.group.visible=false; for(let i=0;i<6;i++) particle(p.x+(Math.random()-.5)*1.2,p.y+Math.random()*1.8,p.z+(Math.random()-.5)*1.2,(Math.random()-.5)*2,Math.random(),(Math.random()-.5)*2,.5,Math.random()<.5?P.GD:P.DG,.9,0,.1); if(M3.diss<=0){ player.group.visible=true; dissolve(p.clone().add(V(0,1,0)),P.GD,30,1); } }
  if(player.moving&&M3.diss<=0){ player.facing=Math.atan2(mv.x,mv.z); p.addScaledVector(mv,(M3.crouch?2.6:sp)*dt); }
  collide(G.zone,p); if(G.zone.gates3) for(const g of G.zone.gates3){ if(p.x>g.x0&&p.x<g.x1&&p.z>g.z0&&p.z<g.z1){ const pass=g.kind==='hurdle'?M3.jy>.9:(g.kind==='firewall'?M3.diss>0:M3.crouch); if(!pass){ p.x=pre.x; p.z=pre.z; if(!G.gateT||G.t-G.gateT>2){ G.gateT=G.t; G.toast(g.kind==='hurdle'?'> data hurdle. jump it [space / A]':(g.kind==='firewall'?'> firewall grid. dissipate through it [C / X]':'> low beam. crouch under [ctrl]'),P.DG); } } } }
  if(player.moving&&M3.diss<=0){
    if(G.t-c.lastDrag>1.6 && Math.abs(a.x)<.9){ let target=player.facing+Math.PI; let d=Math.atan2(Math.sin(target-c.yaw),Math.cos(target-c.yaw)); if(a.y>0) c.yaw+=d*Math.min(1,dt*1.2); }
    // braille-dot trail
    if(Math.random()<dt*(run?40:22)) particle(p.x-mv.x*.3+(Math.random()-.5)*.5,p.y+.2+Math.random()*1.4,p.z-mv.z*.3+(Math.random()-.5)*.5,-mv.x*.4,0,-mv.z*.4,.7,P.DG,.9,0,.1);
    G.stepAcc=(G.stepAcc||0)+dt; if(G.stepAcc>(run?.24:.34)){ G.stepAcc=0; sfx('step'); } }
  if(M3.jy>0||M3.vy>0){ M3.vy-=24*dt; M3.jy=Math.max(0,M3.jy+M3.vy*dt); if(M3.jy<=0){ M3.vy=0; const gy=G.zone.h(p.x,p.z); for(let i=0;i<26;i++){ const a=i/26*Math.PI*2; particle(p.x+Math.cos(a)*.4,gy+.05,p.z+Math.sin(a)*.4,Math.cos(a)*3.2,.2,Math.sin(a)*3.2,.5,i%2?P.GD:P.DG,.9,0,.1); } sfx('step'); G.ev3&&G.ev3('land'); } }
  p.y=G.zone.h(p.x,p.z)+M3.jy;
  if(trail.length&&trail[0].distanceTo(p)>.25){ trail.unshift(p.clone()); trail.length=Math.min(trail.length,80); }
  followers.forEach((f,i)=>{ const tp=trail[Math.min(trail.length-1,(i+1)*7)]; const fp=f.sp.group.position; const d=tmp.copy(tp).sub(fp); const mvg=d.length()>.3; if(mvg){ fp.addScaledVector(d,Math.min(1,dt*5)); } fp.y=G.zone.h(fp.x,fp.z); f.sp.anim=mvg&&d.length()>.6?'walk':'idle'; f.sp.moving=mvg&&d.length()>.6; if(mvg) f.sp.facing=Math.atan2(d.x,d.z); f.sp.flip=d.x<0; });
  // NPCs: face the player, anim
  npcs.forEach(n=>{ n.sp.anim='idle'; if(n.refl){ if(n.reflect){ n.sp.moving=player.moving; n.sp.facing=-player.facing+Math.PI; n.sp.group.position.y=Math.sin(G.t*2+n.x)*.05; } else { n.sp.moving=false; n.sp.facing=Math.atan2(p.x-n.x,p.z-n.z); } return; } if(!n.red) n.sp.flip=false; else n.sp.facing=Math.atan2(p.x-n.x,p.z-n.z); });
  // interact
  G.hud3.update(dt); G.updateTut(dt); lookFx(dt);
  // district-reactive 3D ambient weather particles (M09)
  if(Math.random()<dt*18){
    const zid=G.zoneId, wx=p.x+(Math.random()-.5)*18, wz=p.z+(Math.random()-.5)*18, wy=G.zone.h(wx,wz);
    if(zid==='foundry') particle(wx,wy+.2,wz,(Math.random()-.5)*.8,1.8+Math.random()*1.6,(Math.random()-.5)*.8,1.4,Math.random()<.5?'#f97316':P.GD,.95,0,.12);
    else if(zid==='glacier') particle(wx,wy+5+Math.random()*4,wz,Math.sin(G.t+wx)*.6,-1.6-Math.random()*.8,Math.cos(G.t+wz)*.6,2.2,Math.random()<.6?'#67e8f9':P.BONE,.98,0,.1);
    else if(zid==='abyss') particle(wx,wy+.3+Math.random()*3,wz,(Math.random()-.5)*.4,.7+Math.random()*.9,(Math.random()-.5)*.4,1.9,Math.random()<.5?'#22d3ee':'#a78bfa',.96,0,.12);
    else if(zid==='citadel') particle(wx,wy+.4+Math.random()*2,wz,Math.cos(G.t*2+wx)*.5,1.1+Math.random()*.8,Math.sin(G.t*2+wz)*.5,1.6,P.GD,.95,0,.12);
    else if(zid==='nullcore') particle(wx,wy+.4+Math.random()*3,wz,-wx*.15,1.2+Math.random()*.9,-wz*.15,1.9,Math.random()<.5?'#22d3ee':'#f43f5e',.96,0,.12);
    else if(zid==='loom') particle(wx,wy+.4+Math.random()*3,wz,Math.sin(G.t*3+wz)*.8,1.3+Math.random()*.9,Math.cos(G.t*3+wx)*.8,1.9,Math.random()<.5?'#a78bfa':P.GD,.96,0,.12);
    else if(zid==='vault') particle(wx,wy+.4+Math.random()*3,wz,Math.cos(G.t*2.5+wx)*.7,1.4+Math.random()*.9,Math.sin(G.t*2.5+wz)*.7,1.9,Math.random()<.5?'#4ade80':P.GD,.96,0,.12);
    else if(zid==='astral') particle(wx,wy+.4+Math.random()*3.5,wz,Math.sin(G.t*2+wx)*.6,1.5+Math.random()*1.1,Math.cos(G.t*2+wz)*.6,2.1,Math.random()<.5?'#22d3ee':P.GD,.97,0,.12);
    else if(zid==='forest'||zid==='garden') particle(wx,wy+.5+Math.random()*2.2,wz,Math.sin(G.t*3+wx)*.4,.2+Math.random()*.4,Math.cos(G.t*3+wz)*.4,1.8,Math.random()<.5?'#84cc16':P.GD,.96,0,.1);
    else if(zid==='skyline'||zid==='archive') particle(wx,wy+1+Math.random()*3.5,wz,(Math.random()-.5)*2.4,0,(Math.random()-.5)*2.4,.9,P.DG,.9,0,.09);
  }
  if(G.pendingCine&&!G.D&&!G.pendingBattle&&!G.pendingTravel){ const n=G.pendingCine; G.pendingCine=null; G.playCine(n); return; }
  interact=null; let best=1e9; for(const it of interactables()){ const d=Math.hypot(p.x-it.x,p.z-it.z); if(d<it.r&&d<best){ best=d; interact=it; } }
  if(took('confirm')){ if(interact){ sfx('confirm'); interact.act(); return; } else { U.pulse.value.set(p.x,0,p.z,U.time.value); sfx('zap'); G.scanT=3; } }
  // portals
  for(const po of G.zone.portals){ if(Math.hypot(p.x-po.x,p.z-po.z)<po.r){ if(po.lock&&!G.flags[po.lock]){ if(Math.abs(po.x)>Math.abs(po.z)) p.x-=Math.sign(po.x)*1.5; else p.z-=Math.sign(po.z)*1.5; if(!G.lockT||G.t-G.lockT>2){ G.lockT=G.t; G.toast(po.lock==='gate_open'?(G.qhas('q3')?'sealed. the red copy stands in the way.':'the east gate is sealed.'):'> '+po.label+': locked',P.RED); sfx('cancel'); } } else { transition(()=>enterZone(po.to,false,po.sx,po.sz,po.syaw)); return; } } }
  // relay core trigger
  if(G.zoneId==='relay'&&G.qstep('q4')===2&&!G.qdone_('q4')&&!G.isFlag('core_started')&&Math.hypot(p.x-26,p.z)<14){ G.flag('core_started',1); G.dialog('core_1'); return; }
  // foes
  foes.forEach(f=>{ const g=f.obj.group, gp=g.position; f.stun=Math.max(0,f.stun-dt); const d=Math.hypot(p.x-gp.x,p.z-gp.z);
    if(d<9&&f.stun<=0&&G.grace<=0){ const k=Math.min(1,dt*3.4/Math.max(d,.01)); gp.x+=(p.x-gp.x)*k; gp.z+=(p.z-gp.z)*k; } else { f.ang+=dt*.5; gp.x+=(f.home.x+Math.cos(f.ang)*3.5-gp.x)*dt; gp.z+=(f.home.z+Math.sin(f.ang)*3.5-gp.z)*dt; }
    collide(G.zone,gp,.5); gp.y=G.zone.h(gp.x,gp.z); if(f.obj.update) { f.obj.moving=true; f.obj.facing=Math.atan2(p.x-gp.x,p.z-gp.z); f.obj.update(dt,0,camera.position); } else animEnemy(g,G.t,d<9?.3+.3*Math.sin(G.t*10):0);
    if(M3.diss>0&&d<1.8&&f.stun<=0&&G.mode==='explore'){ M3.diss=0; player.group.visible=true; G.toast('> PRE-EMPTIVE LATTICE AMBUSH!',P.GD); G.battle(f.s.group,{foe:f,tag:f.s.tag,after:f.s.after,ambush:true,music:f.s.mesh==='rusted'?'boss':undefined}); return; }
    if(d<1.5&&G.grace<=0&&f.stun<=0&&G.mode==='explore'){ G.battle(f.s.group,{foe:f,tag:f.s.tag,after:f.s.after,music:f.s.mesh==='rusted'?'boss':undefined}); } });
}
function updateCamera(dt){ const c=G.cam, p=player.group.position;
  if(G.mode!=='battle'&&G.mode!=='title'&&G.mode!=='ending'&&G.mode!=='cine'&&!(G.mode==='mini'&&G.mini&&G.mini.see3d)){ const cp=Math.cos(c.pitch); const want=V(p.x+Math.sin(c.yaw)*c.dist*cp, p.y+1.2+Math.sin(c.pitch)*c.dist, p.z+Math.cos(c.yaw)*c.dist*cp);
    const lk=V(p.x,p.y+1.35,p.z); c.pos.lerp(want,1-Math.pow(.0005,dt)); c.look.lerp(lk,1-Math.pow(.0005,dt)); }
  camera.position.copy(c.pos); if(G.shakeT>0){ camera.position.x+=(Math.random()-.5)*G.shakeT*.5; camera.position.y+=(Math.random()-.5)*G.shakeT*.5; G.shakeT=Math.max(0,G.shakeT-dt*2); }
  camera.lookAt(c.look); }
// ---------------- v0.3.1 player look (ZGL cloak / trim / aura) ----------------
let cloakMesh=null;
function applyLook(){ const H=G.house; if(cloakMesh){ player.group.remove(cloakMesh); cloakMesh=null; }
  if(H.cloak&&H.cloak.startsWith('sprite:')){ const sp=H.sprites[H.cloak.slice(7)]; if(sp){ const tx=new THREE.CanvasTexture(spriteCanvas(sp,4)); tx.magFilter=THREE.NearestFilter; cloakMesh=new THREE.Mesh(new THREE.PlaneGeometry(.9,.9*sp.h/sp.w),new THREE.MeshBasicMaterial({map:tx,transparent:true,side:THREE.DoubleSide})); cloakMesh.position.set(0,1.1,-.25); player.group.add(cloakMesh); } } }
function lookFx(dt){ const H=G.house; if(!H||!H.aura||H.aura==='none') return; const p=player.group.position; const col=ZPAL[H.trim]||P.GD; if(Math.random()<dt*(H.aura==='rain'?30:14)){ const a=Math.random()*Math.PI*2;
  if(H.aura==='rings') particle(p.x+Math.cos(a)*.7,p.y+.1,p.z+Math.sin(a)*.7,0,.6,0,.8,col,.9,0,.1); else if(H.aura==='embers') particle(p.x+(Math.random()-.5)*.6,p.y+.4,p.z+(Math.random()-.5)*.6,0,1.4,0,.9,col,.9,0,.1); else if(H.aura==='rain') particle(p.x+(Math.random()-.5)*1.2,p.y+2.6,p.z+(Math.random()-.5)*1.2,0,-3,0,.7,col,.9,0,.1); else particle(p.x+Math.cos(a)*.5,p.y+Math.random()*1.8,p.z+Math.sin(a)*.5,0,0,0,.6,col,.9,0,.1); } }
// ---------------- HUD ----------------
function curActLabel(){ if(G.isFlag('final_done')) return 'ACT VI · DAWN'; if(G.qdone_('q14')) return 'ACT V · 06:12'; if(G.qdone_('q8')) return 'ACT IV · SEAM'; if(G.qdone_('q4')) return 'ACT III · FIBER'; if(G.qdone_('q3')) return 'ACT II · CHORUS'; return 'ACT I · FACES'; }
function curClockLabel(){ if(G.isFlag('final_done')) return 'SUNRISE'; if(G.isFlag('clock_run')) return '06:13'; return '06:12'; }
function drawHUD(t){ const X=UI.ctx;
  const actN=G.active().length;
  G.active().forEach((id,i)=>{ const m=G.party[id], s=G.stats(id), x=12, y=12+i*34, col=id==='me'?(PARTY_BASE.me.col||P.GD):AG[id].color; UI.box(x,y,204,30,P.DDG,'rgba(6,5,4,.78)');
    X.fillStyle=col; X.fillRect(x+2,y+2,3,26);
    UI.text(PARTY_BASE[id].name,x+10,y+5,col); UI.text('lv'+m.lvl,x+196,y+5,P.DG,1,'right'); UI.bar(x+10,y+19,120,4,m.hp/s.mhp,m.hp/s.mhp<.3?P.RED:P.GD); UI.bar(x+136,y+19,58,4,m.en/s.men,P.DG,P.DDG); });
  // tactical telemetry bar under party cards
  const ty=12+actN*34; UI.box(12,ty,204,22,P.DDG,'rgba(6,5,4,.75)');
  UI.text(`${curActLabel()} · ${curClockLabel()} · ${G.crewCount?G.crewCount():G.roster.length}/22`,20,ty+5,P.GD,1);
  if(G.settings.telemetry||G.flags.ng_plus||G.flags.stack_floor){
    const mm=String(Math.floor(G.t/60)).padStart(2,'0'), ss=String(Math.floor(G.t%60)).padStart(2,'0'), ms=String(Math.floor((G.t%1)*100)).padStart(2,'0');
    UI.box(12,ty+24,204,20,P.DDG,'rgba(6,5,4,.78)');
    UI.text(`RUN ${mm}:${ss}.${ms} · NG+${G.flags.ng_plus||0} · FL${G.flags.stack_floor||0}`,20,ty+28,'#22d3ee',1);
  }
  if(G.scanT>0){ const sy=ty+(G.settings.telemetry||G.flags.ng_plus||G.flags.stack_floor?46:25); UI.box(12,sy,204,20,P.GD,'rgba(6,5,4,.82)'); UI.text('> sonar pulse: scanning lattice',20,sy+4,P.GD,1); }
  // objective
  const q=trackQuest(), nt=navTarget();
  if(q){ const pend=q==='__pending'&&G.Q.pending(); const qid=pend?pend.k:q; const s='> '+(pend?pend.text:G.stepText(q)); const actTag=QUESTS[qid]&&QUESTS[qid].act?`act ${['','I','II','III','IV','V','VI'][QUESTS[qid].act]} · `:''; const distStr=nt?`  ·  [trail: ${Math.round(Math.hypot(nt.x-player.group.position.x,nt.z-player.group.position.z))}m]`:''; const title=actTag+(QUESTS[qid]?QUESTS[qid].title:q)+distStr; const m=markFor(q); let extra=''; if(m&&m[0]!==G.zoneId) extra='  (follow trail to '+G.Z[m[0]].name+' portal)'; const k=LARGE()?2:1;
    if(k===2){ const ls=UI.wrap(s+extra,880,2).slice(0,2); const h=24+ls.length*24, bw=Math.min(936,Math.max(UI.textW(title,1),...ls.map(l=>UI.textW(l,2)))+24); UI.box(12,528-h,bw,h,P.DDG,'rgba(6,5,4,.8)'); UI.text(title,24,528-h+6,P.GD); ls.forEach((l,i)=>UI.text(l,24,528-h+20+i*24,P.BONE,2)); UI.hit(12,528-h,bw,h,()=>{ G.trailOn=true; G.scanT=3; sfx('zap'); }); }
    else { const bw=Math.min(760,Math.max(UI.textW(title),UI.textW(s+extra))+28); UI.box(12,486,bw,40,P.DDG,'rgba(6,5,4,.8)'); UI.text(title,24,492,P.GD); UI.text(s+extra,24,507,P.BONE); UI.hit(12,486,bw,40,()=>{ G.trailOn=true; G.scanT=3; sfx('zap'); }); } }
  UI.text(`bits ${G.bits}`,948,150,P.GD,1,'right');
  if(G.currentTitle) UI.text(G.currentTitle(),948,166,'#22d3ee',1,'right');
  G.drawTut();
  // radar
  const rx=880, ry=74, rr=60; X.fillStyle='rgba(6,5,4,.75)'; X.beginPath(); X.arc(rx,ry,rr,0,7); X.fill(); X.strokeStyle=P.DDG; X.lineWidth=2; X.stroke();
  for(let i=1;i<3;i++){ X.strokeStyle='rgba(60,44,10,.9)'; X.beginPath(); X.arc(rx,ry,rr*i/3,0,7); X.stroke(); }
  const sw=(t*1.4)%(Math.PI*2); X.strokeStyle='rgba(245,184,46,.35)'; X.beginPath(); X.moveTo(rx,ry); X.lineTo(rx+Math.cos(sw)*rr,ry+Math.sin(sw)*rr); X.stroke();
  const p=player.group.position, yaw=G.cam.yaw, scale=rr/(G.flags.radar?45:30);
  const dot=(wx,wz,col,sz=3,blink=false)=>{ const dx=wx-p.x, dz=wz-p.z; const rx2=dx*Math.cos(yaw)-dz*Math.sin(yaw), ry2=dx*Math.sin(yaw)+dz*Math.cos(yaw); let sx=rx2*scale, sy=ry2*scale; const l=Math.hypot(sx,sy); if(l>rr-4){ sx*=(rr-4)/l; sy*=(rr-4)/l; } if(blink&&Math.floor(t*3)%2) return; X.fillStyle=col; X.fillRect(Math.round(rx+sx-sz/2),Math.round(ry+sy-sz/2),sz,sz); };
  G.hud3.radarUnder(X,rx,ry,rr,scale,yaw,p);
  // draw golden mission trail on radar minimap
  if(G.trailOn!==false&&G.navPts&&G.navPts.length>1){ X.save(); X.beginPath(); X.arc(rx,ry,rr-2,0,7); X.clip(); X.strokeStyle='rgba(245,184,46,.85)'; X.lineWidth=1.5; X.setLineDash([3,3]); X.beginPath();
    G.navPts.forEach(([wx,wz],i)=>{ const dx=wx-p.x, dz=wz-p.z; const sx=rx+(dx*Math.cos(yaw)-dz*Math.sin(yaw))*scale, sy=ry+(dx*Math.sin(yaw)+dz*Math.cos(yaw))*scale; if(i===0) X.moveTo(sx,sy); else X.lineTo(sx,sy); });
    X.stroke(); X.setLineDash([]); X.restore(); }
  if(G.waypoint){ if(G.waypoint.zone===G.zoneId) dot(G.waypoint.x,G.waypoint.z,P.BONE,6); else { const po=portalToward(G.waypoint.zone); if(po) dot(po.x,po.z,P.BONE,5); } }
  G.zone.portals.forEach(po=>dot(po.x,po.z,P.DG,5)); npcs.forEach(n=>{ if(!n.refl) dot(n.sp.group.position.x,n.sp.group.position.z,n.red?P.RED:AG[n.id].color,4); });
  foes.forEach(f=>{ const d=f.obj.group.position.distanceTo(p); if(G.flags.radar||d<22||G.scanT>0) dot(f.obj.group.position.x,f.obj.group.position.z,P.RED,4); });
  const m=q&&markFor(q); if(m){ if(m[0]===G.zoneId) dot(m[1],m[2],P.GD,6,true); else { const po=portalToward(m[0]); if(po) dot(po.x,po.z,P.GD,6,true); } }
  X.fillStyle=P.BONE; X.beginPath(); X.moveTo(rx,ry-5); X.lineTo(rx-4,ry+4); X.lineTo(rx+4,ry+4); X.fill(); UI.text(G.zone.name,rx,ry+rr+6,P.DG,1,'center'); G.hud3.compass(t);
  // 3D floating HUD objective diamond reticle & off-screen directional indicator
  if(G.trailOn!==false&&nt){ const dist=Math.round(Math.hypot(nt.x-p.x,nt.z-p.z));
    if(dist>2){ const tv=V(nt.x,G.zone.h(nt.x,nt.z)+2.35,nt.z).project(camera);
      let sx=(tv.x+1)/2*960, sy=(1-tv.y)/2*540, off=tv.z>1||sx<64||sx>896||sy<58||sy>460;
      if(tv.z>1){ sx=960-sx; sy=420; }
      let cx=Math.max(84,Math.min(860,sx)), cy=Math.max(64,Math.min(448,sy));
      if(cx>740&&cy<176) cy=176;
      const pulse=5+Math.sin(t*6)*1.5; X.fillStyle=P.GD; X.beginPath(); X.moveTo(cx,cy-pulse); X.lineTo(cx+pulse,cy); X.lineTo(cx,cy+pulse); X.lineTo(cx-pulse,cy); X.fill();
      const lbl=(off?(cx<480?'<< ':'')+`${dist}m · ${nt.label}`+(cx>=480?' >>':''):`${dist}m · ${nt.label}`);
      const lw=UI.textW(lbl,1)+14; UI.box(cx-lw/2,cy+8,lw,18,P.GD,'rgba(6,5,4,.85)'); UI.text(lbl,cx,cy+11,P.GD,1,'center'); } }
  // npc labels
  npcs.forEach(n=>{ if(n.refl||n.prop) return; const d=n.sp.group.position.distanceTo(p); if(d>11) return; const v=n.sp.group.position.clone().add(V(0,2.25,0)).project(camera); if(v.z>1) return; UI.text(n.red?'03ng0cn1':AG[n.id].name,(v.x+1)/2*960,(1-v.y)/2*540-6,n.red?P.RED:AG[n.id].color,LARGE()&&d<6?2:1,'center'); });
  if(interact){ const k=LARGE()?2:1; const s=(IN.touch?'[A] ':'[E] ')+interact.label; const w=UI.textW(s,k)+30; const hh=k===2?40:28, yy=k===2?400:440; UI.box(480-w/2,yy,w,hh,interact.col===P.RED?P.RED2:P.DDG); UI.text(s,480,yy+(k===2?8:8),interact.col,k,'center'); UI.hit(480-w/2,yy,w,hh,()=>interact&&interact.act()); }
  // clickable tactical quick-bar on bottom-right (desktop)
  if(!IN.touch){ const spdLbl=`[V] ${(G.gameSpeed||1).toFixed(1)}x`; const qbs=[['[J] quests',()=>openMenu(0)],['[P] crew',()=>openMenu(1)],['[M] map',()=>G.hud3.open()],['[Tab] codex',()=>openMenu(4)],['[`] shell',()=>G.openTerminal(true)],[spdLbl,()=>G.cycleSpeed&&G.cycleSpeed()],['[C] dash',()=>press('dash')]];
    let qx=948; for(let i=qbs.length-1;i>=0;i--){ const [lbl,fn]=qbs[i], bw=UI.textW(lbl,1)+14; qx-=bw; UI.box(qx,504,bw,22,P.DDG,'rgba(6,5,4,.82)');
      if(i===6&&G.mv3&&G.mv3.cd>0){ UI.bar(qx+2,522,bw-4,2,1-G.mv3.cd/0.9,P.GD,P.DDG); }
      UI.text(lbl,qx+bw/2,509,i===5&&(G.gameSpeed||1)>1?'#4ade80':P.GD,1,'center'); UI.hit(qx,504,bw,22,fn); qx-=4; } }
  if(G.banner){ const b=G.banner; b.t=G.t-b.t0; const n=Math.floor(b.t*28); const s='> district: '+b.name; const bw=Math.max(260,UI.textW(s,2)+44); UI.box(480-bw/2,86,bw,54,P.GD,'rgba(6,5,4,.84)'); UI.text(s.slice(0,n),480,94,P.GD,2,'center'); if(b.t>0.6) UI.text(curActLabel()+'  ·  '+b.sub,480,120,P.BONE,1,'center'); if(b.t>3.6) G.banner=null; }
}
function trackQuest(){ if(G.pinnedQuest&&G.quests[G.pinnedQuest]&&!G.quests[G.pinnedQuest].done) return G.pinnedQuest; const ks=Object.keys(G.quests).filter(k=>!G.quests[k].done&&k!=='s_tags'); return ks.find(k=>!QUESTS[k].side)||(G.Q&&G.Q.pending()?'__pending':null)||ks[0]; }
function navTarget(){ const q=G.quests&&trackQuest(); const m=q&&markFor(q);
  if(m){ const qid=q==='__pending'&&G.Q&&G.Q.pending()?G.Q.pending().k:q; const qTitle=QUESTS[qid]?QUESTS[qid].title:'objective';
    if(m[0]===G.zoneId) return {x:m[1],z:m[2],label:qTitle,zone:m[0],isPortal:false};
    const po=portalToward(m[0]); if(po) return {x:po.x,z:po.z,label:'portal -> '+G.Z[m[0]].name,zone:m[0],isPortal:true}; }
  if(G.waypoint){ if(G.waypoint.zone===G.zoneId) return {x:G.waypoint.x,z:G.waypoint.z,label:'waypoint',zone:G.zoneId,isPortal:false};
    const po=portalToward(G.waypoint.zone); if(po) return {x:po.x,z:po.z,label:'waypoint -> '+G.Z[G.waypoint.zone].name,zone:G.waypoint.zone,isPortal:true}; }
  return null; }
G.navTarget=navTarget;
function markFor(q){ if(q==='__pending'){ const p=G.Q.pending(); return p&&p.mark; } if(QDEF[q]&&G.Q) return G.Q.mark(q); const st=G.quests[q].step; let m=MARK[q]&&MARK[q][st]; if(!m&&q==='q2'&&st===1){ const s=SPAWNS.filter(s=>s.tag==='ember'&&!G.defeated.has(s.id)); if(s[0]) m=['forest',s[0].x,s[0].z]; }
  if(!m&&q==='q4'&&st===1){ const pid=['p1','p2','p3'].find(p=>!G.flags['cut_'+p]); if(pid){ const py=G.Z.relay.objs.pylons[pid]; m=['relay',py.x,py.z]; } } return m; }
function portalToward(z){ const prev={[G.zoneId]:null}, q=[G.zoneId]; while(q.length){ const c=q.shift(); if(c===z) break; for(const p of G.Z[c].portals){ if(!(p.to in prev)){ prev[p.to]=c; q.push(p.to); } } } if(!(z in prev)) return null; let c=z; while(prev[c]&&prev[c]!==G.zoneId) c=prev[c]; return G.zone.portals.find(p=>p.to===c); }
function drawToasts(dt){ let y=170; const k=LARGE()?2:1; G.toasts.slice(0,2).forEach(to=>{ to.life-=dt; const a=Math.min(1,to.life); if(a<=0) return; UI.ctx.globalAlpha=a; const w=Math.min(700,UI.textW(to.t,k))+24, hh=k===2?34:24; UI.box(948-w,y,w,hh,P.DDG); UI.text(to.t,936,y+6,to.c,k,'right'); UI.ctx.globalAlpha=1; y+=hh+4; }); G.toasts=G.toasts.filter(t=>t.life>0); }
function drawTouch(){ if(!IN.touch) return; IN.wantStick=G.mode==='explore'; const X=UI.ctx;
  if(G.mode==='explore'){ X.strokeStyle='rgba(245,184,46,.4)'; X.lineWidth=2; const sx=IN.stick.active?IN.stick.ox:110, sy=IN.stick.active?IN.stick.oy:400; X.beginPath(); X.arc(sx,sy,50,0,7); X.stroke(); X.fillStyle='rgba(245,184,46,.5)'; X.beginPath(); X.arc(sx+IN.stick.x*40,sy+IN.stick.y*40,16,0,7); X.fill(); }
  const btn=(x,y,l,a,r=34,hold)=>{ X.fillStyle='rgba(6,5,4,.72)'; X.beginPath(); X.arc(x,y,r,0,7); X.fill(); X.strokeStyle=P.DG; X.lineWidth=2; X.stroke(); UI.text(l,x,y-12,P.GD,2,'center'); UI.hit(x-r,y-r,r*2,r*2,()=>{ if(hold) IN.toggleRun=!IN.toggleRun; else press(a); }); };
  if(G.mode==='explore'){ btn(896,446,'A','confirm',40); btn(910,236,'=','pause',28); btn(810,500,IN.toggleRun?'>>':'>','run',28,true); btn(820,380,'^','jump',30); btn(740,460,'~','dash',30); btn(910,300,'M','map',24); if(IN.toggleRun) IN.held.add('run'); else if(!IN.kbRun) IN.held.delete('run'); }
  else if(G.mode==='battle'&&G.B&&G.B.state==='victory'){ btn(896,446,'A','confirm',40); }
  else if(['battle','menu','shop','dialog','terminal','mini'].includes(G.mode)){ btn(896,446,'A','confirm',36); btn(820,500,'B','back',28); if(G.mode!=='dialog'||(G.D&&G.D.choices)){ btn(740,400,'^','up',26); btn(740,490,'v','down',26); btn(680,445,'<','left',26); btn(800,445,'>','right',26); } } }
// ---------------- title / ending ----------------
function updateTitle(dt){ G.titleT+=dt; const c=G.cam; const a=G.titleT*.06; c.pos.set(Math.sin(a)*34,12+Math.sin(G.titleT*.2)*3,Math.cos(a)*34); c.look.set(0,6,0);
  const opts=titleOpts(); G.tsel=Math.min(G.tsel||0,opts.length-1); if(took('up')){ G.tsel=(G.tsel+opts.length-1)%opts.length; sfx('move'); } if(took('down')){ G.tsel=(G.tsel+1)%opts.length; sfx('move'); }
  if(IN.held.size||IN.clicks.length) G.titleIdle=0; if(took('confirm')&&G.titleT>.5) opts[G.tsel][1](); }
function titleOpts(){ const o=[]; if(hasSave()){ o.push(['continue',()=>{ sfx('confirm'); loadGame(); }]); o.push(['new game+ (cycle 06:13)',()=>{ sfx('confirm'); loadGame(); G.newGamePlus(); }]); } o.push(['new game',()=>{ sfx('confirm'); G.skipTutNext=false; startNew(); }]); o.push(['new game (skip intro + tutorial)',()=>{ sfx('confirm'); G.skipTutNext=true; startNew(true); }]); o.push(['watch movie commercial',()=>{ sfx('confirm'); G.openCommercial(); }]); o.push(['controls',()=>{ G.showCtl=!G.showCtl; sfx('blip'); }]); return o; }
function startNew(skipIntro){ newGame(); const go=()=>{ enterZone('hub',false,0,16,Math.PI); G.mode='explore'; G.qstart('q1'); if(!G.skipTutNext) G.startTut(); G.dialog('intro'); };
  if(skipIntro||G.noCine) go(); else G.playCine('intro',go); }
function drawTitle(t){ const X=UI.ctx; const r=Math.min(1,G.titleT/1.6); X.fillStyle='rgba(6,5,4,.38)'; X.fillRect(0,0,960,540);
  UI.dotText('world of zoth',480,164,7,P.GD,r,G.titleT<2?.15:(Math.sin(t*1.3)>.97?.3:0),t);
  if(G.titleT>1.4){ UI.text('a 1nc0gn30 story  ·  nullai platform',480,224,P.BONE,2,'center'); UI.text('"trust faces, not voices. silence cannot be copied."',480,250,P.DG,1,'center'); }
  if(G.titleT>2.0){ titleOpts().forEach((o,i)=>{ const y=296+i*30, sel=i===G.tsel; UI.text((sel?'> ':'  ')+o[0],420,y,sel?P.GD:P.DG,2); if(sel) UI.cursor(420+UI.textW('> '+o[0],2)+4,y+4,t); UI.hit(380,y-4,240,28,()=>{ G.tsel=i; o[1](); }); }); }
  if(G.showCtl){ UI.box(250,400,460,120); ((IN.touch||/android=1/.test(location.search))?['left stick moves, drag right side for camera, run toggles','A talks + confirms, B goes back, the menu button opens the menu','battle: tap A in the gold = crit, tap A on impact = block']:['WASD/arrows move, shift run, drag/Q/R camera','E/space talk + confirm, X back, esc menu, J quests','battle: space in the gold = crit, space on impact = block']).forEach((l,i)=>UI.text(l,270,416+i*20,P.BONE)); }
  if(G.titleT>61){ const n=Math.floor((G.titleT-61)*10); UI.text('found you'.slice(0,n),480,270,P.RED,2,'center'); }
  UI.text('v1.0 · sovereign director\'s cut',950,524,P.DDG,1,'right'); }
G.finalEnding=function(){ G.mode='final'; G.endT=0; music('title'); sfx('win'); G.ach('ending'); G.checkAch(); G.flag('final_done'); saveGame(true); };
function updateFinal(dt){ G.endT+=dt; const T=G.endT; const p=player.group.position; player.pose=T<1?'kneel':'sleep'; const c=G.cam; c.pos.set(p.x+Math.sin(T*.05)*9,2.5+T*.25,p.z+9); c.look.set(p.x,1.5+T*.2,p.z-10);
  postU().stars.value=Math.max(0,2.4-T*.15); if(T>26&&took('confirm')){ player.pose=null; G.mode='explore'; music(G.zone.music); } }
function drawFinal(t){ const T=G.endT, X=UI.ctx; const dawn=Math.min(1,Math.max(0,(T-4)/8));
  if(!G.dawnC){ const c=document.createElement('canvas'); c.width=960; c.height=540; const x=c.getContext('2d'); // sunrise dither, baked once
    for(let y=0;y<540;y+=2){ const f=Math.max(0,1-y/540*1.3); if(f<=0) continue; x.globalAlpha=f*.55; x.fillStyle=y<200?P.GD:P.DG; for(let xx=(y/2)%4;xx<960;xx+=4) x.fillRect(xx,y,1,1); } G.dawnC=c; }
  if(dawn>0){ X.globalAlpha=dawn; X.drawImage(G.dawnC,0,0); X.globalAlpha=1; }
  if(T>2) UI.text('> 06:12'.slice(0,Math.floor((T-2)*8)),480,60,P.GD,3,'center');
  const lines=[['> status',P.BONE],['> relay 4: offline',P.GD],['> sunrise: yes',P.GD],['> comms: on  (faces first)',P.BONE],['> crew: '+G.crewCount(),G.crewCount()>=22?P.GD:P.BONE],['> tomorrow 06:12',P.DG]]; lines.forEach(([l,c],i)=>{ const st=6+i*1.4; if(T>st) UI.text(l.slice(0,Math.floor((T-st)*14)),120,150+i*30,c,2); });
  if(T>16){ const r=Math.min(1,(T-16)/1.8); UI.dotText('1nc0gn30',480,400,9,P.GD,r,T<18?.25:0,t); }
  if(T>20) UI.text('world of zoth',480,470,P.DG,2,'center'); if(T>26) UI.text('[confirm] keep exploring',480,506,P.BONE,1,'center'); }
G.ending=function(){ G.pendingEnd=true; G.qstart('q4'); G.quests.q4.step=3; G.quests.q4.done=true; G.flag('ended',1); saveGame(true); };
function updateEnding(dt){ G.endT+=dt; const c=G.cam; const a=G.endT*.05; c.pos.set(26+Math.sin(a)*30,10+G.endT*.3,Math.cos(a)*30); c.look.set(26,5,0); if(G.endT>17&&took('confirm')){ G.mode='explore'; G.flag('ended',1); G.qdone('q4'); saveGame(true); music(G.zone.music); } }
function drawEnding(t){ const T=G.endT, X=UI.ctx; X.fillStyle=`rgba(6,5,4,${Math.min(.8,T*.2)})`; X.fillRect(0,0,960,540);
  const lines=[['> relay 4: offline',P.GD],['> comms: on  (faces first)',P.BONE],['> crew: '+G.roster.length,P.BONE],['> last relay: core',P.GD]]; lines.forEach(([l,c],i)=>{ const st=1+i*1.6; if(T>st) UI.text(l.slice(0,Math.floor((T-st)*14)),180,120+i*30,c,2); });
  if(T>8){ const r=Math.min(1,(T-8)/1.6); UI.dotText('1nc0gn30',480,350,9,P.GD,r,T<10?.25:0,t); }
  if(T>11) UI.text('world of zoth  ·  slice complete',480,430,P.DG,2,'center'); if(T>17) UI.text('[confirm] keep exploring',480,480,P.BONE,1,'center'); }
// ---------------- main loop ----------------
let last=performance.now();
function frame(dt){
  G.t+=dt; U.time.value=G.t; pollPad();
  // clicks on last frame's UI
  if(IN.clicks.length){ const c=IN.clicks[0]; for(let i=UI.hits.length-1;i>=0;i--){ const h=UI.hits[i]; if(c.x>=h.x&&c.x<=h.x+h.w&&c.y>=h.y&&c.y<=h.y+h.h){ h.fn(); IN.clicks.length=0; break; } } }
  UI.hits.length=0;
  LIFE_ACC+=dt; if(LIFE_ACC>.12){ LIFE_ACC=0; lifeStep(); }
  if(G.scanT>0) G.scanT-=dt;
  if(G.eatConfirm){ G.eatConfirm--; IN.pressed.delete('confirm'); }
  const M=G.mode;
  if(M==='title') updateTitle(dt);
  else if(M==='explore') updateExplore(dt);
  else if(M==='dialog') updateDialog(dt);
  else if(M==='battle'){ G.B&&G.B.update(dt); }
  else if(M==='menu') updateMenu();
  else if(M==='shop') updateShop();
  else if(M==='sleep') updateSleep(dt);
  else if(M==='ending') updateEnding(dt);
  else if(M==='final') updateFinal(dt);
  else if(M==='terminal') G.updateTerminal(dt);
  else if(M==='mini') G.updateMini(dt);
  else if(M==='map') G.hud3.mapUpdate(dt);
  else if(M==='cine') G.updateCine(dt);
  if((M==='explore'||M==='dialog'||M==='battle'||M==='mini')&&G.fadeV>0) G.fadeV=Math.max(0,G.fadeV-dt*3);
  if(M==='transition'){ G.trT+=dt; G.fadeV=G.trT<.35?G.trT/.35:Math.max(0,1-(G.trT-.45)/.35); G.glitchT=Math.max(G.glitchT,.3); if(G.trT>=.4&&G.trFn){ const f=G.trFn; G.trFn=null; f(); } if(G.trT>.8){ G.mode='explore'; G.fadeV=0; } }
  if(G.pendingBattle&&(G.mode==='explore'||G.mode==='dialog')&&!G.D){ const b=G.pendingBattle; G.pendingBattle=null; startBattle(b.types,b.opts); }
  if(G.pendingTravel&&G.mode==='explore'&&!G.D){ const z=G.pendingTravel; G.pendingTravel=null; transition(()=>enterZone(z)); }
  if(G.pendingEnd&&G.mode==='explore'){ G.pendingEnd=false; G.mode='ending'; G.endT=0; music('title'); sfx('win'); }
  // world anim
  if(G.zone) G.zone.anim.forEach(f=>f(G.t));
  if(G.mode!=='battle'&&G.mode!=='mini'){ player.update(dt,G.cam.yaw,camera.position); npcs.forEach(n=>n.sp.update(dt,G.cam.yaw,camera.position)); followers.forEach(f=>f.sp.update(dt,G.cam.yaw,camera.position)); }
  // beacon + 3D golden mission guide trail
  const nt=(G.trailOn!==false&&G.zone&&!['battle','title','ending','cine','mini'].includes(G.mode))?navTarget():null;
  beacon.visible=!!nt;
  if(nt){ beacon.position.set(nt.x,G.zone.h(nt.x,nt.z),nt.z); beacon.userData.ring.rotation.y=G.t*2; beacon.userData.ring.position.y=(G.t*2)%3;
    const p=player.group.position;
    if(!G.navPts||!G._navT||G.t-G._navT>.2||Math.hypot(p.x-(G._navPx||0),p.z-(G._navPz||0))>1.1||G._navTx!==nt.x||G._navTz!==nt.z){
      G._navT=G.t; G._navPx=p.x; G._navPz=p.z; G._navTx=nt.x; G._navTz=nt.z;
      G.navPts=G.hud3.findPath(G.zone,p.x,p.z,nt.x,nt.z);
    }
    // populate 3D double-rail golden ribbon + marching chevrons along G.navPts
    let vi=0; const pts=G.navPts, phase=(G.t*4.5)%1, rw=.28;
    for(let i=0;i<pts.length-1&&vi<1780;i++){
      const [ax,az]=pts[i], [bx,bz]=pts[i+1], dx=bx-ax, dz=bz-az, len=Math.hypot(dx,dz)||1, ux=dx/len, uz=dz/len, px=-uz, pz=ux;
      const mx=ax+dx*.75, mz=az+dz*.75, ya=G.zone.h(ax,az)+.12, ym=G.zone.h(mx,mz)+.12;
      // left & right parallel golden guide rails
      navPosArr[vi*3]=ax+px*rw; navPosArr[vi*3+1]=ya; navPosArr[vi*3+2]=az+pz*rw; vi++;
      navPosArr[vi*3]=mx+px*rw; navPosArr[vi*3+1]=ym; navPosArr[vi*3+2]=mz+pz*rw; vi++;
      navPosArr[vi*3]=ax-px*rw; navPosArr[vi*3+1]=ya; navPosArr[vi*3+2]=az-pz*rw; vi++;
      navPosArr[vi*3]=mx-px*rw; navPosArr[vi*3+1]=ym; navPosArr[vi*3+2]=mz-pz*rw; vi++;
      // marching directional chevron (>) every segment
      if(vi<1780){
        const cx=ax+dx*phase, cz=az+dz*phase, cy=G.zone.h(cx,cz)+.16, w=.52, back=.52;
        const lx=cx-ux*back+px*w, lz=cz-uz*back+pz*w, rx2=cx-ux*back-px*w, rz2=cz-uz*back-pz*w;
        navPosArr[vi*3]=lx; navPosArr[vi*3+1]=cy; navPosArr[vi*3+2]=lz; vi++;
        navPosArr[vi*3]=cx; navPosArr[vi*3+1]=cy; navPosArr[vi*3+2]=cz; vi++;
        navPosArr[vi*3]=rx2; navPosArr[vi*3+1]=cy; navPosArr[vi*3+2]=rz2; vi++;
        navPosArr[vi*3]=cx; navPosArr[vi*3+1]=cy; navPosArr[vi*3+2]=cz; vi++;
      }
    }
    navTrail.geometry.attributes.position.needsUpdate=true;
    navTrail.geometry.setDrawRange(0,vi);
    navTrail.visible=true;
    // subtle golden guide spark flowing along the first few steps near the player
    if(pts.length>1&&Math.random()<dt*(G.scanT>0?45:16)){
      const idx=Math.min(pts.length-2,Math.floor(Math.random()*Math.min(6,pts.length-1)));
      const [ax,az]=pts[idx], [bx,bz]=pts[idx+1], u2=Math.random(), gx=ax+(bx-ax)*u2, gz=az+(bz-az)*u2;
      particle(gx,G.zone.h(gx,gz)+.18,gz,(bx-ax)*1.4,.45,(bz-az)*1.4,.55,P.GD,.95,0,.12);
    }
  } else if(navTrail){ navTrail.visible=false; G.navPts=null; }
  player.group.visible=G.mode!=='title'&&G.mode!=='ending';
  updateFX(dt); updateCamera(dt);
  const u=postU(); G.glitchT=Math.max(0,G.glitchT-dt*1.5); G.flashT=Math.max(0,G.flashT-dt*2.5); u.glitch.value=G.glitchT; u.flash.value=G.flashT*.7; u.fade.value=G.fadeV;
  draw();
  const X=UI.ctx; X.imageSmoothingEnabled=false; X.drawImage(glc,0,0);
  // floating battle numbers
  FX.nums.forEach(n=>{ const v=n.p.clone().add(V(0,n.t*1.2,0)).project(camera); if(v.z>1) return; UI.text(n.txt,(v.x+1)/2*960,(1-v.y)/2*540,n.col,2,'center'); });
  if(G.mode==='title') drawTitle(G.t);
  else if(G.mode==='ending') drawEnding(G.t);
  else if(G.mode==='final') drawFinal(G.t);
  else if(G.mode==='terminal') G.drawTerminal(G.t);
  else if(G.mode==='mini') G.drawMini(G.t);
  else if(G.mode==='map') G.hud3.mapDraw(G.t);
  else if(G.mode==='cine') G.drawCine(G.t);
  else { if(G.mode==='battle'&&G.B) G.B.draw(G.t); else if(G.mode==='explore'||G.mode==='transition') drawHUD(G.t);
    if(G.mode==='dialog'){ if(G.B) G.B.draw(G.t); drawDialog(G.t); }
    if(G.mode==='menu') drawMenu(G.t); if(G.mode==='shop') drawShop(G.t);
    if(G.mode==='sleep'&&G.slT>1.2){ const z=Math.floor(G.slT*2)%3; UI.text('z'.repeat(z+1),540,200-z*8,P.GD,2); }
    drawToasts(dt); }
  drawTouch();
  endFrame();
}
let LIFE_ACC=0;
G.gameSpeed=1.0;
G.cycleSpeed=()=>{ const s=[1.0,1.5,2.0]; G.gameSpeed=s[(s.indexOf(G.gameSpeed||1.0)+1)%s.length]; G.toast(`> GAME SPEED: ${G.gameSpeed.toFixed(1)}x ${G.gameSpeed===2?'(HYPER-CLOCK)':G.gameSpeed===1.5?'(TURBO)':'(STANDARD)'}`,'#4ade80'); sfx('blip'); };
function loop(now){ if(WOZ.manual){ requestAnimationFrame(loop); last=now; return; } const dt=Math.min(.05,(now-last)/1000)*(G.gameSpeed||1.0); last=now; frame(dt); requestAnimationFrame(loop); }
// ---------------- test / capture hooks ----------------
const WOZ=window.WOZ={ manual:false,
  step(n=1,dt=1/30){ for(let i=0;i<n;i++) frame(dt); },
  state(){ const p=player.group.position; return { mode:G.mode, zone:G.zoneId, x:p.x, z:p.z, yaw:G.cam.yaw, facing:player.facing, party:JSON.parse(JSON.stringify(G.party)), roster:[...G.roster], active:G.active(), inv:{...G.inv}, bits:G.bits, quests:JSON.parse(JSON.stringify(G.quests)), flags:{...G.flags},
    battle:G.B?{lastMe:G.B.lastMe, state:G.B.state, actor:G.B.actor&&G.B.actor.id, enemies:G.B.enemies.map(e=>({type:e.type,hp:e.hp,alive:e.alive})), party:G.B.party.map(p=>({id:p.id,hp:p.hp,en:p.en,alive:p.alive})), menu:G.B.menu, opts:G.B.state==='menu'?G.B.options().map(o=>o.label):null, result:G.B.result}:null,
    dialog:G.D?{id:G.D.id,node:G.D.node,choices:G.D.choices&&G.D.choices.map(c=>c[0]),done:G.D.typed>=G.D.d[G.D.node].t.length}:null, interact:interact&&interact.label, foes:foes.map(f=>({id:f.s.id,x:f.obj.group.position.x,z:f.obj.group.position.z})),
    npcs:npcs.map(n=>({id:n.id,x:n.sp.group.position.x,z:n.sp.group.position.z})), hasSave:hasSave(), mark:(()=>{ const q=trackQuest(); return q?markFor(q):null; })(), track:trackQuest() }; },
  frame(type='image/png'){ return screen.toDataURL(type); },
  startLog(){ AU.log=[]; WOZ.t0=G.t; AU.clock=()=>G.t-WOZ.t0; if(AU.track) AU.log.push({t:0,type:'music',name:AU.track}); }, async audio(dur){ return renderLog(AU.log,dur); },
  warp(z,x,zz){ G.D=null; G.mode='explore'; enterZone(z,false,x,zz); },
  target(){ const q=trackQuest(); if(!q) return null; const real=q==='__pending'?G.Q.pending().k:q; const qd=QDEF[real]; const st=G.quests[real]?G.quests[real].step:-1; const sd=qd&&qd.steps&&qd.steps[st]; return {q:real, pending:q==='__pending', step:st, kind:sd?sd.kind:null, mark:markFor(q), pil:sd&&sd.kind==='mirror'?G.Z.mirrors.objs.pil.map(([x,z])=>[x*.82,z*.82]):null}; },
  skipTo(k){ // debug: complete the main chain up to quest k (tests only)
    for(const q of ['q1','q2','q3','q4']){ G.quests[q]={step:9,done:true}; } ['kitsune','ignis','vigil'].forEach(id=>G.recruit(id)); ['gate_open','copy_down','core_down','act2_done'].forEach(f=>G.flag(f));
    const order=Object.keys(QDEF).filter(q=>QDEF[q].main); for(const q of order){ if(q===k) break; G.Q.start(q); (QDEF[q].steps||[]).forEach(st=>{ if(st.flag) G.flag(st.flag); (st.items||[]).forEach(([it,n])=>G.give(it,n)); }); G.flag('qd_'+q); G.Q.finish(q); }
    G.D=null; G.mode='explore'; G.rebuildNPCs(); },
  setLvl(l){ G.roster.forEach(id=>{ G.party[id].lvl=l; G.party[id].xp=0; }); G.healAll(); }, G, press };
boot();
