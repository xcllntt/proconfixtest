import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { generateClarifyingQuestions } from "@/lib/huggingface"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { dilemma_text, decision_type, option_a_name, option_b_name } = body

    console.log("[v0] API POST /api/decisions - received body:", {
      dilemma_text,
      decision_type,
      option_a_name,
      option_b_name,
    })

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
      console.error("[v0] Error creating decision in Supabase:", decisionError)
      const msg = decisionError.message || "Unknown Supabase error"
      const hint =
        /fetch failed/i.test(msg) || /network/i.test(msg)
          ? "Supabase could not be reached. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, ensure you restarted the dev server after changing env, and check your network/DNS/proxy."
          : ""
      return NextResponse.json({ error: `Database error: ${msg}${hint ? `\n\n${hint}` : ""}` }, { status: 500 })
    }

    console.log("[v0] Decision created successfully:", decision.id)

    // Generate clarifying questions using AI
    const questions = await generateClarifyingQuestions(dilemma_text, decision_type, option_a_name, option_b_name)

    console.log("[v0] Generated questions:", questions)

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
      console.error("[v0] Error saving questions:", questionsError)
      const msg = questionsError.message || "Unknown Supabase error"
      const hint =
        /fetch failed/i.test(msg) || /network/i.test(msg)
          ? "Supabase could not be reached while saving questions. Verify `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`, ensure dev server restart, and check network/DNS/proxy."
          : ""
      return NextResponse.json({ error: `Database error: ${msg}${hint ? `\n\n${hint}` : ""}` }, { status: 500 })
    }

    console.log("[v0] Questions saved successfully")

    return NextResponse.json({
      decision_id: decision.id,
      questions: savedQuestions,
    })
  } catch (error) {
    console.error("[v0] API error:", error)
    const errorMessage = error instanceof Error ? error.message : "Internal server error"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
