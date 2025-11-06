import {
  CheckCircle,
  Target,
  Award,
  TrendingUp,
  Star,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { SchemaScore } from '@shared/types'

interface SchemaScoreCompactProps {
  score: SchemaScore
  className?: string
  onRecalculateScore?: () => void
  isRecalculating?: boolean
}

const getScoreColor = (score: number) => {
  if (score >= 90) return 'text-success-foreground'
  if (score >= 75) return 'text-info-foreground'
  if (score >= 60) return 'text-warning-foreground'
  return 'text-destructive-foreground'
}

const getScoreBgColor = (score: number) => {
  if (score >= 90) return 'bg-success border-success'
  if (score >= 75) return 'bg-info border-info'
  if (score >= 60) return 'bg-warning border-warning'
  return 'bg-destructive border-destructive'
}

const getScoreGrade = (score: number) => {
  if (score >= 97) return 'A+'
  if (score >= 93) return 'A'
  if (score >= 90) return 'A-'
  if (score >= 87) return 'B+'
  if (score >= 83) return 'B'
  if (score >= 80) return 'B-'
  if (score >= 77) return 'C+'
  if (score >= 73) return 'C'
  if (score >= 70) return 'C-'
  if (score >= 67) return 'D+'
  if (score >= 63) return 'D'
  if (score >= 60) return 'D-'
  return 'F'
}

const getScoreDescription = (score: number) => {
  if (score >= 90) return 'Excellent schema quality'
  if (score >= 75) return 'Good schema quality'
  if (score >= 60) return 'Decent schema quality'
  return 'Needs improvement'
}

const getProgressBarColor = (value: number) => {
  if (value >= 90) return 'bg-success'
  if (value >= 75) return 'bg-info'
  if (value >= 60) return 'bg-warning'
  return 'bg-destructive'
}

export default function SchemaScoreCompact({
  score,
  className,
  onRecalculateScore,
  isRecalculating = false
}: SchemaScoreCompactProps) {
  const overallScore = score.overallScore
  const grade = getScoreGrade(overallScore)

  return (
    <div className={cn('bg-card border border-border rounded-lg p-4', className)}>
      {/* Compact Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border-2',
            getScoreBgColor(overallScore),
            getScoreColor(overallScore)
          )}>
            <div className="text-center">
              <div className="text-lg font-bold">{grade}</div>
            </div>
          </div>
          <div>
            <h3 className="text-base font-semibold flex items-center">
              Schema Quality
              <Star className="h-3.5 w-3.5 ml-1.5 text-yellow-500" />
            </h3>
            <p className="text-xs text-muted-foreground">
              {getScoreDescription(overallScore)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn('text-2xl font-bold', getScoreColor(overallScore))}>
            {overallScore}
          </div>
          <div className="text-xs text-muted-foreground">/ 100</div>
        </div>
      </div>

      {/* Compact Score Breakdown */}
      <div className="space-y-2.5 mb-4">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <CheckCircle className="h-3.5 w-3.5 mr-1.5 text-success-foreground" />
              Required Properties
            </span>
            <span className={cn('text-xs font-semibold', getScoreColor(score.breakdown.requiredProperties))}>
              {score.breakdown.requiredProperties}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                getProgressBarColor(score.breakdown.requiredProperties)
              )}
              style={{ width: `${score.breakdown.requiredProperties}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <Target className="h-3.5 w-3.5 mr-1.5 text-info-foreground" />
              Recommended Properties
            </span>
            <span className={cn('text-xs font-semibold', getScoreColor(score.breakdown.recommendedProperties))}>
              {score.breakdown.recommendedProperties}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                getProgressBarColor(score.breakdown.recommendedProperties)
              )}
              style={{ width: `${score.breakdown.recommendedProperties}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <Award className="h-3.5 w-3.5 mr-1.5 text-purple-600" />
              Advanced AEO Features
            </span>
            <span className={cn('text-xs font-semibold', getScoreColor(score.breakdown.advancedAEOFeatures))}>
              {score.breakdown.advancedAEOFeatures}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                getProgressBarColor(score.breakdown.advancedAEOFeatures)
              )}
              style={{ width: `${score.breakdown.advancedAEOFeatures}%` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium flex items-center">
              <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-indigo-600" />
              Content Quality
            </span>
            <span className={cn('text-xs font-semibold', getScoreColor(score.breakdown.contentQuality))}>
              {score.breakdown.contentQuality}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-1.5">
            <div
              className={cn(
                'h-1.5 rounded-full transition-all duration-500',
                getProgressBarColor(score.breakdown.contentQuality)
              )}
              style={{ width: `${score.breakdown.contentQuality}%` }}
            />
          </div>
        </div>
      </div>

      {/* Strengths */}
      {score.strengths.length > 0 && (
        <div className="bg-success border border-success rounded-md p-3 mb-3">
          <h4 className="text-xs font-semibold text-success-foreground mb-1.5 flex items-center">
            <CheckCircle className="h-3.5 w-3.5 mr-1.5" />
            Strengths ({score.strengths.length})
          </h4>
          <ul className="space-y-0.5">
            {score.strengths.map((strength, index) => (
              <li key={index} className="text-xs text-success-foreground flex items-start">
                <span className="text-success-foreground mr-1.5">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recalculate Button */}
      {onRecalculateScore && (
        <div className="mb-3">
          <button
            onClick={onRecalculateScore}
            disabled={isRecalculating}
            className="w-full flex items-center justify-center px-3 py-2 text-xs rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Recalculate schema quality score"
          >
            {isRecalculating ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-2" />
                Recalculating...
              </>
            ) : (
              <>
                <RefreshCw className="h-3 w-3 mr-2" />
                Recalculate Score
              </>
            )}
          </button>
        </div>
      )}

      {/* Link to Schema Property Reference */}
      <div className="text-center pt-2 border-t border-border">
        <a
          href="/schema-markup/improve-quality-score"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
        >
          Need help improving your score?
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}
