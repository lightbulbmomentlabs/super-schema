import { X, Lightbulb } from 'lucide-react'

interface SchemaMismatchModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  requestedType: string
  suggestedAlternatives: string[]
  errorMessage: string
  onTryAutoDetect: () => void
  onSelectAlternative: (type: string) => void
}

export default function SchemaMismatchModal({
  isOpen,
  onClose,
  url,
  requestedType,
  suggestedAlternatives,
  errorMessage,
  onTryAutoDetect,
  onSelectAlternative
}: SchemaMismatchModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg p-6 w-full max-w-md relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon Header - Super Thinking */}
          <div className="flex items-center justify-center mb-4">
            <img
              src="/super-schema-thinking.png"
              alt="Schema Type Mismatch"
              className="w-[120px] h-auto"
            />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground text-center mb-2">
            Content Doesn't Match Schema Type
          </h3>

          {/* Subtitle - Schema type specific */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            We scanned this page but couldn't find{' '}
            <span className="font-semibold text-primary">{requestedType}</span> content.
            Our AI won't make things up — that's a feature, not a bug!
          </p>

          {/* URL Display */}
          <div className="bg-muted/50 rounded-md p-3 mb-4">
            <p className="text-xs font-mono text-foreground break-all">
              {url}
            </p>
          </div>

          {/* Explanation */}
          <div className="mb-4 p-3 bg-orange-500/5 rounded-md border border-orange-500/20">
            <p className="text-sm text-muted-foreground">
              {errorMessage}
            </p>
          </div>

          {/* Suggested Alternatives */}
          {suggestedAlternatives.length > 0 && (
            <div className="mb-6">
              <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-yellow-500" />
                Based on your page content, try:
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedAlternatives.map((type) => (
                  <button
                    key={type}
                    onClick={() => onSelectAlternative(type)}
                    className="px-3 py-1.5 text-sm bg-primary/10 text-primary rounded-md hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onTryAutoDetect}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Let AI Auto-Detect Best Schema
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Educational Tip */}
          <div className="mt-4 p-3 bg-blue-500/5 rounded-md border border-blue-500/20">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-blue-500">Pro Tip:</span> Use "Auto-Detect" for best results.
              Only select specific schema types when you're certain the page contains that content.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
