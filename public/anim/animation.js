/* ---------------- GL 公共 SDF + uBreatheMix + 轻量炫酷模式 ---------------- */
const FRAG_GRID_COMMON = `
precision highp float;
uniform vec2  uRes, uWorld, uWorldOff;
uniform float uTime, uCell, uScale, uMinS, uMaxS, uPeriod, uBreathe, uBreatheMix, uAA, uNPow, uKFac;
uniform vec2  uGap;
uniform sampler2D uDisp;     // RG:位移, B:放大量, A:透镜遮罩
uniform vec2  uFieldSize;
uniform float uShapeAmp, uFull9, uIsoScale, uInflMax;

/* 呼吸模式参数（0=噪声,1=径向波,2=螺旋扫波,3=双轴交错,4=分组错相） */
uniform float uBMode;

/* 噪声模式参数（保留） */
uniform vec2  uNoiseDir;    // 单位向量
uniform float uNoiseScale;  // 尺度(格)
uniform float uNoiseSpeed;  // 速率(格/s)
uniform float uNoiseOct;    // FBM阶数(1..4)

/* 轻量模式参数（新增） */
uniform float uRadK;                 // 径向：波数 = 2π/波长(格)
uniform float uSpiAngK, uSpiRadK;    // 螺旋：角向系数、径向波数
uniform float uCrossKX, uCrossKY;    // 双轴：X/Y 波数
uniform float uGroupSize;            // 分组：组尺寸(格)
uniform float uGroupPhaseJit;        // 分组：相位抖动幅度(0..1 映射到 0..2π)

/* --- SDF/工具 --- */
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
  // 椭圆遮罩：横向半径更大，左右保留更多可见区域
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

/* --- 随机/噪声 --- */
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

/* --- wBreath（五种模式，轻量） --- */
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

/* --- 预定义邻域偏移（WebGL1 兼容） --- */
vec2 offsetFromIndex(int m){
  if(m==0) return vec2( 0.0, 0.0);
  if(m==1) return vec2( 1.0, 0.0);
  if(m==2) return vec2(-1.0, 0.0);
  if(m==3) return vec2( 0.0, 1.0);
  if(m==4) return vec2( 0.0,-1.0);
  if(m==5) return vec2( 1.0, 1.0);
  if(m==6) return vec2( 1.0,-1.0);
  if(m==7) return vec2(-1.0, 1.0);
  // m==8
  return vec2(-1.0,-1.0);
}

/* --- 网格并集：per-cell 呼吸 + 平滑接入 + 叠加放大量 + 零尺寸跳过 --- */
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

    // 早退：已足够在内部（远小于AA）时，无需继续更远邻居
    if (best < -2.0 * uAA) break;
  }
  return best;
}
`;

/* ---------------- 底层小格片元 ---------------- */
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
  gl_FragColor = vec4(vec3(0.2039, 0.8667, 0.3373), a); // #34DD56
}
`;

/* ---------------- Logo 叠加层（持久透镜 & 与底层同呼吸） ---------------- */
const fragOverlay = `
${FRAG_GRID_COMMON}
precision highp float;
#define MAX_OVR 64
uniform float uLogoMinS, uLogoMaxS;
uniform float uOverK;
uniform float uOverCount;
uniform vec4  uOverRectA[MAX_OVR];  // (cx,cy,hx,hy) in world px
uniform vec2  uOverRectB[MAX_OVR];  // (r,0)

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

  // 双层描边：外描边 + 内描边（向内偏移）
  float outerW = 1.8 * uAA;
  float innerW = 1.5 * uAA;
  float innerOffset = 3.2 * uAA;
  float aOuter = 1.0 - smoothstep(outerW, outerW + uAA, abs(d));
  float aInner = 1.0 - smoothstep(innerW, innerW + uAA, abs(d + innerOffset));
  float aLogo = max(aOuter, aInner) * radialMaskAlpha(frag);
  if(aLogo<=0.0){ discard; }

  // 持久透镜：重算底层并反色融合
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

/* -------------- WebGL 组装 -------------- */
const canvas = document.getElementById("c");
const gl = canvas.getContext("webgl", {
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
});
if (!gl) {
    alert("WebGL 不可用");
    throw new Error("no webgl");
}
if (!gl.getExtension("OES_texture_float")) {
    alert("需要 OES_texture_float 扩展");
}
// 轻量 GPU 优化
gl.disable(gl.DITHER);
gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
gl.clearColor(0, 0, 0, 1);

const vertSrc = `attribute vec2 aPos;void main(){gl_Position=vec4(aPos,0.0,1.0);} `;
function sh(t, src) {
    const s = gl.createShader(t);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(s));
        throw new Error(gl.getShaderInfoLog(s) || "shader");
    }
    return s;
}
function prog(vs, fs) {
    const p = gl.createProgram();
    gl.attachShader(p, vs);
    gl.attachShader(p, fs);
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(p));
        throw new Error(gl.getProgramInfoLog(p) || "link");
    }
    return p;
}
const vs = sh(gl.VERTEX_SHADER, vertSrc);
const fsBase = sh(gl.FRAGMENT_SHADER, fragBase);
const fsOverlay = sh(gl.FRAGMENT_SHADER, fragOverlay);
const prBase = prog(vs, fsBase);
const prOvr = prog(vs, fsOverlay);

const buf = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, buf);
gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
);
function bindAttrib(p) {
    gl.useProgram(p);
    const loc = gl.getAttribLocation(p, "aPos");
    gl.enableVertexAttribArray(loc);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
}
bindAttrib(prBase);
bindAttrib(prOvr);

/* ---- （可选）半浮上传开关：默认 false 以确保完全一致 ---- */
const USE_HALF_FLOAT = false;
const extHF = USE_HALF_FLOAT ? gl.getExtension('OES_texture_half_float') : null;
let PACK_TYPE = gl.FLOAT;
let packHalfCache = null;

/* ---------- 统一的 half 转码（启用时才用） ---------- */
function f32ToF16Buf(dstU16, srcF32) {
    const f32 = new Float32Array(1);
    const u32 = new Uint32Array(f32.buffer);
    for (let i = 0; i < srcF32.length; i++) {
        f32[0] = srcF32[i];
        const x = u32[0];
        const sign = (x >>> 16) & 0x8000;
        let exp = ((x >>> 23) & 0xff) - 127 + 15;
        let mant = (x >> 13) & 0x3ff;
        if (exp <= 0) {
            if (exp < -10) { dstU16[i] = sign; continue; }
            mant = (mant | 0x400) >> (1 - exp);
            dstU16[i] = sign | mant;
        } else if (exp >= 0x1f) {
            dstU16[i] = sign | 0x7c00;
        } else {
            dstU16[i] = sign | (exp << 10) | mant;
        }
    }
}

