import { AlertCircle, X, Edit } from 'lucide-react'
import LightningBoltIcon from './icons/LightningBoltIcon'

interface PreExistingSchemaModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  schemaCount: number
  onCancel: () => void
  onEditAndEnhance: () => void
  onGenerateNew: () => void
}

export default function PreExistingSchemaModal({
  isOpen,
  onClose,
  url,
  schemaCount,
  onCancel,
  onEditAndEnhance,
  onGenerateNew
}: PreExistingSchemaModalProps) {
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
            <AlertCircle className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Basic Schema Detected
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              This page already contains schema markup
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-muted/50 rounded-md p-3 mb-3">
            <p className="text-sm font-medium text-foreground break-all">
              {url}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {schemaCount} {schemaCount === 1 ? 'schema' : 'schemas'} found
            </p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            We detected existing JSON-LD schema on this page. You can:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
            <li>
              <strong className="text-foreground">Generate Super Schema:</strong> Create fresh schema with AI (1 credit)
            </li>
            <li>
              <strong className="text-foreground">Edit & Enhance:</strong> Load existing schema into editor (free, optional 1-credit AI refinement)
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onGenerateNew}
            className="w-full px-4 py-2.5 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center space-x-2"
          >
            <LightningBoltIcon className="h-4 w-4" />
            <span>Generate Super Schema</span>
          </button>
          <div className="flex gap-3">
            <button
              onClick={onEditAndEnhance}
              className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium text-foreground hover:bg-accent transition-colors flex items-center justify-center space-x-2"
            >
              <Edit className="h-4 w-4" />
              <span>Edit & Enhance</span>
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
