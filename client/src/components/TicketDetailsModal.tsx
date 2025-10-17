import { X, Mail, User, Calendar, Tag } from 'lucide-react'
import type { SupportTicket } from '@shared/types'

interface TicketDetailsModalProps {
  ticket: SupportTicket | null
  isOpen: boolean
  onClose: () => void
}

export default function TicketDetailsModal({ ticket, isOpen, onClose }: TicketDetailsModalProps) {
  if (!isOpen || !ticket) return null

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'general':
        return 'bg-info text-info-foreground'
      case 'feature_request':
        return 'bg-purple-100 text-purple-800'
      case 'bug_report':
        return 'bg-destructive text-destructive-foreground'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'general':
        return 'General Question'
      case 'feature_request':
        return 'Feature Request'
      case 'bug_report':
        return 'Bug Report'
      default:
        return category
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4 border-b border-border">
            <h2 className="text-xl font-semibold">Support Ticket Details</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 overflow-y-auto">
            {/* Category Badge */}
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              <span className={`px-3 py-1 text-sm rounded-full font-medium ${getCategoryBadgeColor(ticket.category)}`}>
                {getCategoryLabel(ticket.category)}
              </span>
            </div>

            {/* User Information */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="font-semibold">{ticket.userName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="font-semibold">{ticket.userEmail}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Submitted</p>
                  <p className="font-semibold">
                    {new Date(ticket.createdAt).toLocaleString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Message */}
            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Message</h3>
              <div className="p-4 bg-muted/30 rounded-lg border border-border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.message}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Ticket ID:</span> {ticket.id}
                </div>
                <div>
                  <span className="font-medium">Status:</span>{' '}
                  <span className="capitalize">{ticket.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 pt-4 border-t border-border bg-muted/20">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
