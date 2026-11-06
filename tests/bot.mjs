// A scripted "player": real keyboard input via Playwright, game time stepped manually (deterministic captures).
import { st } from './lib.mjs';
import { spawn } from 'child_process';
export class Bot{
  constructor(page){ this.page=page; this.held=new Set(); this.rec=null; this.frames=0; this.log=[]; }
  async step(n=1){ for(let i=0;i<n;i++){ const t=Date.now(); await this.page.evaluate(()=>WOZ.step(1)); const dt=Date.now()-t; if(dt>1500){ const s=await this.page.evaluate(()=>{ const s=WOZ.state(); return {mode:s.mode,zone:s.zone,x:s.x,z:s.z,b:s.battle&&s.battle.state}; }); console.log('SLOW step',dt,JSON.stringify(s)); }
    this.nsteps=(this.nsteps||0)+1; if(process.env.TRACE && this.nsteps%300===0){ const s=await this.page.evaluate(()=>{ const s=WOZ.state(); return {mode:s.mode,zone:s.zone,x:+s.x.toFixed(1),z:+s.z.toFixed(1),b:s.battle&&s.battle.state,lvl:s.party.me.lvl}; }); console.log('trace',this.nsteps,JSON.stringify(s)); }
    if(this.rec) await this.grab(); } }
  async grab(){ const d=await this.page.evaluate(()=>WOZ.frame('image/png')); const b=Buffer.from(d.split(',')[1],'base64'); await new Promise(r=>this.rec.stdin.write(b,r)); this.frames++; }
  startRec(file){ this.rec=spawn('ffmpeg',['-loglevel','error','-y','-f','image2pipe','-framerate','30','-c:v','png','-i','-','-vf','scale=1920:1080:flags=neighbor','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-r','30',file]); this.recFile=file; }
  async stopRec(){ const r=this.rec; this.rec=null; r.stdin.end(); await new Promise(res=>r.on('close',res)); }
  async down(k){ if(!this.held.has(k)){ await this.page.keyboard.down(k); this.held.add(k); } }
  async up(k){ if(this.held.has(k)){ await this.page.keyboard.up(k); this.held.delete(k); } }
  async release(){ for(const k of [...this.held]) await this.up(k); }
  async tap(k,after=2){ await this.page.keyboard.down(k); await this.step(1); await this.page.keyboard.up(k); await this.step(after); }
  async s(){ return st(this.page); }
  // walk to (x,z) with WASD relative to the camera; stops if mode leaves explore
  async goto(x,z,{tol=1.2,run=false,max=900}={}){
    let stuck=0, lastD=1e9, side=null; const z0=arguments[2]&&arguments[2].zone||(await this.s()).zone;
    for(let i=0;i<max;i++){ const s=await this.s(); if(s.mode!=='explore'||s.zone!==z0){ await this.release(); return s; }
      const dx=x-s.x, dz=z-s.z, d=Math.hypot(dx,dz); if(d<tol){ await this.release(); return s; }
      const F=[-Math.sin(s.yaw),-Math.cos(s.yaw)], R=[Math.cos(s.yaw),-Math.sin(s.yaw)]; let f=(dx*F[0]+dz*F[1])/d, r=(dx*R[0]+dz*R[1])/d;
      if(side){ r=side.r; f=side.f; side.n--; if(side.n<=0) side=null; }
      const want=new Set(); if(f>.38) want.add('w'); if(f<-.38) want.add('s'); if(r>.38) want.add('d'); if(r<-.38) want.add('a'); if(!want.size) want.add('w'); if(run) want.add('Shift');
      for(const k of [...this.held]) if(!want.has(k)) await this.up(k); for(const k of want) await this.down(k);
      await this.step(2);
      if(i%10===9){ if(lastD-d<.4){ stuck++; const a=Math.random()*Math.PI*2; side={r:Math.cos(a),f:Math.sin(a),n:8+stuck*3}; } else stuck=0; lastD=d; }
    }
    await this.release(); return this.s();
  }
  async path(pts,o){ let s; for(const [x,z] of pts){ s=await this.goto(x,z,o); if(s.mode!=='explore') return s; } return s; }
  // advance dialogue; choose(choicesArray, node) -> index
  async dialog(choose=()=>0,maxN=60){ for(let i=0;i<maxN;i++){ let s=await this.s(); if(s.mode==='cine'){ await this.tap('Escape',4); s=await this.s(); } if(s.mode!=='dialog') return s; const D=s.dialog;
      if(!D.done){ await this.step(6); const s2=await this.s(); if(s2.mode==='dialog'&&!s2.dialog.done){ await this.step(10); } continue; }
      await this.step(12); // read time
      if(D.choices){ const k=choose(D.choices,D); for(let j=0;j<k;j++) await this.tap('ArrowDown',3); await this.tap('Enter',4); } else await this.tap('Enter',4); }
    return this.s(); }
  async talk(){ await this.tap('e',3); return this.s(); }
  // play a battle: policy(state)-> option index; uses timing + blocks
  async battle(policy,{maxT=3000}={}){ let shotDone=false; this.bn=(this.bn||0)+1;
    for(let i=0;i<maxT;i++){ const s=await this.s(); if(s.mode==='dialog'){ await this.dialog(); continue; } if(s.mode!=='battle'){ return s; } const B=s.battle;
      if(B.state==='menu'){ await this.step(8); const idx=policy(B,s); const cur=B.menu; const n=B.opts.length; let dn=(idx-cur+n)%n; for(let j=0;j<dn;j++) await this.tap('ArrowDown',3); await this.step(4); await this.tap('Enter',4); continue; }
      if(B.state==='target'){ await this.step(6); const tsel=policy.target?policy.target(B,s):0; for(let j=0;j<tsel;j++) await this.tap('ArrowRight',3); await this.tap('Enter',2); continue; }
      if(process.env.SHOTS&&!shotDone&&B.state==='timing'){ shotDone=true; const {shot}=await import('./lib.mjs'); await shot(this.page,`shots/battle-${String(this.bn).padStart(2,'0')}.png`); }
      if(B.state==='timing'){ const t=await this.page.evaluate(()=>G.B.timing.t); if(t>=.70-.016&&t<.74){ await this.tap(' ',1); } else await this.step(1); continue; }
      if(B.state==='wait'){ const b=await this.page.evaluate(()=>G.B.block?{st:G.B.st,res:G.B.block.res}:null); if(b&&b.res===null&&b.st>=.52&&b.st<.58){ await this.tap(' ',1); } else await this.step(1); continue; }
      if(B.state==='victory'||B.state==='defeat'){ await this.step(40); await this.tap('Enter',4); continue; }
      await this.step(2); }
    return this.s(); }
}
// sensible default battle policy: heal when low, use AoE on groups, exploit bosses, otherwise basic.
export function smart(B,s){ const o=B.opts; const find=(l)=>o.findIndex(x=>x.startsWith('> '+l)); const me=B.party.find(p=>p.id===B.actor); const en=me?me.en:0;
  const alive=B.enemies.filter(e=>e.alive); const low=B.party.filter(p=>p.alive).some(p=>p.hp<35);
  const id=B.actor;
  if(id==='me'){ if(find('quorum')>=0) return find('quorum'); if(low&&en>=6) return find('patch'); if(alive.length>=2&&en>=18&&find('sudo')>=0) return find('sudo');
    const boss=alive.find(e=>['copy','relay4','rusted','sandglass','hunter','blank','warden','brood'].includes(e.type));
    if(boss&&(boss.type==='copy'||boss.type==='blank')){ // never repeat a command against the copy
      const last=B.lastMe||''; const pickx=['exploit','ping','trace'].find(k=>k!==last&&find(k)>=0&&(k==='ping'||en>=(k==='exploit'?8:4))); return find(pickx||'guard'); }
    if(boss&&en>=8&&find('exploit')>=0) return find('exploit'); return find('ping'); }
  if(id==='kitsune'){ if(alive.length>=2&&en>=8) return find('foxfire'); return find('fan'); }
  if(id==='ignis'){ if(alive.length>=2&&en>=12) return find('anvil'); return find('hammer'); }
  if(id==='kai'){ if(en>=10) return find('iaido'); return find('slash'); }
  if(id==='vigil'){ if(low&&en>=10) return find('seraph'); if(en>=10) return find('truth'); return find('oculus'); }
  return 0; }
