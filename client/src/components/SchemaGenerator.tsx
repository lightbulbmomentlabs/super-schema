import { useState, useRef, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { useNavigate } from 'react-router-dom'
import { findConnectionByDomain } from '@/utils/domain'
import {
  AlertCircle,
  CheckCircle,
  Clock,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2,
  Plus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import LightningBoltIcon from './icons/LightningBoltIcon'
import SchemaEditor from './SchemaEditor'
import SchemaScore from './SchemaScore'
import RichResultsPreview from './RichResultsPreview'
import LowCreditWarning from './LowCreditWarning'
import DuplicateUrlModal from './DuplicateUrlModal'
import HubSpotContentMatcher from './HubSpotContentMatcher'
import UnassociatedDomainModal from './UnassociatedDomainModal'
import JokeDisplay from './JokeDisplay'
import { apiService } from '@/services/api'
import { hubspotApi } from '@/services/hubspot'
import { cn } from '@/utils/cn'
import { MAX_REFINEMENTS } from '@shared/config/refinement'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { SCHEMA_TYPES } from '@/constants/schemaTypes'
import type { JsonLdSchema, SchemaScore as SchemaScoreType, HubSpotContentMatchResult } from '@shared/types'

interface SchemaGeneratorProps {
  selectedUrl?: string
  autoGenerate?: boolean
}

interface GenerationOptions {
  includeImages: boolean
  includeVideos: boolean
  includeProducts: boolean
  includeEvents: boolean
  includeArticles: boolean
  includeOrganization: boolean
  includeLocalBusiness: boolean
}

const defaultOptions: GenerationOptions = {
  includeImages: true,
  includeVideos: true,
  includeProducts: true,
  includeEvents: true,
  includeArticles: true,
  includeOrganization: true,
  includeLocalBusiness: true
}

export default function SchemaGenerator({ selectedUrl, autoGenerate = false }: SchemaGeneratorProps = {}) {
  // Use real Clerk user
  const { user } = useUser()
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const isAdmin = useIsAdmin()
  const [url, setUrl] = useState('')
  const [options, setOptions] = useState<GenerationOptions>(defaultOptions)
  const [showOptions, setShowOptions] = useState(false)
  const [selectedSchemaType, setSelectedSchemaType] = useState<string>('Auto')
  const [showSchemaSelector, setShowSchemaSelector] = useState(false)
  const [generatedSchemas, setGeneratedSchemas] = useState<JsonLdSchema[]>([])
  const [htmlScriptTags, setHtmlScriptTags] = useState<string>('')
  const [generationMetadata, setGenerationMetadata] = useState<any>(null)
  const [schemaScore, setSchemaScore] = useState<SchemaScoreType | null>(null)
  const [previousScore, setPreviousScore] = useState<number | undefined>(undefined)
  const [refinementCount, setRefinementCount] = useState(0)
  const [isRefining, setIsRefining] = useState(false)
  const [isAddingSchemaType, setIsAddingSchemaType] = useState(false)
  const [pendingSchemaType, setPendingSchemaType] = useState<string | null>(null)
  const [highlightedChanges, setHighlightedChanges] = useState<string[]>([])
  const urlInputRef = useRef<HTMLInputElement>(null)

  // Multi-schema state
  const [currentUrlId, setCurrentUrlId] = useState<string | null>(null)
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(0)
  const [showAddSchemaType, setShowAddSchemaType] = useState(false)

  // Duplicate URL modal state
  const [showDuplicateModal, setShowDuplicateModal] = useState(false)
  const [duplicateUrlData, setDuplicateUrlData] = useState<{
    url: string
    urlId?: string
    createdAt?: string
  } | null>(null)

  // HubSpot integration state
  const [showHubSpotMatcher, setShowHubSpotMatcher] = useState(false)
  const [selectedHubSpotConnection, setSelectedHubSpotConnection] = useState<string | null>(null)
  const [showUnassociatedDomainModal, setShowUnassociatedDomainModal] = useState(false)

  // Get HubSpot connections
  const { data: hubspotConnectionsResponse } = useQuery({
    queryKey: ['hubspot-connections'],
    queryFn: () => hubspotApi.getConnections(),
    enabled: !!user
  })

  const hubspotConnections = hubspotConnectionsResponse?.data || []
  const hasActiveHubSpotConnection = hubspotConnections.some(conn => conn.isActive)

  // Fetch all schemas for the current URL (multi-schema support)
  const { data: allSchemasResponse } = useQuery({
    queryKey: ['urlSchemas', currentUrlId],
    queryFn: () => currentUrlId ? apiService.getAllUrlSchemas(currentUrlId) : null,
    enabled: !!currentUrlId
  })

  const allSchemaRecords = allSchemasResponse?.data || []

  // Get user credits
  const { data: creditsData, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    refetchInterval: 30000 // Refetch every 30 seconds
  })

  // Handle selectedUrl prop from URL Discovery or Library quick generate
  useEffect(() => {
    if (selectedUrl) {
      setUrl(selectedUrl)

      // Only trigger generation automatically if autoGenerate is true
      if (autoGenerate) {
        // Add a small delay to ensure credits are loaded
        const checkCreditsAndGenerate = async () => {
          const creditBalance = creditsData?.data?.creditBalance || 0
          if (creditBalance >= 1) {
            // Check if URL already exists with schema
            try {
              const checkResult = await apiService.checkUrlExists(selectedUrl)
              if (checkResult.success && checkResult.data?.exists && checkResult.data?.hasSchema) {
                // Show duplicate URL modal
                setDuplicateUrlData({
                  url: selectedUrl,
                  urlId: checkResult.data?.urlId,
                  createdAt: checkResult.data?.createdAt
                })
                setShowDuplicateModal(true)
                return
              }
            } catch (error) {
              console.error('Error checking URL existence:', error)
              // Continue with generation if check fails
            }

            generateMutation.mutate({
              url: selectedUrl,
              options: {
                ...options,
                ...(selectedSchemaType !== 'Auto' && { requestedSchemaTypes: [selectedSchemaType] })
              }
            })
          } else if (creditsData) {
            // Only show error if credits data is loaded
            toast.error('Insufficient credits. Please purchase more credits to continue.')
          }
        }

        // If credits aren't loaded yet, wait a bit
        if (!creditsData) {
          setTimeout(checkCreditsAndGenerate, 200)
        } else {
          checkCreditsAndGenerate()
        }
      }
    }
  }, [selectedUrl, autoGenerate, creditsData])

  // Schema generation mutation
  const generateMutation = useMutation({
    mutationFn: ({ url, options }: { url: string; options: GenerationOptions & { requestedSchemaTypes?: string[] } }) =>
      apiService.generateSchema(url, options),
    onSuccess: async (response) => {
      if (response.success && response.data) {
        setGeneratedSchemas(response.data.schemas)
        setHtmlScriptTags(response.data.htmlScriptTags || '') // Store HTML script tags
        setGenerationMetadata(response.data.metadata)

        setSchemaScore(response.data.schemaScore || null)
        setRefinementCount(0) // Reset refinement count for new schema
        refetchCredits() // Refresh credit balance

        // Store URL ID and fetch all schemas for multi-schema support
        if (response.data.urlId) {
          setCurrentUrlId(response.data.urlId)
          await queryClient.invalidateQueries({ queryKey: ['urlSchemas', response.data.urlId] })
        }

        // Invalidate library queries to reflect new URLs immediately
        queryClient.invalidateQueries({ queryKey: ['domains'] })
        queryClient.invalidateQueries({ queryKey: ['urls'] })

        toast.success(`Successfully generated ${response.data.schemas.length} schema(s)!`)
      }
    },
    onError: (error: any) => {
      // Handle content validation errors with helpful feedback
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMessage = error.response.data.error

        // Check if this is a content validation error
        if (errorMessage.includes('Content not suitable for schema generation') ||
            errorMessage.includes('not accessible') ||
            errorMessage.includes('validation')) {
          // Show a more user-friendly message for content validation
          toast.error('Content Analysis', {
            duration: 8000, // Show longer for detailed feedback
          })

          // Also set the error as metadata so we can display it properly
          setGenerationMetadata({
            url,
            error: errorMessage,
            isValidationError: true,
            processingTimeMs: error.response.data.data?.metadata?.processingTimeMs || 0
          })
          return
        }
      }

      // Handle other errors normally
      const message = error.response?.data?.error || 'Failed to generate schema'
      toast.error(message)
      console.error('Schema generation error:', error)
    }
  })

  // Schema validation mutation
  const validateMutation = useMutation({
    mutationFn: (schemas: JsonLdSchema[]) =>
      apiService.validateMultipleSchemas(schemas),
    onError: (error: any) => {
      toast.error('Failed to validate schemas')
      console.error('Validation error:', error)
    }
  })

  // Push schema to HubSpot mutation
  const pushToHubSpotMutation = useMutation({
    mutationFn: (params: {
      connectionId: string
      contentId: string
      contentType: 'blog_post' | 'page' | 'landing_page'
      schemaHtml: string
      contentTitle?: string
      contentUrl?: string
    }) => hubspotApi.pushSchema(params),
    onSuccess: () => {
      toast.success('Schema successfully pushed to HubSpot!')
      setShowHubSpotMatcher(false)
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || 'Failed to push schema to HubSpot'
      toast.error(message)
      console.error('HubSpot push error:', error)
    }
  })

  const handlePushToHubSpot = () => {
    if (!hasActiveHubSpotConnection) {
      toast.error('Please connect a HubSpot account first')
      navigate('/hubspot')
      return
    }

    // Try to find connection by domain first (smart detection)
    const matchedConnection = findConnectionByDomain(hubspotConnections, url)
    const activeConnections = hubspotConnections.filter(conn => conn.isActive)

    if (matchedConnection) {
      // Auto-detected connection based on domain
      setSelectedHubSpotConnection(matchedConnection.id)
      setTimeout(() => setShowHubSpotMatcher(true), 0)
      toast.success(`Auto-selected HubSpot portal based on domain`, { duration: 2000 })
    } else if (activeConnections.length === 1) {
      // Only one portal - use it directly (no need for domain association)
      setSelectedHubSpotConnection(activeConnections[0].id)
      setTimeout(() => setShowHubSpotMatcher(true), 0)
    } else if (activeConnections.length > 1) {
      // Multiple portals and no domain match - show warning modal to encourage domain association
      setShowUnassociatedDomainModal(true)
    } else {
      toast.error('No active HubSpot connection found')
    }
  }

  const handleSelectHubSpotContent = (match: HubSpotContentMatchResult) => {
    if (!selectedHubSpotConnection || !htmlScriptTags) {
      toast.error('Missing connection or schema data')
      return
    }

    pushToHubSpotMutation.mutate({
      connectionId: selectedHubSpotConnection,
      contentId: match.contentId,
      contentType: match.contentType as 'blog_post' | 'page' | 'landing_page',
      schemaHtml: htmlScriptTags,
      contentTitle: match.title,
      contentUrl: match.url
    })
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('Please enter a valid URL')
      return
    }

    // Check if user has credits
    const creditBalance = creditsData?.data?.creditBalance || 0
    if (creditBalance < 1) {
      toast.error('Insufficient credits. Please purchase more credits to continue.')
      return
    }

    try {
      new URL(url) // Validate URL format
    } catch {
      toast.error('Please enter a valid URL')
      return
    }

    // Check if URL already exists with schema
    try {
      const checkResult = await apiService.checkUrlExists(url)
      if (checkResult.success && checkResult.data?.exists && checkResult.data?.hasSchema) {
        // Show duplicate URL modal
        setDuplicateUrlData({
          url,
          urlId: checkResult.data?.urlId,
          createdAt: checkResult.data?.createdAt
        })
        setShowDuplicateModal(true)
        return
      }
    } catch (error) {
      console.error('Error checking URL existence:', error)
      // Continue with generation if check fails
    }

    generateMutation.mutate({
      url,
      options: {
        ...options,
        ...(selectedSchemaType !== 'Auto' && { requestedSchemaTypes: [selectedSchemaType] })
      }
    })
  }

  const handleUrlChange = (value: string) => {
    setUrl(value)
    // Clear previous results and validation errors when URL changes
    if (generatedSchemas.length > 0 || generationMetadata || schemaScore) {
      setGeneratedSchemas([])
      setHtmlScriptTags('')
      setGenerationMetadata(null)
      setSchemaScore(null)
      setPreviousScore(undefined)
      setRefinementCount(0)
      setHighlightedChanges([])
    }
  }

  // Modal handlers
  const handleCloseModal = () => {
    setShowDuplicateModal(false)
    setDuplicateUrlData(null)
  }

  const handleViewExisting = () => {
    if (duplicateUrlData?.urlId) {
      navigate(`/library?urlId=${duplicateUrlData.urlId}`)
    }
    handleCloseModal()
  }

  const handleGenerateAnyway = () => {
    handleCloseModal()
    if (url) {
      generateMutation.mutate({
        url,
        options: {
          ...options,
          ...(selectedSchemaType !== 'Auto' && { requestedSchemaTypes: [selectedSchemaType] })
        }
      })
    }
  }

  const handleAddSchemaType = async (schemaType: string) => {
    if (!url) return

    // Find the label for display purposes
    const schemaTypeInfo = SCHEMA_TYPES.find(st => st.value === schemaType)
    const schemaTypeLabel = schemaTypeInfo?.label || schemaType

    setShowAddSchemaType(false)
    setIsAddingSchemaType(true)
    setPendingSchemaType(schemaTypeLabel)

    try {
      const response = await apiService.generateSchema(url, {
        ...options,
        requestedSchemaTypes: [schemaType]
      })

      console.log('🔍 Add Schema Type - API Response:', {
        schemaType,
        hasUrlId: !!response.data?.urlId,
        schemasInResponse: response.data?.schemas?.length,
        responseSchemaTypes: response.data?.schemas?.map((s: any) => s['@type'])
      })

      if (response.success && response.data) {
        // Store URL ID and refetch all schemas to show new tab
        if (response.data.urlId) {
          setCurrentUrlId(response.data.urlId)

          // Add small delay to ensure database write completes
          await new Promise(resolve => setTimeout(resolve, 150))

          // Use refetchQueries instead of invalidateQueries for immediate data access
          await queryClient.refetchQueries({ queryKey: ['urlSchemas', response.data.urlId] })

          // Access the fresh data directly from the query
          const updatedSchemas = queryClient.getQueryData<any>(['urlSchemas', response.data.urlId])

          console.log('🔍 Add Schema Type - After Refetch:', {
            hasUpdatedSchemas: !!updatedSchemas?.data,
            totalSchemas: updatedSchemas?.data?.length,
            schemaTypes: updatedSchemas?.data?.map((s: any) => ({
              id: s.id,
              schemaType: s.schemaType,
              firstSchemaType: Array.isArray(s.schemas) ? s.schemas[0]?.['@type'] : s.schemas?.['@type']
            }))
          })

          if (updatedSchemas?.data && Array.isArray(updatedSchemas.data)) {
            // Find the newly generated schema by matching schemaType value
            const newSchemaIndex = updatedSchemas.data.findIndex((s: any) => s.schemaType === schemaType)

            console.log('🔍 Add Schema Type - Finding Schema:', {
              searchingFor: schemaType,
              foundIndex: newSchemaIndex,
              foundRecord: newSchemaIndex !== -1 ? {
                id: updatedSchemas.data[newSchemaIndex].id,
                schemaType: updatedSchemas.data[newSchemaIndex].schemaType,
                hasSchemas: !!updatedSchemas.data[newSchemaIndex].schemas
              } : null
            })

            if (newSchemaIndex !== -1) {
              setSelectedSchemaIndex(newSchemaIndex)
              const newRecord = updatedSchemas.data[newSchemaIndex]
              const schemasToLoad = Array.isArray(newRecord.schemas) ? newRecord.schemas : [newRecord.schemas]

              console.log('🔍 Add Schema Type - Loading Schemas:', {
                recordId: newRecord.id,
                recordSchemaType: newRecord.schemaType,
                schemasCount: schemasToLoad.length,
                schemaContentTypes: schemasToLoad.map((s: any) => s['@type'])
              })

              setGeneratedSchemas(schemasToLoad)
              setSchemaScore(newRecord.schemaScore || null)
              setRefinementCount(newRecord.refinementCount || 0)

              // Update generationMetadata to include this new schema's ID for refinement
              setGenerationMetadata({
                ...generationMetadata,
                schemaId: newRecord.id,
                url: url || generationMetadata?.url
              })

              console.log('🆔 Updated generationMetadata with new schema ID:', {
                schemaId: newRecord.id,
                schemaType: newRecord.schemaType
              })

              // Clear htmlScriptTags to force editor to display the new schema
              // Otherwise it would show cached HTML from the previous schema
              setHtmlScriptTags('')

              // Validate that we loaded the correct schema type
              const loadedTypes = schemasToLoad.map((s: any) => s['@type'])
              if (!loadedTypes.includes(schemaType)) {
                console.error('⚠️ Schema type mismatch!', {
                  requested: schemaType,
                  loaded: loadedTypes,
                  recordType: newRecord.schemaType
                })
              } else {
                console.log('✅ Successfully loaded correct schema type:', schemaType)
              }
            } else {
              console.error('⚠️ Could not find schema with type:', schemaType)
            }
          }
        }

        refetchCredits()

        // Invalidate library queries
        queryClient.invalidateQueries({ queryKey: ['domains'] })
        queryClient.invalidateQueries({ queryKey: ['urls'] })

        toast.success(`Successfully generated ${schemaTypeLabel} schema!`)
      }
    } catch (error: any) {
      const message = error.response?.data?.error || 'Failed to generate schema'
      toast.error(message)
      console.error('Schema generation error:', error)
    } finally {
      setIsAddingSchemaType(false)
      setPendingSchemaType(null)
    }
  }

  const handleRefineSchema = async () => {
    if (!generatedSchemas.length || refinementCount >= MAX_REFINEMENTS || isRefining) return

    console.log('🔧 Starting refinement:', {
      schemaId: generationMetadata?.schemaId,
      url,
      currentRefinementCount: refinementCount,
      schemaTypes: generatedSchemas.map(s => s['@type'])
    })

    setIsRefining(true)
    setPreviousScore(schemaScore?.overallScore)

    try {
      const response = await apiService.refineSchema(generatedSchemas, url, {
        ...options,
        ...(selectedSchemaType !== 'Auto' && { requestedSchemaTypes: [selectedSchemaType] })
      }, generationMetadata?.schemaId)

      if (response.success && response.data) {
        console.log('✅ Refinement successful:', {
          schemaId: generationMetadata?.schemaId,
          newRefinementCount: response.data.refinementCount,
          schemaTypes: response.data.schemas.map(s => s['@type'])
        })

        setGeneratedSchemas(response.data.schemas)
        setHtmlScriptTags(response.data.htmlScriptTags || '')
        setSchemaScore(response.data.schemaScore || null)
        setHighlightedChanges(response.data.highlightedChanges || [])

        // Update refinement count from server response if available
        const newRefinementCount = response.data.refinementCount ?? (refinementCount + 1)
        setRefinementCount(newRefinementCount)

        // Refetch all schemas for this URL to get updated data
        if (currentUrlId) {
          await queryClient.refetchQueries({ queryKey: ['urlSchemas', currentUrlId] })
        }

        const remaining = response.data.remainingRefinements ?? (MAX_REFINEMENTS - newRefinementCount)
        toast.success(`Schema refined! ${remaining} refinement${remaining !== 1 ? 's' : ''} remaining.`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to refine schema')
      console.error('Schema refinement error:', error)
    } finally {
      setIsRefining(false)
    }
  }

  const handleSchemaChange = (schemas: JsonLdSchema[]) => {
    setGeneratedSchemas(schemas)
  }

  const handleValidate = async (schemas: JsonLdSchema[]) => {
    return validateMutation.mutateAsync(schemas)
  }

  const isGenerating = generateMutation.isPending
  const isValidating = validateMutation.isPending
  const creditBalance = creditsData?.data?.creditBalance || 0

  return (
    <div className="space-y-6 max-w-[2000px]">
      {/* Low Credit Warning */}
      <LowCreditWarning threshold={3} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schema Generator</h1>
          <p className="text-muted-foreground">
            Generate AI-optimized JSON-LD schema markup for any website
          </p>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <CreditCard className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Credits:</span>
          <span className="font-medium">{creditBalance}</span>
        </div>
      </div>

      {/* 2-Column Layout: Form on Left (40%), Editor on Right (60%) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(500px,2fr)_minmax(0,3fr)] gap-6">
        {/* LEFT COLUMN - Generation Form */}
        <div className="space-y-6 min-w-[500px]">
          {/* Generation Form */}
          <div className="bg-card border border-border rounded-lg p-6">
            <form onSubmit={handleGenerate} className="space-y-4">
          {/* Schema Type Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Primary Schema Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSchemaSelector(!showSchemaSelector)}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-left focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent flex items-center justify-between"
                disabled={isGenerating}
              >
                <span className="text-sm">
                  {(() => {
                    const selected = SCHEMA_TYPES.find(s => s.value === selectedSchemaType)
                    return selected ? selected.label : 'Select schema type...'
                  })()}
                </span>
                <span className="text-muted-foreground">▼</span>
              </button>

              {showSchemaSelector && (
                <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                  {SCHEMA_TYPES.map((schemaType) => (
                    <label
                      key={schemaType.value}
                      className="flex items-start space-x-3 p-3 hover:bg-accent cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="schemaType"
                        value={schemaType.value}
                        checked={selectedSchemaType === schemaType.value}
                        onChange={(e) => {
                          setSelectedSchemaType(e.target.value)
                          setShowSchemaSelector(false)
                        }}
                        className="mt-0.5 rounded border-border"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{schemaType.label}</div>
                        <div className="text-xs text-muted-foreground">{schemaType.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Schema Type Preview */}
            {selectedSchemaType && (
              <div className="mt-2">
                {(() => {
                  const selected = SCHEMA_TYPES.find(s => s.value === selectedSchemaType)
                  return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20">
                      {selected?.label}
                    </span>
                  )
                })()}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="url" className="block text-sm font-medium mb-2">
              Website URL
            </label>
            <div className="flex space-x-2">
              <input
                ref={urlInputRef}
                type="url"
                id="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com/page"
                className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={isGenerating}
                required
              />
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className={cn(
                  'px-3 py-2 border border-border rounded-md hover:bg-accent transition-colors',
                  showOptions && 'bg-accent'
                )}
                disabled={isGenerating}
              >
                <Settings className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Advanced Options */}
          {showOptions && (
            <div className="border border-border rounded-md p-4 bg-muted/20">
              <h3 className="text-sm font-medium mb-3">Generation Options</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(options).map(([key, value]) => (
                  <label key={key} className="flex items-center space-x-2 text-sm">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                      className="rounded border-border"
                      disabled={isGenerating}
                    />
                    <span className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={!url || isGenerating || creditBalance < 1}
            className="w-full flex items-center justify-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isGenerating ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Generating Schema...
              </>
            ) : (
              <>
                <LightningBoltIcon className="h-4 w-4 mr-2" />
                Generate Schema (1 credit)
              </>
            )}
          </button>

          {creditBalance < 1 && (
            <div className="flex items-center justify-center p-3 bg-warning border border-warning rounded-md">
              <AlertCircle className="h-4 w-4 text-warning-foreground mr-2" />
              <span className="text-sm text-warning-foreground">
                You need at least 1 credit to generate schema.
                <button className="ml-1 underline hover:no-underline">
                  Purchase credits
                </button>
              </span>
            </div>
          )}
            </form>
          </div>

          {/* Generation Status */}
          {(isGenerating || generationMetadata) && (
            <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {isGenerating ? (
                <>
                  <Loader2 className="animate-spin h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium">Generating Schema...</p>
                    <p className="text-sm text-muted-foreground">
                      Analyzing content and generating optimized markup
                    </p>
                  </div>
                </>
              ) : generationMetadata?.isValidationError ? (
                <>
                  <AlertCircle className="h-5 w-5 text-warning-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-warning-foreground">Content Analysis Feedback</p>
                    <p className="text-sm text-warning-foreground mt-1 leading-relaxed">
                      {generationMetadata.error}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {generationMetadata.processingTimeMs}ms
                      </span>
                      <span className="flex items-center text-success-foreground">
                        <CreditCard className="h-3 w-3 mr-1" />
                        No credits used
                      </span>
                      <a
                        href={generationMetadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View source
                      </a>
                    </div>
                  </div>
                </>
              ) : generationMetadata ? (
                <>
                  <CheckCircle className="h-5 w-5 text-success-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Schema Generated Successfully</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {generationMetadata.processingTimeMs}ms
                      </span>
                      <span className="flex items-center">
                        <CreditCard className="h-3 w-3 mr-1" />
                        {generationMetadata.creditsUsed} credit used
                      </span>
                      <a
                        href={generationMetadata.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center hover:text-primary transition-colors"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View source
                      </a>
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
            </div>
          )}

          {/* Schema Quality Score */}
          {schemaScore && generationMetadata && (
            <SchemaScore
              score={schemaScore}
              url={generationMetadata.url}
              onRefineSchema={handleRefineSchema}
              isRefining={isRefining}
              canRefine={refinementCount < MAX_REFINEMENTS}
              previousScore={previousScore}
              refinementCount={refinementCount}
              maxRefinements={MAX_REFINEMENTS}
            />
          )}

        </div>

        {/* RIGHT COLUMN - Schema Editor */}
        <div className="space-y-6">
          {/* Generated Schemas */}
          {generatedSchemas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Generated Schema</h2>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{allSchemaRecords.length || 1} type{allSchemaRecords.length !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Schema Type Tabs */}
          {allSchemaRecords.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 p-2 bg-muted/30 rounded-lg">
              {allSchemaRecords.map((record, index) => (
                <button
                  key={record.id}
                  onClick={() => {
                    console.log('🔄 Tab Click - Switching to schema:', {
                      index,
                      schemaType: record.schemaType,
                      recordId: record.id,
                      refinementCount: record.refinementCount
                    })

                    setSelectedSchemaIndex(index)
                    // Load the schemas from this record
                    const schemas = Array.isArray(record.schemas)
                      ? record.schemas
                      : [record.schemas]

                    setGeneratedSchemas(schemas)
                    setSchemaScore(record.schemaScore || null)
                    setRefinementCount(record.refinementCount || 0)

                    // Update generationMetadata to include this record's ID for refinement
                    setGenerationMetadata({
                      ...generationMetadata,
                      schemaId: record.id,
                      url: url || generationMetadata?.url
                    })

                    // Clear htmlScriptTags to force editor to display the actual schema for this tab
                    // Otherwise it would show the cached HTML from a different schema type
                    setHtmlScriptTags('')
                  }}
                  className={cn(
                    'px-3 py-1.5 text-sm rounded-md transition-colors',
                    selectedSchemaIndex === index
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {record.schemaType}
                </button>
              ))}

              {/* Loading Indicator Badge */}
              {isAddingSchemaType && pendingSchemaType && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary/5 border border-primary/20 text-primary">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Generating {pendingSchemaType}...</span>
                </div>
              )}

              {/* Add Another Schema Type Button */}
              {allSchemaRecords.length < 10 && (
                <div className="relative">
                  <button
                    onClick={() => setShowAddSchemaType(!showAddSchemaType)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-colors"
                    disabled={isAddingSchemaType}
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add Schema Type</span>
                    <span className="text-xs opacity-70">(Free)</span>
                  </button>

                  {showAddSchemaType && !isAddingSchemaType && (
                    <div className="absolute z-10 top-full mt-1 left-0 min-w-[250px] bg-background border border-border rounded-md shadow-lg max-h-64 overflow-y-auto">
                      {SCHEMA_TYPES
                        .filter(st => st.value !== 'Auto' && !allSchemaRecords.some(r => r.schemaType === st.value))
                        .map((schemaType) => (
                          <button
                            key={schemaType.value}
                            onClick={() => handleAddSchemaType(schemaType.value)}
                            className="w-full text-left px-3 py-2 hover:bg-accent transition-colors"
                          >
                            <div className="text-sm font-medium">{schemaType.label}</div>
                            <div className="text-xs text-muted-foreground">{schemaType.description}</div>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <SchemaEditor
            key={`schema-editor-${selectedSchemaIndex}-${currentUrlId}`}
            schemas={generatedSchemas}
            htmlScriptTags={htmlScriptTags}
            onSchemaChange={handleSchemaChange}
            onValidate={handleValidate}
            height="500px"
            highlightedChanges={highlightedChanges}
          />

          {/* Push to HubSpot Button - Show for all users with HubSpot connections */}
          {htmlScriptTags && hubspotConnections.length > 0 && (
            <div className="flex items-center justify-between bg-muted/20 border border-border rounded-lg p-4">
              <div className="flex-1">
                <h3 className="font-medium mb-1">Push to HubSpot</h3>
                <p className="text-sm text-muted-foreground">
                  {hasActiveHubSpotConnection
                    ? 'Automatically inject this schema into your HubSpot content'
                    : 'Connect your HubSpot account to push schema directly'}
                </p>
              </div>
              <button
                onClick={handlePushToHubSpot}
                disabled={pushToHubSpotMutation.isPending}
                className={cn(
                  'px-4 py-2 rounded-md font-medium transition-colors flex items-center space-x-2',
                  hasActiveHubSpotConnection
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                )}
              >
                {pushToHubSpotMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Pushing...</span>
                  </>
                ) : (
                  <>
                    <svg className="h-4 w-4" viewBox="6.20856283 .64498824 244.26943717 251.24701176" xmlns="http://www.w3.org/2000/svg">
                      <path d="m191.385 85.694v-29.506a22.722 22.722 0 0 0 13.101-20.48v-.677c0-12.549-10.173-22.722-22.721-22.722h-.678c-12.549 0-22.722 10.173-22.722 22.722v.677a22.722 22.722 0 0 0 13.101 20.48v29.506a64.342 64.342 0 0 0 -30.594 13.47l-80.922-63.03c.577-2.083.878-4.225.912-6.375a25.6 25.6 0 1 0 -25.633 25.55 25.323 25.323 0 0 0 12.607-3.43l79.685 62.007c-14.65 22.131-14.258 50.974.987 72.7l-24.236 24.243c-1.96-.626-4-.959-6.057-.987-11.607.01-21.01 9.423-21.007 21.03.003 11.606 9.412 21.014 21.018 21.017 11.607.003 21.02-9.4 21.03-21.007a20.747 20.747 0 0 0 -.988-6.056l23.976-23.985c21.423 16.492 50.846 17.913 73.759 3.562 22.912-14.352 34.475-41.446 28.985-67.918-5.49-26.473-26.873-46.734-53.603-50.792m-9.938 97.044a33.17 33.17 0 1 1 0-66.316c17.85.625 32 15.272 32.01 33.134.008 17.86-14.127 32.522-31.977 33.165" fill="currentColor"/>
                    </svg>
                    <span>{hasActiveHubSpotConnection ? 'Push to HubSpot' : 'Connect HubSpot'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Rich Results Preview */}
          <RichResultsPreview schemas={generatedSchemas} />

          {/* Schema Types Summary */}
          <div className="bg-muted/20 border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium mb-3">Generated Schema Types</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {generatedSchemas.map((schema, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-3 text-center hover:border-primary/50 transition-colors">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  </div>
                  <div className="font-medium text-sm">{schema['@type']}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Schema {index + 1}
                  </div>
                  <div className="text-xs text-success-foreground mt-1">
                    ✓ Generated
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground text-center">
              💡 Click the tabs above to view and edit each schema individually
            </div>
          </div>
            </div>
          )}

          {/* Loading State with Dad Jokes */}
          {generatedSchemas.length === 0 && isGenerating && (
            <JokeDisplay />
          )}

          {/* Help Text - Ready State */}
          {generatedSchemas.length === 0 && !isGenerating && (
            <div className="text-center py-8 text-muted-foreground bg-card border border-border rounded-lg">
              <LightningBoltIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Ready to Generate Schema</h3>
              <p className="text-sm max-w-md mx-auto">
                Enter a website URL in the form to automatically generate optimized JSON-LD schema markup
                that will improve your site's visibility in search engines and AI-powered search.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Duplicate URL Modal */}
      <DuplicateUrlModal
        isOpen={showDuplicateModal}
        onClose={handleCloseModal}
        url={duplicateUrlData?.url || ''}
        createdAt={duplicateUrlData?.createdAt}
        onViewExisting={handleViewExisting}
        onGenerateAnyway={handleGenerateAnyway}
      />

      {/* HubSpot Content Matcher Modal */}
      {selectedHubSpotConnection && (
        <HubSpotContentMatcher
          isOpen={showHubSpotMatcher}
          onClose={() => setShowHubSpotMatcher(false)}
          onSelectContent={handleSelectHubSpotContent}
          connectionId={selectedHubSpotConnection}
          targetUrl={url}
        />
      )}

      {/* Unassociated Domain Warning Modal */}
      <UnassociatedDomainModal
        isOpen={showUnassociatedDomainModal}
        onClose={() => setShowUnassociatedDomainModal(false)}
        url={url}
        onGoToSettings={() => {
          setShowUnassociatedDomainModal(false)
          navigate('/hubspot')
        }}
      />
    </div>
  )
}