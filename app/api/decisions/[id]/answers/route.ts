import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()
    const { answers } = body

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "Answers must be an array" }, { status: 400 })
    }

    const supabase = await createClient()

    // Verify the decision exists
    const { data: decision, error: decisionError } = await supabase.from("decisions").select("id").eq("id", id).single()

    if (decisionError || !decision) {
      return NextResponse.json({ error: "Decision not found" }, { status: 404 })
    }

    // Delete existing answers for these questions first (in case of re-submission)
    const questionIds = answers.map((a) => a.question_id)
    await supabase.from("clarifying_answers").delete().in("question_id", questionIds)

    // Insert new answers
    const answersToInsert = answers.map((answer) => ({
      question_id: answer.question_id,
      answer_text: answer.answer_text,
    }))

    const { error: answersError } = await supabase.from("clarifying_answers").insert(answersToInsert)

    if (answersError) {
      console.error("Error saving answers:", answersError)
      return NextResponse.json({ error: "Failed to save answers" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
