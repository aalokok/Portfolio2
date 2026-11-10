"use client";

import React from "react";
import Image from "next/image";
import dynamic from "next/dynamic";
import type { ProjectMedia } from "@/lib/projects";
import { isSanityImage, sanityImageUrl, sanityLoader } from "@/lib/sanity-image";

type Props = {
  images: ProjectMedia[];
  title: string;
};

// The streaming player (with its HLS engine) only downloads where a Mux video is shown.
const MuxVideo = dynamic(() => import("@mux/mux-video-react"), { ssr: false });

/** A still from the Mux video, shown at once while the stream starts. */
function muxPoster(playbackId: string) {
  return `https://image.mux.com/${playbackId}/thumbnail.webp?width=640&time=0`;
}

function isGif(item: ProjectMedia) {
  return item.mimeType === "image/gif" || item.url.toLowerCase().endsWith(".gif");
}

function isVideo(item: ProjectMedia) {
  return (
    !!item.playbackId ||
    item.mimeType?.startsWith("video/") ||
    /\.(mp4|webm|ogg|mov)$/i.test(item.url)
  );
}

function LazyVideo({
  src,
  playbackId,
  className,
  fill,
  controls = false,
}: {
  src: string;
  /** Streams from Mux instead of downloading the whole file. */
  playbackId?: string | null;
  className?: string;
  fill?: boolean;
  /** Player mode: controls and sound, no autoplay. Default is a silent ambient loop. */
  controls?: boolean;
}) {
  // Watches the <video>, or the poster while a Mux stream waits to come into view.
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

  const style: React.CSSProperties | undefined = fill
    ? { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain" }
    : undefined;

  if (playbackId) {
    const poster = muxPoster(playbackId);
    // Until it scrolls into view, only the still is fetched.
    return loaded ? (
      <MuxVideo
        playbackId={playbackId}
        poster={poster}
        autoPlay={!controls}
        muted={!controls}
        loop={!controls}
        controls={controls}
        playsInline
        preload={controls ? "metadata" : "auto"}
        // Ambient tiles are small, so never pull more than 720p for them.
        maxResolution={controls ? undefined : "720p"}
        capRenditionToPlayerSize
        className={className}
        style={style}
      />
    ) : (
      // eslint-disable-next-line @next/next/no-img-element
      <img ref={videoRef as unknown as React.Ref<HTMLImageElement>} src={poster} alt="" className={className} style={style} />
    );
  }

  return (
    <video
      ref={videoRef}
      src={loaded ? src : undefined}
      autoPlay={!controls}
      muted={!controls}
      loop={!controls}
      controls={controls}
      playsInline
      preload={controls ? "metadata" : "none"}
      className={className}
      style={style}
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
  videoControls,
}: {
  item: ProjectMedia;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  videoControls?: boolean;
}) {
  if (isVideo(item)) {
    return <LazyVideo src={item.url} playbackId={item.playbackId} className={className} fill={fill} controls={videoControls} />;
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
        loader={isSanityImage(item.url) ? sanityLoader : undefined}
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
      loader={isSanityImage(item.url) ? sanityLoader : undefined}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      loading="lazy"
      sizes={sizes}
      className={className}
      placeholder={item.lqip ? "blur" : "empty"}
      blurDataURL={item.lqip ?? undefined}
    />
  );
}

function ScrollView({ images, title, reverse = false }: Props & { reverse?: boolean }) {
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
            el.scrollLeft += reverse ? -wholePixels : wholePixels;
          }

          if (reverse ? el.scrollLeft <= 1 : el.scrollLeft >= maxScroll - 1) {
            el.scrollLeft = reverse ? maxScroll : 0;
            fractionalCarry = 0;
          }
        }
      }
      rafId = window.requestAnimationFrame(tick);
    };

    if (reverse) el.scrollLeft = el.scrollWidth - el.clientWidth;
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
  }, [reverse]);

  return (
    <div ref={scrollRef} className="flex h-full flex-row gap-[10px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {images.map((item, i) => {
        const ratio = item.dimensions ? item.dimensions.width / item.dimensions.height : 4 / 3;
        return (
        <div
          key={item.url}
          className="relative h-[42vw] max-h-[220px] flex-shrink-0 overflow-hidden bg-foreground/5 md:h-full md:max-h-none"
          style={{ aspectRatio: item.dimensions ? `${item.dimensions.width}/${item.dimensions.height}` : isVideo(item) ? "1/1" : "4/3" }}
        >
          <MediaItem
            item={item}
            alt={item.alt ?? `${title} ${i + 1}`}
            width={item.dimensions?.width ?? 1600}
            height={item.dimensions?.height ?? 1200}
            sizes={`(max-width: 768px) ${Math.ceil(42 * ratio)}vw, ${Math.ceil(35 * ratio)}vh`}
            className="h-full w-full object-contain"
          />
        </div>
        );
      })}
    </div>
  );
}

