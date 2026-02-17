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

  const strongBoostersPros = [
    "major",
    "significant",
    "substantial",
    "huge",
    "massive",
    "meaningful",
    "life-changing",
    "game changer",
    "great",
    "excellent",
    "high impact",
    "strong benefit",
  ]
  const mildReducersPros = ["minor", "small", "slight", "nice to have", "convenient", "somewhat", "a bit"]

  const strongBoostersCons = [
    "critical",
    "severe",
    "serious",
    "deal-breaker",
    "dealbreaker",
    "unsafe",
    "danger",
    "harm",
    "toxic",
    "burnout",
    "illegal",
    "catastrophic",
    "unaffordable",
    "very expensive",
  ]
  const mildReducersCons = ["minor", "small", "slight", "manageable", "inconvenient", "somewhat", "a bit"]

  const uncertaintyReducers = ["maybe", "might", "could", "unclear", "unknown", "depends"]
  const certaintyBoosters = ["will", "always", "never", "definitely", "certainly"]

  let delta = 0

  if (type === "pros") {
    if (includesAny(t, strongBoostersPros)) delta += 1
    if (includesAny(t, mildReducersPros)) delta -= 1
  } else {
    if (includesAny(t, strongBoostersCons)) delta += 2
    if (includesAny(t, mildReducersCons)) delta -= 1
  }

  if (includesAny(t, certaintyBoosters)) delta += 1
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

function computeTopicBias(contextText: string) {
  const ctx = normalize(contextText)
  const bias = new Map<TopicKey, { up: boolean; down: boolean }>()

  for (const topic of TOPICS) {
    const mentions = topic.keywords.some((k) => ctx.includes(k))
    if (!mentions) continue

    const up =
      /most important|top priority|really care|care a lot|value|matters a lot|non[-\s]?negotiable/.test(ctx) &&
      topic.keywords.some((k) => ctx.includes(k))

    const down =
      /not important|don't care|doesn't matter|no big deal|not a priority/.test(ctx) &&
      topic.keywords.some((k) => ctx.includes(k))

    bias.set(topic.key, { up, down })
  }

  return bias
}

function scoreFromContext(itemText: string, contextText: string): number {
  const ctx = normalize(contextText)
  if (!ctx) return 0

  const item = normalize(itemText)
  const topicBias = computeTopicBias(ctx)

  let delta = 0
  for (const topic of TOPICS) {
    const matchesTopic = topic.keywords.some((k) => item.includes(k))
    if (!matchesTopic) continue

    const b = topicBias.get(topic.key)
    if (b?.up) delta += 1
    if (b?.down) delta -= 1
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

export function estimateItemWeight(params: { type: ProConType; itemText: string; contextText?: string }): Weight {
  const { type, itemText, contextText = "" } = params

  // Conservative, balanced baseline when we have limited context.
  let score = 3

  score += scoreFromWording(itemText, type)
  score += scoreFromContext(itemText, contextText)

  return clampWeight(score)
}

export function weightItems(params: { type: ProConType; items: string[]; contextText?: string }): WeightedItem[] {
  const { type, items, contextText = "" } = params
  return items.map((text, originalIndex) => {
    const weight = estimateItemWeight({ type, itemText: text, contextText })
    return { text, weight, label: impactLabelFor(type, weight), originalIndex }
  })
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

  const avg = weights.reduce((a, b) => a + b, 0) / weights.length
  const max = Math.max(...weights)
  const summaryWeight = clampWeight(Math.round((avg + max) / 2))

  if (type === "pros") {
    if (summaryWeight <= 2) return { summaryWeight, label: "Overall impact: Weak" }
    if (summaryWeight === 3) return { summaryWeight, label: "Overall impact: Moderate" }
    return { summaryWeight, label: "Overall impact: Strong" }
  }

  if (summaryWeight <= 2) return { summaryWeight, label: "Overall risk: Low" }
  if (summaryWeight === 3) return { summaryWeight, label: "Overall risk: Manageable" }
  return { summaryWeight, label: "Overall risk: Critical" }
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

export function decisionSignalFromWeights(params: { proWeights: Weight[]; conWeights: Weight[] }): DecisionSignal {
  const { proWeights, conWeights } = params
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

  // Edge case: one critical downside dominating many mild upsides.
  if (maxCon === 5 && consTotal >= prosTotal - 1) {
    return {
      kind: "strongly_negative",
      title: "Strongly negative",
      explanation: "One or more critical downsides carry outsized weight compared to the upside.",
    }
  }

  if (magnitude < 0.12) {
    return {
      kind: "balanced",
      title: "Balanced trade-off",
      explanation: "The benefits and downsides look fairly even. Your priorities will likely decide this one.",
    }
  }

  if (delta > 0) {
    if (magnitude > 0.28 || maxPro === 5) {
      return {
        kind: "strongly_positive",
        title: "Strongly positive",
        explanation: "Several meaningful benefits outweigh the risks in the current picture.",
      }
    }
    return {
      kind: "leans_positive",
      title: "Leans positive",
      explanation: "The upside looks a bit heavier overall, with some risks to keep in view.",
    }
  }

  if (magnitude > 0.28 || maxCon === 5) {
    return {
      kind: "strongly_negative",
      title: "Strongly negative",
      explanation: "The downsides outweigh the benefits in the current picture.",
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

