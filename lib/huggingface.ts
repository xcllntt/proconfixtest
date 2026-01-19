const HF_MODEL = "mistralai/Mistral-7B-Instruct-v0.3"
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`

export async function generateClarifyingQuestions(
  dilemmaText: string,
  decisionType: string,
  optionAName?: string | null,
  optionBName?: string | null,
): Promise<string[]> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const contextInfo =
    decisionType === "TWO_OPTION"
      ? `The person is deciding between: "${optionAName}" and "${optionBName}".`
      : "The person needs to decide on a yes/no question."

  const prompt = `You are a thoughtful decision-making coach. Your job is to ask clarifying questions that help someone think through their specific situation more deeply.

The person is facing this dilemma: ${dilemmaText}

${contextInfo}

Your questions should:
1. Reference specific aspects, challenges, or opportunities mentioned in their dilemma
2. Explore the deeper values and priorities that relate to THEIR specific situation
3. Identify key risks and consequences that are specific to THIS decision
4. Challenge assumptions they might be making about their particular dilemma
5. Consider perspectives and stakeholders relevant to their situation

First, determine how many clarifying questions are truly necessary to gather sufficient context (between 2-5 questions). Generate only that many questions - if 2-3 well-crafted questions are enough, don't force more. Generate clarifying questions tailored to their specific dilemma. Each question should be meaningful to their situation and help them understand what matters most to them.

Format as a numbered list with just the questions, no additional text.`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("[v0] HF API error:", error)
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    console.log("[v0] Generated text:", generatedText)

    // Try to match numbered questions with flexible formatting
    const questionMatches = generatedText.match(/\d+[\.\)]\s*(.+?)(?=\n\d+[\.\)]|\n\n|$)/gs)

    if (!questionMatches || questionMatches.length === 0) {
      console.warn("[v0] Could not parse questions from response. Trying fallback parsing...")
      // Fallback: split by newlines and filter for non-empty lines that look like questions
      const lines = generatedText.split("\n").filter((line) => line.trim().length > 0)
      const questions = lines
        .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((q) => q.length > 0 && q.includes("?"))

      if (questions.length > 0) {
        console.log("[v0] Parsed questions via fallback:", questions)
        return questions.slice(0, 5)
      }

      return ["Failed to generate clarifying questions. Please try again."]
    }

    const questions = questionMatches
      .map((match) => match.replace(/^\d+[\.\)]\s*/, "").trim())
      .filter((q) => q.length > 0)
      .slice(0, 5)

    console.log("[v0] Parsed questions:", questions)
    return questions.length > 0 ? questions : ["Failed to generate clarifying questions. Please try again."]
  } catch (error) {
    console.error("[v0] Error generating clarifying questions:", error)
    return ["Failed to generate clarifying questions. Please try again."]
  }
}

export async function generateInitialAnalysis(
  dilemmaText: string,
  decisionType: string,
  answers: Record<string, string>,
  optionAName?: string | null,
  optionBName?: string | null,
): Promise<{ pros: string[]; cons: string[] }> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const answersSummary = Object.entries(answers)
    .map(([, answer]) => `- ${answer}`)
    .join("\n")

  const prompt =
    decisionType === "TWO_OPTION"
      ? `Based on this situation:
Dilemma: ${dilemmaText}

Considering answers to clarifying questions:
${answersSummary}

Generate exactly 5 pros and 5 cons for choosing "${optionAName}".

Format as:
PROS:
1. [pro]
2. [pro]
3. [pro]
4. [pro]
5. [pro]

CONS:
1. [con]
2. [con]
3. [con]
4. [con]
5. [con]`
      : `Based on this yes/no decision:
Dilemma: ${dilemmaText}

Considering answers to clarifying questions:
${answersSummary}

Generate exactly 5 pros and 5 cons for saying YES to this decision.

Format as:
PROS:
1. [pro]
2. [pro]
3. [pro]
4. [pro]
5. [pro]

