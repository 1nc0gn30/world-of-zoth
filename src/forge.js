// AI Forge: optional, player's own key, OpenAI-compatible /chat/completions. Device -> provider directly. Output must be ZGL (strict parser).
import * as UI from './ui.js';
import { P } from './pal.js';
import { took, IN } from './input.js';
import { askText, asking } from './askui.js';
import { parseZGL, ZGL_SYSTEM, ZPAL, spriteToZGL, spriteCanvas } from './zgl.js';
export const PRESETS={ local:{url:'http://127.0.0.1:11434/v1', model:'qwen2.5-coder:7b'}, xai:{url:'https://api.x.ai/v1', model:'grok-3-mini'}, openai:{url:'https://api.openai.com/v1', model:'gpt-4o-mini'} };
export const EXAMPLES=['a 16x16 gold fox mask sprite named foxmask, with a bone outline','make my safehouse cozy: braille walls, two lamps by the bed, a rug in the middle, gold trim','a cape cloak with violet trim and a rings aura'];
const KEYS={url:'woz.ai.url', model:'woz.ai.model', key:'woz.ai.key'};
const get=k=>{ try{ return localStorage.getItem(k)||''; }catch(e){ return ''; } }, set=(k,v)=>{ try{ if(v) localStorage.setItem(k,v); else localStorage.removeItem(k); }catch(e){} };
function synthZGL(prompt){
  const p=String(prompt||'').toLowerCase();
  const nm=(p.match(/named\s+([a-z0-9_-]{1,16})/)||[])[1]||(p.includes('fox')?'foxmask':p.includes('sword')||p.includes('blade')?'sigilblade':'zothcrest');
  const col=p.includes('violet')||p.includes('purple')?'a':p.includes('cyan')||p.includes('blue')?'d':p.includes('red')||p.includes('fire')?'c':'3';
  const out=['ZGL 1'];
  if(p.includes('sprite')||p.includes('mask')||p.includes('fox')||p.includes('crest')||p.includes('blade')||!p.includes('cloak')){
    const R=[
      '....55....55....',
      '...5335..5335...',
      '..534435534435..',
      '..534333333435..',
      '.53333444433335.',
      '.53355333355335.',
      '.535d45335d4535.',
      '.53355344355335.',
      '..533334433335..',
      '..523333333325..',
      '...5233553325...',
      '....52300325....',
      '.....523325.....',
      '......5335......',
      '.......55.......',
      '................'
    ].map(r=>r.replace(/3/g,col));
    out.push(`SPRITE ${nm} 16x16`,...R,'END');
  }
  if(p.includes('braille')||p.includes('cozy')||p.includes('safehouse')) out.push('wall braille','tint trim 4','place lamp 2 2 0','place lamp 11 2 0','place rug 6 5 0');
  else if(p.includes('hex')) out.push('wall hex','tint wall 3');
  if(p.includes('cape')||p.includes('cloak')||p.includes('aura')) out.push('cloak cape',`trim ${col}`,'aura rings');
  return out.join('\n');
}
export function initForge(G, api){
  const F=G.forge={ calls:[], last:0, status:'', errors:[], lastText:'', result:null, busy:false, synth:synthZGL };
  if(!get(KEYS.url)) set(KEYS.url,PRESETS.xai.url); if(!get(KEYS.model)) set(KEYS.model,PRESETS.xai.model);
  F.cfg=()=>({url:get(KEYS.url), model:get(KEYS.model), hasKey:!!get(KEYS.key)});
  F.setKey=v=>set(KEYS.key,(v||'').trim()); F.forget=()=>{ set(KEYS.key,''); F.status='key forgotten (removed from this device).'; };
  F.preset=n=>{ set(KEYS.url,PRESETS[n].url); set(KEYS.model,PRESETS[n].model); F.status='preset: '+n; };
  // rate limit: 1 call / 8 s, 12 per 10 minutes
  F.canCall=()=>{ const now=Date.now(); F.calls=F.calls.filter(t=>now-t<600000); if(now-F.last<8000) return 'wait '+Math.ceil((8000-(now-F.last))/1000)+' s (rate limit)'; if(F.calls.length>=12) return 'rate limit: 12 calls per 10 minutes'; return null; };
  F.handle=(text)=>{ F.lastText=String(text||'').slice(0,4096); const res=parseZGL(F.lastText,{catalog:G.house.catalogIds()}); F.result=res;
    if(!res.ok){ F.errors=res.errors; F.status='REJECTED: response is not valid ZGL. nothing was applied.'; G.sfx&&G.sfx('cancel'); return res; }
    F.errors=[]; G.house.apply(res); F.status=`applied: ${res.sprites.length} sprite(s), ${res.cmds.length} command(s).`; G.sfx&&G.sfx('win'); G.ach&&G.ach('forge'); return res; };
  F.call=async(prompt)=>{ const c=F.cfg(); const key=get(KEYS.key);
    if(!key && !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(c.url)){
      F.status='no API key set — synthesized via built-in offline ZGL engine!';
      F.handle(synthZGL(prompt)); return;
    }
    const rl=F.canCall(); if(rl){ F.status=rl; return; }
    if(!/^https:\/\/[a-z0-9.-]+(:\d+)?(\/[A-Za-z0-9._\/-]*)?$/i.test(c.url)&&!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(c.url)){ F.status='endpoint must be an https URL'; return; }
    F.last=Date.now(); F.calls.push(F.last); F.busy=true; F.status='calling '+c.url.replace(/^https?:\/\//,'').split('/')[0]+' ...';
    try{ const ctl=new AbortController(); const to=setTimeout(()=>ctl.abort(),30000);
      const r=await fetch(c.url.replace(/\/$/,'')+'/chat/completions',{method:'POST',signal:ctl.signal,headers:{'Content-Type':'application/json','Authorization':'Bearer '+(key||'ollama')},
        body:JSON.stringify({model:c.model,temperature:.7,max_tokens:1200,messages:[{role:'system',content:ZGL_SYSTEM},{role:'user',content:String(prompt).slice(0,400)}]})});
      clearTimeout(to); if(!r.ok){ F.status='provider error '+r.status+' '+(r.statusText||'').slice(0,40); F.busy=false; return; }
      const j=await r.json(); const txt=j&&j.choices&&j.choices[0]&&j.choices[0].message&&typeof j.choices[0].message.content==='string'?j.choices[0].message.content:'';
      F.busy=false; F.handle(txt);
    }catch(e){ F.busy=false; F.status='local/remote endpoint unreachable — synthesized offline ZGL!'; F.handle(synthZGL(prompt)); } };
  const OPTS=()=>{ const c=F.cfg(); return [
    ['forge from a prompt (offline or API)',()=>askText('Describe what to forge (sprite / decor / cloak). Works offline with zero key or via your API/Ollama!\nexamples:\n- '+EXAMPLES.join('\n- '),'',v=>{ if(v) F.call(v); },{max:400})],
    ['example prompt 1: '+EXAMPLES[0].slice(0,40)+'...',()=>F.call(EXAMPLES[0])],
    ['example prompt 2: '+EXAMPLES[1].slice(0,40)+'...',()=>F.call(EXAMPLES[1])],
    ['example prompt 3: '+EXAMPLES[2].slice(0,40)+'...',()=>F.call(EXAMPLES[2])],
    ['offline ZGL pixel editor (no key needed)',()=>G.openZGLEditor()],
    ['paste ZGL by hand',()=>askText('Paste a ZGL 1 program (ctrl+enter to submit):','ZGL 1\nwall braille\ntint trim 4',v=>{ if(v!=null) F.handle(v); },{multiline:true,max:4096})],
    [`api key: ${c.hasKey?'set (stored only on this device)':'not set (offline synth active)'}`,()=>askText('Paste your API key. It is stored only in this device\'s localStorage and sent only to the endpoint below.','',v=>{ if(v){ F.setKey(v); F.status='key saved on this device.'; } },{secret:true,max:300})],
    [`endpoint: ${c.url}`,()=>askText('OpenAI-compatible base URL (https or localhost):',c.url,v=>{ if(v) set(KEYS.url,v.trim()); },{max:200})],
    [`model: ${c.model}`,()=>askText('Model name:',c.model,v=>{ if(v) set(KEYS.model,v.trim()); },{max:80})],
    ['preset: Local Ollama (127.0.0.1:11434)',()=>F.preset('local')],['preset: xAI',()=>F.preset('xai')],['preset: OpenAI',()=>F.preset('openai')],
    ['forget key',()=>F.forget()]]; };
  G.openForge=()=>{ let sel=0; G.mini={ name:'forge', update(){ if(asking()) return; if(took('back')||took('pause')){ G.mode='explore'; return; } const o=OPTS(); if(took('up')) sel=(sel+o.length-1)%o.length; if(took('down')) sel=(sel+1)%o.length;
      IN.clicks.splice(0).forEach(k=>{ const i=Math.floor((k.y-118)/24); if(k.x>30&&k.x<560&&i>=0&&i<o.length){ sel=i; o[i][1](); } }); if(took('confirm')) o[sel][1](); },
    draw(t){ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.96)'; X.fillRect(0,0,960,540); UI.box(20,14,920,512); UI.text('> ai forge  (settings > ai forge)',36,26,P.GD,2);
      UI.wrap('Optional. Uses YOUR key with an OpenAI-compatible endpoint. Calls go straight from this device to that provider; the game has no server. The key is kept only in this device\'s localStorage and never logged. Output must be ZGL; anything else is rejected and nothing is ever executed.',880,1).forEach((w,i)=>UI.text(w,36,56+i*14,P.DG));
      OPTS().forEach((o,i)=>{ const y=118+i*24; if(i===sel){ X.fillStyle='rgba(245,184,46,.14)'; X.fillRect(30,y-4,530,22); } UI.text((i===sel?'> ':'  ')+o[0],40,y,i===sel?P.GD:P.BONE); });
      UI.box(580,112,344,300); UI.text('> status',592,120,P.GD); UI.wrap(F.status||'idle',320,1).slice(0,4).forEach((w,i)=>UI.text(w,592,138+i*14,F.errors.length?'#c9a27a':P.BONE));
      F.errors.slice(0,8).forEach((e,i)=>UI.text('x '+e.slice(0,48),592,204+i*14,'#c9a27a'));
      const s=F.result&&F.result.ok&&F.result.sprites[0]; if(s){ if(!F.cv||F.cvN!==s.name){ F.cv=spriteCanvas(s,6); F.cvN=s.name; } X.imageSmoothingEnabled=false; X.drawImage(F.cv,700,222,F.cv.width,F.cv.height); UI.text(s.name,752,410,P.DG,1,'center'); }
      UI.text('ZGL spec: DESIGN.md section "ZGL". limits: 2 sprites, 40 commands, 4 KB.',36,500,P.DDG); } }; G.mode='mini'; };
  // ---- offline ZGL editor: paint a 16x16 sprite with the game palette ----
  G.openZGLEditor=()=>{ const W=16,Hh=16; const grid=Array.from({length:Hh},()=>Array(W).fill('.')); let cx=8, cy=8, pi=4; const PK=Object.keys(ZPAL); let name='mysprite';
    G.zglEd={grid,set:(x,y,ch)=>{ grid[y][x]=ch; }, save:()=>save(), name:n=>{ name=n; }};
    function save(){ const s={name,w:W,h:Hh,rows:grid.map(r=>r.join(''))}; const res=F.handle(spriteToZGL(s)); if(res.ok){ G.house.layout.length<60&&!G.house.layout.some(o=>o.id==='poster:'+name)&&G.house.layout.push({id:'poster:'+name,x:6,y:0,rot:0}); G.house.save(); G.house.rebuild(); } return res; }
    G.mini={ name:'zgled', update(){ if(asking()) return; if(took('back')||took('pause')){ G.openForge(); return; }
        if(took('left')) cx=(cx+W-1)%W; if(took('right')) cx=(cx+1)%W; if(took('up')) cy=(cy+Hh-1)%Hh; if(took('down')) cy=(cy+1)%Hh; if(took('rotl')||took('n1')) pi=(pi+PK.length-1)%PK.length; if(took('rotr')||took('n2')) pi=(pi+1)%PK.length;
        if(took('confirm')||IN.held.has('confirm')) grid[cy][cx]=PK[pi]; if(took('dash')) grid[cy][cx]='.'; if(took('map')) save();
        IN.clicks.splice(0).forEach(k=>{ const gx=Math.floor((k.x-60)/24), gy=Math.floor((k.y-80)/24); if(gx>=0&&gx<W&&gy>=0&&gy<Hh){ cx=gx; cy=gy; grid[gy][gx]=PK[pi]; } const pj=Math.floor((k.x-500)/28); if(k.y>80&&k.y<108&&pj>=0&&pj<PK.length) pi=pj; if(k.y>440&&k.x>500&&k.x<660) save(); if(k.y>440&&k.x>680&&k.x<900) askText('sprite name (a-z 0-9 _ -):',name,v=>{ if(v&&/^[a-z0-9_-]{1,16}$/.test(v)) name=v; }); }); },
      draw(t){ const X=UI.ctx; X.fillStyle='rgba(6,5,4,.97)'; X.fillRect(0,0,960,540); UI.box(20,14,920,512); UI.text('> zgl editor (offline)',36,26,P.GD,2); UI.text('name: '+name,500,56,P.BONE);
        for(let y=0;y<Hh;y++) for(let x=0;x<W;x++){ const c=ZPAL[grid[y][x]]; X.fillStyle=c||((x+y)%2?'#0b0906':'#120e08'); X.fillRect(60+x*24,80+y*24,23,23); }
        X.strokeStyle=P.BONE; X.lineWidth=2; X.strokeRect(60+cx*24,80+cy*24,23,23); X.lineWidth=1;
        PK.forEach((k,i)=>{ const c=ZPAL[k]; X.fillStyle=c||'#120e08'; X.fillRect(500+i*28,80,24,24); if(i===pi){ X.strokeStyle=P.GD; X.strokeRect(499+i*28,79,26,26); } UI.text(k,512+i*28,108,P.DG,1,'center'); });
        const txt=['ZGL 1',`SPRITE ${name} 16x16`,...grid.map(r=>r.join('')),'END']; txt.forEach((l,i)=>UI.text(l,500,130+i*14,P.DG));
        UI.box(500,440,160,30); UI.text('[ save sprite ]',580,450,P.GD,1,'center'); UI.box(680,440,220,30); UI.text('[ rename ]',790,450,P.GD,1,'center');
        UI.text(IN.touch?'tap cells to paint · tap a colour · save puts it on the safehouse wall':'arrows move · Q/R colour · enter paint · C erase · M save (poster in the safehouse) · esc back',480,500,P.DDG,1,'center'); } }; G.mode='mini'; };
}
