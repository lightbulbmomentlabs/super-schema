import { useState } from 'react'
import {
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Info,
  Star,
  Award,
  Target,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Zap,
  Clock,
  TrendingDown
} from 'lucide-react'
import { cn } from '@/utils/cn'
import type { SchemaScore, ActionItem } from '@shared/types'
import ImportedSchemaRefinementModal from './ImportedSchemaRefinementModal'

interface SchemaScoreProps {
  score: SchemaScore
  url: string
  className?: string
  onRefineSchema?: () => void
  isRefining?: boolean
  canRefine?: boolean
  previousScore?: number
  refinementCount?: number
  maxRefinements?: number
  isImportedSchema?: boolean
  hasBeenRefined?: boolean
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
  if (score >= 90) return 'Excellent schema quality with comprehensive AEO optimization'
  if (score >= 75) return 'Good schema quality with strong SEO potential'
  if (score >= 60) return 'Decent schema quality with room for improvement'
  return 'Schema needs significant improvement for optimal performance'
}

const getPriorityColor = (priority: ActionItem['priority']) => {
  switch (priority) {
    case 'critical': return 'text-destructive-foreground bg-destructive border-destructive'
    case 'important': return 'text-warning-foreground bg-warning border-warning'
    case 'nice-to-have': return 'text-info-foreground bg-info border-info'
  }
}

const getPriorityIcon = (priority: ActionItem['priority']) => {
  switch (priority) {
    case 'critical': return AlertTriangle
    case 'important': return TrendingUp
    case 'nice-to-have': return Lightbulb
  }
}

const getEffortLabel = (effort: ActionItem['effort']) => {
  switch (effort) {
    case 'quick': return '~5 min'
    case 'medium': return '~15 min'
    case 'major': return '~30 min'
  }
}

