// In-browser chiptune score + SFX (WebAudio). Same feel as the episode score: D minor, square arps, triangle bass, noise hats.
// Everything is a pure function of (ctx, dest, time) so the capture tool can re-render it offline in sync with recorded gameplay.
const N=m=>440*Math.pow(2,(m-69)/12);
const waves=new WeakMap();
function pw(ctx,duty){ let m=waves.get(ctx); if(!m){m={};waves.set(ctx,m);} if(m[duty]) return m[duty];
  const n=32, re=new Float32Array(n), im=new Float32Array(n); for(let k=1;k<n;k++){ im[k]=0; re[k]=(2/(k*Math.PI))*Math.sin(k*Math.PI*duty); }
  return m[duty]=ctx.createPeriodicWave(re,im); }
const noiseB=new WeakMap();
function noise(ctx){ let b=noiseB.get(ctx); if(b) return b; b=ctx.createBuffer(1,ctx.sampleRate*1,ctx.sampleRate); const d=b.getChannelData(0); let s=7; for(let i=0;i<d.length;i++){ s=(s*16807)%2147483647; d[i]=(s/2147483647)*2-1; } noiseB.set(ctx,b); return b; }
function env(ctx,g,t,a,d,v,rel=.02){ g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(v,t+a); g.gain.exponentialRampToValueAtTime(Math.max(v*.02,1e-4),t+a+d); g.gain.linearRampToValueAtTime(0,t+a+d+rel); }
function osc(ctx,dest,type,f,t,dur,v,{duty=.5,slide=0,a=.004}={}){ const o=ctx.createOscillator(), g=ctx.createGain();
  if(type==='sq') o.setPeriodicWave(pw(ctx,duty)); else o.type=type; o.frequency.setValueAtTime(f,t); if(slide) o.frequency.exponentialRampToValueAtTime(Math.max(20,f*slide),t+dur);
  env(ctx,g,t,a,dur,v); o.connect(g); g.connect(dest); o.start(t); o.stop(t+dur+.05); }
function nz(ctx,dest,t,dur,v,{hp=6000,lp=0,bp=0}={}){ const s=ctx.createBufferSource(); s.buffer=noise(ctx); const g=ctx.createGain(); let n=s;
  if(hp){const f=ctx.createBiquadFilter(); f.type='highpass'; f.frequency.value=hp; n.connect(f); n=f;}
  if(bp){const f=ctx.createBiquadFilter(); f.type='bandpass'; f.frequency.value=bp; f.Q.value=1.2; n.connect(f); n=f;}
  if(lp){const f=ctx.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp; n.connect(f); n=f;}
  env(ctx,g,t,.002,dur,v); n.connect(g); g.connect(dest); s.start(t, Math.random()*.5); s.stop(t+dur+.05); }
function kick(ctx,d,t,v=.5){ osc(ctx,d,'sine',150,t,.22,v,{slide:.27}); }
function snare(ctx,d,t,v=.22){ nz(ctx,d,t,.14,v,{hp:1200}); osc(ctx,d,'triangle',190,t,.08,v*.6,{slide:.6}); }
function hat(ctx,d,t,v=.05){ nz(ctx,d,t,.03,v,{hp:7000}); }

