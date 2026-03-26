import { useEffect, useRef } from 'react';

/* ---------------- GL Shader Common SDF + uBreatheMix + Cool Mode ---------------- */
const FRAG_GRID_COMMON = `
precision highp float;
uniform vec2  uRes, uWorld, uWorldOff;
uniform float uTime, uCell, uScale, uMinS, uMaxS, uPeriod, uBreathe, uBreatheMix, uAA, uNPow, uKFac;
uniform vec2  uGap;
uniform sampler2D uDisp;
uniform vec2  uFieldSize;
uniform float uShapeAmp, uFull9, uIsoScale, uInflMax;

uniform float uBMode;
uniform vec2  uNoiseDir;
uniform float uNoiseScale;
uniform float uNoiseSpeed;
uniform float uNoiseOct;
uniform float uRadK;
uniform float uSpiAngK, uSpiRadK;
uniform float uCrossKX, uCrossKY;
uniform float uGroupSize;
uniform float uGroupPhaseJit;

float sdSuperEllipse(vec2 p, vec2 r, float n){
  p = abs(p) / r;
  float k = pow(pow(p.x, n) + pow(p.y, n), 1.0/n);
  return (k - 1.0) * min(r.x, r.y);
}
float smin(float a, float b, float k){
  float hk = max(1e-4, k);
  float h = clamp(0.5 + 0.5*(b - a)/hk, 0.0, 1.0);
  return mix(b, a, h) - hk*h*(1.0 - h);
}
float radialMaskAlpha(vec2 frag){
  vec2 c = 0.5 * uRes;
  vec2 p = (frag - c) / max(vec2(c.x * 1.38, c.y * 1.00), vec2(1.0));
  float t = clamp(length(p), 0.0, 1.0);
  return mix(1.0, 0.24, t);
}
vec4 fetch4(vec2 ij){ vec2 uv=(ij+0.5)/uFieldSize; return texture2D(uDisp, uv); }
vec2 sampleDispAtW(vec2 posW){
  vec2 g = (posW / uWorld) * (uFieldSize - 1.0);
  vec2 ij=floor(g), f=clamp(g-ij,0.0,1.0);
  vec4 d00=fetch4(ij), d10=fetch4(ij+vec2(1.,0.)), d01=fetch4(ij+vec2(0.,1.)), d11=fetch4(ij+vec2(1.,1.));
  return mix(mix(d00.xy,d10.xy,f.x), mix(d01.xy,d11.xy,f.x), f.y);
}
float sampleInflAtW(vec2 posW){
  vec2 g=(posW/uWorld)*(uFieldSize-1.0);
  vec2 ij=floor(g), f=clamp(g-ij,0.0,1.0);
  vec4 d00=fetch4(ij), d10=fetch4(ij+vec2(1.,0.)), d01=fetch4(ij+vec2(0.,1.)), d11=fetch4(ij+vec2(1.,1.));
  return clamp(mix(mix(d00.z,d10.z,f.x), mix(d01.z,d11.z,f.x), f.y), 0.0, uInflMax);
}
float sampleLensAtW(vec2 posW){
  vec2 g=(posW/uWorld)*(uFieldSize-1.0);
  vec2 ij=floor(g), f=clamp(g-ij,0.0,1.0);
  vec4 d00=fetch4(ij), d10=fetch4(ij+vec2(1.,0.)), d01=fetch4(ij+vec2(0.,1.)), d11=fetch4(ij+vec2(1.,1.));
  return clamp(mix(mix(d00.w,d10.w,f.x), mix(d01.w,d11.w,f.x), f.y), 0.0, 1.0);
}
mat2 localJacEdgeW(vec2 posW){
  vec2 step = uWorld / max(uFieldSize - 1.0, vec2(1.0));
  vec2 dpx = vec2(step.x, 0.0), dpy = vec2(0.0, step.y);
  vec2 pL=posW-dpx, pR=posW+dpx, pB=posW-dpy, pT=posW+dpy;
  bool L=(pL.x<0.), R=(pR.x>uWorld.x), B=(pB.y<0.), T=(pT.y>uWorld.y);
  vec2 ddx, ddy;
  if(L) ddx=(sampleDispAtW(pR)-sampleDispAtW(posW))/step.x;
  else if(R) ddx=(sampleDispAtW(posW)-sampleDispAtW(pL))/step.x;
  else ddx=(sampleDispAtW(pR)-sampleDispAtW(pL))/(2.0*step.x);
  if(B) ddy=(sampleDispAtW(pT)-sampleDispAtW(posW))/step.y;
  else if(T) ddy=(sampleDispAtW(posW)-sampleDispAtW(pB))/step.y;
  else ddy=(sampleDispAtW(pT)-sampleDispAtW(pB))/(2.0*step.y);
  return mat2(ddx.x, ddy.x, ddx.y, ddy.y);
}

float hash21(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float vnoise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  float a=hash21(i), b=hash21(i+vec2(1.,0.));
  float c=hash21(i+vec2(0.,1.)), d=hash21(i+vec2(1.,1.));
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
}
float fbm4(vec2 p){
  float t=0.0, a=0.5, f=1.0;
  float w2=step(2.0, uNoiseOct), w3=step(3.0, uNoiseOct), w4=step(4.0, uNoiseOct);
  t+=a*vnoise(p*f); a*=0.5; f*=2.0;
  t+=a*vnoise(p*f)*w2; a*=0.5; f*=2.0;
  t+=a*vnoise(p*f)*w3; a*=0.5; f*=2.0;
  t+=a*vnoise(p*f)*w4;
  float norm=0.5+0.25*w2+0.125*w3+0.0625*w4;
  return (norm>0.0)?(t/norm):0.0;
}

float breatheAt(vec2 idx, float tCyc){
  float basePhase = 6.2831853 * tCyc;
  if(uBMode < 0.5){
    float invS = 1.0 / max(uNoiseScale, 1e-4);
    vec2 p0 = idx * invS + uNoiseDir * (uNoiseSpeed * uTime);
    return fbm4(p0);
  }else if(uBMode < 1.5){
    float r = length(idx);
    return 0.5 + 0.5 * sin(basePhase + uRadK * r);
  }else if(uBMode < 2.5){
    float r = length(idx);
    float ang = atan(idx.y, idx.x);
    return 0.5 + 0.5 * sin(basePhase + uSpiAngK * ang + uSpiRadK * r);
  }else if(uBMode < 3.5){
    float sx = sin(basePhase + uCrossKX * idx.x);
    float sy = sin(basePhase + uCrossKY * idx.y);
    float s = 0.5 * (sx + sy);
    return 0.5 + 0.5 * s;
  }else{
    float gsz = max(1.0, uGroupSize);
    vec2 gid = floor(idx / gsz);
    float jitter = (hash21(gid) - 0.5) * (6.2831853 * uGroupPhaseJit);
    return 0.5 + 0.5 * sin(basePhase + jitter);
  }
}

vec2 offsetFromIndex(int m){
  if(m==0) return vec2( 0.0, 0.0);
  if(m==1) return vec2( 1.0, 0.0);
  if(m==2) return vec2(-1.0, 0.0);
  if(m==3) return vec2( 0.0, 1.0);
  if(m==4) return vec2( 0.0,-1.0);
  if(m==5) return vec2( 1.0, 1.0);
  if(m==6) return vec2( 1.0,-1.0);
  if(m==7) return vec2(-1.0, 1.0);
  return vec2(-1.0,-1.0);
}

float sdGridUnion(vec2 frag, vec2 pitch, vec2 anchorW, vec2 rBase){
  vec2 fragW = frag + uWorldOff;
  float tCyc = uTime / max(uPeriod, 1.0e-4);
  vec2 refW = fragW - sampleDispAtW(fragW);
  vec2 idx0 = floor((refW - anchorW)/pitch + 0.5);
  float best = 1.0e9;
  for(int m=0; m<9; ++m){
    if(m>=5 && uFull9<0.5) continue;
    vec2 idx = idx0 + offsetFromIndex(m);
    vec2 cW  = anchorW + pitch*idx;
    vec2 off = sampleDispAtW(cW);
    float scaleDiv = 1.0;
    if(uIsoScale>0.5){
      mat2 J=localJacEdgeW(cW);
      float div=J[0][0]+J[1][1];
      float s0=clamp(1.0 + uShapeAmp*div, 0.5, 2.0);
      vec2 stepPix=uWorld/max(uFieldSize-1.0, vec2(1.0));
      float edgePx=max(0.0, min(min(cW.x, uWorld.x-cW.x), min(cW.y, uWorld.y-cW.y)));
      float msk=smoothstep(0.0, max(stepPix.x,stepPix.y)*2.0, edgePx);
      scaleDiv=mix(1.0, s0, msk);
    }
    float wBreath = (uBreathe<0.5) ? 1.0 : breatheAt(idx, tCyc);
    float sStatic = uMaxS;
    float sBreath = mix(uMinS, uMaxS, wBreath);
    float sCell   = mix(sStatic, sBreath, clamp(uBreatheMix, 0.0, 1.0));
    float infl = sampleInflAtW(cW);
    float scaleEffRaw = sCell + infl;
    if (scaleEffRaw <= 0.0) continue;
    float rMinPx = min(rBase.x, rBase.y) * scaleEffRaw * scaleDiv;
    if (rMinPx < 0.3 * uAA) continue;
    vec2 p = (fragW - (cW + off)) / (scaleDiv * scaleEffRaw);
    float di = sdSuperEllipse(p, rBase, uNPow);
    best = min(best, di);
    if (best < -2.0 * uAA) break;
  }
  return best;
}
`;

