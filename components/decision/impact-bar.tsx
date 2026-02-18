import * as React from "react"
import type { ProConType, Weight } from "@/lib/decision-weighting"
import { cn } from "@/lib/utils"

function filledSegmentClasses(type: ProConType) {
  if (type === "pros") return "bg-accent"
  // Add a subtle stripe pattern so cons are distinguishable without relying on color alone.
  return cn(
    "bg-destructive",
    "bg-[linear-gradient(135deg,rgba(255,255,255,0.22)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.22)_50%,rgba(255,255,255,0.22)_75%,transparent_75%,transparent)]",
    "bg-[length:8px_8px]",
  )
}

export function ImpactBar({
  type,
  weight,
  ariaLabel,
  variant = "item",
}: {
  type: ProConType
  weight: Weight
  ariaLabel: string
  variant?: "item" | "summary"
}) {
  const segmentSize = variant === "summary" ? "h-2.5 w-5" : "h-2 w-4"
  const gap = variant === "summary" ? "gap-1.5" : "gap-1"

  return (
    <div className="flex items-center">
      <div className={cn("inline-flex", gap)} role="img" aria-label={ariaLabel}>
        {Array.from({ length: 5 }).map((_, i) => {
          const filled = i < weight
          return (
            <span
              key={i}
              className={cn(
                "rounded-sm border border-border/60",
                segmentSize,
                filled ? filledSegmentClasses(type) : "bg-muted/20",
              )}
            />
          )
        })}
      </div>
    </div>
  )
}

