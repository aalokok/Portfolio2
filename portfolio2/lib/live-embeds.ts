// Live pieces hosted on this site (in /public), shown at the top of their project page.
// Keyed by the project's Sanity slug, like the zines.

export type LiveEmbedTarget = { src: string; title: string };

const liveEmbeds: Record<string, LiveEmbedTarget> = {
  "5oundmachine": { src: "/5oundmachine/index.html", title: "5oundmachine, playable in the browser" },
};

export function getLiveEmbed(slug?: string | null): LiveEmbedTarget | null {
  return (slug && liveEmbeds[slug]) || null;
}
