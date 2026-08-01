import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-md border border-noir-700/40 bg-noir-100 px-3 py-2 text-sm text-noir-900 placeholder:text-noir-700/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-noir-400",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
