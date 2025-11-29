import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser, useAuth } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  User,
  CreditCard,
  TrendingUp,
  Settings as SettingsIcon,
  ExternalLink,
  Link2,
  Edit,
  Check,
  X,
  Building2,
  Plus,
  Loader2
} from 'lucide-react'
import { AxiosError } from 'axios'
import { apiService } from '@/services/api'
import { hubspotApi } from '@/services/hubspot'
import { toast } from 'react-hot-toast'
import type { Organization, CreateOrganizationRequest } from '@shared/types'
import OrganizationCard from '@/components/OrganizationCard'
import OrganizationForm from '@/components/OrganizationForm'
import ConfirmModal from '@/components/ConfirmModal'

// =============================================================================
// Typed error handler for API errors
// =============================================================================

interface ApiErrorResponse {
  error?: string
  message?: string
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as ApiErrorResponse
    return data.error || data.message || fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function SettingsPage() {
  const { user } = useUser()
  const { isLoaded } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // =============================================================================
  // Fix #33 & #34: Consolidated modal state management
  // Single state object for all organization-related modals and forms
  // =============================================================================
  interface OrgModalState {
    formOpen: boolean
    editingOrg: Organization | null
    deleteConfirmOpen: boolean
    deleteTarget: Organization | null
  }

  const [orgModalState, setOrgModalState] = useState<OrgModalState>({
    formOpen: false,
    editingOrg: null,
    deleteConfirmOpen: false,
    deleteTarget: null
  })

  // Legacy org name editing (for user profile, separate from organizations feature)
  const [isEditingOrgName, setIsEditingOrgName] = useState(false)
  const [orgName, setOrgName] = useState('')

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Settings'
  }, [])

  // Get user profile - Wait for Clerk to load before firing
  const { data: userProfileData } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => apiService.getProfile(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  const userProfile = userProfileData?.data

  // Initialize org name when user profile loads
  useEffect(() => {
    if (userProfile?.organizationName) {
      setOrgName(userProfile.organizationName)
    }
  }, [userProfile])

  // Get user stats - Wait for Clerk to load before firing
  const { data: statsData } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiService.getUserStats(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get user credits - Wait for Clerk to load before firing
  const { data: creditsData } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get library URLs for stats - Wait for Clerk to load before firing
  const { data: libraryUrlsData } = useQuery({
    queryKey: ['dashboard-urls'],
    queryFn: () => apiService.getUserUrls({
      isHidden: false
    }),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get HubSpot connections - Wait for Clerk to load before firing
  const { data: hubspotConnectionsResponse } = useQuery({
    queryKey: ['hubspot-connections'],
    queryFn: () => hubspotApi.getConnections(),
    enabled: isLoaded  // Prevents race condition with Clerk auth
  })

  // Get current team info
  const { data: currentTeamData } = useQuery({
    queryKey: ['current-team'],
    queryFn: () => apiService.getCurrentTeam(),
    enabled: isLoaded
  })

  const isTeamOwner = currentTeamData?.data?.isOwner ?? true // Default to true so users without team context can still add orgs
  const hasTeamContext = !!currentTeamData?.data?.team

  // Get organizations for current team
  const { data: organizationsData, isLoading: isLoadingOrgs } = useQuery({
    queryKey: ['organizations'],
    queryFn: () => apiService.listOrganizations(),
    enabled: isLoaded && hasTeamContext
  })

  const organizations = organizationsData?.data || []

  // =============================================================================
  // Fix #24: Optimistic updates with query cache
  // =============================================================================

  // Create organization mutation with optimistic update
  const createOrgMutation = useMutation({
    mutationFn: (data: CreateOrganizationRequest) => apiService.createOrganization(data),
    onSuccess: (response) => {
      // Optimistic update: add new org to cache immediately
      queryClient.setQueryData(['organizations'], (old: { data: Organization[] } | undefined) => {
        if (!old) return old
        const newOrg = response?.data
        if (newOrg) {
          return { ...old, data: [...old.data, newOrg] }
        }
        return old
      })
      // Still invalidate to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Organization created successfully')
      setOrgModalState(prev => ({ ...prev, formOpen: false, editingOrg: null }))
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to create organization'))
    }
  })

  // Update organization mutation with optimistic update
  const updateOrgMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateOrganizationRequest }) =>
      apiService.updateOrganization(id, data),
    onSuccess: (response, variables) => {
      // Optimistic update: update org in cache immediately
      queryClient.setQueryData(['organizations'], (old: { data: Organization[] } | undefined) => {
        if (!old) return old
        const updatedOrg = response?.data
        if (updatedOrg) {
          return {
            ...old,
            data: old.data.map(org => org.id === variables.id ? updatedOrg : org)
          }
        }
        return old
      })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Organization updated successfully')
      setOrgModalState(prev => ({ ...prev, formOpen: false, editingOrg: null }))
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to update organization'))
    }
  })

  // Delete organization mutation with optimistic update
  const deleteOrgMutation = useMutation({
    mutationFn: (id: string) => apiService.deleteOrganization(id),
    onSuccess: () => {
      // Optimistic update: remove org from cache immediately
      const deleteTarget = orgModalState.deleteTarget
      if (deleteTarget) {
        queryClient.setQueryData(['organizations'], (old: { data: Organization[] } | undefined) => {
          if (!old) return old
          return { ...old, data: old.data.filter(org => org.id !== deleteTarget.id) }
        })
      }
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Organization deleted successfully')
      setOrgModalState(prev => ({ ...prev, deleteConfirmOpen: false, deleteTarget: null }))
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to delete organization'))
    }
  })

  // Set default organization mutation with optimistic update
  const setDefaultOrgMutation = useMutation({
    mutationFn: (id: string) => apiService.setDefaultOrganization(id),
    onSuccess: (_response, newDefaultId) => {
      // Optimistic update: update isDefault flags in cache
      queryClient.setQueryData(['organizations'], (old: { data: Organization[] } | undefined) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map(org => ({
            ...org,
            isDefault: org.id === newDefaultId
          }))
        }
      })
      queryClient.invalidateQueries({ queryKey: ['organizations'] })
      toast.success('Default organization updated')
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, 'Failed to set default organization'))
    }
  })

  const stats = statsData?.data || {}
  const creditBalance = creditsData?.data?.creditBalance || 0
  const libraryUrls = libraryUrlsData?.data || []
  const hubspotConnections = hubspotConnectionsResponse?.data || []

  const totalUrls = libraryUrls.length
  const urlsWithSchema = libraryUrls.filter((url: any) => url.hasSchema).length
  const schemaCoverage = totalUrls > 0 ? Math.round((urlsWithSchema / totalUrls) * 100) : 0
  const hasHubSpotConnection = hubspotConnections.length > 0

  // Mutation for updating organization name in user profile (legacy field)
  const updateOrgNameMutation = useMutation({
    mutationFn: (organizationName: string) =>
      apiService.updateProfile({ organizationName }),
    onSuccess: async (response) => {
      // Manually update the cache with the response data
      queryClient.setQueryData(['user-profile'], response)
      toast.success('Organization name updated successfully')
      setIsEditingOrgName(false)
    },
    onError: () => {
      toast.error('Failed to update organization name')
    }
  })

  const handleSaveOrgName = async () => {
    try {
      const nameToSave = orgName.trim()
      await updateOrgNameMutation.mutateAsync(nameToSave)
    } catch {
      // Error handled by mutation onError
    }
  }

  const handleCancelEditOrgName = () => {
    setOrgName(userProfile?.organizationName || '')
    setIsEditingOrgName(false)
  }

  const formatDate = (date: number | string | Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleClearHistory = async () => {
    if (!confirm('Are you sure you want to clear your generation history? This action cannot be undone.')) {
      return
    }
    // TODO: Implement clear history API call
    alert('Clear history feature coming soon!')
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This will permanently delete all your data and cannot be undone.')) {
      return
    }
    // TODO: Implement account deletion with Clerk
    alert('Account deletion feature coming soon!')
  }

  // =============================================================================
  // Organization handlers (using consolidated state)
  // =============================================================================

  const handleAddOrganization = () => {
    setOrgModalState(prev => ({ ...prev, formOpen: true, editingOrg: null }))
  }

  const handleEditOrganization = (org: Organization) => {
    setOrgModalState(prev => ({ ...prev, formOpen: true, editingOrg: org }))
  }

  const handleDeleteOrganization = (org: Organization) => {
    setOrgModalState(prev => ({ ...prev, deleteConfirmOpen: true, deleteTarget: org }))
  }

  const confirmDeleteOrganization = () => {
    if (orgModalState.deleteTarget) {
      deleteOrgMutation.mutate(orgModalState.deleteTarget.id)
    }
  }

  const handleCloseDeleteModal = () => {
    setOrgModalState(prev => ({ ...prev, deleteConfirmOpen: false, deleteTarget: null }))
  }

  const handleCloseOrgForm = () => {
    setOrgModalState(prev => ({ ...prev, formOpen: false, editingOrg: null }))
  }

  const handleSetDefaultOrganization = (org: Organization) => {
    setDefaultOrgMutation.mutate(org.id)
  }

  const handleOrgFormSubmit = async (data: CreateOrganizationRequest) => {
    if (orgModalState.editingOrg) {
      await updateOrgMutation.mutateAsync({ id: orgModalState.editingOrg.id, data })
    } else {
      await createOrgMutation.mutateAsync(data)
    }
  }

  return (
    <div className="space-y-6 p-6 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Top Row - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Account Information */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Account Information</h2>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Name</label>
                <p className="text-sm mt-0.5">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <p className="text-sm mt-0.5">{user?.emailAddresses?.[0]?.emailAddress}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Member Since</label>
                <p className="text-sm mt-0.5">
                  {user?.createdAt ? formatDate(user.createdAt) : 'N/A'}
                </p>
              </div>
            </div>

            {/* Organization Name - Editable */}
            <div className="pt-2 border-t border-border">
              <label className="text-xs font-medium text-muted-foreground flex items-center justify-between">
                <span>Organization / Company Name (Optional)</span>
                {!isEditingOrgName && (
                  <button
                    onClick={() => setIsEditingOrgName(true)}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <Edit className="h-3 w-3" />
                  </button>
                )}
              </label>

              {isEditingOrgName ? (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveOrgName()
                      }
                    }}
                    placeholder="Enter your organization or company name"
                    className="flex-1 px-3 py-1.5 text-sm bg-background text-foreground border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground"
                    maxLength={100}
                  />
                  <button
                    onClick={handleSaveOrgName}
                    disabled={updateOrgNameMutation.isPending}
                    className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 rounded-md transition-colors disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleCancelEditOrgName}
                    disabled={updateOrgNameMutation.isPending}
                    className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors disabled:opacity-50"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <p className="text-sm mt-1.5">
                  {userProfile?.organizationName || (
                    <span className="text-muted-foreground italic">Not set</span>
                  )}
                </p>
              )}

              <p className="text-xs text-muted-foreground mt-1.5">
                This name will appear on team invitation links you create
              </p>
            </div>
          </div>
        </div>

        {/* Billing & Credits */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Billing & Credits</h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Current Balance</label>
                <p className="text-2xl font-bold mt-0.5">{creditBalance}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Total Spent</label>
                <p className="text-2xl font-bold mt-0.5">
                  ${((stats.total_spent_cents || 0) / 100).toFixed(0)}
                </p>
              </div>
            </div>
            <div className="pt-2 flex gap-2">
              <button
                onClick={() => navigate('/dashboard/credits?purchase=true')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <CreditCard className="h-3 w-3" />
                Buy Credits
              </button>
              <button
                onClick={() => navigate('/dashboard/credits')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              >
                View History
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row - Usage Stats and Integrations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Statistics */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Usage Statistics</h2>
            </div>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Schemas</label>
                <p className="text-2xl font-bold mt-0.5">{stats.total_schemas_generated || 0}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">URLs</label>
                <p className="text-2xl font-bold mt-0.5">{totalUrls}</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Coverage</label>
                <p className="text-2xl font-bold mt-0.5">{schemaCoverage}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations */}
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <Link2 className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Integrations</h2>
            </div>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-border">
                  <svg className="h-6 w-6" viewBox="6.20856283 .64498824 244.26943717 251.24701176" xmlns="http://www.w3.org/2000/svg">
                    <path d="m191.385 85.694v-29.506a22.722 22.722 0 0 0 13.101-20.48v-.677c0-12.549-10.173-22.722-22.721-22.722h-.678c-12.549 0-22.722 10.173-22.722 22.722v.677a22.722 22.722 0 0 0 13.101 20.48v29.506a64.342 64.342 0 0 0 -30.594 13.47l-80.922-63.03c.577-2.083.878-4.225.912-6.375a25.6 25.6 0 1 0 -25.633 25.55 25.323 25.323 0 0 0 12.607-3.43l79.685 62.007c-14.65 22.131-14.258 50.974.987 72.7l-24.236 24.243c-1.96-.626-4-.959-6.057-.987-11.607.01-21.01 9.423-21.007 21.03.003 11.606 9.412 21.014 21.018 21.017 11.607.003 21.02-9.4 21.03-21.007a20.747 20.747 0 0 0 -.988-6.056l23.976-23.985c21.423 16.492 50.846 17.913 73.759 3.562 22.912-14.352 34.475-41.446 28.985-67.918-5.49-26.473-26.873-46.734-53.603-50.792m-9.938 97.044a33.17 33.17 0 1 1 0-66.316c17.85.625 32 15.272 32.01 33.134.008 17.86-14.127 32.522-31.977 33.165" fill="#ff7a59"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium">HubSpot</p>
                  <p className="text-xs text-muted-foreground">
                    {hasHubSpotConnection
                      ? `${hubspotConnections.length} account${hubspotConnections.length !== 1 ? 's' : ''} connected`
                      : 'Not connected'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('/hubspot')}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {hasHubSpotConnection ? 'Manage' : 'Connect'}
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Organizations Section */}
      {(hasTeamContext || !currentTeamData) && (
        <div className="border border-border rounded-lg bg-card">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="h-5 w-5 text-primary" />
                <div>
                  <h2 className="text-lg font-semibold">Organizations</h2>
                  <p className="text-xs text-muted-foreground">
                    Manage publisher data for your generated schemas
                  </p>
                </div>
              </div>
              {isTeamOwner && (
                <button
                  onClick={handleAddOrganization}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Organization
                </button>
              )}
            </div>
          </div>
          <div className="p-4">
            {isLoadingOrgs ? (
              <div className="flex items-center justify-center py-8 gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <span className="text-sm text-muted-foreground">Loading organizations...</span>
              </div>
            ) : organizations.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm font-medium mb-1">No organizations yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Add an organization to auto-fill publisher information in your schemas.
                </p>
                {isTeamOwner && (
                  <button
                    onClick={handleAddOrganization}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Add Your First Organization
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {organizations.map((org) => (
                  <OrganizationCard
                    key={org.id}
                    organization={org}
                    isOwner={isTeamOwner}
                    onEdit={handleEditOrganization}
                    onDelete={handleDeleteOrganization}
                    onSetDefault={handleSetDefaultOrganization}
                  />
                ))}
              </div>
            )}

            {/* Info box about organization auto-fill */}
            {organizations.length > 0 && (
              <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Tip:</strong> When generating schemas, the publisher information is automatically filled from the matching organization based on domain.
                  Add associated domains to your organizations to enable automatic matching.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preferences - Compact */}
      <div className="border border-border rounded-lg bg-card max-w-2xl">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Preferences</h2>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Auto-save to Library</p>
              <p className="text-xs text-muted-foreground">Save discovered URLs automatically</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">Low Credit Notifications</p>
              <p className="text-xs text-muted-foreground">Email alerts for low balance</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">Default Schema Format</p>
              <p className="text-xs text-muted-foreground">Preferred output format</p>
            </div>
            <select className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="json-ld">JSON-LD</option>
              <option value="microdata">Microdata</option>
              <option value="rdfa">RDFa</option>
            </select>
          </div>
        </div>
      </div>

      {/* Danger Zone - Minimal */}
      <div className="border border-border rounded-lg bg-card max-w-2xl">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-medium text-muted-foreground">Advanced</h2>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium">Clear Generation History</p>
              <p className="text-xs text-muted-foreground">Delete all schema generation history</p>
            </div>
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 text-xs border border-border text-muted-foreground rounded-md hover:bg-muted transition-colors"
            >
              Clear History
            </button>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-border">
            <div>
              <p className="text-sm font-medium">Delete Account</p>
              <p className="text-xs text-muted-foreground">Permanently delete your account</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              className="px-3 py-1.5 text-xs border border-border text-muted-foreground rounded-md hover:bg-muted transition-colors"
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Organization Form Modal */}
      <OrganizationForm
        isOpen={orgModalState.formOpen}
        onClose={handleCloseOrgForm}
        onSubmit={handleOrgFormSubmit}
        organization={orgModalState.editingOrg}
        isLoading={createOrgMutation.isPending || updateOrgMutation.isPending}
      />

      {/* Delete Organization Confirmation Modal */}
      <ConfirmModal
        isOpen={orgModalState.deleteConfirmOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={confirmDeleteOrganization}
        title="Delete Organization"
        message={`Are you sure you want to delete "${orgModalState.deleteTarget?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
