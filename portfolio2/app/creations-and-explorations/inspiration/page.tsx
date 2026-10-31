import type { Metadata } from "next";
import { client, isSanityConfigured } from "@/sanity/lib/client";
import { inspirationBoardsQuery } from "@/sanity/lib/queries";
import { SiteShell } from "@/components/layout/site-shell";
import { Lightbox } from "@/components/creations/lightbox";
import { getArenaBoard, arenaSlug, type ArenaBlock } from "@/lib/arena";

// Re-check Sanity for added or reordered boards every 10 minutes.
// (Each board's Are.na contents are cached for an hour in lib/arena.ts.)
export const revalidate = 600;

export const metadata: Metadata = {
  title: "Inspiration — Aalok Sud",
  description: "Images, references and ideas I collect on Are.na.",
};

type Board = { _id: string; title?: string | null; url: string; note?: string | null };

// Always shown first. Any boards added in Sanity follow these.
const codeBoards: Board[] = [
  {
    _id: "talktalktalk",
    title: "talktalktalk",
    url: "https://www.are.na/aalok-sud/talktalktalk-wsz5avxtbce",
  },
];

const heading = "text-[16px] font-areal italic";
const body = "text-[13px] leading-[20px] text-foreground/80";
const linkClass = "text-primary underline underline-offset-[3px] hover:no-underline";

function boardTitle(board: Board) {
  return board.title?.trim() || (arenaSlug(board.url) ?? "Are.na board").replace(/-/g, " ");
}

function anchorId(board: Board) {
  return `board-${arenaSlug(board.url) ?? board._id}`;
}

function hostname(href: string) {
  try {
    return new URL(href).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function Block({ block }: { block: ArenaBlock }) {
  const caption = block.title || hostname(block.href);

  if (block.kind === "image" && block.image) {
    return (
      <figure className="mb-[10px] break-inside-avoid">
        {/* Images open full screen; data-zoom-* is read by <Lightbox>. */}
        <button
          type="button"
          className="block w-full cursor-zoom-in"
          aria-label={`Enlarge image${block.title ? `: ${block.title}` : ""}`}
          data-zoom-src={block.largeImage ?? block.image}
          data-zoom-alt={block.title}
          data-zoom-caption={block.title}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.image} alt={block.title} loading="lazy" className="block h-auto w-full bg-foreground/5" />
        </button>
      </figure>
    );
  }

  if (block.kind === "text" && block.text) {
    return (
      <a
        href={block.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mb-[10px] block break-inside-avoid bg-foreground/5 p-[14px] transition-colors hover:bg-foreground/10"
      >
        {block.title && <p className="mb-[6px] italic text-[13px] leading-[20px] text-foreground">{block.title}</p>}
        <p className={`${body} line-clamp-[12] whitespace-pre-line`}>{block.text}</p>
      </a>
    );
  }

  // Links, videos, PDFs and nested boards: open the source.
  return (
    <a
      href={block.href}
      target="_blank"
      rel="noopener noreferrer"
      className="group mb-[10px] block break-inside-avoid"
    >
      {block.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={block.image} alt={caption} loading="lazy" className="block h-auto w-full bg-foreground/5" />
      ) : (
        <span className="block bg-foreground/5 p-[14px] italic text-[13px] leading-[20px] text-foreground">
          {block.kind === "channel" ? "Board: " : ""}
          {caption}
        </span>
      )}
      {block.image && caption && (
        <span className="mt-[6px] block text-[11px] leading-[16px] text-foreground/50 group-hover:text-primary">
          {caption}
        </span>
      )}
    </a>
  );
}

export default async function InspirationPage() {
  const sanityBoards: Board[] = isSanityConfigured ? await client.fetch(inspirationBoardsQuery) : [];
  const boards = [...codeBoards, ...sanityBoards];
  const loaded = await Promise.all(boards.map((b) => getArenaBoard(b.url)));

  return (
    <SiteShell
      leftRatio={[3, 7]}
      bottomLeftClassName="overflow-y-auto"
      mobileAutoHeight
      bottomLeft={
        <div className="max-w-[560px] space-y-[16px]">
          <h1 className={heading}>Inspiration</h1>
          <p className={body}>Images, references and ideas I collect on Are.na.</p>
          {boards.length > 1 && (
            <ul className="space-y-[4px]">
              {boards.map((b) => (
                <li key={b._id} className="text-[13px] leading-[20px]">
                  <a href={`#${anchorId(b)}`} className={linkClass}>
                    {boardTitle(b)}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      }
      right={
        <div className="flex h-full animate-fade-in-fast flex-col gap-[48px] [scrollbar-width:none] md:overflow-y-auto [&::-webkit-scrollbar]:hidden">
          {boards.length === 0 && <p className="text-[12px] italic text-foreground/30">Nothing here yet.</p>}
          <Lightbox>
            {boards.map((board, i) => {
              const data = loaded[i];
              return (
                <section key={board._id} id={anchorId(board)} className="scroll-mt-[24px] space-y-[14px]">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-[16px] gap-y-[4px]">
                    <h2 className={heading}>{boardTitle(board)}</h2>
                    <a href={board.url} target="_blank" rel="noopener noreferrer" className={`${linkClass} text-[13px]`}>
                      View on Are.na
                    </a>
                  </div>
                  {board.note && <p className={body}>{board.note}</p>}
                  {data && data.blocks.length > 0 ? (
                    <div className="columns-2 gap-[10px] md:columns-3 xl:columns-4">
                      {data.blocks.map((block) => (
                        <Block key={block.id} block={block} />
                      ))}
                    </div>
                  ) : (
                    <p className={body}>
                      {data ? "This board is empty." : "This board couldn't be loaded right now."}{" "}
                      <a href={board.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
                        See it on Are.na
                      </a>
                    </p>
                  )}
                </section>
              );
            })}
          </Lightbox>
        </div>
      }
    />
  );
}
