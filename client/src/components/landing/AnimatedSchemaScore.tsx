import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { FileText, Shield, Sparkles, Target } from 'lucide-react'
import CircularScoreGauge from './CircularScoreGauge'
import ScoreBreakdownBar from './ScoreBreakdownBar'
import FloatingMetricBadge from './FloatingMetricBadge'

export default function AnimatedSchemaScore() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  // Demo schema score data
  const overallScore = 95
  const breakdownMetrics = [
    { label: 'Completeness', value: 98, icon: FileText, color: 'green' as const },
    { label: 'Accuracy', value: 96, icon: Shield, color: 'blue' as const },
    { label: 'AEO Optimization', value: 92, icon: Sparkles, color: 'purple' as const },
    { label: 'Rich Results Ready', value: 94, icon: Target, color: 'pink' as const }
  ]

  const floatingMetrics = [
    { label: 'Schema Types', value: 8, icon: FileText },
    { label: 'Quality', value: 95, icon: Shield }
  ]

  return (
    <div
      ref={ref}
      className="w-full max-w-5xl mx-auto px-4 py-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left side - Circular gauge and floating badges */}
        <div className="relative flex flex-col items-center justify-center">
          {/* Main circular gauge */}
          <CircularScoreGauge
            targetScore={overallScore}
            size={280}
            isInView={isInView}
          />

          {/* Floating metric badges positioned around the gauge */}
          <div className="mt-8 flex flex-wrap gap-3 justify-center">
            {floatingMetrics.map((metric, index) => (
              <FloatingMetricBadge
                key={metric.label}
                {...metric}
                delay={1.0 + index * 0.15}
              />
            ))}
          </div>
        </div>

        {/* Right side - Score breakdown bars */}
        <div className="space-y-6">
          {/* Section title */}
          <div className="space-y-2 mb-8">
            <h3 className="text-2xl font-bold">Score Breakdown</h3>
            <p className="text-muted-foreground">
              Every schema is analyzed across multiple dimensions to ensure maximum impact.
            </p>
          </div>

          {/* Breakdown bars with staggered animation */}
          {breakdownMetrics.map((metric, index) => (
            <ScoreBreakdownBar
              key={metric.label}
              {...metric}
              delay={0.5 + index * 0.1}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
