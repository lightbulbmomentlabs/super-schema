import { CheckCircle, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/utils/cn'
import type { SchemaOrgCompliance } from '@shared/types'

interface SchemaComplianceBadgeProps {
  compliance?: SchemaOrgCompliance
  className?: string
  /** Compact mode shows just the badge, expandable shows details */
  compact?: boolean
}

/**
 * Schema.org Compliance Badge
 *
 * Displays compliance status separate from quality score.
 * Shows whether schemas will pass validator.schema.org validation.
 */
export default function SchemaComplianceBadge({
  compliance,
  className,
  compact = false
}: SchemaComplianceBadgeProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Default to compliant if no compliance data (sanitization should ensure compliance)
  if (!compliance) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-success/10 text-success-foreground border border-success/20', className)}>
        <CheckCircle className="h-4 w-4" />
        <span className="text-xs font-medium">Schema.org Compliant</span>
      </div>
    )
  }

  const { isCompliant, errors, warnings } = compliance
  const hasErrors = errors.length > 0
  const hasWarnings = warnings.length > 0

  // Determine badge state
  let BadgeIcon = CheckCircle
  let badgeLabel = 'Schema.org Compliant'
  let badgeClass = 'bg-success/10 text-success-foreground border-success/20'

  if (hasErrors) {
    BadgeIcon = AlertCircle
    badgeLabel = `${errors.length} Compliance ${errors.length === 1 ? 'Issue' : 'Issues'}`
    badgeClass = 'bg-destructive/10 text-destructive-foreground border-destructive/20'
  } else if (hasWarnings) {
    BadgeIcon = AlertTriangle
    badgeLabel = `${warnings.length} ${warnings.length === 1 ? 'Warning' : 'Warnings'}`
    badgeClass = 'bg-warning/10 text-warning-foreground border-warning/20'
  }

  // Compact mode - just show badge
  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-md border', badgeClass, className)}>
        <BadgeIcon className="h-4 w-4" />
        <span className="text-xs font-medium">{badgeLabel}</span>
      </div>
    )
  }

  // Expandable mode with details
  return (
    <div className={cn('rounded-lg border', badgeClass, className)}>
      {/* Badge header - always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left"
        disabled={isCompliant && !hasWarnings}
      >
        <div className="flex items-center gap-2">
          <BadgeIcon className="h-4 w-4" />
          <span className="text-sm font-medium">{badgeLabel}</span>
        </div>
        {(hasErrors || hasWarnings) && (
          isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        )}
      </button>

      {/* Expandable details */}
      {isExpanded && (hasErrors || hasWarnings) && (
        <div className="px-3 pb-3 space-y-3 border-t border-current/10">
          {/* Errors */}
          {hasErrors && (
            <div className="mt-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-destructive-foreground/80">
                Compliance Errors
              </h4>
              <ul className="space-y-1.5">
                {errors.map((error, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-destructive-foreground" />
                    <div>
                      <code className="font-mono text-destructive-foreground/90">{error.property}</code>
                      <span className="text-muted-foreground"> - {error.message}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Warnings */}
          {hasWarnings && (
            <div className="mt-3 space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-warning-foreground/80">
                Warnings
              </h4>
              <ul className="space-y-1.5">
                {warnings.map((warning, index) => (
                  <li key={index} className="flex items-start gap-2 text-xs">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-warning-foreground" />
                    <div>
                      <code className="font-mono text-warning-foreground/90">{warning.property}</code>
                      <span className="text-muted-foreground"> - {warning.message}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helpful link */}
          <div className="mt-3 pt-2 border-t border-current/10">
            <a
              href="https://validator.schema.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="h-3 w-3" />
              Validate at validator.schema.org
            </a>
          </div>
        </div>
      )}

      {/* Compliant message */}
      {isCompliant && !hasWarnings && (
        <div className="px-3 pb-2">
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Info className="h-3 w-3" />
            This schema passes validator.schema.org validation
          </p>
        </div>
      )}
    </div>
  )
}
