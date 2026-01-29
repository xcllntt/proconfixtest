"use client"

import { useMemo, useState } from "react"
import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Loader2 } from "lucide-react"

export function ClarifyingQuestionsScreen() {
  const {
    setCurrentStep,
    questions,
    answers,
    setAnswer,
    decisionId,
    setInitialAnalysis,
    currentQuestionIndex,
    setCurrentQuestionIndex,
  } = useDecision()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSkipModalOpen, setIsSkipModalOpen] = useState(false)

  const totalQuestions = questions.length

  const currentQuestion = useMemo(
    () => (totalQuestions > 0 ? questions[Math.min(currentQuestionIndex, totalQuestions - 1)] : null),
    [questions, currentQuestionIndex, totalQuestions],
  )

  const currentAnswer = currentQuestion ? answers.get(currentQuestion.id) || "" : ""

  const progressFraction =
    totalQuestions > 0 ? Math.min(Math.max(currentQuestionIndex / totalQuestions, 0), 1) : 0

  const submitAnswersAndAnalyze = async () => {
    if (!decisionId) return

    setIsLoading(true)
    setError(null)

    try {
      const answersArray =
        questions
          .map((q) => ({
            question_id: q.id,
            answer_text: (answers.get(q.id) || "").trim(),
          }))
          .filter((a) => a.answer_text.length > 0) || []

      // Only send answers if we actually have any context
      if (answersArray.length > 0) {
        const response = await fetch(`/api/decisions/${decisionId}/answers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ answers: answersArray }),
        })

        if (!response.ok) {
          throw new Error("Failed to submit answers")
        }
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

  const handleNext = async () => {
    if (!currentQuestion) return

    // Ensure the latest input is saved
    setAnswer(currentQuestion.id, currentAnswer)

    const isLastQuestion = currentQuestionIndex >= totalQuestions - 1

    if (isLastQuestion) {
      await submitAnswersAndAnalyze()
    } else {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const handleSkipConfirmed = async () => {
    setIsSkipModalOpen(false)
    await submitAnswersAndAnalyze()
  }

  const handleTextareaChange = (value: string) => {
    if (!currentQuestion) return
    setAnswer(currentQuestion.id, value)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("clarifying-intro")} disabled={isLoading}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 3 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Clarifying Questions</h1>
        </div>
      </header>

      {/* Progress bar */}
      <div className="px-6 pt-4">
        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${Math.max(progressFraction, totalQuestions > 0 ? 1 / (totalQuestions + 1) : 0) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-auto">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Help us understand better</h2>
            <p className="text-muted-foreground">Answer these questions to get a more accurate analysis</p>
          </div>

          {currentQuestion && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor={currentQuestion.id} className="text-base">
                  {currentQuestion.question_text}
                </Label>
                <Textarea
                  id={currentQuestion.id}
                  placeholder="Your answer... (short answers are okay)"
                  value={currentAnswer}
                  onChange={(e) => handleTextareaChange(e.target.value)}
                  disabled={isLoading}
                  className="min-h-[140px] resize-none"
                />
                <p className="text-xs text-muted-foreground">Short answers are okay.</p>
              </div>

              {error && <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">{error}</div>}

              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button
                  size="lg"
                  disabled={isLoading}
                  onClick={handleNext}
                  className="px-10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Generating analysis...
                    </>
                  ) : currentQuestionIndex >= totalQuestions - 1 ? (
                    "See pros & cons"
                  ) : (
                    "Next question"
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  disabled={isLoading}
                  onClick={() => setIsSkipModalOpen(true)}
                  className="px-10 bg-transparent"
                >
                  Skip questions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {isSkipModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
            <h2 className="text-lg font-semibold text-foreground">Skip clarifying questions?</h2>
            <p className="text-sm text-muted-foreground">
              You’ll still see your pros and cons, but they may be less detailed because Procon won’t have enough
              context about your situation.
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <Button
                variant="outline"
                className="bg-transparent"
                onClick={() => setIsSkipModalOpen(false)}
                disabled={isLoading}
              >
                Go back and answer
              </Button>
              <Button onClick={handleSkipConfirmed} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Continuing...
                  </>
                ) : (
                  "Continue without answering"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