/* ---- 底层 uniform ---- */
const uRes = gl.getUniformLocation(prBase, "uRes"),
    uWorld = gl.getUniformLocation(prBase, "uWorld"),
    uWorldOff = gl.getUniformLocation(prBase, "uWorldOff"),
    uTime = gl.getUniformLocation(prBase, "uTime"),
    uCell = gl.getUniformLocation(prBase, "uCell"),
    uGap = gl.getUniformLocation(prBase, "uGap"),
    uScale = gl.getUniformLocation(prBase, "uScale"),
    uMinS = gl.getUniformLocation(prBase, "uMinS"),
    uMaxS = gl.getUniformLocation(prBase, "uMaxS"),
    uPeriod = gl.getUniformLocation(prBase, "uPeriod"),
    uBreathe = gl.getUniformLocation(prBase, "uBreathe"),
    uBreatheMix = gl.getUniformLocation(prBase, "uBreatheMix"),
    uAA = gl.getUniformLocation(prBase, "uAA"),
    uNPow = gl.getUniformLocation(prBase, "uNPow"),
    uKFac = gl.getUniformLocation(prBase, "uKFac"),
    uDisp = gl.getUniformLocation(prBase, "uDisp"),
    uFieldSize = gl.getUniformLocation(prBase, "uFieldSize"),
    uShapeAmp = gl.getUniformLocation(prBase, "uShapeAmp"),
    uFull9 = gl.getUniformLocation(prBase, "uFull9"),
    uIsoScale = gl.getUniformLocation(prBase, "uIsoScale"),
    uInflMax = gl.getUniformLocation(prBase, "uInflMax"),
    uBMode = gl.getUniformLocation(prBase, "uBMode"),
    uNoiseDir = gl.getUniformLocation(prBase, "uNoiseDir"),
    uNoiseScale = gl.getUniformLocation(prBase, "uNoiseScale"),
    uNoiseSpeed = gl.getUniformLocation(prBase, "uNoiseSpeed"),
    uNoiseOct = gl.getUniformLocation(prBase, "uNoiseOct"),
    // 新增轻量模式
    uRadK = gl.getUniformLocation(prBase, "uRadK"),
    uSpiAngK = gl.getUniformLocation(prBase, "uSpiAngK"),
    uSpiRadK = gl.getUniformLocation(prBase, "uSpiRadK"),
    uCrossKX = gl.getUniformLocation(prBase, "uCrossKX"),
    uCrossKY = gl.getUniformLocation(prBase, "uCrossKY"),
    uGroupSize = gl.getUniformLocation(prBase, "uGroupSize"),
    uGroupPhaseJit = gl.getUniformLocation(prBase, "uGroupPhaseJit");

/* ---- 叠加层 uniform ---- */
const O = {
    uRes: gl.getUniformLocation(prOvr, "uRes"),
    uWorld: gl.getUniformLocation(prOvr, "uWorld"),
    uWorldOff: gl.getUniformLocation(prOvr, "uWorldOff"),
    uTime: gl.getUniformLocation(prOvr, "uTime"),
    uCell: gl.getUniformLocation(prOvr, "uCell"),
    uGap: gl.getUniformLocation(prOvr, "uGap"),
    uScale: gl.getUniformLocation(prOvr, "uScale"),
    uMinS: gl.getUniformLocation(prOvr, "uMinS"),
    uMaxS: gl.getUniformLocation(prOvr, "uMaxS"),
    uPeriod: gl.getUniformLocation(prOvr, "uPeriod"),
    uBreathe: gl.getUniformLocation(prOvr, "uBreathe"),
    uBreatheMix: gl.getUniformLocation(prOvr, "uBreatheMix"),
    uAA: gl.getUniformLocation(prOvr, "uAA"),
    uNPow: gl.getUniformLocation(prOvr, "uNPow"),
    uKFac: gl.getUniformLocation(prOvr, "uKFac"),
    uDisp: gl.getUniformLocation(prOvr, "uDisp"),
    uFieldSize: gl.getUniformLocation(prOvr, "uFieldSize"),
    uShapeAmp: gl.getUniformLocation(prOvr, "uShapeAmp"),
    uFull9: gl.getUniformLocation(prOvr, "uFull9"),
    uIsoScale: gl.getUniformLocation(prOvr, "uIsoScale"),
    uInflMax: gl.getUniformLocation(prOvr, "uInflMax"),
    uLogoMinS: gl.getUniformLocation(prOvr, "uLogoMinS"),
    uLogoMaxS: gl.getUniformLocation(prOvr, "uLogoMaxS"),
    uOverK: gl.getUniformLocation(prOvr, "uOverK"),
    uOverCount: gl.getUniformLocation(prOvr, "uOverCount"),
    uOverRectA: gl.getUniformLocation(prOvr, "uOverRectA[0]"),
    uOverRectB: gl.getUniformLocation(prOvr, "uOverRectB[0]"),
    uBMode: gl.getUniformLocation(prOvr, "uBMode"),
    uNoiseDir: gl.getUniformLocation(prOvr, "uNoiseDir"),
    uNoiseScale: gl.getUniformLocation(prOvr, "uNoiseScale"),
    uNoiseSpeed: gl.getUniformLocation(prOvr, "uNoiseSpeed"),
    uNoiseOct: gl.getUniformLocation(prOvr, "uNoiseOct"),
    uRadK: gl.getUniformLocation(prOvr, "uRadK"),
    uSpiAngK: gl.getUniformLocation(prOvr, "uSpiAngK"),
    uSpiRadK: gl.getUniformLocation(prOvr, "uSpiRadK"),
    uCrossKX: gl.getUniformLocation(prOvr, "uCrossKX"),
    uCrossKY: gl.getUniformLocation(prOvr, "uCrossKY"),
    uGroupSize: gl.getUniformLocation(prOvr, "uGroupSize"),
    uGroupPhaseJit: gl.getUniformLocation(prOvr, "uGroupPhaseJit"),
};

/* ---------- UI & 存储 ---------- */
const $ = (id) => document.getElementById(id);
const cell = $("cell"),
    cellv = $("cellv");
const gapX = $("gapX"),
    gapY = $("gapY");
const scale = $("scale"),
    scalev = $("scalev");
const minS = $("minS"),
    minSv = $("minSv");
const maxS = $("maxS"),
    maxSv = $("maxSv");
const period = $("period"),
    periodv = $("periodv");
const breath = $("breath");
const nPow = $("nPow"),
    nPowv = $("nPowv");
