"use client"

import { useDecision } from "@/lib/decision-context"
import { Button } from "@/components/ui/button"
import { ArrowLeft, RotateCcw } from "lucide-react"

export function FinalAnalysisScreen() {
  const { setCurrentStep, finalAnalysis, resetFlow } = useDecision()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-border/50">
        <Button variant="ghost" size="icon" onClick={() => setCurrentStep("initial-analysis")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="text-sm text-muted-foreground">Final Step</div>
          <h1 className="text-lg font-semibold text-foreground">Side-by-Side Comparison</h1>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-8 overflow-auto">
        <div className="max-w-5xl mx-auto w-full space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">Detailed Comparison</h2>
            <p className="text-muted-foreground">See how your options compare across key dimensions</p>
          </div>

          {finalAnalysis && finalAnalysis.dimensions ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left p-4 text-muted-foreground font-medium">Dimension</th>
                    <th className="text-left p-4 text-primary font-semibold">{finalAnalysis.option_a_name}</th>
                    <th className="text-left p-4 text-accent font-semibold">{finalAnalysis.option_b_name}</th>
                  </tr>
                </thead>
                <tbody>
                  {finalAnalysis.dimensions.map((dimension, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-card/50 transition-colors">
                      <td className="p-4 font-medium text-foreground">{dimension.name}</td>
                      <td className="p-4 text-muted-foreground text-sm">{dimension.option_a_assessment}</td>
                      <td className="p-4 text-muted-foreground text-sm">{dimension.option_b_assessment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">No comparison data available</div>
          )}

          <div className="flex justify-center pt-8">
            <Button size="lg" onClick={resetFlow} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              Start New Decision
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
