"use client"

import { useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

export function DilemmaInputScreen() {
  const {
    setCurrentStep,
    decisionType,
    dilemmaText,
    setDilemmaText,
    optionAName,
    optionBName,
    setOptionNames,
    setDecisionId,
    setQuestions,
  } = useDecision()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isValid =
    decisionType === "YES_NO"
      ? dilemmaText.trim().length > 10
      : dilemmaText.trim().length > 10 && optionAName.trim() && optionBName.trim()

  const handleSubmit = async () => {
    if (!isValid) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dilemma_text: dilemmaText,
          decision_type: decisionType,
          option_a_name: decisionType === "TWO_OPTION" ? optionAName : null,
          option_b_name: decisionType === "TWO_OPTION" ? optionBName : null,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to create decision")
      }

      const data = await response.json()
      setDecisionId(data.decision_id)
      setQuestions(data.questions)
      // Start at the clarifying intro screen before showing questions
      setCurrentStep("clarifying-intro")
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
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("type-selection")} disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 2 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Describe Your Dilemma</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              {decisionType === "YES_NO"
                ? "What decision are you trying to make?"
                : "What two options are you choosing between?"}
            </h2>
            <p className="text-muted-foreground">Be as specific as possible for the best analysis</p>
          </div>

          <div className="space-y-6">
            {decisionType === "TWO_OPTION" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="optionA">Option A</Label>
                  <Input
                    id="optionA"
                    placeholder="e.g., Stay at current job"
                    value={optionAName}
                    onChange={(e) => setOptionNames(e.target.value, optionBName)}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="optionB">Option B</Label>
                  <Input
                    id="optionB"
                    placeholder="e.g., Accept new offer"
                    value={optionBName}
                    onChange={(e) => setOptionNames(optionAName, e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="dilemma">
                {decisionType === "YES_NO" ? "Describe your decision" : "Provide context about your situation"}
              </Label>
              <Textarea
                id="dilemma"
                placeholder={
                  decisionType === "YES_NO"
                    ? "e.g., Should I quit my job to start my own business? I have some savings but also a family to support..."
                    : "e.g., I'm trying to decide between these two options. Here's the situation and what matters to me..."
                }
                value={dilemmaText}
                onChange={(e) => setDilemmaText(e.target.value)}
                disabled={isLoading}
                className="min-h-[200px] resize-none"
              />
              <div className="text-xs text-muted-foreground text-right">{dilemmaText.length} characters</div>
            </div>

            {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" disabled={!isValid || isLoading} onClick={handleSubmit} className="px-12">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                "Continue"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