const kFac = $("kFac"),
    kFacv = $("kFacv");

// 新模式 UI
const bMode = $("bMode");
const radLenU = $("radLenU"),
    radLenUv = $("radLenUv");
const spiTurns = $("spiTurns"),
    spiTurnsv = $("spiTurnsv");
const spiLenU = $("spiLenU"),
    spiLenUv = $("spiLenUv");
const crossLenXU = $("crossLenXU"),
    crossLenXUv = $("crossLenXUv");
const crossLenYU = $("crossLenYU"),
    crossLenYUv = $("crossLenYUv");
const groupSizeU = $("groupSizeU"),
    groupSizeUv = $("groupSizeUv");
const groupPhaseJit = $("groupPhaseJit"),
    groupPhaseJitv = $("groupPhaseJitv");

// 噪声模式 UI（保留）
const noiseScaleU = $("noiseScaleU"),
    noiseScaleUv = $("noiseScaleUv");
const noiseSpeedU = $("noiseSpeedU"),
    noiseSpeedUv = $("noiseSpeedUv");
const noiseDeg = $("noiseDeg"),
    noiseDegv = $("noiseDegv");
const noiseOct = $("noiseOct"),
    noiseOctv = $("noiseOctv");

// 物理
const shapeAmp = $("shapeAmp"),
    shapeAmpv = $("shapeAmpv");
const springK = $("springK"),
    springKv = $("springKv");
const damp = $("damp"),
    dampv = $("dampv");
const tension = $("tension"),
    tensionv = $("tensionv");
const brushR = $("brushR"),
    brushRv = $("brushRv");
const brushF = $("brushF"),
    brushFv = $("brushFv");
const fieldStep = $("fieldStep"),
    fieldStepv = $("fieldStepv");
const isoScale = $("isoScale"),
    full9 = $("full9");
const marginP = $("marginP"),
    marginPv = $("marginPv");
const useSpeed = $("useSpeed"),
    vTau = $("vTau"),
    vTauv = $("vTauv"),
    vMax = $("vMax");
const speedv = document.getElementById("speedv");
const kCoef = $("kCoef"),
    dCoef = $("dCoef"),
    tCoef = $("tCoef"),
    rCoef = $("rCoef"),
    fCoef = $("fCoef");
const inflMax = $("inflMax"),
    inflMaxv = $("inflMaxv");
const inflResp = $("inflResp"),
    inflRespv = $("inflRespv");
const inflDecay = $("inflDecay"),
    inflDecayv = $("inflDecayv");
const inflVRef = $("inflVRef"),
    inflVDead = $("inflVDead");
const capBase = $("capBase"),
    capBasev = $("capBasev");
const capK = $("capK"),
    capKv = $("capKv");
const reentryMs = $("reentryMs");
const logoMinS = $("logoMinS"),
    logoMinSv = $("logoMinSv");
const logoMaxS = $("logoMaxS"),
    logoMaxSv = $("logoMaxSv");
const lensFeather = $("lensFeather"),
    lensFeatherv = $("lensFeatherv");

let speedSmoothed = 0;
const KEY = "grid_world_inflate_v4_calm_dark";

/* 目标参数（最终将到达这里） */
const defaults = {
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
    springK: 34,
    damp: 5.2,
    tension: 24.0,
    brushR: 22,
    brushF: 1500,
    fieldStep: 6,
    isoScale: false,
    full9: false,
    marginP: 4.0,
    useSpeed: true,
    vTau: 0.6,
    vMax: 5000,
    kCoef: 0.35,
    dCoef: 0.0005,
    tCoef: 0.0012,
    rCoef: 0.03,
    fCoef: 0.25,
    inflMax: 0.35,
    inflResp: 0.65,
    inflDecay: 0.9,
    inflVRef: 700,
    inflVDead: 80,
    capBase: 0.45,
    capK: 1.8,
    reentryMs: 160,
    logoMinS: 0.75,
    logoMaxS: 1.15,
    lensFeather: 0.0,

    // 模式默认：从噪声开始
    bMode: 3,

    // 轻量模式默认参数
    radLenU: 14,
    spiTurns: 2.0,
    spiLenU: 18,
    crossLenXU: 20,
    crossLenYU: 24,
    groupSizeU: 4,
    groupPhaseJit: 0.7,

    // 噪声模式默认参数
    noiseScaleU: 5,
    noiseSpeedU: 0.35,
    noiseDeg: 72,
    noiseOct: 4,
};

