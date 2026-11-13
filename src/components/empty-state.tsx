import * as React from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** Big icon + one short sentence + one action. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-line bg-paper px-6 py-12 text-center",
        className,
      )}
    >
      <span className="inline-flex size-20 items-center justify-center rounded-full bg-sand text-leaf-dark">
        <Icon className="size-10" strokeWidth={1.75} />
      </span>
      <p className="max-w-xs font-display text-xl font-bold text-ink">{title}</p>
      {description ? <p className="max-w-xs text-base text-muted-text">{description}</p> : null}
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
