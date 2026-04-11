import { SiteShell } from "@/components/layout/site-shell";

export default function CreationsAndExplorationsPage() {
  return (
    <SiteShell
      topRight={
        <div className="space-y-[12px]">
          <h1 className="text-[30px] font-semibold leading-[36px] md:text-[36px] md:leading-[42px]">
            Creations and Explorations
          </h1>
          <p className="max-w-[520px] text-[14px] leading-[18px] text-foreground/80 md:text-[16px] md:leading-[24px]">
            This page is for featured work, prototypes, and creative experiments.
          </p>
        </div>
      }
      bottomLeft={
        <div className="grid h-full min-h-[180px] grid-cols-2 gap-[12px]">
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
          <div className="rounded-sm bg-foreground/10" />
        </div>
      }
      bottomRight={
        <div className="h-full rounded-md bg-foreground/10 p-[12px]">
          <div className="h-full rounded-sm bg-foreground/10" />
        </div>
      }
    />
  );
}
