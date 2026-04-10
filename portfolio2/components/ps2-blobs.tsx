"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { FRAG_SRC, GLOW_COLORS, VERT_SRC } from "@/lib/ps2-blobs-shader";

export type Ps2BlobsProps = {
  className?: string;
  morph?: number;
  glow?: number;
};

// ─── Physics types ─────────────────────────────────────────────────────────────

const N = 7;

interface Blob {
  x: number; y: number;
  vx: number; vy: number;
  wanderAngle: number;
  wanderSpeed: number;
  wanderStr: number;
  floatPhase: number;
  floatFreq: number;
  curiousTimer: number;
  curiousInterval: number;
}

function makeBlobs(aspectX: number, aspectY: number): Blob[] {
  return Array.from({ length: N }, (_, i) => {
    const ang = (i / N) * Math.PI * 2;
    return {
      x: Math.cos(ang) * aspectX * 0.7,
      y: Math.sin(ang) * aspectY * 0.7,
      vx: (Math.random() - 0.5) * 0.0003,
      vy: (Math.random() - 0.5) * 0.0003,
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
  blobs: Blob[],
  dt: number,
  elapsed: number,
  mouseX: number | null,
  mouseY: number | null,
  bx: number,
  by: number,
) {
  const BLOB_R = 0.28;
  const REP_F  = 0.0022;
  const DAMP   = 0.982;
  const MAX_V  = 0.0012;
  const BX = bx * 0.90;
  const BY = by * 0.90;

  for (let i = 0; i < N; i++) {
    const bl = blobs[i];

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

    if (mouseX !== null && mouseY !== null) {
      const dx  = mouseX - bl.x;
      const dy  = mouseY - bl.y;
      const d   = Math.sqrt(dx * dx + dy * dy) || 0.001;
      const str = 0.00010 / (d + 0.15);
      bl.vx += dx * str;
      bl.vy += dy * str;
    }

    for (let j = 0; j < N; j++) {
      if (i === j) continue;
      const dx = bl.x - blobs[j].x;
      const dy = bl.y - blobs[j].y;
      const d  = Math.sqrt(dx * dx + dy * dy) || 0.001;
      if (d < BLOB_R) {
        const f = ((BLOB_R - d) / d) * REP_F;
        bl.vx += dx * f;
        bl.vy += dy * f;
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

// ─── WebGL helpers ─────────────────────────────────────────────────────────────

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

function buildProgram(gl: WebGLRenderingContext) {
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER,   VERT_SRC));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, FRAG_SRC));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    throw new Error(`Program error: ${gl.getProgramInfoLog(prog)}`);
  return prog;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function Ps2Blobs({ className, morph = 0.75, glow = 0.95 }: Ps2BlobsProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "width:100%;height:100%;display:block;";
    host.appendChild(canvas);

    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { canvas.remove(); return; }

    let prog: WebGLProgram;
    try { prog = buildProgram(gl); } catch (e) { console.error("[Ps2Blobs]", e); canvas.remove(); return; }

    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
    const aloc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(aloc);
    gl.vertexAttribPointer(aloc, 2, gl.FLOAT, false, 0, 0);

    const U = {
      t:     gl.getUniformLocation(prog, "t")!,
      res:   gl.getUniformLocation(prog, "res")!,
      morph: gl.getUniformLocation(prog, "morph")!,
      glow:  gl.getUniformLocation(prog, "glow")!,
      // WebGL 1: array uniforms require the [0] suffix on some drivers
      bpos:  gl.getUniformLocation(prog, "bpos[0]")!,
      gcol:  gl.getUniformLocation(prog, "gcol[0]")!,
    };

    gl.uniform3fv(U.gcol, new Float32Array(GLOW_COLORS.flat()));
    gl.uniform1f(U.morph, morph);
    gl.uniform1f(U.glow, glow);

    // UV bounds in the same space as the physics sim: x = (w/h)*0.5, y = 0.5
    const uvBounds = () => {
      const r = host.getBoundingClientRect();
      const h = r.height || 1;
      return { x: (r.width / h) * 0.5, y: 0.5 };
    };
    const { x: bx0, y: by0 } = uvBounds();
    const blobs = makeBlobs(bx0, by0);

    // resize
    const setSize = () => {
      const w = Math.max(1, Math.floor(host.clientWidth));
      const h = Math.max(1, Math.floor(host.clientHeight));
      canvas.width = w; canvas.height = h;
      gl.viewport(0, 0, w, h);
    };
    setSize();
    const ro = new ResizeObserver(setSize);
    ro.observe(host);

    // mouse — UV space matching physics: x from left, y flipped
    let mouseSmX: number | null = null;
    let mouseSmY: number | null = null;
    let mouseRawX: number | null = null;
    let mouseRawY: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      mouseRawX =  ((e.clientX - r.left) - r.width  * 0.5) / r.height;
      mouseRawY = -((e.clientY - r.top)  - r.height * 0.5) / r.height;
      if (mouseSmX === null) { mouseSmX = mouseRawX; mouseSmY = mouseRawY; }
    };
    const onMouseLeave = () => {
      mouseRawX = null; mouseRawY = null; mouseSmX = null; mouseSmY = null;
    };
    host.addEventListener("mousemove", onMouseMove);
    host.addEventListener("mouseleave", onMouseLeave);

    // render loop
    let rafId = 0;
    let cancelled = false;
    let t0: number | null = null;
    let lastTs: number | null = null;
    let elapsed = 0;

    const frame = (ts: number) => {
      if (cancelled) return;
      if (!t0) t0 = ts;
      const dt = Math.min((lastTs === null ? 0 : ts - lastTs) / 1000, 0.033);
      lastTs = ts;
      elapsed += dt;

      // smooth mouse
      if (mouseRawX !== null && mouseSmX !== null) {
        mouseSmX += (mouseRawX - mouseSmX) * 0.04;
        mouseSmY! += (mouseRawY! - mouseSmY!) * 0.04;
      }

      const { x: bx, y: by } = uvBounds();
      stepBlobs(blobs, dt, elapsed, mouseSmX, mouseSmY, bx, by);

      gl.uniform1f(U.t, (ts - t0) / 1000);
      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform2fv(U.bpos, new Float32Array(blobs.flatMap(b => [b.x, b.y])));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      rafId = requestAnimationFrame(frame);
    };
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      ro.disconnect();
      host.removeEventListener("mousemove", onMouseMove);
      host.removeEventListener("mouseleave", onMouseLeave);
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
