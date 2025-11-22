/**
 * Collapsible panel for managing GA4 path exclusion patterns
 */
import { useState } from 'react'
import { ChevronDown, ChevronRight, Plus, Trash2, Edit, Power, PowerOff, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'react-hot-toast'
import { cn } from '@/utils/cn'
import {
  useGA4Exclusions,
  useCreateExclusion,
  useUpdateExclusion,
  useDeleteExclusion,
  useToggleExclusion
} from '@/hooks/useGA4Exclusions'
import type { ExclusionCategory, ExclusionPatternType, ExclusionPattern } from '@/services/ga4'

interface GA4ExclusionManagerProps {
  mappingId: string
  domain: string
}

const CATEGORY_LABELS: Record<ExclusionCategory, string> = {
  auth: 'Auth-Required Pages',
  callback: 'OAuth Callbacks',
  static: 'Static Files',
  admin: 'Admin Pages',
  api: 'API Endpoints',
  custom: 'Custom'
}

const PATTERN_TYPE_LABELS: Record<ExclusionPatternType, string> = {
  exact: 'Exact match',
  prefix: 'Starts with',
  suffix: 'Ends with',
  regex: 'Regex pattern'
}

export function GA4ExclusionManager({ mappingId, domain }: GA4ExclusionManagerProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingPattern, setEditingPattern] = useState<ExclusionPattern | null>(null)

  const { data: patterns = [], isLoading } = useGA4Exclusions(mappingId)
  const createExclusion = useCreateExclusion(mappingId)
  const updateExclusion = useUpdateExclusion(mappingId)
  const deleteExclusion = useDeleteExclusion(mappingId)
  const toggleExclusion = useToggleExclusion(mappingId)

  // Group patterns by category
  const patternsByCategory = patterns.reduce((acc, pattern) => {
    if (!acc[pattern.category]) {
      acc[pattern.category] = []
    }
    acc[pattern.category].push(pattern)
    return acc
  }, {} as Record<ExclusionCategory, ExclusionPattern[]>)

  const handleToggle = async (pattern: ExclusionPattern) => {
    try {
      await toggleExclusion.mutateAsync({
        patternId: pattern.id,
        isActive: !pattern.isActive
      })
      toast.success(`"${pattern.pattern}" is now ${pattern.isActive ? 'disabled' : 'enabled'}`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to toggle pattern')
    }
  }

  const handleDelete = async (pattern: ExclusionPattern) => {
    try {
      await deleteExclusion.mutateAsync(pattern.id)
      toast.success(`Removed "${pattern.pattern}"`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete pattern')
    }
  }

  const activeDefaults = patterns.filter(p => p.isDefault && p.isActive).length
  const customPatterns = patterns.filter(p => !p.isDefault).length

  return (
    <div className="bg-card border border-muted rounded-lg">
      <div
        className="cursor-pointer p-4"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <div>
              <h4 className="text-base font-semibold">Path Exclusion Filters</h4>
              <p className="text-xs text-muted-foreground">
                {activeDefaults} smart defaults active • {customPatterns} custom pattern{customPatterns !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsAddDialogOpen(true)
            }}
            className="px-3 py-1.5 text-sm rounded-md border border-border hover:bg-muted transition-colors flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Pattern
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-muted"
          >
            <div className="p-4">
              {isLoading ? (
                <div className="text-sm text-muted-foreground py-4">Loading patterns...</div>
              ) : patterns.length === 0 ? (
                <div className="text-sm text-muted-foreground py-4">No exclusion patterns configured</div>
              ) : (
                <div className="space-y-4">
                  {(Object.keys(patternsByCategory) as ExclusionCategory[]).map((category) => {
                    const categoryPatterns = patternsByCategory[category]
                    if (!categoryPatterns || categoryPatterns.length === 0) return null

                    return (
                      <div key={category} className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {CATEGORY_LABELS[category]}
                        </h4>
                        <div className="space-y-1">
                          {categoryPatterns.map((pattern) => (
                            <PatternRow
                              key={pattern.id}
                              pattern={pattern}
                              onToggle={() => handleToggle(pattern)}
                              onEdit={() => setEditingPattern(pattern)}
                              onDelete={() => handleDelete(pattern)}
                            />
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Pattern Dialog */}
      <PatternDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        mappingId={mappingId}
        domain={domain}
      />

      {/* Edit Pattern Dialog */}
      {editingPattern && (
        <PatternDialog
          open={!!editingPattern}
          onOpenChange={(open) => !open && setEditingPattern(null)}
          mappingId={mappingId}
          domain={domain}
          pattern={editingPattern}
        />
      )}
    </div>
  )
}

/**
 * Individual pattern row with actions
 */
interface PatternRowProps {
  pattern: ExclusionPattern
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
}

function PatternRow({ pattern, onToggle, onEdit, onDelete }: PatternRowProps) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-muted/50 group">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <code className="text-xs font-mono px-1.5 py-0.5 rounded bg-muted">
            {pattern.pattern}
          </code>
          <span className="text-xs text-muted-foreground">
            {PATTERN_TYPE_LABELS[pattern.patternType]}
          </span>
          {pattern.isDefault && (
            <span className="text-xs text-muted-foreground">(default)</span>
          )}
        </div>
        {pattern.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {pattern.description}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onToggle}
          className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
          title={pattern.isActive ? 'Disable pattern' : 'Enable pattern'}
        >
          {pattern.isActive ? (
            <Power className="h-3.5 w-3.5 text-green-600" />
          ) : (
            <PowerOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </button>
        {!pattern.isDefault && (
          <>
            <button
              onClick={onEdit}
              className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center"
              title="Edit pattern"
            >
              <Edit className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="h-7 w-7 rounded hover:bg-muted flex items-center justify-center text-destructive"
              title="Delete pattern"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Dialog for adding/editing patterns
 */
interface PatternDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  mappingId: string
  domain: string
  pattern?: ExclusionPattern
}

function PatternDialog({ open, onOpenChange, mappingId, domain, pattern }: PatternDialogProps) {
  const [formData, setFormData] = useState({
    pattern: pattern?.pattern || '',
    patternType: pattern?.patternType || 'exact' as ExclusionPatternType,
    category: pattern?.category || 'custom' as ExclusionCategory,
    description: pattern?.description || ''
  })

  const createExclusion = useCreateExclusion(mappingId)
  const updateExclusion = useUpdateExclusion(mappingId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (pattern) {
        // Edit existing pattern
        await updateExclusion.mutateAsync({
          patternId: pattern.id,
          ...formData
        })
        toast.success(`Updated "${formData.pattern}"`)
      } else {
        // Create new pattern
        await createExclusion.mutateAsync(formData)
        toast.success(`Added "${formData.pattern}" to exclusions`)
      }
      onOpenChange(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : (pattern ? 'Failed to update pattern' : 'Failed to create pattern'))
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">{pattern ? 'Edit Pattern' : 'Add Exclusion Pattern'}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Create a pattern to exclude paths from AI visibility tracking for {domain}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded hover:bg-muted flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-2">
              <label htmlFor="pattern" className="text-sm font-medium">Pattern</label>
              <input
                id="pattern"
                type="text"
                placeholder="/admin or \.png$ or /api/.*"
                value={formData.pattern}
                onChange={(e) => setFormData({ ...formData, pattern: e.target.value })}
                required
                className="w-full px-3 py-2 border border-border rounded-md bg-background"
              />
              <p className="text-xs text-muted-foreground">
                The path pattern to match. Use regex for complex patterns.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="patternType" className="text-sm font-medium">Match Type</label>
                <select
                  id="patternType"
                  value={formData.patternType}
                  onChange={(e) => setFormData({ ...formData, patternType: e.target.value as ExclusionPatternType })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="exact">Exact match</option>
                  <option value="prefix">Starts with</option>
                  <option value="suffix">Ends with</option>
                  <option value="regex">Regex</option>
                </select>
              </div>

              <div className="space-y-2">
                <label htmlFor="category" className="text-sm font-medium">Category</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value as ExclusionCategory })}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                >
                  <option value="auth">Auth-Required</option>
                  <option value="callback">OAuth Callback</option>
                  <option value="static">Static File</option>
                  <option value="admin">Admin Page</option>
                  <option value="api">API Endpoint</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description (optional)</label>
              <textarea
                id="description"
                placeholder="Describe why this pattern is excluded..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md bg-background resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-border flex justify-end gap-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm rounded-md border border-border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createExclusion.isPending || updateExclusion.isPending}
              className={cn(
                "px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {pattern ? 'Update' : 'Create'} Pattern
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
