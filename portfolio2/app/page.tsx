import { Blobs } from "@/components/blobs";
import { SiteShell } from "@/components/layout/site-shell";

type HomeProps = {
  searchParams: Promise<{ section?: string }>;
};

const statementContent = (
  <div className="space-y-[12px]">
    <p className="text-[16px] font-inter-sans italic">Statement</p>
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
    <p className="text-[16px] font-inter-sans italic">Biography</p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      Aalok Sud (b. 2002) is a Montreal-based creative technologist and computation artist. Originally from Manali, India, his practice operates at the intersection of computer science, wearable technology, and interactive media.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      Since 2024, his work and research-creation projects have been featured in several Montreal-based institutions and festivals.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      He has served as the Outreach Officer for the Computation Arts Student Society (CASS), contributing to the development of the school&apos;s computation arts community. Outside of his primary practice, he has worked as a creative intern for hims &amp; hers, focusing on performance creatives. His technical experience includes a software development contract at the Innovation Lab at Concordia University, where he developed mobile interfaces and sensor-integrated modules for agricultural monitoring systems.
    </p>
    <p className="text-[13px] leading-[20px] text-foreground/80">
      He is currently completing a BCompSci Joint Major in Computation Arts and Computer Science at Concordia University (Montreal, CAN), and holds a Professional Certificate in UX Design from Google. His work continues to explore the friction between biological motion and digital interfaces through the use of machine learning, spatial audio, and procedural environments.
    </p>
  </div>
);

export default async function Home({ searchParams }: HomeProps) {
  const { section } = await searchParams;

  const blobs = <Blobs className="h-full w-full" />;

  if (section === "experience") {
    return (
      <SiteShell
        columnRatio={[1, 1]}
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
      columnRatio={[1, 1]}
      leftRatio={[4, 6]}
      bottomLeftClassName="overflow-y-auto"
      mobileSwapColumns
      right={blobs}
      bottomLeft={section === "biography" ? biographyContent : statementContent}
    />
  );
}
