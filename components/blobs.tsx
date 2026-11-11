"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  BACKGROUND_RGB,
  BLIT_FRAG_SRC,
  COMPOSITE_FRAG_SRC,
  FRAG_SRC,
  PRIMARY_RGB,
  VERT_SRC,
} from "@/lib/blobs-shader";

export type Ps2BlobsProps = {
  className?: string;
  glow?: number;
  morph?: number;       // domain-warp strength on blob silhouettes (default 1)
  trailFade?: number;   // 0–1, higher = longer trails (default 0.8)
  hueShift?: number;    // 0–360 degrees, rotates the brand-blue glow color
  interactive?: boolean; // false = no mouse attraction / drag (default true)
  /** Where a held orb is (page coordinates) while it is dragged, then null when it is let go. */
  onDrag?: (point: { x: number; y: number } | null) => void;
  /** Glow color (0–1 RGB). The orbs ease into a new one rather than snapping. Default: brand blue. */
  color?: [number, number, number];
  /** Color of each orb's hot center (0–1 RGB). Eases like color. Default: white. */
  coreColor?: [number, number, number];
  /** Frame color behind the orbs (0–1 RGB). Eases like color. Default: black. */
  background?: [number, number, number];
  /** The color a held orb turns (0–1 RGB). Default: brand green. */
  accent?: [number, number, number];
  /** How far the held (or parked) orb has turned to the accent, 0–1. */
  heldGlow?: number;
  /** Park the held orb at this page point: it stays there, and it is the only orb that can be
   *  picked up until parking ends. Let go of it nearby and it settles back. */
  park?: { x: number; y: number } | null;
};

// ── Hue rotation ───────────────────────────────────────────────────────────────
// Luminance-preserving hue rotation matrix applied to a single sRGB color.
function rotateHue([r, g, b]: [number, number, number], degrees: number): [number, number, number] {
  if (degrees === 0) return [r, g, b];
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const s3  = Math.sqrt(1 / 3);
  const t   = (1 - cos) / 3;
  const m   = [
    cos + t,       t - s3 * sin,  t + s3 * sin,
    t + s3 * sin,  cos + t,       t - s3 * sin,
    t - s3 * sin,  t + s3 * sin,  cos + t,
  ];
  return [
    Math.max(0, Math.min(1, r * m[0] + g * m[1] + b * m[2])),
    Math.max(0, Math.min(1, r * m[3] + g * m[4] + b * m[5])),
    Math.max(0, Math.min(1, r * m[6] + g * m[7] + b * m[8])),
  ];
}

// ── Physics ────────────────────────────────────────────────────────────────────
const N = 7;

interface Blob {
  x: number; y: number;
  vx: number; vy: number;
  wanderAngle: number; wanderSpeed: number; wanderStr: number;
  floatPhase: number; floatFreq: number;
  curiousTimer: number; curiousInterval: number;
}

function makeBlobs(ax: number, ay: number): Blob[] {
  return Array.from({ length: N }, (_, i) => {
    const ang = (i / N) * Math.PI * 2;
    return {
      x: Math.cos(ang) * ax * 0.7, y: Math.sin(ang) * ay * 0.7,
      vx: (Math.random() - 0.5) * 0.0003, vy: (Math.random() - 0.5) * 0.0003,
      wanderAngle: Math.random() * Math.PI * 2,
      wanderSpeed: (Math.random() - 0.5) * 0.002,
      wanderStr: 0.00008 + Math.random() * 0.00005,
      floatPhase: Math.random() * Math.PI * 2,
      floatFreq: 0.08 + Math.random() * 0.06,
      curiousTimer: Math.random() * 6,
      curiousInterval: 6 + Math.random() * 8,
    };
  });
}

