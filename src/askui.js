// Tiny DOM text prompt (works with the Android soft keyboard). Values are read as plain strings; nothing is ever inserted as HTML.
let box=null;
export function askText(label, initial, cb, {secret=false, multiline=false, max=400}={}){
  closeAsk(); box=document.createElement('div');
  box.style.cssText='position:fixed;left:50%;top:18%;transform:translateX(-50%);width:min(720px,92vw);background:#060504;border:2px solid #8a6514;padding:12px;z-index:50;font:14px monospace;color:#ece4d2';
  const l=document.createElement('div'); l.textContent=label; l.style.cssText='color:#f5b82e;margin-bottom:8px;white-space:pre-wrap';
  const inp=document.createElement(multiline?'textarea':'input'); if(!multiline) inp.type=secret?'password':'text'; else inp.rows=10;
  inp.value=initial||''; inp.maxLength=max; inp.autocomplete='off'; inp.spellcheck=false; inp.style.cssText='width:100%;box-sizing:border-box;background:#0b0906;color:#f5b82e;border:1px solid #3c2c0a;font:14px monospace;padding:6px';
  const row=document.createElement('div'); row.style.cssText='margin-top:8px;display:flex;gap:8px;justify-content:flex-end';
  const mk=(t,f)=>{ const b=document.createElement('button'); b.textContent=t; b.style.cssText='background:#0b0906;color:#f5b82e;border:1px solid #8a6514;font:14px monospace;padding:6px 14px'; b.onclick=f; row.appendChild(b); };
  const done=v=>{ closeAsk(); cb(v); };
  mk('cancel',()=>done(null)); mk('ok',()=>done(inp.value));
  inp.addEventListener('keydown',e=>{ e.stopPropagation(); if(e.key==='Enter'&&(!multiline||e.ctrlKey)){ e.preventDefault(); done(inp.value); } if(e.key==='Escape') done(null); });
  box.append(l,inp,row); document.body.appendChild(box); setTimeout(()=>inp.focus(),0); return inp;
}
export function closeAsk(){ if(box){ box.remove(); box=null; } }
export const asking=()=>!!box;
