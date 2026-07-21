import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-label-md font-label-md transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-primary text-on-primary shadow-violet-sm hover:-translate-y-0.5 hover:shadow-violet-md active:translate-y-0",
        secondary:
          "bg-surface text-on-surface border border-outline-variant hover:bg-surface-container hover:border-primary",
        outline:
          "border border-primary text-primary bg-transparent hover:bg-primary/5",
        ghost:
          "text-on-surface-variant hover:text-on-surface hover:bg-surface-container",
        destructive:
          "bg-error text-on-error hover:bg-error/90 shadow-sm",
        success:
          "bg-success text-on-success hover:bg-success/90 shadow-sm",
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-8 px-2.5 text-xs rounded-lg",
        default: "h-9 px-md py-xs",
        lg: "h-10 px-lg py-sm text-sm",
        xl: "h-11 px-lg py-sm text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-8 w-8 rounded-lg",
        "icon-lg": "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, disabled, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <>
            <span className="material-symbols-outlined text-[18px] animate-spin">
              autorenew
            </span>
            {children}
          </>
        ) : (
          children
        )}
      </Comp>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
