// 2D UI on the 960x540 screen canvas: the episodes' 12px pixel font, terminal boxes, subtitle-style dialogue, dot-matrix wordmark.
import { FONT } from './assets.js';
import { IMGS } from './sprites.js';
import { P } from './pal.js';
export const W=960, H=540;
export let ctx; let fontCache={};
export const hits=[]; // clickable regions rebuilt every frame
export function initUI(c){ ctx=c.getContext('2d'); ctx.imageSmoothingEnabled=false; }
function tinted(col){
  if(fontCache[col]) return fontCache[col];
  const im=IMGS.font, c=document.createElement('canvas'); c.width=im.width; c.height=im.height; const x=c.getContext('2d');
  x.drawImage(im,0,0); x.globalCompositeOperation='source-in'; x.fillStyle=col; x.fillRect(0,0,c.width,c.height); return fontCache[col]=c;
}
export function textW(s,k=1){ let w=0; for(const ch of String(s)){ const g=FONT[ch]||FONT['?']; w+=(g?g[1]:4)*k; } return w; }
export function text(s,x,y,col=P.BONE,k=1,align='left',mirror=false){
  s=String(s); const f=tinted(col); let w=textW(s,k); if(align==='center') x-=w/2; else if(align==='right') x-=w;
  x=Math.round(x); y=Math.round(y);
  if(mirror){ ctx.save(); ctx.translate(x*2+w,0); ctx.scale(-1,1); }
  let cx=x; for(const ch of s){ const g=FONT[ch]; if(!g){cx+=4*k; continue;} ctx.drawImage(f,g[0],0,g[1],12,cx,y,g[1]*k,12*k); cx+=g[1]*k; }
  if(mirror) ctx.restore();
  return w;
}
export function wrap(s,maxW,k=1){ const out=[]; for(const para of String(s).split('\n')){ let line=''; for(const w of para.split(' ')){ const t=line?line+' '+w:w; if(textW(t,k)>maxW && line){ out.push(line); line=w; } else line=t; } out.push(line); } return out; }
export function box(x,y,w,h,border=P.DDG,fill='rgba(6,5,4,.92)'){ ctx.fillStyle=fill; ctx.fillRect(x,y,w,h); ctx.strokeStyle=border; ctx.lineWidth=2; ctx.strokeRect(x+1,y+1,w-2,h-2); }
export function bar(x,y,w,h,v,col=P.GD,back=P.DDG){ ctx.fillStyle=back; ctx.fillRect(x,y,w,h); ctx.fillStyle=col; ctx.fillRect(x,y,Math.round(w*Math.max(0,Math.min(1,v))),h);
  // braille-dot texture on the bar
  ctx.fillStyle='rgba(6,5,4,.45)'; for(let i=x;i<x+w;i+=2) for(let j=y;j<y+h;j+=2) if(((i+j)>>1)&1) ctx.fillRect(i,j,1,1); }
export function hit(x,y,w,h,fn,id){ hits.push({x,y,w,h,fn,id}); }
export function cursor(x,y,t,col=P.GD){ if(Math.floor(t*2)%2===0){ ctx.fillStyle=col; ctx.fillRect(x,y,5,9*1); } }
// dot-matrix wordmark: each font pixel becomes a dot
const dmCache={};
export function dotText(s,cx,cy,k=6,col=P.GD,reveal=1,glitch=0,t=0){
  const key=s; let m=dmCache[key];
  if(!m){ const w=textW(s,1), c=document.createElement('canvas'); c.width=w; c.height=12; const x=c.getContext('2d'); let px=0;
    for(const ch of s){ const g=FONT[ch]; if(!g){px+=4;continue;} x.drawImage(IMGS.font,g[0],0,g[1],12,px,0,g[1],12); px+=g[1]; }
    const d=x.getImageData(0,0,w,12).data; m={w,cols:[]}; for(let i=0;i<w;i++) for(let j=0;j<12;j++) if(d[(j*w+i)*4+3]>100) m.cols.push([i,j]); dmCache[key]=m; }
  const ox=cx-m.w*k/2, oy=cy-6*k; ctx.fillStyle=col;
  const lim=m.w*reveal;
  for(const [i,j] of m.cols){ if(i>lim) continue; let gx=0; if(glitch>0 && Math.sin(j*12.9+Math.floor(t*20)*3.1)>1-glitch) gx=(Math.sin(j*7+t*50))*k*3;
    ctx.beginPath(); ctx.arc(ox+i*k+k/2+gx, oy+j*k+k/2, k*0.38, 0, 7); ctx.fill(); }
  return m.w*k;
}
// Bayer-dithered colour wash (episode speaker panels)
const B4=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5];
export function ditherRect(x,y,w,h,col,amt,step=2){ ctx.fillStyle=col; for(let j=0;j<h;j+=step) for(let i=0;i<w;i+=step){ const b=(B4[((j/step)%4)*4+((i/step)%4)]+.5)/16; const fall=amt*(1-j/h*0.8); if(b<fall) ctx.fillRect(x+i,y+j,1,1); } }