function stepBlobs(
  blobs: Blob[], dt: number, elapsed: number,
  mouseX: number | null, mouseY: number | null,
  bx: number, by: number, dragIdx: number | null,
) {
  const BLOB_R = 0.20, REP_F = 0.0022, DAMP = 0.982, MAX_V = 0.0012;
  const BX = bx * 0.90, BY = by * 0.90;

  for (let i = 0; i < N; i++) {
    const bl = blobs[i];
    if (i === dragIdx) continue;

    bl.wanderAngle += bl.wanderSpeed + Math.sin(elapsed * 0.15 + i) * 0.001;
    bl.curiousTimer += dt;
    if (bl.curiousTimer > bl.curiousInterval) {
      bl.curiousTimer = 0;
      bl.curiousInterval = 6 + Math.random() * 8;
      bl.wanderSpeed = (Math.random() - 0.5) * 0.003;
    }
    bl.vx += Math.cos(bl.wanderAngle) * bl.wanderStr;
    bl.vy += Math.sin(bl.wanderAngle) * bl.wanderStr;
    bl.vy += Math.sin(elapsed * bl.floatFreq       + bl.floatPhase)       * 0.00006;
    bl.vx += Math.cos(elapsed * bl.floatFreq * 0.7 + bl.floatPhase + 1.0) * 0.00004;
    bl.vx += -bl.x * 0.00025;
    bl.vy += -bl.y * 0.00025;

    if (mouseX !== null && mouseY !== null && dragIdx === null) {
      const dx = mouseX - bl.x, dy = mouseY - bl.y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const str = 0.00010 / (d + 0.15);
      bl.vx += dx * str; bl.vy += dy * str;
    }

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const dx = bl.x - blobs[j].x, dy = bl.y - blobs[j].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.001;
      if (d < BLOB_R) {
        const f = ((BLOB_R - d) / d) * REP_F;
        bl.vx += dx * f; bl.vy += dy * f;
      }
    }

    bl.vx *= DAMP; bl.vy *= DAMP;
    const spd = Math.sqrt(bl.vx * bl.vx + bl.vy * bl.vy);
    if (spd > MAX_V) { bl.vx = (bl.vx / spd) * MAX_V; bl.vy = (bl.vy / spd) * MAX_V; }
    bl.x += bl.vx; bl.y += bl.vy;

    if (bl.x >  BX) { bl.x =  BX; bl.vx = -Math.abs(bl.vx) * 0.4; bl.wanderAngle = Math.PI - bl.wanderAngle; }
    if (bl.x < -BX) { bl.x = -BX; bl.vx =  Math.abs(bl.vx) * 0.4; bl.wanderAngle = Math.PI - bl.wanderAngle; }
    if (bl.y >  BY) { bl.y =  BY; bl.vy = -Math.abs(bl.vy) * 0.4; bl.wanderAngle = -bl.wanderAngle; }
    if (bl.y < -BY) { bl.y = -BY; bl.vy =  Math.abs(bl.vy) * 0.4; bl.wanderAngle = -bl.wanderAngle; }
  }
}

// ── WebGL helpers ──────────────────────────────────────────────────────────────

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(s);
    gl.deleteShader(s);
    throw new Error(`Shader compile error:\n${info}`);
  }
  return s;
}

function buildProgram(gl: WebGLRenderingContext, fragSrc: string): WebGLProgram {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, VERT_SRC));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fragSrc));
  // Force attribute 0 for 'p' across all programs so we share one buffer bind
  gl.bindAttribLocation(prog, 0, "p");
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(`Program link error: ${gl.getProgramInfoLog(prog)}`);
  return prog;
}

interface FBO { tex: WebGLTexture; fbo: WebGLFramebuffer; }

