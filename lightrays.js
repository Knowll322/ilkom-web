/**
 * LightRays — Vanilla WebGL implementation of React Bits <LightRays />
 * Renders dynamic, mouse-interactive light rays from an origin point using WebGL shaders.
 */

(function(window) {
  const DEFAULT_COLOR = '#FFB800'; // UDINUS Gold

  const hexToRgb = hex => {
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
  };

  const getAnchorAndDir = (origin, w, h) => {
    const outside = 0.2;
    switch (origin) {
      case 'top-left':
        return { anchor: [0, -outside * h], dir: [0, 1] };
      case 'top-right':
        return { anchor: [w, -outside * h], dir: [0, 1] };
      case 'left':
        return { anchor: [-outside * w, 0.5 * h], dir: [1, 0] };
      case 'right':
        return { anchor: [(1 + outside) * w, 0.5 * h], dir: [-1, 0] };
      case 'bottom-left':
        return { anchor: [0, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-center':
        return { anchor: [0.5 * w, (1 + outside) * h], dir: [0, -1] };
      case 'bottom-right':
        return { anchor: [w, (1 + outside) * h], dir: [0, -1] };
      default: // "top-center"
        return { anchor: [0.5 * w, -outside * h], dir: [0, 1] };
    }
  };

  const vertShaderSource = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

  const fragShaderSource = `
precision highp float;

uniform float iTime;
uniform vec2  iResolution;

uniform vec2  rayPos;
uniform vec2  rayDir;
uniform vec3  raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2  mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;

varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
}

float rayStrength(vec2 raySource, vec2 rayRefDirection, vec2 coord,
                  float seedA, float seedB, float speed) {
  vec2 sourceToCoord = coord - raySource;
  vec2 dirNorm = normalize(sourceToCoord);
  float cosAngle = dot(dirNorm, rayRefDirection);

  float distortedAngle = cosAngle + distortion * sin(iTime * 2.0 + length(sourceToCoord) * 0.01) * 0.2;
  
  float spreadFactor = pow(max(distortedAngle, 0.0), 1.0 / max(lightSpread, 0.001));

  float distance = length(sourceToCoord);
  float maxDistance = iResolution.x * rayLength;
  float lengthFalloff = clamp((maxDistance - distance) / maxDistance, 0.0, 1.0);
  
  float fadeFalloff = clamp((iResolution.x * fadeDistance - distance) / (iResolution.x * fadeDistance), 0.5, 1.0);
  float pulse = pulsating > 0.5 ? (0.8 + 0.2 * sin(iTime * speed * 3.0)) : 1.0;

  float baseStrength = clamp(
    (0.45 + 0.15 * sin(distortedAngle * seedA + iTime * speed)) +
    (0.3 + 0.2 * cos(-distortedAngle * seedB + iTime * speed)),
    0.0, 1.0
  );

  return baseStrength * lengthFalloff * fadeFalloff * spreadFactor * pulse;
}

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
  vec2 coord = vec2(fragCoord.x, iResolution.y - fragCoord.y);
  
  vec2 finalRayDir = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 mouseScreenPos = mousePos * iResolution.xy;
    vec2 mouseDirection = normalize(mouseScreenPos - rayPos);
    finalRayDir = normalize(mix(rayDir, mouseDirection, mouseInfluence));
  }

  vec4 rays1 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 36.2214, 21.11349,
                           1.5 * raysSpeed);
  vec4 rays2 = vec4(1.0) *
               rayStrength(rayPos, finalRayDir, coord, 22.3991, 18.0234,
                           1.1 * raysSpeed);

  fragColor = rays1 * 0.5 + rays2 * 0.4;

  if (noiseAmount > 0.0) {
    float n = noise(coord * 0.01 + iTime * 0.1);
    fragColor.rgb *= (1.0 - noiseAmount + noiseAmount * n);
  }

  float brightness = 1.0 - (coord.y / iResolution.y);
  fragColor.x *= 0.1 + brightness * 0.8;
  fragColor.y *= 0.3 + brightness * 0.6;
  fragColor.z *= 0.5 + brightness * 0.5;

  if (saturation != 1.0) {
    float gray = dot(fragColor.rgb, vec3(0.299, 0.587, 0.114));
    fragColor.rgb = mix(vec3(gray), fragColor.rgb, saturation);
  }

  fragColor.rgb *= raysColor;
}

void main() {
  vec4 color;
  mainImage(color, gl_FragCoord.xy);
  gl_FragColor = color;
}`;

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.warn('LightRays shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function initLightRays(canvasId, options = {}) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    const gl = canvas.getContext('webgl', { alpha: true, antialias: true }) || 
               canvas.getContext('experimental-webgl', { alpha: true, antialias: true });
    if (!gl) {
      console.warn('WebGL not supported for LightRays');
      return null;
    }

    const config = {
      raysOrigin: options.raysOrigin || 'top-center',
      raysColor: options.raysColor || DEFAULT_COLOR,
      raysSpeed: options.raysSpeed !== undefined ? options.raysSpeed : 1.2,
      lightSpread: options.lightSpread !== undefined ? options.lightSpread : 0.8,
      rayLength: options.rayLength !== undefined ? options.rayLength : 1.5,
      pulsating: options.pulsating !== undefined ? options.pulsating : false,
      fadeDistance: options.fadeDistance !== undefined ? options.fadeDistance : 1.0,
      saturation: options.saturation !== undefined ? options.saturation : 1.0,
      followMouse: options.followMouse !== undefined ? options.followMouse : true,
      mouseInfluence: options.mouseInfluence !== undefined ? options.mouseInfluence : 0.15,
      noiseAmount: options.noiseAmount !== undefined ? options.noiseAmount : 0.05,
      distortion: options.distortion !== undefined ? options.distortion : 0.05
    };

    const vertShader = createShader(gl, gl.VERTEX_SHADER, vertShaderSource);
    const fragShader = createShader(gl, gl.FRAGMENT_SHADER, fragShaderSource);
    if (!vertShader || !fragShader) return null;

    const program = gl.createProgram();
    gl.attachShader(program, vertShader);
    gl.attachShader(program, fragShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.warn('LightRays program link error:', gl.getProgramInfoLog(program));
      return null;
    }
    gl.useProgram(program);

    // Quad geometry [-1, -1] to [1, 1]
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const uniforms = {
      iTime: gl.getUniformLocation(program, 'iTime'),
      iResolution: gl.getUniformLocation(program, 'iResolution'),
      rayPos: gl.getUniformLocation(program, 'rayPos'),
      rayDir: gl.getUniformLocation(program, 'rayDir'),
      raysColor: gl.getUniformLocation(program, 'raysColor'),
      raysSpeed: gl.getUniformLocation(program, 'raysSpeed'),
      lightSpread: gl.getUniformLocation(program, 'lightSpread'),
      rayLength: gl.getUniformLocation(program, 'rayLength'),
      pulsating: gl.getUniformLocation(program, 'pulsating'),
      fadeDistance: gl.getUniformLocation(program, 'fadeDistance'),
      saturation: gl.getUniformLocation(program, 'saturation'),
      mousePos: gl.getUniformLocation(program, 'mousePos'),
      mouseInfluence: gl.getUniformLocation(program, 'mouseInfluence'),
      noiseAmount: gl.getUniformLocation(program, 'noiseAmount'),
      distortion: gl.getUniformLocation(program, 'distortion'),
    };

    let w = 1, h = 1;
    let anchor = [0, 0];
    let dir = [0, 1];
    const mouse = { x: 0.5, y: 0.5 };
    const smoothMouse = { x: 0.5, y: 0.5 };
    let animationId = null;

    const updatePlacement = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      const wCSS = rect.width || canvas.offsetWidth || window.innerWidth;
      const hCSS = rect.height || canvas.offsetHeight || window.innerHeight;
      
      canvas.width = wCSS * dpr;
      canvas.height = hCSS * dpr;
      w = canvas.width;
      h = canvas.height;
      gl.viewport(0, 0, w, h);

      const res = getAnchorAndDir(config.raysOrigin, w, h);
      anchor = res.anchor;
      dir = res.dir;
    };

    updatePlacement();
    window.addEventListener('resize', updatePlacement);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / (rect.width || 1);
      const y = (e.clientY - rect.top) / (rect.height || 1);
      mouse.x = Math.max(0, Math.min(1, x));
      mouse.y = Math.max(0, Math.min(1, y));
    };

    if (config.followMouse) {
      window.addEventListener('mousemove', handleMouseMove);
    }

    const rgbColor = hexToRgb(config.raysColor);

    const loop = (t) => {
      gl.useProgram(program);

      gl.uniform1f(uniforms.iTime, t * 0.001);
      gl.uniform2f(uniforms.iResolution, w, h);
      gl.uniform2f(uniforms.rayPos, anchor[0], anchor[1]);
      gl.uniform2f(uniforms.rayDir, dir[0], dir[1]);
      gl.uniform3f(uniforms.raysColor, rgbColor[0], rgbColor[1], rgbColor[2]);
      gl.uniform1f(uniforms.raysSpeed, config.raysSpeed);
      gl.uniform1f(uniforms.lightSpread, config.lightSpread);
      gl.uniform1f(uniforms.rayLength, config.rayLength);
      gl.uniform1f(uniforms.pulsating, config.pulsating ? 1.0 : 0.0);
      gl.uniform1f(uniforms.fadeDistance, config.fadeDistance);
      gl.uniform1f(uniforms.saturation, config.saturation);

      if (config.followMouse && config.mouseInfluence > 0.0) {
        const smoothing = 0.92;
        smoothMouse.x = smoothMouse.x * smoothing + mouse.x * (1 - smoothing);
        smoothMouse.y = smoothMouse.y * smoothing + mouse.y * (1 - smoothing);
        gl.uniform2f(uniforms.mousePos, smoothMouse.x, smoothMouse.y);
      } else {
        gl.uniform2f(uniforms.mousePos, 0.5, 0.5);
      }

      gl.uniform1f(uniforms.mouseInfluence, config.mouseInfluence);
      gl.uniform1f(uniforms.noiseAmount, config.noiseAmount);
      gl.uniform1f(uniforms.distortion, config.distortion);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      animationId = requestAnimationFrame(loop);
    };

    animationId = requestAnimationFrame(loop);

    return {
      destroy: () => {
        if (animationId) cancelAnimationFrame(animationId);
        window.removeEventListener('resize', updatePlacement);
        if (config.followMouse) {
          window.removeEventListener('mousemove', handleMouseMove);
        }
      }
    };
  }

  window.initLightRays = initLightRays;
})(window);
