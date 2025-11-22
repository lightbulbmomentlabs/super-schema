/**
 * Modal dialog for ignoring page paths with categorized reasons
 */
import { useState } from 'react'
import { MoreVertical, Shield, Link2, FileImage, Lock, Code, Ban, X } from 'lucide-react'
import { useCreateExclusion } from '@/hooks/useGA4Exclusions'
import type { ExclusionCategory } from '@/services/ga4'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'

interface PagePathActionsDropdownProps {
  path: string
  mappingId: string
  onPatternCreated?: () => void
}

interface IgnoreOption {
  category: ExclusionCategory
  label: string
  icon: React.ComponentType<{ className?: string }>
  description: string
}

const IGNORE_OPTIONS: IgnoreOption[] = [
  {
    category: 'auth',
    label: 'Auth-Required Page',
    icon: Lock,
    description: 'Pages requiring authentication (login, dashboards, settings)'
  },
  {
    category: 'callback',
    label: 'OAuth Callback',
    icon: Link2,
    description: 'OAuth/SSO callback endpoints'
  },
  {
    category: 'static',
    label: 'Static File',
    icon: FileImage,
    description: 'Images, CSS, JS, and other static assets'
  },
  {
    category: 'admin',
    label: 'Admin Page',
    icon: Shield,
    description: 'Admin-only or internal pages'
  },
  {
    category: 'api',
    label: 'API Endpoint',
    icon: Code,
    description: 'REST API or GraphQL endpoints'
  },
  {
    category: 'custom',
    label: 'Other',
    icon: Ban,
    description: 'Custom exclusion reason'
  }
]

export function PagePathActionsDropdown({ path, mappingId, onPatternCreated }: PagePathActionsDropdownProps) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const createExclusion = useCreateExclusion(mappingId)

  const handleIgnore = async (category: ExclusionCategory) => {
    try {
      // Suggest smart pattern based on category
      const suggestedPattern = suggestPatternForPath(path, category)

      await createExclusion.mutateAsync({
        pattern: suggestedPattern.pattern,
        patternType: suggestedPattern.patternType,
        category,
        description: suggestedPattern.description
      })

      toast.success(`Added "${suggestedPattern.pattern}" to exclusions`)

      onPatternCreated?.()
      setIsModalOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to exclude page')
    }
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="h-8 w-8 rounded-md hover:bg-muted flex items-center justify-center transition-colors"
        title="Page actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {/* Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Ignore Page from Metrics</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select why this page should be excluded:
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                    {path}
                  </p>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center flex-shrink-0 ml-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
              {IGNORE_OPTIONS.map((option) => {
                const Icon = option.icon
                return (
                  <button
                    key={option.category}
                    onClick={() => handleIgnore(option.category)}
                    disabled={createExclusion.isPending}
                    className={cn(
                      'w-full flex flex-col items-start gap-1 px-4 py-3 rounded-md',
                      'hover:bg-muted transition-colors text-left border border-border',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <Icon className="h-4 w-4 text-primary" />
                      <span className="font-medium text-sm">{option.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-6 leading-tight">
                      {option.description}
                    </p>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Suggests an appropriate pattern based on the path and category
 */
function suggestPatternForPath(
  path: string,
  category: ExclusionCategory
): { pattern: string; patternType: 'exact' | 'prefix' | 'suffix' | 'regex'; description: string } {
  // Remove query parameters and hash
  const cleanPath = path.split('?')[0].split('#')[0]

  switch (category) {
    case 'static': {
      // Extract file extension
      const match = cleanPath.match(/\.([a-z0-9]+)$/i)
      if (match) {
        const ext = match[1].toLowerCase()
        return {
          pattern: `\\.${ext}$`,
          patternType: 'regex',
          description: `All .${ext} files`
        }
      }
      return {
        pattern: cleanPath,
        patternType: 'exact',
        description: 'Exact path match'
      }
    }

    case 'callback': {
      // If path ends with /callback, use suffix pattern
      if (cleanPath.endsWith('/callback')) {
        return {
          pattern: '/callback',
          patternType: 'suffix',
          description: 'All OAuth callback endpoints'
        }
      }
      return {
        pattern: cleanPath,
        patternType: 'exact',
        description: 'Exact callback path'
      }
    }

    case 'custom': {
      // Check for dynamic segments (UUIDs, tokens, IDs)
      const uuidPattern = /\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/i
      const tokenPattern = /\/[a-zA-Z0-9_-]{8,}/
      const numericIdPattern = /\/\d{3,}/

      if (uuidPattern.test(cleanPath)) {
        // Replace UUID with regex pattern
        const pattern = cleanPath.replace(
          uuidPattern,
          '/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}'
        )
        return {
          pattern: pattern + '$',
          patternType: 'regex',
          description: 'Dynamic URLs with UUID tokens'
        }
      }

      if (tokenPattern.test(cleanPath)) {
        // Replace token with regex pattern
        const pattern = cleanPath.replace(tokenPattern, '/[a-zA-Z0-9_-]{8,}')
        return {
          pattern: pattern + '$',
          patternType: 'regex',
          description: 'Dynamic URLs with tokens'
        }
      }

      if (numericIdPattern.test(cleanPath)) {
        // Replace numeric ID with regex pattern
        const pattern = cleanPath.replace(numericIdPattern, '/\\d+')
        return {
          pattern: pattern + '$',
          patternType: 'regex',
          description: 'Dynamic URLs with numeric IDs'
        }
      }

      return {
        pattern: cleanPath,
        patternType: 'exact',
        description: 'Exact path match'
      }
    }

    case 'auth':
    case 'admin':
    case 'api': {
      // For these categories, use prefix pattern for the base path
      const segments = cleanPath.split('/').filter(Boolean)
      if (segments.length > 0) {
        const baseSegment = '/' + segments[0]
        return {
          pattern: baseSegment,
          patternType: 'prefix',
          description: `All paths starting with ${baseSegment}`
        }
      }
      return {
        pattern: cleanPath,
        patternType: 'exact',
        description: 'Exact path match'
      }
    }

    default:
      return {
        pattern: cleanPath,
        patternType: 'exact',
        description: 'Exact path match'
      }
  }
}
