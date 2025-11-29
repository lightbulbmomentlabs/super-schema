import { useState, useEffect, useRef } from 'react'
import {
  Building2,
  Globe,
  Phone,
  Mail,
  MapPin,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import type { Organization, OrganizationCompleteness } from '@shared/types'
import { cn } from '@/utils/cn'

// =============================================================================
// Helper functions moved outside component to avoid recreation on each render
// =============================================================================

const getScoreColor = (score: number): string => {
  if (score >= 80) return 'bg-success'
  if (score >= 50) return 'bg-warning'
  return 'bg-destructive'
}

const getScoreTextColor = (score: number): string => {
  if (score >= 80) return 'text-success'
  if (score >= 50) return 'text-warning'
  return 'text-destructive'
}

const MISSING_FIELD_LABELS: Record<string, string> = {
  email: 'Email',
  telephone: 'Phone',
  streetAddress: 'Address',
  addressLocality: 'City'
}

const PRIORITY_FIELDS = ['email', 'telephone', 'streetAddress', 'addressLocality']

const getMissingFieldsLabel = (missingFields: string[] | undefined): string | null => {
  if (!missingFields || missingFields.length === 0) return null

  // Prioritize important fields
  const priorityMissing = PRIORITY_FIELDS.filter(f => missingFields.includes(f))

  if (priorityMissing.length === 0) return null

  return priorityMissing.slice(0, 2).map(f => MISSING_FIELD_LABELS[f]).join(', ')
}

// =============================================================================
// Component
// =============================================================================

interface OrganizationCardProps {
  organization: Organization & { completeness?: OrganizationCompleteness }
  isOwner: boolean
  onEdit: (org: Organization) => void
  onDelete: (org: Organization) => void
  onSetDefault: (org: Organization) => void
}

export default function OrganizationCard({
  organization,
  isOwner,
  onEdit,
  onDelete,
  onSetDefault
}: OrganizationCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [logoLoadError, setLogoLoadError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Use optional chaining with fallback for completeness
  const score = organization.completeness?.score ?? 0
  const missingFields = organization.completeness?.missingFields
  const missingLabel = getMissingFieldsLabel(missingFields)

  // Click-outside handler for menu accessibility (Fix #19)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  return (
    <div className="border border-border rounded-lg bg-card p-4 relative">
      <div className="flex items-start gap-4">
        {/* Logo/Icon */}
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
          {organization.logoUrl && !logoLoadError ? (
            <img
              src={organization.logoUrl}
              alt={organization.name}
              className="w-10 h-10 object-contain rounded"
              onError={() => setLogoLoadError(true)}
            />
          ) : (
            <Building2 className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{organization.name}</h3>
            {organization.isDefault && (
              <span className="flex items-center text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                <Star className="h-3 w-3 mr-1 fill-current" />
                Default
              </span>
            )}
          </div>

          {/* Domains */}
          {organization.associatedDomains && organization.associatedDomains.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
              <Globe className="h-3 w-3" />
              <span className="truncate">
                {organization.associatedDomains.slice(0, 3).join(', ')}
                {organization.associatedDomains.length > 3 && ` +${organization.associatedDomains.length - 3} more`}
              </span>
            </div>
          )}

          {/* Quick Info Icons */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            {organization.telephone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
              </span>
            )}
            {organization.email && (
              <span className="flex items-center gap-1">
                <Mail className="h-3 w-3" />
              </span>
            )}
            {organization.address?.addressLocality && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{organization.address.addressLocality}</span>
              </span>
            )}
          </div>

          {/* Completeness Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                {score >= 80 ? (
                  <CheckCircle className="h-3 w-3 text-success" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-warning" />
                )}
                <span className={getScoreTextColor(score)}>
                  {score}% complete
                </span>
              </div>
              {missingLabel && (
                <span className="text-muted-foreground">
                  Missing: {missingLabel}
                </span>
              )}
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={cn("h-full rounded-full transition-all", getScoreColor(score))}
                style={{ width: `${score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        {isOwner && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-accent rounded-md transition-colors"
              aria-label="Organization actions"
              aria-haspopup="true"
              aria-expanded={showMenu}
            >
              <MoreVertical className="h-4 w-4 text-muted-foreground" />
            </button>

            {showMenu && (
              <div
                className="absolute right-0 top-full mt-1 w-48 bg-popover border border-border rounded-md shadow-lg z-20 py-1"
                role="menu"
                aria-label="Organization actions menu"
              >
                <button
                  role="menuitem"
                  onClick={() => {
                    setShowMenu(false)
                    onEdit(organization)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                >
                  <Edit className="h-4 w-4" />
                  Edit Organization
                </button>
                {!organization.isDefault && (
                  <button
                    role="menuitem"
                    onClick={() => {
                      setShowMenu(false)
                      onSetDefault(organization)
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Set as Default
                  </button>
                )}
                <button
                  role="menuitem"
                  onClick={() => {
                    setShowMenu(false)
                    onDelete(organization)
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Organization
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
