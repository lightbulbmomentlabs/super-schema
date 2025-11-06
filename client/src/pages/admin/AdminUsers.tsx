import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search,
  Users,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  X,
  Shield,
  ShieldCheck
} from 'lucide-react'
import { apiService } from '@/services/api'
import type { User } from '@shared/types'
import { markTabAsViewed } from '@/hooks/useAdminBadgeCounts'

export default function AdminUsers() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditAmount, setCreditAmount] = useState<string>('')
  const [creditReason, setCreditReason] = useState('')
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showAdminConfirm, setShowAdminConfirm] = useState(false)
  const [pendingAdminStatus, setPendingAdminStatus] = useState<boolean>(false)

  // Mark this tab as viewed when component mounts
  // This resets the badge count for the Users tab
  useEffect(() => {
    markTabAsViewed('users')
  }, [])

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

  // Toggle admin status mutation
  const toggleAdminStatus = useMutation({
    mutationFn: ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) =>
      apiService.toggleAdminStatus(userId, isAdmin),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-user-details', selectedUser?.id] })
      queryClient.invalidateQueries({ queryKey: ['admin-search-users'] })
      queryClient.invalidateQueries({ queryKey: ['admin-all-users'] })
      setShowAdminConfirm(false)
      // Show success message
      if (response.data) {
        console.log(response.message)
      }
    }
  })

  const allUsers = allUsersData?.data || []
  const searchedUsers = searchResults?.data || []
  const displayedUsers = searchQuery.length > 0 ? searchedUsers : allUsers
  const userDetails = userDetailsData?.data

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-muted-foreground mt-1">
          Search, view, and manage user accounts and credits
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-280px)]">
        {/* User List */}
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col">
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
            <div className="space-y-2 flex-1 overflow-y-auto">
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
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{user.email}</p>
                    {user.isAdmin && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        <ShieldCheck className="h-3 w-3" />
                        Admin
                      </span>
                    )}
                  </div>
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
        <div className="rounded-lg border border-border bg-card p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">User Details</h2>

          {!selectedUser && (
            <div className="flex flex-col items-center justify-center flex-1 text-center">
              <Users className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">Select a user to view details</p>
            </div>
          )}

          {selectedUser && detailsLoading && (
            <p className="text-center py-12 text-muted-foreground">Loading...</p>
          )}

          {selectedUser && !detailsLoading && userDetails && (
            <div className="space-y-4 flex-1 overflow-y-auto">
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
                    onClick={() => {
                      setPendingAdminStatus(!userDetails.user.isAdmin)
                      setShowAdminConfirm(true)
                    }}
                    className={`px-3 py-1.5 text-xs border border-border rounded-md hover:bg-muted transition-colors flex items-center gap-1.5 ${
                      userDetails.user.isAdmin
                        ? 'text-orange-600 hover:text-orange-700'
                        : 'text-blue-600 hover:text-blue-700'
                    }`}
                  >
                    {userDetails.user.isAdmin ? (
                      <>
                        <Shield className="h-3 w-3" />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="h-3 w-3" />
                        Make Admin
                      </>
                    )}
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

      {/* Admin Status Confirm Modal */}
      {showAdminConfirm && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                {pendingAdminStatus ? (
                  <>
                    <ShieldCheck className="h-5 w-5 text-blue-600" />
                    Grant Admin Privileges
                  </>
                ) : (
                  <>
                    <Shield className="h-5 w-5 text-orange-600" />
                    Revoke Admin Privileges
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowAdminConfirm(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-sm">
                Are you sure you want to {pendingAdminStatus ? 'grant admin privileges to' : 'revoke admin privileges from'}{' '}
                <strong>{selectedUser.email}</strong>?
              </p>
              {pendingAdminStatus ? (
                <p className="text-sm text-muted-foreground">
                  This user will have full access to the admin dashboard and can manage all users, view analytics, and access platform settings.
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  This user will lose access to the admin dashboard and all admin features. They will retain their regular user account.
                </p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdminConfirm(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-md hover:bg-muted/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedUser) {
                      toggleAdminStatus.mutate({ userId: selectedUser.id, isAdmin: pendingAdminStatus })
                    }
                  }}
                  disabled={toggleAdminStatus.isPending}
                  className={`flex-1 px-4 py-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    pendingAdminStatus
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-orange-600 text-white hover:bg-orange-700'
                  }`}
                >
                  {toggleAdminStatus.isPending ? 'Updating...' : pendingAdminStatus ? 'Grant Admin' : 'Revoke Admin'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
