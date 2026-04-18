// Shared fullscreen quad vertex shader
export const VERT_SRC = `
  attribute vec2 p;
  void main() { gl_Position = vec4(p, 0., 1.); }
`.trim();

// ── Blob pass ──────────────────────────────────────────────────────────────────
// Composition tuned for a LIGHT page background (#f5f5f5):
//   bg → primary blue glow → bright white core, as a single continuous ramp.
// Two layers of fbm noise:
//   • domain-warp inside `potential` → organic, non-circular blob silhouettes
//   • per-pixel modulation on the summed field → breaks concentric isocontours
//     so the glow doesn't read as a clean ring.
// Alpha is 0 outside the field so accumulated trails are preserved.
export const FRAG_SRC = `
  #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
  #else
    precision mediump float;
  #endif
  uniform float t, morph, glow;
  uniform vec2  res;
  uniform vec2  bpos[7];
  uniform vec3  u_primary;
  uniform vec3  u_bg;

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
    float s = t * 0.05 + seed * 0.7;
    vec2 warp = vec2(
      fbm(uv * 1.8 + vec2(s,             s * 0.7)),
      fbm(uv * 1.8 + vec2(s * 0.8 + 4.1, s * 1.1))
    ) * 0.085 * morph;
    float d = length((uv + warp) - c);
    float r = 0.105;
    return exp(-(d * d) / (r * r));
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * res) / res.y;

    float field = 0.0;
    field += potential(uv, bpos[0], 0.0);
    field += potential(uv, bpos[1], 1.3);
    field += potential(uv, bpos[2], 2.6);
    field += potential(uv, bpos[3], 3.9);
    field += potential(uv, bpos[4], 5.2);
    field += potential(uv, bpos[5], 6.5);
    field += potential(uv, bpos[6], 7.8);

    // Per-pixel turbulence — multiplicative noise on the field strength.
    // This is what kills the "concentric ring" look: isocontours of
    // (field * noise) are no longer circles, they wander.
    // Ramp the modulation in only where the field has substance — at the
    // faint outer halo we use a clean field, otherwise noise on near-zero
    // values pumps random edge spikes (visible as crawling artifacts on
    // the trail FBO).
    float n     = fbm(uv * 4.5 + vec2(t * 0.04, -t * 0.03));
    float nMix  = smoothstep(0.05, 0.35, field);
    float f     = max(0.0, field * mix(1.0, 0.78 + 0.44 * n, nMix));

    // Continuous color ramp — exponential halo + polynomial bright core.
    // No discrete bands → no visible ring of intermediate color.
    float halo = 1.0 - exp(-f * 1.7);
    float core = pow(clamp(f * 1.35, 0.0, 1.0), 2.6);

    // Soft floor on halo: anything below ~0.04 collapses to 0, then ramps
    // back up smoothly. Keeps the outer edge from leaking sub-pixel alpha
    // into the trail FBO, where it would accumulate as a noisy ring.
    halo = smoothstep(0.04, 0.10, halo) * halo;

    vec3 col = mix(u_bg, u_primary, halo * glow);
    col      = mix(col, vec3(1.0),  core);

    float alpha = clamp(halo * glow, 0.0, 1.0);
    gl_FragColor = vec4(col, alpha);
  }
`.trim();

// ── Blit pass ──────────────────────────────────────────────────────────────────
// Fades trails toward site background (same alpha scaling as legacy `tex * fade`).
export const BLIT_FRAG_SRC = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform float u_fade;
  uniform vec2 u_res;
  uniform vec3 u_bg;
  void main() {
    vec2 uv = gl_FragCoord.xy / u_res;
    vec4 tex = texture2D(u_tex, uv);
    float f = u_fade;
    gl_FragColor = vec4(tex.rgb * f + u_bg * (1.0 - f), tex.a * f);
  }
`.trim();

// ── Composite pass ─────────────────────────────────────────────────────────────
// Draws the accumulated FBO texture straight to the canvas.
export const COMPOSITE_FRAG_SRC = `
  precision mediump float;
  uniform sampler2D u_tex;
  uniform vec2  u_res;
  void main() {
    vec2 uv  = gl_FragCoord.xy / u_res;
    gl_FragColor = vec4(clamp(texture2D(u_tex, uv).rgb, 0.0, 1.0), 1.0);
  }
`.trim();

/** Brand primary `#0a33ff` (sRGB) — blob glow color; keep in sync with `globals.css` */
export const PRIMARY_RGB: [number, number, number] = [10 / 255, 51 / 255, 1];

/** Canvas / trail base `#f5f5f5` — keep in sync with `globals.css` `--background` */
export const BACKGROUND_RGB: [number, number, number] = [245 / 255, 245 / 255, 245 / 255];
