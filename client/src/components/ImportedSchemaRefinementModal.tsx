import { X, Sparkles, Zap } from 'lucide-react'

interface ImportedSchemaRefinementModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function ImportedSchemaRefinementModal({
  isOpen,
  onClose,
  onConfirm
}: ImportedSchemaRefinementModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4 pr-8">
          <div className="flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              🚀 Ready to Supercharge Your Schema?
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Level up your imported schema with AI
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-md p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Zap className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-foreground">What happens next?</span>
            </div>
            <ul className="text-sm text-muted-foreground space-y-2 ml-6 list-disc">
              <li>AI analyzes and optimizes your schema for search engines</li>
              <li>Enhanced for AEO (Answer Engine Optimization)</li>
              <li>Improved visibility in AI-powered search results</li>
              <li>Future refinements on this schema are FREE! 🎉</li>
            </ul>
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-3">
            <p className="text-sm text-foreground">
              <strong>First-time refinement:</strong> This will use <strong>1 credit</strong> to optimize your imported schema.
              All future refinements and tweaks will be completely free! Worth every credit. 💪
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-md text-sm font-medium transition-all shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
          >
            <Sparkles className="h-4 w-4" />
            <span>Refine with AI (1 credit)</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            Maybe Later
          </button>
        </div>
      </div>
    </div>
  )
}
