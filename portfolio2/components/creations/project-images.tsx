"use client";

import React from "react";
import Image from "next/image";
import { useCreationsView } from "./view-context";

type ProjectMedia = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  mimeType?: string | null;
  lqip?: string | null;
  dimensions?: { width: number; height: number } | null;
};

type Props = {
  images: ProjectMedia[];
  title: string;
};

function isGif(item: ProjectMedia) {
  return item.mimeType === "image/gif" || item.url.toLowerCase().endsWith(".gif");
}

function isVideo(item: ProjectMedia) {
  return (
    item.mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(item.url)
  );
}

function LazyVideo({
  src,
  className,
  fill,
}: {
  src: string;
  className?: string;
  fill?: boolean;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          setLoaded(true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loaded]);

  return (
    <video
      ref={videoRef}
      src={loaded ? src : undefined}
      autoPlay
      muted
      loop
      playsInline
      preload="none"
      className={className}
      style={
        fill
          ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }
          : undefined
      }
    />
  );
}

function MediaItem({
  item,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
}: {
  item: ProjectMedia;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}) {
  if (isVideo(item)) {
    return <LazyVideo src={item.url} className={className} fill={fill} />;
  }

  if (isGif(item)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={item.url}
        alt={alt}
        loading="lazy"
        className={className}
        style={
          fill
            ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }
            : undefined
        }
      />
    );
  }

  if (fill) {
    return (
      <Image
        src={item.url}
        alt={alt}
        fill
        loading="lazy"
        className={className}
        placeholder={item.lqip ? "blur" : "empty"}
        blurDataURL={item.lqip ?? undefined}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      src={item.url}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      loading="lazy"
      className={className}
      placeholder={item.lqip ? "blur" : "empty"}
      blurDataURL={item.lqip ?? undefined}
    />
  );
}

function ScrollView({ images, title }: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const autoScrollPausedUntilRef = React.useRef(0);

  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const pauseAutoScroll = (ms: number) => {
      autoScrollPausedUntilRef.current = Date.now() + ms;
    };
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
      pauseAutoScroll(2200);
    };
    const onTouchStart = () => pauseAutoScroll(3000);
    const onTouchEnd = () => pauseAutoScroll(1200);

    let rafId = 0;
    let lastTs = 0;
    const speedPxPerSec = 8; // very slow ambient drift
    let fractionalCarry = 0;

    const tick = (ts: number) => {
      if (!lastTs) lastTs = ts;
      const dt = ts - lastTs;
      lastTs = ts;

      if (Date.now() >= autoScrollPausedUntilRef.current) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll > 0) {
          const delta = (speedPxPerSec * dt) / 1000 + fractionalCarry;
          const wholePixels = Math.trunc(delta);
          fractionalCarry = delta - wholePixels;

          if (wholePixels !== 0) {
            el.scrollLeft += wholePixels;
          }

          if (el.scrollLeft >= maxScroll - 1) {
            el.scrollLeft = 0;
            fractionalCarry = 0;
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    autoScrollPausedUntilRef.current = Date.now() + 900;
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    rafId = window.requestAnimationFrame(tick);
    return () => {
      window.cancelAnimationFrame(rafId);
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  return (
    <div ref={scrollRef} className="flex h-full flex-row gap-[10px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {images.map((item, i) => (
        <div
          key={item.url}
          className="relative h-[42vw] max-h-[220px] flex-shrink-0 overflow-hidden bg-foreground/5 transition-[filter] duration-300 md:h-full md:max-h-none md:grayscale md:hover:grayscale-0"
          style={{ aspectRatio: item.dimensions ? `${item.dimensions.width}/${item.dimensions.height}` : isVideo(item) ? "1/1" : "4/3" }}
        >
          <MediaItem
            item={item}
            alt={item.alt ?? `${title} ${i + 1}`}
            width={item.dimensions?.width ?? 1600}
            height={item.dimensions?.height ?? 1200}
            className="h-full w-full object-contain"
          />
        </div>
      ))}
    </div>
  );
}

function GridView({ images, title }: Props) {
  return (
    <div className="grid grid-cols-3 grid-rows-2 gap-x-[10px] gap-y-[12px] md:gap-x-[18px] md:gap-y-[36px]">
      {images.slice(0, 6).map((item, i) => (
        <div key={item.url} className="relative aspect-square max-h-[105px] max-w-[105px] overflow-hidden bg-foreground/5 transition-[filter] duration-300 md:max-h-[200px] md:max-w-[200px] md:grayscale md:hover:grayscale-0">
          <MediaItem
            item={item}
            alt={item.alt ?? `${title} ${i + 1}`}
            width={item.dimensions?.width ?? 800}
            height={item.dimensions?.height ?? 800}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
      {Array.from({ length: Math.max(0, 6 - images.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="aspect-square max-h-[105px] max-w-[105px]  bg-foreground/5 opacity-40 md:max-h-[200px] md:max-w-[200px]" />
      ))}
    </div>
  );
}

export function ProjectImages({ images, title }: Props) {
  const { view } = useCreationsView();

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-sm bg-foreground/5">
        <p className="text-[12px] text-foreground/30 italic">No images yet.</p>
      </div>
    );
  }

  return view === "scroll"
    ? <ScrollView images={images} title={title} />
    : <GridView images={images} title={title} />;
}
