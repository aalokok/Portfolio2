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
export type DescriptionMedia = ProjectMedia & { _type: "image" | "file"; _key: string };

export type DescriptionBlock = PortableTextBlock | DescriptionMedia;

export type Project = {
  _id: string;
  title: string;
  slug?: { current?: string | null } | null;
  order: number;
  year?: number | null;
  summary?: string | null;
  tags?: string[] | null;
  link?: string | null;
  linkLabel?: string | null;
  liveLink?: string | null;
  collaborators?: { name?: string | null; role?: string | null; link?: string | null }[] | null;
  images?: ProjectMedia[] | null;
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
