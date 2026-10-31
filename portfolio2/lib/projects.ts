import type { PortableTextBlock } from "sanity";

export type ProjectMedia = {
  url: string;
  alt?: string | null;
  caption?: string | null;
  mimeType?: string | null;
  lqip?: string | null;
  dimensions?: { width: number; height: number } | null;
};

/** An image or video placed inside the description. */
export type DescriptionMedia = ProjectMedia & {
  _type: "image" | "file";
  _key: string;
  position?: "full" | "wide" | "left" | "right" | "center" | null;
  /** Videos only. */
  playback?: "ambient" | "player" | null;
};

export type Aspect = "original" | "square" | "landscape" | "portrait" | "wide";

/** Images side by side, wrapping into a grid. */
export type DescriptionImageRow = {
  _type: "imageRow";
  _key: string;
  images?: (ProjectMedia & { _key: string })[] | null;
  columns?: number | null;
  aspect?: Aspect | null;
  /** Older rows: true meant square. */
  crop?: boolean | null;
  caption?: string | null;
};

/** Rich text used inside other blocks. */
export type SimpleText = PortableTextBlock[];

export type DescriptionMediaText = {
  _type: "mediaText";
  _key: string;
  image?: ProjectMedia | null;
  text?: SimpleText | null;
  imageSide?: "left" | "right" | null;
  imageWidth?: "third" | "half" | "twoThirds" | null;
};

export type DescriptionEmbed = {
  _type: "embed";
  _key: string;
  url?: string | null;
  aspect?: "wide" | "landscape" | "square" | "portrait" | "phone" | null;
  caption?: string | null;
};

export type DescriptionAudio = {
  _type: "audio";
  _key: string;
  url?: string | null;
  mimeType?: string | null;
  title?: string | null;
  caption?: string | null;
};

export type DescriptionPullQuote = { _type: "pullQuote"; _key: string; quote?: string | null; attribution?: string | null };

export type DescriptionTextColumns = {
  _type: "textColumns";
  _key: string;
  columns?: { _key: string; heading?: string | null; text?: SimpleText | null }[] | null;
};

export type DescriptionCallout = {
  _type: "callout";
  _key: string;
  label?: string | null;
  text?: SimpleText | null;
  tone?: "neutral" | "blue" | "green" | null;
};

export type DescriptionStats = {
  _type: "stats";
  _key: string;
  items?: { _key: string; value?: string | null; label?: string | null }[] | null;
};

export type DescriptionCode = {
  _type: "codeBlock";
  _key: string;
  language?: string | null;
  filename?: string | null;
  code?: string | null;
};

export type DescriptionButtons = {
  _type: "buttons";
  _key: string;
  items?: { _key: string; label?: string | null; url?: string | null }[] | null;
};

export type DescriptionDivider = { _type: "divider"; _key: string; kind?: "line" | "small" | "large" | null };

export type DescriptionBlock =
  | PortableTextBlock
  | DescriptionMedia
  | DescriptionImageRow
  | DescriptionMediaText
  | DescriptionEmbed
  | DescriptionAudio
  | DescriptionPullQuote
  | DescriptionTextColumns
  | DescriptionCallout
  | DescriptionStats
  | DescriptionCode
  | DescriptionButtons
  | DescriptionDivider;

/** The two tabs on Creations and Explorations. */
export const PROJECT_CATEGORIES = [
  { value: "creative-technology", label: "Creative Technology" },
  { value: "design", label: "Design" },
] as const;

export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number]["value"];

/** The tab shown when no category is chosen: the first one. */
export const DEFAULT_CATEGORY: ProjectCategory = PROJECT_CATEGORIES[0].value;

/** The Are.na boards page, listed after the categories in the sub-nav. */
export const INSPIRATION_HREF = "/creations-and-explorations/inspiration";

export function isProjectCategory(value: unknown): value is ProjectCategory {
  return PROJECT_CATEGORIES.some((c) => c.value === value);
}

/** Untagged projects count as Creative Technology. */
export function projectCategory(project: { category?: string | null }): ProjectCategory {
  return isProjectCategory(project.category) ? project.category : "creative-technology";
}

export function categoryHref(category: ProjectCategory) {
  return `/creations-and-explorations?category=${category}`;
}

export type Project = {
  _id: string;
  title: string;
  slug?: { current?: string | null } | null;
  order: number;
  year?: number | null;
  summary?: string | null;
  category?: string | null;
  tags?: string[] | null;
  link?: string | null;
  linkLabel?: string | null;
  liveLink?: string | null;
  collaborators?: { name?: string | null; role?: string | null; link?: string | null }[] | null;
  images?: ProjectMedia[] | null;
  galleryColumns?: number | null;
  specs?: { label: string; value: string }[] | null;
  description?: DescriptionBlock[] | null;
};

/** The project's one-liner: its `summary`, or else the first sentence of its description. */
export function projectOneLiner(project: Project): string | null {
  if (project.summary?.trim()) return project.summary.trim();
  for (const block of project.description ?? []) {
    if (!("children" in block)) continue; // skip images and videos
    const children = block.children as { text?: string }[] | undefined;
    const text = children?.map((c) => c.text ?? "").join("").trim();
    if (text) return text.match(/^.+?[.!?](?=\s|$)/)?.[0] ?? text;
  }
  return null;
}
