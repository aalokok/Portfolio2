"use client";

import Image from "next/image";
import { useCreationsView } from "./view-context";

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

function MediaImg({
  img,
  alt,
  className,
  fill,
  width,
  height,
  sizes,
}: {
  img: ProjectImage;
  alt: string;
  className?: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
}) {
  if (isGif(img)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={img.url}
        alt={alt}
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
      src={img.url}
      alt={alt}
      width={width ?? 400}
      height={height ?? 300}
      className={className}
      placeholder={img.lqip ? "blur" : "empty"}
      blurDataURL={img.lqip ?? undefined}
    />
  );
}

function ScrollView({ images, title }: Props) {
  return (
    <div className="flex h-full flex-row gap-[10px] overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {images.map((img, i) => (
        <div
          key={img.url}
          className="relative h-full flex-shrink-0 overflow-hidden rounded-sm bg-foreground/5"
          style={{ aspectRatio: img.dimensions ? `${img.dimensions.width}/${img.dimensions.height}` : "4/3" }}
        >
          <MediaImg
            img={img}
            alt={img.alt ?? `${title} ${i + 1}`}
            fill
            className="object-contain"
            sizes="80vw"
          />
        </div>
      ))}
    </div>
  );
}

function GridView({ images, title }: Props) {
  return (
    <div className="grid grid-cols-3 gap-[36px]">
      {images.slice(0, 6).map((img, i) => (
        <div key={img.url} className="relative aspect-square max-h-[200px] max-w-[200px] overflow-hidden rounded-sm bg-foreground/5">
          <MediaImg
            img={img}
            alt={img.alt ?? `${title} ${i + 1}`}
            fill
            className="object-cover"
            sizes="30vw"
          />
        </div>
      ))}
      {Array.from({ length: Math.max(0, 6 - images.length) }).map((_, i) => (
        <div key={`empty-${i}`} className="aspect-square max-h-[200px] max-w-[200px] rounded-sm bg-foreground/5 opacity-40" />
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
