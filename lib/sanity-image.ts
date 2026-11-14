// Sanity's image CDN resizes and converts images itself, so Sanity images skip Next's optimizer
// and are asked for at the size shown.
import type { ImageLoader } from "next/image";

export function isSanityImage(url: string) {
  return url.startsWith("https://cdn.sanity.io/images/");
}

// The work is full of fine texture: grain, dot fields, thin lines, screenshots of patches and
// UIs. Low settings smear all of that (quality 75 turned 5oundmachine's dot drawings to mush),
// so photos get 90 and PNGs, usually flat graphics and gradients, get 95.
const PHOTO_QUALITY = 90;
const GRAPHIC_QUALITY = 95;
const isPng = (url: string) => new URL(url).pathname.toLowerCase().endsWith(".png");

/**
 * The image `width` px wide as WebP. Never upscales. WebP rather than AVIF: AVIF smooths fine
 * grain away even at high quality, and every current browser shows WebP.
 * `quality` can raise the floor (never lower it).
 */
export function sanityImageUrl(url: string, width: number, quality?: number) {
  const u = new URL(url);
  const floor = isPng(url) ? GRAPHIC_QUALITY : PHOTO_QUALITY;
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", String(Math.max(quality ?? 0, floor)));
  u.searchParams.set("fm", "webp");
  u.searchParams.delete("auto");
  u.searchParams.set("fit", "max");
  return u.toString();
}

export const sanityLoader: ImageLoader = ({ src, width, quality }) => sanityImageUrl(src, width, quality);
