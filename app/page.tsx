"use client"

import { useDecision } from "@/lib/decision-context"
import { LandingScreen } from "@/components/screens/landing-screen"
import { TypeSelectionScreen } from "@/components/screens/type-selection-screen"
import { DilemmaInputScreen } from "@/components/screens/dilemma-input-screen"
import { ClarifyingQuestionsScreen } from "@/components/screens/clarifying-questions-screen"
import { InitialAnalysisScreen } from "@/components/screens/initial-analysis-screen"
import { FinalAnalysisScreen } from "@/components/screens/final-analysis-screen"

export default function Home() {
  const { currentStep } = useDecision()

  return (
    <main className="min-h-screen bg-background">
      {currentStep === "landing" && <LandingScreen />}
      {currentStep === "type-selection" && <TypeSelectionScreen />}
      {currentStep === "dilemma-input" && <DilemmaInputScreen />}
      {currentStep === "clarifying-questions" && <ClarifyingQuestionsScreen />}
      {currentStep === "initial-analysis" && <InitialAnalysisScreen />}
      {currentStep === "final-analysis" && <FinalAnalysisScreen />}
    </main>
  )
}
