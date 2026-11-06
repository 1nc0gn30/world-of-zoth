// Transient lattice FX: particle pool (braille-dot trails, bursts, dissolves), beams, expanding rings, floating numbers.
import * as THREE from 'three';
import { latMat } from './render.js';
import { segs, ring, wireOcta, wireIco, boxEdges, truss, sphereCloud, rng } from './geo.js';
const MAXP=3000;
export const FX={ items:[], nums:[] };
let pgeo, ppos, pcol, pdata;
export function initFX(scene){
  pgeo=new THREE.BufferGeometry(); ppos=new Float32Array(MAXP*3); pcol=new Float32Array(MAXP*3); pdata=[];
  for(let i=0;i<MAXP;i++){ ppos[i*3+1]=-999; pdata.push({life:0}); }
  pgeo.setAttribute('position',new THREE.BufferAttribute(ppos,3)); pgeo.setAttribute('acol',new THREE.BufferAttribute(pcol,3));
  const p=new THREE.Points(pgeo, latMat({points:true, vcolor:true, size:2.2, intensity:1.4, fogNear:30, fogFar:120})); p.frustumCulled=false; p.renderOrder=3; scene.add(p);
}
let pi=0; const tmpC=new THREE.Color();
export function particle(x,y,z,vx,vy,vz,life,col,drag=0.9,grav=0,snap=0){
  const i=pi=(pi+1)%MAXP, d=pdata[i]; tmpC.set(col); Object.assign(d,{x,y,z,vx,vy,vz,life,max:life,r:tmpC.r,g:tmpC.g,b:tmpC.b,drag,grav,snap}); }
export function burst(p,col,n=30,sp=4,life=.8,grav=0){ for(let i=0;i<n;i++){ const u=Math.random()*2-1, t=Math.random()*Math.PI*2, s=Math.sqrt(1-u*u), v=sp*(.3+Math.random()*.7); particle(p.x,p.y,p.z,s*Math.cos(t)*v,u*v,s*Math.sin(t)*v,life*(.6+Math.random()*.6),col,.92,grav,0); } }
// pixel dissipation: points stream sideways and snap to a 2px-ish lattice
export function dissolve(p,col,n=80,h=1.8){ for(let i=0;i<n;i++) particle(p.x+(Math.random()-.5)*.8,p.y+Math.random()*h,p.z+(Math.random()-.5)*.8,(Math.random()+.4)*3,Math.random()*.6,(Math.random()-.5)*1.5,1.2+Math.random(),col,.96,0,.12); }
export function updateFX(dt){
  for(let i=0;i<MAXP;i++){ const d=pdata[i]; if(d.life<=0){ ppos[i*3+1]=-999; continue; } d.life-=dt; const k=Math.pow(d.drag,dt*60); d.vx*=k; d.vy=d.vy*k-d.grav*dt; d.vz*=k; d.x+=d.vx*dt; d.y+=d.vy*dt; d.z+=d.vz*dt;
    let x=d.x,y=d.y,z=d.z; if(d.snap){ x=Math.round(x/d.snap)*d.snap; y=Math.round(y/d.snap)*d.snap; z=Math.round(z/d.snap)*d.snap; }
    ppos[i*3]=x; ppos[i*3+1]=y; ppos[i*3+2]=z; const f=Math.max(0,d.life/d.max); pcol[i*3]=d.r*f; pcol[i*3+1]=d.g*f; pcol[i*3+2]=d.b*f; }
  pgeo.attributes.position.needsUpdate=true; pgeo.attributes.acol.needsUpdate=true;
  for(let i=FX.items.length-1;i>=0;i--){ const it=FX.items[i]; it.t+=dt; it.up&&it.up(it.t/it.d, it); if(it.t>=it.d){ it.obj.parent&&it.obj.parent.remove(it.obj); it.obj.traverse(o=>o.geometry&&o.geometry.dispose()); FX.items.splice(i,1); } }
  for(let i=FX.nums.length-1;i>=0;i--){ const n=FX.nums[i]; n.t+=dt; if(n.t>1.1) FX.nums.splice(i,1); }
}
export function beam(scene,a,b,col,d=.35,w=1){ const arr=[]; const n=14; for(let i=0;i<n;i++){ const t0=i/n,t1=(i+1)/n; const j=()=> (Math.random()-.5)*.25*w;
    arr.push(a.x+(b.x-a.x)*t0+j(),a.y+(b.y-a.y)*t0+j(),a.z+(b.z-a.z)*t0+j(), a.x+(b.x-a.x)*t1+j(),a.y+(b.y-a.y)*t1+j(),a.z+(b.z-a.z)*t1+j()); }
  const m=latMat({color:col,intensity:2.2,fogNear:40,fogFar:150}); const o=segs(arr,m); scene.add(o); FX.items.push({obj:o,t:0,d,up:(k)=>m.uniforms.intensity.value=2.2*(1-k)}); }
