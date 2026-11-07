// Reads public Are.na boards (channels) for the Inspiration page.
// Uses Are.na's public API: no account or key needed for public boards.
import { unstable_cache } from "next/cache";

export type ArenaBlock = {
  id: number;
  kind: "image" | "link" | "text" | "media" | "attachment" | "channel";
  title: string;
  /** Preview image (images, links, videos, PDFs). */
  image?: string;
  /** Larger image for the full-screen viewer. */
  largeImage?: string;
  /** Plain text for text blocks. */
  text?: string;
  /** Where clicking goes: the original source, or the block on Are.na. */
  href: string;
};

export type ArenaBoard = {
  slug: string;
  url: string;
  blocks: ArenaBlock[];
};

/** "https://www.are.na/aalok-sud/visual-reference" → "visual-reference" */
export function arenaSlug(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (!/(^|\.)are\.na$/.test(u.hostname)) return null;
    const parts = u.pathname.split("/").filter(Boolean);
    // are.na/<user>/<channel>  or  are.na/channel/<channel>
    return parts.length >= 2 ? parts[parts.length - 1] : null;
  } catch {
    return null;
  }
}

type RawBlock = {
  id: number;
  class: string;
  title?: string | null;
  generated_title?: string | null;
  content?: string | null;
  slug?: string | null;
  user?: { slug?: string | null } | null;
  source?: { url?: string | null } | null;
  image?: { display?: { url?: string }; large?: { url?: string } } | null;
  attachment?: { url?: string | null } | null;
};

const namedEntities: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
};

/** Are.na sends text with HTML entities (`&gt;`, `&nbsp;`, `&#39;`...) and markdown quote markers. */
function plainText(content: string): string {
  return content
    .replace(/&(?:#(d+)|#x([da-f]+)|([a-z]+));/gi, (match, dec, hex, name) => {
      if (dec) return String.fromCodePoint(Number(dec));
      if (hex) return String.fromCodePoint(parseInt(hex, 16));
      return namedEntities[name.toLowerCase()] ?? match;
    })
    .replace(/ /g, " ")
    .replace(/^> ?/gm, "")
    .trim();
}

function toBlock(b: RawBlock): ArenaBlock | null {
  const onArena = `https://www.are.na/block/${b.id}`;
  const rawTitle = plainText(b.title || b.generated_title || "");
  const title = rawTitle === "Untitled" ? "" : rawTitle;
  const image = b.image?.display?.url;
  const largeImage = b.image?.large?.url ?? image;
  switch (b.class) {
    case "Image":
      return image ? { id: b.id, kind: "image", title, image, largeImage, href: b.source?.url || onArena } : null;
    case "Link":
      return { id: b.id, kind: "link", title, image, largeImage, href: b.source?.url || onArena };
    case "Media":
      return { id: b.id, kind: "media", title, image, largeImage, href: b.source?.url || onArena };
    case "Attachment":
      return { id: b.id, kind: "attachment", title, image, largeImage, href: b.attachment?.url || onArena };
    case "Text":
      return b.content ? { id: b.id, kind: "text", title, text: plainText(b.content), href: onArena } : null;
    case "Channel":
      return {
        id: b.id,
        kind: "channel",
        title,
        href: b.user?.slug && b.slug ? `https://www.are.na/${b.user.slug}/${b.slug}` : onArena,
      };
    default:
      return null;
  }
}

// Cached for an hour. A failed request throws, so it is never cached: the
// page shows a link to the board instead, and the next visit tries again.
const fetchBlocks = unstable_cache(
  async (slug: string): Promise<ArenaBlock[]> => {
    const res = await fetch(
      `https://api.are.na/v2/channels/${encodeURIComponent(slug)}/contents?per=100&direction=desc`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "User-Agent": "aalok.space portfolio (https://www.aalok.space)",
        },
      },
    );
    if (!res.ok) throw new Error(`Are.na ${slug}: ${res.status}`);
    const data = (await res.json()) as { contents?: RawBlock[] };
    return (data.contents ?? []).map(toBlock).filter((b): b is ArenaBlock => b !== null);
  },
  ["arena-channel-v3"],
  { revalidate: 3600 },
);

/** The board's blocks, newest first, or null if Are.na couldn't be reached. */
export async function getArenaBoard(url: string): Promise<ArenaBoard | null> {
  const slug = arenaSlug(url);
  if (!slug) return null;
  try {
    return { slug, url, blocks: await fetchBlocks(slug) };
  } catch (err) {
    console.error(err);
    return null;
  }
}
