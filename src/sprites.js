// Pixel sprites as camera-facing (yaw-only) billboards inside the 3D lattice world.
import * as THREE from 'three';
import { IMG, SHEETS, AGENTS } from './assets.js';
import { spriteMat } from './render.js';
export const TEX={}, IMGS={};
export const AG={}; AGENTS.forEach(a=>AG[a.id]=a);
export function loadAll(){
  const names=Object.keys(IMG);
  return Promise.all(names.map(n=>new Promise(res=>{ const im=new Image(); im.onload=()=>{ IMGS[n]=im; const t=new THREE.Texture(im); t.magFilter=t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; t.colorSpace=THREE.NoColorSpace; t.needsUpdate=true; TEX[n]=t; res(); }; im.src=IMG[n]; })));
}
const PX=1/30;           // player sprite px -> world units
const APX=1/38;          // agent sprite px -> world units (96px frame, ~72px figure)
const geo=new THREE.PlaneGeometry(1,1); geo.translate(0,.5,0);
export class Billboard{
  constructor(kind){ // kind: 'me' | agent id | 'copy'
    this.kind=kind; this.group=new THREE.Group();
    this.mesh=new THREE.Mesh(geo, spriteMat(TEX[kind==='me'||kind==='copy'?'front':'ag_'+kind]));
    this.mesh.renderOrder=0; this.group.add(this.mesh);
    if(kind==='copy') this.mesh.material.uniforms.mode.value=1;
    this.t=Math.random()*5; this.anim='idle'; this.facing=0; this.moving=false; this.pose=null; this.setSheet(kind==='me'||kind==='copy'?'front':'idle',0);
  }
  setSheet(name,frame,flip=false){
    const u=this.mesh.material.uniforms;
    if(this.kind==='me'||this.kind==='copy'){
      if(['sleep','kneel','lie'].includes(name)){ const im=IMGS[name]; u.map.value=TEX[name]; u.rect.value.set(0,0,1,1); this.mesh.scale.set(im.width/138, im.height/138,1); this.mesh.position.y=name==='lie'?-0.05:0; u.flip.value=flip?1:0; return; }
      const sh=SHEETS[name]; u.map.value=TEX[name]; const n=sh.n; frame=((frame%n)+n)%n;
      u.rect.value.set(frame/n,0,1/n,1); this.mesh.scale.set(sh.w*PX, sh.h*PX,1); this.mesh.position.y=0;
    } else {
      const row=['idle','walk','work','ability','ultimate','meditate'].indexOf(name); frame=((frame%8)+8)%8;
      u.map.value=TEX['ag_'+this.kind]; u.rect.value.set(frame/8, 1-(row+1)/6, 1/8, 1/6);
      const a=AG[this.kind]; this.mesh.scale.set(96*APX,96*APX,1); this.mesh.position.y=-(95-a.foot)*APX;
    }
    u.flip.value=flip?1:0;
  }
  // camYaw: camera yaw; heading: movement yaw (world). Picks front/back/side walk for the player.
  update(dt, camYaw, camPos){
    this.t+=dt; const p=this.group.position;
    this.mesh.rotation.y=Math.atan2(camPos.x-p.x, camPos.z-p.z);
    if(this.kind==='me'||this.kind==='copy'){
      if(this.pose){ this.setSheet(this.pose,0); return; }
      // relative angle between facing and view direction
      const view=Math.atan2(p.x-camPos.x, p.z-camPos.z); let d=this.facing-view; d=Math.atan2(Math.sin(d),Math.cos(d));
      const fps=this.moving?(this.run?12:9):0, f=Math.floor(this.t*fps);
      if(Math.abs(d)<Math.PI*0.28) this.setSheet('back', this.moving?f:0);
      else if(Math.abs(d)>Math.PI*0.72) this.setSheet('front', this.moving?f:0);
      else this.setSheet(this.moving?'walk':'side', this.moving?f:0, d<0);
    } else {
      const st=this.anim, fps=st==='idle'?6:9; this.setSheet(st, Math.floor(this.t*fps), this.flip);
    }
  }
}
// tinted canvas cache for 2D UI portraits
const tintCache={};
export function frameCanvas(kind, state='idle', frame=0){
  const key=kind+state+frame; if(tintCache[key]) return tintCache[key];
  const c=document.createElement('canvas'), x=c.getContext('2d');
  if(kind==='me'||kind==='copy'){ const sh=SHEETS.front; c.width=sh.w; c.height=sh.h; x.drawImage(IMGS.front, sh.w*frame,0,sh.w,sh.h,0,0,sh.w,sh.h);
    if(kind==='copy'){ const d=x.getImageData(0,0,c.width,c.height); for(let i=0;i<d.data.length;i+=4){ const l=Math.max(d.data[i],d.data[i+1],d.data[i+2])/255; const r=l<.12?[13,3,3]:l<.35?[70,14,10]:l<.6?[140,30,20]:[220,50,40]; d.data[i]=r[0];d.data[i+1]=r[1];d.data[i+2]=r[2]; } x.putImageData(d,0,0); }
  } else { const row=['idle','walk','work','ability','ultimate','meditate'].indexOf(state); c.width=96; c.height=96; x.drawImage(IMGS['ag_'+kind], frame*96,row*96,96,96,0,0,96,96); }
  return tintCache[key]=c;
}
