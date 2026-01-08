"use client"

import { useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, ThumbsUp, ThumbsDown, RefreshCw } from "lucide-react"
import type { YesNoAnalysis, TwoOptionAnalysis } from "@/lib/types"

export function InitialAnalysisScreen() {
  const {
    setCurrentStep,
    decisionType,
    initialAnalysis,
    decisionId,
    optionAName,
    optionBName,
    setFinalAnalysis,
    goBackToQuestions,
  } = useDecision()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGetFinalAnalysis = async () => {
    if (!decisionId) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/decisions/${decisionId}/final-analysis`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to generate final analysis")
      }

      const data = await response.json()
      setFinalAnalysis(data.analysis)
      setCurrentStep("final-analysis")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const isYesNo = decisionType === "YES_NO"
  const yesNoAnalysis = initialAnalysis as YesNoAnalysis | null
  const twoOptionAnalysis = initialAnalysis as TwoOptionAnalysis | null

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("clarifying-questions")} disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 4 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Initial Analysis</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-auto">
        <div className="max-w-4xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Here's what we found</h2>
            <p className="text-muted-foreground">Review the pros and cons based on your inputs</p>
          </div>

          {isYesNo && yesNoAnalysis ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ProConList type="pros" items={yesNoAnalysis.pros} title="Pros" />
              <ProConList type="cons" items={yesNoAnalysis.cons} title="Cons" />
            </div>
          ) : twoOptionAnalysis ? (
            <div className="space-y-8">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {twoOptionAnalysis.option_a?.name || optionAName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProConList type="pros" items={twoOptionAnalysis.option_a?.pros || []} title="Pros" compact />
                  <ProConList type="cons" items={twoOptionAnalysis.option_a?.cons || []} title="Cons" compact />
                </div>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {twoOptionAnalysis.option_b?.name || optionBName}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ProConList type="pros" items={twoOptionAnalysis.option_b?.pros || []} title="Pros" compact />
                  <ProConList type="cons" items={twoOptionAnalysis.option_b?.cons || []} title="Cons" compact />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No analysis available</div>
          )}

          {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button
              variant="outline"
              size="lg"
              onClick={goBackToQuestions}
              disabled={isLoading}
              className="gap-2 bg-transparent"
            >
              <RefreshCw className="h-4 w-4" />
              Add More Context
            </Button>
            {decisionType === "TWO_OPTION" && (
              <Button size="lg" disabled={isLoading} onClick={handleGetFinalAnalysis} className="px-12">
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating Comparison...
                  </>
                ) : (
                  "Get Side-by-Side Comparison"
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function ProConList({
  type,
  items,
  title,
  compact = false,
}: {
  type: "pros" | "cons"
  items: string[]
  title: string
  compact?: boolean
}) {
  const isPros = type === "pros"

  return (
    <div className={`${compact ? "" : "p-6 rounded-xl bg-card border border-border"}`}>
      <div className="flex items-center gap-2 mb-4">
        {isPros ? <ThumbsUp className="h-5 w-5 text-accent" /> : <ThumbsDown className="h-5 w-5 text-destructive" />}
        <h3 className={`font-semibold ${compact ? "text-base" : "text-lg"} text-foreground`}>{title}</h3>
      </div>
      <ul className="space-y-3">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <span
              className={`
              mt-1.5 h-2 w-2 rounded-full flex-shrink-0
              ${isPros ? "bg-accent" : "bg-destructive"}
            `}
            />
            <span className="text-muted-foreground text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
