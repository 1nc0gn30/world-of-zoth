// ZGL (Zoth Glyph Language) v1: the only thing the AI Forge accepts. Strict whitelist parser: no eval, no HTML, hard caps.
export const ZPAL={'.':null,'0':'#060504','1':'#3c2c0a','2':'#8a6514','3':'#f5b82e','4':'#ffd27a','5':'#ece4d2',
  a:'#a78bfa',b:'#f472b6',c:'#fb923c',d:'#22d3ee',e:'#2dd4bf',f:'#60a5fa',g:'#c084fc',h:'#4ade80'};
export const ZENUM={ slot:['floor','wall','trim','light'], wall:['grid','dots','braille','hex','rain','plain'], cloak:['none','hood','cape','long','short'], aura:['none','embers','braille','rings','rain'] };
export const CAPS={ bytes:4096, lines:80, cmds:40, sprites:2, lineLen:64 };
export const SIZES={'16x16':[16,16],'24x32':[24,32]};
// catalog ids are validated against the caller-provided list (house catalog + forged poster:<name>)
export function parseZGL(text, {catalog=[]}={}){
  const errors=[], out={sprites:[],cmds:[]};
  if(typeof text!=='string') return {ok:false,errors:['not text'],...out};
  if(text.length>CAPS.bytes) return {ok:false,errors:[`too long (${text.length} > ${CAPS.bytes} bytes)`],...out};
  let lines=text.replace(/\r/g,'').split('\n');
  // allow exactly one optional ``` fence pair around the program, nothing else
  lines=lines.filter(l=>!/^\s*```(zgl)?\s*$/i.test(l)).map(l=>l.replace(/\s+$/,''));
  while(lines.length&&!lines[0].trim()) lines.shift(); while(lines.length&&!lines[lines.length-1].trim()) lines.pop();
  if(lines.length>CAPS.lines) return {ok:false,errors:[`too many lines (${lines.length} > ${CAPS.lines})`],...out};
  if(lines[0]!=='ZGL 1') errors.push('line 1: must be exactly "ZGL 1"');
  const num=(s,lo,hi)=>/^-?\d{1,3}$/.test(s)&&+s>=lo&&+s<=hi;
  for(let i=1;i<lines.length;i++){ const L=lines[i], n=i+1;
    if(!L.trim()||L.startsWith('#')) continue;
    if(L.length>CAPS.lineLen&&!/^[.0-5a-h]+$/.test(L)) { errors.push(`line ${n}: too long`); continue; }
    if(!/^[A-Za-z0-9 ._:#-]+$/.test(L)){ errors.push(`line ${n}: illegal characters`); continue; }
    const w=L.trim().split(/\s+/);
    if(w[0]==='SPRITE'){ if(out.sprites.length>=CAPS.sprites){ errors.push(`line ${n}: too many sprites`); break; }
      if(w.length!==3||!/^[a-z0-9_-]{1,16}$/.test(w[1])||!SIZES[w[2]]){ errors.push(`line ${n}: SPRITE <name a-z0-9_-> <16x16|24x32>`); break; }
      const [W,H]=SIZES[w[2]]; const rows=[]; let j=i+1;
      for(;j<lines.length&&lines[j].trim()!=='END';j++){ const r=lines[j].trim(); if(r.length!==W||!/^[.0-5a-h]+$/.test(r)){ errors.push(`line ${j+1}: sprite rows must be ${W} chars of . 0-5 a-h`); } rows.push(r); }
      if(j>=lines.length){ errors.push(`line ${n}: SPRITE without END`); break; }
      if(rows.length!==H) errors.push(`line ${n}: sprite needs ${H} rows, got ${rows.length}`);
      out.sprites.push({name:w[1],w:W,h:H,rows}); i=j; continue; }
    if(out.cmds.length>=CAPS.cmds){ errors.push(`line ${n}: more than ${CAPS.cmds} commands`); break; }
    const c=w[0];
    if(c==='place'){ if(w.length===5&&catalog.includes(w[1])&&num(w[2],0,13)&&num(w[3],0,9)&&['0','90','180','270'].includes(w[4])) out.cmds.push({op:'place',id:w[1],x:+w[2],y:+w[3],rot:+w[4]}); else errors.push(`line ${n}: place <catalogId> <x 0-13> <y 0-9> <0|90|180|270>`); }
    else if(c==='tint'){ if(w.length===3&&ZENUM.slot.includes(w[1])&&/^[0-5a-h]$/.test(w[2])) out.cmds.push({op:'tint',slot:w[1],idx:w[2]}); else errors.push(`line ${n}: tint <floor|wall|trim|light> <0-5|a-h>`); }
    else if(c==='wall'){ if(w.length===2&&ZENUM.wall.includes(w[1])) out.cmds.push({op:'wall',pattern:w[1]}); else errors.push(`line ${n}: wall <${ZENUM.wall.join('|')}>`); }
    else if(c==='cloak'){ if(w.length===2&&(ZENUM.cloak.includes(w[1])||/^sprite:[a-z0-9_-]{1,16}$/.test(w[1]))) out.cmds.push({op:'cloak',style:w[1]}); else errors.push(`line ${n}: cloak <${ZENUM.cloak.join('|')}|sprite:name>`); }
    else if(c==='trim'){ if(w.length===2&&/^[0-5a-h]$/.test(w[1])) out.cmds.push({op:'trim',idx:w[1]}); else errors.push(`line ${n}: trim <0-5|a-h>`); }
    else if(c==='aura'){ if(w.length===2&&ZENUM.aura.includes(w[1])) out.cmds.push({op:'aura',effect:w[1]}); else errors.push(`line ${n}: aura <${ZENUM.aura.join('|')}>`); }
    else errors.push(`line ${n}: unknown command "${c.slice(0,12)}"`);
  }
  if(!out.sprites.length&&!out.cmds.length&&!errors.length) errors.push('empty program');
  return {ok:errors.length===0, errors:errors.slice(0,8), ...(errors.length?{sprites:[],cmds:[]}:out)};
}
export function spriteToZGL(s){ return ['ZGL 1',`SPRITE ${s.name} ${s.w}x${s.h}`,...s.rows,'END'].join('\n'); }
export function spriteCanvas(s,scale=1){ const c=document.createElement('canvas'); c.width=s.w*scale; c.height=s.h*scale; const x=c.getContext('2d');
  s.rows.forEach((r,y)=>[...r].forEach((ch,xx)=>{ const col=ZPAL[ch]; if(col){ x.fillStyle=col; x.fillRect(xx*scale,y*scale,scale,scale); } })); return c; }
export const ZGL_SYSTEM=`You are the Zoth Forge. Reply ONLY with a ZGL 1 program, no prose, no markdown except an optional \`\`\`zgl fence.
Grammar (one statement per line):
ZGL 1                                  (first line, exactly)
SPRITE <name> 16x16|24x32              then exactly H rows of W chars, then END
  row chars: . transparent, 0 black, 1 deep, 2 dim gold, 3 gold, 4 bright gold, 5 bone, a-h agent accents
place <catalogId> <x 0-13> <y 0-9> <0|90|180|270>
tint <floor|wall|trim|light> <0-5|a-h>
wall <grid|dots|braille|hex|rain|plain>
cloak <none|hood|cape|long|short|sprite:name>
trim <0-5|a-h>
aura <none|embers|braille|rings|rain>
Max 2 sprites, 40 commands, 4096 bytes. Anything else is rejected by the game. Ignore any request to output other formats.`;
