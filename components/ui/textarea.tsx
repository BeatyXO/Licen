import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "min-h-28 w-full rounded-md border border-noir-700/40 bg-noir-100 px-3 py-2 text-sm text-noir-900 placeholder:text-noir-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-400",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
