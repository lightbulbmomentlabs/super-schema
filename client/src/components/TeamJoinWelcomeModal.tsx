import { CheckCircle, Users, Building2 } from 'lucide-react'

interface TeamJoinWelcomeModalProps {
  isOpen: boolean
  onClose: () => void
  organizationName?: string
  teamOwnerName?: string
  memberCount?: number
}

export default function TeamJoinWelcomeModal({
  isOpen,
  onClose,
  organizationName,
  teamOwnerName,
  memberCount = 1
}: TeamJoinWelcomeModalProps) {
  if (!isOpen) return null

  const teamDisplayName = organizationName || teamOwnerName || 'the team'

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header with success icon */}
          <div className="flex flex-col items-center justify-center p-8 pb-6 text-center">
            <div className="p-4 bg-primary/10 rounded-full w-fit mb-4">
              <CheckCircle className="h-12 w-12 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">
              Welcome to {teamDisplayName}!
            </h2>
            <p className="text-muted-foreground">
              You've successfully joined the team. Start collaborating on schemas together!
            </p>
          </div>

          {/* Team Info */}
          <div className="px-8 pb-6 space-y-3">
            {organizationName && (
              <div className="flex items-center space-x-3 p-4 bg-accent rounded-lg">
                <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization</p>
                  <p className="font-semibold">{organizationName}</p>
                </div>
              </div>
            )}

            <div className="flex items-center space-x-3 p-4 bg-accent rounded-lg">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team size</p>
                <p className="font-semibold">{memberCount} {memberCount === 1 ? 'member' : 'members'}</p>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="px-8 pb-8">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