function loadCfg() {
    try {
        return Object.assign(
            {},
            defaults,
            JSON.parse(localStorage.getItem(KEY) || "{}")
        );
    } catch {
        return { ...defaults };
    }
}
function saveCfg() {
    const cfg = {
        cell: +cell.value,
        gapX: +gapX.value,
        gapY: +gapY.value,
        scale: +scale.value,
        minS: +minS.value,
        maxS: +maxS.value,
        period: +period.value,
        breath: !!breath?.checked,
        nPow: +nPow.value,
        kFac: +kFac.value,
        shapeAmp: +shapeAmp.value,
        springK: +springK.value,
        damp: +damp.value,
        tension: +tension.value,
        brushR: +brushR.value,
        brushF: +brushF.value,
        fieldStep: +fieldStep.value,
        isoScale: !!isoScale?.checked,
        full9: !!full9?.checked,
        marginP: +marginP.value,
        useSpeed: !!useSpeed?.checked,
        vTau: +vTau.value,
        vMax: +vMax.value,
        kCoef: +kCoef.value,
        dCoef: +dCoef.value,
        tCoef: +tCoef.value,
        rCoef: +rCoef.value,
        fCoef: +fCoef.value,
        inflMax: +inflMax.value,
        inflResp: +inflResp.value,
        inflDecay: +inflDecay.value,
        inflVRef: +inflVRef.value,
        inflVDead: +inflVDead.value,
        capBase: +capBase.value,
        capK: +capK.value,
        reentryMs: +reentryMs.value,
        logoMinS: +logoMinS.value,
        logoMaxS: +logoMaxS.value,
        lensFeather: +lensFeather.value,

        bMode: +bMode.value,

        radLenU: +radLenU.value,
        spiTurns: +spiTurns.value,
        spiLenU: +spiLenU.value,
        crossLenXU: +crossLenXU.value,
        crossLenYU: +crossLenYU.value,
        groupSizeU: +groupSizeU.value,
        groupPhaseJit: +groupPhaseJit.value,

        noiseScaleU: +noiseScaleU.value,
        noiseSpeedU: +noiseSpeedU.value,
        noiseDeg: +noiseDeg.value,
        noiseOct: +noiseOct.value,
    };
    localStorage.setItem(KEY, JSON.stringify(cfg));
}
function syncLabels() {
    const f2 = (v) => (+v).toFixed(2),
        f1 = (v) => (+v).toFixed(1),
        f0 = (v) => (+v).toFixed(0);
    if (cellv) cellv.textContent = f0(cell.value);
    if (scalev) scalev.textContent = f2(scale.value);
    if (minSv) minSv.textContent = f2(minS.value);
    if (maxSv) maxSv.textContent = f2(maxS.value);
    if (periodv) periodv.textContent = f1(period.value);
    if (nPowv) nPowv.textContent = f1(nPow.value);
    if (kFacv) kFacv.textContent = f2(kFac.value);

    if (radLenUv) radLenUv.textContent = f0(radLenU.value);
    if (spiTurnsv) spiTurnsv.textContent = f1(spiTurns.value);
    if (spiLenUv) spiLenUv.textContent = f0(spiLenU.value);
    if (crossLenXUv) crossLenXUv.textContent = f0(crossLenXU.value);
    if (crossLenYUv) crossLenYUv.textContent = f0(crossLenYU.value);
    if (groupSizeUv) groupSizeUv.textContent = f0(groupSizeU.value);
    if (groupPhaseJitv)
        groupPhaseJitv.textContent = f2(groupPhaseJit.value);

    if (noiseScaleUv) noiseScaleUv.textContent = f0(noiseScaleU.value);
    if (noiseSpeedUv) noiseSpeedUv.textContent = f2(noiseSpeedU.value);
    if (noiseDegv) noiseDegv.textContent = f0(noiseDeg.value);
    if (noiseOctv) noiseOctv.textContent = f0(noiseOct.value);

    if (shapeAmpv) shapeAmpv.textContent = f2(shapeAmp.value);
    if (springKv) springKv.textContent = f0(springK.value);
    if (dampv) dampv.textContent = f2(damp.value);
    if (tensionv) tensionv.textContent = f2(tension.value);
    if (brushRv) brushRv.textContent = f0(brushR.value);
    if (brushFv) brushFv.textContent = f0(brushF.value);
    if (fieldStepv) fieldStepv.textContent = f0(fieldStep.value);
    if (marginPv) marginPv.textContent = f2(marginP.value);
    if (vTauv) vTauv.textContent = f2(vTau.value);
    if (speedv) speedv.textContent = Math.round(speedSmoothed);
    if (inflMaxv) inflMaxv.textContent = f2(inflMax.value);
    if (inflRespv) inflRespv.textContent = f2(inflResp.value);
    if (inflDecayv) inflDecayv.textContent = f2(inflDecay.value);
    if (capBasev) capBasev.textContent = f2(capBase.value);
    if (capKv) capKv.textContent = f2(capK.value);
    if (logoMinSv) logoMinSv.textContent = f2(logoMinS.value);
    if (logoMaxSv) logoMaxSv.textContent = f2(logoMaxS.value);
    if (lensFeatherv) lensFeatherv.textContent = f2(lensFeather.value);
}
function currentPitchPx() {
    const cellS = +cell.value * +scale.value;
    const gapSX = Math.max(0, +gapX.value) * +scale.value;
    const gapSY = Math.max(0, +gapY.value) * +scale.value;
    return {
        x: cellS + gapSX,
        y: cellS + gapSY,
        min: Math.min(cellS + gapSX, cellS + gapSY),
        cellS,
    };
}

/* ---------- M & A 字形 ---------- */
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
const overlayCfg = { charGapU: 2.5, kUnit: 0.35 };
const overlay = {
    count: 0,
    flatA: new Float32Array(0),
    flatB: new Float32Array(0),
    kPx: 12,
};
function buildGlyph(g) {
    let minx = 1e9,
        miny = 1e9,
        maxx = -1e9,
        maxy = -1e9;
    for (const [dx, dy, w, h] of g) {
        minx = Math.min(minx, dx - w / 2);
        maxx = Math.max(maxx, dx + w / 2);
        miny = Math.min(miny, dy - h / 2);
        maxy = Math.max(maxy, dy + h / 2);
    }
    return {
        glyph: g,
        minx,
        miny,
        maxx,
        maxy,
        w: maxx - minx,
        h: maxy - miny,
    };
}
const GM = buildGlyph(glyphM),
    GA = buildGlyph(glyphA);
