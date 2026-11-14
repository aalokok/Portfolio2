import type { ReactNode } from "react";

type Spec = { label: string; value: string };
type Collaborator = { name?: string | null; role?: string | null; link?: string | null };

type Props = {
  tags?: string[] | null;
  year?: number | null;
  link?: string | null;
  linkLabel?: string | null;
  liveLink?: string | null;
  moreLinks?: { _key: string; label?: string | null; url?: string | null }[] | null;
  collaborators?: Collaborator[] | null;
  specs?: Spec[] | null;
};

/** One row: a small grey label beside its value, with a hairline above (like the works table). */
function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[88px_minmax(0,1fr)] gap-x-[16px] border-t border-foreground/10 py-[8px] text-[13px] leading-[20px]">
      <dt className="lowercase text-foreground/45">{label}</dt>
      <dd className="min-w-0 text-foreground/80">{children}</dd>
    </div>
  );
}

const linkClass = "w-fit underline-offset-2 hover:underline";

/** A project's details under its name, as a quiet hairline table: tags, year, extras, people, links. */
export function ProjectSpecs({ tags, year, link, linkLabel, liveLink, moreLinks, collaborators, specs }: Props) {
  const people = (collaborators ?? []).filter((c) => c.name);
  const extra = (moreLinks ?? []).filter((l) => l.url && l.label);
  return (
    <dl className="border-b border-foreground/10">
      {tags && tags.length > 0 && <Row label="tags">{tags.join(", ").toLowerCase()}</Row>}
      {year && <Row label="year">{year}</Row>}

      {specs?.map(({ label, value }) => (
        <Row key={label} label={label}>
          {value}
        </Row>
      ))}

      {people.length > 0 && (
        <Row label="with">
          <span className="flex flex-col">
            {people.map((c, i) => (
              <span key={i} className="flex items-baseline gap-[6px]">
                {c.link ? (
                  <a href={c.link} target="_blank" rel="noopener noreferrer" className={linkClass}>
                    {c.name}
                  </a>
                ) : (
                  <span>{c.name}</span>
                )}
                {c.role && <span className="text-[11px] text-foreground/45">{c.role}</span>}
              </span>
            ))}
          </span>
        </Row>
      )}

      {(link || liveLink || extra.length > 0) && (
        <Row label="links">
          <span className="flex flex-wrap gap-x-[14px]">
            {liveLink && (
              <a href={liveLink} target="_blank" rel="noopener noreferrer" className={`${linkClass} text-primary`}>
                live
              </a>
            )}
            {link && (
              <a href={link} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {(linkLabel ?? "view project").toLowerCase()}
              </a>
            )}
            {extra.map((l) => (
              <a key={l._key} href={l.url!} target="_blank" rel="noopener noreferrer" className={linkClass}>
                {l.label!.toLowerCase()}
              </a>
            ))}
          </span>
        </Row>
      )}
    </dl>
  );
}