// chords as midi triads; D minor world
const Dm=[50,53,57], Bb=[46,50,53], C=[48,52,55], A=[45,49,52], F=[41,45,48], Gm=[43,46,50], Eb=[51,55,58], Am=[45,48,52];
export const TRACKS={
  title:{bpm:96, prog:[Dm,Bb,F,C], bass:'x...x...x...x.x.', arp:[0,1,2,1], arpDiv:2, duty:.25, drums:'soft', lead:.3, pad:1},
  hub:{bpm:110, prog:[Dm,Bb,F,C], bass:'x..x..x.x..x..x.', arp:[0,1,2,3,2,1], arpDiv:4, duty:.125, drums:'hub', lead:.5, pad:.6},
  forest:{bpm:84, prog:[Dm,Am,Bb,F], bass:'x.......x.......', arp:[0,2,1,2], arpDiv:2, duty:.5, drums:'none', lead:.25, pad:1, crickets:1},
  relay:{bpm:100, prog:[Dm,Eb,Dm,Eb], bass:'x.x.x.x.x.x.x.x.', arp:[0,1,0,2], arpDiv:4, duty:.125, drums:'relay', lead:.2, pad:.7, drone:1},
  battle:{bpm:142, prog:[Dm,C,Bb,A], bass:'x.xxx.xxx.xxx.xx', arp:[0,1,2,1,0,2], arpDiv:4, duty:.25, drums:'battle', lead:.7, pad:.3},
  boss:{bpm:152, prog:[Dm,Eb,C,A], bass:'xxx.xxx.xx.xxx.x', arp:[0,2,1,3], arpDiv:4, duty:.125, drums:'battle', lead:.8, pad:.4, drone:1},
  fiber:{bpm:118, prog:[Dm,Gm,Dm,A], bass:'x.x...x.x.x...x.', arp:[0,1,2,1,2,0,1,2], arpDiv:4, duty:.125, drums:'hub', lead:.35, pad:.5},
  clock:{bpm:90, prog:[Dm,Bb,Gm,A], bass:'x...x...x...x...', arp:[0,2,1,2], arpDiv:4, duty:.25, drums:'soft', lead:.4, pad:.8},
  streets:{bpm:112, prog:[Am,F,C,Gm], bass:'x..x..x...x..x..', arp:[0,1,2,1], arpDiv:4, duty:.125, drums:'hub', lead:.4, pad:.6},
  foundry:{bpm:128, prog:[Dm,Eb,Dm,C], bass:'xx.xx.xxx.xx.x.x', arp:[0,2,0,1], arpDiv:4, duty:.25, drums:'battle', lead:.3, pad:.4, drone:1},
  caves:{bpm:76, prog:[Dm,Eb,Bb,A], bass:'x.......x...x...', arp:[0,1,2], arpDiv:2, duty:.5, drums:'none', lead:.2, pad:1, drone:1},
  mirrors:{bpm:96, prog:[Dm,Dm,Eb,A], bass:'x...x.x.x...x.x.', arp:[2,1,0,1], arpDiv:4, duty:.125, drums:'relay', lead:.45, pad:.7},
  deep:{bpm:70, prog:[Dm,F,Bb,Am], bass:'x...............', arp:[0,1,2,1], arpDiv:2, duty:.5, drums:'none', lead:.2, pad:1.2, crickets:0},
  skyline:{bpm:124, prog:[Dm,Bb,C,A], bass:'x.x.x.xxx.x.x.xx', arp:[0,1,2,3,2,1,2,0], arpDiv:4, duty:.125, drums:'hub', lead:.6, pad:.5},
  final:{bpm:160, prog:[Dm,Eb,Bb,A], bass:'xxxxxxx.xxxxxx.x', arp:[0,2,1,3,1,2], arpDiv:4, duty:.125, drums:'battle', lead:.9, pad:.4, drone:1},
};
function hsh(n){ n=Math.sin(n*127.1)*43758.5453; return n-Math.floor(n); }
// schedule one 16th step
export function step(ctx,dest,name,i,t){
  const tr=TRACKS[name]; if(!tr) return; const s16=60/tr.bpm/4, bar=Math.floor(i/16)%tr.prog.length, ch=tr.prog[bar], k=i%16;
  if(tr.bass[k]==='x') osc(ctx,dest,'triangle',N(ch[0]-12),t,s16*1.6,.32);
  const ad=16/(tr.arpDiv*4); if(k%Math.max(1,Math.round(ad))===0){ const ai=Math.floor(k/ad)%tr.arp.length; const nn=tr.arp[ai]; const m=nn<3?ch[nn]+12:ch[0]+24; osc(ctx,dest,'sq',N(m),t,s16*.9,.07,{duty:tr.duty}); }
  if(tr.pad && k===0){ ch.forEach((m,j)=>{ const o=ctx.createOscillator(), g=ctx.createGain(), f=ctx.createBiquadFilter(); o.type='sawtooth'; o.frequency.value=N(m)*(1+(j-1)*.003); f.type='lowpass'; f.frequency.value=900;
      const d=s16*16; g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.022*tr.pad,t+d*.3); g.gain.linearRampToValueAtTime(0,t+d); o.connect(f); f.connect(g); g.connect(dest); o.start(t); o.stop(t+d+.05); }); }
  if(tr.drone && k===0){ osc(ctx,dest,'sq',N(38)*1.003,t,s16*16,.035,{duty:.5,a:.4}); osc(ctx,dest,'sq',N(39),t,s16*16,.02,{duty:.125,a:.6}); }
  if(tr.lead && (k===0||k===6||k===10) && hsh(i*1.7+bar)<tr.lead){ const sc=[0,2,3,5,7,8,10]; const m=62+sc[Math.floor(hsh(i*3.3)*7)]+(hsh(i)>.7?12:0); osc(ctx,dest,'sq',N(m),t,s16*(k===0?3:1.6),.06,{duty:.5}); }
  const d=tr.drums;
  if(d==='hub'){ if(k%8===0) kick(ctx,dest,t,.35); if(k%8===4) snare(ctx,dest,t,.12); if(k%2===0) hat(ctx,dest,t,.03); }
  if(d==='battle'){ if(k%4===0) kick(ctx,dest,t,.45); if(k%8===4) snare(ctx,dest,t,.2); hat(ctx,dest,t,k%2?.02:.045); }
  if(d==='relay'){ if(k===0||k===10) kick(ctx,dest,t,.4); if(k===8) snare(ctx,dest,t,.16); if(k%4===2) nz(ctx,dest,t,.05,.03,{bp:2400}); }
  if(d==='soft'){ if(k===0) kick(ctx,dest,t,.2); if(k%4===2) hat(ctx,dest,t,.02); }
  if(tr.crickets && k%8===3 && hsh(i*.37)>.4){ for(let r=0;r<3;r++) osc(ctx,dest,'sine',4200+hsh(i)*600,t+r*.045,.02,.01); }
}
export const SFX={
  blip:(c,d,t)=>osc(c,d,'sq',N(84),t,.03,.05,{duty:.25}),
  talk:(c,d,t)=>osc(c,d,'sq',N(72+Math.floor(Math.random()*5)),t,.025,.025,{duty:.125}),
  move:(c,d,t)=>osc(c,d,'sq',N(79),t,.03,.04,{duty:.25}),
  confirm:(c,d,t)=>{osc(c,d,'sq',N(81),t,.05,.07,{duty:.25}); osc(c,d,'sq',N(88),t+.05,.08,.07,{duty:.25});},
  cancel:(c,d,t)=>{osc(c,d,'sq',N(76),t,.05,.06); osc(c,d,'sq',N(69),t+.05,.08,.06);},
  hit:(c,d,t)=>{nz(c,d,t,.09,.25,{hp:800}); osc(c,d,'sq',220,t,.08,.12,{slide:.4});},
  crit:(c,d,t)=>{nz(c,d,t,.15,.3,{hp:500}); osc(c,d,'sq',660,t,.18,.12,{slide:.25,duty:.125}); osc(c,d,'sq',N(93),t+.02,.1,.06);},
  hurt:(c,d,t)=>{osc(c,d,'sawtooth',160,t,.2,.18,{slide:.4}); nz(c,d,t,.12,.15,{lp:1500,hp:0});},
  block:(c,d,t)=>{osc(c,d,'sq',N(96),t,.04,.08,{duty:.125}); osc(c,d,'triangle',N(84),t,.12,.15);},
  heal:(c,d,t)=>{[72,76,79,84].forEach((m,i)=>osc(c,d,'triangle',N(m),t+i*.06,.12,.12));},
  zap:(c,d,t)=>{osc(c,d,'sq',1200,t,.25,.09,{slide:.08,duty:.125}); nz(c,d,t,.2,.08,{bp:3000});},
  glitch:(c,d,t)=>{for(let i=0;i<6;i++) osc(c,d,'sq',200+Math.random()*1800,t+i*.025,.02,.06,{duty:.125}); nz(c,d,t,.15,.1,{hp:3000});},
  encounter:(c,d,t)=>{for(let i=0;i<8;i++) osc(c,d,'sq',N(60+((i*5)%12)+(i%2)*12),t+i*.04,.04,.07,{duty:.25}); nz(c,d,t+.3,.25,.12,{hp:1500});},
  level:(c,d,t)=>{[62,65,69,74,77,81,86].forEach((m,i)=>osc(c,d,'sq',N(m),t+i*.07,.14,.08,{duty:.25}));},
  win:(c,d,t)=>{[62,65,69,74].forEach((m,i)=>osc(c,d,'sq',N(m),t+i*.12,.25,.08,{duty:.25})); osc(c,d,'triangle',N(50),t,.9,.2);},
  loot:(c,d,t)=>{osc(c,d,'sq',N(88),t,.05,.06,{duty:.125}); osc(c,d,'sq',N(93),t+.06,.1,.06,{duty:.125});},
  save:(c,d,t)=>{[74,81,86].forEach((m,i)=>osc(c,d,'triangle',N(m),t+i*.09,.2,.12));},
  door:(c,d,t)=>{osc(c,d,'sq',N(50),t,.4,.08,{slide:2,duty:.5}); nz(c,d,t,.4,.06,{bp:900});},
  charge:(c,d,t)=>osc(c,d,'sq',200,t,.5,.07,{slide:4,duty:.125}),
  boom:(c,d,t)=>{kick(c,d,t,.6); nz(c,d,t,.6,.3,{hp:0,lp:900});},
  sleep:(c,d,t)=>{[69,65,62,57].forEach((m,i)=>osc(c,d,'triangle',N(m),t+i*.25,.4,.12));},
  step:(c,d,t)=>nz(c,d,t,.02,.02,{bp:1800}),
  red:(c,d,t)=>{osc(c,d,'sawtooth',N(38),t,.5,.12,{a:.05}); osc(c,d,'sawtooth',N(39),t,.5,.1,{a:.05});},
};
// ---------- live engine ----------
export const AU={ ctx:null, music:null, sfx:null, track:null, nextT:0, idx:0, on:true, musicOn:true, log:null, clock:()=>0, timer:null };
export function initAudio(){
  if(AU.ctx) { if(AU.ctx.state==='suspended') AU.ctx.resume(); return; }
  try{ AU.ctx=new (window.AudioContext||window.webkitAudioContext)(); }catch(e){ return; }
  const comp=AU.ctx.createDynamicsCompressor(); comp.connect(AU.ctx.destination);
  AU.music=AU.ctx.createGain(); AU.music.gain.value=.55; AU.music.connect(comp);
  AU.sfx=AU.ctx.createGain(); AU.sfx.gain.value=.8; AU.sfx.connect(comp);
  AU.timer=setInterval(tick,25);
}
function tick(){ const c=AU.ctx; if(!c||!AU.track||!AU.musicOn) return; const tr=TRACKS[AU.track]; const s16=60/tr.bpm/4;
  if(AU.nextT<c.currentTime) AU.nextT=c.currentTime+.05;
  while(AU.nextT<c.currentTime+.18){ step(c,AU.music,AU.track,AU.idx,AU.nextT); AU.idx++; AU.nextT+=s16; } }
