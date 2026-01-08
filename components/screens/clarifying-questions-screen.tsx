"use client"

import { useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

export function ClarifyingQuestionsScreen() {
  const { setCurrentStep, questions, answers, setAnswer, decisionId, setInitialAnalysis } = useDecision()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const allAnswered = questions.every((q) => {
    const answer = answers.get(q.id)
    return answer && answer.trim().length > 0
  })

  const handleSubmit = async () => {
    if (!allAnswered || !decisionId) return

    setIsLoading(true)
    setError(null)

    try {
      const answersArray = questions.map((q) => ({
        question_id: q.id,
        answer_text: answers.get(q.id) || "",
      }))

      const response = await fetch(`/api/decisions/${decisionId}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: answersArray }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit answers")
      }

      // Get initial analysis
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
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("dilemma-input")} disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 3 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Clarifying Questions</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-auto">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Help us understand better</h2>
            <p className="text-muted-foreground">Answer these questions to get a more accurate analysis</p>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-2">
                <Label htmlFor={question.id} className="text-base">
                  {index + 1}. {question.question_text}
                </Label>
                <Textarea
                  id={question.id}
                  placeholder="Your answer..."
                  value={answers.get(question.id) || ""}
                  onChange={(e) => setAnswer(question.id, e.target.value)}
                  disabled={isLoading}
                  className="min-h-[100px] resize-none"
                />
              </div>
            ))}

            {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" disabled={!allAnswered || isLoading} onClick={handleSubmit} className="px-12">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generating Analysis...
                </>
              ) : (
                "Get Analysis"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
