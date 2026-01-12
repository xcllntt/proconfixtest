const HF_MODEL = "google/gemma-2-2b-it"
const HF_API_URL = `https://router.huggingface.co/v1/chat/completions`

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

Generate exactly 5 clarifying questions tailored to their specific dilemma. Each question should be meaningful to their situation and help them understand what matters most to them.

Format as a numbered list (1., 2., 3., 4., 5.) with just the questions, no additional text.`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("[v0] HF API error:", errorData)
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    console.log("[v0] HF response:", data)

    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

    // Extract questions from the numbered list
    const questionMatches = generatedText.match(/\d+\.\s*(.+?)(?=\n|$)/g)
    if (!questionMatches) {
      console.warn("[v0] Could not parse questions from response:", generatedText)
      return ["Failed to generate clarifying questions. Please try again."]
    }

    const questions = questionMatches
      .map((match) => match.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0)
      .slice(0, 5)

    return questions.length > 0 ? questions : ["Failed to generate clarifying questions. Please try again."]
  } catch (error) {
    console.error("[v0] Error generating clarifying questions:", error)
    return ["Failed to generate clarifying questions. Please try again."]
  }
}

// function generateDefaultQuestions(decisionType: string): string[] {
//   if (decisionType === "TWO_OPTION") {
//     return [
//       "What are the most important factors in making this decision?",
//       "How would each option affect your long-term goals?",
//       "What could go wrong with each option, and how would you handle it?",
//       "Is there a third option you haven't considered?",
//       "How would you feel about each decision a year from now?",
//     ]
//   } else {
//     return [
//       "What would be the consequences of saying yes?",
//       "What would be the consequences of saying no?",
//       "What information do you still need to make this decision?",
//       "Are there any external factors that might change your answer?",
//       "How does this align with your personal values?",
//     ]
//   }
// }

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
... etc

CONS:
1. [con]
2. [con]
... etc`
      : `Based on this yes/no decision:
Dilemma: ${dilemmaText}

Considering answers to clarifying questions:
${answersSummary}

Generate exactly 5 pros and 5 cons for saying YES to this decision.

Format as:
PROS:
1. [pro]
2. [pro]
... etc

CONS:
1. [con]
2. [con]
... etc`

  try {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: HF_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

    // Parse pros and cons
    const prosMatch = generatedText.match(/PROS:([\s\S]*?)(?=CONS:|$)/i)
    const consMatch = generatedText.match(/CONS:([\s\S]*?)$/i)

    const extractItems = (text: string | undefined): string[] => {
      if (!text) return []
      return text
        .split("\n")
        .filter((line) => /^\d+\.\s*/.test(line.trim()))
        .map((line) => line.replace(/^\d+\.\s*/, "").trim())
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

function generateDefaultPros(decisionType: string): string[] {
  if (decisionType === "TWO_OPTION") {
    return [
      "Potential for growth and new experiences",
      "Aligns with long-term goals",
      "Could improve quality of life",
      "Opportunity to develop new skills",
      "May increase financial security",
    ]
  } else {
    return [
      "Opens up new possibilities",
      "Could lead to positive outcomes",
      "Aligns with your values",
      "Opportunity for growth",
      "May bring satisfaction",
    ]
  }
}

function generateDefaultCons(decisionType: string): string[] {
  if (decisionType === "TWO_OPTION") {
    return [
      "Uncertainty about outcomes",
      "Potential financial risks",
      "Could require significant adjustment",
      "May strain relationships",
      "Opportunity cost of not choosing the other option",
    ]
  } else {
    return [
      "Potential for unforeseen consequences",
      "May create uncertainty",
      "Could involve risk",
      "Might require significant commitment",
      "Possible negative outcomes",
    ]
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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

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

function extractItems(text: string | undefined): string[] {
  if (!text) return []
  return text
    .split("\n")
    .filter((line) => /^\d+\.\s*/.test(line.trim()))
    .map((line) => line.replace(/^\d+\.\s*/, "").trim())
    .filter((item) => item.length > 0)
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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 800,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1200,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

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
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`)
    }

    const data = await response.json()
    let generatedText = ""
    if (data.choices && data.choices[0]?.message?.content) {
      generatedText = data.choices[0].message.content
    }

    const summaryMatch = generatedText.match(/SUMMARY:\s*(.+?)(?=RECOMMENDATION:|$)/i)
    const recommendationMatch = generatedText.match(/RECOMMENDATION:\s*(.+?)(?=COMPARISON:|$)/i)
    const comparisonMatch = generatedText.match(/COMPARISON:\s*(.+?)(?=NEXT_STEPS:|$)/i)
    const nextStepsMatch = generatedText.match(/NEXT_STEPS:([\s\S]*?)$/i)

    const nextSteps = extractItems(nextStepsMatch?.[1])

    return {
      summary:
        summaryMatch?.[1]?.trim() ||
        "Based on your input, here are the key factors in your decision between these two options.",
      recommendation:
        recommendationMatch?.[1]?.trim() ||
        "Consider which option aligns more closely with your values and long-term goals.",
      comparison:
        comparisonMatch?.[1]?.trim() ||
        "Both options have distinct advantages and challenges. The right choice depends on which factors matter most to you.",
      nextSteps:
        nextSteps.length > 0
          ? nextSteps
          : [
              "List the top 3 factors that matter most to you in this decision",
              "Research or gather additional information on uncertain aspects",
              "Share your decision with a trusted advisor for perspective",
            ],
    }
  } catch (error) {
    console.error("[v0] Error generating final comparison:", error)
    return {
      summary: "Based on your input, here are the key factors in your decision between these two options.",
      recommendation: "Consider which option aligns more closely with your values and long-term goals.",
      comparison:
        "Both options have distinct advantages and challenges. The right choice depends on which factors matter most to you.",
      nextSteps: [
        "List the top 3 factors that matter most to you in this decision",
        "Research or gather additional information on uncertain aspects",
        "Share your decision with a trusted advisor for perspective",
      ],
    }
  }
}
