import { X } from 'lucide-react'
import SuperSchemaIcon from './icons/SuperSchemaIcon'

interface BatchConfirmModalProps {
  isOpen: boolean
  urlCount: number
  creditCost: number
  onConfirm: () => void
  onCancel: () => void
}

export default function BatchConfirmModal({
  isOpen,
  urlCount,
  creditCost,
  onConfirm,
  onCancel
}: BatchConfirmModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card border-2 border-border rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <SuperSchemaIcon className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold">Ready to Batch Generate?</h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-accent rounded-md transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-muted-foreground">
            You're about to generate schemas for <span className="font-bold text-foreground">{urlCount}</span> URL{urlCount > 1 ? 's' : ''} at once.
            Our AI will work its magic and have them ready in no time! ✨
          </p>

          {/* Cost breakdown */}
          <div className="p-4 bg-muted/30 rounded-lg border border-border">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">URLs selected:</span>
              <span className="font-semibold">{urlCount}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Cost per URL:</span>
              <span className="font-semibold">1 credit</span>
            </div>
            <div className="border-t border-border pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Total cost:</span>
                <div className="flex items-center gap-1">
                  <SuperSchemaIcon className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-primary">{creditCost} credit{creditCost > 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
            <p className="text-sm text-primary font-medium">
              💡 Pro tip: All URLs will use Auto-Detect to find the best schema type automatically!
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 border border-border rounded-md hover:bg-accent transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <SuperSchemaIcon className="h-4 w-4" />
            Let's Go!
          </button>
        </div>
      </div>
    </div>
  )
}