function createFBO(gl: WebGLRenderingContext, w: number, h: number): FBO {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const [br, bg, bb] = BACKGROUND_RGB;
  gl.clearColor(br, bg, bb, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { tex, fbo };
}

function deleteFBOs(gl: WebGLRenderingContext, fbos: FBO[]) {
  for (const { tex, fbo } of fbos) {
    gl.deleteTexture(tex);
    gl.deleteFramebuffer(fbo);
  }
}

// ── Component ──────────────────────────────────────────────────────────────────

export function Blobs({
  className,
  glow = 1,
  morph = 1,
  trailFade = 0.8,
  hueShift = 0,
  interactive = true,
  onDrag,
  color,
  coreColor,
  background,
  accent,
  heldGlow = 0,
  park = null,
}: Ps2BlobsProps) {
  const hostRef       = useRef<HTMLDivElement>(null);
  const hueShiftRef   = useRef(hueShift);
  hueShiftRef.current = hueShift;
  const interactiveRef = useRef(interactive);
  interactiveRef.current = interactive;
  const onDragRef = useRef(onDrag);
  onDragRef.current = onDrag;
  const colorRef = useRef(color);
  colorRef.current = color;
  const coreRef = useRef(coreColor);
  coreRef.current = coreColor;
  const backgroundRef = useRef(background);
  backgroundRef.current = background;
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const heldGlowRef = useRef(heldGlow);
  heldGlowRef.current = heldGlow;
  const parkRef = useRef(park);
  parkRef.current = park;

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { canvas.remove(); return; }

    let blobProg: WebGLProgram, blitProg: WebGLProgram, compositeProg: WebGLProgram;
    try {
      blobProg      = buildProgram(gl, FRAG_SRC);
      blitProg      = buildProgram(gl, BLIT_FRAG_SRC);
      compositeProg = buildProgram(gl, COMPOSITE_FRAG_SRC);
    } catch (e) { console.error("[Ps2Blobs]", e); canvas.remove(); return; }

    // Shared fullscreen quad — attribute location 0 forced for all programs
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    // Blob program uniforms
    const BU = {
      t:       gl.getUniformLocation(blobProg, "t")!,
      res:     gl.getUniformLocation(blobProg, "res")!,
      morph:   gl.getUniformLocation(blobProg, "morph")!,
      glow:    gl.getUniformLocation(blobProg, "glow")!,
      bpos:    gl.getUniformLocation(blobProg, "bpos[0]")!,
      primary: gl.getUniformLocation(blobProg, "u_primary")!,
      bg:      gl.getUniformLocation(blobProg, "u_bg")!,
      core:    gl.getUniformLocation(blobProg, "u_core")!,
      accent:  gl.getUniformLocation(blobProg, "u_accent")!,
      bmix:    gl.getUniformLocation(blobProg, "bmix[0]")!,
    };
    gl.useProgram(blobProg);
    gl.uniform1f(BU.glow, glow);
    gl.uniform1f(BU.morph, morph);
    gl.uniform3f(BU.bg, BACKGROUND_RGB[0], BACKGROUND_RGB[1], BACKGROUND_RGB[2]);

    // Blit program uniforms
    gl.useProgram(blitProg);
    const LU = {
      tex:  gl.getUniformLocation(blitProg, "u_tex")!,
      fade: gl.getUniformLocation(blitProg, "u_fade")!,
      res:  gl.getUniformLocation(blitProg, "u_res")!,
      bg:   gl.getUniformLocation(blitProg, "u_bg")!,
    };
    gl.uniform1i(LU.tex, 0);
    gl.uniform1f(LU.fade, trailFade);
    gl.uniform3f(LU.bg, BACKGROUND_RGB[0], BACKGROUND_RGB[1], BACKGROUND_RGB[2]);

    // Composite program uniforms
    gl.useProgram(compositeProg);
    const CU = {
      tex: gl.getUniformLocation(compositeProg, "u_tex")!,
      res: gl.getUniformLocation(compositeProg, "u_res")!,
    };
    gl.uniform1i(CU.tex, 0);

    // Ping-pong FBOs
    let fbos: FBO[] = [];
    let fboW = 0, fboH = 0;
    let ping = 0; // read index; write = 1 - ping

    const ensureFBOs = (w: number, h: number) => {
      if (w === fboW && h === fboH) return;
      deleteFBOs(gl, fbos);
      fbos = [createFBO(gl, w, h), createFBO(gl, w, h)];
      fboW = w; fboH = h;
      ping = 0;
    };

    // Resize
    const setSize = () => {
      const w = Math.max(1, Math.floor(host.clientWidth));
      const h = Math.max(1, Math.floor(host.clientHeight));
      canvas.width = w; canvas.height = h;
      ensureFBOs(w, h);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(host);

    // UV conversion (matches physics space)
    const uvBounds = () => {
      const r = host.getBoundingClientRect();
      return { x: (r.width / (r.height || 1)) * 0.5, y: 0.5 };
    };

    // Physics init
    const { x: bx0, y: by0 } = uvBounds();
    const blobs = makeBlobs(bx0, by0);

    // Mouse / drag
    const GRAB_R = 0.13;
    let mouseRawX: number | null = null, mouseRawY: number | null = null;
    let mouseSmX:  number | null = null, mouseSmY:  number | null = null;
    let dragIdx: number | null = null;
    let dragX = 0, dragY = 0, dragVx = 0, dragVy = 0;
    let lastHeld: number | null = null; // the orb picked up most recently
    let parkedIdx: number | null = null; // the orb sitting at the park point, if any
    // While parked, only the parked orb can be picked up.
    const grabbable = (i: number) => parkedIdx === null || i === parkedIdx;

    const toUV = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x:  ((e.clientX - r.left) - r.width  * 0.5) / r.height,
        y: -((e.clientY - r.top)  - r.height * 0.5) / r.height,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!interactiveRef.current) { mouseRawX = null; mouseRawY = null; mouseSmX = null; mouseSmY = null; return; }
      const { x, y } = toUV(e);
      mouseRawX = x; mouseRawY = y;
      if (mouseSmX === null) { mouseSmX = x; mouseSmY = y; }
      if (dragIdx !== null) onDragRef.current?.({ x: e.clientX, y: e.clientY });
      if (dragIdx === null) {
        const near = blobs.some((b, i) => {
          const dx = b.x - x, dy = b.y - y;
          return grabbable(i) && Math.sqrt(dx*dx + dy*dy) < GRAB_R;
        });
        document.body.style.cursor = near ? "grab" : "";
      }
    };
    const onMouseLeave = () => {
      mouseRawX = null; mouseRawY = null; mouseSmX = null; mouseSmY = null;
      if (dragIdx === null) document.body.style.cursor = "";
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 || !interactiveRef.current) return;
      const { x, y } = toUV(e);
      let best = -1, bestD = Infinity;
      for (let i = 0; i < N; i++) {
        const dx = blobs[i].x - x, dy = blobs[i].y - y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (grabbable(i) && d < GRAB_R && d < bestD) { best = i; bestD = d; }
      }
      if (best !== -1) {
        dragIdx = best; dragX = x; dragY = y; dragVx = 0; dragVy = 0;
        lastHeld = best;
        document.body.style.cursor = "grabbing";
        onDragRef.current?.({ x: e.clientX, y: e.clientY });
        e.preventDefault();
      }
    };
    const releaseDrag = () => {
      if (dragIdx !== null) {
        blobs[dragIdx].vx = dragVx * 0.25;
        blobs[dragIdx].vy = dragVy * 0.25;
        dragIdx = null;
        onDragRef.current?.(null);
        document.body.style.cursor = mouseRawX !== null ? "grab" : "";
      }
    };

    const isInteractive = interactiveRef.current;
    if (isInteractive) {
      window.addEventListener("mousemove",                    onMouseMove);
      document.documentElement.addEventListener("mouseleave", onMouseLeave);
      window.addEventListener("mousedown",                    onMouseDown);
      window.addEventListener("mouseup",                      releaseDrag);
    }

    // Render loop
    let rafId = 0, cancelled = false;
    let t0: number | null = null, lastTs: number | null = null, elapsed = 0;

    const draw = new Float32Array(N * 2);
    const glowColor = [...(colorRef.current ?? rotateHue(PRIMARY_RGB, hueShiftRef.current))];
    const coreGlow = [...(coreRef.current ?? [1, 1, 1])];
    const bgColor = [...(backgroundRef.current ?? BACKGROUND_RGB)];
    const mixes = new Float32Array(N); // per orb, how far it has turned to the accent

    const frame = (ts: number) => {
      if (cancelled) return;
      if (!t0) t0 = ts;
      const dt = Math.min((lastTs === null ? 0 : ts - lastTs) / 1000, 0.033);
      lastTs = ts; elapsed += dt;
      const time = (ts - t0) / 1000;

      // Switched off mid-drag (say the panel changed): let the orb go.
      if (!interactiveRef.current && dragIdx !== null) releaseDrag();

      if (mouseRawX !== null && mouseSmX !== null) {
        mouseSmX += (mouseRawX - mouseSmX) * 0.04;
        mouseSmY! += (mouseRawY! - mouseSmY!) * 0.04;
      }
      if (dragIdx !== null && mouseRawX !== null) {
        const pvx = dragX, pvy = dragY;
        dragX = mouseRawX; dragY = mouseRawY!;
        dragVx += ((dragX - pvx) - dragVx) * 0.35;
        dragVy += ((dragY - pvy) - dragVy) * 0.35;
        blobs[dragIdx].x = dragX; blobs[dragIdx].y = dragY;
        blobs[dragIdx].vx = 0;    blobs[dragIdx].vy = 0;
      }

      // Parking: the held orb settles at the park point and stays there.
      const parkAt = parkRef.current;
      if (parkAt) {
        if (parkedIdx === null) {
          parkedIdx = dragIdx ?? lastHeld ?? 0;
          if (dragIdx !== null) releaseDrag(); // it is parked now, not in the hand
        }
        if (dragIdx !== parkedIdx) {
          const r = canvas.getBoundingClientRect();
          const px = ((parkAt.x - r.left) - r.width * 0.5) / r.height;
          const py = -((parkAt.y - r.top) - r.height * 0.5) / r.height;
          const pb = blobs[parkedIdx];
          pb.x += (px - pb.x) * 0.12; pb.y += (py - pb.y) * 0.12;
          pb.vx = 0; pb.vy = 0;
        }
      } else {
        parkedIdx = null;
      }

      const { x: bx, y: by } = uvBounds();
      // While parked the other orbs ignore the mouse; the parked one is held in place.
      const still = dragIdx ?? parkedIdx;
      const follow = parkedIdx === null;
      stepBlobs(blobs, dt, elapsed, follow ? mouseSmX : null, follow ? mouseSmY : null, bx, by, still);
      for (let i = 0; i < N; i++) { draw[i*2] = blobs[i].x; draw[i*2+1] = blobs[i].y; }

      const w = canvas.width, h = canvas.height;
      const write = 1 - ping;

      // ── Pass 1: blit prev frame × fade into write FBO ──────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[write].fbo);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(blitProg);
      const bgTarget = backgroundRef.current ?? BACKGROUND_RGB;
      for (let c = 0; c < 3; c++) bgColor[c] += (bgTarget[c] - bgColor[c]) * 0.07;
      gl.uniform3f(LU.bg, bgColor[0], bgColor[1], bgColor[2]);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[ping].tex);
      gl.uniform2f(LU.res, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Pass 2: draw blobs on top (SRC_ALPHA blend, empty space transparent)
      gl.useProgram(blobProg);
      const target = colorRef.current ?? rotateHue(PRIMARY_RGB, hueShiftRef.current);
      for (let c = 0; c < 3; c++) glowColor[c] += (target[c] - glowColor[c]) * 0.07;
      gl.uniform3f(BU.primary, glowColor[0], glowColor[1], glowColor[2]);
      const coreTarget = coreRef.current ?? [1, 1, 1];
      for (let c = 0; c < 3; c++) coreGlow[c] += (coreTarget[c] - coreGlow[c]) * 0.07;
      gl.uniform3f(BU.core, coreGlow[0], coreGlow[1], coreGlow[2]);
      gl.uniform3f(BU.bg, bgColor[0], bgColor[1], bgColor[2]);
      const acc = accentRef.current ?? [188 / 255, 1, 164 / 255];
      gl.uniform3f(BU.accent, acc[0], acc[1], acc[2]);
      const accIdx = dragIdx ?? parkedIdx ?? lastHeld;
      for (let i = 0; i < N; i++) {
        const want = i === accIdx ? heldGlowRef.current : 0;
        mixes[i] += (want - mixes[i]) * 0.1;
      }
      gl.uniform1fv(BU.bmix, mixes);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(BU.t, time);
      gl.uniform2f(BU.res, w, h);
      gl.uniform2fv(BU.bpos, draw);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Pass 3: composite to canvas ────────────────────────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(compositeProg);
      gl.bindTexture(gl.TEXTURE_2D, fbos[write].tex);
      gl.uniform2f(CU.res, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      ping = write;
      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      if (isInteractive) {
        window.removeEventListener("mousemove",                    onMouseMove);
        document.documentElement.removeEventListener("mouseleave", onMouseLeave);
        window.removeEventListener("mousedown",                    onMouseDown);
        window.removeEventListener("mouseup",                      releaseDrag);
        document.body.style.cursor = "";
      }
      deleteFBOs(gl, fbos);
      canvas.remove();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn("relative min-h-0 w-full overflow-hidden bg-black", className)}
    />
  );
}
