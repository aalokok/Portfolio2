import { PortableText } from "@portabletext/react";
import type { PortableTextBlock } from "sanity";

type Props = {
  title: string;
  order: number;
  description: PortableTextBlock[] | null;
};

const components = {
  block: {
    normal: ({ children }: { children?: React.ReactNode }) => (
      <p className="text-[13px] leading-[20px] text-foreground/80">{children}</p>
    ),
  },
};

export function ProjectDescription({ title, order, description }: Props) {
  return (
    <div className="flex h-full flex-col gap-[16px]">
      <div className="flex flex-col gap-[4px]">
        <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/40">
          {String(order).padStart(2, "0")}
        </p>
        <h2 className="text-[16px] font-medium leading-[22px]">{title}</h2>
      </div>
      {description ? (
        <div className="flex flex-col gap-[10px]">
          <PortableText value={description} components={components} />
        </div>
      ) : (
        <p className="text-[13px] leading-[20px] text-foreground/40 italic">
          No description yet.
        </p>
      )}
    </div>
  );
}