const fragBase = `
${FRAG_GRID_COMMON}
void main(){
  vec2 frag = gl_FragCoord.xy;
  float cellS = uCell * uScale;
  vec2  gapS  = uGap  * uScale;
  vec2  pitch = vec2(cellS + gapS.x, cellS + gapS.y);
  vec2  rBase = vec2(0.5 * cellS);
  vec2 anchor0 = 0.5*uWorld;
  vec2 anchor1 = anchor0 + 0.5*pitch;
  float d0 = sdGridUnion(frag, pitch, anchor0, rBase);
  float d1 = sdGridUnion(frag, pitch, anchor1, rBase);
  float base = min(cellS, min(pitch.x, pitch.y));
  float k = uKFac * base;
  float d = smin(d0, d1, k);
  float a = (1.0 - smoothstep(0.0, uAA, d)) * radialMaskAlpha(frag);
  gl_FragColor = vec4(vec3(0.2039, 0.8667, 0.3373), a);
}
`;

const fragOverlay = `
${FRAG_GRID_COMMON}
precision highp float;
#define MAX_OVR 64
uniform float uLogoMinS, uLogoMaxS;
uniform float uOverK;
uniform float uOverCount;
uniform vec4  uOverRectA[MAX_OVR];
uniform vec2  uOverRectB[MAX_OVR];

float sdRoundedBox(vec2 p, vec2 b, float r){
  vec2 q = abs(p) - b + vec2(r);
  return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r;
}

void main(){
  vec2 frag  = gl_FragCoord.xy;
  vec2 fragW = frag + uWorldOff;
  float cellS = uCell * uScale;
  vec2  gapS  = uGap  * uScale;
  vec2  pitch = vec2(cellS + gapS.x, cellS + gapS.y);
  vec2  anchor0 = 0.5*uWorld;
  float tCyc = uTime / max(uPeriod, 1.0e-4);
  float d = 1e9;
  int N = int(uOverCount+0.5);
  for(int i=0;i<MAX_OVR;++i){
    if(i>=N) break;
    vec4 a=uOverRectA[i];
    vec2 cW=a.xy; vec2 halfWH=a.zw;
    float rad=uOverRectB[i].x;
    vec2 idxLogo = floor((cW - anchor0)/pitch + 0.5);
    vec2 off = sampleDispAtW(cW);
    float scaleDiv = 1.0;
    if(uIsoScale>0.5){
      mat2 J=localJacEdgeW(cW);
      float div=J[0][0]+J[1][1];
      float s0=clamp(1.0 + uShapeAmp*div, 0.5, 2.0);
      vec2 stepPix=uWorld/max(uFieldSize-1.0, vec2(1.0));
      float edgePx=max(0.0, min(min(cW.x, uWorld.x-cW.x), min(cW.y, uWorld.y-cW.y)));
      float msk=smoothstep(0.0, max(stepPix.x,stepPix.y)*2.0, edgePx);
      scaleDiv=mix(1.0, s0, msk);
    }
    float wBreath = (uBreathe<0.5) ? 1.0 : breatheAt(idxLogo, tCyc);
    float sStatic = uLogoMaxS;
    float sBreath = mix(uLogoMinS, uLogoMaxS, wBreath);
    float sLogo   = mix(sStatic, sBreath, clamp(uBreatheMix, 0.0, 1.0));
    vec2 p   = fragW - (cW + off);
    float di = sdRoundedBox(p, halfWH*sLogo*scaleDiv, rad*sLogo*scaleDiv);
    d = smin(d, di, uOverK);
  }
  float outerW = 1.8 * uAA;
  float innerW = 1.5 * uAA;
  float innerOffset = 3.2 * uAA;
  float aOuter = 1.0 - smoothstep(outerW, outerW + uAA, abs(d));
  float aInner = 1.0 - smoothstep(innerW, innerW + uAA, abs(d + innerOffset));
  float aLogo = max(aOuter, aInner) * radialMaskAlpha(frag);
  if(aLogo<=0.0){ discard; }
  float m = sampleLensAtW(fragW);
  vec3 colorLogo = vec3(1.0);
  if(m>0.0){
    vec2  rBase = vec2(0.5 * cellS);
    vec2  anchor1 = anchor0 + 0.5*pitch;
    float d0 = sdGridUnion(frag, pitch, anchor0, rBase);
    float d1 = sdGridUnion(frag, pitch, anchor1, rBase);
    float base = min(cellS, min(pitch.x, pitch.y));
    float k = uKFac * base;
    float dg = smin(d0, d1, k);
    float aGrid = 1.0 - smoothstep(0.0, uAA, dg);
    vec3 lensColor = mix(vec3(1.0), vec3(0.0), aGrid);
    colorLogo = mix(colorLogo, lensColor, m);
  }
  gl_FragColor = vec4(colorLogo, aLogo);
}
`;

