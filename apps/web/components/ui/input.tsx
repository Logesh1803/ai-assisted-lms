import * as React from "react"
import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-[--border] bg-[--muted] px-3.5 py-2 text-sm",
        "text-foreground placeholder:text-muted-foreground",
        "shadow-sm transition-all duration-150",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        "focus-visible:outline-none focus-visible:border-[--primary] focus-visible:ring-[3px] focus-visible:ring-[--ring]/15",
        "hover:border-[--border-strong]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
)
Input.displayName = "Input"

export { Input }
