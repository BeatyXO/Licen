import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-noir-700/40 bg-noir-200 px-2.5 py-0.5 text-xs font-bold text-noir-900",
        className,
      )}
      {...props}
    />
  );
}
