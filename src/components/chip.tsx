import * as React from "react";

import { cn } from "@/lib/utils";

/** Selectable pill. Selected = forest fill; unselected = paper with line border. */
export function Chip({
  selected = false,
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={props.role === "tab" || props.role === "radio" ? undefined : selected}
      className={cn(
        "inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 px-5 text-base font-semibold transition-[background-color,color,transform] duration-150 active:translate-y-[1px] active:scale-[0.985] disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-forest bg-forest text-cream"
          : "border-line bg-paper text-ink hover:border-forest hover:text-forest",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
