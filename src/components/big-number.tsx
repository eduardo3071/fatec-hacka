import { cn } from "@/lib/utils";

/** Big Domine number with a short label underneath. */
export function BigNumber({
  value,
  label,
  tone = "rust",
  className,
}: {
  value: string;
  label?: string;
  tone?: "rust" | "forest" | "cream";
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={cn(
          "big-number",
          tone === "rust" && "text-rust",
          tone === "forest" && "text-forest",
          tone === "cream" && "text-cream",
        )}
      >
        {value}
      </span>
      {label ? (
        <span
          className={cn(
            "text-base font-medium",
            tone === "cream" ? "text-cream/80" : "text-muted-text",
          )}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
