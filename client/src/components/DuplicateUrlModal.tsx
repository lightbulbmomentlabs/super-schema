import { AlertCircle, ExternalLink, X } from 'lucide-react'
import { formatDate } from '@shared/utils'
import LightningBoltIcon from './icons/LightningBoltIcon'

interface DuplicateUrlModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  createdAt?: string
  onViewExisting: () => void
  onGenerateAnyway: () => void
}

export default function DuplicateUrlModal({
  isOpen,
  onClose,
  url,
  createdAt,
  onViewExisting,
  onGenerateAnyway
}: DuplicateUrlModalProps) {
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
          <div className="flex-shrink-0">
            <AlertCircle className="h-6 w-6 text-yellow-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Schema Already Exists
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              You've already generated schema for this URL
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-muted/50 rounded-md p-3 mb-3">
            <p className="text-sm font-medium text-foreground break-all">
              {url}
            </p>
            {createdAt && (
              <p className="text-xs text-muted-foreground mt-1">
                Generated {formatDate(createdAt)}
              </p>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Generating again will use 1 credit. You can view your existing schema in the Library instead.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button
            onClick={onViewExisting}
            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
          >
            <ExternalLink className="h-4 w-4" />
            <span>View Schema</span>
          </button>
          <button
            onClick={onGenerateAnyway}
            className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center justify-center space-x-2"
          >
            <LightningBoltIcon className="h-4 w-4" />
            <span>Generate Anyway</span>
          </button>
        </div>
      </div>
    </div>
  )
}