export function music(name){ if(AU.log && AU.track!==name) AU.log.push({t:AU.clock(),type:'music',name}); if(AU.track===name) return; AU.track=name; AU.idx=0; if(AU.ctx) AU.nextT=AU.ctx.currentTime+.08; }
export function sfx(name){ if(AU.log) AU.log.push({t:AU.clock(),type:'sfx',name}); if(!AU.ctx||!AU.on||AU.log) return; const f=SFX[name]; if(f) f(AU.ctx,AU.sfx,AU.ctx.currentTime+.005); }
// ---------- offline render for gameplay captures ----------
export async function renderLog(log,dur){
  const sr=48000, c=new OfflineAudioContext(2,Math.ceil(sr*dur),sr); const comp=c.createDynamicsCompressor(); comp.connect(c.destination);
  const mg=c.createGain(); mg.gain.value=.55; mg.connect(comp); const sg=c.createGain(); sg.gain.value=.8; sg.connect(comp);
  const mus=log.filter(e=>e.type==='music');
  mus.forEach((m,j)=>{ const end=j+1<mus.length?mus[j+1].t:dur; const tr=TRACKS[m.name]; if(!tr) return; const s16=60/tr.bpm/4; let i=0; for(let t=m.t+.05;t<end;t+=s16,i++) step(c,mg,m.name,i,t); });
  log.filter(e=>e.type==='sfx').forEach(e=>{ const f=SFX[e.name]; if(f&&e.t<dur) f(c,sg,e.t+.005); });
  const buf=await c.startRendering();
  // 16-bit WAV
  const L=buf.getChannelData(0), R=buf.getChannelData(1), n=L.length, ab=new ArrayBuffer(44+n*4), v=new DataView(ab);
  const ws=(o,s)=>{for(let i=0;i<s.length;i++) v.setUint8(o+i,s.charCodeAt(i));};
  ws(0,'RIFF'); v.setUint32(4,36+n*4,true); ws(8,'WAVE'); ws(12,'fmt '); v.setUint32(16,16,true); v.setUint16(20,1,true); v.setUint16(22,2,true); v.setUint32(24,sr,true); v.setUint32(28,sr*4,true); v.setUint16(32,4,true); v.setUint16(34,16,true); ws(36,'data'); v.setUint32(40,n*4,true);
  for(let i=0;i<n;i++){ v.setInt16(44+i*4,Math.max(-1,Math.min(1,L[i]))*32767,true); v.setInt16(46+i*4,Math.max(-1,Math.min(1,R[i]))*32767,true); }
  let s=''; const u8=new Uint8Array(ab); for(let i=0;i<u8.length;i+=32768) s+=String.fromCharCode.apply(null,u8.subarray(i,i+32768)); return btoa(s);
}
