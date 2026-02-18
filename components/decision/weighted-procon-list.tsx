import * as React from "react"
import { ThumbsDown, ThumbsUp } from "lucide-react"
import type { ProConType } from "@/lib/decision-weighting"
import { decisionSignalFromWeights, summarizeSection, weightItems } from "@/lib/decision-weighting"
import { cn } from "@/lib/utils"
import { ImpactBar } from "@/components/decision/impact-bar"

export function WeightedProConList({
  type,
  items,
  title,
  compact = false,
  contextText = "",
  showSummary = true,
  deemphasize = false,
}: {
  type: ProConType
  items: string[]
  title: string
  compact?: boolean
  contextText?: string
  showSummary?: boolean
  deemphasize?: boolean
}) {
  const isPros = type === "pros"

  const weighted = React.useMemo(() => {
    const w = weightItems({ type, items, contextText })

    // Help users spot what matters most quickly: bubble stronger signals up.
    if (items.length >= 4) {
      return [...w].sort((a, b) => (b.weight - a.weight) || (a.originalIndex - b.originalIndex))
    }
    return w
  }, [type, items, contextText])

  const weights = React.useMemo(() => weighted.map((w) => w.weight), [weighted])
  const summary = React.useMemo(() => summarizeSection({ type, weights }), [type, weights])

  return (
    <div className={cn(compact ? "" : "p-6 rounded-xl bg-card border border-border")}>
      <div className="flex items-center gap-2">
        {isPros ? <ThumbsUp className="h-5 w-5 text-accent" /> : <ThumbsDown className="h-5 w-5 text-destructive" />}
        <h3 className={cn("font-semibold text-foreground", compact ? "text-base" : "text-lg")}>{title}</h3>
      </div>

      {showSummary && (
        <div className={cn("mt-3 flex items-center justify-between gap-3", deemphasize && "opacity-80")}>
          <ImpactBar type={type} weight={summary.summaryWeight} ariaLabel={summary.label} variant="summary" />
          <span className="text-xs text-muted-foreground">{summary.label}</span>
        </div>
      )}

      <ul className={cn("mt-4 space-y-3", deemphasize && "opacity-90")}>
        {weighted.map((item) => {
          const highlight = item.weight >= 4
          const critical = type === "cons" && item.weight === 5

          return (
            <li
              key={`${item.originalIndex}-${item.text}`}
              className={cn(
                "rounded-lg p-3",
                highlight ? "bg-muted/30" : "bg-transparent",
                critical && "border border-destructive/40",
              )}
            >
              <div className="space-y-2">
                <div className={cn("text-sm", highlight ? "text-foreground" : "text-muted-foreground")}>{item.text}</div>
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <ImpactBar type={type} weight={item.weight} ariaLabel={item.label} />
                  <span className="text-xs text-muted-foreground">{item.label}</span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export function decisionSignalForProConPair(params: { proItems: string[]; conItems: string[]; contextText?: string }) {
  const proWeights = weightItems({ type: "pros", items: params.proItems, contextText: params.contextText }).map((w) => w.weight)
  const conWeights = weightItems({ type: "cons", items: params.conItems, contextText: params.contextText }).map((w) => w.weight)
  return decisionSignalFromWeights({ proWeights, conWeights })
}

