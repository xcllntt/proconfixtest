"use client"

import type React from "react"

import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { Scale, ArrowRight, Brain, ListChecks, Sparkles } from "lucide-react"

export function LandingScreen() {
  const { setCurrentStep } = useDecision()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Scale className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold text-foreground">Procon</span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
            <Sparkles className="h-4 w-4" />
            AI-Powered Decision Analysis
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight text-balance">
            Make better decisions with clarity
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Procon helps you analyze your choices through AI-powered pros and cons analysis. Get clear insights to make
            confident decisions.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" onClick={() => setCurrentStep("type-selection")} className="px-8 py-6 text-lg gap-2">
              Get Started
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20 max-w-4xl mx-auto w-full">
          <FeatureCard
            icon={<Brain className="h-6 w-6" />}
            title="AI Analysis"
            description="Get intelligent insights powered by advanced language models"
          />
          <FeatureCard
            icon={<ListChecks className="h-6 w-6" />}
            title="Structured Thinking"
            description="Break down complex decisions into clear pros and cons"
          />
          <FeatureCard
            icon={<Scale className="h-6 w-6" />}
            title="Compare Options"
            description="Evaluate multiple choices side by side with detailed analysis"
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 border-t border-border/50 text-center text-sm text-muted-foreground">
        Built to help you think clearly
      </footer>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="p-6 rounded-xl bg-card border border-border/50 hover:border-primary/30 transition-colors">
      <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}
