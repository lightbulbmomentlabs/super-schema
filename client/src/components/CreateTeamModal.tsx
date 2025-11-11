import { useState } from 'react'
import { X, Users, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'

interface CreateTeamModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (organizationName?: string) => Promise<void>
  isCreating: boolean
}

export default function CreateTeamModal({
  isOpen,
  onClose,
  onCreate,
  isCreating
}: CreateTeamModalProps) {
  const [organizationName, setOrganizationName] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onCreate(organizationName.trim() || undefined)
  }

  const handleClose = () => {
    if (!isCreating) {
      setOrganizationName('')
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-background border border-border rounded-lg shadow-lg max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Create New Team</h2>
              <p className="text-sm text-muted-foreground">Start fresh with 2 free credits</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isCreating}
            className="p-2 hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-2">
            <label htmlFor="organizationName" className="text-sm font-medium">
              Organization Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="organizationName"
              type="text"
              value={organizationName}
              onChange={(e) => setOrganizationName(e.target.value)}
              placeholder="e.g., Acme Inc."
              disabled={isCreating}
              className={cn(
                'w-full px-3 py-2 rounded-md border border-border bg-background',
                'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'placeholder:text-muted-foreground'
              )}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">
              Give your team a recognizable name. You can change this later in settings.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCreating}
              className="px-4 py-2 text-sm font-medium rounded-md hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-md',
                'bg-primary text-primary-foreground',
                'hover:bg-primary/90 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                'flex items-center space-x-2'
              )}
            >
              {isCreating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <span>Create Team</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
