import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import { useTeamContext } from '@/contexts/TeamContext'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import {
  Users,
  Crown,
  Mail,
  Trash2,
  Share2,
  Copy,
  Check,
  LogOut,
  Loader2,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import OrganizationNameModal from '@/components/OrganizationNameModal'

export default function TeamSettingsPage() {
  const navigate = useNavigate()
  const { userId, isLoaded } = useAuth()
  const queryClient = useQueryClient()
  const [copiedInvite, setCopiedInvite] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [inviteToDelete, setInviteToDelete] = useState<string | null>(null)
  const [showOrgNameModal, setShowOrgNameModal] = useState(false)

  const {
    currentTeam,
    teamMembers,
    isLoadingMembers,
    isTeamOwner,
    createInvite,
    isCreatingInvite,
    removeMember,
    isRemovingMember,
    leaveTeam,
    isLeavingTeam,
    refetchMembers,
    teamInvites,
    isLoadingInvites,
    deleteInvite,
    isDeletingInvite,
    refetchInvites
  } = useTeamContext()

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Team Settings'
  }, [])

  // Get user profile to check for organization name
  const { data: userProfileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiService.getProfile(),
    enabled: isLoaded // Wait for Clerk to load before fetching
  })

  const userProfile = userProfileData?.data

  // Mutation for updating organization name
  const updateOrgMutation = useMutation({
    mutationFn: (organizationName: string) =>
      apiService.updateProfile({ organizationName }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
      toast.success('Organization name saved successfully')
    },
    onError: () => {
      toast.error('Failed to save organization name')
    }
  })

  const handleCreateInvite = async () => {
    // Check if user has organization name set
    if (isTeamOwner && !userProfile?.organizationName) {
      // Show modal to prompt for organization name
      setShowOrgNameModal(true)
      return
    }

    // Proceed with creating invite
    try {
      const response = await createInvite()
      const invite = response.data
      setInviteLink(invite.inviteUrl)
      toast.success('Invite link created successfully')
      refetchInvites()
    } catch (error) {
      console.error('Failed to create invite:', error)
      toast.error('Failed to create invite link')
    }
  }

  const handleSaveOrgName = async (organizationName: string) => {
    await updateOrgMutation.mutateAsync(organizationName)
    // After saving, proceed with creating invite
    try {
      const response = await createInvite()
      const invite = response.data
      setInviteLink(invite.inviteUrl)
      toast.success('Invite link created successfully')
      refetchInvites()
    } catch (error) {
      console.error('Failed to create invite:', error)
      toast.error('Failed to create invite link')
    }
  }

  const handleDeleteInviteClick = (inviteId: string) => {
    setInviteToDelete(inviteId)
    setDeleteModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!inviteToDelete) return

    try {
      await deleteInvite(inviteToDelete)
      toast.success('Invite link deleted')
      refetchInvites()
    } catch (error) {
      console.error('Failed to delete invite:', error)
      toast.error('Failed to delete invite link')
    } finally {
      setInviteToDelete(null)
    }
  }

  const handleCopyInvite = (inviteUrl: string, inviteId: string) => {
    navigator.clipboard.writeText(inviteUrl)
    toast.success('Invite link copied to clipboard')
  }

  const getInviteStatus = (invite: any) => {
    if (invite.used_at) return 'used'
    if (new Date(invite.expires_at) < new Date()) return 'expired'
    return 'pending'
  }

  const getExpirationText = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffMs = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays < 0) {
      return `Expired ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'day' : 'days'} ago`
    } else if (diffDays === 0) {
      return 'Expires today'
    } else if (diffDays === 1) {
      return 'Expires tomorrow'
    } else {
      return `Expires in ${diffDays} days`
    }
  }

  const handleCopyInviteLink = () => {
    if (inviteLink) {
      navigator.clipboard.writeText(inviteLink)
      setCopiedInvite(true)
      toast.success('Invite link copied to clipboard')
      setTimeout(() => setCopiedInvite(false), 2000)
    }
  }

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!confirm(`Are you sure you want to remove ${memberEmail} from the team?`)) {
      return
    }

    try {
      await removeMember(memberId)
      toast.success('Member removed successfully')
      refetchMembers()
    } catch (error) {
      console.error('Failed to remove member:', error)
      toast.error('Failed to remove member')
    }
  }

  const handleLeaveTeam = async () => {
    if (!confirm('Are you sure you want to leave this team? You will lose access to all team resources.')) {
      return
    }

    try {
      await leaveTeam()
      toast.success('Left team successfully')
      // Redirect to dashboard after leaving
      navigate('/dashboard')
      window.location.reload()
    } catch (error) {
      console.error('Failed to leave team:', error)
      toast.error('Failed to leave team')
    }
  }

  if (!currentTeam) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">No Team Found</h2>
            <p className="text-muted-foreground">You're not currently part of any team.</p>
          </div>
        </div>
      </div>
    )
  }

  const allMembers = teamMembers?.members || []
  const currentMember = allMembers.find((m) => m.userId === userId)

  // Filter out the owner from the members list - they shouldn't see themselves
  const members = allMembers.filter((m) => !m.isOwner)

  return (
    <div className="space-y-6 p-6 max-w-5xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">
          Manage your team members and settings
        </p>
      </div>

      {/* Team Info Card */}
      <div className="bg-card rounded-lg border border-border p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isTeamOwner ? 'My Team' : 'Team'}
              </h2>
              <div className="flex items-center space-x-2">
                <p className="text-sm text-muted-foreground">
                  {allMembers.length} / 10 members
                </p>
                {allMembers.length < 10 && (
                  <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded">
                    {10 - allMembers.length} {10 - allMembers.length === 1 ? 'spot' : 'spots'} available
                  </span>
                )}
                {allMembers.length >= 10 && (
                  <span className="text-xs px-2 py-0.5 bg-orange-500/10 text-orange-600 rounded">
                    Team full
                  </span>
                )}
              </div>
            </div>
          </div>
          {isTeamOwner && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              <Crown className="h-4 w-4" />
              <span>Owner</span>
            </div>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          <p>Team ID: {currentTeam.team.id}</p>
          <p>Created: {currentTeam.team.createdAt ? new Date(currentTeam.team.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Unknown'}</p>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold">
            {isTeamOwner ? 'Invited Members' : 'Team Members'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {isTeamOwner
              ? 'Members you have invited to your team'
              : 'People who are part of this team'
            }
          </p>
        </div>

        <div className="divide-y divide-border">
          {isLoadingMembers ? (
            <div className="p-8 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
              <p className="text-sm text-muted-foreground mt-2">Loading members...</p>
            </div>
          ) : members.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground">Invite your first team member</p>
            </div>
          ) : (
            members.map((member) => {
              const isCurrentUser = member.userId === userId
              const memberDisplayName = member.firstName && member.lastName
                ? `${member.firstName} ${member.lastName}`
                : member.email

              return (
                <div
                  key={member.id}
                  className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className={cn(
                      'p-2 rounded-full',
                      member.isOwner ? 'bg-primary/10' : 'bg-accent'
                    )}>
                      {member.isOwner ? (
                        <Crown className="h-5 w-5 text-primary" />
                      ) : (
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{memberDisplayName}</p>
                        {isCurrentUser && (
                          <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
                            You
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        {member.isOwner ? 'Owner' : 'Member'} • Joined {new Date(member.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Remove button - only show for owners, and not for themselves */}
                  {isTeamOwner && !isCurrentUser && (
                    <button
                      onClick={() => handleRemoveMember(member.userId, member.email)}
                      disabled={isRemovingMember}
                      className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Remove member"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Invite Section - Only for owners */}
      {isTeamOwner && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center space-x-3 mb-4">
            <Share2 className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Invite Members</h3>
          </div>

          {/* Key information about invites */}
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <ul className="text-sm text-muted-foreground space-y-1">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span><strong className="text-foreground">Each link is single-use</strong> — Generate a new link for each person</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Links expire after <strong className="text-foreground">7 days</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Maximum team size: <strong className="text-foreground">10 members</strong> ({10 - allMembers.length} {10 - allMembers.length === 1 ? 'spot' : 'spots'} remaining)</span>
              </li>
            </ul>
          </div>

          {inviteLink ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 p-3 bg-accent rounded-lg">
                <input
                  type="text"
                  value={inviteLink}
                  readOnly
                  className="flex-1 bg-transparent text-sm outline-none"
                />
                <button
                  onClick={handleCopyInviteLink}
                  className="flex items-center space-x-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  {copiedInvite ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <button
                onClick={handleCreateInvite}
                disabled={isCreatingInvite || allMembers.length >= 10}
                className="text-sm text-primary hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {allMembers.length >= 10 ? 'Team is full' : 'Generate new link'}
              </button>
            </div>
          ) : (
            <button
              onClick={handleCreateInvite}
              disabled={isCreatingInvite || allMembers.length >= 10}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreatingInvite ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : allMembers.length >= 10 ? (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>Team Full</span>
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4" />
                  <span>Create Invite Link</span>
                </>
              )}
            </button>
          )}

          {/* Active Invites List */}
          {teamInvites && teamInvites.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border space-y-6">
              {/* Pending Invites */}
              {teamInvites.filter((invite: any) => getInviteStatus(invite) === 'pending').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">
                    Active Invites ({teamInvites.filter((invite: any) => getInviteStatus(invite) === 'pending').length})
                  </h4>
                  <div className="space-y-2">
                    {teamInvites
                      .filter((invite: any) => getInviteStatus(invite) === 'pending')
                      .map((invite: any) => {
                        const inviteUrl = `${window.location.origin}/team/join/${invite.invite_token}`

                        return (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border border-border"
                          >
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-xs px-2 py-0.5 bg-green-500/10 text-green-600 rounded font-medium">
                                  Pending
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {getExpirationText(invite.expires_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate font-mono">
                                {inviteUrl}
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleCopyInvite(inviteUrl, invite.id)}
                                className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors"
                                title="Copy invite link"
                              >
                                <Copy className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteInviteClick(invite.id)}
                                disabled={isDeletingInvite}
                                className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                title="Delete invite"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}

              {/* Expired/Used Invites */}
              {teamInvites.filter((invite: any) => getInviteStatus(invite) !== 'pending').length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground">
                    Past Invites ({teamInvites.filter((invite: any) => getInviteStatus(invite) !== 'pending').length})
                  </h4>
                  <div className="space-y-2">
                    {teamInvites
                      .filter((invite: any) => getInviteStatus(invite) !== 'pending')
                      .map((invite: any) => {
                        const status = getInviteStatus(invite)
                        const inviteUrl = `${window.location.origin}/team/join/${invite.invite_token}`

                        return (
                          <div
                            key={invite.id}
                            className="flex items-center justify-between p-3 bg-accent/30 rounded-lg border border-border opacity-75"
                          >
                            <div className="flex-1 min-w-0 mr-3">
                              <div className="flex items-center space-x-2 mb-1">
                                {status === 'used' && (
                                  <span className="text-xs px-2 py-0.5 bg-gray-500/10 text-gray-600 rounded font-medium">
                                    Used
                                  </span>
                                )}
                                {status === 'expired' && (
                                  <span className="text-xs px-2 py-0.5 bg-red-500/10 text-red-600 rounded font-medium">
                                    Expired
                                  </span>
                                )}
                                <span className="text-xs text-muted-foreground">
                                  {getExpirationText(invite.expires_at)}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate font-mono">
                                {inviteUrl}
                              </p>
                              {invite.used_by && invite.users && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Used by {invite.users.email}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center space-x-2">
                              {status === 'expired' && (
                                <button
                                  onClick={() => handleDeleteInviteClick(invite.id)}
                                  disabled={isDeletingInvite}
                                  className="p-2 text-destructive hover:bg-destructive/10 rounded-md transition-colors disabled:opacity-50"
                                  title="Delete invite"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Leave Team Section - Only for non-owners */}
      {!isTeamOwner && (
        <div className="bg-card rounded-lg border border-destructive/50 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <LogOut className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold text-destructive">Leave Team</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Once you leave this team, you will lose access to all team resources and data.
          </p>
          <button
            onClick={handleLeaveTeam}
            disabled={isLeavingTeam}
            className="flex items-center space-x-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLeavingTeam ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Leaving...</span>
              </>
            ) : (
              <>
                <LogOut className="h-4 w-4" />
                <span>Leave Team</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Delete Invite Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Invite Link"
        message="This will permanently delete this invite link. Anyone with this link will no longer be able to use it to join your team. This action cannot be undone."
        confirmText="Delete Link"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Organization Name Prompt Modal */}
      <OrganizationNameModal
        isOpen={showOrgNameModal}
        onClose={() => setShowOrgNameModal(false)}
        onSave={handleSaveOrgName}
        currentValue={userProfile?.organizationName}
      />
    </div>
  )
}
