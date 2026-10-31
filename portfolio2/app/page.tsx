import Link from "next/link";
import { LandingSwitch } from "@/components/landing-switch";
import { DEFAULT_CATEGORY, isProjectCategory, type ProjectCategory } from "@/lib/projects";
import { Blobs } from "@/components/blobs";
import { SiteShell } from "@/components/layout/site-shell";

type HomeProps = {
  searchParams: Promise<{ section?: string; view?: string }>;
};

const statementContent = (
  <div className="space-y-[12px]">
    <p className="text-[16px] font-areal italic">Statement</p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      My work focuses on what it means to create digital immersion. I am interested in how most systems translate gestures into simplified, readable inputs, often removing jargon and unneeded technical detail in the process. I use this as a starting point to explore how interaction can be simplified but still introduce awe and wonder. By using these abstractions, I want to demystify and democratize access to these experiences. At the same time make tech fun again.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      The work is developed through forms of computation like machine learning, game engines, wearable sensors, and procedural sound. These are used to track and process movement, but also to introduce variation, delay, and distortion. Visuals may degrade or shift, and sound is a priority in my works.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      My work spans across different formats, including interactive installations, audio-reactive systems, and game environments.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      My works, as all work should be, is ongoing and experimental.
    </p>
    <br />
    <p className="text-[12px] italic leading-[20px] text-foreground/50">
      Featured Work: Interactive Glow Orbs, inspired by the startup screen of PlayStation 2 — depicting the ever-changing nature of my practice as I find my voice as a computational artist. Created using GLSL and WebGL.
    </p>
  </div>
);

const biographyContent = (
  <div className="space-y-[12px]">
    <p className="text-[16px] font-areal italic">Biography</p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      Aalok Sud (b. 2002) is a Toronto-based designer, creative technologist and computation artist. Originally from Manali, India, his practice operates at the intersection of computer science, wearable technology, and interactive media.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      Since 2024, his work and research-creation projects have been featured in several Montreal-based institutions and festivals.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      He has served as the Outreach Officer for the Computation Arts Student Society (CASS), contributing to the development of the school&apos;s computation arts community. Outside of his primary practice, he has worked as a creative intern for hims &amp; hers, focusing on performance creatives. His technical experience includes a software development contract at the Innovation Lab at Concordia University, where he developed mobile interfaces and sensor-integrated modules for agricultural monitoring systems.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      He holds a BCompSci Joint Major in Computation Arts and Computer Science from Concordia University (Montreal, 2026) and a Professional Certificate in UX Design from Google. His work continues to explore the friction between biological motion and digital interfaces through the use of machine learning, spatial audio, and procedural environments.
    </p>
  </div>
);

const designServices = [
  { name: "UI/UX design", detail: "User flows, wireframes and prototypes in Figma (Google UX Design Certificate)." },
  { name: "Brand identity and design systems", detail: "A system I built for The Bhag Club helped it grow from 500 to 50k followers." },
  { name: "Web design and front-end", detail: "Responsive sites built in React and Next.js." },
  { name: "Marketing creative", detail: "Ads for Meta and Google, and email campaigns; my campaign at hims & hers raised customer acquisition by 5% in its first month." },
];

const techSkills = [
  { name: "Interactive installations and wearables", detail: "Sensors, Arduino and machine learning." },
  { name: "Real-time and audio-reactive visuals", detail: "TouchDesigner, GLSL, Three.js." },
  { name: "Sound and live performance", detail: "Max/MSP, live coding and VJ sets (JenniCam@30 at Milieux, Droplets Collective)." },
  { name: "Game and 3D environments", detail: "Unreal Engine, Blender." },
];

// Same type as the Statement and Biography pages: 16px italic headings, 13px body.
const linkClass = "text-primary underline underline-offset-[3px] hover:no-underline";

function SkillList({ items }: { items: { name: string; detail: string }[] }) {
  return (
    <ul className="space-y-[6px]">
      {items.map(({ name, detail }) => (
        <li key={name} className="text-[13px] leading-[20px] text-foreground/80">
          <span className="italic text-foreground">{name}</span> — {detail}
        </li>
      ))}
    </ul>
  );
}

