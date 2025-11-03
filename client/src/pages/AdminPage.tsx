import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import {
  Shield,
  Search,
  Users,
  TrendingUp,
  CreditCard,
  Sparkles,
  Trash2,
  Plus,
  Minus,
  X,
  Activity,
  MessageSquare,
  Filter,
  Bell,
  AlertCircle
} from 'lucide-react'
import { apiService } from '@/services/api'
import type { User, SupportTicket, ReleaseNote } from '@shared/types'
import ConfirmModal from '@/components/ConfirmModal'
import TicketDetailsModal from '@/components/TicketDetailsModal'
import AdminErrorsSection from '@/components/AdminErrorsSection'

export default function AdminPage() {
  const { user: currentUser, isLoaded, isSignedIn } = useUser()
  const queryClient = useQueryClient()

  // Log auth status on mount for debugging
  useEffect(() => {
    console.log('🔐 [AdminPage] Auth Status Check:', {
      isLoaded,
      isSignedIn,
      hasUser: !!currentUser,
      userId: currentUser?.id,
      userEmail: currentUser?.emailAddresses[0]?.emailAddress,
      timestamp: new Date().toISOString()
    })
  }, [isLoaded, isSignedIn, currentUser])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState<string>('')
  const [creditReason, setCreditReason] = useState('')
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Support tickets state
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set())
  const [showBatchDeleteConfirm, setShowBatchDeleteConfirm] = useState(false)
  const [viewingTicket, setViewingTicket] = useState<SupportTicket | null>(null)

  // Release notes state
  const [showReleaseNoteForm, setShowReleaseNoteForm] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')
  const [noteCategory, setNoteCategory] = useState<'new_feature' | 'enhancement' | 'performance' | 'bug_fix'>('new_feature')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [notePublished, setNotePublished] = useState(false)

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Admin'
  }, [])

  // Fetch platform stats - this will fail with 403 if user is not admin
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ['admin-platform-stats'],
    queryFn: () => apiService.getPlatformStats(),
    retry: false // Don't retry on 403
  })

  // Get all users (loads on mount)
  const { data: allUsersData, isLoading: allUsersLoading } = useQuery({
    queryKey: ['admin-all-users'],
    queryFn: () => apiService.getAllUsers(100, 0)
  })

  // Search users
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['admin-search-users', searchQuery],
    queryFn: () => apiService.searchUsers(searchQuery),
    enabled: searchQuery.length > 0
  })

  // Get user details
  const { data: userDetailsData, isLoading: detailsLoading } = useQuery({
    queryKey: ['admin-user-details', selectedUser?.id],
    queryFn: () => apiService.getUserDetails(selectedUser!.id),
    enabled: !!selectedUser
  })

  // Modify credits mutation
  const modifyCredits = useMutation({
    mutationFn: ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) =>
      apiService.modifyUserCredits(userId, amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', selectedUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] })
      setShowCreditModal(false)
      setCreditAmount('')
      setCreditReason('')
    }
  })

  // Delete user mutation
  const deleteUser = useMutation({
    mutationFn: (userId: string) => apiService.deleteUserCompletely(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-platform-stats'] })
      setSelectedUser(null)
      setShowDeleteConfirm(false)
    }
  })

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

  // Release notes query
  const { data: releaseNotesData, isLoading: releaseNotesLoading } = useQuery({
    queryKey: ['admin-release-notes'],
    queryFn: () => apiService.getAllReleaseNotes()
  })

  // Create release note mutation
  const createReleaseNote = useMutation({
    mutationFn: (data: any) => apiService.createReleaseNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-release-notes'] })
      setShowReleaseNoteForm(false)
      setNoteTitle('')
      setNoteDescription('')
      setNoteCategory('new_feature')
      setNoteDate(new Date().toISOString().split('T')[0])
      setNotePublished(false)
    }
  })

  // Delete release note mutation
  const deleteReleaseNote = useMutation({
    mutationFn: (noteId: string) => apiService.deleteReleaseNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-release-notes'] })
    }
  })

  const stats = statsData?.data || {
    totalUsers: 0,
    activeUsers: 0,
    totalSchemas: 0,
    totalCreditsDistributed: 0,
    totalCreditsUsed: 0
  }

  const userDetails = userDetailsData?.data
  const allUsers = allUsersData?.data || []
  const searchedUsers = searchResults?.data || []

  // Display searched users if there's a query, otherwise show all users
  const displayedUsers = searchQuery.length > 0 ? searchedUsers : allUsers

  // Support tickets filtering
  const allTickets = ticketsData?.data || []
  const filteredTickets = categoryFilter === 'all'
    ? allTickets
    : allTickets.filter(ticket => ticket.category === categoryFilter)

  // Release notes data
  const allReleaseNotes = releaseNotesData?.data || []

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

  const handleOpenCreditModal = (isAdd: boolean) => {
    setCreditAmount('')
    setCreditReason(isAdd ? 'Admin credit adjustment - added' : 'Admin credit adjustment - deducted')
    setShowCreditModal(true)
  }

  const handleSubmitCredits = () => {
    if (!selectedUser || !creditAmount || !creditReason) return

    const amount = parseInt(creditAmount)
    if (isNaN(amount)) return

    modifyCredits.mutate({
      userId: selectedUser.id,
      amount,
      reason: creditReason
    })
  }

  const handleCreateReleaseNote = () => {
    if (!noteTitle || !noteDescription || !noteDate) return

    createReleaseNote.mutate({
      title: noteTitle,
      description: noteDescription,
      category: noteCategory,
      releaseDate: noteDate,
      isPublished: notePublished
    })
  }

  // Check if user has admin access - 403 error means not authorized
  const isAccessDenied = statsError && (statsError as any)?.response?.status === 403

  // Show access denied screen if user is not authorized
  if (isAccessDenied) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <div className="mb-4 flex justify-center">
              <div className="rounded-full bg-destructive p-3">
                <Shield className="h-8 w-8 text-destructive-foreground" />
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">
              You don't have permission to access the admin panel. This area is restricted to authorized administrators only.
            </p>
            <div className="space-y-2 text-sm text-left bg-muted/50 p-4 rounded-md mb-6">
              <p className="font-medium">Current User:</p>
              <p className="text-muted-foreground">{currentUser?.emailAddresses[0]?.emailAddress}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              If you believe you should have access, please contact the system administrator.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Manage users, credits, and platform stats
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Logged in as</p>
          <p className="font-semibold">{currentUser?.emailAddresses[0]?.emailAddress}</p>
        </div>
      </div>

      {/* Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Users</p>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalUsers}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Active Users</p>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.activeUsers}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Total Schemas</p>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalSchemas}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Credits Given</p>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalCreditsDistributed}</p>
        </div>

        <div className="rounded-lg border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-muted-foreground">Credits Used</p>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold">{statsLoading ? '...' : stats.totalCreditsUsed}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User List */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">
            {searchQuery ? 'Search Results' : 'All Users'}
          </h2>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {(searchLoading || allUsersLoading) && (
            <p className="text-sm text-muted-foreground text-center py-4">Loading...</p>
          )}

          {!searchLoading && !allUsersLoading && displayedUsers.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery ? 'No users found' : 'No users in system'}
            </p>
          )}

          {!searchLoading && !allUsersLoading && displayedUsers.length > 0 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayedUsers.map((user) => (
                <button
                  key={user.id}
                  onClick={() => setSelectedUser(user)}
                  className={`w-full p-3 border rounded-md text-left transition-colors ${
                    selectedUser?.id === user.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border bg-muted/30 hover:bg-muted/50'
                  }`}
                >
                  <p className="font-medium">{user.email}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-sm text-muted-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-sm font-semibold">{user.creditBalance} credits</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Details */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>

          {!selectedUser && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Select a user to view details</p>
            </div>
          )}

          {selectedUser && detailsLoading && (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          )}

          {selectedUser && !detailsLoading && userDetails && (
            <div className="space-y-4">
              {/* User Info */}
              <div className="p-4 border border-border rounded-md bg-muted/30">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-lg">{userDetails.user.email}</p>
                    <p className="text-sm text-muted-foreground">
                      {userDetails.user.firstName} {userDetails.user.lastName}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    userDetails.user.isActive
                      ? 'bg-success text-success-foreground'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {userDetails.user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Credit Balance</p>
                    <p className="font-semibold text-lg">{userDetails.user.creditBalance}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Used</p>
                    <p className="font-semibold text-lg">{userDetails.user.totalCreditsUsed}</p>
                  </div>
                </div>
              </div>

              {/* LTV - Lifetime Value */}
              {userDetails.stats && (
                <div className="p-4 border-2 border-success rounded-md bg-success">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-success-foreground mb-1">Lifetime Value (LTV)</p>
                      <p className="text-3xl font-bold text-success-foreground">
                        ${((userDetails.stats.total_spent_cents || 0) / 100).toFixed(2)}
                      </p>
                    </div>
                    <CreditCard className="h-10 w-10 text-success-foreground" />
                  </div>
                  <p className="text-xs text-success-foreground mt-2">
                    Total spent on credit purchases
                  </p>
                </div>
              )}

              {/* Stats */}
              {userDetails.stats && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 border border-border rounded-md bg-background">
                    <p className="text-xs text-muted-foreground">Total Schemas</p>
                    <p className="text-xl font-bold">{userDetails.stats.total_schemas_generated || 0}</p>
                  </div>
                  <div className="p-3 border border-border rounded-md bg-background">
                    <p className="text-xs text-muted-foreground">Successful</p>
                    <p className="text-xl font-bold">{userDetails.stats.successful_generations || 0}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-border">
                <p className="text-xs font-medium text-muted-foreground mb-2">Actions</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenCreditModal(true)}
                    className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5"
                  >
                    <Plus className="h-3 w-3" />
                    Add Credits
                  </button>
                  <button
                    onClick={() => handleOpenCreditModal(false)}
                    className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5"
                  >
                    <Minus className="h-3 w-3" />
                    Deduct
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-3 w-3" />
                    Delete
                  </button>
                </div>
              </div>

              {/* Account Information */}
              <div className="pt-4 border-t border-border">
                <h3 className="font-semibold mb-2">Account Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">User ID</span>
                    <span className="font-mono text-xs">{userDetails.user.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Member Since</span>
                    <span className="font-medium">
                      {new Date(userDetails.user.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Age</span>
                    <span className="font-medium">
                      {(() => {
                        const accountAge = Math.floor(
                          (Date.now() - new Date(userDetails.user.createdAt).getTime()) / (1000 * 60 * 60 * 24)
                        )
                        if (accountAge < 30) return `${accountAge} days`
                        if (accountAge < 365) return `${Math.floor(accountAge / 30)} months`
                        return `${Math.floor(accountAge / 365)} years`
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              {userDetails.activity && userDetails.activity.length > 0 && (
                <div className="pt-4 border-t border-border">
                  <h3 className="font-semibold mb-2">Recent Activity</h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {userDetails.activity.slice(0, 5).map((activity: any, index: number) => (
                      <div key={index} className="p-2 border border-border rounded-md bg-muted/20 text-xs">
                        <p className="font-medium capitalize">
                          {activity.action.replace(/_/g, ' ')}
                        </p>
                        {activity.metadata && (
                          <p className="text-muted-foreground">
                            {JSON.stringify(activity.metadata)}
                          </p>
                        )}
                        <p className="text-muted-foreground mt-1">
                          {new Date(activity.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Support Tickets Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Support Tickets</h2>
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

      {/* Error Logs Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold">Error Logs</h2>
        </div>
        <AdminErrorsSection />
      </div>

      {/* Release Notes Management Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Release Notes Management</h2>
          </div>
          <button
            onClick={() => setShowReleaseNoteForm(!showReleaseNoteForm)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {showReleaseNoteForm ? 'Cancel' : 'Add Release Note'}
          </button>
        </div>

        {/* Create Release Note Form */}
        {showReleaseNoteForm && (
          <div className="mb-6 p-4 border border-border rounded-md bg-muted/20">
            <h3 className="font-semibold mb-3">Create New Release Note</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Brief, catchy title (5-8 words)"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  placeholder="User-friendly description with a touch of humor..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="new_feature">New Feature</option>
                    <option value="enhancement">Enhancement</option>
                    <option value="performance">Performance</option>
                    <option value="bug_fix">Bug Fix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Release Date</label>
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={notePublished}
                  onChange={(e) => setNotePublished(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publish immediately
                </label>
              </div>
              <button
                onClick={handleCreateReleaseNote}
                disabled={!noteTitle || !noteDescription || createReleaseNote.isPending}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReleaseNote.isPending ? 'Creating...' : 'Create Release Note'}
              </button>
            </div>
          </div>
        )}

        {/* Release Notes List */}
        {releaseNotesLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading release notes...</p>
        ) : allReleaseNotes.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No release notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allReleaseNotes.map((note: ReleaseNote) => (
              <div key={note.id} className="p-4 border border-border rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{note.title}</h4>
                      {!note.isPublished && (
                        <span className="px-2 py-0.5 text-xs bg-warning text-warning-foreground rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{note.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{note.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(note.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReleaseNote.mutate(note.id)}
                    disabled={deleteReleaseNote.isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 p-2"
                    title="Delete release note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
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

      {/* Credit Modal */}
      {showCreditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Modify Credits</h3>
              <button
                onClick={() => {
                  setShowCreditModal(false)
                  setCreditAmount('')
                  setCreditReason('')
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount (positive to add, negative to deduct)"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Use positive numbers to add, negative to deduct
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reason</label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Why are you modifying credits?"
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreditModal(false)
                    setCreditAmount('')
                    setCreditReason('')
                  }}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitCredits}
                  disabled={!creditAmount || !creditReason || modifyCredits.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {modifyCredits.isPending ? 'Saving...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-destructive-foreground">Delete User</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm">
                Are you sure you want to permanently delete <strong>{selectedUser.email}</strong>?
              </p>
              <p className="text-sm text-muted-foreground">
                This will delete all user data including schemas, transactions, and activity. This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteUser.mutate(selectedUser.id)}
                  disabled={deleteUser.isPending}
                  className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleteUser.isPending ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      <TicketDetailsModal
        ticket={viewingTicket}
        isOpen={viewingTicket !== null}
        onClose={() => setViewingTicket(null)}
      />
    </div>
  )
}
