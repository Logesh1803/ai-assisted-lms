import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl bg-[--secondary] overflow-hidden relative", className)}
      {...props}
    >
      <div className="absolute inset-0 shimmer" />
    </div>
  )
}

export { Skeleton }