function rebuildOverlay() {
    const pitch = currentPitchPx();

    // 小屏自适应
    const logoScale = innerWidth < 430 ? Math.max(0.68, innerWidth / 430) : 1.0;

    const unitPx = pitch.cellS * logoScale;
    const gapU = overlayCfg.charGapU * logoScale;

    const cx = field.worldW * 0.5, cy = field.worldH * 0.5;
    const totalU = GM.w + gapU + GA.w, leftU = -totalU / 2;
    const rectsA = [], rectsB = [];

    function pushGlyph(G, originU) {
        for (const [dx, dy, w, h, r] of G.glyph) {
            const cxU = originU + (dx - G.minx);
            const cyU = dy - (G.miny + G.h / 2);
            const cxW = cx + cxU * unitPx, cyW = cy + cyU * unitPx;
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


/* ---------- 位移/放大量/透镜 场 ---------- */
let field = null;
function createTexture(w, h) {
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    PACK_TYPE = (USE_HALF_FLOAT && extHF) ? extHF.HALF_FLOAT_OES : gl.FLOAT;
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        w,
        h,
        0,
        gl.RGBA,
        PACK_TYPE,
        null
    );
    return tex;
}
function initField() {
    const step = +fieldStep.value;
    const pitch = currentPitchPx();
    const padPx = Math.max(0, +marginP.value * pitch.min);
    const worldW = canvas.width + 2 * padPx,
        worldH = canvas.height + 2 * padPx;
    const Nx = Math.max(2, Math.floor(worldW / step) + 1),
        Ny = Math.max(2, Math.floor(worldH / step) + 1);
    const hx = worldW / (Nx - 1),
        hy = worldH / (Ny - 1);
    field = {
        Nx,
        Ny,
        hx,
        hy,
        worldW,
        worldH,
        padPx,
        u: new Float32Array(Nx * Ny * 2),
        v: new Float32Array(Nx * Ny * 2),
        s: new Float32Array(Nx * Ny),
        stgt: new Float32Array(Nx * Ny),
        l: new Float32Array(Nx * Ny),
        ltgt: new Float32Array(Nx * Ny),
        tex: createTexture(Nx, Ny),
        pack: new Float32Array(Nx * Ny * 4),
    };
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, field.tex);
    gl.useProgram(prBase);
    gl.uniform1i(uDisp, 0);
    gl.uniform2f(uFieldSize, Nx, Ny);
    gl.uniform2f(uWorld, worldW, worldH);
    gl.uniform2f(uWorldOff, padPx, padPx);
}
function idx(i, j) { return 2 * (i + j * field.Nx); }
function idxS(i, j) { return i + j * field.Nx; }

function stepField(dt, eff) {
    const Nx = field.Nx, Ny = field.Ny, u = field.u, v = field.v;
    const k = eff.k, d = eff.d, T = eff.t, Ucap = eff.Ucap;
    for (let j = 1; j < Ny - 1; j++) {
        for (let i = 1; i < Nx - 1; i++) {
            const c = idx(i, j), l = idx(i - 1, j), r = idx(i + 1, j),
                t = idx(i, j - 1), b = idx(i, j + 1);
            const lapx = u[l] + u[r] + u[t] + u[b] - 4 * u[c];
            const lapy = u[l + 1] + u[r + 1] + u[t + 1] + u[b + 1] - 4 * u[c + 1];
            const ax = k * lapx - T * u[c] - d * v[c];
            const ay = k * lapy - T * u[c + 1] - d * v[c + 1];
            v[c] += ax * dt;
            v[c + 1] += ay * dt;
        }
    }
    // 边界固定
    for (let i = 0; i < Nx; i++) {
        let c0 = idx(i, 0), c1 = idx(i, Ny - 1);
        v[c0] = v[c0 + 1] = u[c0] = u[c0 + 1] = 0;
        v[c1] = v[c1 + 1] = u[c1] = u[c1 + 1] = 0;
    }
    for (let j = 0; j < Ny; j++) {
        let c0 = idx(0, j), c1 = idx(Nx - 1, j);
        v[c0] = v[c0 + 1] = u[c0] = u[c0 + 1] = 0;
        v[c1] = v[c1 + 1] = u[c1] = u[c1 + 1] = 0;
    }
    for (let n = 0; n < u.length; n++) u[n] += v[n] * dt;

    if (Ucap > 0) {
        for (let j = 0; j < Ny; j++)
            for (let i = 0; i < Nx; i++) {
                const c = idx(i, j),
                    ux = u[c], uy = u[c + 1],
                    len = Math.hypot(ux, uy);
                if (len > Ucap) {
                    const s = Ucap / len;
                    u[c] = ux * s; u[c + 1] = uy * s;
                    v[c] *= s; v[c + 1] *= s;
                }
            }
    }
}

// 放大 & 透镜：线性恢复
function stepInflateAndLens(dt) {
    const Nx = field.Nx, Ny = field.Ny, s = field.s, st = field.stgt, L = field.l, Lt = field.ltgt;
    const sMax = +inflMax.value, decay = +inflDecay.value;
    for (let j = 0; j < Ny; j++)
        for (let i = 0; i < Nx; i++) {
            const c = idxS(i, j);
            const tgtS = Math.min(sMax, st[c]);
            s[c] = tgtS > s[c] ? tgtS : Math.max(0, s[c] - decay * dt);
            st[c] = 0;
            const tgtL = Math.min(1.0, Lt[c]);
            L[c] = tgtL > L[c] ? tgtL : Math.max(0, L[c] - decay * dt);
            Lt[c] = 0;
        }
}

/* ---------- 输入（PC+移动，合帧采样） ---------- */
const mouse = {
    x: 0, y: 0, px: 0, py: 0, vx: 0, vy: 0,
    in: false, initialized: false, lastTS: 0, activeId: null,
};
function toCanvasXY(e) {
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / rect.width, sy = canvas.height / rect.height;
    return { nx: (e.clientX - rect.left) * sx, ny: (rect.bottom - e.clientY) * sy };
}
canvas.addEventListener("pointerenter", (e) => {
    const { nx, ny } = toCanvasXY(e);
    mouse.x = mouse.px = nx; mouse.y = mouse.py = ny;
    mouse.vx = mouse.vy = 0; speedSmoothed = 0;
    mouse.in = true; mouse.lastTS = performance.now();
});
canvas.addEventListener("pointerleave", () => { mouse.in = false; });
canvas.addEventListener("pointerdown", (e) => {
    const { nx, ny } = toCanvasXY(e);
    if (e.pointerType === "touch") { canvas.setPointerCapture(e.pointerId); mouse.activeId = e.pointerId; e.preventDefault(); }
    mouse.x = mouse.px = nx; mouse.y = mouse.py = ny;
    mouse.vx = mouse.vy = 0; speedSmoothed = 0;
    mouse.in = true; mouse.lastTS = performance.now();
});
canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "touch") {
        if (mouse.activeId !== e.pointerId) return;
        e.preventDefault();
    }
    const now = performance.now();
    const stale = now - (mouse.lastTS || now) > (+reentryMs?.value || 0);

    const list = (e.getCoalescedEvents ? e.getCoalescedEvents() : [e]);
    for (const ev of list) {
        const { nx, ny } = toCanvasXY(ev);
        if (stale) {
            mouse.px = nx; mouse.py = ny; mouse.vx = mouse.vy = 0; speedSmoothed = 0;
        } else {
            mouse.px = mouse.x; mouse.py = mouse.y;
            // 速度在 computeEffective 里用 (cur-prev)/dt 计算；这里仅更新位置
        }
        mouse.x = nx; mouse.y = ny; mouse.lastTS = now;
    }
}, { passive: false });
function endTouch(e) {
    if (e.pointerType === "touch" && mouse.activeId === e.pointerId) {
        try { canvas.releasePointerCapture(e.pointerId); } catch { }
        mouse.activeId = null; mouse.in = false;
    }
}
canvas.addEventListener("pointerup", endTouch);
canvas.addEventListener("pointercancel", endTouch);

