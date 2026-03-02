export type ProConType = "pros" | "cons"
export type Weight = 1 | 2 | 3 | 4 | 5

export type ImpactLabel =
  | "Low impact"
  | "Moderate impact"
  | "High impact"
  | "Minor risk"
  | "Significant risk"
  | "Critical risk"

export interface WeightedItem {
  text: string
  weight: Weight
  label: ImpactLabel
  originalIndex: number
}

function clampWeight(value: number): Weight {
  if (value <= 1) return 1
  if (value >= 5) return 5
  return value as Weight
}

function normalize(text: string) {
  return text.trim().toLowerCase()
}

function includesAny(haystack: string, needles: string[]) {
  return needles.some((n) => haystack.includes(n))
}

function scoreFromWording(text: string, type: ProConType): number {
  const t = normalize(text)

  // Strong positive language for pros
  const extremeBoostersPros = [
    "life-changing",
    "game changer",
    "transformative",
    "revolutionary",
    "breakthrough",
    "massive",
    "huge",
    "enormous",
    "tremendous",
    "exceptional",
    "outstanding",
    "incredible",
  ]
  const strongBoostersPros = [
    "major",
    "significant",
    "substantial",
    "meaningful",
    "great",
    "excellent",
    "high impact",
    "strong benefit",
    "important",
    "valuable",
    "essential",
    "crucial",
  ]
  const mildReducersPros = ["minor", "small", "slight", "nice to have", "convenient", "somewhat", "a bit", "modest"]

  // Strong negative language for cons
  const extremeBoostersCons = [
    "deal-breaker",
    "dealbreaker",
    "catastrophic",
    "devastating",
    "ruinous",
    "unacceptable",
    "impossible",
    "unbearable",
    "intolerable",
    "unsustainable",
  ]
  const strongBoostersCons = [
    "critical",
    "severe",
    "serious",
    "unsafe",
    "danger",
    "harm",
    "toxic",
    "burnout",
    "illegal",
    "unaffordable",
    "very expensive",
    "major concern",
    "significant risk",
  ]
  const mildReducersCons = ["minor", "small", "slight", "manageable", "inconvenient", "somewhat", "a bit", "minor issue"]

  // Long-term vs short-term indicators
  const longTermIndicators = [
    "long-term",
    "long term",
    "years",
    "future",
    "career",
    "trajectory",
    "permanent",
    "lasting",
    "enduring",
    "lifetime",
    "forever",
    "decades",
  ]
  const shortTermIndicators = ["temporary", "short-term", "short term", "brief", "quick", "immediate", "now"]

  // Emotional impact indicators
  const highEmotionalImpact = [
    "anxious",
    "worried",
    "stressed",
    "overwhelmed",
    "excited",
    "thrilled",
    "passionate",
    "fulfilled",
    "miserable",
    "depressed",
    "happy",
    "joy",
    "fear",
    "dread",
    "love",
  ]

  const uncertaintyReducers = ["maybe", "might", "could", "unclear", "unknown", "depends", "possibly", "perhaps"]
  const certaintyBoosters = ["will", "always", "never", "definitely", "certainly", "guaranteed", "assured"]

  let delta = 0

  if (type === "pros") {
    if (includesAny(t, extremeBoostersPros)) delta += 2
    else if (includesAny(t, strongBoostersPros)) delta += 1.5
    if (includesAny(t, mildReducersPros)) delta -= 1.5
  } else {
    if (includesAny(t, extremeBoostersCons)) delta += 2.5
    else if (includesAny(t, strongBoostersCons)) delta += 2
    if (includesAny(t, mildReducersCons)) delta -= 1.5
  }

  // Long-term consequences boost weight
  if (includesAny(t, longTermIndicators)) delta += type === "pros" ? 0.5 : 0.75
  if (includesAny(t, shortTermIndicators)) delta -= 0.5

  // Emotional impact boosts weight
  if (includesAny(t, highEmotionalImpact)) delta += 0.75

  // Certainty vs uncertainty
  if (includesAny(t, certaintyBoosters)) delta += 0.75
  if (includesAny(t, uncertaintyReducers)) delta -= 1

  return delta
}

type TopicKey =
  | "money"
  | "time"
  | "flexibility"
  | "health"
  | "family"
  | "career"
  | "learning"
  | "location"
  | "stability"
  | "stress"

