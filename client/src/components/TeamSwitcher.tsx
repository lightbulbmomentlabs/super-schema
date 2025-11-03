import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTeamContext } from '@/contexts/TeamContext'
import { ChevronDown, Users, Settings, Check, Loader2, Share2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { toast } from 'react-hot-toast'

interface TeamSwitcherProps {
  className?: string
}

export default function TeamSwitcher({ className }: TeamSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const {
    currentTeam,
    allTeams,
    isLoading,
    currentTeamError,
    switchTeam,
    isSwitchingTeam,
    hasMultipleTeams
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
      // Refresh the page to reload all team-specific data
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch team:', error)
      toast.error('Failed to switch team')
    }
  }

  // Don't render anything if there's an error (feature not enabled or API issue)
  if (currentTeamError) {
    return null
  }

  // Show loading only briefly, then hide if it takes too long
  if (isLoading || !currentTeam) {
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
                      key={team.teamId}
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
                        <Users className="h-4 w-4" />
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
            <Link
              to="/team/settings"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Team Settings</span>
            </Link>

            {currentTeam.isOwner && (
              <Link
                to="/team/invite"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm hover:bg-accent transition-colors"
              >
                <Share2 className="h-4 w-4" />
                <span>Invite Members</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