function Cta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p className="text-[13px] leading-[20px]">
      <Link href={href} className={linkClass}>
        {children}
      </Link>
    </p>
  );
}

function LandingContent({ view }: { view: ProjectCategory }) {
  return (
    <div className="max-w-[560px] p-[8px]">
      <LandingSwitch
        initial={view}
        intro={
          <p className="text-[13px] leading-[20px] text-foreground/80">
            Designer and creative technologist in Toronto,{" "}
            <Link href="/contact-me" className={linkClass}>
              open to work
            </Link>
            . I design clear digital products and build interactive work that people remember.
          </p>
        }
        panels={{
          "creative-technology": (
            <section className="space-y-[10px]">
              <p className="text-[13px] leading-[20px] text-foreground/80">
                I build interactive installations, real-time visuals and sound, combining code, hardware and performance. My work has been exhibited at Ludodrome 2026 and Concordia&apos;s Artefacts exhibition.
              </p>
              <SkillList items={techSkills} />
              <Cta href="/creations-and-explorations?category=creative-technology">See creative technology work</Cta>
            </section>
          ),
          design: (
            <section className="space-y-[10px]">
              <p className="text-[13px] leading-[20px] text-foreground/80">
                I design interfaces, brands and systems that are easy to use and hold together at scale, from first sketch to working code.
              </p>
              <SkillList items={designServices} />
              <Cta href="/creations-and-explorations?category=design">See design case studies</Cta>
            </section>
          ),
        }}
      />
    </div>
  );
}

