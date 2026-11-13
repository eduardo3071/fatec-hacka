import { cn } from "@/lib/utils";

/** Organic leaf-shaped badge holding the product's drawn glyph. */
export function ProductGlyph({ glyph, className }: { glyph: string; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-16 shrink-0 items-center justify-center rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-sand text-4xl",
        className,
      )}
    >
      {glyph}
    </span>
  );
}
