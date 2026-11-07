// Zines shown as flipbooks instead of the image strip on their project page.
// Keyed by the project's Sanity slug. Page images live in /public/zines/<slug>/.

export type Zine = {
  /** Page image URLs in reading order. First = front cover, last = back cover. */
  pages: string[];
  /** Pixel size of ONE page image (sets the aspect ratio). */
  pageWidth: number;
  pageHeight: number;
  /** Optional full PDF for download. */
  pdf?: string;
};

function pageRange(slug: string, count: number, ext = "webp") {
  return Array.from(
    { length: count },
    (_, i) => `/zines/${slug}/page-${String(i + 1).padStart(2, "0")}.${ext}`,
  );
}

const zines: Record<string, Zine> = {
  horsevision: {
    pages: pageRange("horsevision", 38),
    pageWidth: 846,
    pageHeight: 1200,
    pdf: "/zines/horsevision.pdf",
  },
};

/** Look a zine up by slug, falling back to the title squashed to lowercase ("HorseVision" → "horsevision"). */
export function getZine(slug?: string | null, title?: string | null): Zine | null {
  const keys = [slug, title?.toLowerCase().replace(/[^a-z0-9]/g, "")];
  for (const key of keys) {
    if (key && zines[key]) return zines[key];
  }
  return null;
}
