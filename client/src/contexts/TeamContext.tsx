import { createContext, useContext, ReactNode } from 'react'
import { useTeam } from '@/hooks/useTeam'
import type { TeamMember, CurrentTeamResponse, ListTeamsResponse } from '@shared/types'

interface TeamContextType {
  // Current team data
  currentTeam: CurrentTeamResponse | undefined
  isLoadingCurrentTeam: boolean
  currentTeamError: Error | null
  refetchCurrentTeam: () => void

  // All teams data
  allTeams: ListTeamsResponse | undefined
  isLoadingAllTeams: boolean
  allTeamsError: Error | null
  refetchAllTeams: () => void

  // Team members data
  teamMembers: { members: TeamMember[]; teamId: string; ownerId: string } | undefined
  isLoadingMembers: boolean
  membersError: Error | null
  refetchMembers: () => void

  // Mutations
  switchTeam: (teamId: string) => Promise<any>
  isSwitchingTeam: boolean
  switchTeamError: Error | null

  createInvite: () => Promise<any>
  isCreatingInvite: boolean
  createInviteError: Error | null

  removeMember: (userId: string) => Promise<any>
  isRemovingMember: boolean
  removeMemberError: Error | null

  leaveTeam: () => Promise<any>
  isLeavingTeam: boolean
  leaveTeamError: Error | null

  acceptInvite: (token: string) => Promise<any>
  isAcceptingInvite: boolean
  acceptInviteError: Error | null

  // Team invites data
  teamInvites: any[] | undefined
  isLoadingInvites: boolean
  invitesError: Error | null
  refetchInvites: () => void

  deleteInvite: (inviteId: string) => Promise<any>
  isDeletingInvite: boolean
  deleteInviteError: Error | null

  // Computed properties
  isTeamOwner: boolean
  hasMultipleTeams: boolean
  isLoading: boolean
}

const TeamContext = createContext<TeamContextType | undefined>(undefined)

export function TeamProvider({ children }: { children: ReactNode }) {
  const team = useTeam()

  return (
    <TeamContext.Provider value={team}>
      {children}
    </TeamContext.Provider>
  )
}

export function useTeamContext() {
  const context = useContext(TeamContext)
  if (context === undefined) {
    throw new Error('useTeamContext must be used within a TeamProvider')
  }
  return context
}
