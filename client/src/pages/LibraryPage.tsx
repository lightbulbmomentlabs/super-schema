import { useState, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Library, Search, Eye, EyeOff, Trash2, Loader2, AlertCircle, X, ExternalLink, Sparkles, Plus } from 'lucide-react'
import { apiService } from '@/services/api'
import type { DiscoveredUrl, HubSpotContentMatchResult } from '@shared/types'
import { cn } from '@/utils/cn'
import SchemaEditor from '@/components/SchemaEditor'
import SchemaScoreCompact from '@/components/SchemaScoreCompact'
import RichResultsPreview from '@/components/RichResultsPreview'
import ConfirmModal from '@/components/ConfirmModal'
import HubSpotContentMatcher from '@/components/HubSpotContentMatcher'
import UnassociatedDomainModal from '@/components/UnassociatedDomainModal'
import { toast } from 'react-hot-toast'
import { useNavigate, useSearchParams } from 'react-router-dom'
import LightningBoltIcon from '@/components/icons/LightningBoltIcon'
import SuperSchemaBoltSolid from '@/components/icons/SuperSchemaBoltSolid'
import { calculateSchemaScore } from '@/utils/calculateSchemaScore'
import { MAX_REFINEMENTS } from '@shared/config/refinement'
import { hubspotApi } from '@/services/hubspot'
import { findConnectionByDomain } from '@/utils/domain'
import { SCHEMA_TYPES } from '@/constants/schemaTypes'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDomainId, setSelectedDomainId] = useState<string | undefined>()
  const [schemaFilter, setSchemaFilter] = useState<'all' | 'with' | 'without'>('all')
  const [showHidden, setShowHidden] = useState(false)
  const [selectedUrlId, setSelectedUrlId] = useState<string | null>(null)
  const [selectedSchemaIndex, setSelectedSchemaIndex] = useState<number>(0)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showDeleteSchemaModal, setShowDeleteSchemaModal] = useState(false)
  const [schemaToDelete, setSchemaToDelete] = useState<{ id: string; type: string } | null>(null)
  const [isRefining, setIsRefining] = useState(false)
  const [highlightedChanges, setHighlightedChanges] = useState<string[]>([])
  const [showChangesBanner, setShowChangesBanner] = useState(false)
  const [showHubSpotMatcher, setShowHubSpotMatcher] = useState(false)
  const [selectedHubSpotConnection, setSelectedHubSpotConnection] = useState<string | null>(null)
  const [showUnassociatedDomainModal, setShowUnassociatedDomainModal] = useState(false)
  const [showAddSchemaType, setShowAddSchemaType] = useState(false)
  const [isAddingSchemaType, setIsAddingSchemaType] = useState(false)
  const [pendingSchemaType, setPendingSchemaType] = useState<string | null>(null)
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null) // Used for refinements
  const queryClient = useQueryClient()

  // Set page title
  useEffect(() => {
    document.title = 'Super Schema | Library'
  }, [])

  // Fetch domains
  const { data: domainsResponse, isLoading: domainsLoading } = useQuery({
    queryKey: ['domains'],
    queryFn: () => apiService.getUserDomains(),
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  })

  // Fetch all URLs for counts (unfiltered by schema status)
  const { data: allUrlsResponse, refetch: refetchAllUrls } = useQuery({
    queryKey: ['urls-all', selectedDomainId, showHidden, searchQuery],
    queryFn: () => apiService.getUserUrls({
      domainId: selectedDomainId,
      hasSchema: undefined, // Don't filter by schema status for counts
      isHidden: showHidden ? undefined : false,
      search: searchQuery || undefined
    }),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  })

  // Fetch URLs with filters (for display)
  const { data: urlsResponse, isLoading: urlsLoading, refetch: refetchUrls } = useQuery({
    queryKey: ['urls', selectedDomainId, schemaFilter, showHidden, searchQuery],
    queryFn: () => apiService.getUserUrls({
      domainId: selectedDomainId,
      hasSchema: schemaFilter === 'all' ? undefined : schemaFilter === 'with',
      isHidden: showHidden ? undefined : false,
      search: searchQuery || undefined
    }),
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: true // Refetch when window regains focus
  })

  // Fetch ALL schemas for selected URL (multi-schema support)
  const { data: schemasResponse, isLoading: schemaLoading, error: schemaError } = useQuery({
    queryKey: ['urlSchemas', selectedUrlId],
    queryFn: () => selectedUrlId ? apiService.getAllUrlSchemas(selectedUrlId) : null,
    enabled: !!selectedUrlId
  })

  // Fetch HubSpot connections
  const { data: hubspotConnectionsResponse } = useQuery({
    queryKey: ['hubspot-connections'],
    queryFn: () => hubspotApi.getConnections(),
    refetchOnMount: 'always'
  })

  const hubspotConnections = hubspotConnectionsResponse?.data || []
  const hasActiveHubSpotConnection = hubspotConnections.some(conn => conn.isActive)

  // Log schema response for debugging
  console.log('📊 Schema query state:', {
    selectedUrlId,
    isLoading: schemaLoading,
    hasData: !!schemasResponse,
    data: schemasResponse,
    error: schemaError
  })

  const domains = domainsResponse?.data || []
  const urls = urlsResponse?.data || []
  const allUrls = allUrlsResponse?.data || [] // Unfiltered URLs for counts

  // Handle URL pre-selection from query parameter
  useEffect(() => {
    const urlParam = searchParams.get('url')
    if (urlParam && urls.length > 0) {
      // Find matching URL in the list
      const matchingUrl = urls.find(u => u.url === urlParam)
      if (matchingUrl) {
        setSelectedUrlId(matchingUrl.id)
        // Clear the query parameter
        setSearchParams({})
      }
    }
  }, [searchParams, urls, setSearchParams])

  // Extract schema records (array of schema generations, each with schemaType)
  const schemaRecords = schemasResponse?.data || []

  // Get the currently selected schema record
  const selectedSchemaRecord = schemaRecords[selectedSchemaIndex] || schemaRecords[0]

  // Extract schemas array from selected record
  let schemasArray: any[] = []
  if (selectedSchemaRecord?.schemas) {
    const schemas = selectedSchemaRecord.schemas
    if (Array.isArray(schemas)) {
      schemasArray = schemas.map(item => {
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
        schemasArray = [schemas]
      } else if ('schemas' in schemas) {
        schemasArray = Array.isArray(schemas.schemas) ? schemas.schemas : [schemas.schemas]
      } else {
        schemasArray = [schemas]
      }
    }
  }

  console.log('📋 Multi-schema data:', {
    schemaRecords,
    selectedSchemaIndex,
    selectedSchemaRecord,
    schemasArray
  })

  // Calculate schema score if not stored in database (for old schemas)
  const displayScore = useMemo(() => {
    if (selectedSchemaRecord?.schemaScore) {
      return selectedSchemaRecord.schemaScore
    }
    // Fallback: calculate score client-side for old schemas
    if (schemasArray && schemasArray.length > 0) {
      return calculateSchemaScore(schemasArray)
    }
    return null
  }, [selectedSchemaRecord?.schemaScore, schemasArray])

  // Auto-select URL from query parameter (e.g., from dashboard navigation or duplicate warning modal)
  useEffect(() => {
    const urlParam = searchParams.get('url')
    const urlIdParam = searchParams.get('urlId')

    if (!selectedUrlId && urls.length > 0) {
      // Check for urlId parameter first (direct ID reference)
      if (urlIdParam) {
        const matchingUrl = urls.find(u => u.id === urlIdParam)
        if (matchingUrl) {
          setSelectedUrlId(matchingUrl.id)
          setSearchParams({}) // Clear the URL parameter
          return
        }
      }

      // Fallback to url parameter (URL string match)
      if (urlParam) {
        const matchingUrl = urls.find(u => u.url === urlParam)
        if (matchingUrl) {
          setSelectedUrlId(matchingUrl.id)
          setSearchParams({}) // Clear the URL parameter
        }
      }
    }
  }, [searchParams, urls, selectedUrlId, setSearchParams])

  const handleHideUrl = async (urlId: string) => {
    try {
      await apiService.hideUrl(urlId)
      refetchUrls()
      refetchAllUrls()
    } catch (error) {
      console.error('Failed to hide URL:', error)
    }
  }

  const handleUnhideUrl = async (urlId: string) => {
    try {
      await apiService.unhideUrl(urlId)
      refetchUrls()
      refetchAllUrls()
    } catch (error) {
      console.error('Failed to unhide URL:', error)
    }
  }

  const handleDeleteDomain = async (domainId: string) => {
    if (!confirm('Are you sure you want to delete this domain and all its URLs?')) {
      return
    }

    try {
      await apiService.deleteDomain(domainId)
      refetchUrls()
      refetchAllUrls()
    } catch (error) {
      console.error('Failed to delete domain:', error)
    }
  }

  // Mutation for updating schema
  const updateSchemaMutation = useMutation({
    mutationFn: ({ urlId, schemas }: { urlId: string; schemas: any[] }) =>
      apiService.updateUrlSchema(urlId, schemas),
    onSuccess: (_, variables) => {
      // Update the cache optimistically to reflect the saved changes
      // This prevents the editor from reverting to old data
      queryClient.setQueryData(['urlSchema', variables.urlId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          data: {
            ...oldData.data,
            schemas: variables.schemas.length === 1 ? variables.schemas[0] : variables.schemas
          }
        }
      })
    },
    onError: () => {
      toast.error('Failed to update schema')
    }
  })

  const handleSchemaChange = useCallback(
    (schemas: any[]) => {
      if (!selectedUrlId) return
      updateSchemaMutation.mutate({ urlId: selectedUrlId, schemas })
    },
    [selectedUrlId, updateSchemaMutation]
  )

  const handleUrlClick = (urlId: string) => {
    console.log('🖱️ URL clicked:', urlId)
    setSelectedUrlId(urlId)
    setSelectedSchemaIndex(0) // Reset to first schema when switching URLs
  }

  // Reset selected schema index when schemas change
  useEffect(() => {
    if (schemaRecords.length > 0 && selectedSchemaIndex >= schemaRecords.length) {
      setSelectedSchemaIndex(0)
    }
  }, [schemaRecords.length, selectedSchemaIndex])

  // Update currentSchemaId when selected schema changes
  useEffect(() => {
    if (schemaRecords.length > 0 && schemaRecords[selectedSchemaIndex]) {
      setCurrentSchemaId(schemaRecords[selectedSchemaIndex].id)
    }
  }, [schemaRecords, selectedSchemaIndex])

  // Delete URL mutation
  const deleteUrlMutation = useMutation({
    mutationFn: (urlId: string) => apiService.deleteUrl(urlId),
    onSuccess: () => {
      refetchUrls()
      refetchAllUrls()
      toast.success('URL deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete URL')
    }
  })

  // Delete schema type mutation
  const deleteSchemaTypeMutation = useMutation({
    mutationFn: (schemaId: string) => apiService.deleteSchemaType(schemaId),
    onSuccess: async (response) => {
      // Reset to first schema tab
      setSelectedSchemaIndex(0)
      // Close modal and clear state
      setShowDeleteSchemaModal(false)
      setSchemaToDelete(null)
      // Refetch the schemas to update UI
      await queryClient.invalidateQueries({ queryKey: ['urlSchemas', selectedUrlId] })
      await queryClient.invalidateQueries({ queryKey: ['urls'] })
      await queryClient.refetchQueries({ queryKey: ['urlSchemas', selectedUrlId] })
      toast.success(response.message || 'Schema type deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete schema type')
      setShowDeleteSchemaModal(false)
      setSchemaToDelete(null)
    }
  })

  const handleDeleteUrl = async (urlId: string) => {
    if (!confirm('Are you sure you want to delete this URL?')) {
      return
    }
    deleteUrlMutation.mutate(urlId)
  }

  const handleDeleteSchemaType = async (schemaId: string, schemaType: string) => {
    setSchemaToDelete({ id: schemaId, type: schemaType })
    setShowDeleteSchemaModal(true)
  }

  const confirmDeleteSchemaType = async () => {
    if (!schemaToDelete) return
    deleteSchemaTypeMutation.mutate(schemaToDelete.id)
  }

  const handleGenerateSchema = (url: string) => {
    // Navigate to generate page with URL pre-populated and auto-generate enabled
    navigate(`/generate?url=${encodeURIComponent(url)}&auto=true`)
  }

  const toggleUrlSelection = (urlId: string) => {
    const newSelected = new Set(selectedUrls)
    if (newSelected.has(urlId)) {
      newSelected.delete(urlId)
    } else {
      newSelected.add(urlId)
    }
    setSelectedUrls(newSelected)
  }

  const confirmBatchDelete = async () => {
    try {
      // Delete all selected URLs
      await Promise.all(
        Array.from(selectedUrls).map(urlId => apiService.deleteUrl(urlId))
      )
      toast.success(`${selectedUrls.size} URL${selectedUrls.size !== 1 ? 's' : ''} deleted successfully`)
      setSelectedUrls(new Set())
      setSelectionMode(false)
      refetchUrls()
      refetchAllUrls()
    } catch (error) {
      toast.error('Failed to delete some URLs')
    }
  }

  const handleRefineSchema = async () => {
    if (!selectedUrlId || !schemasArray || schemasArray.length === 0 || !selectedSchemaRecord) {
      toast.error('No schema to refine')
      return
    }

    const currentUrl = urls.find(u => u.id === selectedUrlId)?.url
    if (!currentUrl) {
      toast.error('URL not found')
      return
    }

    setIsRefining(true)
    setShowChangesBanner(false)

    try {
      const result = await apiService.refineLibrarySchema(
        selectedSchemaRecord.id, // Use schema record ID instead of URL ID
        schemasArray,
        currentUrl
      )

      if (result.success && result.data) {
        // Update the schemas and refinement count in the UI
        queryClient.setQueryData(['urlSchemas', selectedUrlId], (old: any) => {
          if (!old?.data) return old
          const updatedRecords = [...old.data]
          updatedRecords[selectedSchemaIndex] = {
            ...updatedRecords[selectedSchemaIndex],
            schemas: result.data?.schemas || [],
            schemaScore: result.data?.schemaScore || null,
            refinementCount: result.data?.refinementCount || 0
          }
          return {
            ...old,
            data: updatedRecords
          }
        })

        // Show changes banner
        setHighlightedChanges(result.data?.highlightedChanges || [])
        setShowChangesBanner(true)

        const refinementsLeft = result.data?.remainingRefinements || 0
        toast.success(
          `Schema refined successfully! ${refinementsLeft} refinement${refinementsLeft !== 1 ? 's' : ''} remaining.`
        )
      } else {
        toast.error('Failed to refine schema')
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Failed to refine schema'
      toast.error(errorMessage)
    } finally {
      setIsRefining(false)
    }
  }

  const handleAddSchemaType = async (schemaType: string) => {
    if (!selectedUrlId) {
      toast.error('No URL selected')
      return
    }

    const currentUrl = urls.find(u => u.id === selectedUrlId)?.url
    if (!currentUrl) {
      toast.error('URL not found')
      return
    }

    setIsAddingSchemaType(true)
    setPendingSchemaType(schemaType)
    setShowAddSchemaType(false)

    const schemaTypeLabel = SCHEMA_TYPES.find(t => t.value === schemaType)?.label || schemaType

    try {
      const response = await apiService.generateSchema(currentUrl, {
        requestedSchemaTypes: [schemaType]
      })

      console.log('🔍 Add Schema Type - API Response:', {
        schemaType,
        hasUrlId: !!response.data?.urlId,
        schemasInResponse: response.data?.schemas?.length,
        responseSchemaTypes: response.data?.schemas?.map((s: any) => s['@type'])
      })

      if (response.success && response.data) {
        // Add small delay to ensure database write completes
        await new Promise(resolve => setTimeout(resolve, 150))

        // Refetch all schemas to show new tab
        await queryClient.refetchQueries({ queryKey: ['urlSchemas', selectedUrlId] })

        // Access the fresh data directly from the query
        const updatedSchemas = queryClient.getQueryData<any>(['urlSchemas', selectedUrlId])

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
            // Set the selected schema index to the new schema
            setSelectedSchemaIndex(newSchemaIndex)
            const newRecord = updatedSchemas.data[newSchemaIndex]

            // Update currentSchemaId for refinements
            setCurrentSchemaId(newRecord.id)

            console.log('🆔 Updated currentSchemaId with new schema ID:', {
              schemaId: newRecord.id,
              schemaType: newRecord.schemaType
            })

            // Validate that we loaded the correct schema type
            const schemasToValidate = Array.isArray(newRecord.schemas) ? newRecord.schemas : [newRecord.schemas]
            const loadedTypes = schemasToValidate.map((s: { '@type': string }) => s['@type'])
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

        // Invalidate library queries to update counts
        queryClient.invalidateQueries({ queryKey: ['domains'] })
        queryClient.invalidateQueries({ queryKey: ['urls'] })
        queryClient.invalidateQueries({ queryKey: ['urls-all'] })

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

  // Push to HubSpot mutation
  const pushToHubSpotMutation = useMutation({
    mutationFn: (data: {
      connectionId: string
      contentId: string
      contentType: 'blog_post' | 'page' | 'landing_page'
      schemaHtml: string
      contentTitle?: string
      contentUrl?: string
    }) => hubspotApi.pushSchema(data),
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

    // Get selected URL data
    const selectedUrl = urls.find(u => u.id === selectedUrlId)
    if (!selectedUrl) {
      toast.error('No URL selected')
      return
    }

    // Try to find connection by domain first (smart detection)
    const matchedConnection = findConnectionByDomain(hubspotConnections, selectedUrl.url)
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
    if (!selectedHubSpotConnection || schemaRecords.length === 0) {
      toast.error('Missing connection or schema data')
      return
    }

    // Generate HTML script tags from ALL schema types (not just selected one)
    const schemaHtml = schemaRecords
      .map(record => {
        // Extract schemas from each record
        let schemas = record.schemas
        if (!Array.isArray(schemas)) {
          schemas = [schemas]
        }

        // Generate script tags for each schema in this record
        return schemas
          .map(schema => `<script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n</script>`)
          .join('\n')
      })
      .join('\n')

    pushToHubSpotMutation.mutate({
      connectionId: selectedHubSpotConnection,
      contentId: match.contentId,
      contentType: match.contentType as 'blog_post' | 'page' | 'landing_page',
      schemaHtml,
      contentTitle: match.title,
      contentUrl: match.url
    })
  }

  // Calculate counts for tabs from unfiltered URLs
  const allUrlsCount = allUrls.length
  const urlsWithSchemaCount = allUrls.filter(url => url.hasSchema).length
  const urlsWithoutSchemaCount = allUrls.filter(url => !url.hasSchema).length

  // Separate URLs by domain vs. standalone
  const urlsWithDomain = urls.filter(url => url.domainId !== null)
  const urlsWithoutDomain = urls.filter(url => url.domainId === null)

  // Group domain URLs by domain
  const urlsByDomain = urlsWithDomain.reduce((acc, url) => {
    const domainId = url.domainId!
    if (!acc[domainId]) {
      acc[domainId] = []
    }
    acc[domainId].push(url)
    return acc
  }, {} as Record<string, DiscoveredUrl[]>)

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-input bg-background px-6 py-4">
        <div className="flex items-center gap-3 mb-2">
          <Library className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">URL Library</h1>
        </div>
        <p className="text-muted-foreground">
          Browse and manage your discovered URLs across all domains
        </p>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex overflow-hidden max-w-[2000px]">
          {/* Left column - URL list (50%) */}
          <div className="w-[50%] border-r border-input flex flex-col overflow-hidden">
          {/* Filters */}
          <div className="p-4 space-y-4 border-b border-input">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search URLs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Schema filter tabs */}
            <div className="flex gap-1 p-1 bg-muted rounded-lg">
              <button
                onClick={() => setSchemaFilter('all')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-all',
                  schemaFilter === 'all'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <Library className="h-4 w-4" />
                <span>All</span>
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  schemaFilter === 'all' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {allUrlsCount}
                </span>
              </button>
              <button
                onClick={() => setSchemaFilter('with')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-all',
                  schemaFilter === 'with'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <SuperSchemaBoltSolid className="h-4 w-4" />
                <span>Has Schema</span>
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  schemaFilter === 'with' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {urlsWithSchemaCount}
                </span>
              </button>
              <button
                onClick={() => setSchemaFilter('without')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm rounded-md transition-all',
                  schemaFilter === 'without'
                    ? 'bg-background shadow-sm font-medium'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <LightningBoltIcon className="h-4 w-4 text-gray-400" />
                <span>Needs Schema</span>
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  schemaFilter === 'without' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                )}>
                  {urlsWithoutSchemaCount}
                </span>
              </button>
            </div>

            {/* Other filter buttons */}
            <div className="flex flex-wrap gap-2">
              {/* Domain filter */}
              <select
                value={selectedDomainId || 'all'}
                onChange={(e) => setSelectedDomainId(e.target.value === 'all' ? undefined : e.target.value)}
                className="px-3 py-1.5 text-sm border border-input rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All Domains</option>
                {domains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.domain}
                  </option>
                ))}
              </select>

              {/* Show hidden toggle */}
              <button
                onClick={() => setShowHidden(!showHidden)}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border transition-colors flex items-center gap-1',
                  showHidden
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-muted'
                )}
              >
                {showHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                {showHidden ? 'Show All' : 'Hidden'}
              </button>

              {/* Selection mode toggle */}
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode)
                  setSelectedUrls(new Set())
                }}
                className={cn(
                  'px-3 py-1.5 text-sm rounded-md border transition-colors',
                  selectionMode
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-input hover:bg-muted'
                )}
              >
                {selectionMode ? 'Cancel' : 'Select'}
              </button>
            </div>
          </div>

          {/* Batch action bar */}
          {selectionMode && selectedUrls.size > 0 && (
            <div className="px-4 py-2 bg-primary/10 border-b border-primary flex items-center justify-between">
              <span className="text-sm font-medium">
                {selectedUrls.size} URL{selectedUrls.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1 text-sm bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" />
                Delete Selected
              </button>
            </div>
          )}

          {/* URL list */}
          <div className="flex-1 overflow-y-auto">
            {/* Loading state */}
            {(domainsLoading || urlsLoading) && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}

            {/* Empty state */}
            {!domainsLoading && !urlsLoading && urls.length === 0 && (
              <div className="text-center py-12 px-4">
                <Library className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No URLs in your library yet</h3>
                <p className="text-sm text-muted-foreground">
                  Generate schemas or use URL Discovery to start building your library
                </p>
              </div>
            )}

            {/* Domain-based URLs */}
            {!domainsLoading && !urlsLoading && domains.length > 0 && (
              <div>
                {domains
                  .filter((domain) => !selectedDomainId || domain.id === selectedDomainId)
                  .map((domain) => {
                    const domainUrls = urlsByDomain[domain.id] || []
                    // Get the count from allUrls to show total unfiltered count
                    const totalDomainUrls = allUrls.filter(url => url.domainId === domain.id).length

                    if (domainUrls.length === 0 && selectedDomainId) {
                      return null
                    }

                    return (
                      <div key={domain.id} className="border-b border-input">
                        {/* Domain header */}
                        <div className="bg-muted/30 px-4 py-2 flex items-center justify-between">
                          <div>
                            <h3 className="font-medium text-sm">{domain.domain}</h3>
                            <p className="text-xs text-muted-foreground">
                              {totalDomainUrls} URL{totalDomainUrls !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => handleDeleteDomain(domain.id)}
                            className="text-destructive hover:text-destructive/80 transition-colors"
                            title="Delete domain"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>

                        {/* URLs */}
                        {domainUrls.map((url) => (
                          <div
                            key={url.id}
                            onClick={() => !selectionMode && handleUrlClick(url.id)}
                            className={cn(
                              'px-4 py-2 transition-colors border-l-2 group',
                              !selectionMode && 'cursor-pointer',
                              selectedUrlId === url.id && !selectionMode
                                ? 'bg-primary/10 border-primary'
                                : 'border-transparent hover:bg-muted/50',
                              url.isHidden && 'opacity-50'
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Checkbox in selection mode */}
                                {selectionMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedUrls.has(url.id)}
                                    onChange={(e) => {
                                      e.stopPropagation()
                                      toggleUrlSelection(url.id)
                                    }}
                                    className="rounded border-input"
                                  />
                                )}

                                {/* Schema status icon */}
                                {url.hasSchema ? (
                                  <SuperSchemaBoltSolid className="h-3.5 w-3.5 flex-shrink-0" />
                                ) : (
                                  <LightningBoltIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                )}

                                <span className="text-sm truncate">{url.path}</span>
                              </div>

                              {/* Action buttons */}
                              <div className="flex items-center gap-1">
                                {/* Generate button for URLs without schema */}
                                {!url.hasSchema && !selectionMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleGenerateSchema(url.url)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground rounded p-1.5 flex items-center justify-center"
                                    title="Generate schema"
                                  >
                                    <LightningBoltIcon className="h-3 w-3" />
                                  </button>
                                )}

                                {/* Hide/Unhide button */}
                                {!selectionMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      url.isHidden ? handleUnhideUrl(url.id) : handleHideUrl(url.id)
                                    }}
                                    className="text-muted-foreground hover:text-foreground"
                                  >
                                    {url.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                  </button>
                                )}

                                {/* Delete button */}
                                {!selectionMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteUrl(url.id)
                                    }}
                                    className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                                    title="Delete URL"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })}
              </div>
            )}

            {/* Standalone URLs */}
            {!domainsLoading && !urlsLoading && urlsWithoutDomain.length > 0 && (
              <div className="border-b border-input">
                <div className="bg-muted/30 px-4 py-2">
                  <h3 className="font-medium text-sm">Individual URLs</h3>
                  <p className="text-xs text-muted-foreground">Direct schema generations</p>
                </div>
                {urlsWithoutDomain.map((url) => (
                  <div
                    key={url.id}
                    onClick={() => !selectionMode && handleUrlClick(url.id)}
                    className={cn(
                      'px-4 py-2 transition-colors border-l-2 group',
                      !selectionMode && 'cursor-pointer',
                      selectedUrlId === url.id && !selectionMode
                        ? 'bg-primary/10 border-primary'
                        : 'border-transparent hover:bg-muted/50',
                      url.isHidden && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {selectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedUrls.has(url.id)}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleUrlSelection(url.id)
                            }}
                            className="rounded border-input"
                          />
                        )}
                        {url.hasSchema ? (
                          <SuperSchemaBoltSolid className="h-3.5 w-3.5 flex-shrink-0" />
                        ) : (
                          <LightningBoltIcon className="h-3 w-3 text-gray-400 flex-shrink-0" />
                        )}
                        <span className="text-sm truncate">{url.url}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!url.hasSchema && !selectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateSchema(url.url)
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-primary hover:bg-primary/90 text-primary-foreground rounded p-1.5 flex items-center justify-center"
                            title="Generate schema"
                          >
                            <LightningBoltIcon className="h-3 w-3" />
                          </button>
                        )}
                        {!selectionMode && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteUrl(url.id)
                              }}
                              className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive/80"
                              title="Delete URL"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                url.isHidden ? handleUnhideUrl(url.id) : handleHideUrl(url.id)
                              }}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {url.isHidden ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column - Schema viewer (60%) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/20">
          {!selectedUrlId ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Library className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Select a URL to view its schema</h3>
                <p className="text-sm text-muted-foreground">
                  Click on any URL from the list to view and edit its schema
                </p>
              </div>
            </div>
          ) : schemaLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : schemaError ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Error loading schema</h3>
                <p className="text-sm text-muted-foreground">
                  {schemaError instanceof Error ? schemaError.message : 'An error occurred'}
                </p>
              </div>
            </div>
          ) : schemasArray && schemasArray.length > 0 ? (
            <div className="flex-1 overflow-auto p-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Schema Editor</h2>
                  <a
                    href={urls.find(u => u.id === selectedUrlId)?.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground border border-border rounded-md hover:bg-muted transition-colors"
                    title="Open URL in new tab"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>View Page</span>
                  </a>
                </div>

                {/* Schema Type Tabs */}
                {schemaRecords.length >= 1 && (
                  <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-muted/30 rounded-lg">
                    {schemaRecords.map((record, index) => (
                      <div
                        key={record.id}
                        className={cn(
                          'flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors group',
                          selectedSchemaIndex === index
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'bg-background hover:bg-muted text-muted-foreground hover:text-foreground'
                        )}
                      >
                        <button
                          onClick={() => {
                            setSelectedSchemaIndex(index)
                            setCurrentSchemaId(record.id)
                          }}
                          className="flex-1"
                        >
                          {record.schemaType}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteSchemaType(record.id, record.schemaType)
                          }}
                          className={cn(
                            'opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10',
                            selectedSchemaIndex === index ? 'text-primary-foreground hover:text-destructive' : 'text-muted-foreground hover:text-destructive'
                          )}
                          title="Delete schema type"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}

                    {/* Loading Indicator Badge */}
                    {isAddingSchemaType && pendingSchemaType && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md bg-primary/5 border border-primary/20 text-primary">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        <span>Generating {pendingSchemaType}...</span>
                      </div>
                    )}

                    {/* Add Another Schema Type Button */}
                    {schemaRecords.length < 10 && (
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
                              .filter(st => st.value !== 'Auto' && !schemaRecords.some(r => r.schemaType === st.value))
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
                  schemas={schemasArray}
                  onSchemaChange={handleSchemaChange}
                  height="500px"
                />
              </div>

              {/* Push to HubSpot Button - Show for all users with HubSpot connections */}
              {hubspotConnections.length > 0 && (
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

              {/* Schema Quality Score */}
              {displayScore && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">Schema Quality</h2>
                    <button
                      onClick={handleRefineSchema}
                      disabled={isRefining || (selectedSchemaRecord?.refinementCount || 0) >= MAX_REFINEMENTS}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors',
                        isRefining || (selectedSchemaRecord?.refinementCount || 0) >= MAX_REFINEMENTS
                          ? 'bg-muted text-muted-foreground cursor-not-allowed'
                          : 'bg-primary text-primary-foreground hover:bg-primary/90'
                      )}
                    >
                      {isRefining ? (
                        <>
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Refining...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" />
                          Refine with AI ({MAX_REFINEMENTS - (selectedSchemaRecord?.refinementCount || 0)} left)
                        </>
                      )}
                    </button>
                  </div>

                  {/* Changes Banner */}
                  {showChangesBanner && highlightedChanges.length > 0 && (
                    <div className="mb-4 bg-info border border-info rounded-md p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-info-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="h-4 w-4" />
                            AI Refinement Changes
                          </h4>
                          <ul className="space-y-1">
                            {highlightedChanges.map((change, index) => (
                              <li key={index} className="text-sm text-info-foreground flex items-start gap-2">
                                <span className="text-info-foreground mt-0.5">•</span>
                                <span>{change}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <button
                          onClick={() => setShowChangesBanner(false)}
                          className="text-info-foreground hover:text-info-foreground/80 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  <SchemaScoreCompact score={displayScore} />
                </div>
              )}

              <div>
                <h2 className="text-xl font-bold mb-4">Google Rich Results Preview</h2>
                <RichResultsPreview schemas={schemasArray} />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">No schema found</h3>
                <p className="text-sm text-muted-foreground">
                  This URL doesn't have a schema yet. Generate one from the Generate page.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmBatchDelete}
        title="Delete URLs"
        message={`Are you sure you want to delete ${selectedUrls.size} URL${selectedUrls.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* Delete Schema Type Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteSchemaModal}
        onClose={() => {
          setShowDeleteSchemaModal(false)
          setSchemaToDelete(null)
        }}
        onConfirm={confirmDeleteSchemaType}
        title="Delete Schema Type"
        message={schemaToDelete ? `Are you sure you want to delete the "${schemaToDelete.type}" schema? You can regenerate it once after deletion.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      {/* HubSpot Content Matcher Modal */}
      {selectedHubSpotConnection && selectedUrlId && (
        <HubSpotContentMatcher
          isOpen={showHubSpotMatcher}
          onClose={() => setShowHubSpotMatcher(false)}
          onSelectContent={handleSelectHubSpotContent}
          connectionId={selectedHubSpotConnection}
          targetUrl={urls.find(u => u.id === selectedUrlId)?.url || ''}
        />
      )}

      {/* Unassociated Domain Warning Modal */}
      {selectedUrlId && (
        <UnassociatedDomainModal
          isOpen={showUnassociatedDomainModal}
          onClose={() => setShowUnassociatedDomainModal(false)}
          url={urls.find(u => u.id === selectedUrlId)?.url || ''}
          onGoToSettings={() => {
            setShowUnassociatedDomainModal(false)
            navigate('/hubspot')
          }}
        />
      )}
    </div>
  )
}
