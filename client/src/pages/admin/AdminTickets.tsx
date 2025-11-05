import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Filter,
  Trash2
} from 'lucide-react'
import { apiService } from '@/services/api'
import type { SupportTicket } from '@shared/types'
import ConfirmModal from '@/components/ConfirmModal'
import TicketDetailsModal from '@/components/TicketDetailsModal'
import { markTabAsViewed } from '@/hooks/useAdminBadgeCounts'

export default function AdminTickets() {
  const queryClient = useQueryClient()
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null)

  // Mark this tab as viewed when component mounts
  // This resets the badge count for the Tickets tab
  useEffect(() => {
    markTabAsViewed('tickets')
  }, [])

  // Support tickets query
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['admin-support-tickets'],
    queryFn: () => apiService.getSupportTickets()
  })

  // Delete single ticket mutation
  const deleteSingleTicket = useMutation({
    mutationFn: (ticketId: string) => apiService.deleteSupportTicket(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
    }
  })

  // Batch delete tickets mutation
  const batchDeleteTickets = useMutation({
    mutationFn: (ticketIds: string[]) => apiService.batchDeleteSupportTickets(ticketIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] })
      setSelectedTickets(new Set())
      setShowBatchDeleteConfirm(false)
    }
  })

  const allTickets = ticketsData?.data || []
  const filteredTickets = categoryFilter === 'all'
    ? allTickets
    : allTickets.filter(ticket => ticket.category === categoryFilter)

  const handleToggleTicket = (ticketId: string) => {
    const newSelected = new Set(selectedTickets)
    if (newSelected.has(ticketId)) {
      newSelected.delete(ticketId)
    } else {
      newSelected.add(ticketId)
    }
    setSelectedTickets(newSelected)
  }

  const handleToggleAllTickets = () => {
    if (selectedTickets.size === filteredTickets.length) {
      setSelectedTickets(new Set())
    } else {
      setSelectedTickets(new Set(filteredTickets.map(t => t.id)))
    }
  }

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
        return 'General'
      case 'feature_request':
        return 'Feature Request'
      case 'bug_report':
        return 'Bug Report'
      default:
        return category
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Support Tickets</h2>
        <p className="text-muted-foreground mt-1">
          View and manage user support requests
        </p>
      </div>

      {/* Support Tickets Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">All Tickets</h2>
          </div>
          {selectedTickets.size > 0 && (
            <button
              onClick={() => setShowBatchDeleteConfirm(true)}
              className="px-3 py-1.5 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              Delete Selected ({selectedTickets.size})
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Categories</option>
            <option value="general">General Questions</option>
            <option value="feature_request">Feature Requests</option>
            <option value="bug_report">Bug Reports</option>
          </select>
          <span className="text-sm text-muted-foreground">
            ({filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''})
          </span>
        </div>

        {/* Tickets Table */}
        {ticketsLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading tickets...</p>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No support tickets found</p>
          </div>
        ) : (
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30">
                <tr className="border-b border-border">
                  <th className="px-4 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTickets.size === filteredTickets.length && filteredTickets.length > 0}
                      onChange={handleToggleAllTickets}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Category</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Message</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Date</th>
                  <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    className="border-b border-border hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setViewingTicket(ticket)}
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTickets.has(ticket.id)}
                        onChange={() => handleToggleTicket(ticket.id)}
                        className="rounded border-border"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${getCategoryBadgeColor(ticket.category)}`}>
                        {getCategoryLabel(ticket.category)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm line-clamp-2" title={ticket.message}>
                        {ticket.message.length > 100
                          ? `${ticket.message.substring(0, 100)}...`
                          : ticket.message
                        }
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <p className="font-medium">{ticket.userName}</p>
                        <p className="text-muted-foreground">{ticket.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      className="px-4 py-3 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => deleteSingleTicket.mutate(ticket.id)}
                        disabled={deleteSingleTicket.isPending}
                        className="text-red-600 hover:text-red-700 disabled:opacity-50"
                        title="Delete ticket"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Batch Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showBatchDeleteConfirm}
        onClose={() => setShowBatchDeleteConfirm(false)}
        onConfirm={() => batchDeleteTickets.mutate(Array.from(selectedTickets))}
        title="Delete Support Tickets"
        message={`Are you sure you want to delete ${selectedTickets.size} support ticket(s)? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={viewingTicket}
        isOpen={viewingTicket !== null}
        onClose={() => setViewingTicket(null)}
      />
    </div>
  )
}
