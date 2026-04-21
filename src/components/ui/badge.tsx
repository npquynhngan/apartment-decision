import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default:     "bg-oatmeal-deep text-ink-plum",
        destructive: "bg-destructive/12 text-destructive",
        success:     "bg-meadow-sage/20 text-sky-cornflower",
        gold:        "bg-calcifer-gold/30 text-ink-plum font-heading italic",
        teal:        "bg-hatshop-teal/15 text-hatshop-teal",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