const TOPICS: Array<{ key: TopicKey; keywords: string[] }> = [
  { key: "money", keywords: ["salary", "pay", "compensation", "money", "income", "bonus", "cost", "expensive"] },
  { key: "time", keywords: ["time", "hours", "schedule", "commute", "deadline"] },
  { key: "flexibility", keywords: ["flexible", "flexibility", "remote", "hybrid", "autonomy"] },
  { key: "health", keywords: ["health", "sleep", "mental", "well-being", "wellbeing"] },
  { key: "family", keywords: ["family", "kids", "child", "partner", "spouse"] },
  { key: "career", keywords: ["career", "growth", "promotion", "title", "trajectory"] },
  { key: "learning", keywords: ["learn", "learning", "skills", "mentor", "mentorship", "experience"] },
  { key: "location", keywords: ["location", "move", "relocate", "city", "travel"] },
  { key: "stability", keywords: ["stability", "stable", "security", "secure", "layoff"] },
  { key: "stress", keywords: ["stress", "pressure", "burnout", "work-life", "work life", "balance"] },
]

function computeTopicBias(contextText: string, dilemmaText: string = "") {
  const ctx = normalize(contextText + " " + dilemmaText)
  const bias = new Map<TopicKey, { up: boolean; down: boolean; strength: number }>()

  // Strong priority indicators
  const strongPriorityPatterns = [
    /most important/i,
    /top priority/i,
    /really care/i,
    /care a lot/i,
    /matters most/i,
    /non[-\s]?negotiable/i,
    /must have/i,
    /essential/i,
    /critical for me/i,
    /deal breaker/i,
    /can't live without/i,
    /absolutely need/i,
  ]

  // Moderate priority indicators
  const moderatePriorityPatterns = [
    /important/i,
    /value/i,
    /matters/i,
    /care about/i,
    /priority/i,
    /significant/i,
  ]

  // Low priority indicators
  const lowPriorityPatterns = [
    /not important/i,
    /don't care/i,
    /doesn't matter/i,
    /no big deal/i,
    /not a priority/i,
    /don't mind/i,
    /less important/i,
  ]

  for (const topic of TOPICS) {
    const mentions = topic.keywords.some((k) => ctx.includes(k))
    if (!mentions) continue

    let strength = 0
    let up = false
    let down = false

    // Check for strong priority signals
    const strongMatch = strongPriorityPatterns.some((pattern) => pattern.test(ctx))
    const moderateMatch = moderatePriorityPatterns.some((pattern) => pattern.test(ctx))
    const lowMatch = lowPriorityPatterns.some((pattern) => pattern.test(ctx))

    if (strongMatch && topic.keywords.some((k) => ctx.includes(k))) {
      up = true
      strength = 2
    } else if (moderateMatch && topic.keywords.some((k) => ctx.includes(k))) {
      up = true
      strength = 1
    }

    if (lowMatch && topic.keywords.some((k) => ctx.includes(k))) {
      down = true
      strength = -1.5
    }

    bias.set(topic.key, { up, down, strength })
  }

  return bias
}

function scoreFromContext(itemText: string, contextText: string, dilemmaText: string = ""): number {
  const ctx = normalize(contextText)
  const dilemma = normalize(dilemmaText)
  if (!ctx && !dilemma) return 0

  const item = normalize(itemText)
  const topicBias = computeTopicBias(contextText, dilemmaText)

  let delta = 0

  // Check topic relevance
  for (const topic of TOPICS) {
    const matchesTopic = topic.keywords.some((k) => item.includes(k))
    if (!matchesTopic) continue

    const b = topicBias.get(topic.key)
    if (b) {
      delta += b.strength
    }
  }

  // Check if item directly addresses concerns mentioned in dilemma
  if (dilemma) {
    const dilemmaKeywords = dilemma.split(/\s+/).filter((w) => w.length > 4)
    const itemMatchesDilemma = dilemmaKeywords.some((kw) => item.includes(kw))
    if (itemMatchesDilemma) {
      delta += 0.5 // Items that directly address the dilemma get a boost
    }
  }

  // Check for emotional language in context that matches item
  const emotionalWords = ["worried", "anxious", "excited", "concerned", "happy", "stressed", "fear", "hope"]
  const contextHasEmotion = emotionalWords.some((w) => ctx.includes(w) || dilemma.includes(w))
  const itemHasEmotion = emotionalWords.some((w) => item.includes(w))
  if (contextHasEmotion && itemHasEmotion) {
    delta += 0.75 // Emotional alignment boosts weight
  }

  return delta
}

