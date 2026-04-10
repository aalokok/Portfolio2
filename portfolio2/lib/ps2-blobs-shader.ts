// Shared fullscreen quad vertex shader
export const VERT_SRC = `
  attribute vec2 p;
  void main() { gl_Position = vec4(p, 0., 1.); }
`.trim();

// ── Blob pass ──────────────────────────────────────────────────────────────────
// Outputs alpha=0 in empty space so trails show through, alpha=1 in blob cores.
export const FRAG_SRC = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
  uniform float t, morph, glow;
  uniform vec2  res;
  uniform vec2  bpos[7];
  uniform vec3  gcol[7];

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(dot(hash2(i),             f),             dot(hash2(i + vec2(1,0)), f - vec2(1,0)), u.x),
      mix(dot(hash2(i + vec2(0,1)), f - vec2(0,1)), dot(hash2(i + vec2(1,1)), f - vec2(1,1)), u.x),
      u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  float potential(vec2 uv, vec2 c, float seed) {
    float s = t * 0.06 + seed * 0.7;
    vec2 warp = vec2(
      fbm(uv * 2.0 + vec2(s,          s * 0.7)),
      fbm(uv * 2.0 + vec2(s * 0.8 + 4.1, s * 1.1))
    ) * 0.05 * morph;
    float dist = length((uv + warp) - c);
    float r = 0.115;
    return exp(-(dist * dist) / (r * r));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.y;

    float p0 = potential(uv, bpos[0], 0.0);
    float p1 = potential(uv, bpos[1], 1.3);
    float p2 = potential(uv, bpos[2], 2.6);
    float p3 = potential(uv, bpos[3], 3.9);
    float p4 = potential(uv, bpos[4], 5.2);
    float p5 = potential(uv, bpos[5], 6.5);
    float p6 = potential(uv, bpos[6], 7.8);
    float field = p0 + p1 + p2 + p3 + p4 + p5 + p6;

    float totalP = field + 0.0001;
    vec3 glowCol = (gcol[0]*p0 + gcol[1]*p1 + gcol[2]*p2 + gcol[3]*p3
                  + gcol[4]*p4 + gcol[5]*p5 + gcol[6]*p6) / totalP;

    float iso  = 0.5;
    float blob = smoothstep(iso - 0.04, iso + 0.20, field);
    float rim  = smoothstep(iso - 0.32, iso - 0.04, field) * (1.0 - blob);
    // Lower bound must be > 0 so alpha=0 in empty space — avoids eating trails each frame
    float halo = smoothstep(0.02, iso - 0.32, field) * (1.0 - rim - blob);

    vec3 white    = vec3(1.0);
    vec3 deepBlue = vec3(0.03, 0.05, 0.25);

    vec3 col = white * blob
      + mix(glowCol, white, smoothstep(iso - 0.14, iso + 0.04, field)) * rim * glow * 2.2
      + mix(deepBlue, glowCol * 0.35, smoothstep(iso - 0.55, iso - 0.32, field)) * halo * glow * 1.5;

    // Alpha drives trail blending: 0 in empty space, 1 in blob cores
    float alpha = clamp(blob + rim + halo, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`.trim();

// ── Blit pass ──────────────────────────────────────────────────────────────────
// Draws the previous frame texture multiplied by a fade factor.
export const BLIT_FRAG_SRC = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform float u_fade;
  uniform vec2 u_res;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    gl_FragColor = texture2D(u_tex, uv) * u_fade;
  }
`.trim();

// ── Composite pass ─────────────────────────────────────────────────────────────
// Draws the accumulated FBO texture and adds Gaussian film-grain noise.
export const COMPOSITE_FRAG_SRC = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform float u_time;
  uniform float u_grain;
  uniform vec2  u_res;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  // Sum three offset uniform samples → roughly Gaussian via CLT
  float grain(vec2 p, float t) {
    float n  = hash(p + t * 17.3);
    n += hash(p + t * 31.7 + vec2(100.0, 0.0));
    n += hash(p + t * 43.1 + vec2(0.0,  100.0));
    return n / 3.0 - 0.5;
  }

  void main() {
    vec2 uv  = gl_FragCoord.xy / u_res;
    vec3 col = texture2D(u_tex, uv).rgb;
    col += grain(gl_FragCoord.xy * 0.5, u_time) * u_grain;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
  }
`.trim();

export const GLOW_COLORS: [number, number, number][] = [
  [0.10, 0.28, 1.00],
  [0.06, 0.18, 0.72],
  [0.12, 0.35, 1.00],
  [0.04, 0.12, 0.55],
  [0.08, 0.25, 0.88],
  [0.14, 0.38, 1.00],
  [0.05, 0.16, 0.65],
];
