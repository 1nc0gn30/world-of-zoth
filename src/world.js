// The three connected lattice zones: Relit City (hub), Rest Woods (EP10 forest), The Hollow (red relay / Chorus core).
import * as THREE from 'three';
import { rng, segs, pts, grid, dotPlane, building, ring, truss, tree, sphereCloud, wireOcta, wireIco, latMat, solidMat, boxEdges } from './geo.js';
import { U } from './render.js';
const GD='#f5b82e', DG='#8a6514', DDG='#3c2c0a', RED='#dc3228';

// ---- Game of Life texture (shared "life" layer on plaza / clearing floors) ----
export const LIFE={ n:64, g:new Uint8Array(64*64), tex:null, acc:0 };
(function(){ const R=rng(11); for(let i=0;i<LIFE.g.length;i++) LIFE.g[i]=R()<.28?1:0; const d=new Uint8Array(64*64*4); LIFE.tex=new THREE.DataTexture(d,64,64); LIFE.tex.magFilter=LIFE.tex.minFilter=THREE.NearestFilter; })();
export function lifeStep(){ const n=LIFE.n, g=LIFE.g, o=new Uint8Array(n*n), d=LIFE.tex.image.data; let alive=0;
  for(let y=0;y<n;y++) for(let x=0;x<n;x++){ let c=0; for(let j=-1;j<=1;j++) for(let i=-1;i<=1;i++){ if(i||j) c+=g[((y+j+n)%n)*n+((x+i+n)%n)]; }
    const v=g[y*n+x]; const nv=(v&&(c===2||c===3))||(!v&&c===3)?1:0; o[y*n+x]=nv; alive+=nv; const k=(y*n+x)*4; d[k]=nv?255:(v?90:Math.max(0,d[k]-40)); d[k+3]=255; }
  LIFE.g.set(o); if(alive<200){ const R=rng(Date.now()&0xffff); for(let i=0;i<300;i++) LIFE.g[Math.floor(R()*n*n)]=1; } LIFE.tex.needsUpdate=true; }
