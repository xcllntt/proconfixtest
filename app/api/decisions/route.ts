import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateClarifyingQuestions } from "@/lib/huggingface"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dilemma_text, decision_type, option_a_name, option_b_name } = body

    if (!dilemma_text || !decision_type) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (decision_type === "TWO_OPTION" && (!option_a_name || !option_b_name)) {
      return NextResponse.json({ error: "Two-option decisions require both option names" }, { status: 400 })
    }

    const supabase = await createClient()

    // Create the decision
    const { data: decision, error: decisionError } = await supabase
      .from("decisions")
      .insert({
        dilemma_text,
        decision_type,
        option_a_name: decision_type === "TWO_OPTION" ? option_a_name : null,
        option_b_name: decision_type === "TWO_OPTION" ? option_b_name : null,
      })
      .select()
      .single()

    if (decisionError) {
      console.error("Error creating decision:", decisionError)
      return NextResponse.json({ error: "Failed to create decision" }, { status: 500 })
    }

    // Generate clarifying questions using AI
    const questions = await generateClarifyingQuestions(dilemma_text, decision_type, option_a_name, option_b_name)

    // Store questions in database
    const questionsToInsert = questions.map((question, index) => ({
      decision_id: decision.id,
      question_text: question,
      question_order: index + 1,
    }))

    const { data: savedQuestions, error: questionsError } = await supabase
      .from("clarifying_questions")
      .insert(questionsToInsert)
      .select()

    if (questionsError) {
      console.error("Error saving questions:", questionsError)
      return NextResponse.json({ error: "Failed to save clarifying questions" }, { status: 500 })
    }

    return NextResponse.json({
      decision_id: decision.id,
      questions: savedQuestions,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
