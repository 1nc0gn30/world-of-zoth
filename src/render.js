// Renderer: world -> 480x270 half-float target (alpha = material class), then a post pass to 960x540:
// Bayer-dithered intensity ramp, braille dot-matrix for dim levels, ASCII/hex glyph rain in empty sky,
// additive overflow -> bone/white-hot glow, scanlines every other native row, glitch bands, flashes, fades.
import * as THREE from 'three';
export const NW=480, NH=270, OW=960, OH=540;
export let renderer, scene, camera, rt, post, glyphTex;
export const U = { time:{value:0}, pulse:{value:new THREE.Vector4(0,0,0,-100)}, pulse2:{value:new THREE.Vector4(0,0,0,-100)} };

function glyphAtlas(){
  // 32 glyphs, 8x12 cells, drawn with a pixel-ish monospace in white. Row 0: series glyph set, row 1: hex.
  const g='01/>_#*@%λ⣿⠿⠇⠋+=0123456789abcdef', c=document.createElement('canvas');
  c.width=8*32; c.height=12; const x=c.getContext('2d'); x.fillStyle='#fff';
  x.font='bold 11px monospace'; x.textBaseline='top';
  // braille and lambda are drawn as pixels (no font fallback needed on Android / minimal systems)
  const BR={'⣿':[[0,0],[0,1],[0,2],[0,3],[1,0],[1,1],[1,2],[1,3]],'⠿':[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],'⠇':[[0,0],[0,1],[0,2]],'⠋':[[0,0],[0,1],[1,0]]};
  const LAM=['.##....','...#...','...#...','....#..','...##..','..#.#..','..#..#.','.#...#.','#.....#'];
  [...g].forEach((ch,i)=>{ const ox=i*8; if(BR[ch]){ BR[ch].forEach(([cx,cy])=>x.fillRect(ox+1+cx*4,1+cy*3,2,2)); }
    else if(ch==='λ'){ LAM.forEach((r,yy)=>[...r].forEach((c2,xx)=>{ if(c2==='#') x.fillRect(ox+xx,1+yy,1,1); })); }
    else x.fillText(ch,ox+0.5,0.5); });
  // binarize so it stays pixel-hard
  const d=x.getImageData(0,0,c.width,c.height); for(let i=0;i<d.data.length;i+=4){const a=d.data[i+3]>110?255:0; d.data[i]=d.data[i+1]=d.data[i+2]=255; d.data[i+3]=a;} x.putImageData(d,0,0);
  const t=new THREE.CanvasTexture(c); t.magFilter=t.minFilter=THREE.NearestFilter; t.generateMipmaps=false; return t;
}

