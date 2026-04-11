import { SiteShell } from "@/components/layout/site-shell";
import { ReachOutForm } from "@/components/reach-out-form";

const socials = [
  { label: "Email", href: "mailto:alksud@gmail.com", display: "alksud@gmail.com" },
  { label: "Instagram", href: "https://instagram.com/aalok.wh", display: "@aalok.wh" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/aalok-sud-0a35561a9/", display: "aaloksud" },
  { label: "GitHub", href: "https://github.com/aalokok", display: "aalokok" },
  {label: "Substack", href: "https://substack.com/@aaloksud?utm_campaign=profile&utm_medium=profile-page", display: "aaloksud" },
];

export default function ReachOutPage() {
  return (
    <SiteShell
      columnRatio={[1, 1]}
      leftRatio={[1, 1]}
      bottomLeft={
        <div className="flex flex-col gap-[24px]">
          
          <div className="flex flex-col gap-[14px]">
            {socials.map(({ label, href, display }) => (
              <div key={label} className="flex flex-col gap-[2px]">
                <p className="text-[11px] font-inter-sans italic tracking-[0.08em] text-foreground/40">{label}</p>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] leading-[20px] text-foreground/80 underline-offset-2 hover:text-primary hover:underline transition-colors"
                >
                  {display}
                </a>
              </div>
            ))}
          </div>
        </div>
      }
      right={<ReachOutForm />}
      topRightClassName="overflow-y-auto"
    />
  );
}