function computeEffective(dt) {
    if (!mouse.initialized) {
        mouse.px = mouse.x; mouse.py = mouse.y; mouse.initialized = true;
    }
    const curX = mouse.x, curY = mouse.y, prevX = mouse.px, prevY = mouse.py;
    const vx = (curX - prevX) / Math.max(dt, 1e-4);
    const vy = (curY - prevY) / Math.max(dt, 1e-4);
    mouse.vx = vx; mouse.vy = vy; mouse.px = curX; mouse.py = curY;

    const vInst = Math.hypot(vx, vy);
    const vmax = Math.max(10, +vMax.value);
    const vClamped = Math.min(vInst, vmax);
    const tau = Math.max(0, +vTau.value);
    const alpha = tau > 0 ? Math.min(1, dt / (tau + 1e-6)) : 1;
    speedSmoothed = (1 - alpha) * speedSmoothed + alpha * vClamped;

    const use = !!useSpeed?.checked;
    const k0 = +springK.value, d0 = +damp.value, t0 = +tension.value;
    const R0 = +brushR.value, F0 = +brushF.value;
    let k = k0, d = d0, t = t0, R = R0, F = F0;
    if (use) {
        k = k0 + +kCoef.value * speedSmoothed;
        d = d0 / (1 + Math.max(0, +dCoef.value) * speedSmoothed);
        t = t0 + +tCoef.value * speedSmoothed;
        R = R0 + +rCoef.value * speedSmoothed;
        F = F0 + +fCoef.value * speedSmoothed;
    }
    k = Math.min(60, Math.max(2, k));
    d = Math.min(6.6, Math.max(0.02, d));
    t = Math.min(56, Math.max(0, t));
    R = Math.min(240, Math.max(10, R));
    F = Math.min(3000, Math.max(50, F));

    const pitch = currentPitchPx();
    const vRef = Math.max(1, +inflVRef.value);
    const mul = +capBase.value + +capK.value * Math.min(1, speedSmoothed / vRef);
    const Ucap = Math.max(0, mul) * pitch.min;

    return { k, d, t, R, F, vInst, Ucap, prevX, prevY, curX, curY };
}

/* -------- 胶囊刷：一帧一段，绝不卡断 ---------- */
function distPointToSegment(px, py, ax, ay, bx, by) {
    const abx = bx - ax, aby = by - ay;
    const apx = px - ax, apy = py - ay;
    const ab2 = abx * abx + aby * aby || 1e-6;
    let t = (apx * abx + apy * aby) / ab2;
    t = t < 0 ? 0 : (t > 1 ? 1 : t);
    const nx = ax + t * abx, ny = ay + t * aby;
    const dx = px - nx, dy = py - ny;
    return { d: Math.hypot(dx, dy), nx, ny, t };
}
function applyBrush(dt, eff) {
    if (!mouse.in) return;
    const ax = eff.prevX + field.padPx, ay = eff.prevY + field.padPx;
    const bx = eff.curX + field.padPx, by = eff.curY + field.padPx;

    const R = eff.R, F = eff.F;
    const seg = Math.hypot(bx - ax, by - ay);
    if (seg < 0.25) return;

    const dirx = (bx - ax) / seg, diry = (by - ay) / seg;
    const Nx = field.Nx, Ny = field.Ny, hx = field.hx, hy = field.hy;

    const minx = Math.max(1, Math.floor((Math.min(ax, bx) - R) / hx));
    const maxx = Math.min(Nx - 2, Math.ceil((Math.max(ax, bx) + R) / hx));
    const miny = Math.max(1, Math.floor((Math.min(ay, by) - R) / hy));
    const maxy = Math.min(Ny - 2, Math.ceil((Math.max(ay, by) + R) / hy));

    const vRef = Math.max(1, +inflVRef.value);
    const vDead = Math.max(0, +inflVDead.value);
    const vInst = eff.vInst;
    const vEff = Math.max(0, vInst - vDead);
    const speedFactor = Math.min(1, vEff / vRef);
    const sMax = +inflMax.value, resp = +inflResp.value;

    // 与原版一致的“单位风格”：dt 是秒，这里沿用 /1000 的手感缩放
    const baseForce = (F * eff.vInst * dt) / 1000.0;

    for (let j = miny; j <= maxy; j++) {
        const py = j * hy;
        for (let i = minx; i <= maxx; i++) {
            const px = i * hx;
            const { d } = distPointToSegment(px, py, ax, ay, bx, by);
            if (d > R) continue;

            const w = Math.pow(1.0 - (d * d) / (R * R), 2.0);

            const c = idx(i, j);
            field.v[c] += dirx * baseForce * w;
            field.v[c + 1] += diry * baseForce * w;

            const cs = idxS(i, j);
            const tgt = sMax * resp * w * speedFactor;
            if (tgt > field.stgt[cs]) field.stgt[cs] = tgt;

            const lensT = Math.pow(w, 0.01);
            if (lensT > field.ltgt[cs]) field.ltgt[cs] = lensT;
        }
    }
}

function uploadField() {
    const Nx = field.Nx, Ny = field.Ny;
    const u = field.u, s = field.s, L = field.l;

    let k = 0, pack = field.pack;
    for (let j = 0; j < Ny; j++)
        for (let i = 0; i < Nx; i++) {
            const p = idx(i, j), q = idxS(i, j);
            pack[k++] = u[p];
            pack[k++] = u[p + 1];
            pack[k++] = s[q];
            pack[k++] = L[q];
        }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, field.tex);

    if (PACK_TYPE === gl.FLOAT) {
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, Nx, Ny, gl.RGBA, gl.FLOAT, pack);
    } else {
        if (!packHalfCache || packHalfCache.length !== pack.length)
            packHalfCache = new Uint16Array(pack.length);
        f32ToF16Buf(packHalfCache, pack);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, Nx, Ny, gl.RGBA, PACK_TYPE, packHalfCache);
    }
}

/* ---------- 尺寸/Uniform ---------- */
let breatheMix = 0.0;