function lifeFloor(cx,cz,size,color=GD){
  const m=new THREE.ShaderMaterial({ transparent:true, depthWrite:false, blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor, blendEquationAlpha:THREE.MaxEquation, blendSrcAlpha:THREE.OneFactor, blendDstAlpha:THREE.OneFactor,
    uniforms:{ life:{value:LIFE.tex}, color:{value:new THREE.Color(color)}, time:U.time },
    vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D life; uniform vec3 color; varying vec2 vUv; void main(){ vec2 c=vUv*64.; vec2 f=fract(c)-.5; float v=texture2D(life,(floor(c)+.5)/64.).r;
      float r=length(vUv-.5)*2.; float edge=1.-smoothstep(.7,1.,r); float d=step(length(f),.28); gl_FragColor=vec4(color*v*d*edge*.9,.5);} ` });
  const p=new THREE.Mesh(new THREE.PlaneGeometry(size,size),m); p.rotation.x=-Math.PI/2; p.position.set(cx,.03,cz); p.renderOrder=2; return p;
}
export function portal(group,x,z,rot,col=GD){ const a=[]; const w=3.2,h=5; // lattice archway
  for(let i=0;i<=8;i++){ const t=i/8*Math.PI; a.push(Math.cos(t)*w,h-1.5+Math.sin(t)*1.5,0, Math.cos(t+Math.PI/8)*w,h-1.5+Math.sin(t+Math.PI/8)*1.5,0); }
  a.push(-w,0,0,-w,h-1.5,0, w,0,0,w,h-1.5,0); for(let y=0;y<h-1.5;y+=.8) a.push(-w-.3,y,0,-w+.3,y+.4,0, w-.3,y,0,w+.3,y+.4,0);
  const g=new THREE.Group(); g.add(segs(a,latMat({color:col,intensity:1.3,fogFar:90})));
  const sc=[]; for(let i=0;i<220;i++) sc.push((Math.random()-.5)*w*2,Math.random()*(h-1.5),0); const scan=pts(sc,latMat({color:col,points:true,size:1.6,twinkle:1,intensity:.9,fogFar:90})); g.add(scan);
  g.position.set(x,0,z); g.rotation.y=rot; group.add(g); return g;
}

export function groundPlane(g,size,hf,step=4){ const geo=new THREE.PlaneGeometry(size,size,Math.round(size/step),Math.round(size/step)); geo.rotateX(-Math.PI/2); const a=geo.attributes.position; for(let i=0;i<a.count;i++) a.setY(i,hf(a.getX(i),a.getZ(i))-.06); geo.computeVertexNormals(); const m=new THREE.Mesh(geo,solidMat('#070605')); m.renderOrder=0; g.add(m); }
export function buildZones(){
  const Z={};
  // ========================= HUB: the relit city =========================
  {
    const g=new THREE.Group(), R=rng(21), col=[], anim=[];
    const flat=()=>0;
    g.add(grid(-60,60,-60,60,3,flat,latMat({color:DDG,intensity:1.6,fogNear:6,fogFar:60})));
    groundPlane(g,400,flat,50);
    g.add(dotPlane(-60,60,-60,60,3,flat,latMat({color:GD,points:true,size:1.6,intensity:.9,fogNear:6,fogFar:55})));
    // street centre lines (dashed, bright)
    const st=[]; for(let s=-58;s<58;s+=2.2){ st.push(s,.02,-1.5,s+1.1,.02,-1.5, s,.02,1.5,s+1.1,.02,1.5, -1.5,.02,s,-1.5,.02,s+1.1, 1.5,.02,s,1.5,.02,s+1.1); }
    g.add(segs(st,latMat({color:GD,intensity:.8,fogFar:50})));
    const mats={ edge:latMat({color:GD,intensity:.75,fogNear:8,fogFar:75}), band:latMat({color:DG,intensity:.9,fogFar:70}), win:latMat({color:GD,points:true,size:1.4,twinkle:.6,intensity:1.2,fogFar:85}), solid:solidMat('#0b0906') };
    for(let gx=-5;gx<=5;gx++) for(let gz=-5;gz<=5;gz++){
      if(gx===0||gz===0) continue; if(Math.abs(gx)<=1&&Math.abs(gz)<=1) continue;
      if(gz===1&&gx<=-4) continue; if(gz===-1&&gx<=-4) continue; // west road
      const x=gx*9.5+(R()-.5)*1.5, z=gz*9.5+(R()-.5)*1.5, w=3.2+R()*2.6, d=3.2+R()*2.6, edgeRing=Math.max(Math.abs(gx),Math.abs(gz))>=5;
      const h=edgeRing? 14+R()*22 : 3+R()*(Math.max(Math.abs(gx),Math.abs(gz))*3.5);
      building(g,x,z,w,d,h,R,mats); col.push({box:[x-w/2,z-d/2,x+w/2,z+d/2]});
      if(R()<.18){ const a=[]; ring(a,x,h+1.2,z,1.1,24,2); const rr=segs(a,latMat({color:GD,intensity:1.2,fogFar:90})); g.add(rr); anim.push(t=>rr.rotation.y=t*.4); } // antenna rings
    }
    // Relay 1 (lit gold) in the plaza
    const rel=new THREE.Group(); const ta=[]; truss(ta,0,0,16,2.2,.5,10,4); rel.add(segs(ta,latMat({color:GD,intensity:1.1,fogFar:110})));
    const rings=[]; for(let i=0;i<3;i++){ const a=[]; ring(a,0,0,0,3+i*1.4,64,i===1?2:1); const r=segs(a,latMat({color:i===1?GD:DG,intensity:1.4,fogFar:110})); r.position.y=6+i*3.5; rel.add(r); rings.push(r); }
    const core=[]; sphereCloud(core,0,16.8,0,1.3,220,R); rel.add(pts(core,latMat({color:GD,points:true,size:1.6,intensity:.75,fogFar:120})));
    g.add(rel); col.push({c:[0,0,2.6]}); anim.push(t=>rings.forEach((r,i)=>{ r.rotation.y=t*(.3+i*.2)*(i%2?-1:1); r.rotation.x=Math.sin(t*.5+i)*.12; }));
    // the faint red pulse under the plaza: relay 4 is below
    const rp=[]; ring(rp,0,.04,0,5,64,3); const redRing=segs(rp,latMat({color:RED,intensity:.7,fogFar:60})); g.add(redRing); anim.push(t=>{ const s=1+((t*.25)%1)*1.4; redRing.scale.set(s,1,s); redRing.material.uniforms.intensity.value=.8*(1-((t*.25)%1)); });
    g.add(lifeFloor(0,0,22));
    // save terminal
    const term=[]; boxEdges(term,-5,0,-2,1.2,1.1,.8); boxEdges(term,-5,1.1,-2.2,1.2,.9,.1); g.add(segs(term,latMat({color:GD,intensity:1.3})));
    const scr=[]; for(let i=0;i<40;i++) scr.push(-5.5+Math.random(),1.2+Math.random()*.7,-2.1); g.add(pts(scr,latMat({color:GD,points:true,size:1.2,twinkle:1,intensity:1.4})));
    col.push({c:[-5,-2,.8]});
    // gates
    portal(g,-50,0,Math.PI/2); const eastGate=portal(g,50,0,Math.PI/2,GD); portal(g,0,-50,0); portal(g,0,50,0);
    // moon: braille disc of dots
    const mo=[]; for(let i=0;i<600;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*9; mo.push(Math.cos(a)*r, 60+Math.sin(a)*r, -150); } g.add(pts(mo,latMat({color:GD,points:true,size:1.4,intensity:.8,fogNear:300,fogFar:400})));
    Z.hub={ id:'hub', name:'relit city', sub:'district grid · relay 1', group:g, col, bounds:[-52,-56,52,56], h:flat, anim, music:'hub',
      sky:{rain:.45,rainCol:'#5a420e',hex:0,stars:1}, spawn:{x:0,z:14,yaw:Math.PI},
      portals:[{x:-50,z:0,r:3,to:'forest',sx:44,sz:0,syaw:-Math.PI/2,label:'rest woods'},{x:50,z:0,r:3,to:'relay',sx:-40,sz:0,syaw:Math.PI/2,label:'the hollow',lock:'gate_open'},{x:0,z:-50,r:3,to:'fiber',sx:0,sz:44,syaw:Math.PI,label:'fiber tunnels',lock:'fiber_open'},{x:0,z:50,r:3,to:'streets',sx:0,sz:-43,syaw:0,label:'collapse streets',lock:'streets_open'}],
      objs:{ eastGate } };
  }
  // ========================= FOREST: rest woods (EP10) =========================
  {
    const g=new THREE.Group(), R=rng(10), col=[], anim=[];
    const flatAt=[[-22,-14,9],[15,-18,9],[-20,20,6],[0,26,5],[44,0,6]];
    const h=(x,z)=>{ let v=1.8*Math.sin(x*.075)*Math.cos(z*.062)+.9*Math.sin(x*.19+z*.13)+.5*Math.cos(z*.21-x*.05); const r=Math.hypot(x,z); v+=Math.max(0,r-40)*.25;
      for(const [fx,fz,fr] of flatAt){ const d=Math.hypot(x-fx,z-fz); if(d<fr) v*=Math.min(1,d/fr*1.1)**2; } return v; };
    g.add(grid(-56,56,-56,56,2,h,latMat({color:DDG,intensity:1.7,fogNear:5,fogFar:48}),2));
    groundPlane(g,240,h,2);
    g.add(dotPlane(-56,56,-56,56,2,h,latMat({color:DG,points:true,size:1.4,intensity:1.1,fogNear:5,fogFar:44})));
    const ta=[], lp=[];
    for(let i=0;i<120;i++){ const x=(R()-.5)*104, z=(R()-.5)*104; let ok=true; for(const [fx,fz,fr] of flatAt) if(Math.hypot(x-fx,z-fz)<fr+2) ok=false; if(Math.abs(z)<3&&Math.abs(x)>20) ok=false; if(!ok) continue;
      const s=.8+R()*1.0; tree(ta,lp,x,h(x,z),z,R,s); col.push({c:[x,z,.5*s]}); }
    // dense wall of trees just outside the walkable bounds
    for(let i=0;i<70;i++){ const a=i/70*Math.PI*2+R()*.05, r=55+R()*6, x=Math.cos(a)*r, z=Math.sin(a)*r; if(Math.abs(z)<5) continue; tree(ta,lp,x,h(x,z),z,R,1.3+R()*.8); }
    // rest tree (big)
    tree(ta,lp,-20,h(-20,20),20,rng(3),2.0); col.push({c:[-20,20,.9]});
    g.add(segs(ta,latMat({color:DG,intensity:1.5,fogNear:5,fogFar:50})));
    g.add(pts(lp,latMat({color:GD,points:true,size:1.5,twinkle:.5,intensity:.9,fogNear:5,fogFar:46})));
    // pond with ripples
    const pond=[]; for(let i=0;i<5;i++) ring(pond,15,.05,-18,1.5+i*1.2,48,1); const pr=segs(pond,latMat({color:GD,intensity:.9,fogFar:50})); g.add(pr);
    anim.push(t=>{ const s=1+((t*.3)%1)*.35; pr.scale.set(s,1,s); pr.position.set(15*(1-s),0,-18*(1-s)); });
    col.push({c:[15,-18,4.2]});
    g.add(lifeFloor(-22,-14,16,GD));
    // fireflies
    const ff=[]; for(let i=0;i<90;i++) ff.push((R()-.5)*90,1+R()*3,(R()-.5)*90); const ffp=pts(ff,latMat({color:GD,points:true,size:2,twinkle:1,intensity:1.5,fogFar:40})); g.add(ffp);
    const ffb=ff.slice(); anim.push(t=>{ const a=ffp.geometry.attributes.position.array; for(let i=0;i<a.length;i+=3){ a[i]=ffb[i]+Math.sin(t*.4+i)*1.5; a[i+1]=ffb[i+1]+Math.sin(t*.9+i*.3)*.5+h(ffb[i],ffb[i+2]); a[i+2]=ffb[i+2]+Math.cos(t*.35+i)*1.5; } ffp.geometry.attributes.position.needsUpdate=true; });
    // crescent moon low on the horizon
    const mo=[]; for(let i=0;i<500;i++){ const a=Math.random()*Math.PI*2, r=Math.sqrt(Math.random())*8; const x=Math.cos(a)*r, y=Math.sin(a)*r; if(Math.hypot(x-3,y+2)<7) continue; mo.push(x+40, 40+y, -140); } g.add(pts(mo,latMat({color:GD,points:true,size:1.4,intensity:.9,fogNear:300,fogFar:400})));
    portal(g,50,0,Math.PI/2).position.y=h(50,0); portal(g,-50,0,Math.PI/2).position.y=h(-50,0);
    Z.forest={ id:'forest', name:'rest woods', sub:'where he sleeps', group:g, col, bounds:[-52,-52,52,52], h, anim, music:'forest',
      sky:{rain:.12,rainCol:'#3c2c0a',hex:0,stars:2.4}, spawn:{x:44,z:0,yaw:-Math.PI/2},
      portals:[{x:50,z:0,r:3,to:'hub',sx:-44,sz:0,syaw:Math.PI/2,label:'relit city'},{x:-50,z:0,r:3,to:'caves',sx:42,sz:0,syaw:-Math.PI/2,label:'physarum caves',lock:'caves_open'}] };
  }
  // ========================= RELAY: the hollow / chorus core =========================
  {
    const g=new THREE.Group(), R=rng(4), col=[], anim=[];
    const h=(x,z)=>{ const r=Math.hypot(x-26,z); return r<9? 0 : (Math.floor((Math.sin(x*.11)+Math.cos(z*.09))*1.2))*.6*Math.min(1,(r-9)/8); };
    g.add(grid(-50,50,-50,50,2.5,h,latMat({color:DDG,intensity:1.7,fogNear:5,fogFar:50,glitch:.5}),2));
    groundPlane(g,200,h,2.5);
    g.add(dotPlane(-50,50,-50,50,2.5,h,latMat({color:DG,points:true,size:1.5,intensity:1,fogNear:5,fogFar:46,glitch:.5})));
    // red crack lines spreading from the core (the hostile system)
    const cr=[]; for(let k=0;k<14;k++){ let x=26,z=0,a=k/14*Math.PI*2; for(let s=0;s<22;s++){ const nx=x+Math.cos(a)*2.2, nz=z+Math.sin(a)*2.2; cr.push(x,h(x,z)+.06,z,nx,h(nx,nz)+.06,nz); x=nx; z=nz; a+=(R()-.5)*.9; } }
    const crack=segs(cr,latMat({color:RED,intensity:.9,fogFar:60})); g.add(crack); anim.push(t=>crack.material.uniforms.intensity.value=.6+.4*Math.sin(t*2.2));
    // floating broken voxels (point-cloud cubes) in gold, slowly orbiting
    const vox=[]; for(let i=0;i<40;i++){ const a=[]; const s=.6+R()*1.8; boxEdges(a,0,-s/2,0,s,s,s); const m=segs(a,latMat({color:R()<.8?DG:GD,intensity:1.2,fogFar:70})); const x=(R()-.5)*90, z=(R()-.5)*90; m.position.set(x,3+R()*12,z); m.userData={x,z,y:m.position.y,sp:R()*.5+.2}; g.add(m); vox.push(m); }
    anim.push(t=>vox.forEach((m,i)=>{ m.rotation.x=t*m.userData.sp; m.rotation.y=t*m.userData.sp*1.3; m.position.y=m.userData.y+Math.sin(t+i)*.6; }));
    // data cliffs at the rim: falling points
    const fall=[]; for(let i=0;i<700;i++){ const a=R()*Math.PI*2; fall.push(Math.cos(a)*(52+R()*4), R()*20, Math.sin(a)*(52+R()*4)); } const fp=pts(fall,latMat({color:DG,points:true,size:1.3,intensity:1,fogFar:80})); g.add(fp);
    anim.push(t=>{ fp.position.y=-((t*2)%4); });
    // ---- relay 4 core: red lattice tower + point-cloud sphere + braille-dashed rings ----
    const core=new THREE.Group(); const ta=[]; truss(ta,0,0,14,3.2,1.2,9,6); core.add(segs(ta,latMat({color:RED,intensity:.9,fogFar:120})));
    const sp=[]; sphereCloud(sp,0,17,0,3.4,700,R); const sph=pts(sp,latMat({color:RED,points:true,size:1.6,intensity:.7,fogFar:140})); core.add(sph);
    const crings=[]; for(let i=0;i<4;i++){ const a=[]; ring(a,0,0,0,4.5+i*1.6,72,2+i%2); const r=segs(a,latMat({color:i%2?RED:'#8c1e14',intensity:1.3,fogFar:140})); r.position.y=17; core.add(r); crings.push(r); }
    core.position.set(26,0,0); g.add(core); col.push({c:[26,0,3.5]});
    anim.push(t=>{ crings.forEach((r,i)=>{ r.rotation.x=t*(.4+i*.15)+i; r.rotation.z=t*(.3+i*.1)*(i%2?-1:1); }); sph.rotation.y=t*.3; const s=1+Math.sin(t*3)*.04; sph.scale.set(s,s,s); });
    // three voice pylons
    const pylons={}; [['p1',4,26],['p2',14,-24],['p3',36,20]].forEach(([id,x,z])=>{ const pg=new THREE.Group(); const a=[]; truss(a,0,0,7,.9,.25,6,3); const lines=segs(a,latMat({color:RED,intensity:1.1,fogFar:90}));
      const rr=[]; ring(rr,0,7.6,0,1.2,32,2); ring(rr,0,7.6,0,.6,24,1); const rings=segs(rr,latMat({color:RED,intensity:1.5,fogFar:90})); pg.add(lines,rings);
      const dead=segs(a,latMat({color:DG,intensity:.8,fogFar:90})); dead.visible=false; pg.add(dead);
      pg.position.set(x,h(x,z),z); g.add(pg); col.push({c:[x,z,1]}); pylons[id]={g:pg,lines,rings,dead,x,z}; anim.push(t=>{ rings.rotation.y=t*1.5; rings.position.y=Math.sin(t*2+x)*.3; }); });
    portal(g,-48,0,Math.PI/2); portal(g,48,0,Math.PI/2);
    Z.relay={ id:'relay', name:'the hollow', sub:'relay 4 · chorus', group:g, col, bounds:[-50,-50,50,50], h, anim, music:'relay',
      sky:{rain:.6,rainCol:'#8c1e14',hex:1,stars:.4}, spawn:{x:-40,z:0,yaw:Math.PI/2},
      portals:[{x:-48,z:0,r:3,to:'hub',sx:44,sz:0,syaw:-Math.PI/2,label:'relit city'},{x:48,z:0,r:3,to:'skyline',sx:-44,sz:30,syaw:Math.PI/2,label:'mode-7 skyline',lock:'skyline_open'}], objs:{ core, pylons } };
  }
  Z.hub.tag=[-44,-44]; Z.forest.tag=[-44,-30]; Z.relay.tag=[40,-40];
  return Z;
}
// collision: push a circle (x,z,r) out of colliders and keep inside bounds
export function collide(zone,p,r=.45){
  for(const c of zone.col){
    if(c.c){ const dx=p.x-c.c[0], dz=p.z-c.c[1], d=Math.hypot(dx,dz), m=c.c[2]+r; if(d<m&&d>1e-4){ p.x=c.c[0]+dx/d*m; p.z=c.c[1]+dz/d*m; } }
    else { const [x0,z0,x1,z1]=c.box; if(p.x>x0-r&&p.x<x1+r&&p.z>z0-r&&p.z<z1+r){ const dl=p.x-(x0-r), dr=(x1+r)-p.x, dt=p.z-(z0-r), db=(z1+r)-p.z; const m=Math.min(dl,dr,dt,db);
      if(m===dl)p.x=x0-r; else if(m===dr)p.x=x1+r; else if(m===dt)p.z=z0-r; else p.z=z1+r; } }
  }
  const b=zone.bounds; p.x=Math.max(b[0],Math.min(b[2],p.x)); p.z=Math.max(b[1],Math.min(b[3],p.z));
}
