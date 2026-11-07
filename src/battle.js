// Turn-based battles in the lattice: terminal-command skills, telegraphed red intents, timed strikes and timed blocks.
import * as THREE from 'three';
import { SKILLS, ENEMIES, MOVES, ITEMS, PARTY_BASE } from './data.js';
import { Billboard, AG } from './sprites.js';
import { took, IN } from './input.js';
import { sfx, music } from './audio.js';
import { burst, beam, ringFx, pillar, num, enemyMesh, animEnemy, dissolve, particle } from './fx.js';
import { segs, ring, latMat } from './geo.js';
import * as UI from './ui.js';
import { P } from './pal.js';
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
export class Battle{
  constructor(G,types,opts={}){
    this.G=G; this.opts=opts; this.t=0; this.state='intro'; this.st=0; this.msg=''; this.msgT=0; this.log=[]; this.round=0; this.events=[];
    const cam=G.cam; const yaw=cam.yaw; this.F=V(-Math.sin(yaw),0,-Math.cos(yaw)); this.R=V(Math.cos(yaw),0,-Math.sin(yaw));
    this.C=G.player.group.position.clone(); const z=G.zone;
    const at=(r,f)=>{ const p=this.C.clone().addScaledVector(this.R,r).addScaledVector(this.F,f); p.y=z.h(p.x,p.z); return p; };
    this.at=at;
    // party
    this.party=G.active().map((id,i)=>{ const s=G.stats(id), m=G.party[id]; const sp=id==='me'?G.player:new Billboard(id);
      const home=at(-3.3-i*.5,(i-(G.active().length-1)/2)*1.9); if(id!=='me'){ G.scene.add(sp.group); } sp.group.position.copy(home);
      return {id, name:PARTY_BASE[id].name, col:id==='me'?P.GD:AG[id].color, sp, home, hp:m.hp, en:m.en, ...s, st:{}, alive:m.hp>0, isP:true}; });
    G.player.facing=Math.atan2(this.R.x,this.R.z); G.player.moving=false;
    // enemies
    this.enemies=[]; types.forEach(t=>this.addEnemy(t));
    this.lastMe=null; this.prevMe=null; this.flags={}; this.order=[]; this.ti=0; this.chain=0;
    this.menu=0; this.sub=null; this.tsel=0; this.timing=null; this.block=null; this.result=null;
    this.camPos=this.C.clone().addScaledVector(this.F,-8.6).add(V(0,3.1,0)); this.camLook=this.C.clone().add(V(0,1.3,0)); if(types.some(t=>['relay4','sandglass','hunter','blank'].includes(t))){ this.camPos.addScaledVector(this.F,-3).y+=2.5; this.camLook.y+=2; }
    const M=G.mods||{}; if(M.d3) this.party.forEach(p=>p.st.shield=1);
    ringFx(G.scene,this.C.clone().add(V(0,.05,0)),P.GD,9,1.2,'y',2);
    // arena: braille-dashed floor rings + a faint lattice dome
    const ar=[]; ring(ar,0,.06,0,7.5,96,2); ring(ar,0,.06,0,8.3,96,3); const dome=[]; for(let k=0;k<12;k++){ const a=k/12*Math.PI*2; for(let j=0;j<8;j++){ const p0=j/8*Math.PI/2, p1=(j+1)/8*Math.PI/2; dome.push(Math.cos(a)*Math.cos(p0)*11,Math.sin(p0)*7,Math.sin(a)*Math.cos(p0)*11, Math.cos(a)*Math.cos(p1)*11,Math.sin(p1)*7,Math.sin(a)*Math.cos(p1)*11); } }
    for(let j=1;j<5;j++) ring(dome,0,Math.sin(j/8*Math.PI/2)*7,0,Math.cos(j/8*Math.PI/2)*11,72,2);
    this.arena=new THREE.Group(); this.arena.add(segs(ar,latMat({color:P.DG,intensity:1.3,fogFar:80}))); this.arena.add(segs(dome,latMat({color:P.DDG,intensity:1.4,fogNear:6,fogFar:40})));
    this.arena.position.copy(this.C); G.scene.add(this.arena); sfx('encounter'); music(opts.music||'battle');
    if(opts.ambush){
      this.chain=2;
      this.party.forEach(p=>{ p.en=Math.min(p.men,p.en+10); });
      this.enemies.forEach(e=>{ const dmg=Math.max(4,Math.round(e.mhp*.15)); e.hp=Math.max(1,e.hp-dmg); e.flash=.8; num(e.home.clone().add(V(0,1.8,0)),'-'+dmg+' AMBUSH',P.GD); });
      this.say('PRE-EMPTIVE LATTICE AMBUSH! (+2 SYNC CHAIN · +10 EN)',2.4);
    }
  }
  addEnemy(t){ const E=ENEMIES[t], n=this.enemies.filter(e=>e.alive).length, j=this.enemies.length; const big=['relay4','sandglass','hunter','blank'].includes(t);
    const pos=big? this.at(5.2,2.6) : this.at(2.6+(j%2)*1.1, ((j%3)-1)*1.9 + (j>=3?.9:0));
    let obj; if(E.mesh==='echo'||E.mesh==='copy'){ obj=new Billboard('copy'); obj.facing=Math.atan2(-this.R.x,-this.R.z); this.G.scene.add(obj.group); obj.group.position.copy(pos); }
    else { obj={group:enemyMesh(E.mesh)}; this.G.scene.add(obj.group); obj.group.position.copy(pos); }
    const L=E.fixed?1:Math.max(1,this.opts.lvl||this.G.zone.lvl||1), k=L-1; const hp=Math.round(E.hp*(1+.3*k)); this.xpMul=Math.max(this.xpMul||1,1+.6*k);
    const e={type:t, name:E.name+(k>0&&!E.fixed?'':''), E, lvl:L, hp, mhp:hp, atk:Math.round(E.atk+2.1*k), def:Math.round(E.def+.8*k), spd:E.spd+Math.floor(k*.1), obj, home:pos.clone(), st:{}, alive:true, flash:0, voice:E.voice};
    if(this.round>0) dissolve(pos,P.RED,40); this.enemies.push(e); return e; }
  alive(list){ return list.filter(x=>x.alive); }
  say(s,d=1.4){ this.msg=s; this.msgT=d; this.log.push(s); }
  // ---------------- flow ----------------
  update(dt){
    this.t+=dt; this.st+=dt; if(this.msgT>0) this.msgT-=dt; if(this.arena) this.arena.rotation.y=this.t*.15;
    const G=this.G; G.cam.pos.lerp(this.camPos,1-Math.pow(.02,dt)); G.cam.look.lerp(this.camLook,1-Math.pow(.02,dt));
    // animate
    this.party.forEach(p=>{ p.sp.facing=Math.atan2(this.R.x,this.R.z); if(p.id!=='me'&&p.id!=='copy'){ p.sp.anim=p.anim||'idle'; p.sp.flip=false; } p.sp.mesh.material.uniforms.flash.value=Math.max(0,(p.flash||0)); p.flash=Math.max(0,(p.flash||0)-dt*4);
      p.sp.mesh.material.uniforms.mode.value=p.alive?(p.id==='copy'?1:0):2; p.sp.update(dt,0,G.camera.position); });
    this.enemies.forEach(e=>{ if(e.obj.update){ e.obj.mesh.material.uniforms.flash.value=e.flash; e.obj.update(dt,0,G.camera.position); } else animEnemy(e.obj.group,this.t,e.flash); e.flash=Math.max(0,e.flash-dt*4);
      if(!e.alive){ e.dead=(e.dead||0)+dt; if(e.obj.update) e.obj.mesh.material.uniforms.dis.value=Math.min(1,e.dead*1.5); else e.obj.group.scale.setScalar(Math.max(0.001,1-e.dead*2)); if(e.dead>.8) e.obj.group.visible=false; }
      else if(!e.obj.update) e.obj.group.position.y=e.home.y+Math.sin(this.t*2+e.home.x)*.12; });
    for(let i=this.events.length-1;i>=0;i--){ const ev=this.events[i]; ev.t-=dt; if(ev.t<=0){ this.events.splice(i,1); ev.f(); } }
    const S=this.state;
    if(S==='intro'){ if(this.st>1.1) this.startRound(); }
    else if(S==='turn') this.nextTurn();
    else if(S==='menu') this.menuInput();
    else if(S==='target') this.targetInput();
    else if(S==='timing') this.timingInput(dt);
    else if(S==='wait'){ if(this.st>=this.waitT){ this.waitT=0; this.afterAct(); } else if(this.block) this.blockInput(); }
    else if(S==='victory'||S==='defeat'){ if(this.st>.8 && (took('confirm')||IN.clicks.length)) this.finish(); }
  }
  go(s){ this.state=s; this.st=0; }
  startRound(){
    this.round++; const E=this.alive(this.enemies);
    const r4=E.find(e=>e.type==='relay4'||(e.type==='blank'&&e.st.p2)); if(r4 && this.round>1){ r4.st.stacks=Math.min(8,(r4.st.stacks||0)+1); }
    const hu=E.find(e=>e.type==='hunter'); if(hu&&this.round%3===0&&!hu.st.gaze){ hu.st.gaze=1; this.say('THE HUNTER is opening its eye. GAZE next round.',1.6); }
    E.forEach(e=>this.pickIntent(e));
    const all=[...this.alive(this.party),...E]; this.order=all.sort((a,b)=>(b.spd+Math.random()*2)-(a.spd+Math.random()*2)); this.ti=0; this.go('turn');
  }
  pickIntent(e){
    const M=e.E.moves; let mv;
    if(e.st.gaze===2){ mv='gazefire'; } else if(e.st.charge){ mv='burst'; }
    else { const tot=M.reduce((s,m)=>s+m[1],0); let r=Math.random()*tot; for(const m of M){ r-=m[1]; if(r<=0){ mv=m[0]; break; } } mv=mv||M[0][0];
      if(mv==='wall'&&e.st.wall) mv='bash'; if(mv==='rewind'&&(e.st.norw>0||e.hp>e.mhp*.92)) mv='pour'; if(e.type==='blank'&&e.st.p2&&Math.random()<.3) mv='listen'; if(mv==='fork'&&(this.alive(this.enemies).length>=3||(this.flags.forks||0)>=2)) mv='answer'; if(mv==='lock'&&this.round===1&&e.type==='drone'&&this.G.qstep('q1')===1) mv='scan'; }
    const m=MOVES[mv]; let tgt=null;
    if(m.tgt==='one'){ const al=this.alive(this.party); const dec=al.find(p=>p.st.decoy>0); tgt= dec || al[Math.floor(Math.random()*al.length)]; }
    e.intent={mv,m,tgt}; if(e.st.gaze===1&&mv!=='gazefire') e.st.gaze=2;
  }
  nextTurn(){
    if(this.checkEnd()) return;
    while(this.ti<this.order.length && !this.order[this.ti].alive) this.ti++;
    if(this.ti>=this.order.length){ this.endRound(); return; }
    const a=this.order[this.ti]; this.actor=a;
    if(a.isP){ if(a.st.confused){ a.st.confused=0; this.say(`${a.name} hears a familiar voice and freezes.`,1.3); this.waitAct(1.1); return; }
      this.menu=0; this.sub=null; this.go('menu'); }
    else this.enemyAct(a);
  }
  endRound(){
    const blank=this.alive(this.enemies).find(e=>e.type==='blank'&&e.st.p2); const guards=this.party.filter(p=>p.alive&&p.st.guard).length; if(blank&&guards&&blank.st.stacks){ blank.st.stacks=Math.max(0,blank.st.stacks-guards*2); this.say('Silence. The cursor has nothing to copy.',1.4); }
    this.party.forEach(p=>{ p.st.guard=0; if(!p.alive) return; p.en=Math.min(p.men,p.en+3+((this.G.mods||{}).t2?2:0)); for(const k of ['shield','buff','decoy']) if(p.st[k]>0) p.st[k]--; });
    this.enemies.forEach(e=>{ if(e.st.mark>0) e.st.mark--; if(e.st.wall>0) e.st.wall--; if(e.st.norw>0) e.st.norw--; });
    this.startRound();
  }
  waitAct(d){ this.waitT=d; this.go('wait'); }
  afterAct(){ this.block=null; this.party.forEach(p=>p.anim='idle'); this.ti++; if(this.pendingDialog){ const d=this.pendingDialog; this.pendingDialog=null; this.go('dialog'); this.G.dialog(d,()=>{ this.go('turn'); }); return; } this.go('turn'); }
  checkEnd(){
    if(this.alive(this.enemies).length===0 && this.state!=='victory'){ this.win(); return true; }
    if(this.alive(this.party).length===0 && this.state!=='defeat'){ this.go('defeat'); sfx('glitch'); this.say('> connection lost',99); return true; }
    return false;
  }
  // ---------------- player menu ----------------
  duoSkill(){
    if((this.chain||0)<3) return null;
    const ids=new Set(this.alive(this.party).map(p=>p.id));
    if(ids.size<2) return null;
    if(ids.has('me')&&ids.has('copy')) return 'duo_mirror';
    if(ids.has('kitsune')&&ids.has('ignis')) return 'duo_solar';
    if(ids.has('chronos')&&ids.has('leviathan')) return 'duo_undertow';
    if(ids.has('vigil')&&ids.has('onyx')) return 'duo_zerotrust';
    return 'duo_surge';
  }
  options(){ const a=this.actor; const lvl=this.G.party[a.id].lvl; let sk=PARTY_BASE[a.id].skills.filter(s=>!SKILLS[s].lvl||lvl>=SKILLS[s].lvl);
    const duo=this.duoSkill(); if(duo) sk=[duo,...sk];
    if(a.id==='me'&&this.flags.quorum===1) sk=['quorum',...sk];
    const cm=(this.G.mods||{}).t3?.8:1;
    const o=sk.map(s=>({kind:'skill',id:s,label:'> '+SKILLS[s].name,cost:Math.round(SKILLS[s].cost*(a.id==='me'?cm:1)),desc:SKILLS[s].desc}));
    o.push({kind:'items',label:'> items',desc:'use an item from the cache.'}); o.push({kind:'guard',label:'> guard',desc:'halve damage this round. +6 EN.'});
    if(!this.opts.boss) o.push({kind:'run',label:'> disconnect',desc:'try to escape (60%).'}); return o; }
  itemOpts(){ return Object.entries(this.G.inv).filter(([k,n])=>n>0&&ITEMS[k].use).map(([k,n])=>({kind:'item',id:k,label:`> ${ITEMS[k].name} x${n}`,desc:ITEMS[k].desc})); }
  menuInput(){
    const list=this.sub==='items'?this.itemOpts():this.options(); if(!list.length){ this.sub=null; return; }
    if(took('up')){ this.menu=(this.menu+list.length-1)%list.length; sfx('move'); } if(took('down')){ this.menu=(this.menu+1)%list.length; sfx('move'); }
    for(let i=1;i<=6;i++) if(took('n'+i) && i<=list.length){ this.menu=i-1; this.pick(list[i-1]); return; }
    if(took('back')&&this.sub){ this.sub=null; this.menu=0; sfx('cancel'); return; }
    if(took('confirm')) this.pick(list[this.menu]);
  }
  pick(o){ const a=this.actor; this.menu=Math.min(this.menu,99);
    if(o.kind==='items'){ if(!this.itemOpts().length){ this.say('cache is empty.',1); sfx('cancel'); return; } this.sub='items'; this.menu=0; sfx('confirm'); return; }
    if(o.kind==='guard'){ a.st.guard=1; a.en=Math.min(a.men,a.en+6); this.say(`${a.name} guards.`,1); sfx('block'); ringFx(this.G.scene,a.sp.group.position.clone().add(V(0,1,0)),a.col,1.2,.5,'z'); this.waitAct(.6); return; }
    if(o.kind==='run'){ if(Math.random()<.6){ this.say('> disconnect: ok',1); sfx('door'); this.result='run'; this.events.push({t:.8,f:()=>this.finish()}); this.go('done'); } else { this.say('> disconnect: refused',1); sfx('cancel'); this.waitAct(.8); } return; }
    let S;
    if(o.kind==='item'){ S={target:'ally', item:o.id}; }
    else { S={...SKILLS[o.id],cost:o.cost}; if(a.en<S.cost){ this.say('not enough EN.',1); sfx('cancel'); return; } }
    this.cur={o,S}; sfx('confirm');
    if(S.target==='enemy'||S.target==='ally'||S.target==='downed'){ const L=S.target==='enemy'?this.alive(this.enemies):((S.item==='root.shell'||S.target==='downed')?this.party.filter(p=>!p.alive):this.alive(this.party)); if(!L.length){ this.say('no target.',1); return; }
      this.tlist=L; this.tsel=S.target==='enemy'?Math.max(0,L.findIndex(e=>e.st.mark>0)):L.indexOf(L.reduce((m,p)=>p.hp/p.mhp<m.hp/m.mhp?p:m,L[0])); this.go('target'); }
    else this.commit(null);
  }
  targetInput(){ const L=this.tlist; if(took('left')||took('up')){ this.tsel=(this.tsel+L.length-1)%L.length; sfx('move'); } if(took('right')||took('down')){ this.tsel=(this.tsel+1)%L.length; sfx('move'); }
    if(took('back')){ this.go('menu'); sfx('cancel'); return; } if(took('confirm')) this.commit(L[this.tsel]); }
  commit(tgt){ const {o,S}=this.cur; const a=this.actor; this.tgt=tgt;
    if(S.timing && !this.G.settings.noTiming){ this.timing={t:0,res:null}; this.go('timing'); return; }
    this.execute(a,o,S,tgt,null); }
  timingInput(dt){ const T=this.timing; T.t+=dt/1.05; if(T.res===null && took('confirm')){ const x=T.t; const wd=(this.G.mods||{}).o2&&this.actor.id==='me'?1.5:1; T.res= Math.abs(x-.71)<.035*wd?'perfect':(Math.abs(x-.71)<.09*wd?'good':'miss'); T.hold=.25; sfx(T.res==='miss'?'cancel':'blip'); }
    if(T.res!==null){ T.hold-=dt; if(T.hold<=0) this.execute(this.actor,this.cur.o,this.cur.S,this.tgt,T.res); } else if(T.t>=1){ T.res='none'; this.execute(this.actor,this.cur.o,this.cur.S,this.tgt,'none'); } }
  // ---------------- resolve party action ----------------
  dmg(a,e,pow,{crit=1,pierce=false}={}){ let atk=a.atk*(a.st&&a.st.buff>0?1.4:1)*(a.isP?1+(this.chain||0)*.05:1); let d=atk*pow*(.9+Math.random()*.2)-e.def*.6; d*=crit; if(e.st.mark>0) d*=1.5; if(e.st.wall>0&&!pierce) d*=.35; return Math.max(1,Math.round(d)); }
  hitE(e,d,col,label){ e.hp=Math.max(0,e.hp-d); e.flash=1; num(e.obj.group.position.clone().add(V(0,(e.obj.update?2.1:(e.obj.group.userData.h||1.4)+.6),0)),label?label+' '+d:d,col);
    burst(e.obj.group.position.clone().add(V(0,e.obj.update?1:(e.obj.group.userData.h||1.4),0)),col,18,4,.6); this.G.shake(.25);
    if(e.hp<=0){ e.alive=false; sfx('boom'); const bg=['relay4','sandglass','hunter','blank'].includes(e.type); dissolve(e.obj.group.position.clone(),P.RED,90,bg?8:1.6); if(bg) this.G.shake(1); }
    if(e.type==='blank'&&e.alive){ if(!e.st.p2&&e.hp<e.mhp*.5){ e.st.p2=1; e.st.stacks=2; this.pendingDialog='blank_p2'; this.say('The cursor goes quiet. It is listening.',1.6); sfx('red'); }
      if(!this.flags.bq&&e.hp<e.mhp*.3){ this.flags.bq=1; this.flags.quorum=1; this.pendingDialog='blank_q'; } }
    if(e.type==='relay4'){ if(!this.flags.n1&&e.hp<e.mhp*.7&&e.alive){ this.flags.n1=1; this.events.push({t:.6,f:()=>{ this.addEnemy('node'); this.addEnemy('node'); this.say('RELAY 4 calls its voice nodes.',1.4); sfx('red'); }}); }
      if(!this.flags.aether&&e.hp<e.mhp*.5&&e.alive){ this.flags.aether=1; this.flags.quorum=1; this.pendingDialog='aether_mid'; this.events.push({t:.3,f:()=>this.aether()}); }
      if(!this.flags.n2&&e.hp<e.mhp*.3&&e.alive){ this.flags.n2=1; this.events.push({t:.6,f:()=>{ this.addEnemy('node'); this.addEnemy('node'); sfx('red'); }}); } } }
  aether(){ const s=new Billboard('aether'); this.G.scene.add(s.group); s.group.position.copy(this.at(-5.6,0)); s.anim='ultimate'; this.aetherSp=s; pillar(this.G.scene,s.group.position,AG.aether.color,14,1.2); sfx('charge'); }
  execute(a,o,S,tgt,tres){
    const G=this.G, sc=G.scene, ap=a.sp.group.position, col=a.col; this.go('act');
    if(o.kind==='item'){ const it=ITEMS[o.id]; G.inv[o.id]--; if(it.use==='heal'){ tgt.hp=Math.min(tgt.mhp,tgt.hp+it.v); num(tgt.sp.group.position.clone().add(V(0,2.2,0)),'+'+it.v,P.GD); }
      if(it.use==='en'){ tgt.en=Math.min(tgt.men,tgt.en+it.v); num(tgt.sp.group.position.clone().add(V(0,2.2,0)),'+'+it.v+' EN',P.DG); }
      if(it.use==='revive'){ tgt.alive=true; tgt.hp=Math.round(tgt.mhp*it.v); num(tgt.sp.group.position.clone().add(V(0,2.2,0)),'online',P.GD); }
      sfx('heal'); burst(tgt.sp.group.position.clone().add(V(0,1,0)),P.GD,24,2,.8); this.say(`${a.name} uses ${it.name}.`,1); this.waitAct(.9); return; }
    a.en-=S.cost; if(S.gain) a.en=Math.min(a.men,a.en+S.gain); if(S.once) this.flags.quorum=2;
    if(S.duo){ this.chain=Math.max(0,(this.chain||0)-3); this.alive(this.party).forEach(p=>{ p.anim='ultimate'; ringFx(sc,p.sp.group.position.clone().add(V(0,1,0)),P.GD,2.2,.7,'z',2); }); }
    if(tres==='perfect'||tres==='good'){ this.chain=Math.min(7,(this.chain||0)+(tres==='perfect'?2:1)); if(tres==='perfect') a.en=Math.min(a.men,a.en+2); } else if(tres==='miss'){ this.chain=0; }
    // the copy answers before you speak: repeat the same command and it is reflected
    let mirrored=false; const copy=this.alive(this.enemies).find(e=>e.type==='copy'||e.E.mirror);
    if(a.id==='me'){ if(copy && this.lastMe===o.id && S.target!=='ally'&&S.target!=='allies'){ mirrored=true; } this.lastMe=o.id; }
    this.say(`${a.name} > ${S.name}`+(tres==='perfect'?'  [perfect]':tres==='good'?'  [crit]':''),1.2);
    a.anim=S.cost>0?'ability':'work'; if(S.fx==='quorum') a.anim='ultimate';
    const lunge=(S.target==='enemy'&&!S.heal); if(lunge){ const to=tgt.obj.group.position; const dir=to.clone().sub(a.home).setY(0).normalize(); a.sp.group.position.copy(a.home).addScaledVector(dir,.9); this.events.push({t:.45,f:()=>a.sp.group.position.copy(a.home)}); }
    const crit=S.crit?1.6:(tres==='perfect'?2:(tres==='good'?1.5:1));
    const impact=()=>{
      if(mirrored){ const d=this.dmg(copy,a,S.pow||1); a.hp=Math.max(0,a.hp-d); a.flash=1; num(ap.clone().add(V(0,2.2,0)),d,P.RED); beam(sc,copy.obj.group.position.clone().add(V(0,1,0)),ap.clone().add(V(0,1,0)),P.RED,.5); sfx('hurt');
        this.say('It answered before you spoke. (repeat = reflected)',1.8); if(a.hp<=0){ a.alive=false; } return; }
      if(S.target==='enemy'&&S.pow&&!S.hits){ const e=tgt; let pow=S.pow; if(S.unvoice&&e.voice) pow*=1.5; const d=this.dmg(a,e,pow,{crit,pierce:S.pierce||S.strip});
        const from=ap.clone().add(V(0,1.1,0)), to=e.obj.group.position.clone().add(V(0,e.obj.update?1:(e.obj.group.userData.h||1.4),0));
        if(S.fx==='beam') beam(sc,from,to,col,.35,1); if(S.fx==='slash'||S.fx==='cut'){ for(let i=0;i<3;i++) beam(sc,to.clone().add(V(-.8,.8-i*.5,0).applyAxisAngle(V(0,1,0),Math.random())),to.clone().add(V(.8,-.6-i*.3,0)),col,.3,.3); } if(S.fx==='slam1') ringFx(sc,to.clone(),col,1.6,.4,'y');
        if(S.strip){ e.st.wall=0; e.st.charge=0; e.st.norw=2; this.say(`${e.name}: firewall stripped`,1.2); }
        if(S.unvoice&&e.st.stacks){ e.st.stacks=Math.max(0,e.st.stacks-2); }
        this.hitE(e,d,crit>1?P.BONE:P.GD,crit>1?'crit':''); sfx(crit>1?'crit':'hit'); if(crit>1&&a.id==='me'&&(G.mods||{}).o3) a.en=Math.min(a.men,a.en+4); }
      if(S.target==='all'&&S.pow){ this.alive(this.enemies).forEach((e,i)=>{ const d=this.dmg(a,e,S.pow,{pierce:S.fx==='wipe'||S.fx==='quorum'}); const to=e.obj.group.position.clone().add(V(0,1.2,0));
          if(S.fx==='orbs'){ for(let k=0;k<3;k++) beam(sc,ap.clone().add(V(0,1.4+k*.2,0)),to,AG.kitsune.color,.5,1.5); }
          if(S.fx==='rings') ringFx(sc,e.obj.group.position.clone().add(V(0,.1,0)),AG.ignis.color,2.4,.6,'y');
          if(S.fx==='wipe') pillar(sc,e.obj.group.position,P.GD,9,.6);
          if(S.fx==='quorum'){ for(let k=0;k<7;k++) pillar(sc,e.obj.group.position.clone().add(V((Math.random()-.5)*2,0,(Math.random()-.5)*2)),k%2?AG.aether.color:'#818CF8',16,1.2); }
          this.hitE(e,d,P.GD); });
        if(S.fx==='rings') ringFx(sc,ap.clone().add(V(0,.1,0)),AG.ignis.color,6,.8,'y',2); if(S.fx==='wipe'){ G.flashFx(.5); sfx('zap'); } if(S.fx==='quorum'){ G.flashFx(.8); sfx('boom'); } sfx('crit'); }
      if(S.hits){ for(let h=0;h<S.hits;h++){ this.events.push({t:h*.09,f:()=>{ const al=this.alive(this.enemies); if(!al.length) return; const e=al[Math.floor(Math.random()*al.length)]; const d=this.dmg(a,e,S.pow,{crit:S.crit?1.6:1,pierce:S.pierce}); beam(sc,ap.clone().add(V(0,1.2,0)),e.obj.group.position.clone().add(V(0,1.2,0)),col,.25,1); this.hitE(e,d,S.crit?P.BONE:P.GD); sfx('hit'); }}); } }
      if(S.markAll){ this.alive(this.enemies).forEach(e=>{ e.st.mark=Math.max(e.st.mark||0,S.markAll); ringFx(sc,e.obj.group.position.clone().add(V(0,1.2,0)),P.GD,1.3,.7,'z',3); }); sfx('zap'); }
      if(S.enParty){ this.alive(this.party).forEach(p=>{ p.en=Math.min(p.men,p.en+S.enParty); num(p.sp.group.position.clone().add(V(0,2,0)),'+'+S.enParty+' EN',P.DG); }); sfx('charge'); }
      if(S.revive&&tgt){ tgt.alive=true; tgt.hp=Math.round(tgt.mhp*S.revive); num(tgt.sp.group.position.clone().add(V(0,2.2,0)),'online',P.GD); sfx('heal'); }
      if(S.reviveAll){ this.party.forEach(p=>{ if(!p.alive){ p.alive=true; p.hp=1; } }); }
      if(S.selfbuff){ a.st.buff=S.selfbuff; if(S.en) a.en=Math.min(a.men,a.en+S.en); burst(ap.clone().add(V(0,.4,0)),col,16,2.5,.7,-3); sfx('charge'); }
      if(S.shieldAll){ this.alive(this.party).forEach(p=>p.st.shield=S.shieldAll); }
      if(S.heal){ const L=S.target==='ally'?[tgt]:this.alive(this.party); const lvl=G.party[a.id].lvl; L.forEach(p=>{ const h=S.heal+(S.healL||0)*lvl; p.hp=Math.min(p.mhp,p.hp+h); num(p.sp.group.position.clone().add(V(0,2.2,0)),'+'+h,P.GD); burst(p.sp.group.position.clone().add(V(0,1,0)),col,20,2,.9,-2); }); sfx('heal'); }
      if(S.shield){ this.alive(this.party).forEach(p=>{ p.st.shield=S.shield; ringFx(sc,p.sp.group.position.clone().add(V(0,1,0)),P.GD,1.3,.7,'z',2); }); sfx('block'); }
      if(S.buff){ this.alive(this.party).forEach(p=>{ p.st.buff=S.buff; burst(p.sp.group.position.clone().add(V(0,.3,0)),AG.ignis.color,16,2.5,.7,-3); }); sfx('charge'); }
      if(S.decoy){ a.st.decoy=S.decoy; dissolve(ap.clone(),AG.kitsune.color,50); this.alive(this.enemies).forEach(e=>{ if(e.intent&&e.intent.m.tgt==='one') e.intent.tgt=a; }); sfx('glitch'); }
      if(S.mark){ tgt.st.mark=S.mark; ringFx(sc,tgt.obj.group.position.clone().add(V(0,1.2,0)),P.GD,1.5,.8,'z',3); beam(sc,ap.clone().add(V(0,1.2,0)),tgt.obj.group.position.clone().add(V(0,1.2,0)),P.DG,.5,.2); sfx('zap'); this.say(`${tgt.name}: traced. next: ${tgt.intent?tgt.intent.m.txt:'?'}`,1.5); }
    };
    this.events.push({t:.28,f:impact}); this.waitAct(S.target==='all'?1.15:.95);
  }
  // ---------------- enemy action ----------------
  enemyAct(e){
    const {mv,m}=e.intent||{}; if(!m){ this.waitAct(.2); return; } const sc=this.G.scene; let tgt=e.intent.tgt; if(tgt&&!tgt.alive){ const al=this.alive(this.party); tgt=al[Math.floor(Math.random()*al.length)]; }
    const r4=e.st.stacks?(1+.12*(e.st.stacks||0)):1; if(mv==='gazefire') e.st.gaze=0;
    if(mv==='gazefire'&&this.G.isFlag('copy_crew')&&!this.flags.reflect){ this.flags.reflect=1; this.say('03ng0cn1 turns the trap. The GAZE is reflected!',2); const d=Math.round(e.mhp*.18); const ep0=e.obj.group.position.clone().add(V(0,1.6,0)); this.events.push({t:.5,f:()=>{ beam(sc,this.at(-2,0).add(V(0,1,0)),ep0,P.GD,.6,2); this.hitE(e,d,P.GD,'reflected'); sfx('crit'); this.G.flashFx(.6); }}); this.waitAct(1.4); return; }
    this.say(`${e.name} > ${m.txt}`,1.2); const ep=e.obj.group.position.clone().add(V(0,e.obj.update?1:(e.obj.group.userData.h||1.4),0));
    if(m.self){ const s=m.self;
      if(s==='charge'||s==='predict'){ e.st.charge=1; ringFx(sc,ep,P.RED,1.4,.6,'z'); sfx('charge'); this.say(`${e.name} is charging. next turn hits hard.`,1.5); }
      if(s==='wall'){ e.st.wall=2; ringFx(sc,ep,P.RED,1.6,.8,'y',2); sfx('block'); this.say(`${e.name} raises a firewall.`,1.3); }
      if(s==='fork'){ this.flags.forks=(this.flags.forks||0)+1; this.addEnemy('echo'); sfx('glitch'); this.say('The copy forks itself.',1.3); }
      if(s==='feed'){ const r=this.alive(this.enemies).find(x=>x.type==='relay4'); if(r){ r.hp=Math.min(r.mhp,r.hp+18); beam(sc,ep,r.obj.group.position.clone().add(V(0,7,0)),P.RED,.5); num(r.obj.group.position.clone().add(V(0,9,0)),'+18',P.RED); sfx('red'); } }
      if(s==='listen'){ e.st.stacks=Math.min(8,(e.st.stacks||0)+2); sfx('red'); this.say(e.name+' listens. Voices +2.',1.3); }
      if(s==='gazecharge'){ e.st.gaze=1; ringFx(sc,ep,P.RED,3,.9,'z',2); sfx('charge'); this.say('THE HUNTER focuses. GAZE incoming.',1.5); }
      if(s==='rewind'){ const hh=Math.round(e.mhp*.08); e.hp=Math.min(e.mhp,e.hp+hh); num(ep.clone().add(V(0,1,0)),'+'+hh,P.RED); ringFx(sc,ep,P.RED,2.2,.8,'z',2); sfx('red'); this.say('SANDGLASS rewinds. Strip its charge to stop it.',1.6); }
      this.waitAct(.9); return; }
    if(mv==='burst') e.st.charge=0;
    const targets=m.tgt==='all'?this.alive(this.party):[tgt];
    const single=m.tgt==='one';
    if(single){ this.block={t:0,res:null,tgt,early:false}; }
    // lunge / beam
    if(e.obj.update){ const d=tgt?tgt.home.clone().sub(e.home).setY(0).normalize():V(0,0,0); e.obj.group.position.copy(e.home).addScaledVector(d,.8); this.events.push({t:.75,f:()=>e.obj.group.position.copy(e.home)}); }
    this.events.push({t:.62,f:()=>{
      targets.forEach(p=>{ if(!p.alive) return;
        if(p.st.decoy>0&&single){ num(p.sp.group.position.clone().add(V(0,2.2,0)),'decoy',AG.kitsune.color); dissolve(p.sp.group.position.clone(),AG.kitsune.color,30); sfx('glitch'); p.st.decoy--; return; }
        let d=(e.atk*m.pow*r4*(.9+Math.random()*.2))-p.def*.7; if(p.st.shield>0) d*=.5; if(p.st.guard) d*=.5;
        let lab=''; if(single&&this.block){ const b=this.block.res; if(b==='parry'){ d=0; lab='parry'; this.chain=Math.min(7,(this.chain||0)+2); p.en=Math.min(p.men,p.en+4); const c=this.dmg(p,e,.85); this.hitE(e,c,P.GD,'counter'); sfx('crit'); this.G.flashFx(.35); } else if(b==='block'){ d*=.5; lab='block'; this.chain=Math.min(7,(this.chain||0)+1); sfx('block'); } else if(b==='dodge'){ d=0; lab='dodge'; this.chain=Math.min(7,(this.chain||0)+1); } else if(d>0){ this.chain=0; } }
        d=Math.max(lab==='parry'||lab==='dodge'?0:1,Math.round(d)); p.hp=Math.max(0,p.hp-d); if(d>0){ p.flash=1; sfx('hurt'); }
        num(p.sp.group.position.clone().add(V(0,2.3,0)),lab?lab+(d?' '+d:''):d,lab?P.GD:P.RED);
        const pc=lab==='parry'?P.GD:P.RED; beam(sc,ep,p.sp.group.position.clone().add(V(0,1.1,0)),pc,.4,1); burst(p.sp.group.position.clone().add(V(0,1,0)),pc,lab==='parry'?20:14,3,.5); if(lab==='parry') ringFx(sc,p.sp.group.position.clone().add(V(0,1,0)),P.GD,1.4,.5,'z'); this.G.shake(lab==='parry'?.15:.3);
        if(m.drain){ const dr=Math.min(p.en,m.drain); p.en-=dr; num(p.sp.group.position.clone().add(V(0,1.7,0)),'-'+dr+' EN',P.RED); }
        if(m.confuse){ if(this.G.has('foxfire.lantern')&&mv==='borrow'){ this.say('The foxfire shows its face. The borrowed voice fails.',1.6); ringFx(sc,p.sp.group.position.clone().add(V(0,1,0)),AG.kitsune.color,1.5,.6,'z'); } else { p.st.confused=1; this.say(`${p.name} hears a teammate's voice...`,1.6); } }
        if(p.hp<=0){ p.alive=false; dissolve(p.sp.group.position.clone(),p.col,50); this.say(`${p.name} is down.`,1.2); }
      });
      if(m.tgt==='all') ringFx(sc,e.obj.group.position.clone().add(V(0,.1,0)),P.RED,8,.8,'y',2);
    }});
    this.waitAct(1.05);
  }
  blockInput(){ const B=this.block; B.t+=1/60; if(B.res===null && took('dash') && this.dodgeR!==this.round){ this.dodgeR=this.round; const x=this.st; B.res=(x>=.3&&x<=.66)?'dodge':'late'; if(B.res==='dodge'){ burst(B.tgt.sp.group.position.clone().add(V(0,1,0)),P.GD,26,2.4,.6); sfx('zap'); } return; }
    if(B.res===null && took('confirm')){ const x=this.st; const wd=(this.G.mods||{}).d2?.04:0; B.res= x<.4-wd?'early': (x>=.5-wd&&x<=.6+wd?'parry':(x>=.4-wd&&x<.64+wd?'block':'late')); } }
  // ---------------- results ----------------
  win(){ this.go('victory'); sfx('win'); music(this.G.zone.music);
    let xp=0,bits=0; const loot=[]; this.enemies.forEach(e=>{ const m=e.E.fixed?1:1+.6*(e.lvl-1); xp+=Math.round(e.E.xp*m); bits+=Math.round(e.E.bits*(1+.3*(e.lvl-1))); (e.E.drop||[]).forEach(([it,p])=>{ if(Math.random()<p) loot.push(it); }); });
    if(this.opts.tag==='ember') loot.push('signal.ember');
    this.party.forEach(p=>{ const m=this.G.party[p.id]; m.hp=p.alive?p.hp:1; m.en=p.en; });
    loot.forEach(it=>this.G.give(it,1)); this.G.bits+=bits;
    const ups=this.G.gainXP(this.party.map(p=>p.id),xp);
    this.result={xp,bits,loot,ups}; this.G.ach&&this.G.ach('first_win'); if(this.opts.boss) this.enemies.forEach(e=>e.E.boss&&this.G.ach('boss_'+e.type)); if(ups.length) this.events.push({t:.4,f:()=>sfx('level')});
  }
  finish(){ if(this.done) return; this.done=true;
    if(this.state==='defeat') this.result='lose';
    this.party.forEach(p=>{ if(p.id!=='me') this.G.scene.remove(p.sp.group); else { const m=this.G.party.me; if(this.result!=='run') {} } });
    if(this.result==='run') this.party.forEach(p=>{ const m=this.G.party[p.id]; m.hp=Math.max(1,p.hp); m.en=p.en; });
    this.G.scene.remove(this.arena); this.enemies.forEach(e=>this.G.scene.remove(e.obj.group)); if(this.aetherSp) this.G.scene.remove(this.aetherSp.group);
    this.G.player.group.position.copy(this.C); this.G.endBattle(this); }
  // ---------------- UI ----------------
  draw(t){
    const G=this.G, X=UI.ctx; const proj=(p)=>{ const v=p.clone().project(G.camera); return {x:(v.x+1)/2*UI.W, y:(1-v.y)/2*UI.H, vis:v.z<1}; };
    // enemies: name, hp, intent
    this.enemies.forEach((e,i)=>{ if(!e.alive) return; const top=e.obj.group.position.clone().add(V(0,(e.obj.update?2.2:(e.obj.group.userData.h||1.4)+.9)+(e.type==='relay4'?2.5:0),0)); const s=proj(top); if(!s.vis) return;
      const w=90; UI.text(e.name,s.x,s.y-34,P.RED,1,'center'); UI.bar(s.x-w/2,s.y-20,w,5,e.hp/e.mhp,P.RED,P.RED3);
      let st=[]; if(e.st.wall>0) st.push('[fw]'); if(e.st.mark>0) st.push('[traced]'); if(e.st.charge) st.push('[charging]'); if(e.st.stacks) st.push(`[voices ${e.st.stacks}]`);
      if(e.type==='hunter'&&e.st.gaze) st.push('[GAZE ARMED]'); if(e.type==='blank'&&e.st.p2) st.push('[SILENCE TRIAL: GUARD]');
      if(st.length) UI.text(st.join(' '),s.x,s.y-48,P.RED,1,'center');
      if(e.intent){ let it=e.intent.m.txt; if(e.intent.tgt) it+=' > '+e.intent.tgt.name; if(e.type==='copy'&&this.lastMe) it+=`  | mirrors: ${SKILLS[this.lastMe].name}`; UI.text('next: '+it,s.x,s.y-10,P.RED,1,'center'); }
      UI.hit(s.x-50,s.y-40,100,120,()=>{ if(this.state==='target'&&this.tlist.includes(e)){ this.tsel=this.tlist.indexOf(e); this.commit(e); } });
      if(this.state==='target'&&this.tlist[this.tsel]===e){ const bp=proj(e.obj.group.position.clone()); X.strokeStyle=P.GD; X.lineWidth=2; const b=Math.sin(t*8)*3; X.strokeRect(bp.x-30-b,s.y-58-b,60+b*2,(bp.y-s.y)+70+b*2); UI.text('v',s.x,s.y-66+Math.sin(t*6)*3,P.GD,2,'center'); } });
    if(this.state==='target'&&this.tlist[0]&&this.tlist[0].isP){ const p=this.tlist[this.tsel]; const s=proj(p.sp.group.position.clone().add(V(0,2.3,0))); UI.text('v',s.x,s.y-20+Math.sin(t*6)*3,P.GD,2,'center'); }
    // party panel
    const px=560, py=392; UI.box(px,py,390,138);
    this.party.forEach((p,i)=>{ const y=py+12+i*40; const act=this.actor===p&&['menu','target','timing'].includes(this.state);
      UI.text((act?'> ':'  ')+p.name,px+10,y,p.alive?p.col:P.ASH); UI.text(`lv${G.party[p.id].lvl}`,px+120,y,P.DG);
      UI.bar(px+160,y+2,130,6,p.hp/p.mhp,p.hp/p.mhp<.3?P.RED:P.GD); UI.text(`${p.hp}/${p.mhp}`,px+380,y-1,P.BONE,1,'right');
      UI.bar(px+160,y+14,130,4,p.en/p.men,P.DG,P.DDG); UI.text(`${p.en} EN`,px+380,y+13,P.DG,1,'right');
      let st=[]; if(p.st.shield>0) st.push('fw'); if(p.st.buff>0) st.push('atk+'); if(p.st.decoy>0) st.push('decoy'); if(p.st.guard) st.push('guard'); if(p.st.confused) st.push('?');
      if(st.length) UI.text('['+st.join(' ')+']',px+10,y+15,P.DG); });
    // command menu
    if(this.state==='menu'){ const list=this.sub==='items'?this.itemOpts():this.options(); const bx=10, by=540-14-Math.max(5,list.length)*20-50; UI.box(bx,by,330,Math.max(5,list.length)*20+44);
      UI.text(this.actor.name+(this.sub?' / items':''),bx+12,by+8,this.actor.col);
      list.forEach((o,i)=>{ const y=by+28+i*20, sel=i===this.menu; const can=o.kind!=='skill'||this.actor.en>=o.cost;
        if(sel){ X.fillStyle='rgba(245,184,46,.12)'; X.fillRect(bx+6,y-3,318,18); }
        UI.text(o.label,bx+14,y,sel?P.GD:(can?P.BONE:P.ASH)); if(o.cost) UI.text(o.cost+' EN',bx+318,y,can?P.DG:P.ASH,1,'right'); if(sel) UI.cursor(bx+16+UI.textW(o.label)+2,y+1,t);
        UI.hit(bx+6,y-3,318,18,()=>{ if(this.state==='menu'){ this.menu=i; this.pick(o); } }); });
      const o=list[this.menu]; if(o) { const dw=Math.max(330,UI.textW(o.desc||'')+24); UI.box(bx,by-34,dw,30); UI.text(o.desc||'',bx+12,by-25,P.DG); } }
    if(this.state==='target'){ UI.box(10,486,330,40); UI.text('pick a target  [<- ->]  confirm  [x] back',22,500,P.DG); }
    // timing bar
    if(this.state==='timing'){ const T=this.timing, bx=330, by=330, w=300; UI.box(bx-14,by-26,w+28,58); UI.text('[space] strike in the gold',bx+w/2,by-18,P.BONE,1,'center');
      X.fillStyle=P.DDG; X.fillRect(bx,by,w,12); X.fillStyle=P.DG; X.fillRect(bx+w*.62,by,w*.18,12); X.fillStyle=P.GD; X.fillRect(bx+w*.675,by,w*.07,12);
      const cx=bx+w*Math.min(1,T.t); X.fillStyle=P.BONE; X.fillRect(cx-2,by-5,4,22); if(T.res&&T.res!=='none') UI.text(T.res==='perfect'?'PERFECT':T.res==='good'?'CRIT':'miss',bx+w/2,by+18,T.res==='miss'?P.ASH:P.GD,1,'center'); }
    // block prompt
    if(this.block && this.state==='wait'){ const x=this.st; const on=x>.3&&x<.66; if(on){ const s=proj(this.block.tgt.sp.group.position.clone().add(V(0,2.6,0))); UI.text('[space] block',s.x,s.y-30,x>=.4?P.GD:P.DG,1,'center'); }
      if(this.block.res&&this.block.res!=='early'&&this.block.res!=='late'){ const s=proj(this.block.tgt.sp.group.position.clone().add(V(0,2.6,0))); UI.text(this.block.res.toUpperCase(),s.x,s.y-46,P.GD,2,'center'); } }
    // message
    if(this.msgT>0||this.state==='defeat'){ const w=UI.textW(this.msg)+40; UI.box(480-w/2,14,w,28,P.DDG); UI.text(this.msg,480,22,this.state==='defeat'?P.RED:P.BONE,1,'center'); }
    // turn order & sync chain
    if(this.order.length&&this.state!=='victory'){ let x=12; UI.text(`r${this.round} · order`,x,52,P.DG); x+=68; this.order.forEach((o,i)=>{ if(!o.alive) return; const c=o.isP?o.col:P.RED; const s=(i===this.ti?'>':'')+o.name.slice(0,7); UI.text(s,x,52,i===this.ti?c:(o.isP?P.DG:P.RED2)); x+=UI.textW(s)+12; });
      if(this.chain>0){ UI.box(12,68,210,22,P.GD,'rgba(6,5,4,.85)'); UI.text(`> sync chain x${this.chain}  (+${this.chain*5}% dmg)`,20,73,P.GD,1); } }
    if(this.state==='victory'&&this.result){ const R=this.result; const vx=560, vy=60, vh=Math.min(320,100+R.ups.length*18+(R.loot.length?20:0)); UI.box(vx,vy,380,vh); UI.text('> battle: won',vx+20,vy+16,P.GD,2); let y=vy+52;
      UI.text(`+${R.xp} xp   +${R.bits} bits`,vx+20,y,P.BONE); y+=20; if(R.loot.length){ UI.text('loot: '+R.loot.map(i=>ITEMS[i].name).join(', '),vx+20,y,P.GD); y+=20; }
      R.ups.forEach(u=>{ UI.text(`${u.name} > level ${u.lvl}`+(u.learn?`  learned: ${u.learn}`:''),vx+20,y,P.GD); y+=18; }); UI.text('[confirm]',vx+356,vy+vh-20,P.DG,1,'right'); UI.cursor(vx+360,vy+vh-19,t); }
    if(this.state==='defeat'){ UI.box(330,200,300,90); UI.text('> connection lost',350,216,P.RED,2); UI.text('wake under the rest tree.  [confirm]',350,256,P.BONE); }
    if(this.state==='intro'){ UI.text(this.opts.boss?'> hostile signature: '+this.enemies[0].name:'> hostile process detected',480,90,P.RED,2,'center'); }
  }
}