function setCanvasSize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
}
function setUniformsBase() {
    gl.useProgram(prBase);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    if (field) {
        gl.uniform2f(uWorld, field.worldW, field.worldH);
        gl.uniform2f(uWorldOff, field.padPx, field.padPx);
        gl.uniform2f(uFieldSize, field.Nx, field.Ny);
    }
    gl.uniform1f(uCell, +cell.value);
    gl.uniform2f(uGap, Math.max(0, +gapX.value), Math.max(0, +gapY.value));
    gl.uniform1f(uScale, +scale.value);
    gl.uniform1f(uMinS, +minS.value);
    gl.uniform1f(uMaxS, +maxS.value);
    gl.uniform1f(uPeriod, +period.value);
    gl.uniform1f(uBreathe, breath?.checked ? 1.0 : 0.0);
    gl.uniform1f(uBreatheMix, breatheMix);
    gl.uniform1f(uAA, 1.25);
    gl.uniform1f(uNPow, +nPow.value);
    gl.uniform1f(uKFac, +kFac.value);
    gl.uniform1f(uShapeAmp, +shapeAmp.value);
    gl.uniform1f(uFull9, full9?.checked ? 1.0 : 0.0);
    gl.uniform1f(uIsoScale, isoScale?.checked ? 1.0 : 0.0);
    gl.uniform1f(uInflMax, +inflMax.value);
    gl.uniform1i(uDisp, 0);

    // 模式选择
    gl.uniform1f(uBMode, +bMode.value || 0);

    // 噪声（保留）
    const ndeg = ((+noiseDeg?.value || 0) * Math.PI) / 180;
    gl.uniform2f(uNoiseDir, Math.cos(ndeg), Math.sin(ndeg));
    gl.uniform1f(uNoiseScale, Math.max(1, +noiseScaleU?.value || 9));
    gl.uniform1f(uNoiseSpeed, Math.max(0, +noiseSpeedU?.value || 0));
    gl.uniform1f(uNoiseOct, Math.max(1, Math.min(4, +noiseOct?.value || 1)));

    // 轻量模式参数
    const radLen = Math.max(2, +radLenU?.value || 14);
    gl.uniform1f(uRadK, (Math.PI * 2) / radLen);

    gl.uniform1f(uSpiAngK, +spiTurns?.value || 2.0);
    const spiLen = Math.max(2, +spiLenU?.value || 18);
    gl.uniform1f(uSpiRadK, (Math.PI * 2) / spiLen);

    const cxLen = Math.max(2, +crossLenXU?.value || 12);
    const cyLen = Math.max(2, +crossLenYU?.value || 16);
    gl.uniform1f(uCrossKX, (Math.PI * 2) / cxLen);
    gl.uniform1f(uCrossKY, (Math.PI * 2) / cyLen);

    gl.uniform1f(uGroupSize, Math.max(1, +groupSizeU?.value || 4));
    gl.uniform1f(uGroupPhaseJit, Math.max(0, Math.min(1, +groupPhaseJit?.value || 0.7)));
}
function setUniformsOvr() {
    gl.useProgram(prOvr);
    gl.uniform2f(O.uRes, canvas.width, canvas.height);
    if (field) {
        gl.uniform2f(O.uWorld, field.worldW, field.worldH);
        gl.uniform2f(O.uWorldOff, field.padPx, field.padPx);
        gl.uniform2f(O.uFieldSize, field.Nx, field.Ny);
    }
    gl.uniform1f(O.uTime, performance.now() / 1000);
    gl.uniform1f(O.uCell, +cell.value);
    gl.uniform2f(O.uGap, Math.max(0, +gapX.value), Math.max(0, +gapY.value));
    gl.uniform1f(O.uScale, +scale.value);
    gl.uniform1f(O.uMinS, +minS.value);
    gl.uniform1f(O.uMaxS, +maxS.value);
    gl.uniform1f(O.uPeriod, +period.value);
    gl.uniform1f(O.uBreathe, breath?.checked ? 1.0 : 0.0);
    gl.uniform1f(O.uBreatheMix, breatheMix);
    gl.uniform1f(O.uAA, 1.25);
    gl.uniform1f(O.uNPow, +nPow.value);
    gl.uniform1f(O.uKFac, +kFac.value);
    gl.uniform1f(O.uShapeAmp, +shapeAmp.value);
    gl.uniform1f(O.uFull9, full9?.checked ? 1.0 : 0.0);
    gl.uniform1f(O.uIsoScale, isoScale?.checked ? 1.0 : 0.0);
    gl.uniform1f(O.uInflMax, +inflMax.value);
    gl.uniform1f(O.uLogoMinS, +logoMinS.value);
    gl.uniform1f(O.uLogoMaxS, +logoMaxS.value);
    gl.uniform1f(O.uOverK, overlay.kPx);
    gl.uniform1f(O.uOverCount, overlay.count);
    if (overlay.count > 0) {
        gl.uniform4fv(O.uOverRectA, overlay.flatA);
        gl.uniform2fv(O.uOverRectB, overlay.flatB);
    }
    gl.uniform1i(O.uDisp, 0);

    gl.uniform1f(O.uBMode, +bMode.value || 0);

    const ndeg = ((+noiseDeg?.value || 0) * Math.PI) / 180;
    gl.uniform2f(O.uNoiseDir, Math.cos(ndeg), Math.sin(ndeg));
    gl.uniform1f(O.uNoiseScale, Math.max(1, +noiseScaleU?.value || 9));
    gl.uniform1f(O.uNoiseSpeed, Math.max(0, +noiseSpeedU?.value || 0));
    gl.uniform1f(O.uNoiseOct, Math.max(1, Math.min(4, +noiseOct?.value || 1)));

    const radLen = Math.max(2, +radLenU?.value || 14);
    gl.uniform1f(O.uRadK, (Math.PI * 2) / radLen);
    gl.uniform1f(O.uSpiAngK, +spiTurns?.value || 2.0);
    const spiLen = Math.max(2, +spiLenU?.value || 18);
    gl.uniform1f(O.uSpiRadK, (Math.PI * 2) / spiLen);
    const cxLen = Math.max(2, +crossLenXU?.value || 12);
    const cyLen = Math.max(2, +crossLenYU?.value || 16);
    gl.uniform1f(O.uCrossKX, (Math.PI * 2) / cxLen);
    gl.uniform1f(O.uCrossKY, (Math.PI * 2) / cyLen);
    gl.uniform1f(O.uGroupSize, Math.max(1, +groupSizeU?.value || 4));
    gl.uniform1f(O.uGroupPhaseJit, Math.max(0, Math.min(1, +groupPhaseJit?.value || 0.7)));
}
function setAllUniforms() { setUniformsBase(); setUniformsOvr(); }
function setTimes(t) {
    gl.useProgram(prBase); gl.uniform1f(uTime, t / 1000);
    gl.useProgram(prOvr); gl.uniform1f(O.uTime, t / 1000);
}
function setCanvasAndField() {
    setCanvasSize();
    initField();
    rebuildOverlay();
    setAllUniforms();
}

/* ---------- 初始化 UI ---------- */
const reinitTriggers = new Set([cell, gapX, gapY, scale, fieldStep, marginP]);
const uiInputs = [
    cell, gapX, gapY, scale, minS, maxS, period, breath, nPow, kFac,
    bMode, radLenU, spiTurns, spiLenU, crossLenXU, crossLenYU, groupSizeU, groupPhaseJit,
    noiseScaleU, noiseSpeedU, noiseDeg, noiseOct,
    shapeAmp, springK, damp, tension, brushR, brushF, fieldStep, isoScale, full9, marginP,
    useSpeed, vTau, vMax, kCoef, dCoef, tCoef, rCoef, fCoef, inflMax, inflResp, inflDecay,
    inflVRef, inflVDead, capBase, capK, reentryMs, logoMinS, logoMaxS, lensFeather,
];