export function ringFx(scene,p,col,r=3,d=.6,ax='y',dash=1){ const arr=[]; ring(arr,0,0,0,1,48,dash,ax); const m=latMat({color:col,intensity:2,fogNear:40,fogFar:150}); const o=segs(arr,m); o.position.copy(p); scene.add(o);
  FX.items.push({obj:o,t:0,d,up:(k)=>{ const s=.2+k*r; o.scale.set(s,s,s); m.uniforms.intensity.value=2*(1-k); }}); }
export function pillar(scene,p,col,h=12,d=.7){ const arr=[]; for(let i=0;i<6;i++){ const a=i/6*Math.PI*2; arr.push(p.x+Math.cos(a)*.3,p.y,p.z+Math.sin(a)*.3,p.x+Math.cos(a)*.1,p.y+h,p.z+Math.sin(a)*.1);} const m=latMat({color:col,intensity:2.4,fogNear:40,fogFar:150}); const o=segs(arr,m); scene.add(o); FX.items.push({obj:o,t:0,d,up:k=>m.uniforms.intensity.value=2.4*(1-k)}); }
export function num(p,txt,col){ FX.nums.push({p:p.clone(),txt:String(txt),col,t:0}); }
// ---------- enemy meshes (red = hostile system) ----------
const RED='#dc3228', RED2='#8c1e14';
export function enemyMesh(kind){
  const g=new THREE.Group(); const mats=[]; const L=(arr,col,int=1.4)=>{ const m=latMat({color:col,intensity:int,fogNear:20,fogFar:90}); mats.push(m); const o=segs(arr,m); g.add(o); return o; };
  const P=(arr,col,int=1.6,size=2)=>{ const m=latMat({color:col,points:true,size,intensity:int,fogNear:20,fogFar:90}); mats.push(m); const o=new THREE.Points(new THREE.BufferGeometry().setAttribute('position',new THREE.Float32BufferAttribute(arr,3)),m); o.frustumCulled=false; o.renderOrder=2; g.add(o); return o; };
  let spin=null, h=1.4;
  if(kind==='drone'){ const a=[]; wireOcta(a,.45); spin=L(a,RED,1.6); const c=[]; for(let i=0;i<8;i++){ const t=i/8*Math.PI*2; c.push(0,0,0,Math.cos(t)*.9,-1.3,Math.sin(t)*.9);} ring(c,0,-1.3,0,.9,24,2); L(c,RED2,1); P([0,0,0],'#ffe6c8',2,4); g.children.forEach(o=>o.position.y=1.6); h=1.6; }
  if(kind==='sentinel'||kind==='rusted'){ const s=kind==='rusted'?1.7:1; const a=[]; boxEdges(a,0,-.6*s,0,1.2*s,1.2*s,1.2*s); L(a,RED,1.3); const b=[]; boxEdges(b,0,-.35*s,0,.7*s,.7*s,.7*s); spin=L(b,kind==='rusted'?'#8c1e14':RED,1.8);
    const c=[]; sphereCloud(c,0,0,0,.25*s,60,rng(2)); P(c,'#ffe6c8',1.4,2); g.children.forEach(o=>o.position.y=1.2*s); h=1.3*s+.6; }
  if(kind==='node'){ const a=[]; wireIco(a,.45); spin=L(a,RED,1.6); g.children.forEach(o=>o.position.y=1.2); h=1.2; }
  if(kind==='relay4'){ const a=[]; truss(a,0,0,6,1.6,.6,6,6); L(a,RED,1.1); const c=[]; sphereCloud(c,0,7.5,0,1.8,700,rng(5)); spin=P(c,RED,1.5,2.2); const r=[]; ring(r,0,7.5,0,2.8,64,2); ring(r,0,7.5,0,3.6,64,3); const rr=L(r,RED2,1.6); g.userData.rings=rr; P([0,7.5,0],'#ffe6c8',2.4,8); h=7.5; }
  if(kind==='worm'){ const a=[]; for(let i=0;i<7;i++) ring(a,i*.35-1,1.1+Math.sin(i)*.2,0,.38-i*.03,16,1,'x'); spin=L(a,RED,1.5); h=1.3; }
  if(kind==='mite'){ const a=[]; for(let i=0;i<5;i++){ const t=i/5*Math.PI*2; boxEdges(a,Math.cos(t)*.35,.5,Math.sin(t)*.35,.25,.25,.25); } spin=L(a,RED,1.7); P([0,.62,0],'#ffe6c8',2,3); h=.8; }
  if(kind==='phase'){ const a=[]; boxEdges(a,0,0,0,1.4,.12,1.4); boxEdges(a,0,.6,0,1,1,1); spin=L(a,RED,1.4); const b=[]; ring(b,0,.06,0,1.2,24,2); L(b,RED2,1.2); h=1.4; }
  if(kind==='slag'||kind==='warden'){ const s=kind==='warden'?1.8:1; const a=[]; wireOcta(a,.6*s,0,.9*s,0); boxEdges(a,0,0,0,.9*s,.5*s,.9*s); spin=L(a,kind==='warden'?'#ff6a3a':RED,1.5); const c=[]; sphereCloud(c,0,.9*s,0,.3*s,80,rng(3)); P(c,'#ffd08a',1.6,2); h=1.6*s; }
  if(kind==='slime'){ const c=[]; sphereCloud(c,0,.8,0,.75,260,rng(4)); spin=P(c,RED,1.3,2); h=1.4; }
  if(kind==='eel'){ const a=[]; for(let i=0;i<10;i++){ const x=i*.3-1.4; a.push(x,1.3+Math.sin(i*.8)*.3,0,x+.3,1.3+Math.sin((i+1)*.8)*.3,0); a.push(x,1.3+Math.sin(i*.8)*.3+.18,0,x,1.3+Math.sin(i*.8)*.3-.18,0); } spin=L(a,RED,1.5); h=1.6; }
  if(kind==='gunship'){ const a=[]; wireOcta(a,.6,0,1.8,0); a.push(-1.4,1.8,0,1.4,1.8,0, 0,1.8,-1.1,0,1.8,1.1); ring(a,-1.4,1.8,0,.35,12,1); ring(a,1.4,1.8,0,.35,12,1); spin=L(a,RED,1.6); const c=[]; for(let i=0;i<6;i++){ const t=i/6*Math.PI*2; c.push(0,1.8,0,Math.cos(t)*1.4,0,Math.sin(t)*1.4); } L(c,RED2,.7); h=2.2; }
  if(kind==='cursor'){ const c=[]; for(let i=0;i<160;i++){ const u=Math.random(); if(u<.6) c.push(-.3+Math.random()*.5,.6+Math.random()*1.1,(Math.random()-.5)*.1); else c.push(.35+Math.random()*.6,.6,(Math.random()-.5)*.1); } spin=P(c,RED,1.8,2.2); h=1.8; }
  if(kind==='glass'){ const a=[]; truss(a,0,0,3.2,1.8,.25,4,6); spin=L(a,RED,1.3); const b=[]; truss(b,0,0,-3.2,1.8,.25,4,6); const bb=L(b,RED,1.3); bb.position.y=6.4; const c=[]; for(let i=0;i<260;i++){ const y=Math.random()*3; c.push((Math.random()-.5)*.6,y,(Math.random()-.5)*.6); } P(c,'#ffd08a',1.4,2); spin.position.y=3.2; h=6.6; }
  if(kind==='eye'){ const a=[]; ring(a,0,0,0,2.6,64,1,'z'); ring(a,0,0,0,1.6,48,2,'z'); for(let i=0;i<10;i++){ const t=i/10*Math.PI*2; a.push(Math.cos(t)*2.6,Math.sin(t)*2.6,0,Math.cos(t)*3.4,Math.sin(t)*3.4,0); } const e=L(a,RED,1.5); e.position.y=4.2; const c=[]; sphereCloud(c,0,4.2,0,.9,300,rng(9)); spin=P(c,'#ff8a70',1.8,2.4); const b=[]; for(let i=0;i<6;i++){ const t=i/6*Math.PI*2; b.push(Math.cos(t)*2.2,0,Math.sin(t)*2.2,Math.cos(t)*1.4,3,Math.sin(t)*1.4); } L(b,RED2,1); g.userData.rings=e; h=6.2; }
  if(kind==='blank'){ const c=[]; for(let i=0;i<900;i++){ const u=Math.random(); if(u<.55) c.push(-2.2+Math.random()*2,1+Math.random()*5,(Math.random()-.5)*.4); else c.push(.4+Math.random()*3.2,1+Math.random()*.6,(Math.random()-.5)*.4); } spin=P(c,RED,1.7,2.6); const a=[]; ring(a,0,3.5,0,4.4,72,2,'z'); ring(a,0,3.5,0,5.2,72,3,'z'); const rr=L(a,RED2,1.4); g.userData.rings=rr; h=6.5; g.userData.flat=true; }
  g.userData={...g.userData, mats, spin, h, kind};
  return g;
}
export function animEnemy(g,t,flash=0){ const u=g.userData; if(u.spin&&!u.flat){ u.spin.rotation.y=t*1.6; u.spin.rotation.x=t*.7; } if(u.flat&&u.spin){ u.spin.visible=Math.floor(t*1.6)%2===0||flash>0; } if(u.rings){ u.rings.rotation.x=t*.6; u.rings.rotation.z=t*.4; }
  u.mats.forEach(m=>{ if(m.userData.base===undefined) m.userData.base=m.uniforms.intensity.value; m.uniforms.intensity.value=m.userData.base*(1+flash*3); }); }
