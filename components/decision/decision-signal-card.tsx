import * as React from "react"
import { Minus, Scale, TrendingDown, TrendingUp } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DecisionSignal } from "@/lib/decision-weighting"

function iconFor(kind: DecisionSignal["kind"]) {
  switch (kind) {
    case "strongly_positive":
    case "leans_positive":
      return TrendingUp
    case "strongly_negative":
    case "leans_negative":
      return TrendingDown
    case "balanced":
      return Scale
    case "depends":
      return Minus
  }
}

function toneClasses(kind: DecisionSignal["kind"]) {
  if (kind === "strongly_positive" || kind === "leans_positive") {
    return "border-accent/40 bg-accent/10"
  }
  if (kind === "strongly_negative" || kind === "leans_negative") {
    return "border-destructive/40 bg-destructive/10"
  }
  return "border-border bg-card"
}

export function DecisionSignalCard({ signal, className }: { signal: DecisionSignal; className?: string }) {
  const Icon = iconFor(signal.kind)

  return (
    <section className={cn("rounded-xl border p-5", toneClasses(signal.kind), className)} aria-label="Decision signal">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-md border border-border/60 bg-background/40 p-2">
          <Icon className="h-5 w-5 text-foreground" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h4 className="text-base font-semibold text-foreground">{signal.title}</h4>
            <span className="text-xs text-muted-foreground">Decision signal (advisory)</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{signal.explanation}</p>
        </div>
      </div>
    </section>
  )
}

