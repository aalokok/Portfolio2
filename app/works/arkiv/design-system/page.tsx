import { readFileSync } from "fs";
import path from "path";
import type { Metadata } from "next";
import Link from "next/link";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { SiteShell } from "@/components/layout/site-shell";
import { client, isSanityConfigured } from "@/sanity/lib/client";

// The arkiv design system, hosted here instead of on GitHub. The text lives in
// content/arkiv-design-system.md and its images in public/arkiv/; edit those to update the page.

const SOURCE = "https://github.com/aalokok/arkiv/blob/master/docs/design-system.md";

export const metadata: Metadata = {
  title: "arkiv design system — Aalok Sud",
  description: "Colour, type, shape, layout, motion and components for arkiv, a photo archive pinned to a 3D globe.",
};

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Plain text of a heading's children, for its anchor. */
function textOf(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) return textOf((node as { props: { children?: React.ReactNode } }).props.children);
  return "";
}

// The site's own type: 13px text, small lowercase headings, hairline tables, quiet code.
const components: Components = {
  h2: ({ children }) => (
    <h2 id={slug(textOf(children))} className="mb-[12px] mt-[48px] scroll-mt-[24px] text-[16px] italic lowercase text-foreground first:mt-0">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 id={slug(textOf(children))} className="mb-[6px] mt-[28px] scroll-mt-[24px] text-[13px] font-medium lowercase text-foreground">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="my-[10px] text-[13px] leading-[20px] text-foreground/80">{children}</p>,
  ul: ({ children }) => <ul className="my-[10px] list-disc space-y-[4px] pl-[18px] text-[13px] leading-[20px] text-foreground/80 marker:text-foreground/30">{children}</ul>,
  ol: ({ children }) => <ol className="my-[10px] list-decimal space-y-[4px] pl-[18px] text-[13px] leading-[20px] text-foreground/80">{children}</ol>,
  a: ({ href, children }) => (
    <a href={href} className="text-primary underline underline-offset-[3px] hover:no-underline">
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded-[2px] bg-foreground/[0.06] px-[4px] py-[1px] font-mono text-[11.5px] text-foreground/85">{children}</code>
  ),
  hr: () => <hr className="my-[32px] border-foreground/10" />,
  img: ({ src, alt }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={typeof src === "string" ? src : undefined} alt={alt ?? ""} loading="lazy" className="my-[18px] block w-full bg-foreground/5" />
  ),
  table: ({ children }) => (
    <div className="my-[16px] overflow-x-auto">
      <table className="w-full border-collapse text-left text-[12px] leading-[18px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-foreground/15 pb-[6px] pr-[16px] font-normal lowercase text-foreground/45">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-foreground/10 py-[7px] pr-[16px] align-top text-foreground/80">{children}</td>,
};

export default async function ArkivDesignSystemPage() {
  const markdown = readFileSync(path.join(process.cwd(), "content/arkiv-design-system.md"), "utf8");
  const sections = [...markdown.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
  // Back to the arkiv project page, wherever it sits in the works order.
  const order: number | null = isSanityConfigured
    ? await client.fetch(`*[_type == "project" && slug.current == "arkiv"][0].order`)
    : null;
  const arkivHref = order != null ? `/works?project=${order}` : "/works";

  return (
    <SiteShell
      leftRatio={[3, 7]}
      compactNav
      bottomLeftClassName="md:overflow-y-auto"
      mobileAutoHeight
      bottomLeft={
        <div className="flex flex-col gap-[18px] md:min-h-full md:justify-center md:pb-[16vh]">
          <Link href={arkivHref} className="w-fit text-[13px] leading-[20px] text-primary transition-opacity hover:opacity-70">
            arkiv
          </Link>
          <h1 className="py-[0.2em] text-[length:clamp(28px,3.4vw,52px)] font-medium leading-[1.1] text-foreground font-display-filled">
            design system
          </h1>
          <dl className="border-b border-foreground/10">
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-[16px] border-t border-foreground/10 py-[8px] text-[13px] leading-[20px]">
              <dt className="text-foreground/45">sections</dt>
              <dd className="flex flex-wrap gap-x-[12px] gap-y-[2px]">
                {sections.map((s) => (
                  <a key={s} href={`#${slug(s)}`} className="lowercase text-foreground/80 underline-offset-2 hover:underline">
                    {s}
                  </a>
                ))}
              </dd>
            </div>
            <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-[16px] border-t border-foreground/10 py-[8px] text-[13px] leading-[20px]">
              <dt className="text-foreground/45">source</dt>
              <dd>
                <a href={SOURCE} target="_blank" rel="noopener noreferrer" className="text-foreground/80 underline-offset-2 hover:underline">
                  github ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>
      }
      right={
        <article className="h-full [scrollbar-width:none] md:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/arkiv/design-system-header.png" alt="arkiv: upload and explore" className="mb-[24px] block w-full" />
          <div className="max-w-[760px] pb-[48px]">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
              {markdown}
            </ReactMarkdown>
          </div>
        </article>
      }
    />
  );
}
