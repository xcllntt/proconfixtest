"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type {
  DecisionType,
  ClarifyingQuestion,
  YesNoAnalysis,
  TwoOptionAnalysis,
  FinalComparisonAnalysis,
  DecisionFlowState,
} from "./types"

interface DecisionContextType extends DecisionFlowState {
  setDecisionType: (type: DecisionType) => void
  setDilemmaText: (text: string) => void
  setOptionNames: (optionA: string, optionB: string) => void
  setDecisionId: (id: string) => void
  setQuestions: (questions: ClarifyingQuestion[]) => void
  setAnswer: (questionId: string, answer: string) => void
  setInitialAnalysis: (analysis: YesNoAnalysis | TwoOptionAnalysis) => void
  setFinalAnalysis: (analysis: FinalComparisonAnalysis) => void
  setCurrentStep: (step: DecisionFlowState["currentStep"]) => void
  resetFlow: () => void
  goBackToQuestions: () => void
}

const initialState: DecisionFlowState = {
  decisionId: null,
  decisionType: null,
  dilemmaText: "",
  optionAName: "",
  optionBName: "",
  questions: [],
  answers: new Map(),
  initialAnalysis: null,
  finalAnalysis: null,
  currentStep: "landing",
}

const DecisionContext = createContext<DecisionContextType | null>(null)

export function DecisionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DecisionFlowState>(initialState)

  const setDecisionType = useCallback((type: DecisionType) => {
    setState((prev) => ({ ...prev, decisionType: type }))
  }, [])

  const setDilemmaText = useCallback((text: string) => {
    setState((prev) => ({ ...prev, dilemmaText: text }))
  }, [])

  const setOptionNames = useCallback((optionA: string, optionB: string) => {
    setState((prev) => ({ ...prev, optionAName: optionA, optionBName: optionB }))
  }, [])

  const setDecisionId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, decisionId: id }))
  }, [])

  const setQuestions = useCallback((questions: ClarifyingQuestion[]) => {
    setState((prev) => ({ ...prev, questions }))
  }, [])

  const setAnswer = useCallback((questionId: string, answer: string) => {
    setState((prev) => {
      const newAnswers = new Map(prev.answers)
      newAnswers.set(questionId, answer)
      return { ...prev, answers: newAnswers }
    })
  }, [])

  const setInitialAnalysis = useCallback((analysis: YesNoAnalysis | TwoOptionAnalysis) => {
    setState((prev) => ({ ...prev, initialAnalysis: analysis }))
  }, [])

  const setFinalAnalysis = useCallback((analysis: FinalComparisonAnalysis) => {
    setState((prev) => ({ ...prev, finalAnalysis: analysis }))
  }, [])

  const setCurrentStep = useCallback((step: DecisionFlowState["currentStep"]) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const resetFlow = useCallback(() => {
    setState(initialState)
  }, [])

  const goBackToQuestions = useCallback(() => {
    // Keep context but go back to clarifying questions for more input
    setState((prev) => ({
      ...prev,
      currentStep: "clarifying-questions",
      initialAnalysis: null,
      finalAnalysis: null,
    }))
  }, [])

  return (
    <DecisionContext.Provider
      value={{
        ...state,
        setDecisionType,
        setDilemmaText,
        setOptionNames,
        setDecisionId,
        setQuestions,
        setAnswer,
        setInitialAnalysis,
        setFinalAnalysis,
        setCurrentStep,
        resetFlow,
        goBackToQuestions,
      }}
    >
      {children}
    </DecisionContext.Provider>
  )
}

export function useDecision() {
  const context = useContext(DecisionContext)
  if (!context) {
    throw new Error("useDecision must be used within a DecisionProvider")
  }
  return context
}
