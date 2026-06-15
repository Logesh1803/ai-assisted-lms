import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 select-none",
  {
    variants: {
      variant: {
        /* Gradient violet — primary CTA */
        default:
          "bg-gradient-brand text-white shadow-md hover:shadow-glow-sm hover:brightness-110 active:scale-[0.98]",
        /* AI gradient — cyan to violet, for AI features */
        ai:
          "bg-gradient-ai text-white shadow-md hover:shadow-ai hover:brightness-110 active:scale-[0.98]",
        /* Destructive warm gradient */
        destructive:
          "bg-gradient-warm text-white shadow-md hover:brightness-110 active:scale-[0.98]",
        /* Glass outline — secondary action */
        outline:
          "border border-[--border-strong] bg-transparent text-foreground hover:bg-[--secondary] hover:text-[--secondary-foreground] active:scale-[0.98]",
        /* Soft violet fill — secondary CTA */
        secondary:
          "bg-[--secondary] text-[--secondary-foreground] hover:bg-[--primary] hover:text-white shadow-sm active:scale-[0.98]",
        /* Ghost — minimal, low emphasis */
        ghost:
          "hover:bg-[--secondary] hover:text-[--secondary-foreground] active:scale-[0.98]",
        /* Link style */
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
        /* Success */
        success:
          "bg-gradient-cool text-white shadow-md hover:brightness-110 active:scale-[0.98]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm:      "h-8 px-3.5 text-xs rounded-md",
        lg:      "h-12 px-8 text-base rounded-xl",
        icon:    "h-10 w-10",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
