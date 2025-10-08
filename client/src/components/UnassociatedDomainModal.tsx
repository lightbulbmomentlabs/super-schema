import { X, AlertTriangle } from 'lucide-react'
import { extractDomain } from '@/utils/domain'

interface UnassociatedDomainModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  onGoToSettings: () => void
}

export default function UnassociatedDomainModal({
  isOpen,
  onClose,
  url,
  onGoToSettings
}: UnassociatedDomainModalProps) {
  if (!isOpen) return null

  const domain = extractDomain(url)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-warning/10 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning" />
            </div>
            <h2 className="text-lg font-semibold">Domain Not Associated</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            The domain <span className="font-mono font-medium text-foreground">{domain}</span> is not associated with any of your connected HubSpot portals.
          </p>

          <div className="bg-info/10 border border-info/20 rounded-lg p-4">
            <p className="text-sm text-info-foreground">
              <strong>To push schema to this domain:</strong>
            </p>
            <ol className="text-sm text-info-foreground mt-2 space-y-1 list-decimal list-inside">
              <li>Go to HubSpot settings</li>
              <li>Expand your HubSpot connection</li>
              <li>Add <span className="font-mono">{domain}</span> to the associated domains</li>
            </ol>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onGoToSettings}
            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
          >
            Go to HubSpot Settings
          </button>
        </div>
      </div>
    </div>
  )
}
