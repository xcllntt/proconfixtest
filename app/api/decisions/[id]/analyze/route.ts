import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateYesNoAnalysis, generateTwoOptionAnalysis } from "@/lib/huggingface"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Get the decision
    const { data: decision, error: decisionError } = await supabase.from("decisions").select("*").eq("id", id).single()

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 })
    }

    // Get questions and answers
    const { data: questions } = await supabase
      .from("clarifying_questions")
      .select(
        `
        id,
        question_text,
        clarifying_answers (
          answer_text
        )
      `,
      )
      .eq("decision_id", id)
      .order("question_order")

    const questionsAndAnswers =
      questions?.map((q) => ({
        question: q.question_text,
        answer: q.clarifying_answers?.[0]?.answer_text || "",
      })) || []

    // Generate analysis based on decision type
    let analysis
    if (decision.decision_type === "YES_NO") {
      analysis = await generateYesNoAnalysis(decision.dilemma_text, questionsAndAnswers)
    } else {
      analysis = await generateTwoOptionAnalysis(
        decision.dilemma_text,
        decision.option_a_name,
        decision.option_b_name,
        questionsAndAnswers,
      )
    }

    // Save analysis to database
    const { error: saveError } = await supabase.from("analysis_results").insert({
      decision_id: id,
      analysis_type: "INITIAL",
      result_json: analysis,
    })

    if (saveError) {
      console.error("Error saving analysis:", saveError)
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
