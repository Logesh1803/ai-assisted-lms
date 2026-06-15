import * as React from "react"
import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-[--border] bg-[--muted] px-3.5 py-2.5 text-sm",
        "text-foreground placeholder:text-muted-foreground leading-relaxed",
        "shadow-sm transition-all duration-150 resize-y",
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
Textarea.displayName = "Textarea"

export { Textarea }
