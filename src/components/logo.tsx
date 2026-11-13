import { cn } from "@/lib/utils";

/**
 * Colheita Certa brand mark: two overlapping circles — an amber sun and a green leaf.
 * variant "light" is for dark (forest) backgrounds, "dark" for light (cream/paper) ones.
 */
export function Logo({
  variant = "dark",
  showWord = true,
  size = 40,
  className,
}: {
  variant?: "light" | "dark";
  showWord?: boolean;
  size?: number;
  className?: string;
}) {
  const wordColor = variant === "light" ? "text-cream" : "text-forest";

  return (
    <span
      className={cn("inline-flex items-center gap-3", className)}
      style={{ fontSize: size * 0.5 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        role="img"
        aria-label="Marca Colheita Certa"
      >
        <circle cx="25" cy="26" r="18" fill="var(--color-amber)" />
        <circle cx="40" cy="38" r="18" fill="var(--color-leaf)" fillOpacity="0.88" />
        <path
          d="M40 24 C 34 32, 34 44, 40 52"
          stroke="var(--color-forest)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      </svg>
      {showWord ? (
        <span className={cn("font-display font-bold leading-none", wordColor)}>
          Colheita Certa
        </span>
      ) : null}
    </span>
  );
}
