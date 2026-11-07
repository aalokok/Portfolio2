// Sanity's image CDN resizes and converts images itself (WebP or AVIF, whichever the
// browser takes), so Sanity images skip Next's optimizer and are asked for at the size shown.
import type { ImageLoader } from "next/image";

export function isSanityImage(url: string) {
  return url.startsWith("https://cdn.sanity.io/images/");
}

/** The image `width` px wide, in the best format the browser supports. Never upscales. */
export function sanityImageUrl(url: string, width: number, quality = 75) {
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", String(quality));
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "max");
  return u.toString();
}

export const sanityLoader: ImageLoader = ({ src, width, quality }) => sanityImageUrl(src, width, quality);