export default async function Home({ searchParams }: HomeProps) {
  const { section, view } = await searchParams;
  const landingView: ProjectCategory = isProjectCategory(view) ? view : DEFAULT_CATEGORY;

  const blobs = <Blobs className="h-full w-full" />;

  if (section === "experience") {
    return (
      <SiteShell
        leftRatio={[4, 6]}
        rightRatio={[5, 5]}
        bottomLeftClassName="overflow-y-auto"
        bottomRightClassName="overflow-y-auto"
        mobileSwapColumns
        topRight={blobs}
        bottomLeft={
          <div className="space-y-[24px]">
            {/* Work Experience */}
            <div className="space-y-[16px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40">Work Experience</p>

              <div className="space-y-[4px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <p className="text-[13px] font-semibold leading-[18px]">Innovation Lab — Concordia University</p>
                  <p className="shrink-0 text-[11px] text-foreground/40">Feb – May 2026</p>
                </div>
                <p className="text-[12px] italic text-foreground/60">Software Developer · Montreal</p>
                <ul className="mt-[6px] space-y-[3px]">
                  <li className="text-[12px] leading-[18px] text-foreground/70">Developed a PHP module extending FarmOS to interface with agricultural sensors.</li>
                  <li className="text-[12px] leading-[18px] text-foreground/70">Built and shipped a Flutter mobile app for managing FarmOS dashboards remotely.</li>
                </ul>
              </div>

              <div className="space-y-[4px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <p className="text-[13px] font-semibold leading-[18px]">hims &amp; hers</p>
                  <p className="shrink-0 text-[11px] text-foreground/40">Apr – Sep 2025</p>
                </div>
                <p className="text-[12px] italic text-foreground/60">Creative Intern · Montreal</p>
                <ul className="mt-[6px] space-y-[3px]">
                  <li className="text-[12px] leading-[18px] text-foreground/70">Set up an email marketing campaign; increased customer acquisition by 5% within a month.</li>
                  <li className="text-[12px] leading-[18px] text-foreground/70">Created performance marketing ad creatives for Meta and Google.</li>
                  <li className="text-[12px] leading-[18px] text-foreground/70">Worked on organic strategy and brand identity.</li>
                </ul>
              </div>

              <div className="space-y-[4px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <p className="text-[13px] font-semibold leading-[18px]">The Bhag Club</p>
                  <p className="shrink-0 text-[11px] text-foreground/40">2023 · Freelance</p>
                </div>
                <p className="text-[12px] italic text-foreground/60">Foundation Branding · New Delhi</p>
                <ul className="mt-[6px] space-y-[3px]">
                  <li className="text-[12px] leading-[18px] text-foreground/70">Created a foundational design system, branding, and logo.</li>
                  <li className="text-[12px] leading-[18px] text-foreground/70">Brand scaled from 500 to 50k Instagram followers using the design system.</li>
                </ul>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-[16px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40">Education</p>

              <div className="space-y-[4px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <p className="text-[13px] font-semibold leading-[18px]">Concordia University</p>
                  <p className="shrink-0 text-[11px] text-foreground/40">2022 – 2026</p>
                </div>
                <p className="text-[12px] leading-[18px] text-foreground/60">BCompSci Joint Major — Computation Arts &amp; Computer Science · Montreal</p>
              </div>

              <div className="space-y-[4px]">
                <div className="flex items-baseline justify-between gap-[8px]">
                  <p className="text-[13px] font-semibold leading-[18px]">Google · Coursera</p>
                  <p className="shrink-0 text-[11px] text-foreground/40">2023</p>
                </div>
                <p className="text-[12px] leading-[18px] text-foreground/60">Professional Certificate in UX Design</p>
              </div>
            </div>
          </div>
        }
        bottomRight={
          <div className="space-y-[24px]">
            {/* Tools */}
            <div className="space-y-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40">Tools</p>
              <div className="flex flex-wrap gap-[6px]">
                {["TouchDesigner", "Max/MSP", "Blender", "Unreal Engine", "Three.js / WebGL", "React / Next.js", "Python", "Java", "C", "Adobe Suite"].map((tool) => (
                  <span key={tool} className="rounded-sm border border-foreground/15 px-[8px] py-[3px] text-[11px] text-foreground/70">
                    {tool}
                  </span>
                ))}
              </div>
            </div>

            {/* Practices */}
            <div className="space-y-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40">Practices</p>
              <div className="flex flex-wrap gap-[6px]">
                {["Creative Coding", "Live Visuals", "Environment Art", "UI/UX Design", "ML / Agentic AI", "Web Development", "Branding & Identity", "Art Direction", "Typography", "Motion Graphics"].map((practice) => (
                  <span key={practice} className="rounded-sm border border-foreground/15 px-[8px] py-[3px] text-[11px] text-foreground/70">
                    {practice}
                  </span>
                ))}
              </div>
            </div>

            {/* Recognition */}
            <div className="space-y-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-foreground/40">Recognition</p>
              <div className="space-y-[8px]">
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Concordia International Tuition Entrance Scholarship</p>
                  <p className="text-[11px] text-foreground/50">Award · 2022</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Live Visual — Droplets Collective</p>
                  <p className="text-[11px] text-foreground/50">Performance · 2026</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Live Coding — JenniCam@30 at Milieux</p>
                  <p className="text-[11px] text-foreground/50">Performance · 2026</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Realtime Audio Metamorphosis — Ludodrome 2026 at Parquette</p>
                  <p className="text-[11px] text-foreground/50">Exhibition · 2026</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Realtime Audio Metamorphosis — Artefacts Exhibition at Concordia University</p>
                  <p className="text-[11px] text-foreground/50">Exhibition · 2026</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Cyberskin — Artefacts Exhibition at Concordia University</p>
                  <p className="text-[11px] text-foreground/50">Exhibition · 2026</p>
                </div>
                <div>
                  <p className="text-[12px] font-semibold leading-[18px]">Computation Arts Student Society</p>
                  <p className="text-[11px] text-foreground/50">Outreach Officer · 2023 – 2024</p>
                </div>
              </div>
            </div>
          </div>
        }
      />
    );
  }

  // Default (no section) and biography: blobs span full right column
  return (
    <SiteShell
      leftRatio={[4, 6]}
      bottomLeftClassName="overflow-y-auto"
      mobileSwapColumns
      right={blobs}
      bottomLeft={
        section === "statement"
          ? statementContent
          : section === "biography"
            ? biographyContent
            : <LandingContent view={landingView} />
      }
    />
  );
}
