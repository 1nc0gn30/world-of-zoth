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
  act2:[{d:10, zone:'relay', music:'relay', from:[14,6,12], to:[20,10,8], look:[26,6,0], card:'> act two: chorus', lines:[[1,'sys','The pylons are down. The core is listening.'],[5,'vigil','Trust faces. Not voices.']]}],
  act3:[{d:11, zone:'hub', music:'title', from:[0,14,-20], to:[0,20,-40], look:[0,6,-50], card:'> act three: the trace', cursor:true, lines:[[1,'sys','Relay four is dead. Its last call went upstream.'],[5,'nexus','North gate. Old fiber. Someone is still on the line.'],[8.4,'blank','...']]}],
  act4:[{d:11, zone:'clock', music:'clock', from:[10,8,30], to:[0,20,20], look:[0,14,0], card:'> act four: the seam', lines:[[1,'chronos','Six thirteen. The first new minute in a week.'],[5,'athena','The trace forks south. Into the streets, the forge, the mirrors.'],[8.4,'sys','Every clone has a seam.']]}],
  act5:[{d:11, zone:'mirrors', music:'mirrors', from:[0,4,20], to:[0,6,8], look:[0,3,-6], card:'> act five: whoami', cursorOn:'copy', lines:[[1,'copy','> crew: 22'],[4.4,'onyx','It reflected the beam and went with it.'],[7.6,'leviathan','Come down to the deep water. I remember something it erased.']]}],
  final:[{d:10, zone:'skyline', music:'final', from:[0,10,30], to:[0,26,6], look:[0,24,-40], card:'> the source', cursor:true, glitch:.4, lines:[[1,'aether','Twenty-one beams. One quorum.'],[5,'blank','Say your name. Just once.'],[8,'me','...']]}],
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