CONS:
1. [con]
2. [con]
3. [con]
4. [con]
5. [con]`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        prompt: prompt,
        max_new_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    // Parse pros and cons
    const prosMatch = generatedText.match(/PROS:([\s\S]*?)(?=CONS:|$)/i)
    const consMatch = generatedText.match(/CONS:([\s\S]*?)$/i)

    const extractItems = (text: string | undefined): string[] => {
      if (!text) return []
      return text
        .split("\n")
        .filter((line) => /^\d+[\.\)]\s*/.test(line.trim()))
        .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
        .filter((item) => item.length > 0)
    }

    const pros = extractItems(prosMatch?.[1])
    const cons = extractItems(consMatch?.[1])

    return {
      pros: pros.length > 0 ? pros : generateDefaultPros(decisionType),
      cons: cons.length > 0 ? cons : generateDefaultCons(decisionType),
    }
  } catch (error) {
    console.error("[v0] Error generating analysis:", error)
    return {
      pros: generateDefaultPros(decisionType),
      cons: generateDefaultCons(decisionType),
    }
  }
}

export async function generateFinalAnalysis(
  dilemmaText: string,
  decisionType: string,
  answers: Record<string, string>,
  optionAName?: string | null,
  optionBName?: string | null,
): Promise<{
  summary: string
  recommendation: string
  nextSteps: string[]
}> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const answersSummary = Object.entries(answers)
    .map(([, answer]) => `- ${answer}`)
    .join("\n")

  const prompt =
    decisionType === "TWO_OPTION"
      ? `A person is deciding between two options:
Option A: ${optionAName}
Option B: ${optionBName}

Their dilemma: ${dilemmaText}

Their thoughts on the decision:
${answersSummary}