const vertSrc = `attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);} `;

/* ---------- M & A 字形 (MA Logo) ---------- */
const glyphA = [
  [-2.0, 0.5, 2.0, 9.0, 0.45],
  [2.0, 0.5, 2.0, 9.0, 0.45],
  [0.0, 5.0, 6.0, 2.0, 0.45],
  [0.0, 1.0, 4.0, 2.0, 0.45],
];
const glyphM = [
  [0.0, 7.0, 2.0, 2.5, 0.45],
  [8.0, 7.0, 2.0, 2.5, 0.45],
  [2.0, 5.0, 2.0, 2.5, 0.45],
  [6.0, 5.0, 2.0, 2.5, 0.45],
  [0.0, 0.0, 2.0, 5.5, 0.45],
  [4.0, 2.0, 2.0, 4.5, 0.45],
  [8.0, 0.0, 2.0, 5.5, 0.45],
];

function buildGlyph(g) {
  let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
  for (const [dx, dy, w, h] of g) {
    minx = Math.min(minx, dx - w / 2);
    maxx = Math.max(maxx, dx + w / 2);
    miny = Math.min(miny, dy - h / 2);
    maxy = Math.max(maxy, dy + h / 2);
  }
  return { glyph: g, minx, miny, maxx, maxy, w: maxx - minx, h: maxy - miny };
}

