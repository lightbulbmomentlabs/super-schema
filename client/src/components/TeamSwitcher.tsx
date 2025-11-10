import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useTeamContext } from '@/contexts/TeamContext'
import { ChevronDown, Users, Settings, Check, Crown, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'
import CreateTeamModal from './CreateTeamModal'

interface TeamSwitcherProps {
  className?: string
}

export default function TeamSwitcher({ className }: TeamSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const {
    currentTeam,
    allTeams,
    isLoading,
    currentTeamError,
    switchTeam,
    isSwitchingTeam,
    hasMultipleTeams,
    createTeam,
    isCreatingTeam,
    ownsTeam
  } = useTeamContext()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleSwitchTeam = async (teamId: string) => {
    try {
      await switchTeam(teamId)
      toast.success('Switched team successfully')
      setIsOpen(false)
      // React Query will automatically refetch invalidated queries
    } catch (error) {
      console.error('Failed to switch team:', error)
      toast.error('Failed to switch team')
    }
  }

  const handleCreateTeam = async (organizationName?: string) => {
    try {
      await createTeam(organizationName)
      toast.success('Team created successfully with 2 free credits!')
      setShowCreateModal(false)
      setIsOpen(false)
      // React Query will automatically refetch invalidated queries
    } catch (error: any) {
      console.error('Failed to create team:', error)
      if (error?.response?.data?.error?.includes('maximum limit')) {
        toast.error('You have reached the maximum limit of 10 teams')
      } else {
        toast.error('Failed to create team. Please try again.')
      }
    }
  }

  // If currently loading, show nothing (will render quickly)
  if (isLoading) {
    return null
  }

  // If there's an error or no team data, don't render the switcher
  // This handles cases where teams feature is disabled or there's a persistent error
  // Temporary API errors (like rate limits) will resolve when queries retry
  if (!currentTeam && currentTeamError) {
    return null
  }

  // If we have no current team but no error, we're still loading
  if (!currentTeam) {
    return null
  }

  // Get team member info for current team
  const currentTeamMember = allTeams?.teams.find(
    (t) => t.teamId === currentTeam.team.id
  )

  // Determine display name with smart fallback:
  // 1. Try organization name from current team
  // 2. Try organization name from team member
  // 3. Fall back to "My Team" for owner or email for member
  const displayName =
    currentTeam.team.organizationName ||
    currentTeamMember?.organizationName ||
    (currentTeamMember?.isOwner ? 'My Team' : currentTeamMember?.email || 'Team')

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-accent"
        disabled={isSwitchingTeam}
      >
        <Users className="h-4 w-4" />
        <span>{displayName}</span>
        {hasMultipleTeams && (
          <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-[280px] bg-background border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Current Team Header */}
          <div className="px-4 py-3 border-b border-border bg-accent/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground">Current Team</div>
                <div className="font-semibold text-sm mt-0.5">{displayName}</div>
              </div>
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Users className="h-3 w-3" />
                <span>{currentTeam.members.length}</span>
              </div>
            </div>
          </div>

          {/* Team List - Only show if multiple teams */}
          {hasMultipleTeams && allTeams && allTeams.teams.length > 1 && (
            <div className="py-2 border-b border-border">
              <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Switch Team
              </div>
              <div className="space-y-0.5">
                {allTeams.teams.map((team) => {
                  const isCurrentTeam = team.teamId === currentTeam.team.id
                  const teamDisplayName =
                    team.organizationName ||
                    (team.isOwner ? 'My Team' : team.email || 'Team')

                  return (
                    <button
                      key={team.id}
                      onClick={() => !isCurrentTeam && handleSwitchTeam(team.teamId)}
                      disabled={isCurrentTeam || isSwitchingTeam}
                      className={cn(
                        'w-full flex items-center justify-between px-4 py-2 text-sm transition-colors',
                        isCurrentTeam
                          ? 'bg-primary/10 text-primary cursor-default'
                          : 'hover:bg-accent cursor-pointer',
                        isSwitchingTeam && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <div className="flex items-center space-x-2">
                        {team.isOwner ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <Users className="h-4 w-4" />
                        )}
                        <span>{teamDisplayName}</span>
                      </div>
                      {isCurrentTeam && <Check className="h-4 w-4" />}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="py-2">
            {!ownsTeam && (
              <button
                onClick={() => {
                  setShowCreateModal(true)
                  setIsOpen(false)
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Create a new Team</span>
              </button>
            )}
            <Link
              to="/team/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Team Settings</span>
            </Link>
          </div>
        </div>
      )}

      {/* Create Team Modal */}
      <CreateTeamModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateTeam}
        isCreating={isCreatingTeam}
      />
    </div>
  )
}