Provide:
1. A brief summary of the key considerations
2. Which option seems more aligned with their expressed values and concerns (but don't be prescriptive)
3. Three concrete next steps they could take

Format as:
SUMMARY: [summary]
RECOMMENDATION: [recommendation without being prescriptive]
NEXT_STEPS:
1. [step]
2. [step]
3. [step]`
      : `A person is facing a yes/no decision:
${dilemmaText}

Their thoughts on the decision:
${answersSummary}

Provide:
1. A brief summary of the key considerations
2. What factors seem to support or oppose this decision based on their answers
3. Three concrete next steps they could take

Format as:
SUMMARY: [summary]
RECOMMENDATION: [recommendation]
NEXT_STEPS:
1. [step]
2. [step]
3. [step]`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        prompt: prompt,
        max_new_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    // Parse response
    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATION:|$)/i)
    const recommendationMatch = generatedText.match(/RECOMMENDATION:\s*(.+?)(?=NEXT_STEPS:|$)/i)
    const nextStepsMatch = generatedText.match(/NEXT_STEPS:([\s\S]*?)$/i)

    const nextSteps = extractItems(nextStepsMatch?.[1])

    return {
      summary: summaryMatch?.[1]?.trim() || "Based on your input, here are the key considerations for your decision.",
      recommendation:
        recommendationMatch?.[1]?.trim() ||
        "Consider the factors that align most with your values and long-term goals.",
      nextSteps:
        nextSteps.length > 0
          ? nextSteps
          : [
              "Take time to reflect on your decision",
              "Consult with trusted advisors",
              "Gather any remaining information you need",
            ],
    }
  } catch (error) {
    console.error("[v0] Error generating final analysis:", error)
    return {
      summary: "Based on your input, here are the key considerations for your decision.",
      recommendation: "Consider the factors that align most with your values and long-term goals.",
      nextSteps: [
        "Take time to reflect on your decision",
        "Consult with trusted advisors",
        "Gather any remaining information you need",
      ],
    }
  }
}

export async function generateYesNoAnalysis(
  dilemmaText: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>,
): Promise<{ pros: string[]; cons: string[] }> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const answersSummary = questionsAndAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")

  const prompt = `A person is facing a yes/no decision and has provided the following context:

Decision: ${dilemmaText}

Their responses to clarifying questions:
${answersSummary}

Based on their situation and responses, generate exactly 5 pros and 5 cons for saying YES to this decision.

Format your response as:
PROS:
1. [pro]
2. [pro]
3. [pro]
4. [pro]
5. [pro]

CONS:
1. [con]
2. [con]
3. [con]
4. [con]
5. [con]`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        prompt: prompt,
        max_new_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    const prosMatch = generatedText.match(/PROS:([\s\S]*?)(?=CONS:|$)/i)
    const consMatch = generatedText.match(/CONS:([\s\S]*?)$/i)

    const pros = extractItems(prosMatch?.[1])
    const cons = extractItems(consMatch?.[1])

    return {
      pros: pros.length > 0 ? pros : generateDefaultPros("YES_NO"),
      cons: cons.length > 0 ? cons : generateDefaultCons("YES_NO"),
    }
  } catch (error) {
    console.error("[v0] Error generating yes/no analysis:", error)
    return {
      pros: generateDefaultPros("YES_NO"),
      cons: generateDefaultCons("YES_NO"),
    }
  }
}

export async function generateTwoOptionAnalysis(
  dilemmaText: string,
  optionAName: string,
  optionBName: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>,
): Promise<{
  optionA: { name: string; pros: string[]; cons: string[] }
  optionB: { name: string; pros: string[]; cons: string[] }
}> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const answersSummary = questionsAndAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")

  const prompt = `A person is deciding between two options and has provided the following context:

Situation: ${dilemmaText}
Option A: ${optionAName}
Option B: ${optionBName}

Their responses to clarifying questions:
${answersSummary}

Based on their situation and responses, generate exactly 5 pros and 5 cons for each option.

Format your response as:
OPTION_A_PROS:
1. [pro]
2. [pro]
3. [pro]
4. [pro]
5. [pro]

OPTION_A_CONS:
1. [con]
2. [con]
3. [con]
4. [con]
5. [con]

OPTION_B_PROS:
1. [pro]
2. [pro]
3. [pro]
4. [pro]
5. [pro]

OPTION_B_CONS:
1. [con]
2. [con]
3. [con]
4. [con]
5. [con]`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        prompt: prompt,
        max_new_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    const optionAProsMatch = generatedText.match(/OPTION_A_PROS:([\s\S]*?)(?=OPTION_A_CONS:|$)/i)
    const optionAConsMatch = generatedText.match(/OPTION_A_CONS:([\s\S]*?)(?=OPTION_B_PROS:|$)/i)
    const optionBProsMatch = generatedText.match(/OPTION_B_PROS:([\s\S]*?)(?=OPTION_B_CONS:|$)/i)
    const optionBConsMatch = generatedText.match(/OPTION_B_CONS:([\s\S]*?)$/i)

    const optionAPros = extractItems(optionAProsMatch?.[1])
    const optionACons = extractItems(optionAConsMatch?.[1])
    const optionBPros = extractItems(optionBProsMatch?.[1])
    const optionBCons = extractItems(optionBConsMatch?.[1])

    return {
      optionA: {
        name: optionAName,
        pros: optionAPros.length > 0 ? optionAPros : generateDefaultPros("TWO_OPTION"),
        cons: optionACons.length > 0 ? optionACons : generateDefaultCons("TWO_OPTION"),
      },
      optionB: {
        name: optionBName,
        pros: optionBPros.length > 0 ? optionBPros : generateDefaultPros("TWO_OPTION"),
        cons: optionBCons.length > 0 ? optionBCons : generateDefaultCons("TWO_OPTION"),
      },
    }
  } catch (error) {
    console.error("[v0] Error generating two-option analysis:", error)
    return {
      optionA: {
        name: optionAName,
        pros: generateDefaultPros("TWO_OPTION"),
        cons: generateDefaultCons("TWO_OPTION"),
      },
      optionB: {
        name: optionBName,
        pros: generateDefaultPros("TWO_OPTION"),
        cons: generateDefaultCons("TWO_OPTION"),
      },
    }
  }
}

export async function generateFinalComparison(
  dilemmaText: string,
  optionAName: string,
  optionBName: string,
  questionsAndAnswers: Array<{ question: string; answer: string }>,
): Promise<{
  summary: string
  recommendation: string
  comparison: string
  nextSteps: string[]
}> {
  if (!process.env.HUGGINGFACE_API_KEY) {
    throw new Error("HUGGINGFACE_API_KEY is not set")
  }

  const answersSummary = questionsAndAnswers.map((qa) => `Q: ${qa.question}\nA: ${qa.answer}`).join("\n\n")

  const prompt = `A person is deciding between two options and has shared their thoughts:

Situation: ${dilemmaText}
Option A: ${optionAName}
Option B: ${optionBName}

Their responses to clarifying questions:
${answersSummary}

Provide a thoughtful final analysis that:
1. Summarizes the key factors they've revealed as important
2. Highlights which option seems more aligned with their expressed values and priorities
3. Compares the options across key dimensions
4. Suggests 3 concrete next steps

Format as:
SUMMARY: [A 2-3 sentence summary of key factors]
RECOMMENDATION: [Which option seems more aligned and why, without being prescriptive]
COMPARISON: [A paragraph comparing the options across important dimensions]
NEXT_STEPS:
1. [step]
2. [step]
3. [step]`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        prompt: prompt,
        max_new_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    const generatedText = Array.isArray(data) 
      ? (data[0]?.generated_text || "").replace(prompt, "").trim()
      : (data?.generated_text || "").replace(prompt, "").trim()

    // Parse response
    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATION:|$)/i)
    const recommendationMatch = generatedText.match(/RECOMMENDATION:\s*(.+?)(?=COMPARISON:|$)/i)
    const comparisonMatch = generatedText.match(/COMPARISON:\s*(.+?)(?=NEXT_STEPS:|$)/i)
    const nextStepsMatch = generatedText.match(/NEXT_STEPS:([\s\S]*?)$/i)

    const nextSteps = extractItems(nextStepsMatch?.[1])

    return {
      summary: summaryMatch?.[1]?.trim() || "Based on your input, here are the key considerations for your decision.",
      recommendation:
        recommendationMatch?.[1]?.trim() ||
        "Consider the factors that align most with your values and long-term goals.",
      comparison:
        comparisonMatch?.[1]?.trim() ||
        "Both options have distinct advantages and disadvantages that merit careful consideration.",
      nextSteps:
        nextSteps.length > 0
          ? nextSteps
          : [
              "Take time to reflect on your decision",
              "Consult with trusted advisors",
              "Gather any remaining information you need",
            ],
    }
  } catch (error) {
    console.error("[v0] Error generating final comparison:", error)
    return {
      summary: "Based on your input, here are the key considerations for your decision.",
      recommendation: "Consider the factors that align most with your values and long-term goals.",
      comparison: "Both options have distinct advantages and disadvantages that merit careful consideration.",
      nextSteps: [
        "Take time to reflect on your decision",
        "Consult with trusted advisors",
        "Gather any remaining information you need",
      ],
    }
  }
}

function extractItems(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split("\n")
    .filter((line) => /^\d+[\.\)]\s*/.test(line.trim()))
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((item) => item.length > 0)
}

function generateDefaultPros(decisionType: string): string[] {
  if (decisionType === "TWO_OPTION") {
    return [
      "Aligns with personal goals and aspirations",
      "Offers long-term growth opportunities",
      "Reduces key risk factors",
      "Improves financial or career prospects",
      "Enhances work-life balance or personal fulfillment",
    ]
  }
  return [
    "Moves you toward your goals",
    "Addresses key concerns you have",
    "Offers potential long-term benefits",
    "Reduces important risks",
    "Aligns with your values",
  ]
}

function generateDefaultCons(decisionType: string): string[] {
  if (decisionType === "TWO_OPTION") {
    return [
      "Requires significant time investment",
      "May involve financial uncertainty",
      "Could create short-term challenges",
      "Involves stepping outside comfort zone",
      "May require difficult trade-offs",
    ]
  }
  return [
    "Requires significant commitment",
    "Involves some level of risk",
    "May create short-term difficulties",
    "Could have unexpected consequences",
    "Requires careful planning and preparation",
  ]
}
