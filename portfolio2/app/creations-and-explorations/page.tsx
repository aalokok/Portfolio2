import { client, isSanityConfigured } from "@/sanity/lib/client";
import { projectByOrderQuery, projectNavQuery } from "@/sanity/lib/queries";
import { SiteShell } from "@/components/layout/site-shell";
import { ProjectImages } from "@/components/creations/project-images";
import { ProjectDescription } from "@/components/creations/project-description";
import { ProjectSpecs } from "@/components/creations/project-specs";
import { ViewProvider } from "@/components/creations/view-context";

type PageProps = {
  searchParams: Promise<{ project?: string }>;
};

export default async function CreationsAndExplorationsPage({ searchParams }: PageProps) {
  const { project: projectParam } = await searchParams;
  const order = Math.min(10, Math.max(1, Number(projectParam ?? "1")));

  const [project, projectNavItems] = isSanityConfigured
    ? await Promise.all([
        client.fetch(projectByOrderQuery, { order }),
        client.fetch(projectNavQuery),
      ])
    : [null, undefined];

  return (
    <ViewProvider>
    <SiteShell
      projectNavItems={projectNavItems ?? undefined}
      columnRatio={[4, 6]}
      leftRatio={[3, 7]}
      rightRatio={[7, 3]}
      bottomLeftClassName="overflow-y-auto"
      bottomRightClassName="overflow-y-auto"
      mobileSwapColumns
      topRight={
        project ? (
          <ProjectImages images={project.images ?? []} title={project.title} />
        ) : (
          <div className="flex h-full items-center justify-center rounded-sm bg-foreground/5">
            <p className="text-[12px] text-foreground/30 italic">No project found.</p>
          </div>
        )
      }
      bottomLeft={
        project ? (
          <ProjectDescription
            title={project.title}
            order={project.order}
            description={project.description ?? null}
          />
        ) : (
          <div className="space-y-[8px]">
            <div className="h-[14px] w-[30%] rounded-sm bg-foreground/10" />
            <div className="h-[13px] w-full rounded-sm bg-foreground/10" />
            <div className="h-[13px] w-[80%] rounded-sm bg-foreground/10" />
          </div>
        )
      }
      bottomRight={
        project ? (
          <ProjectSpecs
            year={project.year}
            tags={project.tags}
            link={project.link}
            linkLabel={project.linkLabel}
            liveLink={project.liveLink}
            collaborators={project.collaborators}
            specs={project.specs}
          />
        ) : (
          <div className="space-y-[12px]">
            <div className="h-[11px] w-[40%] rounded-sm bg-foreground/10" />
            <div className="h-[13px] w-[60%] rounded-sm bg-foreground/10" />
          </div>
        )
      }
    />
    </ViewProvider>
  );
}
