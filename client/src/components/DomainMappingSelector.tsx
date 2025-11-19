import { motion } from 'framer-motion'
import { Globe, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useState } from 'react'
import type { GA4DomainMapping } from '@/services/ga4'

interface DomainMappingSelectorProps {
  mappings: GA4DomainMapping[]
  selectedMappingId: string | null
  onSelect: (mappingId: string) => void
  onCreateNew?: () => void
  onDelete?: (mappingId: string) => void
  isLoading?: boolean
  isDeleting?: boolean
  className?: string
}

export default function DomainMappingSelector({
  mappings,
  selectedMappingId,
  onSelect,
  onCreateNew,
  onDelete,
  isLoading = false,
  isDeleting = false,
  className = ''
}: DomainMappingSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const selectedMapping = mappings.find(m => m.id === selectedMappingId)

  const handleDelete = (mappingId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (deleteConfirmId === mappingId) {
      onDelete?.(mappingId)
      setDeleteConfirmId(null)
      setIsOpen(false)
    } else {
      setDeleteConfirmId(mappingId)
    }
  }

  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-xl p-4',
        'animate-pulse',
        className
      )}>
        <div className="h-10 bg-muted/20 rounded" />
      </div>
    )
  }

  if (mappings.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'bg-card border border-border rounded-xl p-4',
          className
        )}
      >
        <button
          onClick={onCreateNew}
          className={cn(
            'w-full px-4 py-3 rounded-lg font-medium text-sm',
            'bg-gradient-to-r from-primary to-primary/80',
            'text-primary-foreground',
            'hover:shadow-lg hover:scale-[1.02]',
            'transition-all duration-200',
            'inline-flex items-center justify-center gap-2'
          )}
        >
          <Plus className="h-4 w-4" />
          Connect Your First Domain
        </button>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('relative', className)}
    >
      {/* Selected Domain Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-full bg-card border border-border rounded-xl p-4',
          'hover:border-primary/50 hover:shadow-lg',
          'transition-all duration-200',
          'flex items-center justify-between gap-3',
          isOpen && 'border-primary/50 shadow-lg'
        )}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="inline-flex items-center justify-center rounded-lg bg-primary/10 p-2">
            <Globe className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-foreground truncate">
              {selectedMapping?.domain || 'Select a domain'}
            </p>
            {selectedMapping && (
              <p className="text-xs text-muted-foreground truncate">
                {selectedMapping.propertyName}
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={cn(
          'h-5 w-5 text-muted-foreground transition-transform',
          isOpen && 'rotate-180'
        )} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={cn(
            'absolute top-full left-0 right-0 mt-2 z-50',
            'bg-card border border-border rounded-xl shadow-2xl',
            'overflow-hidden'
          )}
        >
          {/* Domain Options */}
          <div className="max-h-64 overflow-y-auto">
            {mappings.map((mapping, index) => (
              <div
                key={mapping.id}
                className={cn(
                  'relative group',
                  index !== mappings.length - 1 && 'border-b border-border/50'
                )}
              >
                <button
                  onClick={() => {
                    onSelect(mapping.id)
                    setIsOpen(false)
                    setDeleteConfirmId(null)
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left',
                    'hover:bg-muted/20 transition-colors',
                    'flex items-center justify-between gap-3',
                    selectedMappingId === mapping.id && 'bg-primary/5'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Globe className={cn(
                      'h-4 w-4',
                      selectedMappingId === mapping.id ? 'text-primary' : 'text-muted-foreground'
                    )} />
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-medium truncate',
                        selectedMappingId === mapping.id ? 'text-primary' : 'text-foreground'
                      )}>
                        {mapping.domain}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {mapping.propertyName}
                      </p>
                    </div>
                  </div>

                  {/* Delete Button */}
                  {onDelete && (
                    <button
                      onClick={(e) => handleDelete(mapping.id, e)}
                      disabled={isDeleting}
                      className={cn(
                        'p-2 rounded-lg transition-all',
                        deleteConfirmId === mapping.id
                          ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                          : 'opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive',
                        'disabled:opacity-50 disabled:cursor-not-allowed'
                      )}
                      title={deleteConfirmId === mapping.id ? 'Click again to confirm' : 'Delete mapping'}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Add New Domain Button */}
          {onCreateNew && (
            <button
              onClick={() => {
                onCreateNew()
                setIsOpen(false)
              }}
              className={cn(
                'w-full px-4 py-3 text-left',
                'border-t border-border/50',
                'hover:bg-primary/5 transition-colors',
                'flex items-center gap-3',
                'text-primary font-medium text-sm'
              )}
            >
              <Plus className="h-4 w-4" />
              Add New Domain
            </button>
          )}
        </motion.div>
      )}

      {/* Click Outside to Close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setIsOpen(false)
            setDeleteConfirmId(null)
          }}
        />
      )}
    </motion.div>
  )
}
