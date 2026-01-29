"use client"

import { useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"

export function ClarifyingIntroScreen() {
  const { setCurrentStep, decisionId, setInitialAnalysis } = useDecision()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSkipAndAnalyze = async () => {
    if (!decisionId) return

    setIsLoading(true)
    setError(null)

    try {
      const analysisResponse = await fetch(`/api/decisions/${decisionId}/analyze`, {
        method: "POST",
      })

      if (!analysisResponse.ok) {
        throw new Error("Failed to generate analysis")
      }

      const analysisData = await analysisResponse.json()
      setInitialAnalysis(analysisData.analysis)
      setCurrentStep("initial-analysis")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentStep("dilemma-input")}
          disabled={isLoading}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 3 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Help Procon understand your situation</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-auto">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="space-y-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              Help Procon understand your situation
            </h2>
            <p className="text-muted-foreground">
              We’d like to ask a few short questions to better understand your decision. Answering them helps Procon:
            </p>
            <ul className="text-muted-foreground text-left space-y-2 list-disc list-inside">
              <li>Look at your situation from different perspectives</li>
              <li>Generate more relevant and thoughtful pros and cons</li>
            </ul>
            <p className="text-muted-foreground">
              You can skip this step, but your results may be less detailed.
            </p>
          </div>

          {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            <Button
              size="lg"
              onClick={() => setCurrentStep("clarifying-questions")}
              disabled={isLoading}
              className="px-10"
            >
              Answer a few questions
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={handleSkipAndAnalyze}
              disabled={isLoading}
              className="px-10 bg-transparent"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating pros &amp; cons...
                </>
              ) : (
                "Skip and see pros & cons"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

