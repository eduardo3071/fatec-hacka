import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Pill buttons, at least 52px tall so they are easy to hit with one hand in the field.
 * Contrast rules: text on amber is always forest; destructive uses rust.
 */
const buttonVariants = cva(
  "inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,transform] duration-150 active:translate-y-[1px] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-leaf-dark text-cream hover:bg-leaf-dark/90",
        primary: "bg-leaf-dark text-cream hover:bg-leaf-dark/90",
        amber: "bg-amber text-forest hover:bg-amber/90",
        outline: "border-2 border-forest bg-transparent text-forest hover:bg-forest hover:text-cream",
        secondary: "bg-sand text-ink hover:bg-line",
        ghost: "bg-transparent text-forest hover:bg-sand",
        destructive: "bg-rust text-cream hover:bg-rust/90",
        link: "rounded-none text-leaf-dark underline underline-offset-4 hover:text-forest",
      },
      size: {
        default: "h-13 min-h-13 px-6 text-base [&_svg]:size-5",
        sm: "h-12 min-h-12 px-5 text-sm [&_svg]:size-4",
        lg: "h-14 min-h-14 px-8 text-lg [&_svg]:size-6",
        icon: "h-13 w-13 min-h-13 px-0 [&_svg]:size-6",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading = false, children, ...props }, ref) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={props.disabled || isLoading}
        {...props}
      >
        {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
        {children}
      </button>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
