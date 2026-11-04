"use client";

import { forwardRef, useCallback, useEffect, useId, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";

/*
 * The liquid melt from the homepage headline ("technologist" melting into "designer"):
 * two blurred, fading copies of the text overlap under a threshold filter, which turns the
 * blur into a single gooey shape. Sizes are in em, so it works for any font size.
 */

const BLUR = 0.09; // em: how blurry a word gets as it melts away
const MAX_BLUR = 0.75; // em
const REST_BLUR = 0.02; // em: the softness right after a morph
const THRESHOLD = 60 / 255; // where the melt filter cuts faint pixels away
const MORPH = 450; // ms to melt from one text into the next
const SETTLE = 450; // ms for the softness to fade back to plain text (short, so names read quickly)

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** How blurred and faded a layer is at progress p (0 = gone, 1 = fully there). */
function morphStyle(el: HTMLElement | null, p: number, em: number) {
  if (!el) return;
  if (p >= 1 || p <= 0) {
    el.style.filter = "";
    el.style.opacity = p >= 1 ? "1" : "0";
    return;
  }
  const blur = BLUR * em;
  el.style.filter = `blur(${Math.min(blur / p - blur, MAX_BLUR * em)}px)`;
  el.style.opacity = `${Math.pow(p, 0.4) * 100}%`;
}

/** Melt filter strength on the whole text: 1 = full, 0 = none (plain text, filter removed). */
function setMelt(matrix: SVGFEColorMatrixElement | null, box: HTMLElement | null, amount: number, em: number) {
  const slope = Math.pow(255, amount);
  const offset = -(slope - 1) * THRESHOLD;
  matrix?.setAttribute("values", `1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${slope.toFixed(3)} ${offset.toFixed(3)}`);
  if (box) {
    box.style.filter =
      amount <= 0 ? "none" : `url(#${matrix?.closest("filter")?.id}) blur(${(REST_BLUR * em * amount).toFixed(3)}px)`;
  }
}

export type MeltTextHandle = {
  /** Melt the text partway (0 = plain, 1 = gone) over ms, e.g. a faint wobble on hover. */
  peek: (target: number, ms: number) => void;
};

type Layer = { key: number; text: string };

/**
 * Text that melts into its new value whenever `text` changes. With `appear`, it also melts in
 * when it first shows. A ref gives `peek` for hover and click wobbles. `strength` scales how
 * blurry the melt gets (1 = like the homepage headline; lower keeps big text more readable).
 */
export const MeltText = forwardRef<
  MeltTextHandle,
  { text: string; appear?: boolean; strength?: number; className?: string }
>(
  function MeltText({ text, appear = false, strength = 1, className }, ref) {
    const filterId = `melt-${useId().replace(/[^a-zA-Z0-9-]/g, "")}`;
    const [layers, setLayers] = useState<Layer[]>(() => [{ key: 0, text }]);
    const boxRef = useRef<HTMLSpanElement>(null);
    const matrixRef = useRef<SVGFEColorMatrixElement>(null);
    const layerEls = useRef(new Map<number, HTMLSpanElement>());
    const frame = useRef(0);
    const morphing = useRef(false);
    const mix = useRef(0); // how far a peek has melted the text

    const strengthRef = useRef(strength);
    strengthRef.current = strength;
    // Every blur is sized in em, so scaling the em scales the whole melt.
    const em = () =>
      (boxRef.current ? parseFloat(getComputedStyle(boxRef.current).fontSize) : 16) * strengthRef.current;
    const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A new text: keep the one showing now as the layer melting away.
    useEffect(() => {
      setLayers((current) => {
        const top = current[current.length - 1];
        return top.text === text ? current : [top, { key: top.key + 1, text }];
      });
    }, [text]);

    // Melt from one layer into the next (or, with `appear`, in from nothing on first show).
    const firstRun = useRef(true);
    useLayoutEffect(() => {
      const appearing = firstRun.current && appear;
      firstRun.current = false;
      if (layers.length < 2 && !appearing) return;
      const size = em();
      const outEl = layers.length > 1 ? layerEls.current.get(layers[0].key) ?? null : null;
      const inEl = layerEls.current.get(layers[layers.length - 1].key) ?? null;
      const done = () => {
        if (layers.length > 1) setLayers((current) => current.slice(-1));
      };
      if (reducedMotion()) {
        morphStyle(outEl, 0, size);
        morphStyle(inEl, 1, size);
        setMelt(matrixRef.current, boxRef.current, 0, size);
        done();
        return;
      }
      cancelAnimationFrame(frame.current);
      morphing.current = true;
      mix.current = 0;
      setMelt(matrixRef.current, boxRef.current, 1, size);
      morphStyle(inEl, 0, size);
      let t0 = -1;
      let swapped = false;
      const tick = (now: number) => {
        if (t0 < 0) t0 = now;
        const t = now - t0;
        const p = Math.min(t / MORPH, 1);
        morphStyle(outEl, 1 - p, size);
        morphStyle(inEl, p, size);
        if (p >= 1 && !swapped) {
          swapped = true;
          done();
        }
        const settle = Math.min(Math.max((t - MORPH) / SETTLE, 0), 1);
        setMelt(matrixRef.current, boxRef.current, 1 - easeInOut(settle), size);
        if (settle < 1) frame.current = requestAnimationFrame(tick);
        else morphing.current = false;
      };
      frame.current = requestAnimationFrame(tick);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layers]);

    useEffect(() => () => cancelAnimationFrame(frame.current), []);

    const peek = useCallback((target: number, ms: number) => {
      if (morphing.current || reducedMotion()) return;
      cancelAnimationFrame(frame.current);
      const size = em();
      const el = boxRef.current?.lastElementChild as HTMLElement | null;
      const from = mix.current;
      let t0 = -1;
      const tick = (now: number) => {
        if (t0 < 0) t0 = now;
        const k = Math.min((now - t0) / ms, 1);
        const m = from + (target - from) * easeInOut(k);
        mix.current = m;
        morphStyle(el, 1 - m, size);
        // The filter fades in and out with the wobble, so there's no snap at either end.
        setMelt(matrixRef.current, boxRef.current, Math.min(1, m * 4), size);
        if (k < 1) frame.current = requestAnimationFrame(tick);
      };
      frame.current = requestAnimationFrame(tick);
    }, []);

    useImperativeHandle(ref, () => ({ peek }), [peek]);

    return (
      <span ref={boxRef} className={`relative inline-grid ${className ?? ""}`} style={{ filter: "none" }}>
        <svg aria-hidden className="absolute h-0 w-0">
          <defs>
            <filter id={filterId}>
              <feColorMatrix
                ref={matrixRef}
                in="SourceGraphic"
                type="matrix"
                values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -60"
              />
            </filter>
          </defs>
        </svg>
        {layers.map((layer, i) => (
          <span
            key={layer.key}
            ref={(el) => {
              if (el) layerEls.current.set(layer.key, el);
              else layerEls.current.delete(layer.key);
            }}
            aria-hidden={i < layers.length - 1 || undefined}
            className="col-start-1 row-start-1"
            style={appear && layer.key === 0 ? { opacity: 0 } : undefined}
          >
            {layer.text}
          </span>
        ))}
      </span>
    );
  },
);
