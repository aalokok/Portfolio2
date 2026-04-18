import * as React from "react";
import { cn } from "@/lib/utils";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={cn(
        "text-[12px] leading-[16px] font-medium text-foreground/70 select-none",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
