import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold whitespace-nowrap",
  {
    variants: {
      variant: {
        default: "border-leaf-dark bg-leaf-dark text-cream",
        secondary: "border-line bg-sand text-ink",
        pending: "border-line bg-sand text-ink",
        accepted: "border-leaf-dark bg-leaf-dark text-cream",
        delivered: "border-forest bg-forest text-cream",
        paid: "border-amber bg-amber text-forest",
        rejected: "border-rust bg-rust text-cream",
        destructive: "border-rust bg-rust text-cream",
        outline: "border-line bg-transparent text-muted-text",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
