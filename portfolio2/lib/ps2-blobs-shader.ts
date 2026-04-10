export const VERT_SRC = `
  attribute vec2 p;
  void main() { gl_Position = vec4(p, 0., 1.); }
`.trim();

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
    float halo = smoothstep(iso - 0.55, iso - 0.32, field) * (1.0 - rim - blob);

    vec3 white    = vec3(1.0);
    vec3 deepBlue = vec3(0.03, 0.05, 0.25);

    vec3 col = white * blob
      + mix(glowCol, white, smoothstep(iso - 0.14, iso + 0.04, field)) * rim * glow * 2.2
      + mix(deepBlue, glowCol * 0.35, smoothstep(iso - 0.55, iso - 0.32, field)) * halo * glow * 1.5;

    gl_FragColor = vec4(col, 1.0);
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
