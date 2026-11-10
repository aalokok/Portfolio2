// Sanity's image CDN resizes and converts images itself (WebP or AVIF, whichever the
// browser takes), so Sanity images skip Next's optimizer and are asked for at the size shown.
import type { ImageLoader } from "next/image";

export function isSanityImage(url: string) {
  return url.startsWith("https://cdn.sanity.io/images/");
}

// PNGs are usually graphics (gradients, fine lines, flat color, text), which quality 75 turns
// into bands and smudges. They stay at 95: still a small file, but it looks like the upload.
const GRAPHIC_QUALITY = 95;
const isPng = (url: string) => new URL(url).pathname.toLowerCase().endsWith(".png");

/** The image `width` px wide, in the best format the browser supports. Never upscales. */
export function sanityImageUrl(url: string, width: number, quality = 75) {
  const u = new URL(url);
  if (isPng(url)) quality = Math.max(quality, GRAPHIC_QUALITY);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", String(quality));
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "max");
  return u.toString();
}

export const sanityLoader: ImageLoader = ({ src, width, quality }) => sanityImageUrl(src, width, quality);
