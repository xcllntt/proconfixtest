"use client"

import { useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react"
import type { YesNoAnalysis, TwoOptionAnalysis } from "@/lib/types"
import { DecisionSignalCard } from "@/components/decision/decision-signal-card"
import { WeightedProConList, decisionSignalForProConPair } from "@/components/decision/weighted-procon-list"
import { answersMapToContextText } from "@/lib/decision-weighting"

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
    answers,
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
  const contextText = answersMapToContextText(answers)

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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WeightedProConList type="pros" items={yesNoAnalysis.pros} title="Pros" contextText={contextText} />
                <WeightedProConList type="cons" items={yesNoAnalysis.cons} title="Cons" contextText={contextText} />
              </div>

              <DecisionSignalCard
                signal={decisionSignalForProConPair({
                  proItems: yesNoAnalysis.pros,
                  conItems: yesNoAnalysis.cons,
                  contextText,
                })}
              />
            </div>
          ) : twoOptionAnalysis ? (
            <div className="space-y-8">
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {twoOptionAnalysis.option_a?.name || optionAName}
                </h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WeightedProConList
                      type="pros"
                      items={twoOptionAnalysis.option_a?.pros || []}
                      title="Pros"
                      compact
                      contextText={contextText}
                      deemphasize={(twoOptionAnalysis.option_a?.pros || []).length <= 2}
                    />
                    <WeightedProConList
                      type="cons"
                      items={twoOptionAnalysis.option_a?.cons || []}
                      title="Cons"
                      compact
                      contextText={contextText}
                      deemphasize={(twoOptionAnalysis.option_a?.cons || []).length <= 2}
                    />
                  </div>
                  <DecisionSignalCard
                    signal={decisionSignalForProConPair({
                      proItems: twoOptionAnalysis.option_a?.pros || [],
                      conItems: twoOptionAnalysis.option_a?.cons || [],
                      contextText,
                    })}
                  />
                </div>
              </div>
              <div className="p-6 rounded-xl bg-card border border-border">
                <h3 className="text-xl font-semibold text-foreground mb-4">
                  {twoOptionAnalysis.option_b?.name || optionBName}
                </h3>
                <div className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <WeightedProConList
                      type="pros"
                      items={twoOptionAnalysis.option_b?.pros || []}
                      title="Pros"
                      compact
                      contextText={contextText}
                      deemphasize={(twoOptionAnalysis.option_b?.pros || []).length <= 2}
                    />
                    <WeightedProConList
                      type="cons"
                      items={twoOptionAnalysis.option_b?.cons || []}
                      title="Cons"
                      compact
                      contextText={contextText}
                      deemphasize={(twoOptionAnalysis.option_b?.cons || []).length <= 2}
                    />
                  </div>
                  <DecisionSignalCard
                    signal={decisionSignalForProConPair({
                      proItems: twoOptionAnalysis.option_b?.pros || [],
                      conItems: twoOptionAnalysis.option_b?.cons || [],
                      contextText,
                    })}
                  />
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
