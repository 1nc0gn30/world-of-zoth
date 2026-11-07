// Lattice geometry builders: grids, dot planes, wire boxes with window points, L-system trees, rings, trusses, point clouds.
import * as THREE from 'three';
import { latMat, solidMat, terrainMat } from './render.js';
export function rng(seed){ let s=seed>>>0||1; return ()=>{ s=(s*1664525+1013904223)>>>0; return s/4294967296; }; }
export function segs(arr, mat){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3)); g.computeBoundingSphere(); const l=new THREE.LineSegments(g,mat); l.frustumCulled=true; l.renderOrder=2; return l; }
export function pts(arr, mat, colors){ const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3)); if(colors) g.setAttribute('acol',new THREE.Float32BufferAttribute(colors,3)); g.computeBoundingSphere(); const p=new THREE.Points(g,mat); p.frustumCulled=true; p.renderOrder=2; return p; }
export function grid(x0,x1,z0,z1,step,hf,mat,sub=1){
  const a=[]; const ds=step/sub;
  for(let x=x0;x<=x1+1e-6;x+=step) for(let z=z0;z<z1-1e-6;z+=ds) a.push(x,hf(x,z),z, x,hf(x,z+ds),z+ds);
  for(let z=z0;z<=z1+1e-6;z+=step) for(let x=x0;x<x1-1e-6;x+=ds) a.push(x,hf(x,z),z, x+ds,hf(x+ds,z),z);
  const l=segs(a,mat);
  // Build a real textured 3D terrain mesh underneath the wireframe lattice
  const nx=Math.min(48,Math.max(4,Math.round((x1-x0)/step))), nz=Math.min(48,Math.max(4,Math.round((z1-z0)/step)));
  const tg=new THREE.BufferGeometry();
  const tv=[], ti=[];
  for(let iz=0;iz<=nz;iz++){
    const z=z0+(z1-z0)*(iz/nz);
    for(let ix=0;ix<=nx;ix++){
      const x=x0+(x1-x0)*(ix/nx);
      tv.push(x, hf(x,z)-0.03, z);
    }
  }
  for(let iz=0;iz<nz;iz++){
    for(let ix=0;ix<nx;ix++){
      const a0=iz*(nx+1)+ix, b0=a0+1, c0=a0+(nx+1), d0=c0+1;
      ti.push(a0,c0,b0, b0,c0,d0);
    }
  }
  tg.setAttribute('position',new THREE.Float32BufferAttribute(tv,3));
  tg.setIndex(ti);
  tg.computeBoundingSphere();
  const acc=(mat&&mat.uniforms&&mat.uniforms.color)?mat.uniforms.color.value:'#f5b82e';
  const fFar=(mat&&mat.uniforms&&mat.uniforms.fogFar)?mat.uniforms.fogFar.value:72;
  const tm=new THREE.Mesh(tg, terrainMat(acc, 10, fFar));
  tm.renderOrder=0;
  l.add(tm);
  return l;
}
export function dotPlane(x0,x1,z0,z1,step,hf,mat,yoff=0.02){ const a=[]; for(let x=x0;x<=x1;x+=step) for(let z=z0;z<=z1;z+=step) a.push(x,hf(x,z)+yoff,z); return pts(a,mat); }
const BOXE=[[0,0,0,1,0,0],[1,0,0,1,0,1],[1,0,1,0,0,1],[0,0,1,0,0,0],[0,1,0,1,1,0],[1,1,0,1,1,1],[1,1,1,0,1,1],[0,1,1,0,1,0],[0,0,0,0,1,0],[1,0,0,1,1,0],[1,0,1,1,1,1],[0,0,1,0,1,1]];
export function boxEdges(a,x,y,z,w,h,d){ for(const e of BOXE) a.push(x+(e[0]-.5)*w, y+e[1]*h, z+(e[2]-.5)*d, x+(e[3]-.5)*w, y+e[4]*h, z+(e[5]-.5)*d); }
// building: dark solid + gold edges + floor bands + window dots
export function building(group, x,z,w,d,h, R, {edge, band, win, solid}){
  const m=new THREE.Mesh(new THREE.BoxGeometry(w*.98,h*.995,d*.98), solid); m.position.set(x,h/2,z); m.renderOrder=0; group.add(m);
  const e=[]; boxEdges(e,x,0,z,w,h,d); group.add(segs(e,edge));
  const b=[]; for(let y=2.6;y<h-.5;y+=2.6){ if(R()<.5) continue; boxEdges(b,x,y,z,w*1.001,0,d*1.001); } if(b.length) group.add(segs(b.filter((v,i)=>true),band));
  const p=[]; const fx=Math.floor(w/1.1), fz=Math.floor(d/1.1);
  for(let y=1.2;y<h-.6;y+=1.3) { for(let i=0;i<fx;i++){ const px=x-w/2+(i+.5)*w/fx; if(R()<.35) p.push(px,y,z+d/2+.03); if(R()<.35) p.push(px,y,z-d/2-.03); }
    for(let i=0;i<fz;i++){ const pz=z-d/2+(i+.5)*d/fz; if(R()<.35) p.push(x+w/2+.03,y,pz); if(R()<.35) p.push(x-w/2-.03,y,pz); } }
  if(p.length) group.add(pts(p,win));
}
export function ring(a,cx,cy,cz,r,n=48,dash=1,ax='y'){ for(let i=0;i<n;i++){ if(dash>1 && i%dash) continue; const t0=i/n*Math.PI*2, t1=(i+1)/n*Math.PI*2;
  if(ax==='y') a.push(cx+Math.cos(t0)*r,cy,cz+Math.sin(t0)*r, cx+Math.cos(t1)*r,cy,cz+Math.sin(t1)*r);
  else if(ax==='z') a.push(cx+Math.cos(t0)*r,cy+Math.sin(t0)*r,cz, cx+Math.cos(t1)*r,cy+Math.sin(t1)*r,cz);
  else a.push(cx,cy+Math.sin(t0)*r,cz+Math.cos(t0)*r, cx,cy+Math.sin(t1)*r,cz+Math.cos(t1)*r); } return a; }
