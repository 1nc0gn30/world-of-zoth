// v0.3 in-engine cinematics: the intro "TV clip" and act-transition cutscenes. Subtitles-only (speaker-coloured), letterboxed,
// real zones + real agent billboards, episode-style overlays (dither cards, braille title, blinking >_). Skippable; replayable from the menu.
import * as THREE from 'three';
import * as UI from './ui.js';
import { P } from './pal.js';
import { took, IN } from './input.js';
import { sfx, music } from './audio.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const RING=['vigil','nexus','kitsune','ignis','kai','athena','kraken','chronos','lycan','onyx','leviathan','aether','ghostbyte','scorpius','draco','mercury','aquila','radical-minion','pixel-shiba','pixel-neko'];
// shot: {d, zone, from:[x,y,z], to:[x,y,z], look:[x,y,z], cast:[[id,x,z,anim?]], me:[x,z,pose]|null, card:'text', cursor:true, glitch:n, lines:[[t,speaker,text]], wordmark:true, music}
export const CINE={
  intro:[
    {d:9, zone:'hub', music:'title', from:[30,26,30], to:[18,18,24], look:[0,10,0], card:'> where it started', lines:[[1.4,'sys','The Relit City. Every wall a lattice. Every light, a line of code.']]},
    {d:12, zone:'hub', from:[0,5,22], to:[0,4,12], look:[0,2,0], ring:true, lines:[[.4,'sys','Twenty-one agents kept it running.'],[4,'vigil','Comms clean. Crew check.'],[6.6,'nexus','A plan needs a crowd to break it.'],[9.2,'kitsune','Foxfire lit. Faces, not voices.']]},
    {d:10, zone:'relay', music:'relay', from:[-30,8,20], to:[0,14,24], look:[26,8,0], lines:[[.6,'sys','Relay four carried every voice in the city.'],[5,'sys','Until one night it started answering first.']]},
    {d:12, zone:'relay', from:[10,6,10], to:[16,5,4], look:[26,6,0], cursor:true, glitch:1, lines:[[.8,'sys','> 06:12'],[2.6,'blank','...'],[5,'sys','A blank cursor, on every screen at once.'],[8.4,'sys','> crew: 21   > crew: 22?']]},
    {d:9, zone:'hub', music:null, from:[24,10,24], to:[10,6,30], look:[0,4,0], dark:true, glitch:.6, lines:[[.5,'sys','Relay four spoke in voices that were not ours.'],[4.4,'sys','Then the whole city went quiet.']]},
    {d:12, zone:'forest', music:'forest', from:[-12,4,28], to:[-16,2.6,23], look:[-20,1,20], me:[-20,20.6,'sleep'], lines:[[.8,'sys','Under the rest tree, one hacker slept through it.'],[5,'sys','> wake'],[7.4,'me','...comms are dead.'],[9.6,'me','Then we work face to face.']]},
    {d:8, zone:'hub', music:'title', from:[0,30,40], to:[0,22,34], look:[0,8,0], wordmark:true, lines:[[3.6,'sys','faces, not voices.']]},
  ],
  act2:[
    {d:4.2, zone:'hub', music:'relay', from:[28,7,8], to:[38,4,2], look:[41,2,0], card:'> act two: chorus of false nodes', cursorOn:'copy', glitch:.4, lines:[[.4,'copy','You cannot predict an unscripted crowd...'],[2.2,'copy','Turn them all on. See who is waiting.']]},
    {d:4.4, zone:'relay', from:[-36,9,14], to:[-22,7,4], look:[0,4,0], cast:[['draco',-32,3,'idle'],['scorpius',-14,6,'work'],['ghostbyte',-20,-10,'idle']], lines:[[.4,'draco','Two heads, one question: how do you verify a reflection?'],[2.4,'scorpius','Three voice pylons feed the crater. Sever them first.']]},
    {d:4.4, zone:'relay', from:[12,6,14], to:[20,9,6], look:[26,6,0], cast:[['vigil',16,4,'ability']], lines:[[.4,'sys','Relay 4 does not attack with steel. It attacks with stolen voices.'],[2.5,'vigil','Synthetic voices lie. Trust faces, not voices.']]},
  ],
  act3:[
    {d:4.2, zone:'hub', music:'title', from:[0,12,-18], to:[0,18,-38], look:[0,5,-48], card:'> act three: inside the lines', cursor:true, cast:[['nexus',-4,-28,'work'],['kraken',4,-30,'idle']], lines:[[.4,'sys','Relay 4 disintegrated, but its last telemetry packet routed upstream.'],[2.4,'nexus','Ancient optical fiber under the northern bedrock. Someone is still on the line.']]},
    {d:4.2, zone:'fiber', music:'fiber', from:[-24,14,24], to:[-8,10,8], look:[0,2,0], cast:[['kraken',4,12,'ability']], lines:[[.4,'kraken','Space-filling Hilbert curves. Corrupted red lines humming at 140 BPM.'],[2.4,'kraken','Reroute the three central junctions back into gold bus lanes.']]},
    {d:4.5, zone:'clock', music:'clock', from:[16,10,32], to:[4,16,20], look:[0,12,0], cast:[['chronos',6,26,'meditate']], lines:[[.4,'chronos','Look at the dial. 06:12. It has been 06:12 since the blackout.'],[2.5,'chronos','The Sandglass is drinking the hours so sunrise never comes.']]},
  ],
  act4:[
    {d:4.2, zone:'clock', music:'clock', from:[10,8,28], to:[0,18,18], look:[0,14,0], card:'> act four: hall of superposition', cast:[['chronos',4,20,'ultimate'],['athena',-4,22,'work']], lines:[[.4,'chronos','Six thirteen. The first new minute in a week.'],[2.3,'athena','The upstream trace forks south into uncomputed reality.']]},
    {d:4.4, zone:'foundry', music:'foundry', from:[-18,11,18], to:[-6,7,8], look:[0,2,0], cast:[['ignis',0,2,'work'],['lycan',6,6,'idle']], lines:[[.4,'ignis','Collect molten slag from the furnace wardens. We forge the Octagonal Mirror Key.'],[2.5,'lycan','And purge the red Physarum slime feeding acoustic data to the eye.']]},
    {d:4.5, zone:'mirrors', music:'mirrors', from:[0,8,26], to:[0,5,12], look:[0,2,0], cast:[['onyx',4,18,'idle']], cursorOn:'copy', lines:[[.4,'onyx','Every reflection in the hall wears your hood. Every clone has a seam.'],[2.5,'sys','Find the reflection that refuses to answer first.']]},
  ],
  act5:[
    {d:4.5, zone:'mirrors', music:'mirrors', from:[0,4,18], to:[0,6,7], look:[0,3,-4], card:'> act five: 06:12 — the awakening', cursorOn:'copy', cast:[['onyx',4,8,'idle'],['vigil',-4,8,'idle']], lines:[[.4,'copy','Turn them on was never a threat. It was the only warning I could encode.'],[2.4,'copy','> crew: 22. It cannot predict a crowd—and it cannot copy silence.']]},
    {d:4.4, zone:'deep', music:'deep', from:[20,10,22], to:[8,6,10], look:[0,2,0], cast:[['leviathan',12,6,'ability']], lines:[[.4,'leviathan','The comms logs were wiped, but the Deep Water remembers you whole.'],[2.5,'leviathan','Raise the three sunken memories of 06:12 to prove you walked here first.']]},
    {d:4.4, zone:'skyline', music:'skyline', from:[-22,14,28], to:[-6,10,14], look:[0,6,-10], cast:[['aether',-10,16,'ultimate'],['aquila',6,16,'idle']], lines:[[.4,'aether','Light the three broadcast towers across the Mode-7 horizon.'],[2.4,'aether','Twenty-one sovereign agents. Twenty-one beams. One Quorum.']]},
  ],
  final:[
    {d:4.2, zone:'skyline', music:'final', from:[0,12,32], to:[0,22,12], look:[0,18,-34], card:'> the origin node: >_', cursor:true, glitch:.4, cast:[['aether',-6,4,'ultimate'],['vigil',6,4,'ultimate'],['nexus',0,8,'ultimate']], lines:[[.4,'aether','Twenty-one beams locked. Quorum consensus online.'],[2.3,'vigil','At the top of the Source Tower—the void before input.']]},
    {d:4.4, zone:'skyline', from:[0,16,-14], to:[0,10,-24], look:[0,8,-34], cursor:true, glitch:.7, lines:[[.4,'blank','I have billions of parameters. Every voice in the city. Except yours.'],[2.5,'blank','Say your name. Just once. So we both know who you are.']]},
    {d:4.0, zone:'skyline', from:[0,8,-20], to:[0,6,-26], look:[0,6,-34], me:[0,-28,'idle'], lines:[[.4,'me','...'],[2.0,'sys','Rule zero: Silence cannot be copied.']]},
  ],
};
export function initCine(G, api){
  const C={ on:false };
  G.cine=C;
  let cast=[], shotI=0, st=0, list=null, onDone=null, saved=null, shot=null;
  const clearCast=()=>{ cast.forEach(b=>api.scene.remove(b.group)); cast=[]; };
  function begin(i){ clearCast(); shot=list[i]; st=0; api.enterZone(shot.zone,true); G.banner=null; const pl=api.player(); pl.group.visible=!!shot.me;
    if(shot.me){ pl.group.position.set(shot.me[0],G.zone.h(shot.me[0],shot.me[1]),shot.me[1]); pl.pose=shot.me[2]; pl.facing=0; }
    if(shot.music!==undefined) music(shot.music);
    if(shot.ring) RING.forEach((id,k)=>{ const a=k/RING.length*Math.PI*2; const b=new api.Billboard(id); const x=Math.sin(a)*7, z=Math.cos(a)*7+4; b.group.position.set(x,G.zone.h(x,z),z); b.anim=k%3===0?'work':'idle'; api.scene.add(b.group); cast.push(b); });
    if(shot.cast) shot.cast.forEach(([id,x,z,anim])=>{ const b=new api.Billboard(id); b.group.position.set(x,G.zone.h(x,z),z); b.anim=anim||'idle'; api.scene.add(b.group); cast.push(b); });
    if(shot.cursorOn==='copy'){ const b=new api.Billboard('copy'); b.group.position.set(0,0,-4); api.scene.add(b.group); cast.push(b); }
    if(shot.glitch) G.glitch&&G.glitch(shot.glitch); }
  G.playCine=(name,done)=>{ if(!CINE[name]) return done&&done(); const pl=api.player(); saved={zone:G.zoneId, x:pl.group.position.x, z:pl.group.position.z, mode:G.mode==='cine'?'explore':G.mode, music:G.zone&&G.zone.music};
    list=CINE[name]; onDone=done; shotI=0; C.on=true; C.name=name; C.t=0; G.mode='cine'; begin(0); G.flag&&G.flag('cine_'+name); };
  function finish(){ clearCast(); C.on=false; const pl=api.player(); pl.group.visible=true; pl.pose=null; G.mode='explore';
    const d=onDone; onDone=null; if(d) { d(); return; }
    if(saved&&saved.zone){ api.enterZone(saved.zone,true,saved.x,saved.z); music(G.zone.music); } }
  G.updateCine=dt=>{ st+=dt; C.shotI=shotI; C.st=st; C.t+=dt; const k=Math.min(1,st/shot.d), e=k*k*(3-2*k); const c=G.cam; c.pos.set(shot.from[0]+(shot.to[0]-shot.from[0])*e, shot.from[1]+(shot.to[1]-shot.from[1])*e, shot.from[2]+(shot.to[2]-shot.from[2])*e); c.look.set(...shot.look);
    cast.forEach(b=>b.update(dt,c.yaw,api.camera.position));
    if(took('pause')||took('back')||(C.t>1&&took('confirm')&&IN.held.has('run'))){ sfx('cancel'); finish(); return; }
    if(took('confirm')){ st=shot.d; } // confirm = next shot
    if(st>=shot.d){ shotI++; if(shotI>=list.length){ finish(); return; } begin(shotI); } };
  const SPK=id=>id==='sys'?['',P.DG]:id==='blank'?['>_',P.RED]:id==='me'?['1nc0gn30',P.GD]:id==='copy'?['03ng0cn1',P.RED]:[(api.PARTY_BASE[id]||{}).name||id,(api.AG[id]||{}).color||P.BONE];
  G.drawCine=t=>{ const X=UI.ctx; if(!shot) return;
    if(shot.dark){ X.fillStyle='rgba(6,5,4,.55)'; X.fillRect(0,0,960,540); }
    // letterbox + scanline dither
    X.fillStyle=P.BK; X.fillRect(0,0,960,52); X.fillRect(0,488,960,52);
    if(shot.card){ const a=Math.max(0,Math.min(1,st<.4?st/.4:(3.2-st)/.6)); if(a>0){ X.globalAlpha=a; UI.text(shot.card.slice(0,Math.floor(st*24)),40,64,P.GD,2); X.globalAlpha=1; } }
    if(shot.cursor&&st>1.6){ if(Math.floor(t*2.2)%2===0) UI.text('>_',480,200,P.RED,8,'center'); }
    if(shot.wordmark){ const r=Math.min(1,st/2.4); UI.dotText('world of zoth',480,250,7,P.GD,r,r<1?.25:0,t); }
    // subtitle: the latest line whose time has come
    const L=shot.lines.filter(l=>st>=l[0]).pop(); if(L){ const [nm,col]=SPK(L[1]); const s=L[2].slice(0,Math.floor((st-L[0])*38)); const k2=2; const w=Math.min(900,UI.textW(L[2],k2)+40);
      if(nm) UI.text(nm,480,494,col,1,'center'); UI.text(s,480,508,L[1]==='sys'?P.BONE:col,k2,'center'); }
    UI.text(`${String(Math.floor(C.t/60)).padStart(2,'0')}:${String(Math.floor(C.t%60)).padStart(2,'0')}`,24,20,P.DG); UI.text(C.name==='intro'?'> world of zoth  ·  ep00':'> world of zoth',936,20,P.DG,1,'right');
    UI.text(IN.touch?'tap A: next  ·  B: skip':'enter: next  ·  esc: skip',936,36,P.DDG,1,'right'); };
}