export function impactLabelFor(type: ProConType, weight: Weight): ImpactLabel {
  if (type === "pros") {
    if (weight <= 2) return "Low impact"
    if (weight === 3) return "Moderate impact"
    return "High impact"
  }

  if (weight <= 2) return "Minor risk"
  if (weight === 3) return "Significant risk"
  return "Critical risk"
}

export function estimateItemWeight(params: {
  type: ProConType
  itemText: string
  contextText?: string
  dilemmaText?: string
}): Weight {
  const { type, itemText, contextText = "", dilemmaText = "" } = params

  // Start with a neutral baseline, but allow strong differentiation
  // We'll use relative scoring to avoid defaults
  let score = 2.5 // Slightly below moderate to encourage differentiation

  const wordingScore = scoreFromWording(itemText, type)
  const contextScore = scoreFromContext(itemText, contextText, dilemmaText)

  score += wordingScore
  score += contextScore

  // Ensure we get strong differentiation - push extremes further
  if (score > 3.5) {
    // Boost high-scoring items
    score = Math.min(5, score + 0.3)
  } else if (score < 2.5) {
    // Reduce low-scoring items
    score = Math.max(1, score - 0.3)
  }

  return clampWeight(Math.round(score * 2) / 2) // Round to nearest 0.5, then clamp
}

export function weightItems(params: {
  type: ProConType
  items: string[]
  contextText?: string
  dilemmaText?: string
}): WeightedItem[] {
  const { type, items, contextText = "", dilemmaText = "" } = params
  const weighted = items.map((text, originalIndex) => {
    const weight = estimateItemWeight({ type, itemText: text, contextText, dilemmaText })
    return { text, weight, label: impactLabelFor(type, weight), originalIndex }
  })

  // Normalize weights to ensure strong differentiation
  // If all weights are too similar, spread them out
  const weights = weighted.map((w) => w.weight)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight

  // If range is too small (< 2), enhance differentiation
  if (range < 2 && items.length > 2) {
    return weighted.map((item) => {
      // Normalize to 1-5 scale with better spread
      const normalized = minWeight === maxWeight ? 3 : ((item.weight - minWeight) / range) * 3 + 1
      const enhancedWeight = clampWeight(Math.round(normalized))
      return { ...item, weight: enhancedWeight, label: impactLabelFor(type, enhancedWeight) }
    })
  }

  return weighted
}

export type SectionSummaryLabel =
  | "Overall impact: Weak"
  | "Overall impact: Moderate"
  | "Overall impact: Strong"
  | "Overall risk: Low"
  | "Overall risk: Manageable"
  | "Overall risk: Critical"

export function summarizeSection(params: { type: ProConType; weights: Weight[] }): {
  summaryWeight: Weight
  label: SectionSummaryLabel
} {
  const { type, weights } = params
  if (weights.length === 0) {
    return {
      summaryWeight: 3,
      label: type === "pros" ? "Overall impact: Moderate" : "Overall risk: Manageable",
    }
  }

  // Use weighted average with emphasis on extremes
  const avg = weights.reduce((a, b) => a + b, 0) / weights.length
  const max = Math.max(...weights)
  const min = Math.min(...weights)
  const hasExtreme = max === 5 || min === 1

  // If there's an extreme value, give it more weight
  let summaryWeight: number
  if (hasExtreme && weights.length <= 3) {
    // Small list with extreme: let extreme dominate
    summaryWeight = max === 5 ? (avg * 0.4 + max * 0.6) : (avg * 0.6 + min * 0.4)
  } else {
    // Larger list: balance average with max
    summaryWeight = (avg * 0.6 + max * 0.4)
  }

  summaryWeight = clampWeight(Math.round(summaryWeight))

  // Strong differentiation - avoid defaulting to moderate
  if (type === "pros") {
    if (summaryWeight <= 2.5) return { summaryWeight: summaryWeight as Weight, label: "Overall impact: Weak" }
    if (summaryWeight >= 4) return { summaryWeight: summaryWeight as Weight, label: "Overall impact: Strong" }
    return { summaryWeight: summaryWeight as Weight, label: "Overall impact: Moderate" }
  }

  if (summaryWeight <= 2.5) return { summaryWeight: summaryWeight as Weight, label: "Overall risk: Low" }
  if (summaryWeight >= 4) return { summaryWeight: summaryWeight as Weight, label: "Overall risk: Critical" }
  return { summaryWeight: summaryWeight as Weight, label: "Overall risk: Manageable" }
}

