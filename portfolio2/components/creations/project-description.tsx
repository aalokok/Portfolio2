import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { MediaFigure } from "./project-images";
import { toEmbed } from "@/lib/embeds";
import type {
  Aspect,
  DescriptionAudio,
  DescriptionBlock,
  DescriptionButtons,
  DescriptionCallout,
  DescriptionCode,
  DescriptionDivider,
  DescriptionEmbed,
  DescriptionImageRow,
  DescriptionMedia,
  DescriptionMediaText,
  DescriptionPullQuote,
  DescriptionStats,
  DescriptionTextColumns,
  SimpleText,
} from "@/lib/projects";

type Props = {
  title: string;
  description: DescriptionBlock[] | null;
};

const text = "text-[13px] leading-[20px] text-foreground/80";
const label = "text-[11px] uppercase tracking-[0.08em] text-foreground/50";
const caption = "text-[11px] leading-[16px] text-foreground/50";
// Full-width blocks start below any image floated left or right.
const block = "clear-both my-[18px]";

function isExternal(href: string) {
  return /^(https?:)?\/\//.test(href) || href.startsWith("mailto:") || href.startsWith("tel:");
}

// ---------- inline text ----------

const marks: PortableTextComponents["marks"] = {
  link: ({ children, value }) => {
    const href: string = value?.href ?? "#";
    return (
      <a
        href={href}
        {...(isExternal(href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className="text-primary underline-offset-2 hover:underline"
      >
        {children}
      </a>
    );
  },
  projectLink: ({ children, value }) =>
    value?.order ? (
      <Link
        href={`/creations-and-explorations?project=${value.order}`}
        className="text-primary underline-offset-2 hover:underline"
      >
        {children}
      </Link>
    ) : (
      <>{children}</>
    ),
  code: ({ children }) => <code className="bg-foreground/5 px-[4px] py-[1px] font-mono text-[12px]">{children}</code>,
  highlight: ({ children }) => <mark className="bg-accent px-[2px] text-foreground">{children}</mark>,
  underline: ({ children }) => <span className="underline underline-offset-2">{children}</span>,
  "strike-through": ({ children }) => <s>{children}</s>,
};

const lists: PortableTextComponents["list"] = {
  bullet: ({ children }) => <ul className={`${text} list-disc space-y-[4px] pl-[18px]`}>{children}</ul>,
  number: ({ children }) => <ol className={`${text} list-decimal space-y-[4px] pl-[18px]`}>{children}</ol>,
};

/** Text inside other blocks (Image + text, Columns, Callout). */
const simpleComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p className={text}>{children}</p>,
    h3: ({ children }) => <h4 className="text-[13px] font-medium leading-[20px] text-foreground">{children}</h4>,
    h4: ({ children }) => <h5 className={label}>{children}</h5>,
  },
  list: lists,
  marks,
};

function SimpleTextBlock({ value }: { value?: SimpleText | null }) {
  if (!value?.length) return null;
  return (
    <div className="space-y-[10px]">
      <PortableText value={value} components={simpleComponents} />
    </div>
  );
}

// ---------- layout blocks ----------

// Image positions. Left/right float beside the text on desktop; phones always show full width.
const position = {
  full: { className: "my-[18px]", fill: false, sizes: "(max-width: 768px) 100vw, 640px" },
  wide: { className: "clear-both my-[18px] w-full", fill: true, sizes: "(max-width: 768px) 100vw, 70vw" },
  left: {
    className: "my-[18px] md:float-left md:mb-[10px] md:mr-[24px] md:mt-[4px] md:w-[45%]",
    fill: true,
    sizes: "(max-width: 768px) 100vw, 360px",
  },
  right: {
    className: "my-[18px] md:float-right md:mb-[10px] md:ml-[24px] md:mt-[4px] md:w-[45%]",
    fill: true,
    sizes: "(max-width: 768px) 100vw, 360px",
  },
  center: {
    className: "clear-both mx-auto my-[18px] w-full md:w-[55%] md:items-center",
    fill: true,
    sizes: "(max-width: 768px) 100vw, 420px",
  },
} as const;

const gridCols: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

const embedAspect = {
  wide: "aspect-video w-full",
  landscape: "aspect-[4/3] w-full",
  square: "aspect-square w-full md:max-w-[520px]",
  portrait: "aspect-[3/4] w-full md:max-w-[440px]",
  phone: "aspect-[9/16] w-full max-w-[360px]",
} as const;

const calloutTone = {
  neutral: "bg-foreground/5",
  blue: "bg-tertiary-2",
  green: "bg-accent/50",
} as const;

// Column templates for Image + text, written for each side so the image keeps its chosen width.
const mediaTextCols = {
  left: { third: "md:grid-cols-[1fr_2fr]", half: "md:grid-cols-2", twoThirds: "md:grid-cols-[2fr_1fr]" },
  right: { third: "md:grid-cols-[2fr_1fr]", half: "md:grid-cols-2", twoThirds: "md:grid-cols-[1fr_2fr]" },
} as const;

function components(title: string): PortableTextComponents {
  const media = ({ value }: { value: DescriptionMedia }) => {
    if (!value?.url) return null;
    const pos = position[value.position ?? "full"] ?? position.full;
    return (
      <MediaFigure
        item={value}
        alt={value.alt ?? title}
        className={pos.className}
        fill={pos.fill}
        sizes={pos.sizes}
        videoControls={value.playback === "player"}
      />
    );
  };

  const imageRow = ({ value }: { value: DescriptionImageRow }) => {
    const images = (value?.images ?? []).filter((img) => img?.url);
    if (images.length === 0) return null;
    const cols = value.columns ?? Math.min(images.length, 4);
    // Older rows used a "crop" switch, which meant square.
    const aspect: Exclude<Aspect, "original"> | null =
      value.aspect && value.aspect !== "original" ? value.aspect : value.crop ? "square" : null;
    return (
      <figure className={`${block} flex flex-col gap-[8px]`}>
        <div className={`grid items-start gap-[10px] ${gridCols[cols] ?? gridCols[2]}`}>
          {images.map((img, i) => (
            <MediaFigure
              key={img._key ?? img.url}
              item={img}
              alt={img.alt ?? `${title} ${i + 1}`}
              fill
              aspect={aspect}
              sizes={`(max-width: 768px) 50vw, ${Math.round(70 / cols)}vw`}
            />
          ))}
        </div>
        {value.caption && <figcaption className={caption}>{value.caption}</figcaption>}
      </figure>
    );
  };

  const mediaText = ({ value }: { value: DescriptionMediaText }) => {
    const img = value?.image;
    const right = value?.imageSide === "right";
    const side = mediaTextCols[right ? "right" : "left"];
    const cols = side[value?.imageWidth ?? "half"] ?? side.half;
    return (
      <div className={`${block} grid grid-cols-1 items-center gap-[20px] ${cols}`}>
        <div className={right ? "md:order-2" : undefined}>
          {img?.url && (
            <MediaFigure item={img} alt={img.alt ?? title} fill sizes="(max-width: 768px) 100vw, 40vw" />
          )}
        </div>
        <SimpleTextBlock value={value?.text} />
      </div>
    );
  };

  const embed = ({ value }: { value: DescriptionEmbed }) => {
    const target = value?.url ? toEmbed(value.url) : null;
    if (!target) return null;
    const shape = embedAspect[value.aspect ?? "wide"] ?? embedAspect.wide;
    return (
      <figure className={`${block} flex flex-col gap-[8px]`}>
        <iframe
          src={target.src}
          title={value.caption || target.title}
          loading="lazy"
          allow="autoplay; fullscreen; picture-in-picture; encrypted-media; clipboard-write"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
          className={`border-0 bg-foreground/5 ${target.fixedHeight ? "w-full" : shape}`}
          style={target.fixedHeight ? { height: target.fixedHeight } : undefined}
        />
        {value.caption && <figcaption className={caption}>{value.caption}</figcaption>}
      </figure>
    );
  };

  const audio = ({ value }: { value: DescriptionAudio }) =>
    value?.url ? (
      <figure className={`${block} flex flex-col gap-[8px]`}>
        {value.title && <p className="text-[13px] font-medium leading-[20px]">{value.title}</p>}
        <audio controls preload="metadata" src={value.url} className="w-full md:max-w-[520px]">
          <a href={value.url}>Download the audio</a>
        </audio>
        {value.caption && <figcaption className={caption}>{value.caption}</figcaption>}
      </figure>
    ) : null;

  const pullQuote = ({ value }: { value: DescriptionPullQuote }) =>
    value?.quote ? (
      <figure className={`${block} my-[28px] border-l-2 border-primary pl-[18px]`}>
        <blockquote className="text-[20px] font-medium leading-[28px] text-foreground md:text-[24px] md:leading-[32px]">
          “{value.quote}”
        </blockquote>
        {value.attribution && <figcaption className={`${label} mt-[10px]`}>{value.attribution}</figcaption>}
      </figure>
    ) : null;

  const textColumns = ({ value }: { value: DescriptionTextColumns }) => {
    const cols = value?.columns ?? [];
    if (!cols.length) return null;
    const md = cols.length >= 4 ? "md:grid-cols-4" : cols.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2";
    return (
      <div className={`${block} grid grid-cols-1 gap-[20px] ${md}`}>
        {cols.map((c) => (
          <div key={c._key} className="flex flex-col gap-[8px]">
            {c.heading && <h4 className={label}>{c.heading}</h4>}
            <SimpleTextBlock value={c.text} />
          </div>
        ))}
      </div>
    );
  };

  const callout = ({ value }: { value: DescriptionCallout }) => (
    <aside className={`${block} flex flex-col gap-[8px] p-[18px] ${calloutTone[value?.tone ?? "neutral"] ?? calloutTone.neutral}`}>
      {value?.label && <p className={label}>{value.label}</p>}
      <SimpleTextBlock value={value?.text} />
    </aside>
  );

  const stats = ({ value }: { value: DescriptionStats }) => {
    const items = (value?.items ?? []).filter((i) => i.value);
    if (!items.length) return null;
    return (
      <dl className={`${block} grid grid-cols-2 gap-[20px] md:grid-cols-4`}>
        {items.map((i) => (
          <div key={i._key} className="flex flex-col gap-[4px]">
            <dt className="order-2 text-[12px] leading-[16px] text-foreground/60">{i.label}</dt>
            <dd className="order-1 text-[32px] font-medium leading-[36px] text-primary">{i.value}</dd>
          </div>
        ))}
      </dl>
    );
  };

  const codeBlock = ({ value }: { value: DescriptionCode }) =>
    value?.code ? (
      <figure className={`${block} overflow-hidden bg-[#191919] text-[#f5f5f5]`}>
        <figcaption className="flex justify-between border-b border-white/10 px-[14px] py-[8px] text-[11px] uppercase tracking-[0.08em] text-white/50">
          <span>{value.filename ?? ""}</span>
          <span>{value.language ?? ""}</span>
        </figcaption>
        <pre className="overflow-x-auto p-[14px] font-mono text-[12px] leading-[18px]">
          <code>{value.code}</code>
        </pre>
      </figure>
    ) : null;

  const buttons = ({ value }: { value: DescriptionButtons }) => {
    const items = (value?.items ?? []).filter((b) => b.url && b.label);
    if (!items.length) return null;
    return (
      <div className={`${block} flex flex-wrap gap-[10px]`}>
        {items.map((b) => (
          <a
            key={b._key}
            href={b.url!}
            {...(isExternal(b.url!) ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="bg-primary px-[16px] py-[10px] text-[12px] uppercase tracking-[0.08em] text-accent transition-opacity hover:opacity-85"
          >
            {b.label}
          </a>
        ))}
      </div>
    );
  };

  const divider = ({ value }: { value: DescriptionDivider }) =>
    value?.kind === "small" ? (
      <div className="clear-both h-[16px]" aria-hidden />
    ) : value?.kind === "large" ? (
      <div className="clear-both h-[56px]" aria-hidden />
    ) : (
      <hr className="clear-both my-[24px] border-foreground/15" />
    );

  return {
    block: {
      normal: ({ children }) => <p className={text}>{children}</p>,
      lead: ({ children }) => (
        <p className="text-[17px] leading-[26px] text-foreground md:text-[19px] md:leading-[28px]">{children}</p>
      ),
      h2: ({ children }) => (
        <h3 className="mt-[24px] text-[15px] font-medium leading-[22px] text-foreground">{children}</h3>
      ),
      h3: ({ children }) => (
        <h4 className="mt-[14px] text-[13px] font-medium leading-[20px] text-foreground">{children}</h4>
      ),
      h4: ({ children }) => <h5 className={`mt-[10px] ${label}`}>{children}</h5>,
      blockquote: ({ children }) => (
        <blockquote className={`${text} border-l-2 border-primary pl-[12px] italic`}>{children}</blockquote>
      ),
      right: ({ children }) => <p className={`${text} text-right`}>{children}</p>,
      center: ({ children }) => <p className={`${text} text-center`}>{children}</p>,
    },
    list: lists,
    marks,
    types: {
      image: media,
      file: media,
      imageRow,
      mediaText,
      embed,
      audio,
      pullQuote,
      textColumns,
      callout,
      stats,
      codeBlock,
      buttons,
      divider,
    },
  };
}

export function ProjectDescription({ title, description }: Props) {
  return description && description.length > 0 ? (
    // Normal block flow (not flex) so text can wrap around left/right images.
    <div className="flow-root space-y-[10px]">
      <PortableText value={description} components={components(title)} />
    </div>
  ) : (
    <p className="text-[13px] leading-[20px] text-foreground/40 italic">
      No description yet.
    </p>
  );
}