export default function SchemaScore({
  score,
  url,
  className,
  onRefineSchema,
  isRefining = false,
  canRefine = true,
  previousScore,
  refinementCount = 0,
  maxRefinements = 2,
  isImportedSchema = false,
  hasBeenRefined = false
}: SchemaScoreProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showActionItems, setShowActionItems] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)

  const overallScore = score.overallScore
  const grade = getScoreGrade(overallScore)
  const hasContentIssues = score.contentIssues && Object.keys(score.contentIssues).length > 0
  const hasActionItems = score.actionItems && score.actionItems.length > 0
  const scoreImprovement = previousScore ? overallScore - previousScore : 0

  // Handler for Refine button click - shows modal for first refinement of imported schemas
  const handleRefineClick = () => {
    const needsCreditConfirmation = isImportedSchema && !hasBeenRefined

    console.log('🔍 [SchemaScore] Refine button clicked:', {
      isImportedSchema,
      hasBeenRefined,
      needsCreditConfirmation,
      willShowModal: needsCreditConfirmation
    })

    if (needsCreditConfirmation) {
      setShowCreditModal(true)
    } else {
      onRefineSchema?.()
    }
  }

  // Handler for confirming credit charge in modal
  const handleConfirmRefinement = () => {
    setShowCreditModal(false)
    onRefineSchema?.()
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg p-6', className)}>
      {/* Score Improvement Banner */}
      {previousScore && scoreImprovement !== 0 && (
        <div className={cn(
          'mb-4 p-3 rounded-lg border flex items-center justify-between',
          scoreImprovement > 0
            ? 'bg-success border-success text-success-foreground'
            : 'bg-destructive border-destructive text-destructive-foreground'
        )}>
          <div className="flex items-center">
            {scoreImprovement > 0 ? (
              <TrendingUp className="h-4 w-4 mr-2" />
            ) : (
              <TrendingDown className="h-4 w-4 mr-2" />
            )}
            <span className="text-sm font-medium">
              Score {scoreImprovement > 0 ? 'improved' : 'changed'} by {Math.abs(scoreImprovement)} points
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{previousScore}</span>
            <span className="mx-2">→</span>
            <span className="font-bold">{overallScore}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center border-2',
            getScoreBgColor(overallScore),
            getScoreColor(overallScore)
          )}>
            <div className="text-center">
              <div className="text-xl font-bold">{grade}</div>
              <div className="text-xs">Score</div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold flex items-center">
              Schema Quality Score
              <Star className="h-4 w-4 ml-2 text-yellow-500" />
            </h3>
            <p className="text-sm text-muted-foreground">
              {getScoreDescription(overallScore)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">
            {overallScore}
          </div>
          <div className="text-sm text-muted-foreground">/ 100</div>
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <CheckCircle className="h-4 w-4 mr-2 text-success-foreground" />
              Required Properties
            </span>
            <span className="font-semibold text-foreground">
              {score.breakdown.requiredProperties}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                score.breakdown.requiredProperties >= 90 ? 'bg-success' :
                score.breakdown.requiredProperties >= 75 ? 'bg-info' :
                score.breakdown.requiredProperties >= 60 ? 'bg-warning' : 'bg-destructive'
              )}
              style={{ width: `${score.breakdown.requiredProperties}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-info-foreground" />
              Recommended Properties
            </span>
            <span className="font-semibold text-foreground">
              {score.breakdown.recommendedProperties}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                score.breakdown.recommendedProperties >= 90 ? 'bg-success' :
                score.breakdown.recommendedProperties >= 75 ? 'bg-info' :
                score.breakdown.recommendedProperties >= 60 ? 'bg-warning' : 'bg-destructive'
              )}
              style={{ width: `${score.breakdown.recommendedProperties}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <Award className="h-4 w-4 mr-2 text-purple-600" />
              Advanced AEO Features
            </span>
            <span className="font-semibold text-foreground">
              {score.breakdown.advancedAEOFeatures}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                score.breakdown.advancedAEOFeatures >= 90 ? 'bg-success' :
                score.breakdown.advancedAEOFeatures >= 75 ? 'bg-info' :
                score.breakdown.advancedAEOFeatures >= 60 ? 'bg-warning' : 'bg-destructive'
              )}
              style={{ width: `${score.breakdown.advancedAEOFeatures}%` }}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
              Content Quality
            </span>
            <span className="font-semibold text-foreground">
              {score.breakdown.contentQuality}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={cn(
                'h-2 rounded-full transition-all duration-500',
                score.breakdown.contentQuality >= 90 ? 'bg-success' :
                score.breakdown.contentQuality >= 75 ? 'bg-info' :
                score.breakdown.contentQuality >= 60 ? 'bg-warning' : 'bg-destructive'
              )}
              style={{ width: `${score.breakdown.contentQuality}%` }}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4 pb-6 border-t border-border">
        <div className="flex items-center space-x-4">
          {onRefineSchema && (
            <button
              onClick={handleRefineClick}
              disabled={isRefining || !canRefine}
              className="flex items-center px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRefining ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                  Refining Schema...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  {isImportedSchema && !hasBeenRefined ? (
                    'Refine with AI (1 credit)'
                  ) : isImportedSchema && hasBeenRefined ? (
                    `Refine with AI (Free - ${maxRefinements - refinementCount} left)`
                  ) : (
                    `Refine with AI (${maxRefinements - refinementCount} left)`
                  )}
                </>
              )}
            </button>
          )}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <Info className="h-4 w-4 mr-1" />
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-4 w-4 mr-1" />
            View Original Page
          </a>
        </div>
        {!canRefine && (
          <div className="text-xs text-muted-foreground">
            {refinementCount}/{maxRefinements} refinements used
          </div>
        )}
      </div>

      {/* Strengths */}
      {score.strengths.length > 0 && (
        <div className="bg-success border border-success rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-success-foreground mb-2 flex items-center">
            <CheckCircle className="h-4 w-4 mr-2" />
            Strengths ({score.strengths.length})
          </h4>
          <ul className="space-y-1">
            {score.strengths.map((strength, index) => (
              <li key={index} className="text-sm text-success-foreground flex items-start">
                <span className="text-success-foreground mr-2">•</span>
                {strength}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Content Issues Warning */}
      {hasContentIssues && (
        <div className="bg-warning border border-warning rounded-lg p-4 mb-4">
          <h4 className="text-sm font-semibold text-warning-foreground mb-2 flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Content Quality Issues
          </h4>
          <p className="text-sm text-warning-foreground mb-3">
            Your website's content has some limitations that may affect schema quality.
            These issues are related to your page content, not our app's performance.
          </p>
          <div className="space-y-2">
            {score.contentIssues?.lowWordCount && (
              <div className="text-sm text-warning-foreground flex items-center">
                <span className="text-warning-foreground mr-2">•</span>
                Page has limited content (consider adding more detailed information)
              </div>
            )}
            {score.contentIssues?.missingImages && (
              <div className="text-sm text-warning-foreground flex items-center">
                <span className="text-warning-foreground mr-2">•</span>
                No images detected (consider adding relevant images with alt text)
              </div>
            )}
            {score.contentIssues?.noAuthorInfo && (
              <div className="text-sm text-warning-foreground flex items-center">
                <span className="text-warning-foreground mr-2">•</span>
                Missing author information (add bylines or author bios)
              </div>
            )}
            {score.contentIssues?.noDateInfo && (
              <div className="text-sm text-warning-foreground flex items-center">
                <span className="text-warning-foreground mr-2">•</span>
                Missing publication date (add publish dates to content)
              </div>
            )}
            {score.contentIssues?.poorMetadata && (
              <div className="text-sm text-warning-foreground flex items-center">
                <span className="text-warning-foreground mr-2">•</span>
                Limited metadata (improve meta descriptions and page titles)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Priority Action Items */}
      {hasActionItems && (
        <div className="border border-border rounded-lg mb-4">
          <button
            onClick={() => setShowActionItems(!showActionItems)}
            className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <h4 className="text-sm font-semibold flex items-center">
              <Zap className="h-4 w-4 mr-2 text-primary" />
              Priority Action Items ({score.actionItems?.length || 0})
            </h4>
            {showActionItems ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showActionItems && (
            <div className="p-4 pt-0 border-t border-border">
              <div className="space-y-3">
                {score.actionItems?.sort((a, b) => {
                  const priorityOrder = { critical: 0, important: 1, 'nice-to-have': 2 }
                  return priorityOrder[a.priority] - priorityOrder[b.priority]
                }).map((item) => {
                  const PriorityIcon = getPriorityIcon(item.priority)
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-lg border',
                        getPriorityColor(item.priority)
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-start flex-1">
                          <PriorityIcon className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{item.description}</p>
                            <div className="flex items-center gap-3 mt-2 text-xs">
                              <span className="flex items-center">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                +{item.estimatedImpact} pts
                              </span>
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {getEffortLabel(item.effort)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full bg-white/50 capitalize">
                                {item.category}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      {score.suggestions.length > 0 && (
        <div className="border border-border rounded-lg">
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="w-full p-4 flex items-center justify-between hover:bg-accent transition-colors"
          >
            <h4 className="text-sm font-semibold flex items-center">
              <Lightbulb className="h-4 w-4 mr-2 text-yellow-600" />
              Improvement Suggestions ({score.suggestions.length})
            </h4>
            {showSuggestions ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {showSuggestions && (
            <div className="p-4 pt-0 border-t border-border">
              <ul className="space-y-3">
                {score.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">💡</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Detailed Breakdown */}
      {showDetails && (
        <div className="mt-4 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold mb-3">Scoring Methodology</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Weighted Components:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Required Properties: 40% weight</li>
                <li>• Recommended Properties: 30% weight</li>
                <li>• Advanced AEO Features: 20% weight</li>
                <li>• Content Quality: 10% weight</li>
              </ul>
            </div>
            <div>
              <h5 className="font-medium mb-2">Score Ranges:</h5>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 90-100: Excellent (A-A+)</li>
                <li>• 75-89: Good (B-B+)</li>
                <li>• 60-74: Fair (C-C+)</li>
                <li>• Below 60: Needs Improvement</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Credit Confirmation Modal for Imported Schema First Refinement */}
      <ImportedSchemaRefinementModal
        isOpen={showCreditModal}
        onClose={() => setShowCreditModal(false)}
        onConfirm={handleConfirmRefinement}
      />
    </div>
  )
}