export type DecisionSignal =
  | {
      kind: "leans_positive" | "strongly_positive"
      title: "Leans positive" | "Strongly positive"
      explanation: string
    }
  | {
      kind: "balanced"
      title: "Balanced trade-off"
      explanation: string
    }
  | {
      kind: "leans_negative" | "strongly_negative"
      title: "Leans negative" | "Strongly negative"
      explanation: string
    }
  | {
      kind: "depends"
      title: "Highly dependent on priorities"
      explanation: string
    }

export function decisionSignalFromWeights(params: {
  proWeights: Weight[]
  conWeights: Weight[]
  contextText?: string
  dilemmaText?: string
}): DecisionSignal {
  const { proWeights, conWeights, contextText = "", dilemmaText = "" } = params
  const prosTotal = proWeights.reduce((a, b) => a + b, 0)
  const consTotal = conWeights.reduce((a, b) => a + b, 0)
  const total = prosTotal + consTotal

  const maxPro = proWeights.length ? Math.max(...proWeights) : 0
  const maxCon = conWeights.length ? Math.max(...conWeights) : 0

  if (total === 0) {
    return {
      kind: "depends",
      title: "Highly dependent on priorities",
      explanation: "There isn’t enough signal yet. Add more context if you want a clearer directional read.",
    }
  }

  const delta = prosTotal - consTotal
  const magnitude = Math.abs(delta) / total

  // Edge case: one critical downside dominating many mild upsides
  if (maxCon === 5 && (consTotal >= prosTotal - 2 || maxCon > maxPro + 1)) {
    const ctx = normalize(contextText + " " + dilemmaText)
    const explanation = ctx.includes("family") || ctx.includes("health")
      ? "A critical downside related to your core priorities outweighs the benefits here."
      : "One or more critical downsides carry outsized weight compared to the upside."
    return {
      kind: "strongly_negative",
      title: "Strongly negative",
      explanation,
    }
  }

  // Edge case: one extremely high pro with manageable cons
  if (maxPro === 5 && proWeights.filter((w) => w >= 4).length >= 2 && maxCon < 4) {
    return {
      kind: "strongly_positive",
      title: "Strongly positive",
      explanation: "Multiple high-impact benefits significantly outweigh the manageable risks.",
    }
  }

  // Balanced case - check if truly balanced or just unclear
  if (magnitude < 0.15) {
    const hasExtremes = maxPro === 5 || maxCon === 5
    if (hasExtremes) {
      return {
        kind: "balanced",
        title: "Balanced trade-off",
        explanation: "Strong benefits are matched by significant risks. Your personal priorities will determine the best path.",
      }
    }
    return {
      kind: "balanced",
      title: "Balanced trade-off",
      explanation: "The benefits and downsides look fairly even. Your priorities will likely decide this one.",
    }
  }

  // Positive cases
  if (delta > 0) {
    if (magnitude > 0.3 || (maxPro === 5 && maxCon <= 3)) {
      const ctx = normalize(contextText + " " + dilemmaText)
      const explanation = ctx.includes("career") || ctx.includes("growth")
        ? "The benefits align strongly with your goals and priorities, outweighing the risks."
        : "Several meaningful benefits outweigh the risks in the current picture."
      return {
        kind: "strongly_positive",
        title: "Strongly positive",
        explanation,
      }
    }
    return {
      kind: "leans_positive",
      title: "Leans positive",
      explanation: "The upside looks a bit heavier overall, with some risks to keep in view.",
    }
  }

  // Negative cases
  if (magnitude > 0.3 || (maxCon === 5 && maxPro <= 3)) {
    const ctx = normalize(contextText + " " + dilemmaText)
    const explanation = ctx.includes("stress") || ctx.includes("health")
      ? "The downsides pose significant risks to your well-being and priorities."
      : "The downsides outweigh the benefits in the current picture."
    return {
      kind: "strongly_negative",
      title: "Strongly negative",
      explanation,
    }
  }
  return {
    kind: "leans_negative",
    title: "Leans negative",
    explanation: "The risks look a bit heavier overall, even with some meaningful benefits present.",
  }
}

export function answersMapToContextText(answers: Map<string, string>): string {
  return Array.from(answers.values())
    .map((v) => v.trim())
    .filter(Boolean)
    .join("\n")
}

// Helper to extract dilemma text from context
export function extractDilemmaText(dilemmaText: string): string {
  return dilemmaText.trim()
}

