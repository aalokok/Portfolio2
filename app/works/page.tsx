import type { Metadata } from "next";
import { client, isSanityConfigured } from "@/sanity/lib/client";
import { allProjectsQuery, projectSeoQuery } from "@/sanity/lib/queries";
import { Lightbox } from "@/components/works/lightbox";
import { SiteShell } from "@/components/layout/site-shell";
import { ProjectDescription } from "@/components/works/project-description";
import {
  ProjectIndexProvider,
  ProjectList,
  ProjectPreview,
  ProjectSummary,
  type ProjectIndexItem,
} from "@/components/works/project-index";
import { ProjectSpecs } from "@/components/works/project-specs";
import { ZineFlipbook } from "@/components/works/zine-flipbook";
import {
  DEFAULT_CATEGORY,
  categoryHref,
  isProjectCategory,
  projectCategory,
  projectOneLiner,
  type Project,
  type ProjectCategory,
} from "@/lib/projects";
import { getZine, zinePreview } from "@/lib/zines";
import { LiveEmbed } from "@/components/works/live-embed";
import { getLiveEmbed } from "@/lib/live-embeds";

type PageProps = {
  searchParams: Promise<{ project?: string; category?: string }>;
};

type ProjectSeo = {
  title: string;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoImage?: string | null;
  fallbackImage?: string | null;
} | null;

/** Link previews (LinkedIn, Slack, iMessage) and Google results for each project. */
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { project: projectParam } = await searchParams;
  const order = Number(projectParam);
  if (!isSanityConfigured || !order) return { title: "Works — Aalok Sud" };

  const seo: ProjectSeo = await client.fetch(projectSeoQuery, { order });
  if (!seo) return {};
  const title = `${seo.seoTitle || seo.title} — Aalok Sud`;
  const description = seo.seoDescription || seo.summary || undefined;
  const image = seo.seoImage || seo.fallbackImage;
  const images = image
    ? [{ url: `${image}?w=1200&h=630&fit=crop&auto=format`, width: 1200, height: 630 }]
    : undefined;
  return {
    title,
    description,
    openGraph: { title, description, images, type: "article" },
    twitter: { card: images ? "summary_large_image" : "summary", title, description, images },
  };
}

function toIndexItem(project: Project): ProjectIndexItem {
  const zine = getZine(project.slug?.current, project.title);
  return {
    order: project.order,
    title: project.title,
    year: project.year,
    oneLiner: projectOneLiner(project),
    tags: project.tags ?? [],
    previewImages: zine
      ? zinePreview(zine).map((url) => ({
          url,
          dimensions: { width: zine.pageWidth, height: zine.pageHeight },
        }))
      : (project.images ?? []),
  };
}

export default async function WorksPage({ searchParams }: PageProps) {
  const { project: projectParam, category: categoryParam } = await searchParams;

  const projects: Project[] = isSanityConfigured ? await client.fetch(allProjectsQuery) : [];
  const project = projects.find((p) => p.order === Number(projectParam));

  const activeCategory: ProjectCategory = isProjectCategory(categoryParam) ? categoryParam : DEFAULT_CATEGORY;
  // On a project page the sub-nav highlights that project's own category.
  const navCategory = project ? projectCategory(project) : activeCategory;
  const inCategory = projects.filter((p) => projectCategory(p) === navCategory);
  const items = inCategory.map(toIndexItem);
  const projectNavItems = inCategory.map(({ order, title }) => ({ order, title }));

  // Index: list on the left, hovered project previewed across the right two panes.
  if (!project) {
    return (
      // Keyed so switching tabs previews that tab's first project.
      <ProjectIndexProvider key={activeCategory} items={items}>
        <SiteShell
          projectNavItems={projectNavItems}
          activeCategory={navCategory}
          leftRatio={[3, 7]}
          bottomLeftClassName="md:overflow-y-auto"
          hideRightOnMobile
          right={<ProjectPreview />}
          bottomLeft={
            items.length > 0 ? (
              <ProjectList items={items} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">No projects in this category yet.</p>
            )
          }
        />
      </ProjectIndexProvider>
    );
  }

  // Project: the right column merges into one scrollable documentation pane.
  const zine = getZine(project.slug?.current, project.title);
  const live = getLiveEmbed(project.slug?.current);
  const backLabel = "all projects";

  return (
    <SiteShell
      projectNavItems={projectNavItems}
      activeCategory={navCategory}
      leftRatio={[3, 7]}
      // On phones the pinned back link above already gives the info room, so it starts a little higher.
      bottomLeftClassName="-mt-[22px] md:mt-0 md:overflow-y-auto"
      mobileAutoHeight
      mobileBackLink={{ href: categoryHref(projectCategory(project)), label: backLabel, title: project.title }}
      bottomLeft={
        <ProjectSummary
          item={toIndexItem(project)}
          backLink
          backHref={categoryHref(projectCategory(project))}
          backLabel={backLabel}
        >
          <ProjectSpecs
            link={project.link}
            linkLabel={project.linkLabel}
            liveLink={project.liveLink}
            collaborators={project.collaborators}
            specs={project.specs}
          />
        </ProjectSummary>
      }
      right={
        // Keyed so each project opens scrolled to the top.
        <article
          key={project._id}
          className="flex h-full animate-fade-in-fast flex-col gap-[32px] [scrollbar-width:none] md:overflow-y-auto [&::-webkit-scrollbar]:hidden"
        >
          {/* Click any image in the story or gallery to view it full screen. */}
          <Lightbox>
            {live && <LiveEmbed {...live} />}
            <ProjectDescription
              title={project.title}
              description={project.description ?? null}
            />
            {/* The gallery isn't repeated here: it already shows in the works carousels. Zines keep their flipbook. */}
            {zine && (
              <div className="h-[110vw] flex-none md:h-[80vh]">
                <ZineFlipbook {...zine} title={project.title} />
              </div>
            )}
          </Lightbox>
        </article>
      }
    />
  );
}
