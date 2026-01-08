-- Create the decisions table to store user decision sessions
CREATE TABLE IF NOT EXISTS decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_type TEXT NOT NULL CHECK (decision_type IN ('YES_NO', 'TWO_OPTION')),
  dilemma_text TEXT NOT NULL,
  option_a_name TEXT, -- Only used for TWO_OPTION type
  option_b_name TEXT, -- Only used for TWO_OPTION type
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clarifying_questions table
CREATE TABLE IF NOT EXISTS clarifying_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clarifying_answers table
CREATE TABLE IF NOT EXISTS clarifying_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES clarifying_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_results table to store generated pros/cons and final analysis
CREATE TABLE IF NOT EXISTS analysis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('INITIAL', 'FINAL')),
  result_json JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clarifying_questions_decision_id ON clarifying_questions(decision_id);
CREATE INDEX IF NOT EXISTS idx_clarifying_answers_question_id ON clarifying_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_decision_id ON analysis_results(decision_id);
