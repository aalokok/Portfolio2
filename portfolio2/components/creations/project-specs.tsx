type Spec = { label: string; value: string };

type Props = {
  year?: number | null;
  tags?: string[] | null;
  link?: string | null;
  linkLabel?: string | null;
  specs?: Spec[] | null;
};

export function ProjectSpecs({ year, tags, link, linkLabel, specs }: Props) {
  return (
    <div className="flex flex-col gap-[16px]">
      {year && (
        <div className="flex flex-col gap-[2px]">
          <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/40">Year</p>
          <p className="text-[13px] leading-[20px] text-foreground/80">{year}</p>
        </div>
      )}

      {specs?.map(({ label, value }) => (
        <div key={label} className="flex flex-col gap-[2px]">
          <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/40">{label}</p>
          <p className="text-[13px] leading-[20px] text-foreground/80">{value}</p>
        </div>
      ))}

      {tags && tags.length > 0 && (
        <div className="flex flex-col gap-[6px]">
          <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/40">Tags</p>
          <div className="flex flex-wrap gap-[6px]">
            {tags.map((tag) => (
              <span
                key={tag}
                className="rounded-sm border border-foreground/15 px-[8px] py-[2px] text-[11px] text-foreground/70"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {link && (
        <a
          href={link}
          target="_blank"
          rel="noopener noreferrer"
          className="w-fit text-[12px] text-primary underline-offset-2 hover:underline"
        >
          {linkLabel ?? "View project"}
        </a>
      )}
    </div>
  );
}
