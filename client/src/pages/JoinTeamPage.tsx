import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@clerk/clerk-react'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { apiService } from '@/services/api'
import { useTeamContext } from '@/contexts/TeamContext'
import {
  Users,
  Check,
  X,
  Loader2,
  AlertCircle,
  Clock,
  Mail,
  Building2
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import SuperSchemaLogo from '@/components/SuperSchemaLogo'
import TeamJoinWelcomeModal from '@/components/TeamJoinWelcomeModal'

export default function JoinTeamPage() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { isSignedIn, isLoaded: isAuthLoaded } = useAuth()
  const [isJoining, setIsJoining] = useState(false)
  const [showSignUp, setShowSignUp] = useState(false)
  const [showWelcomeModal, setShowWelcomeModal] = useState(false)
  const { acceptInvite, refetchAllTeams } = useTeamContext()
  const previousAuthState = useRef(isSignedIn)

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Join Team'
  }, [])

  // Validate the invite token
  const {
    data: validationResponse,
    isLoading: isValidating,
    error: validationError,
    refetch: refetchValidation
  } = useQuery({
    queryKey: ['team-invite-validation', token],
    queryFn: async () => {
      if (!token) {
        throw new Error('No invitation token provided')
      }
      return await apiService.validateTeamInvite(token)
    },
    enabled: !!token,
    retry: false
  })

  // Refetch validation after user signs in
  useEffect(() => {
    if (isAuthLoaded && isSignedIn && validation) {
      refetchValidation()
    }
  }, [isSignedIn, isAuthLoaded])

  // Auto-accept invite after authentication completes
  useEffect(() => {
    // Only auto-accept when:
    // 1. User just became authenticated (transition from false to true)
    // 2. Auth is fully loaded
    // 3. Validation is complete and valid
    // 4. Not already joining
    const justAuthenticated = !previousAuthState.current && isSignedIn

    if (justAuthenticated && isAuthLoaded && isValid && !isJoining) {
      handleAcceptInvite()
    }

    // Update the ref for next render
    previousAuthState.current = isSignedIn
  }, [isSignedIn, isAuthLoaded, isValid])

  const validation = validationResponse?.data
  const isValid = validation?.valid

  // Get display name - prioritize organization name, then owner's full name, then email
  const getDisplayName = () => {
    if (validation?.organizationName) {
      return validation.organizationName
    }
    if (validation?.teamOwnerFirstName && validation?.teamOwnerLastName) {
      return `${validation.teamOwnerFirstName} ${validation.teamOwnerLastName}'s team`
    }
    if (validation?.teamOwnerEmail) {
      return `${validation.teamOwnerEmail}'s team`
    }
    return 'a team'
  }

  const handleAcceptInvite = async () => {
    if (!token) {
      toast.error('Invalid invitation token')
      return
    }

    setIsJoining(true)
    try {
      await acceptInvite(token)

      // Refetch teams list
      await refetchAllTeams()

      // Show welcome modal instead of immediate redirect
      setShowWelcomeModal(true)
    } catch (error: any) {
      console.error('Failed to join team:', error)

      // Handle specific error cases
      if (error?.response?.status === 409) {
        toast.error('You are already a member of this team')
        // If already a member, just redirect to dashboard
        navigate('/dashboard')
      } else if (error?.response?.status === 400) {
        toast.error('Team is at maximum capacity')
      } else {
        toast.error('Failed to join team. Please try again.')
      }
    } finally {
      setIsJoining(false)
    }
  }

  const handleWelcomeClose = () => {
    setShowWelcomeModal(false)
    navigate('/dashboard')
  }

  const handleDecline = () => {
    navigate('/dashboard')
  }

  // Loading state
  if (isValidating || !isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
          <div>
            <h2 className="text-xl font-semibold">Loading...</h2>
            <p className="text-muted-foreground">Please wait while we check your invite link</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (validationError || !isValid) {
    const errorMessage = validation?.error || 'This invitation link is invalid or has expired'

    return (
      <div className="flex items-center justify-center min-h-[600px] p-6">
        <div className="max-w-md w-full bg-card rounded-lg border border-destructive/50 p-8 text-center space-y-6">
          <div className="p-4 bg-destructive/10 rounded-full w-fit mx-auto">
            <X className="h-12 w-12 text-destructive" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </button>
            <p className="text-xs text-muted-foreground">
              If you believe this is an error, please contact the team owner for a new invitation link.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Success state - conditional auth flow
  if (!isSignedIn) {
    // User is not signed in - show auth UI with invite preview in split layout
    return (
      <div className="min-h-screen flex">
        {/* Left side - Auth Form */}
        <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24">
          <div className="mx-auto w-full max-w-sm lg:w-96">
            <div className="mb-8">
              <Link to="/" className="flex items-center space-x-2 mb-6">
                <SuperSchemaLogo className="h-8 w-8" animate={false} />
                <span className="font-bold text-xl">SuperSchema</span>
              </Link>
              <h2 className="text-3xl font-bold tracking-tight">
                You're Invited!
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {showSignUp
                  ? 'Create a free account to join the team'
                  : 'Sign in to accept your team invitation'}
              </p>
            </div>

            {showSignUp ? (
              <SignUp
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                    card: 'shadow-none border-0 p-[30px]',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'border-border hover:bg-accent',
                    formFieldInput: 'border-border focus:ring-primary',
                    footerActionLink: 'text-primary hover:text-primary/80'
                  }
                }}
                routing="hash"
              />
            ) : (
              <SignIn
                appearance={{
                  elements: {
                    formButtonPrimary: 'bg-primary hover:bg-primary/90 text-primary-foreground',
                    card: 'shadow-none border-0 p-[30px]',
                    headerTitle: 'hidden',
                    headerSubtitle: 'hidden',
                    socialButtonsBlockButton: 'border-border hover:bg-accent',
                    formFieldInput: 'border-border focus:ring-primary',
                    footerActionLink: 'text-primary hover:text-primary/80'
                  }
                }}
                routing="hash"
              />
            )}

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowSignUp(!showSignUp)}
                className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {showSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Team Invitation Details */}
        <div className="hidden lg:block relative w-0 flex-1">
          <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
            <div className="text-center text-primary-foreground max-w-md p-8">
              <img
                src="/superschema-team.png"
                alt="Team collaboration"
                className="w-[150px] h-auto mx-auto mb-6 opacity-90"
              />
              <h2 className="text-2xl font-bold mb-2">
                Join {getDisplayName()}
              </h2>
              <p className="opacity-90 mb-6">
                Collaborate on Super Schema together
              </p>

              <div className="space-y-3 text-left">
                <div className="flex items-center space-x-3 p-4 bg-primary-foreground/10 rounded-lg">
                  <Building2 className="h-5 w-5 opacity-90 flex-shrink-0" />
                  <div>
                    <p className="text-sm opacity-75">Organization</p>
                    <p className="font-semibold">
                      {validation?.organizationName ||
                       (validation?.teamOwnerFirstName && validation?.teamOwnerLastName
                         ? `${validation.teamOwnerFirstName} ${validation.teamOwnerLastName}`
                         : validation?.teamOwnerEmail || 'Team Owner')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-primary-foreground/10 rounded-lg">
                  <Users className="h-5 w-5 opacity-90 flex-shrink-0" />
                  <div>
                    <p className="text-sm opacity-75">Team size</p>
                    <p className="font-semibold">{validation.teamMemberCount} members</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-primary-foreground/10 rounded-lg">
                  <Clock className="h-5 w-5 opacity-90 flex-shrink-0" />
                  <div>
                    <p className="text-sm opacity-75">Invitation expires</p>
                    <p className="font-semibold">
                      {new Date(validation.expiresAt!).toLocaleDateString('en-US', {
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // User is signed in - show accept invitation UI
  return (
    <div className="flex items-center justify-center min-h-[600px] p-6">
      <div className="max-w-md w-full bg-card rounded-lg border border-border shadow-lg">
        {/* Header */}
        <div className="p-8 text-center border-b border-border">
          <div className="p-4 bg-primary/10 rounded-full w-fit mx-auto mb-4">
            <Users className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Team Invitation</h1>
          <p className="text-muted-foreground">
            You've been invited to join {getDisplayName()}
          </p>
        </div>

        {/* Team Details */}
        <div className="p-8 space-y-6">
          <div className="space-y-4">
            {validation?.organizationName && (
              <div className="flex items-start space-x-3 p-4 bg-accent rounded-lg">
                <Building2 className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Organization</p>
                  <p className="font-semibold">{validation.organizationName}</p>
                </div>
              </div>
            )}

            <div className="flex items-start space-x-3 p-4 bg-accent rounded-lg">
              <Mail className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invited by</p>
                <p className="font-semibold">{validation.teamOwnerEmail}</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-accent rounded-lg">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team size</p>
                <p className="font-semibold">{validation.teamMemberCount} members</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-4 bg-accent rounded-lg">
              <Clock className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">Invitation expires</p>
                <p className="font-semibold">
                  {new Date(validation.expiresAt!).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvite}
              disabled={isJoining}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isJoining ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Joining Team...</span>
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  <span>Accept Invitation</span>
                </>
              )}
            </button>

            <p className="text-xs text-center text-muted-foreground">
              By accepting, you'll have access to shared team resources
            </p>
          </div>
        </div>
      </div>

      {/* Welcome Modal */}
      <TeamJoinWelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeClose}
        organizationName={validation?.organizationName}
        teamOwnerName={
          validation?.teamOwnerFirstName && validation?.teamOwnerLastName
            ? `${validation.teamOwnerFirstName} ${validation.teamOwnerLastName}`
            : validation?.teamOwnerEmail
        }
        memberCount={validation?.teamMemberCount}
      />
    </div>
  )
}
