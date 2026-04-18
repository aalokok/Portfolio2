import type { ReactNode } from "react";

type Spec = { label: string; value: string };
type Collaborator = { name?: string | null; role?: string | null; link?: string | null };

type Props = {
  year?: number | null;
  tags?: string[] | null;
  link?: string | null;
  linkLabel?: string | null;
  liveLink?: string | null;
  collaborators?: Collaborator[] | null;
  specs?: Spec[] | null;
};

function SpecItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-[2px]">
      <p className="text-[11px] uppercase tracking-[0.08em] text-foreground/40">{label}</p>
      <div className="text-[13px] leading-[20px] text-foreground/80">{children}</div>
    </div>
  );
}

export function ProjectSpecs({ year, tags, link, linkLabel, liveLink, collaborators, specs }: Props) {
  return (
    <div className="grid grid-cols-2 gap-x-[24px] gap-y-[16px] content-start">
      {year && (
        <SpecItem label="Year">
          {year}
        </SpecItem>
      )}

      {specs?.map(({ label, value }) => (
        <SpecItem key={label} label={label}>
          {value}
        </SpecItem>
      ))}

      {collaborators && collaborators.length > 0 && (
        <SpecItem label="Collaborators">
          <div className="flex flex-col gap-[4px]">
            {collaborators.map((c, i) => (
              <div key={i} className="flex items-baseline gap-[6px]">
                {c.link ? (
                  <a
                    href={c.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline-offset-2 hover:underline"
                  >
                    {c.name}
                  </a>
                ) : (
                  <span>{c.name}</span>
                )}
                {c.role && (
                  <span className="text-[11px] text-foreground/40">{c.role}</span>
                )}
              </div>
            ))}
          </div>
        </SpecItem>
      )}

      {tags && tags.length > 0 && (
        <SpecItem label="Tags">
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
        </SpecItem>
      )}

      {(link || liveLink) && (
        <SpecItem label="Links">
          <div className="flex flex-col gap-[6px]">
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-foreground/60 underline-offset-2 hover:underline"
              >
                {linkLabel ?? "View project"}
              </a>
            )}
            {liveLink && (
              <a
                href={liveLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit text-primary underline-offset-2 hover:underline"
              >
                Live
              </a>
            )}
          </div>
        </SpecItem>
      )}
    </div>
  );
}
