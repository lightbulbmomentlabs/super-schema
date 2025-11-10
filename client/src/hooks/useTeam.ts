import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { apiService } from '@/services/api'
import { authTokenManager } from '@/utils/authTokenManager'
import { FEATURE_FLAGS } from '@/config/featureFlags'
import type { TeamMember, CurrentTeamResponse, ListTeamsResponse } from '@shared/types'

export function useTeam() {
  const queryClient = useQueryClient()
  const { isSignedIn, isLoaded } = useAuth()

  // Only enable queries when:
  // 1. Teams feature is enabled
  // 2. Clerk auth is loaded
  // 3. User is signed in
  // 4. Auth token manager is ready
  const isAuthReady = isLoaded && isSignedIn && authTokenManager.isReady()
  const shouldEnableTeamQueries = FEATURE_FLAGS.TEAMS_ENABLED && isAuthReady

  // Query: Get current active team
  const {
    data: currentTeam,
    isLoading: isLoadingCurrentTeam,
    error: currentTeamError,
    refetch: refetchCurrentTeam
  } = useQuery({
    queryKey: ['team', 'current'],
    queryFn: async () => {
      const response = await apiService.getCurrentTeam()
      return response.data
    },
    enabled: shouldEnableTeamQueries, // Only fetch when teams feature is enabled and auth is ready
    staleTime: 30000 // Cache for 30 seconds
  })

  // Query: List all teams user is part of
  const {
    data: allTeams,
    isLoading: isLoadingAllTeams,
    error: allTeamsError,
    refetch: refetchAllTeams
  } = useQuery({
    queryKey: ['team', 'list'],
    queryFn: async () => {
      const response = await apiService.listTeams()
      return response.data
    },
    enabled: shouldEnableTeamQueries, // Only fetch when teams feature is enabled and auth is ready
    staleTime: 30000 // Cache for 30 seconds
  })

  // Query: Get team members
  const {
    data: teamMembers,
    isLoading: isLoadingMembers,
    error: membersError,
    refetch: refetchMembers
  } = useQuery({
    queryKey: ['team', 'members', currentTeam?.team?.id],
    queryFn: async () => {
      const response = await apiService.getTeamMembers()
      return response.data
    },
    enabled: shouldEnableTeamQueries && !!currentTeam?.team?.id, // Only fetch when teams feature is enabled, auth is ready, AND we have a team
    staleTime: 30000
  })

  // Mutation: Switch team
  const switchTeamMutation = useMutation({
    mutationFn: (teamId: string) => apiService.switchTeam(teamId),
    onSuccess: () => {
      // Invalidate and refetch team queries after switching
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['user'] }) // User data may change with team context
    }
  })

  // Mutation: Create team invite
  const createInviteMutation = useMutation({
    mutationFn: () => apiService.createTeamInvite(),
    onSuccess: () => {
      // Optionally refetch team data if needed
      queryClient.invalidateQueries({ queryKey: ['team', 'current'] })
    }
  })

  // Mutation: Remove team member
  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => apiService.removeTeamMember(userId),
    onSuccess: () => {
      // Refetch team members after removing one
      queryClient.invalidateQueries({ queryKey: ['team', 'members'] })
      queryClient.invalidateQueries({ queryKey: ['team', 'current'] })
    }
  })

  // Mutation: Leave team
  const leaveTeamMutation = useMutation({
    mutationFn: () => apiService.leaveTeam(),
    onSuccess: () => {
      // Invalidate all team queries after leaving
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })

  // Mutation: Accept team invite
  const acceptInviteMutation = useMutation({
    mutationFn: (token: string) => apiService.acceptTeamInvite(token),
    onSuccess: () => {
      // Refetch all team data after joining a new team
      queryClient.invalidateQueries({ queryKey: ['team'] })
      queryClient.invalidateQueries({ queryKey: ['user'] })
    }
  })

  // Query: Get team invites list
  const {
    data: teamInvites,
    isLoading: isLoadingInvites,
    error: invitesError,
    refetch: refetchInvites
  } = useQuery({
    queryKey: ['team', 'invites', currentTeam?.team?.id],
    queryFn: async () => {
      const response = await apiService.getTeamInvites()
      return response.data
    },
    enabled: shouldEnableTeamQueries && !!currentTeam?.team?.id,
    staleTime: 30000
  })

  // Mutation: Delete team invite
  const deleteInviteMutation = useMutation({
    mutationFn: (inviteId: string) => apiService.deleteTeamInvite(inviteId),
    onSuccess: () => {
      // Refetch invites after deletion
      queryClient.invalidateQueries({ queryKey: ['team', 'invites'] })
    }
  })

  return {
    // Current team data
    currentTeam: currentTeam as CurrentTeamResponse | undefined,
    isLoadingCurrentTeam,
    currentTeamError,
    refetchCurrentTeam,

    // All teams data
    allTeams: allTeams as ListTeamsResponse | undefined,
    isLoadingAllTeams,
    allTeamsError,
    refetchAllTeams,

    // Team members data
    teamMembers,
    isLoadingMembers,
    membersError,
    refetchMembers,

    // Mutations
    switchTeam: switchTeamMutation.mutateAsync,
    isSwitchingTeam: switchTeamMutation.isPending,
    switchTeamError: switchTeamMutation.error,

    createInvite: createInviteMutation.mutateAsync,
    isCreatingInvite: createInviteMutation.isPending,
    createInviteError: createInviteMutation.error,

    removeMember: removeMemberMutation.mutateAsync,
    isRemovingMember: removeMemberMutation.isPending,
    removeMemberError: removeMemberMutation.error,

    leaveTeam: leaveTeamMutation.mutateAsync,
    isLeavingTeam: leaveTeamMutation.isPending,
    leaveTeamError: leaveTeamMutation.error,

    acceptInvite: acceptInviteMutation.mutateAsync,
    isAcceptingInvite: acceptInviteMutation.isPending,
    acceptInviteError: acceptInviteMutation.error,

    // Team invites data
    teamInvites,
    isLoadingInvites,
    invitesError,
    refetchInvites,

    deleteInvite: deleteInviteMutation.mutateAsync,
    isDeletingInvite: deleteInviteMutation.isPending,
    deleteInviteError: deleteInviteMutation.error,

    // Computed properties
    isTeamOwner: currentTeam?.isOwner ?? false,
    hasMultipleTeams: (allTeams?.count ?? 0) > 1,
    isLoading: isLoadingCurrentTeam || isLoadingAllTeams
  }
}
