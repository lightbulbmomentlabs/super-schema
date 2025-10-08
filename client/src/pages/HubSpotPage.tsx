import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { hubspotApi } from '@/services/hubspot'
import { apiService } from '@/services/api'
import { Loader2, CheckCircle, XCircle, AlertCircle, ExternalLink, Trash2, Plus, X, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HubSpotPage() {
  const queryClient = useQueryClient()
  const [validatingId, setValidatingId] = useState<string | null>(null)
  const [newDomain, setNewDomain] = useState<{ [key: string]: string }>({})
  const [showAddDomain, setShowAddDomain] = useState<{ [key: string]: boolean }>({})

  // Fetch connections
  const { data: connectionsResponse, isLoading, error } = useQuery({
    queryKey: ['hubspot-connections'],
    queryFn: () => hubspotApi.getConnections()
  })

  const connections = connectionsResponse?.data || []

  // Fetch user domains
  const { data: domainsResponse } = useQuery({
    queryKey: ['user-domains'],
    queryFn: () => apiService.getUserDomains()
  })

  const userDomains = domainsResponse?.data || []
  const availableDomains = userDomains.map(d => d.domain)

  // Add domain mutation
  const addDomainMutation = useMutation({
    mutationFn: ({ connectionId, domain }: { connectionId: string; domain: string }) =>
      hubspotApi.addDomainToConnection(connectionId, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-connections'] })
      toast.success('Domain added successfully')
      setNewDomain({})
      setShowAddDomain({})
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to add domain')
    }
  })

  // Remove domain mutation
  const removeDomainMutation = useMutation({
    mutationFn: ({ connectionId, domain }: { connectionId: string; domain: string }) =>
      hubspotApi.removeDomainFromConnection(connectionId, domain),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-connections'] })
      toast.success('Domain removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove domain')
    }
  })

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => hubspotApi.disconnectAccount(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hubspot-connections'] })
      toast.success('HubSpot account disconnected successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to disconnect account')
    }
  })

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: (connectionId: string) => hubspotApi.validateConnection(connectionId),
    onSuccess: (data) => {
      if (data.data?.isValid) {
        toast.success('Connection is valid!')
        queryClient.invalidateQueries({ queryKey: ['hubspot-connections'] })
      } else {
        toast.error('Connection is invalid. Please reconnect.')
      }
      setValidatingId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to validate connection')
      setValidatingId(null)
    }
  })

  const handleValidate = (connectionId: string) => {
    setValidatingId(connectionId)
    validateMutation.mutate(connectionId)
  }

  const handleDisconnect = (connectionId: string, portalName?: string) => {
    if (confirm(`Are you sure you want to disconnect ${portalName || 'this HubSpot portal'}?`)) {
      disconnectMutation.mutate(connectionId)
    }
  }

  const handleConnectHubSpot = () => {
    // Direct OAuth flow with HubSpot
    const clientId = import.meta.env.VITE_HUBSPOT_CLIENT_ID

    if (!clientId) {
      toast.error('HubSpot Client ID not configured. Please add VITE_HUBSPOT_CLIENT_ID to your .env file.')
      return
    }

    const redirectUri = `${window.location.origin}/hubspot/callback`
    const scopes = ['content', 'oauth'] // Required scopes for CMS access

    // Build HubSpot authorization URL
    const authUrl = new URL('https://app.hubspot.com/oauth/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('scope', scopes.join(' '))

    // Redirect to HubSpot authorization page
    window.location.href = authUrl.toString()
  }

  const handleAddDomain = (connectionId: string) => {
    const domain = newDomain[connectionId]?.trim()
    if (!domain) {
      toast.error('Please enter a domain')
      return
    }
    addDomainMutation.mutate({ connectionId, domain })
  }

  const handleRemoveDomain = (connectionId: string, domain: string, portalName?: string) => {
    if (confirm(`Remove ${domain} from ${portalName || 'this portal'}?`)) {
      removeDomainMutation.mutate({ connectionId, domain })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">HubSpot Integration</h1>
          <p className="text-muted-foreground">
            Connect your HubSpot account to automatically push schema markup to your blog posts and pages.
          </p>
        </div>

        {/* Connect Button */}
        <div className="mb-8">
          <button
            onClick={handleConnectHubSpot}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Connect HubSpot Account
          </button>
        </div>

        {/* Connections List */}
        <div className="bg-card border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : error ? (
            <div className="flex items-center space-x-2 text-destructive py-8">
              <AlertCircle className="h-5 w-5" />
              <span>Failed to load connections</span>
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="mb-2">No HubSpot accounts connected yet.</p>
              <p className="text-sm">Connect your HubSpot account to get started.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="border border-border rounded-lg overflow-hidden"
                >
                  {/* Connection Header */}
                  <div className="bg-muted/30 p-4 border-b border-border">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-lg">
                            {connection.portalName || `Portal ${connection.hubspotPortalId}`}
                          </h3>
                          {connection.isActive ? (
                            <span className="flex items-center text-xs px-2 py-1 rounded-full bg-success text-success-foreground">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="flex items-center text-xs px-2 py-1 rounded-full bg-destructive text-destructive-foreground">
                              <XCircle className="h-3 w-3 mr-1" />
                              Inactive
                            </span>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Portal ID: {connection.hubspotPortalId}</p>
                          <p>Connected: {new Date(connection.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleValidate(connection.id)}
                          disabled={validatingId === connection.id || validateMutation.isPending}
                          className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                        >
                          {validatingId === connection.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Validate'
                          )}
                        </button>

                        <button
                          onClick={() => handleDisconnect(connection.id, connection.portalName)}
                          disabled={disconnectMutation.isPending}
                          className="px-3 py-2 text-sm border border-border rounded-md hover:bg-destructive hover:text-destructive-foreground transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Domain Management Section - Always Visible */}
                  <div className="p-4 bg-background">
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <h4 className="font-semibold text-sm">Associated Domains</h4>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Add domains to automatically select this portal when pushing schema for URLs from these domains.
                      </p>
                    </div>

                    {/* Existing Domains */}
                    {connection.associatedDomains && connection.associatedDomains.length > 0 ? (
                      <div className="space-y-2 mb-3">
                        {connection.associatedDomains.map((domain) => (
                          <div
                            key={domain}
                            className="flex items-center justify-between bg-muted/30 border border-border rounded-md px-3 py-2"
                          >
                            <div className="flex items-center space-x-2">
                              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm font-mono">{domain}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveDomain(connection.id, domain, connection.portalName)}
                              disabled={removeDomainMutation.isPending}
                              className="text-destructive hover:bg-destructive/10 p-1 rounded transition-colors disabled:opacity-50"
                              title="Remove domain"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mb-3 p-3 bg-warning/10 border border-warning/20 rounded-md">
                        <p className="text-sm text-warning-foreground">
                          ⚠️ No domains associated yet. Add domains to enable automatic portal selection.
                        </p>
                      </div>
                    )}

                    {/* Add Domain Input */}
                    {!showAddDomain[connection.id] ? (
                      <button
                        onClick={() => setShowAddDomain({ ...showAddDomain, [connection.id]: true })}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 text-sm bg-primary/10 text-primary border-2 border-dashed border-primary/30 rounded-md hover:bg-primary/20 hover:border-primary/50 transition-colors font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Domain</span>
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <div className="flex-1">
                            <input
                              type="text"
                              placeholder="example.com"
                              value={newDomain[connection.id] || ''}
                              onChange={(e) => setNewDomain({ ...newDomain, [connection.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddDomain(connection.id)
                                } else if (e.key === 'Escape') {
                                  setShowAddDomain({ ...showAddDomain, [connection.id]: false })
                                  setNewDomain({ ...newDomain, [connection.id]: '' })
                                }
                              }}
                              className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                              autoFocus
                            />
                          </div>
                          <button
                            onClick={() => handleAddDomain(connection.id)}
                            disabled={addDomainMutation.isPending}
                            className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 font-medium"
                          >
                            {addDomainMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Add'
                            )}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddDomain({ ...showAddDomain, [connection.id]: false })
                              setNewDomain({ ...newDomain, [connection.id]: '' })
                            }}
                            className="px-3 py-2 text-sm border border-border rounded-md hover:bg-accent transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                        {availableDomains.length > 0 && (
                          <div className="text-xs text-muted-foreground bg-muted/30 rounded p-2">
                            <strong>Suggested from your library:</strong> {availableDomains.slice(0, 5).join(', ')}
                            {availableDomains.length > 5 && ` +${availableDomains.length - 5} more`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How It Works */}
        <div className="mt-8 bg-info border border-info rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center text-info-foreground">
            <AlertCircle className="h-5 w-5 mr-2" />
            How It Works
          </h3>
          <div className="space-y-2 text-sm text-info-foreground">
            <p>
              1. <strong>Connect:</strong> Authorize SuperSchema to access your HubSpot account
            </p>
            <p>
              2. <strong>Generate:</strong> Create schema markup for your content as usual
            </p>
            <p>
              3. <strong>Push:</strong> Click "Push to HubSpot" to automatically add schema to your blog posts
            </p>
            <p>
              4. <strong>Done:</strong> Schema is instantly added to your HubSpot content's head HTML
            </p>
          </div>

          <div className="mt-4 pt-4 border-t border-info-foreground/20">
            <p className="text-xs text-info-foreground">
              <strong>Note:</strong> This feature requires HubSpot Marketing Hub Professional/Enterprise or CMS Hub Professional/Enterprise.
              {' '}
              <a
                href="https://developers.hubspot.com/docs/api/cms/blog-post"
                target="_blank"
                rel="noopener noreferrer"
                className="underline inline-flex items-center hover:no-underline"
              >
                Learn more
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
