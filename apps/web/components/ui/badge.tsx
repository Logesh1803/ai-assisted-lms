import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "bg-[--primary] text-white shadow-sm hover:brightness-110",
        secondary:
          "bg-[--secondary] text-[--secondary-foreground] border border-[--border]",
        destructive:
          "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
        outline:
          "border border-[--border-strong] text-foreground bg-transparent",
        success:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
        ai:
          "bg-cyan-100 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/20 dark:text-cyan-300 dark:border-cyan-800",
        /* Pill badges with gradient border */
        "gradient":
          "bg-[--gradient-brand-soft] text-[--secondary-foreground] border border-[--border-strong]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
