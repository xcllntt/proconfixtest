"use client"

import type React from "react"

import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, CheckCircle2, GitBranch } from "lucide-react"
import type { DecisionType } from "@/lib/types"

export function TypeSelectionScreen() {
  const { setCurrentStep, setDecisionType, decisionType } = useDecision()

  const handleSelectType = (type: DecisionType) => {
    setDecisionType(type)
  }

  const handleContinue = () => {
    if (decisionType) {
      setCurrentStep("dilemma-input")
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("landing")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Step 1 of 4</div>
          <h1 className="text-lg font-semibold text-foreground">Choose Decision Type</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="max-w-2xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">What kind of decision are you facing?</h2>
            <p className="text-muted-foreground">Select the type that best matches your situation</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TypeCard
              selected={decisionType === "YES_NO"}
              onSelect={() => handleSelectType("YES_NO")}
              icon={<CheckCircle2 className="h-8 w-8" />}
              title="Yes or No"
              description="Should I do this or not? A single choice that needs a decision."
              example="Should I accept this job offer?"
            />
            <TypeCard
              selected={decisionType === "TWO_OPTION"}
              onSelect={() => handleSelectType("TWO_OPTION")}
              icon={<GitBranch className="h-8 w-8" />}
              title="Compare Two Options"
              description="Choosing between two different paths or alternatives."
              example="Job A vs Job B - which should I take?"
            />
          </div>

          <div className="flex justify-center pt-4">
            <Button size="lg" disabled={!decisionType} onClick={handleContinue} className="px-12">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function TypeCard({
  selected,
  onSelect,
  icon,
  title,
  description,
  example,
}: {
  selected: boolean
  onSelect: () => void
  icon: React.ReactNode
  title: string
  description: string
  example: string
}) {
  return (
    <button
      onClick={onSelect}
      className={`
        p-6 rounded-xl border-2 text-left transition-all
        ${selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 bg-card"}
      `}
    >
      <div className={`mb-4 ${selected ? "text-primary" : "text-muted-foreground"}`}>{icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm mb-4">{description}</p>
      <div className="text-xs text-muted-foreground/70 italic">Example: {example}</div>
    </button>
  )
}