export function initRender(canvas){
  THREE.ColorManagement.enabled=false;
  renderer=new THREE.WebGLRenderer({canvas, antialias:false, alpha:false, preserveDrawingBuffer:true, powerPreference:'high-performance'});
  renderer.setPixelRatio(1); renderer.outputColorSpace=THREE.LinearSRGBColorSpace; renderer.setSize(OW,OH,false); renderer.autoClear=false;
  rt=new THREE.WebGLRenderTarget(NW,NH,{type:THREE.HalfFloatType, magFilter:THREE.NearestFilter, minFilter:THREE.NearestFilter, depthBuffer:true});
  scene=new THREE.Scene();
  camera=new THREE.PerspectiveCamera(58, NW/NH, 0.1, 400);
  glyphTex=glyphAtlas();
  post=new THREE.Mesh(new THREE.PlaneGeometry(2,2), new THREE.ShaderMaterial({
    uniforms:{ tScene:{value:rt.texture}, tGlyph:{value:glyphTex}, time:U.time, glitch:{value:0}, flash:{value:0}, flashCol:{value:new THREE.Color('#f5b82e')},
      fade:{value:0}, rain:{value:0.5}, rainCol:{value:new THREE.Color('#8a6514')}, hex:{value:0}, stars:{value:1}, warm:{value:0}, shake:{value:new THREE.Vector2()} },
    vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader:`
      precision highp float; varying vec2 vUv;
      uniform sampler2D tScene, tGlyph; uniform float time, glitch, flash, fade, rain, hex, stars, warm; uniform vec3 flashCol, rainCol; uniform vec2 shake;
      float h1(float n){return fract(sin(n*127.1)*43758.5453);} float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      float bayer(vec2 p){ int x=int(mod(p.x,4.)), y=int(mod(p.y,4.)); int i=y*4+x; float m[16]=float[16](0.,8.,2.,10.,12.,4.,14.,6.,3.,11.,1.,9.,15.,7.,13.,5.); for(int k=0;k<16;k++){ if(k==i) return (m[k]+.5)/16.; } return .5; }
      void main(){
        vec2 px=gl_FragCoord.xy; vec2 uv=vUv+shake/vec2(${OW}.,${OH}.);
        if(glitch>0.){ float band=floor(px.y/14.); float r=h2(vec2(band,floor(time*24.))); if(r>1.-glitch*.6) uv.x+=(h1(band+floor(time*30.))-.5)*glitch*.12; }
        vec2 np=floor(px/2.);
        vec4 s=texture2D(tScene,uv);
        vec3 col;
        if(s.a>.75){ col=s.rgb; }
        else if(s.a>.25){
          float v=max(max(s.r,s.g),s.b); vec3 hue=v>0.?s.rgb/v:vec3(0.);
          float b=bayer(np); float q=floor(clamp(v,0.,1.)*4.+b)/4.;
          if(q<=.5 && q>0.){ bool dot=mod(px.x,2.)<1. && mod(px.y,2.)<1.; col=dot? hue*min(1.,q*1.9):vec3(0.); }
          else col=hue*q;
          if(v>1.){ vec3 hot=hue.r>hue.g*1.8? vec3(1.,.9,.78): vec3(.925,.894,.824); col=mix(col,hot,clamp((v-1.)*.7,0.,1.)); }
        } else {
          // empty sky: glyph rain + braille star dots
          col=vec3(0.);
          vec2 cell=floor(px/vec2(8.,12.)); float colr=h1(cell.x*1.37);
          if(colr<rain){
            float sp=.25+h1(cell.x*7.1)*.6, rows=${OH}./12.; float head=fract(time*sp*.35+h1(cell.x*3.3))*(rows+18.);
            float d=head-(rows-cell.y); 
            if(d>0. && d<16.){ float fl=1.-d/16.; float gi= hex>.5? 16.+floor(h2(cell+floor(time*6.))*16.): floor(h2(cell+floor(time*5.))*16.);
              vec2 gp=mod(px,vec2(8.,12.)); float a=texture2D(tGlyph,vec2((gi*8.+gp.x)/256., 1.-gp.y/12.)).a;
              col=rainCol*a*(d<1.2?1.6:fl*.8); }
          }
          float st=h2(floor(px/2.)); if(st>1.-.0025*stars && mod(px.x,2.)<1.&&mod(px.y,2.)<1.) col+=vec3(.54,.4,.08)*(.6+.4*sin(time*2.+st*90.));
        }
        if(mod(np.y,2.)>.5) col*=.82;
        vec2 cv=vUv-.5; col*=1.-dot(cv,cv)*.55;
        col=mix(col,flashCol,flash);
        col*=1.-fade;
        gl_FragColor=vec4(col,1.);
      }`
  }));
  post.frustumCulled=false;
  return renderer;
}
const postScene=new THREE.Scene(), postCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
export function draw(){
  if(!post.parent) postScene.add(post);
  renderer.setRenderTarget(rt); renderer.setClearColor(0x000000,0); renderer.clear(true,true,true);
  renderer.render(scene,camera);
  renderer.setRenderTarget(null); renderer.setClearColor(0x060504,1); renderer.clear();
  renderer.render(postScene,postCam);
}
export function postU(){ return post.material.uniforms; }

// ---------- lattice materials ----------
// World materials write alpha .5 (class "world"); additive colour, MAX alpha so sprites keep alpha 1.
const WORLD_BLEND={ blending:THREE.CustomBlending, blendEquation:THREE.AddEquation, blendSrc:THREE.OneFactor, blendDst:THREE.OneFactor,
  blendEquationAlpha:THREE.MaxEquation, blendSrcAlpha:THREE.OneFactor, blendDstAlpha:THREE.OneFactor, transparent:true, depthWrite:false };