const GM = buildGlyph(glyphM);
const GA = buildGlyph(glyphA);
const overlayCfg = { charGapU: 2.5, kUnit: 0.35 };

let overlay = { count: 0, flatA: new Float32Array(0), flatB: new Float32Array(0), kPx: 12 };

function rebuildOverlay(field, params) {
  if (!field) return;
  const cellS = params.cell * params.scale;
  const gapX = Math.max(0, params.gapX);
  const gapY = Math.max(0, params.gapY);
  const pitch = { cellS, min: cellS + Math.min(gapX, gapY) };

  const logoScale = window.innerWidth < 430 ? Math.max(0.68, window.innerWidth / 430) : 1.0;
  const unitPx = pitch.cellS * logoScale;
  const gapU = overlayCfg.charGapU * logoScale;

  const cx = field.worldW * 0.5;
  const cy = field.worldH * 0.5;
  const totalU = GM.w + gapU + GA.w;
  const leftU = -totalU / 2;
  const rectsA = [];
  const rectsB = [];

  function pushGlyph(G, originU) {
    for (const [dx, dy, w, h, r] of G.glyph) {
      const cxU = originU + (dx - G.minx);
      const cyU = dy - (G.miny + G.h / 2);
      const cxW = cx + cxU * unitPx;
      const cyW = cy + cyU * unitPx;
      rectsA.push(cxW, cyW, 0.5 * w * unitPx, 0.5 * h * unitPx);
      rectsB.push(r * unitPx, 0);
    }
  }

  pushGlyph(GM, leftU);
  pushGlyph(GA, leftU + GM.w + gapU);

  overlay.count = rectsB.length / 2;
  overlay.flatA = new Float32Array(rectsA);
  overlay.flatB = new Float32Array(rectsB);
  overlay.kPx = overlayCfg.kUnit * unitPx;
}

