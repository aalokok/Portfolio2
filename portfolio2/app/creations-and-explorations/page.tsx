import type { Metadata } from "next";
import { client, isSanityConfigured } from "@/sanity/lib/client";
import { allProjectsQuery, projectSeoQuery } from "@/sanity/lib/queries";
import { Lightbox } from "@/components/creations/lightbox";
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
import {
  DEFAULT_CATEGORY,
  categoryHref,
  isProjectCategory,
  projectCategory,
  projectOneLiner,
  type Project,
  type ProjectCategory,
} from "@/lib/projects";
import { getZine } from "@/lib/zines";

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
  if (!isSanityConfigured || !order) return { title: "Creations and Explorations — Aalok Sud" };

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
      ? zine.pages.slice(0, 6).map((url) => ({
          url,
          dimensions: { width: zine.pageWidth, height: zine.pageHeight },
        }))
      : (project.images ?? []),
  };
}

export default async function CreationsAndExplorationsPage({ searchParams }: PageProps) {
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
          rightRatio={[7, 3]}
          bottomLeftClassName="overflow-y-auto"
          bottomRightClassName="overflow-y-auto md:-mt-[42px]"
          hideRightOnMobile
          topRight={<ProjectPreviewImages />}
          bottomLeft={
            items.length > 0 ? (
              <ProjectList items={items} />
            ) : (
              <p className="text-[12px] text-foreground/30 italic">No projects in this category yet.</p>
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
      activeCategory={navCategory}
      leftRatio={[3, 7]}
      bottomLeftClassName="overflow-y-auto"
      mobileAutoHeight
      bottomLeft={
        <ProjectSummary
          item={toIndexItem(project)}
          backLink
          backHref={categoryHref(projectCategory(project))}
          backLabel={
            projectCategory(project) === "design" ? "All design projects" : "All creative technology"
          }
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
            <ProjectDescription
              title={project.title}
              description={project.description ?? null}
            />
            {zine ? (
              <div className="h-[110vw] flex-none md:h-[80vh]">
                <ZineFlipbook {...zine} title={project.title} />
              </div>
            ) : (
              <ProjectGallery
                images={project.images ?? []}
                title={project.title}
                columns={project.galleryColumns}
              />
            )}
          </Lightbox>
        </article>
      }
    />
  );
}
