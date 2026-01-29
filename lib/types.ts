// Decision types
export type DecisionType = "YES_NO" | "TWO_OPTION"
export type AnalysisType = "INITIAL" | "FINAL"

// Database types
export interface Decision {
  id: string
  decision_type: DecisionType
  dilemma_text: string
  option_a_name: string | null
  option_b_name: string | null
  created_at: string
  updated_at: string
}

export interface ClarifyingQuestion {
  id: string
  decision_id: string
  question_text: string
  question_order: number
  created_at: string
}

export interface ClarifyingAnswer {
  id: string
  question_id: string
  answer_text: string
  created_at: string
}

// Analysis result structures
export interface YesNoAnalysis {
  pros: string[]
  cons: string[]
}

export interface TwoOptionAnalysis {
  option_a: {
    name: string
    pros: string[]
    cons: string[]
  }
  option_b: {
    name: string
    pros: string[]
    cons: string[]
  }
}

export interface FinalComparisonAnalysis {
  option_a_name: string
  option_b_name: string
  dimensions: {
    name: string
    option_a_assessment: string
    option_b_assessment: string
  }[]
}

export interface AnalysisResult {
  id: string
  decision_id: string
  analysis_type: AnalysisType
  result_json: YesNoAnalysis | TwoOptionAnalysis | FinalComparisonAnalysis
  created_at: string
}

// API request/response types
export interface CreateDecisionRequest {
  dilemma_text: string
  decision_type: DecisionType
  option_a_name?: string
  option_b_name?: string
}

export interface CreateDecisionResponse {
  decision_id: string
}

export interface ClarifyingQuestionsResponse {
  questions: ClarifyingQuestion[]
}

export interface SubmitAnswersRequest {
  answers: {
    question_id: string
    answer_text: string
  }[]
}

export interface AnalyzeResponse {
  analysis: YesNoAnalysis | TwoOptionAnalysis
}

export interface FinalAnalysisResponse {
  analysis: FinalComparisonAnalysis
}

// Decision flow state
export interface DecisionFlowState {
  decisionId: string | null
  decisionType: DecisionType | null
  dilemmaText: string
  optionAName: string
  optionBName: string
  questions: ClarifyingQuestion[]
  answers: Map<string, string>
  currentQuestionIndex: number
  initialAnalysis: YesNoAnalysis | TwoOptionAnalysis | null
  finalAnalysis: FinalComparisonAnalysis | null
  currentStep:
    | "landing"
    | "type-selection"
    | "dilemma-input"
    | "clarifying-intro"
    | "clarifying-questions"
    | "initial-analysis"
    | "final-analysis"
}
