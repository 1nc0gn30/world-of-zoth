// v0.3 guided tutorial ("first light") in the Relit City + traversal caches that need jump / dissipate.
import * as THREE from 'three';
import * as UI from './ui.js';
import { P } from './pal.js';
import { IN } from './input.js';
import { segs, latMat } from './geo.js';
// caches: a square fence of gates around a reward; hurdle = jump in, firewall = dissipate in
export const CACHES=[
  {id:'c_hub_j', zone:'hub', x:12, z:20, kind:'hurdle', bits:30, label:'training cache'},
  {id:'c_hub_d', zone:'hub', x:-12, z:20, kind:'firewall', bits:30, label:'training cache'},
  {id:'c_forest', zone:'forest', x:8, z:8, kind:'hurdle', bits:60, item:['root.shell',1], label:'root cache'},
  {id:'c_relay', zone:'relay', x:-20, z:-12, kind:'firewall', bits:90, item:['root.shell',1], label:'firewall cache'},
  {id:'c_fiber', zone:'fiber', x:0, z:20, kind:'firewall', bits:200, label:'packet cache'},
  {id:'c_streets', zone:'streets', x:0, z:24, kind:'hurdle', bits:260, label:'tile cache'},
];
export const TUT=[
  {k:'move', t:'Move', hint:['WASD / arrows','left stick','left stick'], done:G=>G.tut.dist>8},
  {k:'cam', t:'Look around', hint:['drag mouse or Q / R','drag the right side','right stick / LB RB'], done:G=>G.tut.cam>1.2},
  {k:'run', t:'Run', hint:['hold Shift','tap >','hold L3'], done:G=>G.tut.ran>1.5},
  {k:'jump', t:'Jump the data hurdle into the training cache (east)', hint:['Space','tap ^','A'], done:G=>G.isFlag('c_hub_j')},
  {k:'dash', t:'Dissipate through the firewall cache (west)', hint:['C','tap ~','X'], done:G=>G.isFlag('c_hub_d')},
  {k:'map', t:'Open the map and set a waypoint', hint:['M, then Enter','tap M, then tap the map','Y, then A'], done:G=>!!G.waypoint},
  {k:'cp', t:'Touch the save terminal (checkpoint)', hint:['walk up, E','walk up, tap A','walk up, A'], done:G=>G.tut.saved},
  {k:'talk', t:'Talk to Vigil at the relay', hint:['E near her','tap A near her','A near her'], done:G=>G.qstep('q1')>=1},
  {k:'fight', t:'Win your first fight (north street). In battle: Space in the gold = crit; Space on impact = block; C on impact = dissipate-dodge.', hint:['','tap A in the gold','A in the gold'], done:G=>G.qstep('q1')>=2},
];
export function initTut(G, api){
  const T=G.tut={on:false,i:0,dist:0,cam:0,ran:0,saved:false,lp:null,ly:0};
  // build gate meshes + collision strips per zone
  CACHES.forEach(c=>{ const Z=G.Z[c.zone]; if(!Z) return; Z.gates3=Z.gates3||[]; const h=2.6, s=c.kind==='hurdle'?.6:1.0, H=c.kind==='hurdle'?.75:3.2;
    [[c.x-h-s/2,c.z-h-s/2,c.x+h+s/2,c.z-h+s/2],[c.x-h-s/2,c.z+h-s/2,c.x+h+s/2,c.z+h+s/2],[c.x-h-s/2,c.z-h,c.x-h+s/2,c.z+h],[c.x+h-s/2,c.z-h,c.x+h+s/2,c.z+h]].forEach(([x0,z0,x1,z1])=>Z.gates3.push({x0,z0,x1,z1,kind:c.kind}));
    const v=[]; const y0=Z.h?Z.h(c.x,c.z):0; const n=c.kind==='hurdle'?3:9;
    for(let i=0;i<=n;i++){ const y=y0+.05+H*i/n; for(const [ax,az,bx,bz] of [[-h,-h,h,-h],[h,-h,h,h],[h,h,-h,h],[-h,h,-h,-h]]) v.push(c.x+ax,y,c.z+az,c.x+bx,y,c.z+bz); }
    for(let i=-h;i<=h+.01;i+=c.kind==='hurdle'?1.3:.65) for(const [ax,az] of [[i,-h],[i,h],[-h,i],[h,i]]) v.push(c.x+ax,y0,c.z+az,c.x+ax,y0+H,c.z+az);
    const m=segs(v,latMat({color:c.kind==='hurdle'?P.GD:P.DG,intensity:c.kind==='hurdle'?1.2:.9,wobble:c.kind==='firewall'?.04:0})); Z.group.add(m); c.mesh=m;
    const core=segs([c.x-.4,y0+.4,c.z,c.x+.4,y0+.4,c.z, c.x,y0+.4,c.z-.4,c.x,y0+.4,c.z+.4, c.x,y0,c.z,c.x,y0+.9,c.z],latMat({color:P.BONE,intensity:1.3})); Z.group.add(core); c.core=core; });
  G.extraInteract=()=>{ const L=[]; CACHES.forEach(c=>{ if(c.zone!==G.zoneId||G.isFlag(c.id)) return; L.push({x:c.x,z:c.z,r:1.6,label:'open  '+c.label,col:P.GD,act:()=>{ G.flag(c.id); G.bits+=c.bits; if(c.item) G.give(c.item[0],c.item[1]); c.core.visible=false; G.toast(`> ${c.label}: +${c.bits} bits`+(c.item?'  + '+c.item[0]:''),P.GD); G.sfx('loot'); }}); }); return L; };
  G.onZone3=()=>CACHES.forEach(c=>{ if(c.core) c.core.visible=!G.isFlag(c.id); });
  G.startTut=()=>{ T.on=true; T.i=0; T.dist=0; T.cam=0; T.ran=0; T.saved=false; T.lp=null; G.flag('tut_on'); };
  G.skipTut=()=>{ T.on=false; G.flag('tut_done'); };
  G.updateTut=dt=>{ if(!T.on) return; const p=api.player().group.position; if(T.lp){ const d=Math.hypot(p.x-T.lp.x,p.z-T.lp.z); if(d<2){ T.dist+=d; if(IN.held.has('run')&&d>0) T.ran+=dt; } } T.lp=p.clone();
    const dy=Math.abs(G.cam.yaw-T.ly); if(dy<1) T.cam+=dy; T.ly=G.cam.yaw;
    while(T.i<TUT.length&&TUT[T.i].done(G)){ T.i++; G.sfx('confirm'); if(T.i<TUT.length) G.toast('> tutorial: '+TUT[T.i].t.split('.')[0],P.GD); }
    if(T.i>=TUT.length){ T.on=false; G.flag('tut_done'); G.toast('> tutorial complete. crew check passed.',P.GD); G.ach&&G.ach('tutorial'); } };
  G.drawTut=()=>{ if(!T.on) return; const s=TUT[T.i]; if(!s) return; const dev=IN.stick.pad?2:(IN.touch?1:0); const k=2; const n=G.active().length; const y=12+n*34+6;
    const lines=UI.wrap(s.t,300,1); const w=320, h=34+lines.length*14+(s.hint[dev]?16:0);
    UI.box(12,y,w,h,P.DG,'rgba(6,5,4,.82)'); UI.text(`> tutorial ${T.i+1}/${TUT.length}`,22,y+6,P.GD); UI.text('[menu > system] skip',w+2,y+6,P.DDG,1,'right');
    lines.forEach((l,i)=>UI.text(l,22,y+22+i*14,P.BONE)); if(s.hint[dev]) UI.text('[ '+s.hint[dev]+' ]',22,y+24+lines.length*14,P.DG); };
}
