// Keyboard + mouse drag + touch (virtual stick and buttons). Edge-triggered actions + continuous axes.
export const KEYMAP={ KeyW:'up',ArrowUp:'up',KeyS:'down',ArrowDown:'down',KeyA:'left',ArrowLeft:'left',KeyD:'right',ArrowRight:'right',
  Enter:'confirm',Space:'confirm',KeyE:'confirm',KeyF:'confirm', Escape:'pause',Backspace:'back',KeyX:'back',
  KeyJ:'quests',KeyI:'items',KeyP:'party',KeyQ:'rotl',KeyR:'rotr',ShiftLeft:'run',ShiftRight:'run',Tab:'pause',
  Digit1:'n1',Digit2:'n2',Digit3:'n3',Digit4:'n4',Digit5:'n5',Digit6:'n6',KeyM:'map', KeyC:'dash', KeyV:'dash', ControlLeft:'crouch' };
export const DEFAULT_KEYS={...KEYMAP};
try{ const saved=JSON.parse(localStorage.getItem('woz.keys')||'null'); if(saved&&typeof saved==='object') Object.assign(KEYMAP,saved); }catch(e){}
export const IN={ held:new Set(), pressed:new Set(), drag:{dx:0,dy:0}, wheel:0, pointer:null, clicks:[], stick:{x:0,y:0,active:false,id:null,ox:0,oy:0}, touch:false, lastUse:0 };
export function press(a){ IN.pressed.add(a); }
export function initInput(canvas, toCanvas){
  addEventListener('keydown',e=>{ if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA')) return; const a=KEYMAP[e.code]; if(!a) return; if(['Space','Tab','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Backspace'].includes(e.code)) e.preventDefault();
    if(!e.repeat || ['up','down','left','right'].includes(a)) { if(!IN.held.has(a)||e.repeat) IN.pressed.add(a); } IN.held.add(a); if(e.code==='Space'){ if(!e.repeat) IN.pressed.add('jump'); IN.held.add('jump'); } IN.lastUse=performance.now(); });
  addEventListener('keyup',e=>{ const a=KEYMAP[e.code]; if(a) IN.held.delete(a); if(e.code==='Space') IN.held.delete('jump'); });
  addEventListener('blur',()=>IN.held.clear());
  let down=null;
  canvas.addEventListener('pointerdown',e=>{ canvas.setPointerCapture(e.pointerId); const p=toCanvas(e);
    if(e.pointerType==='touch'){ IN.touch=true; if(p.x<380 && p.y>140 && !IN.stick.active && IN.wantStick){ IN.stick={x:0,y:0,active:true,id:e.pointerId,ox:p.x,oy:p.y}; return; } }
    down={id:e.pointerId,x:p.x,y:p.y,sx:p.x,sy:p.y,moved:0}; });
  canvas.addEventListener('pointermove',e=>{ const p=toCanvas(e); IN.pointer=p;
    if(IN.stick.active && e.pointerId===IN.stick.id){ let dx=(p.x-IN.stick.ox)/50, dy=(p.y-IN.stick.oy)/50; const l=Math.hypot(dx,dy); if(l>1){dx/=l;dy/=l;} IN.stick.x=dx; IN.stick.y=dy; return; }
    if(down && e.pointerId===down.id){ IN.drag.dx+=p.x-down.x; IN.drag.dy+=p.y-down.y; down.moved+=Math.abs(p.x-down.x)+Math.abs(p.y-down.y); down.x=p.x; down.y=p.y; } });
  const up=e=>{ const p=toCanvas(e); if(IN.stick.active && e.pointerId===IN.stick.id){ IN.stick={x:0,y:0,active:false,id:null}; return; }
    if(down && e.pointerId===down.id){ if(down.moved<12) IN.clicks.push({x:down.sx,y:down.sy}); down=null; } };
  canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',up);
  canvas.addEventListener('wheel',e=>{ IN.wheel+=Math.sign(e.deltaY); e.preventDefault(); },{passive:false});
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
}
export function axis(){ let x=0,y=0; if(IN.held.has('left'))x-=1; if(IN.held.has('right'))x+=1; if(IN.held.has('up'))y+=1; if(IN.held.has('down'))y-=1;
  if(IN.stick.active){ x+=IN.stick.x; y-=IN.stick.y; } const l=Math.hypot(x,y); if(l>1){x/=l;y/=l;} return {x,y}; }
export function took(a){ if(IN.pressed.has(a)){ IN.pressed.delete(a); return true; } return false; }
export function endFrame(){ IN.pressed.clear(); IN.drag.dx=IN.drag.dy=0; IN.wheel=0; IN.clicks.length=0; }

// gamepad (standard mapping): A confirm/jump, B back, X dissipate, Y map, Start menu, LB/RB camera, left stick move
const PADMAP={0:['confirm','jump'],1:['back'],2:['dash'],3:['map'],9:['pause'],4:['rotl'],5:['rotr'],12:['up'],13:['down'],14:['left'],15:['right'],10:['run']}; let padPrev={};
export function pollPad(){ const gp=navigator.getGamepads?[...navigator.getGamepads()].find(g=>g):null; if(!gp) return;
  for(const [i,acts] of Object.entries(PADMAP)){ const on=gp.buttons[i]&&gp.buttons[i].pressed; for(const a of acts){ if(on&&!padPrev[i]) IN.pressed.add(a); if(on) IN.held.add(a); else if(padPrev[i]) IN.held.delete(a); } padPrev[i]=on; }
  const ax=gp.axes[0]||0, ay=gp.axes[1]||0; if(Math.hypot(ax,ay)>.2){ IN.stick={...IN.stick,active:true,pad:true,x:ax,y:ay}; } else if(IN.stick.pad){ IN.stick={x:0,y:0,active:false,id:null}; }
  const rx=gp.axes[2]||0, ry=gp.axes[3]||0; if(Math.abs(rx)>.2) IN.drag.dx+=rx*8; if(Math.abs(ry)>.2) IN.drag.dy+=ry*5; }
