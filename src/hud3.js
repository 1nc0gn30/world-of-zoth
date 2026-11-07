// v0.3 HUD: top compass strip, minimap extras (buildings, fog, waypoint) and the full-screen map (pan / zoom / fog of war / waypoint).
// Data lives in localStorage keys woz.fog / woz.wp so later phases (house, AI side quests) can add their own marker sources via G.hud3.sources.
import * as UI from './ui.js';
import { P } from './pal.js';
import { IN, took } from './input.js';
import { sfx } from './audio.js';
const FN=40; const LARGE3=()=>innerWidth<1000||/android=1/.test(location.search); // fog cells per axis per zone
export function initHud3(G, api){
  const H=G.hud3={ sources:[] };
  let fog={}; try{ const o=JSON.parse(localStorage.getItem('woz.fog')||'{}'); for(const k in o) fog[k]=Uint8Array.from(atob(o[k]),c=>c.charCodeAt(0)); }catch(e){}
  try{ G.waypoint=JSON.parse(localStorage.getItem('woz.wp')||'null'); }catch(e){ G.waypoint=null; }
  const saveFog=()=>{ try{ const o={}; for(const k in fog) o[k]=btoa(String.fromCharCode(...fog[k])); localStorage.setItem('woz.fog',JSON.stringify(o)); localStorage.setItem('woz.wp',JSON.stringify(G.waypoint)); }catch(e){} };
  H.resetFog=()=>{ fog={}; G.waypoint=null; saveFog(); };
  const B=z=>G.Z[z].bounds||[-50,-50,50,50];
  const cell=(z,x,zz)=>{ const b=B(z); return [Math.floor((x-b[0])/(b[2]-b[0])*FN), Math.floor((zz-b[1])/(b[3]-b[1])*FN)]; };
  H.seen=(z,x,zz)=>{ const f=fog[z]; if(!f) return false; const [i,j]=cell(z,x,zz); return i>=0&&j>=0&&i<FN&&j<FN&&f[j*FN+i]>0; };
  let acc=0;
  H.update=dt=>{ const p=api.player().group.position, z=G.zoneId; if(!z||!G.Z[z]) return; const f=fog[z]||(fog[z]=new Uint8Array(FN*FN)); const [ci,cj]=cell(z,p.x,p.z); const b=B(z); const rc=Math.ceil(12/((b[2]-b[0])/FN));
    for(let j=cj-rc;j<=cj+rc;j++) for(let i=ci-rc;i<=ci+rc;i++){ if(i<0||j<0||i>=FN||j>=FN) continue; if((i-ci)**2+(j-cj)**2<=rc*rc) f[j*FN+i]=1; }
    acc+=dt; if(acc>3){ acc=0; saveFog(); } };
  H.explored=z=>{ const f=fog[z]; if(!f) return 0; let n=0; for(const v of f) n+=v; return n/(FN*FN); };
  // ---- A* / BFS obstacle-avoiding grid pathfinder for the 3D Golden Mission Trail ----
  H.findPath=(zone,sx,sz,tx,tz)=>{
    if(!zone) return [[sx,sz],[tx,tz]];
    const b=zone.bounds||[-55,-55,55,55], GN=52, bw=b[2]-b[0], bh=b[3]-b[1], cw=bw/GN, ch=bh/GN;
    const toCell=(x,z)=>[Math.max(0,Math.min(GN-1,Math.floor((x-b[0])/cw))), Math.max(0,Math.min(GN-1,Math.floor((z-b[1])/ch)))];
    const toWorld=(i,j)=>[b[0]+(i+.5)*cw, b[1]+(j+.5)*ch];
    const blocked=(wx,wz)=>{
      if(Math.hypot(wx-sx,wz-sz)<2.2||Math.hypot(wx-tx,wz-tz)<2.4) return false;
      for(const c of (zone.col||[])){
        if(c.box){ const [x0,z0,x1,z1]=c.box; if(wx>=x0-.65&&wx<=x1+.65&&wz>=z0-.65&&wz<=z1+.65) return true; }
        else if(c.c){ if(Math.hypot(wx-c.c[0],wz-c.c[1])<=c.c[2]+.65) return true; }
      }
      return false;
    };
    const [si,sj]=toCell(sx,sz), [ti,tj]=toCell(tx,tz);
    const los=(ax,az,bx,bz)=>{ const d=Math.hypot(bx-ax,bz-az), n=Math.max(2,Math.ceil(d/.9)); for(let k=1;k<n;k++){ const u=k/n; if(blocked(ax+(bx-ax)*u,az+(bz-az)*u)) return false; } return true; };
    let raw=[[sx,sz],[tx,tz]];
    if(!los(sx,sz,tx,tz)){
      const vis=new Uint8Array(GN*GN), prev=new Int32Array(GN*GN).fill(-1);
      const q=[sj*GN+si]; vis[sj*GN+si]=1; let best=sj*GN+si, bestD=1e9;
      const dirs=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
      let head=0;
      while(head<q.length){
        const cur=q[head++], ci=cur%GN, cj=(cur/GN)|0;
        const d=Math.hypot(ci-ti,cj-tj); if(d<bestD){ bestD=d; best=cur; }
        if(ci===ti&&cj===tj){ best=cur; break; }
        for(const [di,dj] of dirs){
          const ni=ci+di, nj=cj+dj; if(ni<0||nj<0||ni>=GN||nj>=GN) continue;
          const nk=nj*GN+ni; if(vis[nk]) continue;
          const [wx,wz]=toWorld(ni,nj); if(blocked(wx,wz)) continue;
          vis[nk]=1; prev[nk]=cur; q.push(nk);
        }
      }
      const cells=[]; let c=best; while(c!==-1){ cells.push(toWorld(c%GN,(c/GN)|0)); c=prev[c]; }
      cells.reverse(); cells[0]=[sx,sz]; cells[cells.length-1]=[tx,tz];
      // string-pull smoothing
      const sm=[cells[0]]; let idx=0;
      while(idx<cells.length-1){
        let next=idx+1;
        for(let probe=cells.length-1;probe>idx+1;probe--){ if(los(cells[idx][0],cells[idx][1],cells[probe][0],cells[probe][1])){ next=probe; break; } }
        sm.push(cells[next]); idx=next;
      }
      raw=sm;
    }
    // subdivide into 1.25m steps for smooth terrain hugging & animated chevrons
    const pts=[[sx,sz]];
    for(let i=0;i<raw.length-1;i++){
      const [ax,az]=raw[i], [bx,bz]=raw[i+1], segD=Math.hypot(bx-ax,bz-az), steps=Math.max(1,Math.ceil(segD/1.25));
      for(let s=1;s<=steps;s++){ const u=s/steps; pts.push([ax+(bx-ax)*u, az+(bz-az)*u]); }
    }
    return pts;
  };
  // ---- markers shared by compass / minimap / map ----
  H.markers=()=>{ const L=[], z=G.zoneId; const q=api.trackQuest(); const m=q&&api.markFor(q);
    if(m){ if(m[0]===z) L.push({x:m[1],z:m[2],col:P.GD,kind:'mission',label:'mission'}); else { const po=api.portalToward(m[0]); if(po) L.push({x:po.x,z:po.z,col:P.GD,kind:'mission',label:'to '+G.Z[m[0]].name}); } }
    if(G.waypoint){ if(G.waypoint.zone===z) L.push({x:G.waypoint.x,z:G.waypoint.z,col:P.BONE,kind:'wp',label:'waypoint'}); else { const po=api.portalToward(G.waypoint.zone); if(po) L.push({x:po.x,z:po.z,col:P.BONE,kind:'wp',label:'waypoint (via)'}); } }
    (G.Z[z].checkpoints||[]).forEach(c=>L.push({x:c[0],z:c[1],col:'#7fd1c8',kind:'cp',label:c[2]}));
    G.zone.portals.forEach(po=>L.push({x:po.x,z:po.z,col:P.DG,kind:'portal',label:po.label||G.Z[po.to].name,locked:po.lock&&!G.flags[po.lock]}));
    H.sources.forEach(fn=>fn(z).forEach(o=>L.push(o)));
    return L; };
  // ---- compass strip ----
  H.compass=t=>{ const X=UI.ctx, cx=480, w=460, y=6, h=40, fov=2.4; const yaw=G.cam.yaw; const vb=Math.atan2(-Math.sin(yaw),Math.cos(yaw)); // bearing the camera faces (north = -z)
    X.fillStyle='rgba(6,5,4,.78)'; X.fillRect(cx-w/2,y,w,h); X.strokeStyle=P.DDG; X.lineWidth=1; X.strokeRect(cx-w/2+.5,y+.5,w,h);
    const toX=b=>{ let r=b-vb; r=Math.atan2(Math.sin(r),Math.cos(r)); return Math.abs(r)>fov/2?null:cx+r/(fov/2)*(w/2-8); };
    for(let d=0;d<360;d+=15){ const x=toX(d*Math.PI/180); if(x==null) continue; const major=d%90===0, mid=d%45===0; X.fillStyle=major?P.GD:P.DG; X.fillRect(Math.round(x),y+h-(major?10:mid?7:4),1,major?10:mid?7:4);
      if(major) UI.text('NESW'[d/90],x,y+2,P.GD,2,'center'); else if(mid) UI.text(['NE','SE','SW','NW'][(d-45)/90],x,y+8,P.DG,1,'center'); }
    const p=api.player().group.position;
    H.markers().forEach(mk=>{ if(mk.kind==='portal'&&Math.hypot(mk.x-p.x,mk.z-p.z)>40) return; const b=Math.atan2(mk.x-p.x,-(mk.z-p.z)); let x=toX(b); const off=x==null; if(off){ if(mk.kind!=='mission'&&mk.kind!=='wp') return; let r=b-vb; r=Math.atan2(Math.sin(r),Math.cos(r)); x=cx+Math.sign(r)*(w/2-6); }
      X.fillStyle=mk.col; const s=mk.kind==='mission'||mk.kind==='wp'?5:3; X.beginPath(); X.moveTo(x,y+h+1-s*2); X.lineTo(x+s,y+h+1-s); X.lineTo(x,y+h+1); X.lineTo(x-s,y+h+1-s); X.fill();
      if((mk.kind==='mission'||mk.kind==='wp')&&!(mk.kind==='mission'&&Math.floor(t*2)%4===3)){ const d=Math.round(Math.hypot(mk.x-p.x,mk.z-p.z)); UI.text(`${d}m`,x,y+h+4,mk.col,LARGE3()?2:1,'center'); } });
    X.fillStyle=P.BONE; X.fillRect(cx,y-2,1,5); UI.text(String(Math.round(((vb*180/Math.PI)+360)%360)).padStart(3,'0'),cx+w/2+6,y+12,P.GD,2); };
  // ---- minimap extras: buildings (only explored), fog ring, waypoint ----
  H.radarUnder=(X,rx,ry,rr,scale,yaw,p)=>{ X.save(); X.beginPath(); X.arc(rx,ry,rr-1,0,7); X.clip(); X.translate(rx,ry); X.rotate(yaw); X.scale(scale,scale); X.translate(-p.x,-p.z);
    X.strokeStyle='rgba(138,101,20,.55)'; X.lineWidth=1/scale; for(const c of G.zone.col){ if(c.box){ const [x0,z0,x1,z1]=c.box; if(!H.seen(G.zoneId,(x0+x1)/2,(z0+z1)/2)) continue; X.strokeRect(x0,z0,x1-x0,z1-z0); } }
    const b=B(G.zoneId), cw=(b[2]-b[0])/FN, chh=(b[3]-b[1])/FN, f=fog[G.zoneId]; X.fillStyle='rgba(6,5,4,.6)'; if(f){ X.beginPath(); for(let j=0;j<FN;j++) for(let i=0;i<FN;i++) if(!f[j*FN+i]) X.rect(b[0]+i*cw,b[1]+j*chh,cw+.05,chh+.05); X.fill(); }
    X.restore(); };
  // ---- full-screen map ----
  const MV={z:null,cx:0,cz:0,zoom:1};
  H.open=()=>{ MV.z=G.zoneId; const p=api.player().group.position; MV.cx=p.x; MV.cz=p.z; MV.zoom=1; G.mapPrev=G.mode; G.mode='map'; sfx('confirm'); };
  const zlist=()=>Object.keys(G.Z).filter(z=>!G.Z[z].secret||G.flags['seen_'+z]);
  const S=()=>{ const b=B(MV.z); const base=Math.min(600/(b[2]-b[0]),470/(b[3]-b[1])); return base*MV.zoom; };
  const toS=(x,z)=>{ const s=S(); return [330+(x-MV.cx)*s, 280+(z-MV.cz)*s]; };
  const toW=(sx,sy)=>{ const s=S(); return [MV.cx+(sx-330)/s, MV.cz+(sy-280)/s]; };
  H.setWaypoint=(z,x,zz)=>{ G.waypoint={zone:z,x,z:zz}; saveFog(); G.toast('> waypoint set ('+G.Z[z].name+')',P.BONE); sfx('confirm'); };
  H.clearWaypoint=()=>{ G.waypoint=null; saveFog(); G.toast('> waypoint cleared',P.DG); sfx('cancel'); };
  H.mapUpdate=dt=>{ if(took('back')||took('map')||took('pause')){ G.mode='explore'; sfx('cancel'); return; }
    const sp=60/S()*dt*4; if(IN.held.has('left')) MV.cx-=sp; if(IN.held.has('right')) MV.cx+=sp; if(IN.held.has('up')) MV.cz-=sp; if(IN.held.has('down')) MV.cz+=sp;
    if(IN.stick.active){ MV.cx+=IN.stick.x*sp; MV.cz+=IN.stick.y*sp; }
    if(IN.drag.dx||IN.drag.dy){ const s=S(); MV.cx-=IN.drag.dx/s; MV.cz-=IN.drag.dy/s; }
    if(IN.wheel) MV.zoom=Math.max(.6,Math.min(5,MV.zoom*(IN.wheel<0?1.15:1/1.15))); if(IN.held.has('rotl')) MV.zoom=Math.min(5,MV.zoom*(1+dt)); if(IN.held.has('rotr')) MV.zoom=Math.max(.6,MV.zoom/(1+dt));
    const zl=zlist(), zi=zl.indexOf(MV.z); if(took('n1')||took('quests')){ MV.z=zl[(zi+zl.length-1)%zl.length]; MV.cx=MV.cz=0; MV.zoom=1; sfx('move'); } if(took('n2')||took('items')){ MV.z=zl[(zi+1)%zl.length]; MV.cx=MV.cz=0; MV.zoom=1; sfx('move'); }
    const clicks=IN.clicks.splice(0); for(const c of clicks){ if(c.x>660){ const i=Math.floor((c.y-64)/22); if(i>=0&&i<zl.length&&(G.flags['seen_'+zl[i]]||zl[i]==='hub')){ MV.z=zl[i]; MV.cx=MV.cz=0; MV.zoom=1; sfx('move'); } continue; } if(c.y>500) continue; const [wx,wz]=toW(c.x,c.y); placeAt(wx,wz); }
    if(took('confirm')) placeAt(MV.cx,MV.cz);
    if(took('dash')&&G.waypoint) H.clearWaypoint(); };
  function placeAt(wx,wz){ if(G.waypoint&&G.waypoint.zone===MV.z&&Math.hypot(G.waypoint.x-wx,G.waypoint.z-wz)<4) H.clearWaypoint(); else H.setWaypoint(MV.z,wx,wz); }
  H.mapDraw=t=>{ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540); const z=MV.z, Z=G.Z[z], b=B(z), s=S();
    X.save(); X.beginPath(); X.rect(20,40,620,470); X.clip();
    // lattice grid
    X.strokeStyle='rgba(60,44,10,.8)'; X.lineWidth=1; for(let gx=Math.ceil(b[0]/10)*10;gx<=b[2];gx+=10){ const [a]=toS(gx,0); X.beginPath(); X.moveTo(a,toS(0,b[1])[1]); X.lineTo(a,toS(0,b[3])[1]); X.stroke(); } for(let gz=Math.ceil(b[1]/10)*10;gz<=b[3];gz+=10){ const [,c]=toS(0,gz); X.beginPath(); X.moveTo(toS(b[0],0)[0],c); X.lineTo(toS(b[2],0)[0],c); X.stroke(); }
    const [bx0,by0]=toS(b[0],b[1]), [bx1,by1]=toS(b[2],b[3]); X.strokeStyle=P.DG; X.strokeRect(bx0,by0,bx1-bx0,by1-by0);
    // buildings (explored only), dotted
    X.fillStyle='rgba(138,101,20,.35)'; X.strokeStyle=P.DG; (Z.col||[]).forEach(c=>{ if(c.box){ const [x0,z0,x1,z1]=c.box; if(!H.seen(z,(x0+x1)/2,(z0+z1)/2)) return; const [a,bq]=toS(x0,z0), [c2,d]=toS(x1,z1); X.fillRect(a,bq,c2-a,d-bq); X.strokeRect(a+.5,bq+.5,c2-a,d-bq); } else if(c.c){ if(!H.seen(z,c.c[0],c.c[1])) return; const [a,bq]=toS(c.c[0],c.c[1]); X.beginPath(); X.arc(a,bq,Math.max(1,c.c[2]*s),0,7); X.fill(); } });
    // fog of war: braille-ish dither over unexplored cells
    const f=fog[z], cw=(b[2]-b[0])/FN, chh=(b[3]-b[1])/FN; if(!H.pat){ const c=document.createElement('canvas'); c.width=c.height=8; const x=c.getContext('2d'); x.fillStyle='rgba(6,5,4,.94)'; x.fillRect(0,0,8,8); x.fillStyle='#3c2c0a'; [[1,1],[5,1],[3,5],[7,5]].forEach(([a,bb])=>x.fillRect(a,bb,1,1)); H.pat=X.createPattern(c,'repeat'); }
    X.beginPath(); for(let j=0;j<FN;j++) for(let i=0;i<FN;i++){ if(f&&f[j*FN+i]) continue; const [a,bq]=toS(b[0]+i*cw,b[1]+j*chh); X.rect(a,bq,cw*s+1,chh*s+1); } X.fillStyle=H.pat; X.fill();
    // markers
    const draw=(x,zz,col,lbl,big)=>{ const [a,bq]=toS(x,zz); X.fillStyle=col; const r=big?6:4; X.beginPath(); X.moveTo(a,bq-r); X.lineTo(a+r,bq); X.lineTo(a,bq+r); X.lineTo(a-r,bq); X.fill(); if(lbl) UI.text(lbl,a+8,bq-5,col); };
    Z.portals.forEach(po=>draw(po.x,po.z,po.lock&&!G.flags[po.lock]?P.DDG:P.DG,(G.flags['seen_'+po.to]||po.to==='hub')?G.Z[po.to].name:'???'));
    (Z.checkpoints||[]).forEach(c=>draw(c[0],c[1],'#7fd1c8',c[2]));
    H.sources.forEach(fn=>fn(z).forEach(o=>draw(o.x,o.z,o.col,o.label)));
    const q=api.trackQuest(), m=q&&api.markFor(q); if(m&&m[0]===z&&Math.floor(t*3)%3) draw(m[1],m[2],P.GD,'mission',true);
    if(z===G.zoneId&&G.navPts&&G.navPts.length>1){ X.strokeStyle=P.GD; X.lineWidth=2; X.setLineDash([5,4]); X.beginPath(); G.navPts.forEach(([px,pz],i)=>{ const [sx,sy]=toS(px,pz); if(i===0) X.moveTo(sx,sy); else X.lineTo(sx,sy); }); X.stroke(); X.setLineDash([]); X.lineWidth=1; }
    if(G.waypoint&&G.waypoint.zone===z){ const [a,bq]=toS(G.waypoint.x,G.waypoint.z); X.strokeStyle=P.BONE; X.lineWidth=2; X.beginPath(); X.arc(a,bq,7+Math.sin(t*5)*2,0,7); X.stroke(); X.lineWidth=1; UI.text('waypoint',a+10,bq+4,P.BONE); }
    if(z===G.zoneId){ const p=api.player().group.position, [a,bq]=toS(p.x,p.z); const yaw=G.cam.yaw; X.save(); X.translate(a,bq); X.rotate(-yaw+Math.PI); X.fillStyle=P.BONE; X.beginPath(); X.moveTo(0,-7); X.lineTo(-5,5); X.lineTo(5,5); X.fill(); X.restore(); UI.text('you',a+8,bq+6,P.BONE); }
    // cursor
    X.strokeStyle=P.GD; X.beginPath(); X.moveTo(322,280); X.lineTo(338,280); X.moveTo(330,272); X.lineTo(330,288); X.stroke();
    X.restore();
    UI.box(20,8,620,28); UI.text('> map  '+Z.name+'  ·  explored '+Math.round(H.explored(z)*100)+'%',32,15,P.GD); UI.text('N^',628,15,P.DG,1,'right');
    // zone list
    UI.box(656,40,288,470); UI.text('> districts',670,48,P.GD); zlist().forEach((zz,i)=>{ const known=G.flags['seen_'+zz]||zz==='hub'; const yy=64+i*22; if(zz===MV.z){ X.fillStyle='rgba(245,184,46,.15)'; X.fillRect(660,yy-2,280,20); } UI.text((known?G.Z[zz].name:'???')+(known?'  '+Math.round(H.explored(zz)*100)+'%':''),670,yy+2,known?(zz===G.zoneId?P.BONE:P.DG):P.DDG); });
    UI.text(IN.touch?'drag pan · tap set/clear waypoint · tap a district · B close':'arrows pan · Q/R or wheel zoom · enter set/clear waypoint · C clear · 1/2 district · M/esc close',480,522,P.DG,1,'center'); };
}
