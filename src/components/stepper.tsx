import * as React from "react";
import { Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/** Quantity stepper with big (48px+) targets and a small "hop" when the number changes. */
export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  className?: string;
}) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const key = `${value}-${step}`;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full border-2 border-line bg-paper p-1.5",
        className,
      )}
    >
      <button
        type="button"
        aria-label={label ? `Diminuir ${label}` : "Diminuir quantidade"}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-sand text-forest transition-transform duration-150 active:scale-90 hover:bg-line disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-5" strokeWidth={2.5} />
      </button>
      <span
        key={key}
        aria-live="polite"
        className="min-w-14 text-center font-display text-2xl font-bold tabular-nums text-ink"
      >
        <span className="inline-block animate-hop">{value}</span>
      </span>
      <button
        type="button"
        aria-label={label ? `Aumentar ${label}` : "Aumentar quantidade"}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        className="inline-flex h-12 w-12 cursor-pointer items-center justify-center rounded-full bg-leaf-dark text-cream transition-transform duration-150 active:scale-90 hover:bg-leaf-dark/90 disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-5" strokeWidth={2.5} />
      </button>
    </div>
  );
}
