// Shared fullscreen quad vertex shader
export const VERT_SRC = `
  attribute vec2 p;
  void main() { gl_Position = vec4(p, 0., 1.); }
`.trim();

// ── Blob pass ──────────────────────────────────────────────────────────────────
// Composition tuned for a BLACK canvas background:
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
  uniform vec3  u_core;   // the hot center, white by default
  uniform vec3  u_accent; // a second glow color single orbs can turn
  uniform float bmix[7];  // how far each orb has turned to the accent (0–1)

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

    float p0 = potential(uv, bpos[0], 0.0);
    float p1 = potential(uv, bpos[1], 1.3);
    float p2 = potential(uv, bpos[2], 2.6);
    float p3 = potential(uv, bpos[3], 3.9);
    float p4 = potential(uv, bpos[4], 5.2);
    float p5 = potential(uv, bpos[5], 6.5);
    float p6 = potential(uv, bpos[6], 7.8);
    float field = p0 + p1 + p2 + p3 + p4 + p5 + p6;
    // Each pixel takes the accent in proportion to how much of its glow comes from accented orbs.
    float accented = p0 * bmix[0] + p1 * bmix[1] + p2 * bmix[2] + p3 * bmix[3] + p4 * bmix[4] + p5 * bmix[5] + p6 * bmix[6];
    vec3 tint = mix(u_primary, u_accent, clamp(accented / max(field, 0.0001), 0.0, 1.0));

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

    // Continuous color ramp — exponential halo + bright core.
    // The halo curve is amplified then clamped so the body saturates to
    // 1.0 (pure primary) instead of asymptoting to ~0.85 (which reads as
    // a washed, bg-diluted blue). The soft outer falloff is preserved
    // because the multiplier only matters once 1 - exp(...) is large.
    float halo = clamp((1.0 - exp(-f * 1.8)) * 1.25, 0.0, 1.0);
    // White core onset is delayed until well inside the body, so a
    // visible band of fully-saturated primary surrounds the white center
    // instead of white bleeding all the way out.
    float core = smoothstep(0.55, 1.00, f);

    // Soft floor on halo: anything below ~0.04 collapses to 0, then ramps
    // back up smoothly. Keeps the outer edge from leaking sub-pixel alpha
    // into the trail FBO, where it would accumulate as a noisy ring.
    halo = smoothstep(0.04, 0.10, halo) * halo;

    vec3 col = mix(u_bg, tint, halo * glow);
    col      = mix(col, u_core,     core);

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

/** Canvas / trail base — black, independent of the page `--background` */
export const BACKGROUND_RGB: [number, number, number] = [0, 0, 0];
