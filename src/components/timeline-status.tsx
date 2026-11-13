import { Check, CircleDashed } from "lucide-react";

import { cn } from "@/lib/utils";

export interface TimelineStep {
  label: string;
  description?: string | undefined;
  state: "done" | "current" | "todo";
}

/** Vertical progress line: done = leaf check, current = amber ring, todo = sand dot. */
export function TimelineStatus({
  steps,
  className,
}: {
  steps: TimelineStep[];
  className?: string;
}) {
  return (
    <ol className={cn("flex flex-col", className)}>
      {steps.map((step, i) => (
        <li key={step.label} className="relative flex gap-4 pb-8 last:pb-0">
          {i < steps.length - 1 ? (
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-10 left-5 h-[calc(100%-1.75rem)] w-0.5 -translate-x-1/2 rounded-full",
                step.state === "done" ? "bg-leaf-dark" : "bg-line",
              )}
            />
          ) : null}
          <span
            className={cn(
              "relative z-10 inline-flex size-10 shrink-0 items-center justify-center rounded-full border-2",
              step.state === "done" && "border-leaf-dark bg-leaf-dark text-cream",
              step.state === "current" && "border-amber bg-amber text-forest",
              step.state === "todo" && "border-line bg-sand text-muted-text",
            )}
          >
            {step.state === "done" ? (
              <Check className="size-5" strokeWidth={3} />
            ) : step.state === "current" ? (
              <CircleDashed className="size-5" strokeWidth={2.5} />
            ) : (
              <span className="size-2 rounded-full bg-muted-text" />
            )}
          </span>
          <div className="pt-1">
            <p
              className={cn(
                "font-display text-lg font-bold",
                step.state === "todo" ? "text-muted-text" : "text-ink",
              )}
            >
              {step.label}
            </p>
            {step.description ? (
              <p className="text-base text-muted-text">{step.description}</p>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}