export default function WebGLBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', {
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: false,
    });

    if (!gl) {
      console.error('WebGL not available');
      return;
    }

    if (!gl.getExtension('OES_texture_float')) {
      console.warn('OES_texture_float not available, using fallback');
    }

    gl.disable(gl.DITHER);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 1);

    function createShader(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      return shader;
    }

    function createProgram(vs, fs) {
      const program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
        return null;
      }
      return program;
    }

    const vs = createShader(gl.VERTEX_SHADER, vertSrc);
    const fsBase = createShader(gl.FRAGMENT_SHADER, fragBase);
    const fsOverlay = createShader(gl.FRAGMENT_SHADER, fragOverlay);

    if (!vs || !fsBase || !fsOverlay) return;

    const prBase = createProgram(vs, fsBase);
    const prOvr = createProgram(vs, fsOverlay);

    if (!prBase || !prOvr) return;

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    function bindAttrib(program) {
      gl.useProgram(program);
      const loc = gl.getAttribLocation(program, 'aPos');
      gl.enableVertexAttribArray(loc);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    }

    bindAttrib(prBase);
    bindAttrib(prOvr);

    // Parameters
    const params = {
      cell: 34,
      gapX: 10,
      gapY: 10,
      scale: 1.0,
      minS: 0.0,
      maxS: 0.38,
      period: 7.2,
      breath: true,
      nPow: 4.0,
      kFac: 0.52,
      shapeAmp: 0.45,
      full9: false,
      isoScale: false,
      bMode: 3,
      radLenU: 14,
      spiTurns: 2.0,
      spiLenU: 18,
      crossLenXU: 20,
      crossLenYU: 24,
      groupSizeU: 4,
      groupPhaseJit: 0.7,
      noiseScaleU: 5,
      noiseSpeedU: 0.35,
      noiseDeg: 72,
      noiseOct: 4,
      logoMinS: 0.75,
      logoMaxS: 1.15,
      inflMax: 0.35,
    };

    // Uniforms
    const getUniforms = (program, prefix = '') => ({
      uRes: gl.getUniformLocation(program, 'uRes'),
      uWorld: gl.getUniformLocation(program, 'uWorld'),
      uWorldOff: gl.getUniformLocation(program, 'uWorldOff'),
      uTime: gl.getUniformLocation(program, 'uTime'),
      uCell: gl.getUniformLocation(program, 'uCell'),
      uGap: gl.getUniformLocation(program, 'uGap'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uMinS: gl.getUniformLocation(program, 'uMinS'),
      uMaxS: gl.getUniformLocation(program, 'uMaxS'),
      uPeriod: gl.getUniformLocation(program, 'uPeriod'),
      uBreathe: gl.getUniformLocation(program, 'uBreathe'),
      uBreatheMix: gl.getUniformLocation(program, 'uBreatheMix'),
      uAA: gl.getUniformLocation(program, 'uAA'),
      uNPow: gl.getUniformLocation(program, 'uNPow'),
      uKFac: gl.getUniformLocation(program, 'uKFac'),
      uDisp: gl.getUniformLocation(program, 'uDisp'),
      uFieldSize: gl.getUniformLocation(program, 'uFieldSize'),
      uShapeAmp: gl.getUniformLocation(program, 'uShapeAmp'),
      uFull9: gl.getUniformLocation(program, 'uFull9'),
      uIsoScale: gl.getUniformLocation(program, 'uIsoScale'),
      uInflMax: gl.getUniformLocation(program, 'uInflMax'),
      uBMode: gl.getUniformLocation(program, 'uBMode'),
      uNoiseDir: gl.getUniformLocation(program, 'uNoiseDir'),
      uNoiseScale: gl.getUniformLocation(program, 'uNoiseScale'),
      uNoiseSpeed: gl.getUniformLocation(program, 'uNoiseSpeed'),
      uNoiseOct: gl.getUniformLocation(program, 'uNoiseOct'),
      uRadK: gl.getUniformLocation(program, 'uRadK'),
      uSpiAngK: gl.getUniformLocation(program, 'uSpiAngK'),
      uSpiRadK: gl.getUniformLocation(program, 'uSpiRadK'),
      uCrossKX: gl.getUniformLocation(program, 'uCrossKX'),
      uCrossKY: gl.getUniformLocation(program, 'uCrossKY'),
      uGroupSize: gl.getUniformLocation(program, 'uGroupSize'),
      uGroupPhaseJit: gl.getUniformLocation(program, 'uGroupPhaseJit'),
      uLogoMinS: gl.getUniformLocation(program, 'uLogoMinS'),
      uLogoMaxS: gl.getUniformLocation(program, 'uLogoMaxS'),
    });

    const uniforms = {
      base: getUniforms(prBase),
      ovr: {
        ...getUniforms(prOvr),
        uOverK: gl.getUniformLocation(prOvr, 'uOverK'),
        uOverCount: gl.getUniformLocation(prOvr, 'uOverCount'),
        uOverRectA: gl.getUniformLocation(prOvr, 'uOverRectA[0]'),
        uOverRectB: gl.getUniformLocation(prOvr, 'uOverRectB[0]'),
      },
    };

    // Field for mouse interaction
    let field = null;
    let fieldTexture = null;

    function initField() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = window.innerWidth * dpr;
      const height = window.innerHeight * dpr;
      const step = 6;
      const marginP = 4.0;
      const worldW = width + 2 * marginP * params.cell;
      const worldH = height + 2 * marginP * params.cell;
      const padPx = marginP * params.cell;
      const Nx = Math.ceil(worldW / step);
      const Ny = Math.ceil(worldH / step);

      field = {
        Nx, Ny, step, worldW, worldH, padPx,
        u: new Float32Array(Nx * Ny * 2),
        v: new Float32Array(Nx * Ny * 2),
        s: new Float32Array(Nx * Ny),
        L: new Float32Array(Nx * Ny),
        stgt: new Float32Array(Nx * Ny),
        ltgt: new Float32Array(Nx * Ny),
        pack: new Float32Array(Nx * Ny * 4),
      };

      fieldTexture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      if (gl.getExtension('OES_texture_float')) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Nx, Ny, 0, gl.RGBA, gl.FLOAT, null);
      } else {
        // Fallback to half float if available
        const ext = gl.getExtension('OES_texture_half_float');
        if (ext) {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Nx, Ny, 0, gl.RGBA, ext.HALF_FLOAT_OES, null);
        } else {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, Nx, Ny, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        }
      }
    }

    // Mouse interaction
    let mouse = { x: 0, y: 0, vx: 0, vy: 0, px: 0, py: 0, active: false };

    function handleMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - rect.left);
      mouse.y = rect.height - (e.clientY - rect.top);
      mouse.active = true;
    }

    function handleMouseLeave() {
      mouse.active = false;
    }

    function handleTouchMove(e) {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        const touch = e.touches[0];
        mouse.x = (touch.clientX - rect.left);
        mouse.y = rect.height - (touch.clientY - rect.top);
        mouse.active = true;
      }
    }

    function handleTouchEnd() {
      mouse.active = false;
    }

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('touchmove', handleTouchMove);
    canvas.addEventListener('touchend', handleTouchEnd);

    // Update field with mouse
    function applyBrush(dt) {
      if (!field || !mouse.active) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const speed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);
      const speedFactor = Math.min(speed / 500, 1);

      const worldX = mouse.x * dpr + field.padPx;
      const worldY = mouse.y * dpr + field.padPx;

      const brushR = 22;
      const resp = 0.65;
      const baseForce = 1500;

      const Nx = field.Nx;
      const idx = (i, j) => (i + j * Nx) * 2;
      const idxS = (i, j) => i + j * Nx;

      for (let j = 0; j < field.Ny; j++) {
        for (let i = 0; i < field.Nx; i++) {
          const cellX = i * field.step;
          const cellY = j * field.step;
          const dx = cellX - worldX;
          const dy = cellY - worldY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < brushR * 3) {
            const w = Math.max(0, 1 - dist / (brushR * 3));
            const smoothW = w * w * (3 - 2 * w);

            const dirx = dx / (dist + 0.1);
            const diry = dy / (dist + 0.1);

            const fi = idx(i, j);
            field.u[fi] += dirx * baseForce * smoothW * dt;
            field.u[fi + 1] += diry * baseForce * smoothW * dt;

            const cs = idxS(i, j);
            const tgt = params.maxS * resp * smoothW * speedFactor;
            if (tgt > field.stgt[cs]) field.stgt[cs] = tgt;
            field.ltgt[cs] = Math.pow(smoothW, 0.01);
          }
        }
      }
    }

    function updateField(dt) {
      if (!field) return;

      const springK = 34;
      const damp = 5.2;
      const tension = 24.0;
      const kCoef = 0.35;
      const dCoef = 0.0005;
      const tCoef = 0.0012;
      const inflDecay = 0.9;

      const Nx = field.Nx;
      const Ny = field.Ny;
      const idx = (i, j) => (i + j * Nx) * 2;
      const idxS = (i, j) => i + j * Nx;

      for (let j = 0; j < Ny; j++) {
        for (let i = 0; i < Nx; i++) {
          const p = idx(i, j);
          const q = idxS(i, j);

          // Spring force toward displacement
          let fx = 0, fy = 0;
          const d = 1;

          if (i > 0) { const lp = idx(i - d, j); fx += (field.u[lp] - field.u[p]); }
          if (i < Nx - 1) { const rp = idx(i + d, j); fx -= (field.u[rp] - field.u[p]); }
          if (j > 0) { const bp = idx(i, j - d); fy += (field.u[bp + 1] - field.u[p + 1]); }
          if (j < Ny - 1) { const tp = idx(i, j + d); fy -= (field.u[tp + 1] - field.u[p + 1]); }

          const fx2 = tension * fx;
          const fy2 = tension * fy;

          field.v[p] = (field.v[p] + (kCoef * fx2 - dCoef * field.v[p])) * Math.min(1, damp * dt);
          field.v[p + 1] = (field.v[p + 1] + (kCoef * fy2 - dCoef * field.v[p + 1])) * Math.min(1, damp * dt);

          // Add rest displacement (zero)
          field.u[p] = (field.u[p] + field.v[p] * dt) * inflDecay;
          field.u[p + 1] = (field.u[p + 1] + field.v[p + 1] * dt) * inflDecay;

          // Scale field
          field.s[q] = field.s[q] + (field.stgt[q] - field.s[q]) * 0.65;
          field.stgt[q] *= 0.9;

          field.L[q] = field.L[q] + (field.ltgt[q] - field.L[q]) * 0.65;
          field.ltgt[q] *= 0.9;
        }
      }
    }

    function uploadField() {
      if (!field || !fieldTexture) return;

      const Nx = field.Nx;
      const Ny = field.Ny;
      const { u, s, L, pack } = field;

      let k = 0;
      for (let j = 0; j < Ny; j++) {
        for (let i = 0; i < Nx; i++) {
          const p = (i + j * Nx) * 2;
          const q = i + j * Nx;
          pack[k++] = u[p];
          pack[k++] = u[p + 1];
          pack[k++] = s[q];
          pack[k++] = L[q];
        }
      }

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fieldTexture);

      const ext = gl.getExtension('OES_texture_float');
      if (ext) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, Nx, Ny, gl.RGBA, gl.FLOAT, pack);
      } else {
        const halfExt = gl.getExtension('OES_texture_half_float');
        if (halfExt) {
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, Nx, Ny, gl.RGBA, halfExt.HALF_FLOAT_OES, pack);
        } else {
          // Fallback to unsigned byte
          const bytes = new Uint8Array(pack.length);
          for (let i = 0; i < pack.length; i++) {
            bytes[i] = Math.max(0, Math.min(255, (pack[i] + 1) * 127.5));
          }
          gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, Nx, Ny, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
        }
      }
    }

    function setUniforms(time) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);

      const cellS = params.cell * params.scale;
      const gapS = { x: Math.max(0, params.gapX), y: Math.max(0, params.gapY) };
      const pitch = { x: cellS + gapS.x, y: cellS + gapS.y };

      // Base uniforms
      gl.useProgram(prBase);
      gl.uniform2f(uniforms.base.uRes, canvas.width, canvas.height);
      if (field) {
        gl.uniform2f(uniforms.base.uWorld, field.worldW, field.worldH);
        gl.uniform2f(uniforms.base.uWorldOff, field.padPx, field.padPx);
        gl.uniform2f(uniforms.base.uFieldSize, field.Nx, field.Ny);
      }
      gl.uniform1f(uniforms.base.uCell, params.cell);
      gl.uniform2f(uniforms.base.uGap, gapS.x, gapS.y);
      gl.uniform1f(uniforms.base.uScale, params.scale);
      gl.uniform1f(uniforms.base.uMinS, params.minS);
      gl.uniform1f(uniforms.base.uMaxS, params.maxS);
      gl.uniform1f(uniforms.base.uPeriod, params.period);
      gl.uniform1f(uniforms.base.uBreathe, params.breath ? 1.0 : 0.0);
      gl.uniform1f(uniforms.base.uBreatheMix, 1.0);
      gl.uniform1f(uniforms.base.uAA, 1.25);
      gl.uniform1f(uniforms.base.uNPow, params.nPow);
      gl.uniform1f(uniforms.base.uKFac, params.kFac);
      gl.uniform1f(uniforms.base.uShapeAmp, params.shapeAmp);
      gl.uniform1f(uniforms.base.uFull9, params.full9 ? 1.0 : 0.0);
      gl.uniform1f(uniforms.base.uIsoScale, params.isoScale ? 1.0 : 0.0);
      gl.uniform1f(uniforms.base.uInflMax, params.inflMax);
      gl.uniform1i(uniforms.base.uDisp, 0);
      gl.uniform1f(uniforms.base.uBMode, params.bMode);

      const ndeg = (params.noiseDeg * Math.PI) / 180;
      gl.uniform2f(uniforms.base.uNoiseDir, Math.cos(ndeg), Math.sin(ndeg));
      gl.uniform1f(uniforms.base.uNoiseScale, Math.max(1, params.noiseScaleU));
      gl.uniform1f(uniforms.base.uNoiseSpeed, Math.max(0, params.noiseSpeedU));
      gl.uniform1f(uniforms.base.uNoiseOct, Math.max(1, Math.min(4, params.noiseOct)));

      gl.uniform1f(uniforms.base.uRadK, (Math.PI * 2) / Math.max(2, params.radLenU));
      gl.uniform1f(uniforms.base.uSpiAngK, params.spiTurns);
      gl.uniform1f(uniforms.base.uSpiRadK, (Math.PI * 2) / Math.max(2, params.spiLenU));
      gl.uniform1f(uniforms.base.uCrossKX, (Math.PI * 2) / Math.max(2, params.crossLenXU));
      gl.uniform1f(uniforms.base.uCrossKY, (Math.PI * 2) / Math.max(2, params.crossLenYU));
      gl.uniform1f(uniforms.base.uGroupSize, Math.max(1, params.groupSizeU));
      gl.uniform1f(uniforms.base.uGroupPhaseJit, Math.max(0, Math.min(1, params.groupPhaseJit)));
      gl.uniform1f(uniforms.base.uTime, time / 1000);

      // Overlay uniforms
      gl.useProgram(prOvr);
      gl.uniform2f(uniforms.ovr.uRes, canvas.width, canvas.height);
      if (field) {
        gl.uniform2f(uniforms.ovr.uWorld, field.worldW, field.worldH);
        gl.uniform2f(uniforms.ovr.uWorldOff, field.padPx, field.padPx);
        gl.uniform2f(uniforms.ovr.uFieldSize, field.Nx, field.Ny);
      }
      gl.uniform1f(uniforms.ovr.uTime, time / 1000);
      gl.uniform1f(uniforms.ovr.uCell, params.cell);
      gl.uniform2f(uniforms.ovr.uGap, gapS.x, gapS.y);
      gl.uniform1f(uniforms.ovr.uScale, params.scale);
      gl.uniform1f(uniforms.ovr.uMinS, params.minS);
      gl.uniform1f(uniforms.ovr.uMaxS, params.maxS);
      gl.uniform1f(uniforms.ovr.uPeriod, params.period);
      gl.uniform1f(uniforms.ovr.uBreathe, params.breath ? 1.0 : 0.0);
      gl.uniform1f(uniforms.ovr.uBreatheMix, 1.0);
      gl.uniform1f(uniforms.ovr.uAA, 1.25);
      gl.uniform1f(uniforms.ovr.uNPow, params.nPow);
      gl.uniform1f(uniforms.ovr.uKFac, params.kFac);
      gl.uniform1f(uniforms.ovr.uShapeAmp, params.shapeAmp);
      gl.uniform1f(uniforms.ovr.uFull9, params.full9 ? 1.0 : 0.0);
      gl.uniform1f(uniforms.ovr.uIsoScale, params.isoScale ? 1.0 : 0.0);
      gl.uniform1f(uniforms.ovr.uInflMax, params.inflMax);
      gl.uniform1f(uniforms.ovr.uLogoMinS, params.logoMinS);
      gl.uniform1f(uniforms.ovr.uLogoMaxS, params.logoMaxS);
      gl.uniform1f(uniforms.ovr.uOverK, overlay.kPx);
      gl.uniform1f(uniforms.ovr.uOverCount, overlay.count);
      if (overlay.count > 0) {
        gl.uniform4fv(uniforms.ovr.uOverRectA, overlay.flatA);
        gl.uniform2fv(uniforms.ovr.uOverRectB, overlay.flatB);
      }
      gl.uniform1i(uniforms.ovr.uDisp, 0);
      gl.uniform1f(uniforms.ovr.uBMode, params.bMode);
      gl.uniform2f(uniforms.ovr.uNoiseDir, Math.cos(ndeg), Math.sin(ndeg));
      gl.uniform1f(uniforms.ovr.uNoiseScale, Math.max(1, params.noiseScaleU));
      gl.uniform1f(uniforms.ovr.uNoiseSpeed, Math.max(0, params.noiseSpeedU));
      gl.uniform1f(uniforms.ovr.uNoiseOct, Math.max(1, Math.min(4, params.noiseOct)));
      gl.uniform1f(uniforms.ovr.uRadK, (Math.PI * 2) / Math.max(2, params.radLenU));
      gl.uniform1f(uniforms.ovr.uSpiAngK, params.spiTurns);
      gl.uniform1f(uniforms.ovr.uSpiRadK, (Math.PI * 2) / Math.max(2, params.spiLenU));
      gl.uniform1f(uniforms.ovr.uCrossKX, (Math.PI * 2) / Math.max(2, params.crossLenXU));
      gl.uniform1f(uniforms.ovr.uCrossKY, (Math.PI * 2) / Math.max(2, params.crossLenYU));
      gl.uniform1f(uniforms.ovr.uGroupSize, Math.max(1, params.groupSizeU));
      gl.uniform1f(uniforms.ovr.uGroupPhaseJit, Math.max(0, Math.min(1, params.groupPhaseJit)));
    }

    function resize() {
      initField();
      rebuildOverlay(field, params);
    }

    function handleResize() {
      resize();
    }

    window.addEventListener('resize', handleResize);
    resize();

    let lastTime = performance.now();

    function animate(time) {
      const dt = Math.min(0.033, (time - lastTime) / 1000);
      lastTime = time;

      // Update mouse velocity
      if (mouse.active) {
        mouse.vx = (mouse.x - mouse.px) / dt;
        mouse.vy = (mouse.y - mouse.py) / dt;
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;

      applyBrush(dt);
      updateField(dt);
      uploadField();
      setUniforms(time);

      gl.useProgram(prBase);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      gl.useProgram(prOvr);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      requestAnimationFrame(animate);
    }

    const animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('touchmove', handleTouchMove);
      canvas.removeEventListener('touchend', handleTouchEnd);
      cancelAnimationFrame(animationId);

      if (fieldTexture) gl.deleteTexture(fieldTexture);
      if (buf) gl.deleteBuffer(buf);
      if (prBase) gl.deleteProgram(prBase);
      if (prOvr) gl.deleteProgram(prOvr);
      if (vs) gl.deleteShader(vs);
      if (fsBase) gl.deleteShader(fsBase);
      if (fsOverlay) gl.deleteShader(fsOverlay);
    };
  }, []);

  return (
    <canvas
      id="c"
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        background: '#050D1A',
      }}
    />
  );
}
