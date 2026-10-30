import { client, isSanityConfigured } from "@/sanity/lib/client";
import { allProjectsQuery } from "@/sanity/lib/queries";
import { SiteShell } from "@/components/layout/site-shell";
import { ProjectGallery } from "@/components/creations/project-images";
import { ProjectDescription } from "@/components/creations/project-description";
import {
  ProjectIndexProvider,
  ProjectList,
  ProjectPreviewImages,
  ProjectPreviewSummary,
  ProjectSummary,
  type ProjectIndexItem,
} from "@/components/creations/project-index";
import { ProjectSpecs } from "@/components/creations/project-specs";
import { ZineFlipbook } from "@/components/creations/zine-flipbook";
import { projectOneLiner, type Project } from "@/lib/projects";
import { getZine } from "@/lib/zines";

type PageProps = {
  searchParams: Promise<{ project?: string }>;
};

function toIndexItem(project: Project): ProjectIndexItem {
  const zine = getZine(project.slug?.current, project.title);
  return {
    order: project.order,
    title: project.title,
    year: project.year,
    oneLiner: projectOneLiner(project),
    tags: project.tags ?? [],
    previewImages: zine
      ? zine.pages.slice(0, 6).map((url) => ({
          url,
          dimensions: { width: zine.pageWidth, height: zine.pageHeight },
        }))
      : (project.images ?? []),
  };
}

export default async function CreationsAndExplorationsPage({ searchParams }: PageProps) {
  const { project: projectParam } = await searchParams;

  const projects: Project[] = isSanityConfigured ? await client.fetch(allProjectsQuery) : [];
  const project = projects.find((p) => p.order === Number(projectParam));
  const items = projects.map(toIndexItem);
  const projectNavItems = projects.length
    ? projects.map(({ order, title }) => ({ order, title }))
    : undefined;

  // Index: list on the left, hovered project previewed across the right two panes.
  if (!project) {
    return (
      <ProjectIndexProvider items={items}>
        <SiteShell
          projectNavItems={projectNavItems}
          columnRatio={[4, 6]}
          leftRatio={[3, 7]}
          rightRatio={[7, 3]}
          bottomLeftClassName="overflow-y-auto"
          bottomRightClassName="overflow-y-auto md:-mt-[42px]"
          hideRightOnMobile
          topRight={<ProjectPreviewImages />}
          bottomLeft={
            items.length > 0 ? (
              <ProjectList items={items} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">No projects found.</p>
            )
          }
          bottomRight={<ProjectPreviewSummary />}
        />
      </ProjectIndexProvider>
    );
  }

  // Project: the right column merges into one scrollable documentation pane.
  const zine = getZine(project.slug?.current, project.title);

  return (
    <SiteShell
      projectNavItems={projectNavItems}
      columnRatio={[4, 6]}
      leftRatio={[3, 7]}
      bottomLeftClassName="overflow-y-auto"
      mobileAutoHeight
      bottomLeft={<ProjectSummary item={toIndexItem(project)} backLink />}
      right={
        // Keyed so each project opens scrolled to the top.
        <article
          key={project._id}
          className="flex h-full animate-fade-in-fast flex-col gap-[32px] [scrollbar-width:none] md:overflow-y-auto [&::-webkit-scrollbar]:hidden"
        >
          <ProjectDescription
            title={project.title}
            description={project.description ?? null}
          />
          <ProjectSpecs
            link={project.link}
            linkLabel={project.linkLabel}
            liveLink={project.liveLink}
            collaborators={project.collaborators}
            specs={project.specs}
          />
          {zine ? (
            <div className="h-[110vw] flex-none md:h-[80vh]">
              <ZineFlipbook {...zine} title={project.title} />
            </div>
          ) : (
            <ProjectGallery images={project.images ?? []} title={project.title} />
          )}
        </article>
      }
    />
  );
}
