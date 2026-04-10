"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";
import { HOME_HYDRA_FRACTALS_URL, HOME_HYDRA_PATCH } from "@/lib/home-hydra-patch";

type HydraPatchProps = {
  className?: string;
};

const MIN_INIT_PX = 8;
const MAX_LAYOUT_WAIT_FRAMES = 90;

async function waitForHostLayout(
  host: HTMLElement,
  signal: { cancelled: boolean },
): Promise<{ width: number; height: number }> {
  for (let i = 0; i < MAX_LAYOUT_WAIT_FRAMES; i++) {
    if (signal.cancelled) {
      return { width: 0, height: 0 };
    }
    const r = host.getBoundingClientRect();
    const w = Math.floor(r.width);
    const h = Math.floor(r.height);
    if (w >= MIN_INIT_PX && h >= MIN_INIT_PX) {
      return { width: w, height: h };
    }
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
  const r = host.getBoundingClientRect();
  return {
    width: Math.max(MIN_INIT_PX, Math.floor(r.width)),
    height: Math.max(MIN_INIT_PX, Math.floor(r.height)),
  };
}

const HYPER_HYDRA_FRACTALS_SCRIPT_ID = "hydra-extension-hyper-fractals";

/**
 * Load hydra-fractals. Must run after `window.hydraSynth = hydra` is set.
 * We always inject a fresh script and remove it on unmount: the fractals bundle only
 * calls `setFunction` once at parse time, so a cached tag would leave a new Hydra instance
 * without mirrorWrap/inversion/etc.
 */
function appendFractalsScript(url: string): Promise<boolean> {
  document.getElementById(HYPER_HYDRA_FRACTALS_SCRIPT_ID)?.remove();
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.id = HYPER_HYDRA_FRACTALS_SCRIPT_ID;
    script.src = url;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

export function HydraPatch({ className }: HydraPatchProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const signal = { cancelled: false };
    const state = {
      rafId: 0,
      hydra: null as null | import("hydra-synth").default,
      canvas: null as HTMLCanvasElement | null,
      ro: null as ResizeObserver | null,
      resizeTimeout: undefined as ReturnType<typeof setTimeout> | undefined,
    };

    void (async () => {
      const { width: initialW, height: initialH } = await waitForHostLayout(host, signal);
      if (signal.cancelled || !hostRef.current) return;

      const { default: Hydra } = await import("hydra-synth");
      if (signal.cancelled || !hostRef.current) return;

      // Request camera + mic before Hydra init so s0.initCam() and a.fft work.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        // Hydra will take over the streams; release this handle so tracks aren't double-held.
        stream.getTracks().forEach((t) => t.stop());
      } catch (err) {
        console.warn("[HydraPatch] Media permission denied – cam/audio features will be inactive.", err);
      }
      if (signal.cancelled || !hostRef.current) return;

      const w = Math.max(MIN_INIT_PX, initialW);
      const h = Math.max(MIN_INIT_PX, initialH);

      const canvas = document.createElement("canvas");
      state.canvas = canvas;
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      canvas.style.display = "block";
      host.appendChild(canvas);

      const hydra = new Hydra({
        canvas,
        width: w,
        height: h,
        detectAudio: true,
        makeGlobal: true,
        autoLoop: false,
        enableStreamCapture: false,
      });
      state.hydra = hydra;

      /**
       * hyper-hydra/hydra-fractals.js discovers Hydra via `window.hydraSynth` (or a few
       * other globals) and requires `h.regl`. hydra-synth never sets these — without this,
       * the fractals script throws and inversion/mirrorWrap/etc. never register → black canvas.
       */
      const g = window as Window & { hydraSynth?: typeof hydra };
      g.hydraSynth = hydra;

      const fractalsOk = await appendFractalsScript(HOME_HYDRA_FRACTALS_URL);
      if (!fractalsOk) {
        console.error(
          "[HydraPatch] Failed to load hydra-fractals.js (network / adblock / CSP). Patch needs inversion(), mirrorWrap(), etc.",
        );
      }
      if (signal.cancelled || !state.hydra) return;

      await new Promise<void>((r) => {
        requestAnimationFrame(() => r());
      });
      if (signal.cancelled) return;

      try {
        hydra.eval(HOME_HYDRA_PATCH);
      } catch (err) {
        console.error("[HydraPatch] Patch eval failed:", err);
      }

      try {
        const s = hydra.synth as {
          render?: (out: unknown) => void;
          o0?: unknown;
        };
        if (typeof s.render === "function" && s.o0 !== undefined) {
          s.render(s.o0);
        }
      } catch (err) {
        console.warn("[HydraPatch] render(o0) skipped:", err);
      }

      let last = performance.now();
      const loop = (now: number) => {
        if (signal.cancelled || !state.hydra) return;
        const dt = now - last;
        last = now;
        state.hydra.tick(dt);
        state.rafId = requestAnimationFrame(loop);
      };
      state.rafId = requestAnimationFrame(loop);

      const applySize = () => {
        if (!state.hydra || signal.cancelled) return;
        const r = host.getBoundingClientRect();
        const nw = Math.max(MIN_INIT_PX, Math.floor(r.width));
        const nh = Math.max(MIN_INIT_PX, Math.floor(r.height));
        state.hydra.synth.setResolution(nw, nh);
      };

      state.ro = new ResizeObserver(() => {
        if (state.resizeTimeout) clearTimeout(state.resizeTimeout);
        state.resizeTimeout = setTimeout(applySize, 120);
      });
      state.ro.observe(host);
      applySize();
    })();

    return () => {
      signal.cancelled = true;
      cancelAnimationFrame(state.rafId);
      if (state.resizeTimeout) clearTimeout(state.resizeTimeout);
      state.ro?.disconnect();
      state.canvas?.remove();
      const g = window as Window & { hydraSynth?: typeof state.hydra; _hydra?: unknown };
      if (state.hydra && g.hydraSynth === state.hydra) {
        delete g.hydraSynth;
      }
      if (state.hydra && g._hydra === state.hydra) {
        delete g._hydra;
      }
      document.getElementById(HYPER_HYDRA_FRACTALS_SCRIPT_ID)?.remove();
      state.hydra = null;
      state.canvas = null;
    };
  }, []);

  return (
    <div
      ref={hostRef}
      className={cn("relative min-h-0 w-full overflow-hidden bg-black", className)}
    />
  );
}