const COMMON_V=`
  uniform float time; uniform vec4 pulse, pulse2; uniform float fogNear, fogFar, wobble, glitchAmt;
  varying float vI; varying vec3 vW;
  float hh(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}
  vec3 deform(vec3 p){
    if(wobble>0.) p.y+=sin(p.x*.7+time*1.3)*cos(p.z*.6+time)*wobble;
    if(glitchAmt>0.){ float g=hh(floor(p*.5)+floor(time*3.)); if(g>.93) p.y+=(g-.93)*glitchAmt*20.; }
    return p; }
  float lightAt(vec3 w, float dist){
    float i=1.-smoothstep(fogNear,fogFar,dist);
    float r=distance(w.xz,pulse.xz); float pr=(time-pulse.w)*14.; if(pr>0.&&pr<60.) i+=exp(-pow((r-pr)*.9,2.))*1.6*(1.-pr/60.);
    float r2=distance(w.xz,pulse2.xz); float pr2=(time-pulse2.w)*10.; if(pr2>0.&&pr2<40.) i+=exp(-pow((r2-pr2)*.8,2.))*1.2*(1.-pr2/40.);
    return i; }`;
export function latMat({color='#f5b82e', intensity=1, fogNear=10, fogFar=70, wobble=0, glitch=0, points=false, size=2.0, vcolor=false, twinkle=0}={}){
  const m=new THREE.ShaderMaterial({ ...WORLD_BLEND,
    uniforms:{ time:U.time, pulse:U.pulse, pulse2:U.pulse2, color:{value:new THREE.Color(color)}, intensity:{value:intensity},
      fogNear:{value:fogNear}, fogFar:{value:fogFar}, wobble:{value:wobble}, glitchAmt:{value:glitch}, size:{value:size}, twinkle:{value:twinkle} },
    vertexShader: COMMON_V+`
      uniform float size, twinkle; ${vcolor?'attribute vec3 acol; varying vec3 vC;':''}
      void main(){ vec3 p=deform(position); vec4 w=modelMatrix*vec4(p,1.); vW=w.xyz; vec4 mv=viewMatrix*w;
        vI=lightAt(w.xyz,-mv.z); if(twinkle>0.) vI*=1.-twinkle+twinkle*(.5+.5*sin(time*3.+hh(position)*40.));
        ${vcolor?'vC=acol;':''}
        gl_Position=projectionMatrix*mv; ${points?'gl_PointSize=clamp(size*60./-mv.z,1.,size*2.);':''} }`,
    fragmentShader:`uniform vec3 color; uniform float intensity; varying float vI; ${vcolor?'varying vec3 vC;':''}
      void main(){ vec3 c=${vcolor?'vC':'color'}; gl_FragColor=vec4(c*vI*intensity,.5); }`,
  });
  return m;
}
// Solid occluder (dark faces) — writes depth, class "world".
export function solidMat(color='#0b0906'){
  return new THREE.ShaderMaterial({ uniforms:{color:{value:new THREE.Color(color)}},
    vertexShader:`void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform vec3 color; void main(){gl_FragColor=vec4(color,.5);}`, polygonOffset:true, polygonOffsetFactor:1, polygonOffsetUnits:1 });
}
// Sprite material (class "sprite", alpha 1): frame rect, tint modes, hit flash, dissolve.
export function spriteMat(tex){
  return new THREE.ShaderMaterial({ uniforms:{ map:{value:tex}, rect:{value:new THREE.Vector4(0,0,1,1)}, flip:{value:0}, mode:{value:0}, flash:{value:0}, dis:{value:0}, time:U.time, glow:{value:0}, glowCol:{value:new THREE.Color('#f5b82e')} },
    vertexShader:`varying vec2 vUv; void main(){vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`uniform sampler2D map; uniform vec4 rect; uniform float flip, mode, flash, dis, time, glow; uniform vec3 glowCol; varying vec2 vUv;
      float hh(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
      void main(){ vec2 u=vUv; if(flip>.5) u.x=1.-u.x; vec2 t=rect.xy+u*rect.zw; vec4 c=texture2D(map,t);
        if(c.a<.5) discard;
        if(dis>0.){ vec2 cell=floor(t*vec2(textureSize(map,0))); if(hh(cell)<dis) discard; }
        vec3 col=c.rgb;
        if(mode>.5 && mode<1.5){ float l=max(col.r,max(col.g,col.b)); col= l<.12? vec3(.05,.01,.01) : (l<.35? vec3(.27,.055,.04) : (l<.6? vec3(.55,.12,.08): vec3(.86,.2,.16))); }
        if(mode>1.5){ float l=dot(col,vec3(.3,.5,.2)); col=vec3(l)*.6; }
        col+=glowCol*glow*.35;
        col=mix(col,vec3(1.,.97,.9),flash);
        gl_FragColor=vec4(col,1.); }`,
    side:THREE.DoubleSide });
}
