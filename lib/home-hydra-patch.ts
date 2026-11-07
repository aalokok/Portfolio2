/**
 * Home Hydra livecode.
 * - loadScript is handled in HydraPatch before eval.
 * - getUserMedia is handled in HydraPatch before eval.
 * - s0.initCam() is called here after permissions are granted.
 */
export const HOME_HYDRA_FRACTALS_URL =
  "https://cdn.jsdelivr.net/gh/geikha/hyper-hydra@latest/hydra-fractals.js";

export const HOME_HYDRA_PATCH = `
s0.initCam()

speed = 0.5
a.setBins(4)
a.smooth = 0.85
a.cutoff = 0.01

const fft = (bin, scale = 1) => () => a.fft[bin] * scale
const mx = () => mouse.x / window.innerWidth
const my = () => mouse.y / window.innerHeight

src(s0).out(o2)

// o1 — soft flowing shapes, original feel
shape([4,5,6].fast(0.1).smooth(1), 0.000001, [0.2,0.7].smooth(1))
  .color(0.961, 0.961, 0.961)
  .scrollX(() => Math.sin(time * 0.27))
  .add(
    shape([4,5,6].fast(0.1).smooth(1), 0.000001, [0.2,0.7,0.5,0.3].smooth(1))
      .color(0.039, 0.2, 1.0)
      .scrollY(0.35)
      .scrollX(() => Math.sin(time * 0.33))
  )
  .add(
    shape([4,5,6].fast(0.1).smooth(1), 0.000001, [0.2,0.7,0.3].smooth(1))
      .color(0.098, 0.098, 0.098)
      .scrollY(-0.35)
      .scrollX(() => Math.sin(time * 0.41) * -1)
  )
  .mirrorX(() => Math.sin(time * 0.05) * 0.2, 1)
  .mirrorY(() => Math.cos(time * 0.04) * 0.2, 1)
  .inversion()
  .mirrorWrap()
  .add(
    src(o1).shift(0.001, 0.01, 0.001)
      .scrollX([0.05, -0.05].fast(0.1).smooth(1))
      .scale([1.05, 0.9].fast(0.3).smooth(1), [1.05, 0.9, 1].fast(0.29).smooth(1)),
    0.85
  )
  .modulate(voronoi(10, 2, 2))
  .out(o1)

// o2 — cam feedback
src(o2)
  .scale(0.8)
  .modulate(
    src(o2)
      .rotate(() => time * 0.003)
      .scale(0.97),
    () => 0.007 + fft(1, 0.0005)()
  )
  .brightness(-0.005)
  .add(
    src(s0)
      .scale(1, 0.75)
      .saturate(1)
      .contrast(1.6)
      .luma(0.4, 0.3)
      .modulate(
        osc(() => 30 + fft(2, 40)(), 0.0, 0)
          .rotate(() => time * 0.5),
        () => 0.006 + fft(0, 0.018)()
      )
      .contrast(() => 1.8 + fft(3, 1.2)())
      .brightness(-0.1)
      .color(0.9, 0.95, 1.0),
    () => 0.35 + fft(1, 0.3)()
  )
  .saturate(1)
  .contrast(() => 1.2 + fft(2, 0.4)())
  .out(o2)

// o0 — clean blend, shapes dominant, cam underneath
src(o1)
  .blend(src(o2), () => mx() * 0.5)
  .out(o0)
`.trim();
