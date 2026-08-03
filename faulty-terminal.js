/**
 * FaultyTerminal — Vanilla WebGL implementation of React Bits <FaultyTerminal />
 * Renders a procedural retro CRT digital glyph matrix with scanlines, glitch, flicker, and mouse reactivity.
 */

(function (window) {
  const vertexShaderSource = `
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

  const fragmentShaderSource = `
precision mediump float;

varying vec2 vUv;

uniform float iTime;
uniform vec3  iResolution;
uniform float uScale;

uniform vec2  uGridMul;
uniform float uDigitSize;
uniform float uScanlineIntensity;
uniform float uGlitchAmount;
uniform float uFlickerAmount;
uniform float uNoiseAmp;
uniform float uChromaticAberration;
uniform float uDither;
uniform float uCurvature;
uniform vec3  uTint;
uniform vec2  uMouse;
uniform float uMouseStrength;
uniform float uUseMouse;
uniform float uPageLoadProgress;
uniform float uUsePageLoadAnimation;
uniform float uBrightness;

float time;

float hash21(vec2 p){
  p = fract(p * 234.56);
  p += dot(p, p + 34.56);
  return fract(p.x * p.y);
}

float noise(vec2 p)
{
  return sin(p.x * 10.0) * sin(p.y * (3.0 + sin(time * 0.090909))) + 0.2; 
}

mat2 rotate(float angle)
{
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

float fbm(vec2 p)
{
  p *= 1.1;
  float f = 0.0;
  float amp = 0.5 * uNoiseAmp;
  
  mat2 modify0 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify0 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify1 = rotate(time * 0.02);
  f += amp * noise(p);
  p = modify1 * p * 2.0;
  amp *= 0.454545;
  
  mat2 modify2 = rotate(time * 0.08);
  f += amp * noise(p);
  
  return f;
}

float pattern(vec2 p, out vec2 q, out vec2 r) {
  vec2 offset1 = vec2(1.0);
  vec2 offset0 = vec2(0.0);
  mat2 rot01 = rotate(0.1 * time);
  mat2 rot1 = rotate(0.1);
  
  q = vec2(fbm(p + offset1), fbm(rot01 * p + offset1));
  r = vec2(fbm(rot1 * q + offset0), fbm(q + offset0));
  return fbm(p + r);
}

float digit(vec2 p){
    vec2 grid = uGridMul * 15.0;
    vec2 s = floor(p * grid) / grid;
    p = p * grid;
    vec2 q, r;
    float intensity = pattern(s * 0.1, q, r) * 1.3 - 0.03;
    
    if(uUseMouse > 0.5){
        vec2 mouseWorld = uMouse * uScale;
        float distToMouse = distance(s, mouseWorld);
        float mouseInfluence = exp(-distToMouse * 8.0) * uMouseStrength * 10.0;
        intensity += mouseInfluence;
        
        float ripple = sin(distToMouse * 20.0 - iTime * 5.0) * 0.1 * mouseInfluence;
        intensity += ripple;
    }
    
    if(uUsePageLoadAnimation > 0.5){
        float cellRandom = fract(sin(dot(s, vec2(12.9898, 78.233))) * 43758.5453);
        float cellDelay = cellRandom * 0.8;
        float cellProgress = clamp((uPageLoadProgress - cellDelay) / 0.2, 0.0, 1.0);
        
        float fadeAlpha = smoothstep(0.0, 1.0, cellProgress);
        intensity *= fadeAlpha;
    }
    
    p = fract(p);
    p *= uDigitSize;
    
    float px5 = p.x * 5.0;
    float py5 = (1.0 - p.y) * 5.0;
    float x = fract(px5);
    float y = fract(py5);
    
    float i = floor(py5) - 2.0;
    float j = floor(px5) - 2.0;
    float n = i * i + j * j;
    float f = n * 0.0625;
    
    float isOn = step(0.1, intensity - f);
    float brightness = isOn * (0.2 + y * 0.8) * (0.75 + x * 0.25);
    
    return step(0.0, p.x) * step(p.x, 1.0) * step(0.0, p.y) * step(p.y, 1.0) * brightness;
}

float onOff(float a, float b, float c)
{
  return step(c, sin(iTime + a * cos(iTime * b))) * uFlickerAmount;
}

float displace(vec2 look)
{
    float y = look.y - mod(iTime * 0.25, 1.0);
    float window = 1.0 / (1.0 + 50.0 * y * y);
    return sin(look.y * 20.0 + iTime) * 0.0125 * onOff(4.0, 2.0, 0.8) * (1.0 + cos(iTime * 60.0)) * window;
}

vec3 getColor(vec2 p){
    
    float bar = step(mod(p.y + time * 20.0, 1.0), 0.2) * 0.4 + 1.0;
    bar *= uScanlineIntensity;
    
    float displacement = displace(p);
    p.x += displacement;

    if (uGlitchAmount != 1.0) {
      float extra = displacement * (uGlitchAmount - 1.0);
      p.x += extra;
    }

    float middle = digit(p);
    
    const float off = 0.002;
    float sum = digit(p + vec2(-off, -off)) + digit(p + vec2(0.0, -off)) + digit(p + vec2(off, -off)) +
                digit(p + vec2(-off, 0.0)) + digit(p + vec2(0.0, 0.0)) + digit(p + vec2(off, 0.0)) +
                digit(p + vec2(-off, off)) + digit(p + vec2(0.0, off)) + digit(p + vec2(off, off));
    
    vec3 baseColor = vec3(0.9) * middle + sum * 0.1 * vec3(1.0) * bar;
    return baseColor;
}

vec2 barrel(vec2 uv){
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + uCurvature * r2;
  return c * 0.5 + 0.5;
}

void main() {
    time = iTime * 0.333333;
    vec2 uv = vUv;

    if(uCurvature != 0.0){
      uv = barrel(uv);
    }
    
    vec2 p = uv * uScale;
    vec3 col = getColor(p);

    if(uChromaticAberration != 0.0){
      vec2 ca = vec2(uChromaticAberration) / iResolution.xy;
      col.r = getColor(p + ca).r;
      col.b = getColor(p - ca).b;
    }

    col *= uTint;
    col *= uBrightness;

    if(uDither > 0.0){
      float rnd = hash21(gl_FragCoord.xy);
      col += (rnd - 0.5) * (uDither * 0.003922);
    }

    gl_FragColor = vec4(col, 1.0);
}
`;

  function hexToRgb(hex) {
    let h = hex.replace('#', '').trim();
    if (h.length === 3) {
      h = h.split('').map(c => c + c).join('');
    }
    const num = parseInt(h.slice(0, 6), 16);
    return [((num >> 16) & 255) / 255, ((num >> 8) & 255) / 255, (num & 255) / 255];
  }

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('FaultyTerminal shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initFaultyTerminal(canvasOrId, options = {}) {
    let canvas = typeof canvasOrId === 'string' ? document.getElementById(canvasOrId) : canvasOrId;
    if (!canvas) return null;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true }) ||
               canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL not supported for FaultyTerminal');
      return null;
    }

    const config = {
      scale: options.scale !== undefined ? options.scale : 1.5,
      gridMul: options.gridMul || [2, 1],
      digitSize: options.digitSize !== undefined ? options.digitSize : 1.2,
      timeScale: options.timeScale !== undefined ? options.timeScale : 0.3,
      pause: options.pause !== undefined ? options.pause : false,
      scanlineIntensity: options.scanlineIntensity !== undefined ? options.scanlineIntensity : 0.4,
      glitchAmount: options.glitchAmount !== undefined ? options.glitchAmount : 0.5,
      flickerAmount: options.flickerAmount !== undefined ? options.flickerAmount : 0.3,
      noiseAmp: options.noiseAmp !== undefined ? options.noiseAmp : 0.5,
      chromaticAberration: options.chromaticAberration !== undefined ? options.chromaticAberration : 0,
      dither: options.dither !== undefined ? options.dither : 0,
      curvature: options.curvature !== undefined ? options.curvature : 0.1,
      tint: options.tint || '#003DA5', // UDINUS Blue tint
      mouseReact: options.mouseReact !== undefined ? options.mouseReact : true,
      mouseStrength: options.mouseStrength !== undefined ? options.mouseStrength : 0.3,
      pageLoadAnimation: options.pageLoadAnimation !== undefined ? options.pageLoadAnimation : true,
      brightness: options.brightness !== undefined ? options.brightness : 1.0
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertShader || !fragShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('FaultyTerminal program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    gl.useProgram(program);

    // Quad position & UV
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);

    const posLoc = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      0, 1,
      1, 0,
      1, 1,
    ]), gl.STATIC_DRAW);

    const uvLoc = gl.getAttribLocation(program, 'uv');
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      uScale: gl.getUniformLocation(program, 'uScale'),
      uGridMul: gl.getUniformLocation(program, 'uGridMul'),
      uDigitSize: gl.getUniformLocation(program, 'uDigitSize'),
      uScanlineIntensity: gl.getUniformLocation(program, 'uScanlineIntensity'),
      uGlitchAmount: gl.getUniformLocation(program, 'uGlitchAmount'),
      uFlickerAmount: gl.getUniformLocation(program, 'uFlickerAmount'),
      uNoiseAmp: gl.getUniformLocation(program, 'uNoiseAmp'),
      uChromaticAberration: gl.getUniformLocation(program, 'uChromaticAberration'),
      uDither: gl.getUniformLocation(program, 'uDither'),
      uCurvature: gl.getUniformLocation(program, 'uCurvature'),
      uTint: gl.getUniformLocation(program, 'uTint'),
      uMouse: gl.getUniformLocation(program, 'uMouse'),
      uMouseStrength: gl.getUniformLocation(program, 'uMouseStrength'),
      uUseMouse: gl.getUniformLocation(program, 'uUseMouse'),
      uPageLoadProgress: gl.getUniformLocation(program, 'uPageLoadProgress'),
      uUsePageLoadAnimation: gl.getUniformLocation(program, 'uUsePageLoadAnimation'),
      uBrightness: gl.getUniformLocation(program, 'uBrightness'),
    };

    const mouse = { x: 0.5, y: 0.5 };
    const smoothMouse = { x: 0.5, y: 0.5 };
    let animationId = null;
    let loadAnimationStart = 0;
    const timeOffset = Math.random() * 100;
    const tintRgb = hexToRgb(config.tint);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const wCSS = rect.width || canvas.offsetWidth || 300;
      const hCSS = rect.height || canvas.offsetHeight || 300;

      canvas.width = wCSS * dpr;
      canvas.height = hCSS * dpr;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };

    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width || 1);
      const y = 1 - (e.clientY - rect.top) / (rect.height || 1);
      mouse.x = x;
      mouse.y = y;
    };

    if (config.mouseReact) {
      canvas.addEventListener('mousemove', handleMouseMove);
    }

    const loop = (t) => {
      if (config.pageLoadAnimation && loadAnimationStart === 0) {
        loadAnimationStart = t;
      }

      gl.useProgram(program);

      const elapsed = (t * 0.001 + timeOffset) * config.timeScale;
      gl.uniform1f(uniforms.iTime, elapsed);
      gl.uniform3f(uniforms.iResolution, canvas.width, canvas.height, canvas.width / (canvas.height || 1));
      gl.uniform1f(uniforms.uScale, config.scale);
      gl.uniform2f(uniforms.uGridMul, config.gridMul[0], config.gridMul[1]);
      gl.uniform1f(uniforms.uDigitSize, config.digitSize);
      gl.uniform1f(uniforms.uScanlineIntensity, config.scanlineIntensity);
      gl.uniform1f(uniforms.uGlitchAmount, config.glitchAmount);
      gl.uniform1f(uniforms.uFlickerAmount, config.flickerAmount);
      gl.uniform1f(uniforms.uNoiseAmp, config.noiseAmp);
      gl.uniform1f(uniforms.uChromaticAberration, config.chromaticAberration);
      gl.uniform1f(uniforms.uDither, typeof config.dither === 'boolean' ? (config.dither ? 1 : 0) : config.dither);
      gl.uniform1f(uniforms.uCurvature, config.curvature);
      gl.uniform3f(uniforms.uTint, tintRgb[0], tintRgb[1], tintRgb[2]);
      gl.uniform1f(uniforms.uMouseStrength, config.mouseStrength);
      gl.uniform1f(uniforms.uUseMouse, config.mouseReact ? 1 : 0);
      gl.uniform1f(uniforms.uUsePageLoadAnimation, config.pageLoadAnimation ? 1 : 0);
      gl.uniform1f(uniforms.uBrightness, config.brightness);

      if (config.pageLoadAnimation && loadAnimationStart > 0) {
        const animationElapsed = t - loadAnimationStart;
        const progress = Math.min(animationElapsed / 2000, 1);
        gl.uniform1f(uniforms.uPageLoadProgress, progress);
      } else {
        gl.uniform1f(uniforms.uPageLoadProgress, 1);
      }

      if (config.mouseReact) {
        smoothMouse.x += (mouse.x - smoothMouse.x) * 0.08;
        smoothMouse.y += (mouse.y - smoothMouse.y) * 0.08;
        gl.uniform2f(uniforms.uMouse, smoothMouse.x, smoothMouse.y);
      }

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return {
      destroy: () => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', resize);
        if (config.mouseReact) {
          canvas.removeEventListener('mousemove', handleMouseMove);
        }
      }
    };
  }

  window.initFaultyTerminal = initFaultyTerminal;
})(window);
