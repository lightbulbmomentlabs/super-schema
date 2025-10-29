import { useState, useRef, useEffect, useCallback } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useUser, useAuth } from '@clerk/clerk-react'
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
import TimeoutErrorModal from './TimeoutErrorModal'
import SupportModal from './SupportModal'
import HubSpotContentMatcher from './HubSpotContentMatcher'
import UnassociatedDomainModal from './UnassociatedDomainModal'
import JokeDisplay from './JokeDisplay'
import { apiService } from '@/services/api'
import { hubspotApi } from '@/services/hubspot'
import { cn } from '@/utils/cn'
import { calculateSchemaScore } from '@/utils/calculateSchemaScore'
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
  const { isLoaded } = useAuth()
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

  // Timeout error modal state
  const [showTimeoutModal, setShowTimeoutModal] = useState(false)
  const [timeoutErrorData, setTimeoutErrorData] = useState<{
    url: string
    errorMessage: string
  } | null>(null)
  const [isCheckingComplete, setIsCheckingComplete] = useState(false)

  // Support modal state
  const [showSupportModal, setShowSupportModal] = useState(false)

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

  // Session storage key for persisting schema state
  const SESSION_STORAGE_KEY = 'schemaGenerator_state'

  // Restore state from sessionStorage on mount
  useEffect(() => {
    const savedState = sessionStorage.getItem(SESSION_STORAGE_KEY)
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState)
        // Only restore if it's recent (within 1 hour)
        const oneHourAgo = Date.now() - (60 * 60 * 1000)
        if (parsed.timestamp && parsed.timestamp > oneHourAgo) {
          console.log('🔄 Restoring schema state from session storage')
          setGeneratedSchemas(parsed.schemas || [])
          setHtmlScriptTags(parsed.htmlScriptTags || '')
          setGenerationMetadata(parsed.metadata || null)
          setSchemaScore(parsed.schemaScore || null)
          setUrl(parsed.url || '')
          setCurrentUrlId(parsed.urlId || null)
          setRefinementCount(parsed.refinementCount || 0)
        } else {
          // Clear expired state
          sessionStorage.removeItem(SESSION_STORAGE_KEY)
        }
      } catch (error) {
        console.error('Failed to restore schema state:', error)
        sessionStorage.removeItem(SESSION_STORAGE_KEY)
      }
    }
  }, [])

  // Save state to sessionStorage whenever schemas change
  useEffect(() => {
    if (generatedSchemas.length > 0) {
      const stateToSave = {
        schemas: generatedSchemas,
        htmlScriptTags,
        metadata: generationMetadata,
        schemaScore,
        url,
        urlId: currentUrlId,
        refinementCount,
        timestamp: Date.now()
      }
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(stateToSave))
      console.log('💾 Saved schema state to session storage')
    }
  }, [generatedSchemas, htmlScriptTags, generationMetadata, schemaScore, url, currentUrlId, refinementCount])

  // Fetch all schemas for the current URL (multi-schema support)
  // Configuration matches LibraryPage exactly to ensure optimistic updates work correctly
  const { data: allSchemasResponse } = useQuery({
    queryKey: ['urlSchemas', currentUrlId],
    queryFn: () => currentUrlId ? apiService.getAllUrlSchemas(currentUrlId) : null,
    enabled: !!currentUrlId
  })

  // CRITICAL FIX: Read directly from cache instead of using query hook result
  // The query hook can have stale data even after optimistic updates
  const cacheData = currentUrlId
    ? queryClient.getQueryData<any>(['urlSchemas', currentUrlId])
    : null

  const allSchemaRecords = cacheData?.data || allSchemasResponse?.data || []

  // Get the currently selected schema record
  const selectedSchemaRecord = allSchemaRecords[selectedSchemaIndex] || allSchemaRecords[0]

  console.log('🔍 [GeneratePage] Raw cache data:', {
    hasResponse: !!allSchemasResponse,
    hasCacheData: !!cacheData,
    hasData: !!allSchemasResponse?.data,
    recordsCount: allSchemaRecords.length,
    selectedIndex: selectedSchemaIndex,
    usingCache: !!cacheData,
    selectedRecord: selectedSchemaRecord ? {
      id: selectedSchemaRecord.id,
      schemaType: selectedSchemaRecord.schemaType,
      schemasType: typeof selectedSchemaRecord.schemas,
      schemasIsArray: Array.isArray(selectedSchemaRecord.schemas),
      schemasKeys: selectedSchemaRecord.schemas && typeof selectedSchemaRecord.schemas === 'object'
        ? Object.keys(selectedSchemaRecord.schemas)
        : null,
      schemasHasWrapperStructure: selectedSchemaRecord.schemas &&
        typeof selectedSchemaRecord.schemas === 'object' &&
        'schemas' in selectedSchemaRecord.schemas &&
        !('@type' in selectedSchemaRecord.schemas),
      schemasPreview: selectedSchemaRecord.schemas && typeof selectedSchemaRecord.schemas === 'object' && 'schemas' in selectedSchemaRecord.schemas
        ? (Array.isArray(selectedSchemaRecord.schemas.schemas)
            ? selectedSchemaRecord.schemas.schemas.slice(0, 1).map((s: any) => ({
                type: s['@type'],
                hasName: !!s.name,
                namePreview: s.name?.substring(0, 30)
              }))
            : { type: selectedSchemaRecord.schemas.schemas?.['@type'] })
        : null
    } : null
  })

  // Extract schemas array from selected record (similar to LibraryPage)
  // This ensures schemas are derived from query data and sync with cache updates
  let schemasFromQuery: any[] = []
  if (selectedSchemaRecord?.schemas) {
    const schemas = selectedSchemaRecord.schemas

    console.log('🔎 [GeneratePage] Extraction input:', {
      schemasType: typeof schemas,
      isArray: Array.isArray(schemas),
      hasAtType: schemas && typeof schemas === 'object' && '@type' in schemas,
      hasSchemas: schemas && typeof schemas === 'object' && 'schemas' in schemas,
      descriptionPreview: schemas && typeof schemas === 'object' && 'description' in schemas
        ? schemas.description?.substring(0, 50)
        : 'N/A',
      fullSchemas: schemas
    })

    if (Array.isArray(schemas)) {
      schemasFromQuery = schemas.map(item => {
        if (item && typeof item === 'object' && 'schemas' in item && Array.isArray(item.schemas)) {
          return item.schemas
        }
        if (item && typeof item === 'object' && 'schemas' in item && !Array.isArray(item.schemas)) {
          return [item.schemas]
        }
        return item
      }).flat()
    } else if (schemas && typeof schemas === 'object') {
      if (schemas['@type']) {
        schemasFromQuery = [schemas]
      } else if ('schemas' in schemas) {
        schemasFromQuery = Array.isArray(schemas.schemas) ? schemas.schemas : [schemas.schemas]
      } else {
        schemasFromQuery = [schemas]
      }
    }
  }

  console.log('🔍 [GeneratePage] Extracted schemasFromQuery:', {
    count: schemasFromQuery.length,
    preview: schemasFromQuery.slice(0, 1).map(s => ({
      type: s['@type'],
      hasName: !!s.name,
      namePreview: s.name?.substring(0, 30),
      hasDescription: !!s.description,
      descriptionPreview: s.description?.substring(0, 30)
    }))
  })

  // Use schemas from query when available (syncs with cache), fallback to local state
  const displaySchemas = schemasFromQuery.length > 0 ? schemasFromQuery : generatedSchemas

  console.log('📋 [GeneratePage] Schema source:', {
    hasQuerySchemas: schemasFromQuery.length > 0,
    hasLocalSchemas: generatedSchemas.length > 0,
    usingSource: schemasFromQuery.length > 0 ? 'query' : 'local',
    selectedSchemaIndex,
    allSchemaRecords: allSchemaRecords.length,
    displaySchemasPreview: displaySchemas.slice(0, 1).map(s => ({
      type: s?.['@type'],
      namePreview: s?.name?.substring(0, 30),
      descriptionPreview: s?.description?.substring(0, 80) + '...'
    })),
    fullDisplaySchemas: displaySchemas
  })

  // Get user credits - Wait for Clerk to load before firing
  const { data: creditsData, refetch: refetchCredits } = useQuery({
    queryKey: ['user-credits'],
    queryFn: () => apiService.getCredits(),
    enabled: isLoaded,  // Prevents race condition with Clerk auth
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
      const errorMessage = error.response?.data?.error || error.message || 'Failed to generate schema'

      // Handle timeout errors with modal
      if (errorMessage.toLowerCase().includes('timeout') ||
          errorMessage.toLowerCase().includes('exceeded') ||
          errorMessage.toLowerCase().includes('timed out')) {

        // Track timeout analytics
        console.log('⏱️ Schema generation timeout:', {
          url,
          errorMessage,
          timestamp: new Date().toISOString()
        })

        // Show timeout modal
        setTimeoutErrorData({
          url,
          errorMessage
        })
        setShowTimeoutModal(true)
        return
      }

      // Handle content validation errors with helpful feedback
      if (error.response?.status === 400 && error.response?.data?.error) {
        const errorMsg = error.response.data.error

        // Check if this is a content validation error
        if (errorMsg.includes('Content not suitable for schema generation') ||
            errorMsg.includes('not accessible') ||
            errorMsg.includes('validation')) {
          // Show a more user-friendly message for content validation
          toast.error('Content Analysis', {
            duration: 8000, // Show longer for detailed feedback
          })

          // Also set the error as metadata so we can display it properly
          setGenerationMetadata({
            url,
            error: errorMsg,
            isValidationError: true,
            processingTimeMs: error.response.data.data?.metadata?.processingTimeMs || 0
          })
          return
        }
      }

      // Handle other errors normally
      toast.error(errorMessage)
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
    if (!selectedHubSpotConnection) {
      toast.error('Missing connection or schema data')
      return
    }

    // Generate HTML script tags from all schema records (similar to LibraryPage)
    let schemaHtml = ''
    if (allSchemaRecords.length > 0) {
      // Generate from all schema records when available
      schemaHtml = allSchemaRecords
        .map(record => {
          let schemas = record.schemas
          if (!Array.isArray(schemas)) {
            schemas = [schemas]
          }
          return schemas
            .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
            .join('\n')
        })
        .join('\n')
    } else if (htmlScriptTags) {
      // Fallback to htmlScriptTags if no records yet
      schemaHtml = htmlScriptTags
    } else if (displaySchemas.length > 0) {
      // Final fallback: generate from displaySchemas
      schemaHtml = displaySchemas
        .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
        .join('\n')
    }

    if (!schemaHtml) {
      toast.error('No schema data available')
      return
    }

    pushToHubSpotMutation.mutate({
      connectionId: selectedHubSpotConnection,
      contentId: match.contentId,
      contentType: match.contentType as 'blog_post' | 'page' | 'landing_page',
      schemaHtml,
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

    // Check if URL already exists in user's library with schema
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

  const handleCheckComplete = async () => {
    if (!timeoutErrorData?.url) return

    setIsCheckingComplete(true)

    try {
      // Fetch all URLs from library
      const response = await apiService.getUrls()
      const urls = response.data || []

      // Find matching URL (check both exact match and normalized match)
      const normalizedTimeoutUrl = timeoutErrorData.url.toLowerCase().replace(/\/$/, '')
      const matchingUrl = urls.find((urlRecord: any) => {
        const recordUrl = urlRecord.url.toLowerCase().replace(/\/$/, '')
        return recordUrl === normalizedTimeoutUrl
      })

      if (matchingUrl && matchingUrl.id) {
        console.log('✅ Found completed schema in library:', matchingUrl)

        // Fetch all schemas for this URL
        const schemasResponse = await apiService.getAllUrlSchemas(matchingUrl.id)
        const schemaRecords = schemasResponse.data || []

        if (schemaRecords.length > 0) {
          // Get the most recent schema record
          const latestRecord = schemaRecords[0]

          // Extract schemas from the record
          let schemasToLoad: any[] = []
          if (Array.isArray(latestRecord.schemas)) {
            schemasToLoad = latestRecord.schemas.flatMap((item: any) => {
              if (item && typeof item === 'object' && 'schemas' in item && Array.isArray(item.schemas)) {
                return item.schemas
              }
              return item
            })
          } else if (latestRecord.schemas && typeof latestRecord.schemas === 'object') {
            if ('schemas' in latestRecord.schemas && Array.isArray(latestRecord.schemas.schemas)) {
              schemasToLoad = latestRecord.schemas.schemas
            } else {
              schemasToLoad = [latestRecord.schemas]
            }
          }

          // Load into editor
          setGeneratedSchemas(schemasToLoad)
          setUrl(timeoutErrorData.url)
          setCurrentUrlId(matchingUrl.id)
          setSchemaScore(latestRecord.schemaScore || null)
          setGenerationMetadata(latestRecord.metadata || null)

          // Close modal and show success
          setShowTimeoutModal(false)
          toast.success('Schema found and loaded! It completed in the background.')
        } else {
          toast.error('Schema record found but no schema data available')
        }
      } else {
        toast.error('Schema not found yet. It may still be processing - try again in a moment.')
      }
    } catch (error) {
      console.error('Error checking for completed schema:', error)
      toast.error('Error checking for schema completion')
    } finally {
      setIsCheckingComplete(false)
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

  // Mutation for updating schema
  const updateSchemaMutation = useMutation({
    mutationFn: ({ urlId, schemas }: { urlId: string; schemas: any[]; schemaIndex: number }) =>
      apiService.updateUrlSchema(urlId, schemas),
    // Use onMutate for IMMEDIATE optimistic update (before server responds)
    onMutate: async (variables) => {
      console.log('⚡ [GeneratePage onMutate] Starting optimistic update:', {
        urlId: variables.urlId,
        schemasCount: variables.schemas.length,
        schemaIndex: variables.schemaIndex
      })

      // Cancel any outgoing refetches to prevent them from overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['urlSchemas', variables.urlId] })

      // Get current cache data for rollback
      const previousData = queryClient.getQueryData(['urlSchemas', variables.urlId])

      // Optimistically update the cache IMMEDIATELY
      queryClient.setQueryData(['urlSchemas', variables.urlId], (oldData: any) => {
        if (!oldData) {
          console.warn('⚠️ [GeneratePage onMutate] No old data in cache!')
          return oldData
        }

        // oldData.data is an ARRAY of schema records
        const updatedRecords = Array.isArray(oldData.data)
          ? oldData.data.map((record: any, index: number) => {
              if (index === variables.schemaIndex) {
                const newSchemas = variables.schemas.length === 1 ? variables.schemas[0] : variables.schemas

                // Check if old data uses wrapper structure {schemas: [...], status, processingTimeMs}
                // If so, preserve the wrapper and only update the schemas inside
                let updatedSchemas
                if (record.schemas && typeof record.schemas === 'object' && 'schemas' in record.schemas && !('@type' in record.schemas)) {
                  // Wrapper structure exists, preserve it
                  console.log('🔧 [GeneratePage] Preserving wrapper structure')
                  updatedSchemas = {
                    ...record.schemas,
                    schemas: newSchemas
                  }
                } else {
                  // Direct schema structure, replace it
                  console.log('🔧 [GeneratePage] Using direct schema structure')
                  updatedSchemas = newSchemas
                }

                return {
                  ...record,
                  schemas: updatedSchemas
                }
              }
              return record
            })
          : oldData.data

        console.log('🔄 [GeneratePage onMutate] Cache updated optimistically:', {
          schemaIndex: variables.schemaIndex,
          oldSchemas: Array.isArray(oldData.data) ? oldData.data[variables.schemaIndex]?.schemas : null,
          newSchemas: Array.isArray(updatedRecords) ? updatedRecords[variables.schemaIndex]?.schemas : null
        })

        return {
          ...oldData,
          data: updatedRecords
        }
      })

      // Force React Query to re-read from cache (but don't refetch from server)
      // This ensures the query result reflects the optimistic update immediately
      queryClient.invalidateQueries({
        queryKey: ['urlSchemas', variables.urlId],
        refetchType: 'none'
      })

      // Return context for rollback on error
      return { previousData }
    },
    onError: (err, variables, context) => {
      console.error('❌ [GeneratePage onError] Mutation failed, rolling back:', err)
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(['urlSchemas', variables.urlId], context.previousData)
      }
      toast.error('Failed to save schema changes')
    },
    onSuccess: () => {
      console.log('✅ [GeneratePage onSuccess] Schema saved to server successfully')
    }
  })

  const handleSchemaChange = useCallback(
    (schemas: JsonLdSchema[]) => {
      // Save to database if we have a URL ID
      if (currentUrlId) {
        console.log('💾 [GeneratePage handleSchemaChange] Saving schema changes:', {
          currentUrlId,
          selectedSchemaIndex,
          schemasCount: schemas.length,
          schemasPreview: schemas.map(s => ({
            type: s['@type'],
            hasName: !!s.name,
            hasDescription: !!s.description
          }))
        })

        // CRITICAL FIX: Clear htmlScriptTags when user edits
        // This forces the editor to display the actual JSON being edited
        // instead of stale HTML from the initial schema generation
        setHtmlScriptTags('')

        updateSchemaMutation.mutate({
          urlId: currentUrlId,
          schemas,
          schemaIndex: selectedSchemaIndex
        })
      } else {
        // No URL ID yet (not saved to database) - use local state
        setGeneratedSchemas(schemas)
      }
    },
    [currentUrlId, selectedSchemaIndex, updateSchemaMutation]
  )

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
          <button
            onClick={() => navigate('/dashboard/credits?purchase=true')}
            className="flex items-center space-x-1 px-2 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
            title="Buy Credits"
          >
            <Plus className="h-3 w-3" />
            <span>Buy</span>
          </button>
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
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">Content Analysis Feedback</p>
                    <p className="text-sm text-foreground mt-1 leading-relaxed">
                      {generationMetadata.error}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                      <span className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {generationMetadata.processingTimeMs}ms
                      </span>
                      <span className="flex items-center text-green-600 dark:text-green-400">
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
          {displaySchemas.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-semibold">Generated Schema</h2>
            </div>
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
            schemas={displaySchemas}
            htmlScriptTags={htmlScriptTags}
            onSchemaChange={handleSchemaChange}
            onValidate={handleValidate}
            height="500px"
            highlightedChanges={highlightedChanges}
          />

          {/* Push to HubSpot Button - Show for all users with HubSpot connections */}
          {displaySchemas.length > 0 && hubspotConnections.length > 0 && (
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
                  'flex items-center gap-2 px-4 py-2 rounded-md transition-colors flex-shrink-0',
                  hasActiveHubSpotConnection
                    ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                    : 'bg-muted text-muted-foreground cursor-not-allowed'
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
          <RichResultsPreview schemas={displaySchemas} />
            </div>
          )}

          {/* Loading State with Dad Jokes */}
          {displaySchemas.length === 0 && isGenerating && (
            <JokeDisplay />
          )}

          {/* Help Text - Ready State */}
          {displaySchemas.length === 0 && !isGenerating && (
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

      {/* Timeout Error Modal */}
      <TimeoutErrorModal
        isOpen={showTimeoutModal}
        onClose={() => setShowTimeoutModal(false)}
        url={timeoutErrorData?.url || ''}
        errorMessage={timeoutErrorData?.errorMessage}
        onContactSupport={() => {
          setShowTimeoutModal(false)
          setShowSupportModal(true)
        }}
        onCheckComplete={handleCheckComplete}
        isChecking={isCheckingComplete}
      />

      {/* Support Modal */}
      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
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