// lattice truss tower (relays, pylons)
export function truss(a,x,z,h,r0,r1,levels=8,sides=4){ for(let l=0;l<levels;l++){ const y0=l/levels*h, y1=(l+1)/levels*h, ra=r0+(r1-r0)*l/levels, rb=r0+(r1-r0)*(l+1)/levels;
  for(let s=0;s<sides;s++){ const t0=s/sides*Math.PI*2+Math.PI/4, t1=(s+1)/sides*Math.PI*2+Math.PI/4;
    const A=[x+Math.cos(t0)*ra,y0,z+Math.sin(t0)*ra], B=[x+Math.cos(t1)*ra,y0,z+Math.sin(t1)*ra], C=[x+Math.cos(t0)*rb,y1,z+Math.sin(t0)*rb], D=[x+Math.cos(t1)*rb,y1,z+Math.sin(t1)*rb];
    a.push(...A,...C, ...A,...B, ...A,...D, ...B,...C); } } return a; }
// L-system-ish branching tree: returns segments + leaf points
export function tree(a,lp,x,y,z,R,size=1){
  function br(px,py,pz,dx,dy,dz,len,depth){ const nx=px+dx*len, ny=py+dy*len, nz=pz+dz*len; a.push(px,py,pz,nx,ny,nz);
    if(depth<=0||len<.25){ for(let i=0;i<5;i++) lp.push(nx+(R()-.5)*.9*size,ny+(R()-.3)*.7*size,nz+(R()-.5)*.9*size); return; }
    const n=depth>2?3:2; for(let i=0;i<n;i++){ const ang=R()*Math.PI*2, spread=.45+R()*.35; let ddx=dx+Math.cos(ang)*spread, ddy=dy+.15, ddz=dz+Math.sin(ang)*spread; const l=Math.hypot(ddx,ddy,ddz); br(nx,ny,nz,ddx/l,ddy/l,ddz/l,len*(.62+R()*.15),depth-1); } }
  br(x,y,z,0,1,0,1.6*size,4);
}
export function sphereCloud(a,cx,cy,cz,r,n,R){ for(let i=0;i<n;i++){ const u=R()*2-1, t=R()*Math.PI*2, s=Math.sqrt(1-u*u); a.push(cx+s*Math.cos(t)*r, cy+u*r, cz+s*Math.sin(t)*r); } return a; }
export function wireOcta(a,r,cx=0,cy=0,cz=0){ const v=[[r,0,0],[-r,0,0],[0,r,0],[0,-r,0],[0,0,r],[0,0,-r]]; const E=[[0,2],[0,3],[0,4],[0,5],[1,2],[1,3],[1,4],[1,5],[2,4],[4,3],[3,5],[5,2]]; for(const [i,j] of E) a.push(cx+v[i][0],cy+v[i][1],cz+v[i][2],cx+v[j][0],cy+v[j][1],cz+v[j][2]); return a; }
export function wireIco(a,r,cx=0,cy=0,cz=0){ const g=new THREE.IcosahedronGeometry(r,0); const e=new THREE.EdgesGeometry(g); const p=e.attributes.position.array; for(let i=0;i<p.length;i+=3) a.push(p[i]+cx,p[i+1]+cy,p[i+2]+cz); return a; }
export { latMat, solidMat };
