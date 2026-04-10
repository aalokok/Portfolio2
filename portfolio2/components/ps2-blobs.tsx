"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import {
  BLIT_FRAG_SRC,
  COMPOSITE_FRAG_SRC,
  FRAG_SRC,
  GLOW_COLORS,
  VERT_SRC,
} from "@/lib/ps2-blobs-shader";

export type Ps2BlobsProps = {
  className?: string;
  morph?: number;
  glow?: number;
  trailFade?: number; // 0–1, higher = longer trails (default 0.93)
  grain?: number;     // noise intensity (default 0.04)
};

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
  const BLOB_R = 0.28, REP_F = 0.0022, DAMP = 0.982, MAX_V = 0.0012;
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
  gl.clearColor(0, 0, 0, 1);
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

export function Ps2Blobs({
  className,
  morph = 1,
  glow = 1,
  trailFade = 0.99,
  grain = 0.15,
}: Ps2BlobsProps) {
  const hostRef = useRef<HTMLDivElement>(null);

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
      t:    gl.getUniformLocation(blobProg, "t")!,
      res:  gl.getUniformLocation(blobProg, "res")!,
      morph:gl.getUniformLocation(blobProg, "morph")!,
      glow: gl.getUniformLocation(blobProg, "glow")!,
      bpos: gl.getUniformLocation(blobProg, "bpos[0]")!,
      gcol: gl.getUniformLocation(blobProg, "gcol[0]")!,
    };
    gl.useProgram(blobProg);
    gl.uniform3fv(BU.gcol, new Float32Array(GLOW_COLORS.flat()));
    gl.uniform1f(BU.morph, morph);
    gl.uniform1f(BU.glow, glow);

    // Blit program uniforms
    gl.useProgram(blitProg);
    const LU = {
      tex:  gl.getUniformLocation(blitProg, "u_tex")!,
      fade: gl.getUniformLocation(blitProg, "u_fade")!,
      res:  gl.getUniformLocation(blitProg, "u_res")!,
    };
    gl.uniform1i(LU.tex, 0);
    gl.uniform1f(LU.fade, trailFade);

    // Composite program uniforms
    gl.useProgram(compositeProg);
    const CU = {
      tex:   gl.getUniformLocation(compositeProg, "u_tex")!,
      time:  gl.getUniformLocation(compositeProg, "u_time")!,
      grain: gl.getUniformLocation(compositeProg, "u_grain")!,
      res:   gl.getUniformLocation(compositeProg, "u_res")!,
    };
    gl.uniform1i(CU.tex, 0);
    gl.uniform1f(CU.grain, grain);

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
    const GRAB_R = 0.18;
    let mouseRawX: number | null = null, mouseRawY: number | null = null;
    let mouseSmX:  number | null = null, mouseSmY:  number | null = null;
    let dragIdx: number | null = null;
    let dragX = 0, dragY = 0, dragVx = 0, dragVy = 0;

    const toUV = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      return {
        x:  ((e.clientX - r.left) - r.width  * 0.5) / r.height,
        y: -((e.clientY - r.top)  - r.height * 0.5) / r.height,
      };
    };

    const onMouseMove = (e: MouseEvent) => {
      const { x, y } = toUV(e);
      mouseRawX = x; mouseRawY = y;
      if (mouseSmX === null) { mouseSmX = x; mouseSmY = y; }
      if (dragIdx === null) {
        const near = blobs.some(b => {
          const dx = b.x - x, dy = b.y - y;
          return Math.sqrt(dx*dx + dy*dy) < GRAB_R;
        });
        host.style.cursor = near ? "grab" : "";
      }
    };
    const onMouseLeave = () => {
      mouseRawX = null; mouseRawY = null; mouseSmX = null; mouseSmY = null;
      if (dragIdx === null) host.style.cursor = "";
    };
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const { x, y } = toUV(e);
      let best = -1, bestD = Infinity;
      for (let i = 0; i < N; i++) {
        const dx = blobs[i].x - x, dy = blobs[i].y - y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d < GRAB_R && d < bestD) { best = i; bestD = d; }
      }
      if (best !== -1) {
        dragIdx = best; dragX = x; dragY = y; dragVx = 0; dragVy = 0;
        host.style.cursor = "grabbing";
        e.preventDefault();
      }
    };
    const releaseDrag = () => {
      if (dragIdx !== null) {
        blobs[dragIdx].vx = dragVx * 0.25;
        blobs[dragIdx].vy = dragVy * 0.25;
        dragIdx = null;
        host.style.cursor = mouseRawX !== null ? "grab" : "";
      }
    };

    host.addEventListener("mousemove",  onMouseMove);
    host.addEventListener("mouseleave", onMouseLeave);
    host.addEventListener("mousedown",  onMouseDown);
    window.addEventListener("mouseup",  releaseDrag);

    // Render loop
    let rafId = 0, cancelled = false;
    let t0: number | null = null, lastTs: number | null = null, elapsed = 0;

    const draw = new Float32Array(N * 2);

    const frame = (ts: number) => {
      if (cancelled) return;
      if (!t0) t0 = ts;
      const dt = Math.min((lastTs === null ? 0 : ts - lastTs) / 1000, 0.033);
      lastTs = ts; elapsed += dt;
      const time = (ts - t0) / 1000;

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

      const { x: bx, y: by } = uvBounds();
      stepBlobs(blobs, dt, elapsed, mouseSmX, mouseSmY, bx, by, dragIdx);
      for (let i = 0; i < N; i++) { draw[i*2] = blobs[i].x; draw[i*2+1] = blobs[i].y; }

      const w = canvas.width, h = canvas.height;
      const write = 1 - ping;

      // ── Pass 1: blit prev frame × fade into write FBO ──────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbos[write].fbo);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(blitProg);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, fbos[ping].tex);
      gl.uniform2f(LU.res, w, h);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Pass 2: draw blobs on top (SRC_ALPHA blend, empty space transparent)
      gl.useProgram(blobProg);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(BU.t, time);
      gl.uniform2f(BU.res, w, h);
      gl.uniform2fv(BU.bpos, draw);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // ── Pass 3: composite to canvas + film grain noise ──────────────────────
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
      gl.disable(gl.BLEND);
      gl.useProgram(compositeProg);
      gl.bindTexture(gl.TEXTURE_2D, fbos[write].tex);
      gl.uniform1f(CU.time, time);
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
      host.removeEventListener("mousemove",  onMouseMove);
      host.removeEventListener("mouseleave", onMouseLeave);
      host.removeEventListener("mousedown",  onMouseDown);
      window.removeEventListener("mouseup",  releaseDrag);
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