(function initUI() {
    const cfg = loadCfg();
    function setIf(el, v, isBool = false) { if (!el) return; isBool ? (el.checked = !!v) : (el.value = v); }
    setIf(cell, cfg.cell); setIf(gapX, cfg.gapX); setIf(gapY, cfg.gapY); setIf(scale, cfg.scale);
    setIf(minS, cfg.minS); setIf(maxS, cfg.maxS); setIf(period, cfg.period); setIf(breath, cfg.breath, true);
    setIf(nPow, cfg.nPow); setIf(kFac, cfg.kFac);

    setIf(bMode, cfg.bMode); setIf(radLenU, cfg.radLenU); setIf(spiTurns, cfg.spiTurns); setIf(spiLenU, cfg.spiLenU);
    setIf(crossLenXU, cfg.crossLenXU); setIf(crossLenYU, cfg.crossLenYU); setIf(groupSizeU, cfg.groupSizeU); setIf(groupPhaseJit, cfg.groupPhaseJit);

    setIf(noiseScaleU, cfg.noiseScaleU); setIf(noiseSpeedU, cfg.noiseSpeedU); setIf(noiseDeg, cfg.noiseDeg); setIf(noiseOct, cfg.noiseOct);

    setIf(shapeAmp, cfg.shapeAmp); setIf(springK, cfg.springK); setIf(damp, cfg.damp); setIf(tension, cfg.tension);
    setIf(brushR, cfg.brushR); setIf(brushF, cfg.brushF); setIf(fieldStep, cfg.fieldStep);
    setIf(isoScale, cfg.isoScale, true); setIf(full9, cfg.full9, true); setIf(marginP, cfg.marginP);
    setIf(useSpeed, cfg.useSpeed, true); setIf(vTau, cfg.vTau); setIf(vMax, cfg.vMax);
    setIf(kCoef, cfg.kCoef); setIf(dCoef, cfg.dCoef); setIf(tCoef, cfg.tCoef); setIf(rCoef, cfg.rCoef); setIf(fCoef, cfg.fCoef);
    setIf(inflMax, cfg.inflMax); setIf(inflResp, cfg.inflResp); setIf(inflDecay, cfg.inflDecay);
    setIf(inflVRef, cfg.inflVRef); setIf(inflVDead, cfg.inflVDead);
    setIf(capBase, cfg.capBase); setIf(capK, cfg.capK);
    setIf(reentryMs, cfg.reentryMs);
    setIf(logoMinS, cfg.logoMinS); setIf(logoMaxS, cfg.logoMaxS);
    setIf(lensFeather, cfg.lensFeather);

    syncLabels();
})();

uiInputs.forEach((e) => {
    if (!e) return;
    e.addEventListener("input", () => {
        if (reinitTriggers.has(e)) { initField(); rebuildOverlay(); }
        syncLabels(); saveCfg();
    });
    e.addEventListener("change", () => {
        if (reinitTriggers.has(e)) { initField(); rebuildOverlay(); }
        syncLabels(); saveCfg();
    });
});

/* ---------- Intro 序列（Logo → 呼吸闸门 → 背景放大） ---------- */
const intro = {
    enabled: true,
    t0: 0,
    phases: { logo: 0.8, delayGate: 0.05, gate: 0.8, delayBG: 0.3, bg: 0.45 },
    targets: { logoMin: defaults.logoMinS, logoMax: defaults.logoMaxS, bgMax: defaults.maxS },
    toggledBreath: false,
};
function easeOutCubic(x) { x = Math.min(1, Math.max(0, x)); return 1 - Math.pow(1 - x, 3); }
function easeInOutCubic(x) { x = Math.min(1, Math.max(0, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }
function lerp(a, b, t) { return a + (b - a) * t; }
function startIntro() {
    intro.t0 = performance.now() / 1000;
    intro.toggledBreath = false;
    if (logoMinS) logoMinS.value = 0;
    if (logoMaxS) logoMaxS.value = 0;
    if (maxS) maxS.value = 0;
    if (breath) breath.checked = false;
    breatheMix = 0;
}
function stepIntro(nowSec) {
    if (!intro.enabled) return;
    const P = intro.phases, t0 = intro.t0, t = nowSec - t0;
    const TlogoEnd = P.logo, TgateStart = TlogoEnd + P.delayGate, TgateEnd = TgateStart + P.gate;
    const TbgStart = TgateStart + P.delayBG, TbgEnd = TbgStart + P.bg, Tend = Math.max(TgateEnd, TbgEnd);

    if (t <= TlogoEnd) {
        const u = easeOutCubic(t / P.logo);
        if (logoMinS) logoMinS.value = lerp(0, intro.targets.logoMin, u);
        if (logoMaxS) logoMaxS.value = lerp(0, intro.targets.logoMax, u);
    } else {
        if (logoMinS) logoMinS.value = intro.targets.logoMin;
        if (logoMaxS) logoMaxS.value = intro.targets.logoMax;
    }

    if (t >= TgateStart) {
        if (!intro.toggledBreath && breath) { breath.checked = true; intro.toggledBreath = true; }
        const tg = Math.min(1, Math.max(0, (t - TgateStart) / P.gate));
        breatheMix = easeInOutCubic(tg);
    }

    if (t >= TbgStart && t <= TbgEnd) {
        const tb = (t - TbgStart) / P.bg;
        const u = easeOutCubic(tb);
        if (maxS) maxS.value = lerp(0, intro.targets.bgMax, u);
    } else if (t > TbgEnd && maxS) {
        maxS.value = intro.targets.bgMax;
    }

    if (t >= Tend) { breatheMix = 1.0; intro.enabled = false; saveCfg(); }
}

/* ---------- 渲染循环：底层 → Logo(含透镜) ---------- */
function resize() { setCanvasAndField(); }
resize();
addEventListener("resize", () => resize(), { passive: true });

// 启动 Intro
startIntro();

let t0 = performance.now();
function tick(t) {
    // dt（秒），限制上限
    let dt = Math.min(0.033, (t - t0) / 1000);
    t0 = t;

    const eff = computeEffective(dt);
    applyBrush(dt, eff);

    // 固定子步，稳定数值（最多 4 次）
    const h = 1.0 / 120.0;
    const steps = Math.max(1, Math.min(4, Math.ceil(dt / h)));
    const subDt = dt / steps;
    for (let s = 0; s < steps; s++) {
        stepField(subDt, eff);
        stepInflateAndLens(subDt);
    }

    // Intro（在上传前推进）
    stepIntro(t / 1000);

    uploadField();
    setAllUniforms();
    setTimes(t);

    gl.useProgram(prBase); gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.useProgram(prOvr); gl.drawArrays(gl.TRIANGLES, 0, 3);

    syncLabels();
    requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
