// Act III-V lattice zones, each built from one episode technique:
// fiber (Hilbert curve, EP14 d2), clock (falling sand, EP14 d3), streets (Wave Function Collapse, EP14 d4),
// foundry (doom fire, EP08 S6), caves (physarum, EP08 S5), mirrors (kaleidoscope hall, EP12/EP13),
// deep (wave-equation water + boids, EP09), skyline (Mode-7 floor + Voronoi districts + 21 skybeams, EP14 d9),
// rooftop (secret: EP01/EP10 sunrise).
import * as THREE from 'three';
import { rng, segs, pts, grid, dotPlane, ring, truss, sphereCloud, wireOcta, boxEdges, building, latMat, solidMat } from './geo.js';
import { BLENDER_GEO } from './blender_geo.js';
import { U } from './render.js';
import { portal, groundPlane } from './world.js';
const GD='#f5b82e', DG='#8a6514', DDG='#3c2c0a', RED='#dc3228', BONE='#ece4d2';

// ---- a texture-driven lattice plane (CA layers). value in R -> ramp(lo..hi) ; dots=true renders a dot matrix ----
function texPlane(tex,{w,h,n,lo=DDG,mid=DG,hi=GD,top=BONE,dots=true,alpha=.5}){
  const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor, blendEquationAlpha:THREE.MaxEquation, blendSrcAlpha:THREE.OneFactor, blendDstAlpha:THREE.OneFactor,
    uniforms:{ tex:{value:tex}, lo:{value:new THREE.Color(lo)}, mid:{value:new THREE.Color(mid)}, hi:{value:new THREE.Color(hi)}, top:{value:new THREE.Color(top)}, n:{value:n}, dots:{value:dots?1:0}, al:{value:alpha} },
    vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D tex; uniform vec3 lo,mid,hi,top; uniform vec2 n; uniform float dots, al; varying vec2 vUv;
      void main(){ vec2 c=vUv*n; vec2 f=fract(c)-.5; float v=texture2D(tex,(floor(c)+.5)/n).r; if(v<.02) discard;
        vec3 col= v<.33? mix(vec3(0.),lo,v*3.) : v<.66? mix(lo,mid,(v-.33)*3.) : v<.9? mix(mid,hi,(v-.66)*4.2) : mix(hi,top,(v-.9)*10.);
        float d= dots>.5? step(length(f),.36) : 1.; gl_FragColor=vec4(col*d,al);} ` });
  const p=new THREE.Mesh(new THREE.PlaneGeometry(w,h),m); p.renderOrder=2; return p;
}
function dataTex(nx,ny){ const d=new Uint8Array(nx*ny*4); const t=new THREE.DataTexture(d,nx,ny); t.magFilter=t.minFilter=THREE.NearestFilter; return t; }
function base(id,{size=50,step=2.5,h=()=>0,gridCol=DDG,dotCol=DG,fogFar=50,seed=1,glitch=0}={}){
  const g=new THREE.Group(), R=rng(seed), col=[], anim=[];
  g.add(grid(-size,size,-size,size,step,h,latMat({color:gridCol,intensity:1.7,fogNear:5,fogFar,glitch}),2));
  groundPlane(g,size*4,h,step);
  g.add(dotPlane(-size,size,-size,size,step,h,latMat({color:dotCol,points:true,size:1.4,intensity:1,fogNear:5,fogFar:fogFar-4,glitch})));
  return {g,R,col,anim,h};
}
function hilbert(order){ const n=1<<order, out=[]; for(let d=0;d<n*n;d++){ let x=0,y=0,t=d; for(let s=1;s<n;s*=2){ const rx=1&(t/2), ry=1&(t^rx); if(ry===0){ if(rx===1){ x=s-1-x; y=s-1-y; } [x,y]=[y,x]; } x+=s*rx; y+=s*ry; t=Math.floor(t/4); } out.push([x,y]); } return out; }
// red copy graffiti tag (easter egg collectible): a little red braille block
export function tagMesh(){ const a=[]; for(let i=0;i<8;i++) a.push((i%4)*.22-.33,.6+Math.floor(i/4)*.3,0); return pts(a,latMat({color:RED,points:true,size:2.2,intensity:1.6,twinkle:.6,fogFar:40})); }

export function buildZones2(Z){
  // ===================== FIBER TUNNELS: Hilbert space-filling curve =====================
  { const B=base('fiber',{seed:31,fogFar:46,gridCol:'#2a1f07'}); const {g,col,anim,h}=B;
    const H=hilbert(4), S=6, off=-45; const path=H.map(([x,y])=>[off+x*S,off+y*S]);
    const line=[], arch=[]; for(let i=1;i<path.length;i++){ const [x0,z0]=path[i-1],[x1,z1]=path[i]; line.push(x0,.08,z0,x1,.08,z1, x0,2.6,z0,x1,2.6,z1); }
    // tube arches every segment (half rings across the path)
    for(let i=0;i<path.length;i+=1){ const [x,z]=path[i]; const [nx,nz]=path[Math.min(path.length-1,i+1)]; const ang=Math.atan2(nz-z,nx-x)+Math.PI/2;
      for(let k=0;k<10;k++){ const a0=k/10*Math.PI, a1=(k+1)/10*Math.PI; arch.push(x+Math.cos(ang)*Math.cos(a0)*1.6,Math.sin(a0)*2.6,z+Math.sin(ang)*Math.cos(a0)*1.6, x+Math.cos(ang)*Math.cos(a1)*1.6,Math.sin(a1)*2.6,z+Math.sin(ang)*Math.cos(a1)*1.6); } }
    const redL=segs(line,latMat({color:RED,intensity:.9,fogFar:46})), goldL=segs(line,latMat({color:GD,intensity:1.2,fogFar:46})); goldL.visible=false; g.add(redL,goldL);
    g.add(segs(arch,latMat({color:DG,intensity:1.1,fogNear:4,fogFar:40})));
    // packets running along the curve
    const pk=[]; for(let i=0;i<60;i++) pk.push(0,1.2,0); const pp=pts(pk,latMat({color:BONE,points:true,size:2.4,intensity:1.6,fogFar:44})); g.add(pp);
    anim.push(t=>{ const a=pp.geometry.attributes.position.array; for(let i=0;i<60;i++){ const u=((t*.04+i/60)%1)*(path.length-1), k=Math.floor(u), f=u-k; const [x0,z0]=path[k],[x1,z1]=path[k+1]; a[i*3]=x0+(x1-x0)*f; a[i*3+2]=z0+(z1-z0)*f; a[i*3+1]=1.3+Math.sin(t*3+i)*.2; } pp.geometry.attributes.position.needsUpdate=true; });
    // three junction boxes (quest objectives)
    const junc={}; [['j1',-33,-33],['j2',27,-21],['j3',-9,33]].forEach(([id,x,z])=>{ const a=[]; boxEdges(a,x,0,z,1.6,2.2,1.6); const m=segs(a,latMat({color:RED,intensity:1.4,fogFar:60})); g.add(m); const a2=[]; ring(a2,x,2.6,z,1.2,24,2); const r=segs(a2,latMat({color:RED,intensity:1.6,fogFar:60})); g.add(r); anim.push(t=>r.rotation.y=t); col.push({c:[x,z,1]}); junc[id]={x,z,m,r}; });
    portal(g,0,49,0); portal(g,0,-49,0);
    Z.fiber={ id:'fiber', name:'fiber tunnels', sub:'hilbert curve · kraken\'s line', group:g, col, bounds:[-48,-48,48,48], h, anim, music:'fiber', lvl:9,
      sky:{rain:.25,rainCol:'#3c2c0a',hex:1,stars:.6}, spawn:{x:0,z:44,yaw:Math.PI},
      portals:[{x:0,z:49,r:3,to:'hub',sx:0,sz:-44,syaw:0,label:'relit city'},{x:0,z:-49,r:3,to:'clock',sx:0,sz:42,syaw:Math.PI,label:'clocktower'}],
      objs:{junc, gold:()=>{ redL.visible=false; goldL.visible=true; }}, tag:[38,40] };
  }
  // ===================== SAND CLOCKTOWER: falling-sand automaton =====================
  { const h=(x,z)=>{ const r=Math.hypot(x,z); return r<10?0:Math.min(6,Math.floor((r-10)/7))*.9; };
    const B=base('clock',{seed:41,h,gridCol:DDG,fogFar:56}); const {g,col,anim}=B;
    const tw=[]; truss(tw,0,0,30,4.2,2.6,12,4); g.add(segs(tw,latMat({color:DG,intensity:1.2,fogFar:110})));
    const face=[]; ring(face,0,0,0,4,64,1,'z'); ring(face,0,0,0,3.4,12,1,'z'); for(let i=0;i<12;i++){ const a=i/12*Math.PI*2; face.push(Math.cos(a)*3.4,Math.sin(a)*3.4,0,Math.cos(a)*3.9,Math.sin(a)*3.9,0); }
    const fm=segs(face,latMat({color:GD,intensity:1.4,fogFar:120})); fm.position.set(0,24,4.4); g.add(fm);
    const hands=new THREE.Group(); const hh=segs([0,0,0,0,2.2,0],latMat({color:BONE,intensity:1.8,fogFar:120})), mh=segs([0,0,0,0,3.3,0],latMat({color:GD,intensity:1.8,fogFar:120})); hands.add(hh,mh); hands.position.set(0,24,4.5); g.add(hands);
    const clockT={m:6*60+12}; anim.push(t=>{ const m=clockT.run? (6*60+12+t*.5): clockT.m; hh.rotation.z=-((m/60)%12)/12*Math.PI*2; mh.rotation.z=-(m%60)/60*Math.PI*2; });
    col.push({c:[0,0,4.6]});
    // falling sand on a vertical wall behind the tower (hourglass pour)
    const NX=64, NY=48, sand=new Uint8Array(NX*NY), tex=dataTex(NX,NY); const R=rng(5);
    const wall=texPlane(tex,{w:48,h:36,n:new THREE.Vector2(NX,NY),dots:true}); wall.position.set(0,18,-30); g.add(wall);
    let acc=0; anim.push(t=>{ acc++; if(acc%2) return; for(let k=0;k<3;k++){ const x=NX/2+Math.floor((R()-.5)*3); sand[(NY-1)*NX+x]=1; }
      for(let y=1;y<NY;y++) for(let x0=0;x0<NX;x0++){ const x=(y&1)?x0:NX-1-x0; const i=y*NX+x; if(!sand[i]) continue; const b=(y-1)*NX+x; if(!sand[b]){ sand[b]=1; sand[i]=0; continue; } const d=R()<.5?-1:1; const x2=x+d; if(x2>=0&&x2<NX&&!sand[(y-1)*NX+x2]){ sand[(y-1)*NX+x2]=1; sand[i]=0; } }
      let filled=0; for(let x=0;x<NX;x++) filled+=sand[(NY-8)*NX+x]; if(filled>NX*.6) for(let i=0;i<NX*NY*.5;i++) sand[i]=0;
      const d=tex.image.data; for(let i=0;i<NX*NY;i++){ d[i*4]=sand[i]?(150+((i*37)%100)):0; d[i*4+3]=255; } tex.needsUpdate=true; });
    // sand dunes: stepped terrace rings
    const ter=[]; for(let k=1;k<7;k++) ring(ter,0,k*.9+.05,0,10+k*7,96,2); g.add(segs(ter,latMat({color:DG,intensity:1,fogFar:60})));
    const sg=[]; truss(sg,0,0,4,1.6,.3,4,6); truss(sg,0,0,-4,1.6,.3,4,6); const glass=segs(sg,latMat({color:RED,intensity:1.4,fogFar:80})); glass.position.set(0,30.5+4,0); g.add(glass); anim.push(t=>glass.rotation.y=t*.4);
    const esc=segs(BLENDER_GEO.clock_escapement,latMat({color:GD,intensity:1.35,fogFar:100})); esc.position.set(0,15,0); g.add(esc); anim.push(t=>{ esc.rotation.z=Math.floor(t*2)*0.1309; esc.rotation.y=t*.15; });
    portal(g,0,46,0).position.y=h(0,46); const dp=portal(g,-44,0,Math.PI/2); dp.position.y=h(-44,0);
    Z.clock={ id:'clock', name:'sand clocktower', sub:'falling sand · 06:12', group:g, col, bounds:[-48,-48,48,48], h, anim, music:'clock', lvl:11,
      sky:{rain:.05,rainCol:'#3c2c0a',hex:0,stars:1.6}, spawn:{x:0,z:42,yaw:Math.PI},
      portals:[{x:0,z:46,r:3,to:'fiber',sx:0,sz:-44,syaw:0,label:'fiber tunnels'},{x:-44,z:0,r:3,to:'deep',sx:40,sz:0,syaw:-Math.PI/2,label:'deep water',lock:'deep_open'}],
      objs:{clockT, glass}, tag:[-30,-36] };
  }
  // ===================== COLLAPSE STREETS: Wave Function Collapse tiles =====================
  { const B=base('streets',{seed:51,fogFar:52}); const {g,col,anim,h}=B; const R=rng(52);
    // tiles: 0 empty, 1 road NS, 2 road EW, 3 cross, 4 building. adjacency: roads must connect.
    const N=12, C=8, off=-N*C/2; const conn={0:[0,0,0,0],1:[1,0,1,0],2:[0,1,0,1],3:[1,1,1,1],4:[0,0,0,0]}; // n e s w
    const cells=[]; for(let i=0;i<N*N;i++) cells.push([0,1,2,3,4]);
    const idx=(x,y)=>y*N+x; // simple WFC: lowest entropy, propagate edge compat
    const ok=(a,b,dir)=>conn[a][dir]===conn[b][(dir+2)%4];
    const fix=(x,y,v)=>{ cells[idx(x,y)]=[v]; };
    for(let i=0;i<N;i++){ fix(6,i,i===6?3:1); fix(i,6,i===6?3:2); }
    function propagate(){ let ch=true; while(ch){ ch=false; for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const c=cells[idx(x,y)]; const nb=[[x,y-1,0],[x+1,y,1],[x,y+1,2],[x-1,y,3]];
      const keep=c.filter(v=>nb.every(([nx,ny,d])=> nx<0||ny<0||nx>=N||ny>=N || cells[idx(nx,ny)].some(u=>ok(v,u,d)) )); if(keep.length<c.length&&keep.length){ cells[idx(x,y)]=keep; ch=true; } } } }
    propagate(); for(let it=0;it<N*N;it++){ let best=-1,be=9; for(let i=0;i<N*N;i++){ const e=cells[i].length; if(e>1&&e<be){ be=e; best=i; } } if(best<0) break; const c=cells[best]; const w=c.map(v=>v===4?3:v===0?2:1); let r=R()*w.reduce((a,b)=>a+b,0),pick=c[0]; for(let k=0;k<c.length;k++){ r-=w[k]; if(r<=0){ pick=c[k]; break; } } cells[best]=[pick]; propagate(); }
    const mats={ edge:latMat({color:GD,intensity:.75,fogNear:8,fogFar:60}), band:latMat({color:DG,intensity:.9,fogFar:60}), win:latMat({color:GD,points:true,size:1.4,twinkle:.6,intensity:1.2,fogFar:70}), solid:solidMat('#0b0906') };
    const road=[]; const sup={}; const supIds=[['c1',2,2],['c2',9,3],['c3',3,9]];
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ const v=cells[idx(x,y)][0], cx=off+x*C+C/2, cz=off+y*C+C/2; if(supIds.some(s=>s[1]===x&&s[2]===y)) continue;
      if(v===1||v===3){ road.push(cx-1.4,.03,cz-C/2,cx-1.4,.03,cz+C/2, cx+1.4,.03,cz-C/2,cx+1.4,.03,cz+C/2); }
      if(v===2||v===3){ road.push(cx-C/2,.03,cz-1.4,cx+C/2,.03,cz-1.4, cx-C/2,.03,cz+1.4,cx+C/2,.03,cz+1.4); }
      if(v===4 && Math.hypot(cx,cz)>9 && !(Math.abs(cx)<6||Math.abs(cz)<6)){ const w=3+R()*3, hh=3+R()*10; building(g,cx,cz,w,w,hh,R,mats); col.push({box:[cx-w/2,cz-w/2,cx+w/2,cz+w/2]}); } }
    g.add(segs(road,latMat({color:GD,intensity:.8,fogFar:50})));
    // superposed cells: every tile option overlapped and flickering (quest objective)
    supIds.forEach(([id,x,y])=>{ const cx=off+x*C+C/2, cz=off+y*C+C/2; const grp=new THREE.Group(); const opts=[];
      for(let k=0;k<4;k++){ const a=[]; if(k===0) boxEdges(a,0,0,0,4,6,4); if(k===1) a.push(-1.4,.05,-4,-1.4,.05,4,1.4,.05,-4,1.4,.05,4); if(k===2) a.push(-4,.05,-1.4,4,.05,-1.4,-4,.05,1.4,4,.05,1.4); if(k===3) boxEdges(a,0,0,0,2.5,10,2.5); const m=segs(a,latMat({color:k%2?GD:BONE,intensity:1.3,fogFar:60})); grp.add(m); opts.push(m); }
      grp.position.set(cx,0,cz); g.add(grp); anim.push(t=>{ if(grp.userData.solved){ opts.forEach((o,i)=>o.visible=i===1); return; } const f=Math.floor(t*9+x*3)%4; opts.forEach((o,i)=>o.visible=(i===f)||Math.random()<.25); }); sup[id]={x:cx,z:cz,grp}; });
    portal(g,0,-47,0); portal(g,0,47,0);
    Z.streets={ id:'streets', name:'collapse streets', sub:'wave function collapse · athena', group:g, col, bounds:[-48,-48,48,48], h, anim, music:'streets', lvl:14,
      sky:{rain:.5,rainCol:'#5a420e',hex:0,stars:1}, spawn:{x:0,z:-43,yaw:0},
      portals:[{x:0,z:-47,r:3,to:'hub',sx:0,sz:44,syaw:Math.PI,label:'relit city'},{x:0,z:47,r:3,to:'foundry',sx:0,sz:-42,syaw:0,label:'the foundry'}],
      objs:{sup}, tag:[44,-20] };
  }
  // ===================== DOOM-FIRE FOUNDRY =====================
  { const B=base('foundry',{seed:61,fogFar:50,gridCol:'#2c1d06'}); const {g,col,anim,h}=B;
    const FX=80, FY=40; const fire=new Uint8Array(FX*FY), tex=dataTex(FX,FY); const R=rng(7); const stoke={v:1};
    for(let x=0;x<FX;x++) fire[x]=36;
    anim.push(()=>{ for(let x=0;x<FX;x++) fire[x]=Math.round(36*stoke.v); for(let y=1;y<FY;y++) for(let x=0;x<FX;x++){ const src=(y-1)*FX+x; const r=Math.floor(R()*3); const dst=y*FX+Math.min(FX-1,Math.max(0,x-r+1)); fire[dst]=Math.max(0,fire[src]-r); }
      const d=tex.image.data; for(let i=0;i<FX*FY;i++){ d[i*4]=Math.min(255,fire[i]*7); d[i*4+3]=255; } tex.needsUpdate=true; });
    [[0,-30,0],[-30,0,Math.PI/2],[30,0,-Math.PI/2]].forEach(([x,z,ry])=>{ const p=texPlane(tex,{w:36,h:18,n:new THREE.Vector2(FX,FY),dots:false}); p.position.set(x,9,z); p.rotation.y=ry; g.add(p);
      const fr=[]; boxEdges(fr,0,0,0,37,19,1); const m=segs(fr,latMat({color:DG,intensity:1.2,fogFar:70})); m.position.set(x,-.5,z); m.rotation.y=ry; g.add(m); });
    // grates and anvils
    const gr=[]; for(let x=-20;x<=20;x+=2) gr.push(x,.05,-20,x,.05,20); g.add(segs(gr,latMat({color:DDG,intensity:1.4,fogFar:50})));
    const anv={}; [['w1',-16,-14],['w2',16,-14],['w3',0,16]].forEach(([id,x,z])=>{ const a=[]; boxEdges(a,x,0,z,2.2,1.2,1.2); boxEdges(a,x,1.2,z,3,.5,1.4); g.add(segs(a,latMat({color:GD,intensity:1.3,fogFar:60}))); col.push({c:[x,z,1.3]}); anv[id]={x,z}; });
    const em=[]; for(let i=0;i<200;i++) em.push((R()-.5)*90,R()*14,(R()-.5)*90); const ep=pts(em,latMat({color:GD,points:true,size:1.8,twinkle:1,intensity:1.6,fogFar:50})); g.add(ep); anim.push(t=>{ ep.position.y=(t*1.5)%6; });
    portal(g,0,-46,0);
    Z.foundry={ id:'foundry', name:'doom-fire foundry', sub:'ignis\'s forge', group:g, col, bounds:[-46,-46,46,46], h, anim, music:'foundry', lvl:16,
      sky:{rain:0,rainCol:'#3c2c0a',hex:0,stars:.3}, spawn:{x:0,z:-42,yaw:0},
      portals:[{x:0,z:-46,r:3,to:'streets',sx:0,sz:43,syaw:Math.PI,label:'collapse streets'}], objs:{anv,stoke}, tag:[40,36] };
  }
  // ===================== PHYSARUM CAVES =====================
  { const h=(x,z)=>.6*Math.sin(x*.12)*Math.cos(z*.1)+Math.max(0,Math.hypot(x,z)-38)*.5;
    const B=base('caves',{seed:71,h,fogFar:42,gridCol:'#251a06'}); const {g,col,anim}=B; const R=rng(72);
    const N=96, trail=new Float32Array(N*N), tex=dataTex(N,N); const ag=[]; for(let i=0;i<1400;i++) ag.push({x:N/2+(R()-.5)*20,y:N/2+(R()-.5)*20,a:R()*6.28});
    const floor=texPlane(tex,{w:92,h:92,n:new THREE.Vector2(N,N),lo:'#5a120c',mid:'#8c1e14',hi:RED,top:'#ff8a70',dots:true}); floor.rotation.x=-Math.PI/2; floor.position.y=.08; g.add(floor);
    const at=(x,y)=>trail[((Math.floor(y)+N)%N)*N+((Math.floor(x)+N)%N)];
    let k=0; anim.push(()=>{ k++; if(k%2) return; for(const p of ag){ const s=4, ra=.5; const f=at(p.x+Math.cos(p.a)*s,p.y+Math.sin(p.a)*s), l=at(p.x+Math.cos(p.a-ra)*s,p.y+Math.sin(p.a-ra)*s), r=at(p.x+Math.cos(p.a+ra)*s,p.y+Math.sin(p.a+ra)*s);
        if(l>f&&l>r) p.a-=.4; else if(r>f&&r>l) p.a+=.4; else if(f<l&&f<r) p.a+=(R()-.5)*.8; p.x=(p.x+Math.cos(p.a)+N)%N; p.y=(p.y+Math.sin(p.a)+N)%N; trail[Math.floor(p.y)*N+Math.floor(p.x)]+=1; }
      const d=tex.image.data; for(let i=0;i<N*N;i++){ trail[i]*=.9; d[i*4]=Math.min(255,trail[i]*40); d[i*4+3]=255; } tex.needsUpdate=true; });
    // jagged cave ceiling ribs and stalactites
    const rb=[]; for(let i=0;i<46;i++){ const a=i/46*Math.PI*2, r=40+R()*6; let px=Math.cos(a)*r, pz=Math.sin(a)*r; for(let j=0;j<6;j++){ const y0=j*2.4, y1=(j+1)*2.4; const nx=Math.cos(a)*(r-j*2.8)+(R()-.5), nz=Math.sin(a)*(r-j*2.8)+(R()-.5); rb.push(px,y0+h(px,pz),pz,nx,y1+h(px,pz),nz); px=nx; pz=nz; } }
    for(let i=0;i<60;i++){ const x=(R()-.5)*70, z=(R()-.5)*70; const l=1+R()*3.5; rb.push(x,14,z,x,14-l,z); }
    g.add(segs(rb,latMat({color:DG,intensity:1.2,fogNear:4,fogFar:44})));
    const nodes={}; [['n1',-24,-18],['n2',22,-24],['n3',18,22]].forEach(([id,x,z])=>{ const a=[]; sphereCloud(a,x,1.6,z,1.4,180,R); const m=pts(a,latMat({color:RED,points:true,size:2,intensity:1.3,fogFar:50})); g.add(m); anim.push(t=>{ const s=1+Math.sin(t*2.5+x)*.08; m.scale.set(1,s,1); }); col.push({c:[x,z,1.2]}); nodes[id]={x,z,m}; });
    portal(g,46,0,Math.PI/2).position.y=h(46,0); const mp=portal(g,-46,0,Math.PI/2); mp.position.y=h(-46,0);
    Z.caves={ id:'caves', name:'physarum caves', sub:'the slime trail · lycan', group:g, col, bounds:[-46,-46,46,46], h, anim, music:'caves', lvl:17,
      sky:{rain:0,rainCol:'#3c2c0a',hex:0,stars:.2}, spawn:{x:42,z:0,yaw:-Math.PI/2},
      portals:[{x:46,z:0,r:3,to:'forest',sx:-44,sz:0,syaw:Math.PI/2,label:'rest woods'},{x:-46,z:0,r:3,to:'mirrors',sx:0,sz:40,syaw:Math.PI,label:'hall of mirrors',lock:'mirror_key'}], objs:{nodes}, tag:[-10,38] };
  }
  // ===================== HALL OF MIRRORS (kaleidoscope) =====================
  { const B=base('mirrors',{seed:81,fogFar:52,gridCol:'#2a2008'}); const {g,col,anim,h}=B;
    // octagon of tall mirror frames
    const fr=[]; for(let k=0;k<8;k++){ const a=k/8*Math.PI*2, b=(k+1)/8*Math.PI*2, r=30; const x0=Math.cos(a)*r,z0=Math.sin(a)*r,x1=Math.cos(b)*r,z1=Math.sin(b)*r;
      for(let y=0;y<=16;y+=4) fr.push(x0,y,z0,x1,y,z1); fr.push(x0,0,z0,x0,16,z0); for(let i=1;i<6;i++){ const f=i/6; fr.push(x0+(x1-x0)*f,0,z0+(z1-z0)*f,x0+(x1-x0)*f,16,z0+(z1-z0)*f); } }
    g.add(segs(fr,latMat({color:DG,intensity:1.1,fogFar:80})));
    for(let k=0;k<8;k++){ const a=(k+.5)/8*Math.PI*2; col.push({c:[Math.cos(a)*31,Math.sin(a)*31,3]}); }
    // inner mirror pillars (the reflections stand by these)
    const ps=[]; const pil=[]; for(let k=0;k<6;k++){ const a=k/6*Math.PI*2+.3, r=15; const x=Math.cos(a)*r, z=Math.sin(a)*r; boxEdges(ps,x,0,z,.6,7,2.6); col.push({c:[x,z,1.2]}); pil.push([x,z]); }
    g.add(segs(ps,latMat({color:GD,intensity:1.2,fogFar:70})));
    // kaleidoscope rosette on the floor + Blender mirror obelisk centerpiece
    const ro=[]; for(let k=0;k<16;k++){ const a=k/16*Math.PI*2; ro.push(0,.05,0,Math.cos(a)*12,.05,Math.sin(a)*12); } for(let r=3;r<=12;r+=3) ring(ro,0,.05,0,r,64,2); const rose=segs(ro,latMat({color:GD,intensity:.9,fogFar:50})); g.add(rose); anim.push(t=>rose.rotation.y=t*.1);
    const mob=segs(BLENDER_GEO.mirror_obelisk,latMat({color:BONE,intensity:1.35,fogFar:70})); mob.position.set(0,0,-8); g.add(mob); anim.push(t=>{ mob.rotation.y=-t*.35; });
    portal(g,0,44,0);
    Z.mirrors={ id:'mirrors', name:'hall of mirrors', sub:'every clone has a seam', group:g, col, bounds:[-28,-28,28,44], h, anim, music:'mirrors', lvl:19,
      sky:{rain:0,rainCol:'#3c2c0a',hex:1,stars:.8}, spawn:{x:0,z:40,yaw:Math.PI},
      portals:[{x:0,z:44,r:3,to:'caves',sx:-42,sz:0,syaw:Math.PI/2,label:'physarum caves'}], objs:{pil}, tag:[-22,-14], mirrorsFx:true };
  }
  // ===================== DEEP-WATER MEMORY =====================
  { const wave={t:0}; const h=(x,z)=>0;
    const B=base('deep',{seed:91,h,fogFar:46,gridCol:'#1c1a2a',dotCol:'#5a4a8a'}); const {g,col,anim}=B; const R=rng(92);
    // wave field: a dot plane whose height is a travelling interference of ripples (wave equation look)
    const wv=[]; for(let x=-46;x<=46;x+=2) for(let z=-46;z<=46;z+=2) wv.push(x,0,z); const wp=pts(wv,latMat({color:'#8B5CF6',points:true,size:1.6,intensity:1.2,fogFar:46})); g.add(wp); const wb=wv.slice();
    anim.push(t=>{ const a=wp.geometry.attributes.position.array; for(let i=0;i<a.length;i+=3){ const x=wb[i], z=wb[i+2]; a[i+1]=.35*Math.sin(Math.hypot(x-10,z+8)*.45-t*2)+.25*Math.sin(Math.hypot(x+20,z-14)*.5-t*1.6)+.2; } wp.geometry.attributes.position.needsUpdate=true; });
    // light shafts from above
    const sh=[]; for(let i=0;i<40;i++){ const x=(R()-.5)*80, z=(R()-.5)*80; for(let y=4;y<30;y+=1.2) sh.push(x,y,z,x+.4,y+.6,z); } g.add(segs(sh,latMat({color:GD,intensity:.5,fogFar:60})));
    // boids fish school in gold
    const NB=120, bp=[], bv=[]; for(let i=0;i<NB;i++){ bp.push(new THREE.Vector3((R()-.5)*30,4+R()*6,(R()-.5)*30)); bv.push(new THREE.Vector3(R()-.5,0,R()-.5)); }
    const fa=new Float32Array(NB*3), fp=pts(Array.from(fa),latMat({color:GD,points:true,size:2,intensity:1.5,fogFar:50})); g.add(fp);
    const tv=new THREE.Vector3(), cen=new THREE.Vector3(); anim.push(t=>{ cen.set(Math.cos(t*.2)*18,6,Math.sin(t*.2)*18); for(let i=0;i<NB;i++){ const p=bp[i], v=bv[i]; tv.copy(cen).sub(p).multiplyScalar(.004); v.add(tv); for(let j=i+1;j<Math.min(NB,i+6);j++){ const d=p.distanceTo(bp[j]); if(d<1.2){ tv.copy(p).sub(bp[j]).multiplyScalar(.05); v.add(tv); } v.lerp(bv[j],.02); } v.clampLength(.05,.22); p.add(v); }
      const a=fp.geometry.attributes.position.array; for(let i=0;i<NB;i++){ a[i*3]=bp[i].x; a[i*3+1]=bp[i].y; a[i*3+2]=bp[i].z; } fp.geometry.attributes.position.needsUpdate=true; });
    // whale ribs (Leviathan's memory) + three memory orbs
    const wh=[]; for(let i=0;i<14;i++){ const x=-20+i*2.4, r=4*Math.sin(i/13*Math.PI)+.8; ring(wh,x,0,0,r,24,1,'x'); } const whale=segs(wh,latMat({color:'#8B5CF6',intensity:1,fogFar:70})); whale.position.set(0,14,-24); g.add(whale); anim.push(t=>{ whale.position.x=Math.sin(t*.1)*20; });
    const mem={}; [['m1',-28,10],['m2',24,18],['m3',4,-30]].forEach(([id,x,z])=>{ const a=[]; sphereCloud(a,x,2,z,1,140,R); const m=pts(a,latMat({color:BONE,points:true,size:1.8,intensity:1.4,twinkle:.6,fogFar:60})); g.add(m); anim.push(t=>m.rotation.y=t); mem[id]={x,z,m}; });
    portal(g,44,0,Math.PI/2); portal(g,-44,0,Math.PI/2);
    Z.deep={ id:'deep', name:'deep-water memory', sub:'leviathan remembers', group:g, col, bounds:[-46,-46,46,46], h, anim, music:'deep', lvl:22,
      sky:{rain:.15,rainCol:'#2a2246',hex:0,stars:.6}, spawn:{x:40,z:0,yaw:-Math.PI/2},
      portals:[{x:44,z:0,r:3,to:'clock',sx:-40,sz:0,syaw:Math.PI/2,label:'sand clocktower'},{x:-44,z:0,r:3,to:'abyss',sx:40,sz:0,syaw:-Math.PI/2,label:'sub-lattice abyss'}], objs:{mem}, tag:[-36,-36] };
  }
  // ===================== MODE-7 SKYLINE (Voronoi districts, 21 skybeams, the source tower) =====================
  { const B=base('skyline',{seed:101,fogFar:70,step:4}); const {g,col,anim,h}=B; const R=rng(102);
    // Mode-7 style floor: a big city map texture laid flat under the lattice (Voronoi districts + roads)
    const N=256, tex=dataTex(N,N), d=tex.image.data; const seeds=[]; for(let i=0;i<40;i++) seeds.push([R()*N,R()*N]);
    for(let y=0;y<N;y++) for(let x=0;x<N;x++){ let b1=1e9,b2=1e9; for(const [sx,sy] of seeds){ const q=(x-sx)**2+(y-sy)**2; if(q<b1){ b2=b1; b1=q; } else if(q<b2) b2=q; } const edge=Math.sqrt(b2)-Math.sqrt(b1)<1.4; const road=(x%24===0)||(y%24===0);
      d[(y*N+x)*4]= edge?220: road?120 : ((x*7+y*13)%9===0?70:0); d[(y*N+x)*4+3]=255; } tex.needsUpdate=true;
    const fl=texPlane(tex,{w:300,h:300,n:new THREE.Vector2(N,N),dots:true,alpha:.5}); fl.rotation.x=-Math.PI/2; fl.position.y=.04; g.add(fl);
    // 21 skybeams
    const bm=[]; for(let i=0;i<21;i++){ const a=i/21*Math.PI*2, r=60+R()*20; const x=Math.cos(a)*r, z=Math.sin(a)*r-30; for(let y=0;y<120;y+=3) bm.push(x,y,z,x,y+1.8,z); } const beams=segs(bm,latMat({color:DG,intensity:.9,fogNear:60,fogFar:220})); g.add(beams);
    // three beacon towers + the source tower with the blinking cursor
    const bea={}; [['b1',-30,-10],['b2',30,-10],['b3',0,20]].forEach(([id,x,z])=>{ const a=[]; truss(a,x,z,12,1.2,.4,6,3); const m=segs(a,latMat({color:DG,intensity:1.2,fogFar:90})); g.add(m); col.push({c:[x,z,1.4]}); bea[id]={x,z,m}; });
    const st=[]; truss(st,0,0,60,6,2,16,4); const src=segs(st,latMat({color:DG,intensity:1,fogFar:220})); src.position.set(0,0,-40); g.add(src); col.push({c:[0,-40,6.5]});
    const csp=segs(BLENDER_GEO.citadel_spire,latMat({color:GD,intensity:1.3,fogFar:180})); csp.position.set(0,0,-22); g.add(csp); anim.push(t=>{ csp.rotation.y=t*.22; });
    const cur=[]; for(let i=0;i<300;i++){ const u=R(), v=R(); if(u<.25) cur.push(-6+u*16,62+v*6,-40); else cur.push(1+u*7,61,-40); } const cursor=pts(cur,latMat({color:RED,points:true,size:2.6,intensity:1.8,fogFar:260})); g.add(cursor);
    anim.push(t=>{ cursor.visible=Math.floor(t*1.6)%2===0; });
    const city=[]; const mats={ edge:latMat({color:GD,intensity:.6,fogNear:20,fogFar:160}), band:latMat({color:DG,intensity:.8,fogFar:150}), win:latMat({color:GD,points:true,size:1.2,twinkle:.6,intensity:1.1,fogFar:170}), solid:solidMat('#0b0906') };
    for(let i=0;i<40;i++){ const a=R()*Math.PI*2, r=70+R()*50; building(g,Math.cos(a)*r,Math.sin(a)*r,4+R()*5,4+R()*5,10+R()*40,R,mats); }
    portal(g,-50,30,Math.PI/2); portal(g,0,46,0);
    Z.skyline={ id:'skyline', name:'mode-7 skyline', sub:'21 skybeams · the source', group:g, col, bounds:[-50,-48,50,46], h, anim, music:'skyline', lvl:26,
      sky:{rain:.2,rainCol:'#5a420e',hex:1,stars:2}, spawn:{x:-44,z:30,yaw:Math.PI/2},
      portals:[{x:-50,z:30,r:3,to:'relay',sx:44,sz:0,syaw:-Math.PI/2,label:'the hollow'},{x:0,z:46,r:3,to:'citadel',sx:0,sz:38,syaw:Math.PI,label:'zero-knowledge citadel'}], objs:{bea,cursor,src}, tag:[44,40] };
  }
  // ===================== SUB-LATTICE ABYSS (District #13) =====================
  { const h=(x,z)=>0.35*Math.sin(x*.09)*Math.sin(z*.09);
    const B=base('abyss',{seed:111,h,fogFar:54,gridCol:'#161224',dotCol:'#6d28d9'}); const {g,col,anim}=B; const R=rng(112);
    const mono=segs(BLENDER_GEO.abyss_monolith,latMat({color:'#a78bfa',intensity:1.4,fogFar:120})); mono.position.set(0,0,0); g.add(mono); col.push({c:[0,0,2.8]});
    anim.push(t=>{ mono.rotation.y=t*.25; });
    const seals={}; [['s1',-24,-20],['s2',24,-20],['s3',0,24]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.2,x,2.2,z); ring(a,x,.1,z,2.2,32,2);
      const m=segs(a,latMat({color:GD,intensity:1.4,fogFar:70})); g.add(m); anim.push(t=>{ m.rotation.y=t*.4; }); col.push({c:[x,z,1.3]}); seals[id]={x,z,m};
    });
    const sp=[]; for(let i=0;i<260;i++) sp.push((R()-.5)*84,R()*18,(R()-.5)*84);
    const spp=pts(sp,latMat({color:'#22d3ee',points:true,size:1.8,twinkle:1,intensity:1.4,fogFar:60})); g.add(spp);
    portal(g,44,0,Math.PI/2); portal(g,-44,0,Math.PI/2);
    Z.abyss={ id:'abyss', name:'sub-lattice abyss', sub:'menger trench · depth 4096m', group:g, col, bounds:[-46,-46,46,46], h, anim, music:'abyss', lvl:28,
      sky:{rain:.25,rainCol:'#312e81',hex:1,stars:1.4}, spawn:{x:40,z:0,yaw:-Math.PI/2},
      portals:[{x:44,z:0,r:3,to:'deep',sx:-40,sz:0,syaw:Math.PI/2,label:'deep-water memory'},{x:-44,z:0,r:3,to:'citadel',sx:0,sz:38,syaw:Math.PI,label:'zero-knowledge citadel'}], objs:{seals}, tag:[-34,34] };
  }
  // ===================== ZERO-KNOWLEDGE CITADEL (District #14) =====================
  { const h=()=>0;
    const B=base('citadel',{seed:121,h,fogFar:68,gridCol:'#2e2208',dotCol:GD}); const {g,col,anim}=B; const R=rng(122);
    const thr=segs(BLENDER_GEO.pantheon_throne,latMat({color:GD,intensity:1.35,fogFar:140})); thr.position.set(0,0,-22); g.add(thr); col.push({c:[0,-22,4.2]});
    const arc=segs(BLENDER_GEO.archon_seraph,latMat({color:RED,intensity:1.45,fogFar:140})); arc.position.set(0,9,-16); g.add(arc);
    anim.push(t=>{ thr.rotation.y=-t*.15; arc.rotation.y=t*.45; arc.position.y=9+Math.sin(t*1.8)*.5; });
    const coln=[]; for(let i=-3;i<=3;i++){ if(i===0) continue; const z=i*10; truss(coln,-18,z,14,1.1,.5,6,4); truss(coln,18,z,14,1.1,.5,6,4); col.push({c:[-18,z,1.3]},{c:[18,z,1.3]}); }
    g.add(segs(coln,latMat({color:DG,intensity:1.15,fogFar:90})));
    portal(g,0,42,0); portal(g,0,-42,0);
    Z.citadel={ id:'citadel', name:'zero-knowledge citadel', sub:'pantheon sanctum · archon-0', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'citadel', lvl:30,
      sky:{rain:.1,rainCol:'#5a420e',hex:1,stars:2.2}, spawn:{x:0,z:38,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'skyline',sx:0,sz:40,syaw:Math.PI,label:'mode-7 skyline'},{x:0,z:-42,r:3,to:'nullcore',sx:0,sz:36,syaw:Math.PI,label:'the null core'}], objs:{thr,arc}, tag:[34,-34] };
  }
  // ===================== THE NULL CORE (District #15 · Memory Singularity) =====================
  { const h=(x,z)=>-0.25*Math.cos(Math.hypot(x,z)*.12);
    const B=base('nullcore',{seed:131,h,fogFar:64,gridCol:'#0d242a',dotCol:'#22d3ee'}); const {g,col,anim}=B; const R=rng(132);
    const sing=segs(BLENDER_GEO.null_singularity,latMat({color:'#22d3ee',intensity:1.5,fogFar:140})); sing.position.set(0,1,-8); g.add(sing); col.push({c:[0,-8,4.5]});
    const outer=segs(BLENDER_GEO.null_singularity,latMat({color:GD,intensity:1.25,fogFar:140})); outer.scale.setScalar(1.45); outer.position.set(0,1,-8); g.add(outer);
    anim.push(t=>{ sing.rotation.y=t*.38; sing.rotation.z=Math.sin(t*.4)*.25; outer.rotation.y=-t*.22; outer.rotation.x=Math.cos(t*.3)*.2; });
    const pyl={}; [['n1',-22,-8],['n2',22,-8],['n3',0,18]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.5,x,2.6,z); ring(a,x,.15,z,2.8,32,2);
      const m=segs(a,latMat({color:GD,intensity:1.5,fogFar:80})); g.add(m); anim.push(t=>{ m.rotation.y=-t*.55; }); col.push({c:[x,z,1.5]}); pyl[id]={x,z,m};
    });
    const st=[]; for(let i=0;i<320;i++) st.push((R()-.5)*84,R()*24,(R()-.5)*84);
    g.add(pts(st,latMat({color:'#f43f5e',points:true,size:1.9,twinkle:1,intensity:1.5,fogFar:70})));
    portal(g,0,42,0); portal(g,0,-42,0);
    Z.nullcore={ id:'nullcore', name:'the null core', sub:'memory singularity · 06:13', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'phonk', lvl:32,
      sky:{rain:.18,rainCol:'#06b6d4',hex:1,stars:2.5}, spawn:{x:0,z:36,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'citadel',sx:0,sz:-36,syaw:0,label:'zero-knowledge citadel'},{x:0,z:-42,r:3,to:'loom',sx:0,sz:36,syaw:Math.PI,label:'the quantum loom'}], objs:{sing,pyl}, tag:[-32,-32] };
  }
  // ===================== THE QUANTUM LOOM (District #16 · Entangled Spindle) =====================
  { const h=(x,z)=>0.18*Math.sin(x*.15)*Math.cos(z*.15);
    const B=base('loom',{seed:161,h,fogFar:68,gridCol:'#1f1235',dotCol:'#a78bfa'}); const {g,col,anim}=B; const R=rng(162);
    const spindle=segs(BLENDER_GEO.quantum_loom,latMat({color:'#a78bfa',intensity:1.5,fogFar:140})); spindle.position.set(0,0,-8); g.add(spindle); col.push({c:[0,-8,4.8]});
    const inner=segs(BLENDER_GEO.quantum_loom,latMat({color:GD,intensity:1.3,fogFar:140})); inner.scale.setScalar(.62); inner.position.set(0,2.2,-8); g.add(inner);
    anim.push(t=>{ spindle.rotation.y=t*.42; inner.rotation.y=-t*.68; inner.position.y=2.2+Math.sin(t*1.6)*.45; });
    const pyl={}; [['l1',-20,-8],['l2',20,-8],['l3',0,16]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.6,x,2.8,z); ring(a,x,.15,z,3.0,32,2);
      const m=segs(a,latMat({color:'#22d3ee',intensity:1.4,fogFar:85})); g.add(m); anim.push(t=>{ m.rotation.y=t*.5; }); col.push({c:[x,z,1.6]}); pyl[id]={x,z,m};
    });
    const st=[]; for(let i=0;i<300;i++) st.push((R()-.5)*84,R()*24,(R()-.5)*84);
    g.add(pts(st,latMat({color:'#a78bfa',points:true,size:1.8,twinkle:1,intensity:1.45,fogFar:75})));
    portal(g,0,42,0); portal(g,0,-42,0);
    Z.loom={ id:'loom', name:'the quantum loom', sub:'entangled spindle · 06:14', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'loom', lvl:34,
      sky:{rain:.22,rainCol:'#a78bfa',hex:1,stars:2.6}, spawn:{x:0,z:36,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'nullcore',sx:0,sz:-36,syaw:0,label:'the null core'},{x:0,z:-42,r:3,to:'vault',sx:0,sz:36,syaw:Math.PI,label:'the chrono-vault'}], objs:{spindle,pyl}, tag:[32,-32] };
  }
  // ===================== THE CHRONO-VAULT (District #17 · Celestial Orrery) =====================
  { const h=(x,z)=>0.15*Math.cos(Math.hypot(x,z)*.14);
    const B=base('vault',{seed:171,h,fogFar:70,gridCol:'#261c08',dotCol:GD}); const {g,col,anim}=B; const R=rng(172);
    const orr=segs(BLENDER_GEO.chrono_orrery,latMat({color:GD,intensity:1.55,fogFar:140})); orr.position.set(0,0,-8); g.add(orr); col.push({c:[0,-8,5.2]});
    const inner=segs(BLENDER_GEO.chrono_orrery,latMat({color:'#4ade80',intensity:1.35,fogFar:140})); inner.scale.setScalar(.66); inner.position.set(0,2.1,-8); g.add(inner);
    anim.push(t=>{ orr.rotation.y=t*.35; inner.rotation.y=-t*.58; inner.rotation.z=Math.sin(t*.8)*.22; });
    const pyl={}; [['v1',-20,-8],['v2',20,-8],['v3',0,16]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.6,x,2.8,z); ring(a,x,.15,z,3.0,32,2);
      const m=segs(a,latMat({color:'#4ade80',intensity:1.45,fogFar:85})); g.add(m); anim.push(t=>{ m.rotation.y=-t*.48; }); col.push({c:[x,z,1.6]}); pyl[id]={x,z,m};
    });
    const st=[]; for(let i=0;i<320;i++) st.push((R()-.5)*84,R()*24,(R()-.5)*84);
    g.add(pts(st,latMat({color:GD,points:true,size:1.9,twinkle:1,intensity:1.5,fogFar:75})));
    portal(g,0,42,0); portal(g,0,-42,0);
    Z.vault={ id:'vault', name:'the chrono-vault', sub:'celestial orrery · 06:15', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'vault', lvl:36,
      sky:{rain:.16,rainCol:'#f5b82e',hex:1,stars:2.8}, spawn:{x:0,z:36,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'loom',sx:0,sz:-36,syaw:0,label:'the quantum loom'},{x:0,z:-42,r:3,to:'astral',sx:0,sz:36,syaw:Math.PI,label:'the astral relay'}], objs:{orr,pyl}, tag:[-34,34] };
  }
  // ===================== THE ASTRAL RELAY (District #18 · Stellar Astrolabe) =====================
  { const h=(x,z)=>0.18*Math.sin(x*.12)*Math.sin(z*.12);
    const B=base('astral',{seed:181,h,fogFar:72,gridCol:'#0e222e',dotCol:'#22d3ee'}); const {g,col,anim}=B; const R=rng(182);
    const astro=segs(BLENDER_GEO.astral_astrolabe,latMat({color:'#22d3ee',intensity:1.6,fogFar:140})); astro.position.set(0,0,-8); g.add(astro); col.push({c:[0,-8,5.4]});
    const inner=segs(BLENDER_GEO.astral_astrolabe,latMat({color:GD,intensity:1.4,fogFar:140})); inner.scale.setScalar(.64); inner.position.set(0,2.3,-8); g.add(inner);
    anim.push(t=>{ astro.rotation.y=t*.38; inner.rotation.y=-t*.62; inner.rotation.x=Math.sin(t*.7)*.25; });
    const pyl={}; [['a1',-20,-8],['a2',20,-8],['a3',0,16]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.7,x,2.9,z); ring(a,x,.15,z,3.1,32,2);
      const m=segs(a,latMat({color:GD,intensity:1.5,fogFar:85})); g.add(m); anim.push(t=>{ m.rotation.y=t*.52; }); col.push({c:[x,z,1.7]}); pyl[id]={x,z,m};
    });
    const st=[]; for(let i=0;i<360;i++) st.push((R()-.5)*86,R()*26,(R()-.5)*86);
    g.add(pts(st,latMat({color:'#22d3ee',points:true,size:2.0,twinkle:1,intensity:1.55,fogFar:80})));
    portal(g,0,42,0); portal(g,0,-42,0);
    Z.astral={ id:'astral', name:'the astral relay', sub:'stellar astrolabe · 06:16', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'astral', lvl:38,
      sky:{rain:.14,rainCol:'#22d3ee',hex:1,stars:3.2}, spawn:{x:0,z:36,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'vault',sx:0,sz:-36,syaw:0,label:'the chrono-vault'},{x:0,z:-42,r:3,to:'omega',sx:0,sz:36,syaw:Math.PI,label:'the omega foundry'}], objs:{astro,pyl}, tag:[34,-34] };
  }
  // ===================== THE OMEGA FOUNDRY (District #19 · Crucible Core) =====================
  { const h=(x,z)=>0.22*Math.sin(x*.14)*Math.cos(z*.14);
    const B=base('omega',{seed:191,h,fogFar:70,gridCol:'#2e140c',dotCol:'#fb923c'}); const {g,col,anim}=B; const R=rng(192);
    const core=segs(BLENDER_GEO.omega_core,latMat({color:'#fb923c',intensity:1.65,fogFar:140})); core.position.set(0,0,-8); g.add(core); col.push({c:[0,-8,5.6]});
    const inner=segs(BLENDER_GEO.omega_core,latMat({color:GD,intensity:1.45,fogFar:140})); inner.scale.setScalar(.62); inner.position.set(0,2.4,-8); g.add(inner);
    anim.push(t=>{ core.rotation.y=t*.44; inner.rotation.y=-t*.72; inner.position.y=2.4+Math.sin(t*1.9)*.4; });
    const pyl={}; [['o1',-20,-8],['o2',20,-8],['o3',0,16]].forEach(([id,x,z])=>{
      const a=[]; wireOcta(a,1.8,x,3.0,z); ring(a,x,.15,z,3.2,32,2);
      const m=segs(a,latMat({color:'#f43f5e',intensity:1.5,fogFar:85})); g.add(m); anim.push(t=>{ m.rotation.y=-t*.56; }); col.push({c:[x,z,1.8]}); pyl[id]={x,z,m};
    });
    const st=[]; for(let i=0;i<360;i++) st.push((R()-.5)*86,R()*26,(R()-.5)*86);
    g.add(pts(st,latMat({color:'#fb923c',points:true,size:2.0,twinkle:1,intensity:1.55,fogFar:80})));
    portal(g,0,42,0);
    Z.omega={ id:'omega', name:'the omega foundry', sub:'reactor crucible · 06:17', group:g, col, bounds:[-44,-44,44,44], h, anim, music:'omega', lvl:40,
      sky:{rain:.24,rainCol:'#fb923c',hex:1,stars:2.8}, spawn:{x:0,z:36,yaw:Math.PI},
      portals:[{x:0,z:42,r:3,to:'astral',sx:0,sz:-36,syaw:0,label:'the astral relay'}], objs:{core,pyl}, tag:[-36,-36] };
  }
  // ===================== SECRET: THE ROOFTOP AT 06:12 =====================
  { const g=new THREE.Group(), col=[], anim=[], R=rng(612); const h=()=>0;
    g.add(grid(-14,14,-10,10,2,h,latMat({color:DDG,intensity:1.6,fogFar:40}),2)); groundPlane(g,60,h,4);
    const ed=[]; boxEdges(ed,0,-.6,0,28,.6,20); g.add(segs(ed,latMat({color:GD,intensity:1,fogFar:50})));
    const mats={ edge:latMat({color:DG,intensity:.6,fogNear:20,fogFar:200}), band:latMat({color:DDG,intensity:.8,fogFar:200}), win:latMat({color:GD,points:true,size:1.2,twinkle:.6,intensity:.9,fogFar:220}), solid:solidMat('#0b0906') };
    for(let i=0;i<70;i++){ const x=(R()-.5)*260, z=-40-R()*120; building(g,x,z,5+R()*8,5+R()*8,-20+R()*45,R,mats); }
    const lap=[]; boxEdges(lap,0,0,-4,1,.05,.7); lap.push(-.5,.05,-4.35,-.5,.7,-4.55,.5,.05,-4.35,.5,.7,-4.55,-.5,.7,-4.55,.5,.7,-4.55); g.add(segs(lap,latMat({color:GD,intensity:1.8})));
    // the sun: a braille disc rising
    const sun=[]; for(let i=0;i<1500;i++){ const a=R()*Math.PI*2, r=Math.sqrt(R())*16; sun.push(Math.cos(a)*r,Math.sin(a)*r,0); } const sp=pts(sun,latMat({color:GD,points:true,size:1.8,intensity:1.2,fogNear:300,fogFar:500})); sp.position.set(0,-10,-200); g.add(sp);
    const rays=[]; for(let i=0;i<24;i++){ const a=i/24*Math.PI; for(let r=20;r<80;r+=3) rays.push(Math.cos(a)*r,Math.sin(a)*r,0,Math.cos(a)*(r+1.4),Math.sin(a)*(r+1.4),0); } const rp=segs(rays,latMat({color:DG,intensity:.7,fogNear:300,fogFar:500})); rp.position.copy(sp.position); g.add(rp);
    anim.push(t=>{ const y=Math.min(14,-10+t*.6); sp.position.y=y; rp.position.y=y; rp.rotation.z=t*.02; });
    Z.rooftop={ id:'rooftop', name:'the rooftop', sub:'06:12', group:g, col, bounds:[-13,-9,13,9], h, anim, music:'title', lvl:1, secret:true,
      sky:{rain:0,rainCol:'#3c2c0a',hex:0,stars:.5}, spawn:{x:0,z:6,yaw:Math.PI}, portals:[], objs:{} };
  }
  return Z;
}
