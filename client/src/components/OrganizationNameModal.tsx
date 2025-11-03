import { X } from 'lucide-react'
import { useState } from 'react'

interface OrganizationNameModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (organizationName: string) => Promise<void>
  currentValue?: string
}

export default function OrganizationNameModal({
  isOpen,
  onClose,
  onSave,
  currentValue = ''
}: OrganizationNameModalProps) {
  const [orgName, setOrgName] = useState(currentValue)
  const [isSaving, setIsSaving] = useState(false)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave(orgName.trim())
      onClose()
    } catch (error) {
      console.error('Error saving organization name:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSkip = () => {
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-semibold">Set Organization Name</h2>
            <button
              onClick={handleSkip}
              className="text-muted-foreground hover:text-foreground transition-colors"
              disabled={isSaving}
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <p className="text-muted-foreground mb-4">
              Add your organization or company name to personalize team invitations.
              This will be displayed to people you invite to join your team.
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Organization / Company Name (Optional)
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="e.g., Acme Corporation"
                className="w-full px-3 py-2 bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                maxLength={100}
                disabled={isSaving}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                You can always update this later in your account settings.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 px-6 pb-6">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors"
              disabled={isSaving}
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || orgName.trim() === ''}
              className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
