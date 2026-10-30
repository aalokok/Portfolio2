import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { MediaFigure } from "./project-images";
import type { DescriptionBlock, DescriptionMedia } from "@/lib/projects";

type Props = {
  title: string;
  description: DescriptionBlock[] | null;
};

const text = "text-[13px] leading-[20px] text-foreground/80";

function components(title: string): PortableTextComponents {
  const media = ({ value }: { value: DescriptionMedia }) =>
    value?.url ? (
      <MediaFigure item={value} alt={value.alt ?? title} className="my-[14px]" />
    ) : null;

  return {
    block: {
      normal: ({ children }) => <p className={text}>{children}</p>,
      h2: ({ children }) => (
        <h3 className="mt-[14px] text-[15px] font-medium leading-[22px] text-foreground">{children}</h3>
      ),
      h3: ({ children }) => (
        <h4 className="mt-[10px] text-[13px] font-medium leading-[20px] text-foreground">{children}</h4>
      ),
      h4: ({ children }) => (
        <h5 className="mt-[8px] text-[11px] uppercase tracking-[0.08em] text-foreground/50">{children}</h5>
      ),
      blockquote: ({ children }) => (
        <blockquote className={`${text} border-l-2 border-primary pl-[12px] italic`}>{children}</blockquote>
      ),
    },
    list: {
      bullet: ({ children }) => <ul className={`${text} list-disc space-y-[4px] pl-[18px]`}>{children}</ul>,
      number: ({ children }) => <ol className={`${text} list-decimal space-y-[4px] pl-[18px]`}>{children}</ol>,
    },
    marks: {
      link: ({ children, value }) => (
        <a
          href={value?.href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline-offset-2 hover:underline"
        >
          {children}
        </a>
      ),
      code: ({ children }) => (
        <code className="bg-foreground/5 px-[4px] py-[1px] text-[12px]">{children}</code>
      ),
    },
    types: {
      image: media,
      file: media,
    },
  };
}

export function ProjectDescription({ title, description }: Props) {
  return description && description.length > 0 ? (
    <div className="flex flex-col gap-[10px]">
      <PortableText value={description} components={components(title)} />
    </div>
  ) : (
    <p className="text-[13px] leading-[20px] text-foreground/40 italic">
      No description yet.
    </p>
  );
}