export function ProjectImages({ images, title, reverse }: Props & { reverse?: boolean }) {
  if (!images || images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-sm bg-foreground/5">
        <p className="text-[12px] text-foreground/30 italic">No images yet.</p>
      </div>
    );
  }

  return <ScrollView images={images} title={title} reverse={reverse} />;
}

const aspectClass = {
  square: "aspect-square",
  landscape: "aspect-[4/3]",
  portrait: "aspect-[3/4]",
  wide: "aspect-video",
} as const;

/** One image or video with its caption. Used by the gallery and every media block in the story.
 *  Images carry data-zoom-* attributes so a surrounding <Lightbox> can enlarge them on click. */
export function MediaFigure({
  item,
  alt,
  className = "",
  fill = false,
  aspect,
  sizes = "(max-width: 768px) 100vw, 640px",
  videoControls = false,
  showCaption = true,
}: {
  item: ProjectMedia;
  alt: string;
  className?: string;
  /** Stretch the media to the figure's width (wide, floated, grid and side-by-side layouts). */
  fill?: boolean;
  /** Crop to a fixed shape. */
  aspect?: keyof typeof aspectClass | null;
  sizes?: string;
  videoControls?: boolean;
  showCaption?: boolean;
}) {
  const video = isVideo(item);
  const mediaClass = aspect
    ? `${aspectClass[aspect]} h-auto w-full object-cover`
    : fill
      ? "h-auto w-full object-contain"
      : "h-auto max-h-[70vh] w-auto max-w-full object-contain md:max-w-[640px]";
  const media = (
    <MediaItem
      item={item}
      alt={alt}
      width={item.dimensions?.width ?? 1600}
      height={item.dimensions?.height ?? 1200}
      sizes={sizes}
      className={mediaClass}
      videoControls={videoControls}
    />
  );
  return (
    <figure className={`flex flex-col items-start gap-[8px] ${className}`}>
      {video ? (
        media
      ) : (
        <button
          type="button"
          className={`block cursor-zoom-in ${fill || aspect ? "w-full" : "max-w-full"}`}
          aria-label={`Enlarge image: ${alt}`}
          data-zoom-src={isSanityImage(item.url) ? sanityImageUrl(item.url, 2400, 85) : item.url}
          data-zoom-alt={alt}
          data-zoom-caption={item.caption ?? ""}
        >
          {media}
        </button>
      )}
      {showCaption && item.caption && (
        <figcaption className="text-[11px] leading-[16px] text-foreground/50">
          {item.caption}
        </figcaption>
      )}
    </figure>
  );
}

const galleryCols: Record<number, string> = {
  2: "grid grid-cols-1 items-start gap-[24px] md:grid-cols-2",
  3: "grid grid-cols-2 items-start gap-[16px] md:grid-cols-3",
};

/** Every piece of media in the Gallery field, after the story. */
export function ProjectGallery({ images, title, columns }: Props & { columns?: number | null }) {
  const grid = columns ? galleryCols[columns] : undefined;
  return (
    <div className={grid ?? "flex flex-col gap-[32px]"}>
      {images.map((item, i) => (
        <MediaFigure
          key={item.url}
          item={item}
          alt={item.alt ?? `${title} ${i + 1}`}
          fill={!!grid}
          sizes={grid ? "(max-width: 768px) 100vw, 35vw" : undefined}
        />
      ))}
    </div>
  );
}
