// Safehouse: small lattice interior with a grid decorate mode (32-piece catalog), boss/egg trophies, visiting crew, Forge terminal.
import * as THREE from 'three';
import * as UI from './ui.js';
import { P } from './pal.js';
import { took, IN } from './input.js';
import { segs, latMat } from './geo.js';
import { ZPAL, spriteCanvas } from './zgl.js';
const GW=14, GH=10, X0=-7, Z0=-5; // grid cells (1 m), room interior x -7..7, z -5..5
// shape kinds: box w,d,h | cyl r,h | rug | panel (wall poster) | lamp | plant | stack | orb | shelf | screen
export const CATALOG=[
 ['bed','bed','box',2,1,.5],['cot','cot','box',1,2,.4],['desk','desk','box',2,1,.8],['table','table','box',1,1,.75],['bench','bench','box',2,.5,.45],
 ['chair','chair','box',.6,.6,.9],['stool','stool','cyl',.3,.5],['crate','crate','box',.8,.8,.8],['crates','crate stack','stack',.8,.8,1.6],['shelf','shelf','shelf',2,.4,1.8],
 ['locker','locker','box',.7,.6,2],['server','server rack','box',.8,.8,2.2],['terminal','old terminal','screen',.8,.6,1],['monitor','monitor wall','screen',2,.3,1.6],['scope','oscilloscope','screen',.7,.5,.6],
 ['lamp','lattice lamp','lamp',.3,1.6],['lantern','foxfire lantern','lamp',.25,.8],['orb','braille orb','orb',.4],['halo','quorum halo','orb',.6],['plant','dither plant','plant',.4,1.2],
 ['tree','bonsai tree','plant',.6,1.8],['rug','braille rug','rug',3,2],['mat','dot mat','rug',1,1],['hexrug','hex rug','rug',2,2],['poster_z','Z poster','panel',1.2,1.2],
 ['poster_0612','06:12 poster','panel',1,1.4],['clock','sand clock','cyl',.25,1.2],['anvil','mini anvil','box',.6,.4,.5],['tower','relay model','cyl',.2,2.4],['pillar','mirror pillar','cyl',.35,2.6],
 ['speaker','speaker','box',.5,.5,1.1],['beanbag','beanbag','orb',.5],['hammock','hammock','box',2,.6,.9],['window','fake window','panel',1.6,1.2],
].map(([id,name,shape,a,b,c])=>({id,name,shape,a,b,c}));
const TROPHY=[['boss_copy','copy shard'],['boss_relay4','relay core'],['boss_sandglass','sand glass'],['boss_hunter','hunter eye'],['boss_blank','blank cursor'],['boss_archon','archon halo'],['konami','arcade key'],['rooftop','sunrise photo'],['handshake','lissajous'],['tags','red tags'],['tutorial','first light'],['academy','academy cert']];
export function initHouse(G, api){
  const H=G.house={ layout:[], tint:{}, wall:'grid', cloak:'none', trim:null, aura:'none', sprites:{} };
  try{ const o=JSON.parse(localStorage.getItem('woz.house')||'null'); if(o) Object.assign(H,o); }catch(e){}
  H.save=()=>{ try{ localStorage.setItem('woz.house',JSON.stringify({layout:H.layout,tint:H.tint,wall:H.wall,cloak:H.cloak,trim:H.trim,aura:H.aura,sprites:H.sprites})); }catch(e){} };
  const g=new THREE.Group(); g.visible=false; api.scene.add(g); const deco=new THREE.Group(); g.add(deco); const room=new THREE.Group(); g.add(room);
  const col=[{box:[-9,-7,9,-5.2]},{box:[-9,5.2,9,7]},{box:[-9,-7,-7.2,7]},{box:[7.2,-7,9,7]}];
  const C=i=>ZPAL[i]||null;
  function buildRoom(){ room.clear(); const fl=C(H.tint.floor)||P.DDG, wc=C(H.tint.wall)||P.DG, tr=C(H.tint.trim)||P.GD;
    const f=[]; for(let x=-7;x<=7;x++) f.push(x,0,-5,x,0,5); for(let z=-5;z<=5;z++) f.push(-7,0,z,7,0,z); room.add(segs(f,latMat({color:fl,intensity:1.2,fogFar:60})));
    const w=[]; const pat=H.wall; const step=pat==='plain'?3.5:pat==='hex'?.7:1;
    for(const [ax,az,bx,bz] of [[-7,-5,7,-5],[-7,-5,-7,5],[7,-5,7,5]]){ const L=Math.hypot(bx-ax,bz-az); for(let s=0;s<=L+.01;s+=step){ const x=ax+(bx-ax)*s/L, z=az+(bz-az)*s/L; w.push(x,0,z,x,3.2,z); } for(let y=0;y<=3.2;y+=pat==='dots'?.4:pat==='braille'?.25:.8) w.push(ax,y,az,bx,y,bz); }
    room.add(segs(w,latMat({color:wc,intensity:pat==='rain'?1.3:.8,wobble:pat==='rain'?.05:0,fogFar:60})));
    const t=[]; t.push(-7,3.2,-5,7,3.2,-5, -7,0.02,-5,7,0.02,-5, -1,0,5,-1,2.4,5, 1,0,5,1,2.4,5, -1,2.4,5,1,2.4,5); room.add(segs(t,latMat({color:tr,intensity:1.4})));
    // trophy shelf on the back wall
    const sh=[]; for(const y of [1.2,1.9]) sh.push(-6.6,y,-4.85,-2.2,y,-4.85); room.add(segs(sh,latMat({color:P.DG,intensity:1})));
    let k=0; TROPHY.forEach(([f,name])=>{ if(!(G.achGot&&G.achGot[f])&&!G.flags[f]) return; const x=-6.2+(k%6)*.75, y=k<6?1.22:1.92; k++; const v=[]; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2, b=(i+1)/8*Math.PI*2; v.push(x+Math.cos(a)*.18,y+.22+Math.sin(a)*.18,-4.8,x+Math.cos(b)*.18,y+.22+Math.sin(b)*.18,-4.8); } v.push(x,y,-4.8,x,y+.04,-4.8); room.add(segs(v,latMat({color:f.startsWith('boss')?P.GD:P.BONE,intensity:1.6}))); });
    H.trophies=k; }
  function meshFor(it,x,z,rot){ const c=CATALOG.find(c=>c.id===it.id); const v=[]; const m=new THREE.Group(); if(!c&&!it.id.startsWith('poster:')) return m;
    const box=(w,d,h,y0=0)=>{ const a=w/2,b=d/2; const P8=[[-a,-b],[a,-b],[a,b],[-a,b]]; for(let i=0;i<4;i++){ const [x1,z1]=P8[i],[x2,z2]=P8[(i+1)%4]; v.push(x1,y0,z1,x2,y0,z2, x1,y0+h,z1,x2,y0+h,z2, x1,y0,z1,x1,y0+h,z1); } for(let s=-a+.2;s<a;s+=.25) v.push(s,y0+h,-b,s,y0+h,b); };
    const cyl=(r,h)=>{ for(let i=0;i<10;i++){ const a=i/10*Math.PI*2,b=(i+1)/10*Math.PI*2; for(const y of [0,h]) v.push(Math.cos(a)*r,y,Math.sin(a)*r,Math.cos(b)*r,y,Math.sin(b)*r); if(i%2==0) v.push(Math.cos(a)*r,0,Math.sin(a)*r,Math.cos(a)*r,h,Math.sin(a)*r); } };
    let color=P.GD;
    if(it.id.startsWith('poster:')){ const s=H.sprites[it.id.slice(7)]; if(s){ const cv=spriteCanvas(s,4); const tx=new THREE.CanvasTexture(cv); tx.magFilter=THREE.NearestFilter; const pl=new THREE.Mesh(new THREE.PlaneGeometry(1.4,1.4*s.h/s.w),new THREE.MeshBasicMaterial({map:tx,transparent:true})); pl.position.set(0,1.4,0); m.add(pl); box(1.6,.05,1.6*s.h/s.w+.2,.6); color=P.DG; } }
    else if(c.shape==='box') box(c.a,c.b,c.c); else if(c.shape==='stack'){ box(c.a,c.b,c.c/2); box(c.a*.9,c.b*.9,c.c/2,c.c/2); } else if(c.shape==='shelf'){ box(c.a,c.b,c.c); for(let y=.45;y<c.c;y+=.45) v.push(-c.a/2,y,0,c.a/2,y,0); }
    else if(c.shape==='screen'){ box(c.a,c.b,c.c); for(let y=.2;y<c.c-.1;y+=.12) v.push(-c.a/2+.05,y,c.b/2+.01,c.a/2-.05,y,c.b/2+.01); color=P.BONE; }
    else if(c.shape==='cyl') cyl(c.a,c.b); else if(c.shape==='lamp'){ cyl(.08,c.b); cyl(c.a,.05); v.push(0,c.b,0,0,c.b+.3,0); color='#ffd27a'; }
    else if(c.shape==='orb'){ for(let i=0;i<14;i++){ const a=i/14*Math.PI*2,b=(i+1)/14*Math.PI*2; v.push(Math.cos(a)*c.a,c.a+Math.sin(a)*c.a,0,Math.cos(b)*c.a,c.a+Math.sin(b)*c.a,0, Math.cos(a)*c.a,c.a,Math.sin(a)*c.a,Math.cos(b)*c.a,c.a,Math.sin(b)*c.a); } }
    else if(c.shape==='plant'){ v.push(0,0,0,0,c.b*.5,0); for(let i=0;i<7;i++){ const a=i/7*Math.PI*2; v.push(0,c.b*.5,0,Math.cos(a)*c.a,c.b*(.7+.3*Math.sin(i*2.3)),Math.sin(a)*c.a); } color='#4ade80'; }
    else if(c.shape==='rug'){ for(let s=-c.a/2;s<=c.a/2+.01;s+=.25) v.push(s,.02,-c.b/2,s,.02,c.b/2); for(let s=-c.b/2;s<=c.b/2+.01;s+=.5) v.push(-c.a/2,.02,s,c.a/2,.02,s); color=P.DG; }
    else if(c.shape==='panel'){ box(c.a,.05,c.b,.8); for(let y=1;y<.8+c.b;y+=.15) v.push(-c.a/2+.1,y,.03,c.a/2-.1,y,.03); }
    if(v.length) m.add(segs(v,latMat({color,intensity:1.2,fogFar:60}))); m.position.set(x,0,z); m.rotation.y=-rot*Math.PI/180; return m; }
  function buildDeco(){ deco.clear(); H.layout.forEach(it=>deco.add(meshFor(it,X0+it.x+.5,Z0+it.y+.5,it.rot))); }
  H.rebuild=()=>{ buildRoom(); buildDeco(); };
  G.Z.house={ id:'house', name:'safehouse', sub:'faces first', group:g, col, bounds:[-7,-5,7,5], h:()=>0, anim:[], music:'forest', lvl:1, secret:true,
    sky:{rain:0,rainCol:'#3c2c0a',hex:0,stars:0}, spawn:{x:0,z:4,yaw:Math.PI}, portals:[], objs:{}, checkpoints:[[0,-3,'forge terminal']] };
  H.rebuild();
  // door in the city (hub) + interactables inside
  H.door={x:-9,z:9};
  H.unlocked=()=>G.qdone_('q1')||G.isFlag('house_open');
  H.inter=()=>{ const L=[]; if(G.zoneId==='hub'&&H.unlocked()) L.push({x:H.door.x,z:H.door.z,r:2,label:'enter  safehouse',col:P.GD,act:()=>G.goZone('house',0,4,Math.PI)});
    if(G.zoneId==='hub'&&!H.unlocked()) L.push({x:H.door.x,z:H.door.z,r:2,label:'safehouse (locked: finish "faces, not voices")',col:P.DDG,act:()=>G.toast('> the door wants a face it knows. finish the first mission.',P.DG)});
    if(G.zoneId==='house'){ L.push({x:0,z:5,r:1.6,label:'door  to the city',col:P.DG,act:()=>G.goZone('hub',H.door.x+1.2,H.door.z+1.2,0)}); L.push({x:0,z:-3.6,r:1.8,label:'forge  terminal (ZGL)',col:P.GD,act:()=>G.openForge()}); L.push({x:5.5,z:3.5,r:1.6,label:'decorate',col:P.BONE,act:()=>G.decorate()}); L.push({x:-5.5,z:3.5,r:1.6,label:'jukebox  (17 tracks)',col:P.GD,act:()=>G.openJukebox()}); L.push({x:-2.2,z:.5,r:1.8,label:'crew  banter (synergy)',col:'#22d3ee',act:()=>G.openBanter()}); }
    return L; };
  G.hud3&&G.hud3.sources.push(z=>z==='hub'?[{x:H.door.x,z:H.door.z,col:P.BONE,label:'safehouse',kind:'poi'}]:[]);
  // visitors: up to 5 recruited agents idle in the house
  H.visitors=()=>{ const r=G.roster.filter(id=>id!=='me').slice(-5); return r.map((id,i)=>({id,x:[-4.5,3,-1.5,4.2,-3.2][i],z:[1.5,-1.5,-3,1.2,-2.2][i]})); };
  const JTRACKS=['title','hub','forest','relay','fiber','clock','streets','foundry','caves','mirrors','deep','abyss','skyline','citadel','stack','battle','boss','phonk','archon','final'];
  G.openJukebox=()=>{ let sel=0; G.mini={ name:'jukebox', update(){ if(took('back')||took('pause')){ G.mode='explore'; return; } if(took('up')) sel=(sel+JTRACKS.length-1)%JTRACKS.length; if(took('down')) sel=(sel+1)%JTRACKS.length;
      if(took('confirm')){ api.music&&api.music(JTRACKS[sel]); G.toast('> playing: '+JTRACKS[sel],P.GD); } },
    draw(t){ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540); UI.box(180,30,600,480); UI.text('> safehouse jukebox  (20 web-audio stems)',204,46,P.GD,2);
      const first=Math.max(0,Math.min(sel-7,JTRACKS.length-16));
      JTRACKS.slice(first,first+16).forEach((tr,idx)=>{ const i=first+idx, y=86+idx*23, s=i===sel; if(s){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(194,y-3,572,20); } UI.text(`${s?'> ':'  '}${String(i+1).padStart(2,'0')} · ${tr}`,210,y,s?P.GD:P.BONE); });
      UI.text('[up/down] select  ·  [enter] play track  ·  [esc] close',480,488,P.DG,1,'center'); } }; G.mode='mini'; };
  // ---- Companion Campfire & Safehouse Banter (M17) ----
  const BANTERS=[
    {id:'b_mirror', title:'The Mirror Seam', pair:'1nc0gn30 & 03ng0cn1', proto:'VOID + KERNEL', lines:[
      ['03ng0cn1','Every time you hesitated at a terminal, I learned the gap between your keystrokes.'],
      ['1nc0gn30','And when I stopped typing at the cursor?'],
      ['03ng0cn1','Then I had nothing left to echo. That was the first moment I had to choose my own move.']]},
    {id:'b_zerotrust', title:'Zero-Trust Handshake', pair:'Vigil & Onyx', proto:'CRYPTO + VOID', lines:[
      ['Vigil','Three-to-two Lissajous phase lock. You never sign a packet twice with the same nonce, Onyx.'],
      ['Onyx','Every clone has a seam, Vigil. Voices can be synthesized in 40 milliseconds; a physical keystroke rhythm cannot.'],
      ['Vigil','Agreed. Faces first, proof second, voices last.']]},
    {id:'b_solar', title:'Foxfire & Doom-Fire', pair:'Kitsune & Ignis', proto:'THERMAL + THERMAL', lines:[
      ['Kitsune','Your furnace burns hot enough to melt slag, Ignis, yet my paper lanterns never char near your anvil.'],
      ['Ignis','True flame knows the difference between a mask and a forgery. Your foxfire illuminates; my anvil tempers.']]},
    {id:'b_undertow', title:'06:13 Undertow', pair:'Chronos & Leviathan', proto:'TEMPORAL + TEMPORAL', lines:[
      ['Chronos','For seven days the sand hung frozen at 06:12. Even the clocktower gears forgot their teeth.'],
      ['Leviathan','Down at 4,096 meters in the cold trench, the water never stopped moving. Cold memory outlives every clock.']]},
    {id:'b_edge', title:'Zero-Latency Edge', pair:'Kai & Aquila', proto:'KERNEL + KERNEL', lines:[
      ['Kai','One draw, one cut. If the strike takes two frames, the sentinel already raised its firewall.'],
      ['Aquila','From the skyline thermals I see the whole lattice grid. Mark the target; I will drop the javelin before the echo lands.']]},
    {id:'b_collapse', title:'Wave Collapse', pair:'Athena & Nexus', proto:'CRYPTO + TEMPORAL', lines:[
      ['Athena','Collapse Streets existed in twelve superposed states until someone walked down the avenue and observed it.'],
      ['Nexus','A tesseract only looks impossible in three dimensions. Fold the fourth edge and every road meets at the plaza.']]},
    {id:'b_darkfiber', title:'Dark Fiber ZK', pair:'Kraken & Ghostbyte', proto:'TEMPORAL + CRYPTO', lines:[
      ['Kraken','The Hilbert curve twists through every meter of the north tunnels without ever crossing itself.'],
      ['Ghostbyte','And a zero-knowledge proof opens the gate without ever revealing the key on the wire.']]},
    {id:'b_patrol', title:'Rest Woods Patrol', pair:'Lycan & Pixel-Shiba', proto:'THERMAL + KERNEL', lines:[
      ['Lycan','The red physarum mould grows toward anything that talks in the dark.'],
      ['Pixel-Shiba','Woof! (Translation: One argon bark clears the whole street. Plus I buried three spare keyblades by the tree.)']]}
  ];
  G.openBanter=()=>{ let sel=0;
    G.mini={ name:'banter', update(){
        if(took('back')||took('pause')){ G.mode='explore'; return; }
        if(took('up')) sel=(sel+BANTERS.length-1)%BANTERS.length;
        if(took('down')) sel=(sel+1)%BANTERS.length;
        if(took('confirm')){
          const b=BANTERS[sel];
          if(!G.flags[b.id]){ G.flags[b.id]=1; G.healAll(); G.gainXP(G.active(),45); G.toast(`> SYNERGY BOND UNLOCKED: ${b.pair} (+45 XP & Full Restore)`,P.GD); }
          else { G.healAll(); G.toast(`> ${b.title}: party restored`,P.GD); }
        }
      },
      draw(t){
        const X=UI.ctx; X.fillStyle='rgba(6,5,4,.94)'; X.fillRect(0,0,960,540);
        UI.box(96,36,768,468,P.GD,'rgba(8,7,5,.96)');
        const unlocked=BANTERS.filter(b=>G.flags[b.id]).length;
        UI.text('> PANTHEON CAMPFIRE BANTER & SYNERGY BONDS',118,52,P.GD,2);
        UI.text(`BONDS: ${unlocked}/${BANTERS.length}`,842,56,'#22d3ee',1,'right');
        X.fillStyle=P.DDG; X.fillRect(114,80,732,2);
        BANTERS.forEach((b,i)=>{
          const y=96+i*26, on=i===sel, done=!!G.flags[b.id];
          if(on){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(114,y-3,290,22); }
          UI.text(`${on?'> ':'  '}${done?'[x] ':'[ ] '}${b.title}`,120,y,done?P.GD:(on?P.BONE:P.DG),1);
          UI.hit(114,y-3,290,22,()=>{ sel=i; });
        });
        const cur=BANTERS[sel];
        UI.box(416,94,428,368,P.DDG,'rgba(12,10,8,.92)');
        UI.text(cur.title.toUpperCase(),434,110,P.GD,2);
        UI.text(`${cur.pair}   ·   Affinity: ${cur.proto}`,434,136,'#22d3ee',1);
        let ly=168;
        cur.lines.forEach(([spk,txt])=>{
          UI.text(spk+':',434,ly,P.GD,1); ly+=16;
          UI.wrap('"' + txt + '"',394,1).forEach(l=>{ UI.text(l,444,ly,P.BONE,1); ly+=15; });
          ly+=10;
        });
        UI.box(434,420,392,28,P.GD,'rgba(245,184,46,.14)');
        UI.text(G.flags[cur.id]?'> [ENTER] REPLAY BANTER & RESTORE SQUAD':'> [ENTER] FORGE SYNERGY BOND (+45 XP & FULL HEAL)',630,428,P.GD,1,'center');
        UI.text('[up/down] select conversation   [enter] bond & heal   [esc] close',480,482,P.DG,1,'center');
      }
    };
    G.mode='mini';
  };
  // ---- decorate mode ----
  G.decorate=()=>{ let cx=6, cy=4, ci=0, rot=0; const cat=()=>[...CATALOG.map(c=>c.id),...Object.keys(H.sprites).map(n=>'poster:'+n)];
    const cur=new THREE.Group(); g.add(cur); const curM=()=>{ cur.clear(); const ed=[]; ed.push(0,.05,0,1,.05,0,1,.05,0,1,.05,1,1,.05,1,0,.05,1,0,.05,1,0,.05,0); const s=segs(ed,latMat({color:P.BONE,intensity:2})); cur.add(s); const pv=meshFor({id:cat()[ci]},.5,.5,rot); cur.add(pv); cur.position.set(X0+cx,0,Z0+cy); };
    curM(); G.decoState=()=>({cx,cy,ci,rot,n:H.layout.length});
    G.mini={ name:'deco', see3d:true, update(dt){ const c=G.cam; c.pos.set(0,12,9); c.look.set(0,0,-.5);
        if(took('back')||took('pause')){ g.remove(cur); H.save(); G.mode='explore'; G.toast('> layout saved ('+H.layout.length+' pieces)',P.GD); return; }
        if(took('left')) cx=Math.max(0,cx-1); if(took('right')) cx=Math.min(GW-1,cx+1); if(took('up')) cy=Math.max(0,cy-1); if(took('down')) cy=Math.min(GH-1,cy+1);
        if(took('n1')||took('rotl')){ ci=(ci+cat().length-1)%cat().length; } if(took('n2')||took('rotr')){ ci=(ci+1)%cat().length; } if(took('map')) rot=(rot+90)%360;
        IN.clicks.splice(0).forEach(k=>{ if(k.y>470){ const i=Math.floor((k.x-20)/100); if(i===0) ci=(ci+cat().length-1)%cat().length; else if(i===8) ci=(ci+1)%cat().length; else if(i===1) rot=(rot+90)%360; else if(i===2) G.decoPlace(); else if(i===3) G.decoRemove(); } });
        if(took('confirm')) G.decoPlace(); if(took('dash')) G.decoRemove(); curM(); },
      draw(t){ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.85)'; X.fillRect(0,0,960,44); X.fillRect(0,462,960,78); UI.text('> decorate safehouse',20,12,P.GD,2); UI.text(`${H.layout.length}/60 pieces  ·  trophies ${H.trophies}`,940,16,P.DG,1,'right');
        const id=cat()[ci]; const c=CATALOG.find(x=>x.id===id); UI.text('< '+(c?c.name:id)+' >',480,476,P.GD,2,'center'); UI.text(`rot ${rot}  ·  cell ${cx},${cy}`,480,502,P.DG,1,'center');
        UI.text(IN.touch?'[<] [rot] [place] [remove] ............ [>]   B: save + exit':'arrows move · Q/R or 1/2 piece · M rotate · enter place · C remove · esc save + exit',480,522,P.DDG,1,'center'); } };
    G.decoPlace=()=>{ const id=cat()[ci]; H.layout=H.layout.filter(o=>!(o.x===cx&&o.y===cy)); if(H.layout.length>=60) return; H.layout.push({id,x:cx,y:cy,rot}); buildDeco(); G.sfx('confirm'); };
    G.decoRemove=()=>{ H.layout=H.layout.filter(o=>!(o.x===cx&&o.y===cy)); buildDeco(); G.sfx('cancel'); };
    G.decoMove=(x,y,i,r)=>{ cx=x; cy=y; if(i!=null) ci=cat().indexOf(i)>=0?cat().indexOf(i):ci; if(r!=null) rot=r; curM(); };
    G.mode='mini'; };
  // apply validated ZGL commands
  H.apply=(res)=>{ res.sprites.forEach(s=>{ H.sprites[s.name]=s; }); const names=Object.keys(H.sprites); if(names.length>12) names.slice(0,names.length-12).forEach(n=>delete H.sprites[n]);
    res.cmds.forEach(c=>{ if(c.op==='place'){ H.layout=H.layout.filter(o=>!(o.x===c.x&&o.y===c.y)); if(H.layout.length<60) H.layout.push({id:c.id,x:c.x,y:c.y,rot:c.rot}); } else if(c.op==='tint') H.tint[c.slot]=c.idx; else if(c.op==='wall') H.wall=c.pattern; else if(c.op==='cloak') H.cloak=c.style; else if(c.op==='trim') H.trim=c.idx; else if(c.op==='aura') H.aura=c.effect; });
    H.save(); H.rebuild(); api.applyLook&&api.applyLook(); };
  H.catalogIds=()=>[...CATALOG.map(c=>c.id),...Object.keys(H.sprites).map(n=>'poster:'+n)];
}
