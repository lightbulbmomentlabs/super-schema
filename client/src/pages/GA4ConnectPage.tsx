import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, ExternalLink, Globe, CheckCircle2, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGA4Connection } from '@/hooks/useGA4Connection'
import { useGA4DomainMappings } from '@/hooks/useGA4DomainMappings'
import { ga4Api, type GA4Property } from '@/services/ga4'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

export default function GA4ConnectPage() {
  const navigate = useNavigate()
  const { connected } = useGA4Connection()
  const { createMapping, isCreating } = useGA4DomainMappings(connected)

  const [isLoadingAuthUrl, setIsLoadingAuthUrl] = useState(false)
  const [isLoadingProperties, setIsLoadingProperties] = useState(false)
  const [properties, setProperties] = useState<GA4Property[]>([])
  const [selectedProperty, setSelectedProperty] = useState<GA4Property | null>(null)
  const [domain, setDomain] = useState('')

  // Load properties if already connected
  useEffect(() => {
    if (connected) {
      loadProperties()
    }
  }, [connected])

  const loadProperties = async () => {
    setIsLoadingProperties(true)
    try {
      const response = await ga4Api.listProperties()
      setProperties(response.properties || [])
    } catch (error: any) {
      console.error('Failed to load properties:', error)
      toast.error(error?.response?.data?.error || 'Failed to load GA4 properties')
    } finally {
      setIsLoadingProperties(false)
    }
  }

  const handleConnect = async () => {
    setIsLoadingAuthUrl(true)
    try {
      const response = await ga4Api.getAuthUrl()
      if (response.authUrl) {
        // Redirect to Google OAuth
        window.location.href = response.authUrl
      }
    } catch (error: any) {
      console.error('Failed to get auth URL:', error)
      toast.error(error?.response?.data?.error || 'Failed to start OAuth flow')
    } finally {
      setIsLoadingAuthUrl(false)
    }
  }

  const handleCreateMapping = () => {
    if (!selectedProperty) {
      toast.error('Please select a GA4 property')
      return
    }

    if (!domain.trim()) {
      toast.error('Please enter a domain')
      return
    }

    // Validate domain format (basic check)
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]+\.[a-zA-Z]{2,}$/
    if (!domainRegex.test(domain)) {
      toast.error('Please enter a valid domain (e.g., example.com)')
      return
    }

    createMapping(
      {
        propertyId: selectedProperty.id,
        propertyName: selectedProperty.name,
        domain: domain.trim()
      },
      {
        onSuccess: () => {
          navigate('/ai-analytics')
        }
      }
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => navigate('/ai-analytics')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to AI Analytics
          </button>
          <h1 className="text-3xl font-black bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            Connect Google Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Link your GA4 property to track AI crawler activity
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Step 1: Connect to Google (if not connected) */}
        {!connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8 mb-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold w-8 h-8 flex-shrink-0">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Authorize Google Analytics Access
                </h2>
                <p className="text-muted-foreground mb-4">
                  Grant SuperSchema permission to read your Google Analytics 4 data. We'll only access analytics data - never modify it.
                </p>
                <div className="bg-muted/20 border border-border/50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-muted-foreground font-semibold mb-2">
                    Permissions requested:
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Read Google Analytics data
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      Access analytics reports
                    </li>
                  </ul>
                </div>
                <button
                  onClick={handleConnect}
                  disabled={isLoadingAuthUrl}
                  className={cn(
                    'px-6 py-3 rounded-lg font-semibold',
                    'bg-gradient-to-r from-primary to-primary/80',
                    'text-primary-foreground',
                    'hover:shadow-lg hover:scale-105',
                    'transition-all duration-200',
                    'inline-flex items-center gap-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  )}
                >
                  {isLoadingAuthUrl ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <ExternalLink className="h-5 w-5" />
                      Connect with Google
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Map Domain (if connected) */}
        {connected && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-2xl p-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold w-8 h-8 flex-shrink-0">
                {connected ? '2' : '1'}
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Map Domain to GA4 Property
                </h2>
                <p className="text-muted-foreground mb-6">
                  Select a GA4 property and enter the domain you want to track.
                </p>

                {/* Property Selector */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Step 1: Select GA4 Property
                  </label>
                  {isLoadingProperties ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    </div>
                  ) : properties.length === 0 ? (
                    <div className="bg-muted/20 border border-border/50 rounded-lg p-6 text-center">
                      <p className="text-muted-foreground">
                        No GA4 properties found. Make sure you have access to at least one GA4 property in your Google account.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      {properties.map((property) => (
                        <button
                          key={property.id}
                          onClick={() => setSelectedProperty(property)}
                          className={cn(
                            'text-left p-4 rounded-lg border transition-all',
                            selectedProperty?.id === property.id
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/20'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                              selectedProperty?.id === property.id
                                ? 'border-primary bg-primary'
                                : 'border-muted-foreground/30'
                            )}>
                              {selectedProperty?.id === property.id && (
                                <CheckCircle2 className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-foreground">
                                {property.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Property ID: {property.id}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Domain Input */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-foreground mb-3">
                    Step 2: Enter Domain
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="example.com"
                      className={cn(
                        'w-full pl-11 pr-4 py-3 rounded-lg',
                        'bg-background border border-border',
                        'text-foreground placeholder:text-muted-foreground',
                        'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
                        'transition-all'
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Enter your domain without http:// or https:// (e.g., example.com)
                  </p>
                </div>

                {/* Create Button */}
                <button
                  onClick={handleCreateMapping}
                  disabled={!selectedProperty || !domain.trim() || isCreating}
                  className={cn(
                    'px-6 py-3 rounded-lg font-semibold',
                    'bg-gradient-to-r from-primary to-primary/80',
                    'text-primary-foreground',
                    'hover:shadow-lg hover:scale-105',
                    'transition-all duration-200',
                    'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100'
                  )}
                >
                  {isCreating ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Creating Mapping...
                    </span>
                  ) : (
                    'Create Mapping'
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
