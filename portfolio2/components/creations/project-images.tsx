"use client";

import { useState } from "react";
import Image from "next/image";

type ProjectImage = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  mimeType?: string | null;
  lqip?: string | null;
  dimensions?: { width: number; height: number } | null;
};

type Props = {
  images: ProjectImage[];
  title: string;
};

function isGif(img: ProjectImage) {
  return img.mimeType === "image/gif" || img.url.toLowerCase().endsWith(".gif");
}

function MediaImage({
  img,
  alt,
  fill,
  width,
  height,
  className,
  sizes,
}: {
  img: ProjectImage;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
}) {
  if (isGif(img)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        key={img.url}
        src={img.url}
        alt={alt}
        className={className}
        style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%" } : undefined}
      />
    );
  }

  if (fill) {
    return (
      <Image
        key={img.url}
        src={img.url}
        alt={alt}
        fill
        className={className}
        placeholder={img.lqip ? "blur" : "empty"}
        blurDataURL={img.lqip ?? undefined}
        sizes={sizes}
      />
    );
  }

  return (
    <Image
      key={img.url}
      src={img.url}
      alt={alt}
      width={width}
      height={height}
      className={className}
    />
  );
}

export function ProjectImages({ images, title }: Props) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-sm bg-foreground/5">
        <p className="text-[12px] text-foreground/30 italic">No images yet.</p>
      </div>
    );
  }

  const current = images[active];

  return (
    <div className="flex h-full flex-col gap-[10px]">
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-sm bg-foreground/5">
        <MediaImage
          img={current}
          alt={current.alt ?? title}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 60vw"
        />
      </div>

      {current.caption && (
        <p className="text-[11px] leading-[16px] text-foreground/40 italic">
          {current.caption}
        </p>
      )}

      {images.length > 1 && (
        <div className="flex flex-row gap-[6px]">
          {images.map((img, i) => (
            <button
              key={img.url}
              onClick={() => setActive(i)}
              className={`h-[40px] w-[40px] flex-shrink-0 overflow-hidden rounded-sm border transition-colors ${
                i === active ? "border-primary" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <MediaImage
                img={img}
                alt={img.alt ?? `${title} ${i + 1}`}
                width={40}
                height={40}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
