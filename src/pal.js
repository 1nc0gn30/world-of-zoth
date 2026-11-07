// 1nc0gn30 palette (STYLE.md). Red is reserved for enemies / the hostile system.
import * as THREE from 'three';
export const P = {
  BK:'#060504', GD:'#f5b82e', DG:'#8a6514', DDG:'#3c2c0a', BONE:'#ece4d2',
  COAL:'#121212', ASH:'#3a3a3a', RED:'#dc3228', RED2:'#8c1e14', RED3:'#460e0a', CORE:'#ffe6c8',
};
export const THEMES = [
  {name:'gold 1nc0gn30', GD:'#f5b82e', DG:'#8a6514', DDG:'#3c2c0a'},
  {name:'cyan sub-lattice', GD:'#22d3ee', DG:'#0e7490', DDG:'#164e63'},
  {name:'emerald matrix', GD:'#4ade80', DG:'#15803d', DDG:'#14532d'},
  {name:'violet abyss', GD:'#a78bfa', DG:'#6d28d9', DDG:'#3b0764'},
  {name:'crimson overclock', GD:'#fb7185', DG:'#be123c', DDG:'#4c0519'},
];
export function applyTheme(idx=0){
  const t=THEMES[(idx%THEMES.length+THEMES.length)%THEMES.length];
  P.GD=t.GD; P.DG=t.DG; P.DDG=t.DDG;
  return t;
}
export const C3 = (h)=>new THREE.Color(h);
