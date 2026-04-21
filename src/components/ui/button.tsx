import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-medium transition-all duration-200 ease-in-out focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-2xl cursor-pointer",
  {
    variants: {
      variant: {
        default:
          "bg-sky-cornflower text-[#1C1530] shadow-warm hover:shadow-warm-md hover:brightness-[1.08]",
        destructive:
          "bg-destructive text-parchment shadow-warm hover:shadow-warm-md hover:brightness-[1.06]",
        outline:
          "border border-border bg-oatmeal/60 text-ink-plum shadow-warm hover:bg-oatmeal hover:shadow-warm-md",
        secondary:
          "bg-oatmeal text-ink-plum shadow-warm hover:bg-oatmeal-deep hover:shadow-warm-md",
        ghost:
          "text-ink-plum hover:bg-oatmeal/70 rounded-xl",
        link:
          "text-sky-cornflower underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm",
        sm:      "h-8 rounded-xl px-3 text-xs",
        lg:      "h-10 px-8 text-base",
        icon:    "h-9 w-9 rounded-xl",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
