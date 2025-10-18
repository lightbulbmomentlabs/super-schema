import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronRight, ExternalLink, Compass, Eye, X } from 'lucide-react'
import LightningBoltIcon from './icons/LightningBoltIcon'
import SuperSchemaIcon from './icons/SuperSchemaIcon'
import BatchProgressPanel from './BatchProgressPanel'
import BatchConfirmModal from './BatchConfirmModal'
import { cn } from '@/utils/cn'
import { apiService } from '@/services/api'
import { useAuth } from '@clerk/clerk-react'
import { toast } from 'react-hot-toast'

interface DiscoveredUrl {
  url: string
  path: string
  depth: number
  hasSchema?: boolean
}

interface UrlDiscoveryProps {
  onUrlSelect: (url: string) => void
  className?: string
}

interface GroupedUrls {
  [key: string]: DiscoveredUrl[]
}

export default function UrlDiscovery({ onUrlSelect, className }: UrlDiscoveryProps) {
  const { getToken } = useAuth()
  const navigate = useNavigate()

  // Load persisted state from localStorage
  const loadPersistedState = () => {
    try {
      const savedState = localStorage.getItem('urlDiscoveryState')
      if (savedState) {
        const parsed = JSON.parse(savedState)
        return {
          domain: parsed.domain || '',
          discoveredUrls: parsed.discoveredUrls || [],
          crawlId: parsed.crawlId || null,
          status: parsed.status || 'idle',
          hasMore: parsed.hasMore || false,
          expandedGroups: new Set(parsed.expandedGroups || [])
        }
      }
    } catch (error) {
      console.error('Failed to load persisted state:', error)
    }
    return null
  }

  const persistedState = loadPersistedState()

  const [domain, setDomain] = useState(persistedState?.domain || '')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>(persistedState?.discoveredUrls || [])
  const [crawlId, setCrawlId] = useState<string | null>(persistedState?.crawlId || null)
  const [status, setStatus] = useState<'idle' | 'discovering' | 'completed' | 'error'>(persistedState?.status || 'idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(persistedState?.expandedGroups || new Set())
  const [hasMore, setHasMore] = useState(persistedState?.hasMore || false)

  // Batch mode state
  const [batchMode, setBatchMode] = useState(false)
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set())
  const MAX_BATCH_URLS = 10

  // Batch processing state
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [batchResults, setBatchResults] = useState<any[]>([])
  const [showBatchProgress, setShowBatchProgress] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  // Status bar visibility state
  const [showStatusBar, setShowStatusBar] = useState(true)

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    try {
      const stateToSave = {
        domain,
        discoveredUrls,
        crawlId,
        status,
        hasMore,
        expandedGroups: Array.from(expandedGroups)
      }
      localStorage.setItem('urlDiscoveryState', JSON.stringify(stateToSave))
    } catch (error) {
      console.error('Failed to persist state:', error)
    }
  }, [domain, discoveredUrls, crawlId, status, hasMore, expandedGroups])

  // Auto-hide status bar 5 seconds after discovery completes
  useEffect(() => {
    if (status === 'completed') {
      const timer = setTimeout(() => {
        setShowStatusBar(false)
      }, 5000)
      return () => clearTimeout(timer)
    } else if (status === 'discovering') {
      setShowStatusBar(true) // Show again if new discovery starts
    }
  }, [status])

  // Poll for more URLs in background
  useEffect(() => {
    if (!crawlId || !hasMore) return

    const pollInterval = setInterval(async () => {
      try {
        const token = await getToken()
        const API_URL = import.meta.env.VITE_API_URL || window.location.origin
        const response = await fetch(`${API_URL}/api/crawler/results/${crawlId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (result.success && result.data) {
          setDiscoveredUrls(result.data.urls)
          setHasMore(result.data.hasMore)

          // Save incrementally discovered URLs to library
          if (result.data.urls.length > 0) {
            await saveUrlsToLibrary(domain, result.data.urls)
          }

          if (result.data.status === 'completed') {
            setStatus('completed')
            setHasMore(false)
          }
        }
      } catch (error) {
        console.error('Failed to poll crawl results:', error)
      }
    }, 3000) // Poll every 3 seconds

    return () => clearInterval(pollInterval)
  }, [crawlId, hasMore, domain, getToken])

  const handleDiscover = async () => {
    if (!domain.trim()) {
      setErrorMessage('Please enter a valid domain')
      return
    }

    setIsDiscovering(true)
    setStatus('discovering')
    setErrorMessage('')
    setDiscoveredUrls([])
    setCrawlId(null)
    setHasMore(false)

    try {
      const token = await getToken()
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin
      const response = await fetch(`${API_URL}/api/crawler/discover`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ domain })
      })

      const result = await response.json()

      if (result.success && result.data) {
        setDiscoveredUrls(result.data.urls)
        setCrawlId(result.data.crawlId)
        setHasMore(result.data.hasMore)
        setStatus(result.data.status === 'completed' ? 'completed' : 'discovering')

        // Save discovered URLs to the library
        await saveUrlsToLibrary(domain, result.data.urls)
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to discover URLs')
      }
    } catch (error) {
      setStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to discover URLs')
    } finally {
      setIsDiscovering(false)
    }
  }

  const saveUrlsToLibrary = async (domain: string, urls: DiscoveredUrl[]) => {
    try {
      await apiService.saveDiscoveredUrls({
        domain,
        urls
      })
      console.log(`Saved ${urls.length} URLs to library`)
    } catch (error) {
      console.error('Failed to save URLs to library:', error)
      // Don't show error to user - this is a background operation
    }
  }

  const groupUrlsByPath = (urls: DiscoveredUrl[]): GroupedUrls => {
    const grouped: GroupedUrls = {}

    urls.forEach(urlData => {
      const path = urlData.path
      let groupKey = 'Homepage'

      if (path === '/' || path === '') {
        groupKey = 'Homepage'
      } else {
        const segments = path.split('/').filter(Boolean)
        if (segments.length > 0) {
          groupKey = `/${segments[0]}/`
        }
      }

      if (!grouped[groupKey]) {
        grouped[groupKey] = []
      }
      grouped[groupKey].push(urlData)
    })

    return grouped
  }

  const filteredUrls = discoveredUrls.filter(urlData => {
    // Filter by search query
    const matchesSearch = urlData.url.toLowerCase().includes(searchQuery.toLowerCase())

    // In batch mode, only show URLs without schemas
    if (batchMode && urlData.hasSchema) {
      return false
    }

    return matchesSearch
  })

  // Debug: Check what depths we're getting
  console.log('📊 URL Depths:', filteredUrls.map(u => ({ path: u.path, depth: u.depth })))

  // Separate URLs into priority pages (depth 1) and subdirectory content (depth 2+)
  const priorityPages: DiscoveredUrl[] = []
  const subdirectoryUrls: DiscoveredUrl[] = []
  const homepageUrls: DiscoveredUrl[] = []

  filteredUrls.forEach(urlData => {
    const pathSegments = urlData.path.split('/').filter(Boolean)

    if (urlData.path === '/' || urlData.path === '') {
      // Homepage
      homepageUrls.push(urlData)
    } else if (pathSegments.length === 1) {
      // Top-level pages like /support, /about, /clean6
      priorityPages.push(urlData)
    } else {
      // Deeper pages like /blog/article, /support/help
      subdirectoryUrls.push(urlData)
    }
  })

  // Sort priority pages alphabetically
  priorityPages.sort((a, b) => a.path.localeCompare(b.path))

  // Group subdirectory URLs by their first path segment
  const subdirectoryGroups: GroupedUrls = {}
  subdirectoryUrls.forEach(urlData => {
    const segments = urlData.path.split('/').filter(Boolean)
    const groupKey = segments.length > 0 ? `/${segments[0]}/` : '/other/'

    if (!subdirectoryGroups[groupKey]) {
      subdirectoryGroups[groupKey] = []
    }
    subdirectoryGroups[groupKey].push(urlData)
  })

  // Sort URLs within each subdirectory group
  Object.keys(subdirectoryGroups).forEach(key => {
    subdirectoryGroups[key].sort((a, b) => {
      if (a.depth !== b.depth) return a.depth - b.depth
      return a.path.localeCompare(b.path)
    })
  })

  // Add homepage to subdirectory groups if exists
  if (homepageUrls.length > 0) {
    subdirectoryGroups['Homepage'] = homepageUrls
  }

  // Sort group keys: Homepage first, then alphabetically
  const sortedGroups = Object.keys(subdirectoryGroups).sort((a, b) => {
    if (a === 'Homepage') return -1
    if (b === 'Homepage') return 1
    return a.localeCompare(b)
  })

  // Debug logging
  console.log('🔍 URL Discovery Debug:', {
    totalUrls: discoveredUrls.length,
    priorityPages: priorityPages.length,
    priorityPaths: priorityPages.map(u => u.path),
    subdirectoryGroups: Object.keys(subdirectoryGroups),
    subdirectoryCount: subdirectoryUrls.length,
    homepageCount: homepageUrls.length
  })

  const toggleGroup = (groupKey: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupKey)) {
      newExpanded.delete(groupKey)
    } else {
      newExpanded.add(groupKey)
    }
    setExpandedGroups(newExpanded)
  }

  const handleUrlClick = (url: string) => {
    onUrlSelect(url)
  }

  // Batch mode handlers
  const toggleBatchMode = () => {
    const newBatchMode = !batchMode
    setBatchMode(newBatchMode)

    // Always clear selections when toggling batch mode
    // This ensures URLs with schemas aren't selected when entering batch mode
    setSelectedUrls(new Set())
  }

  const toggleUrlSelection = (url: string, hasSchema?: boolean) => {
    if (hasSchema) {
      toast.error('This URL already has schema generated')
      return
    }

    const newSelected = new Set(selectedUrls)
    if (newSelected.has(url)) {
      newSelected.delete(url)
    } else {
      if (newSelected.size >= MAX_BATCH_URLS) {
        toast.error(`Maximum ${MAX_BATCH_URLS} URLs allowed per batch`)
        return
      }
      newSelected.add(url)
    }
    setSelectedUrls(newSelected)
  }

  const clearSelection = () => {
    setSelectedUrls(new Set())
  }

  const getSelectableUrls = () => {
    return filteredUrls.filter(url => !url.hasSchema)
  }

  const handleStartBatch = () => {
    if (selectedUrls.size === 0) return
    setShowConfirmModal(true)
  }

  const handleConfirmBatch = async () => {
    setShowConfirmModal(false)

    const urlsArray = Array.from(selectedUrls)

    setIsBatchProcessing(true)
    setShowBatchProgress(true)

    // Initialize results with 'queued' status
    const initialResults = urlsArray.map(url => ({
      url,
      status: 'queued' as const,
      schemas: null,
      error: null
    }))
    setBatchResults(initialResults)

    try {
      const token = await getToken()
      const API_URL = import.meta.env.VITE_API_URL || window.location.origin

      // Use fetch to stream SSE events
      const response = await fetch(`${API_URL}/api/schema/batch-generate-stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          urls: urlsArray,
          options: { schemaType: 'Auto' }
        })
      })

      if (!response.ok) {
        throw new Error('Failed to start batch generation')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error('No response body')
      }

      let buffer = ''
      let successCount = 0
      let failCount = 0

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('event:')) {
            const eventType = line.substring(7).trim()
            continue
          }

          if (line.startsWith('data:')) {
            const data = JSON.parse(line.substring(5).trim())

            if (data.index !== undefined) {
              // Progress update - update specific URL result
              setBatchResults(prev => {
                const newResults = [...prev]
                newResults[data.index] = {
                  url: data.url,
                  status: data.status,
                  schemas: data.schemas,
                  error: data.error,
                  urlId: data.urlId
                }
                return newResults
              })

              if (data.status === 'success') successCount++
              if (data.status === 'failed') failCount++
            } else if (data.summary) {
              // Complete event
              successCount = data.summary.successful
              failCount = data.summary.failed

              toast.success(
                `Batch complete! ${successCount} succeeded${failCount > 0 ? `, ${failCount} failed` : ''}`
              )
            }
          }
        }
      }

      // Refresh discovered URLs to update hasSchema flags
      if (crawlId) {
        const token = await getToken()
        const API_URL = import.meta.env.VITE_API_URL || window.location.origin
        const refreshResponse = await fetch(`${API_URL}/api/crawler/results/${crawlId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        const refreshResult = await refreshResponse.json()
        if (refreshResult.success && refreshResult.data) {
          setDiscoveredUrls(refreshResult.data.urls)
        }
      }

      // Clear selections and exit batch mode
      setSelectedUrls(new Set())
      setBatchMode(false)
    } catch (error) {
      console.error('Batch generation error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to generate schemas')
    } finally {
      setIsBatchProcessing(false)
    }
  }

  const handleCancelBatch = () => {
    setShowConfirmModal(false)
  }

  const handleCloseBatchProgress = () => {
    setShowBatchProgress(false)
    setBatchResults([])
  }

  const handleClearDiscovery = () => {
    setDomain('')
    setDiscoveredUrls([])
    setCrawlId(null)
    setStatus('idle')
    setHasMore(false)
    setExpandedGroups(new Set())
    setSelectedUrls(new Set())
    setBatchMode(false)
    setSearchQuery('')
    localStorage.removeItem('urlDiscoveryState')
  }

  return (
    <div className={cn('bg-card border border-border rounded-lg p-6', className)}>
      <div className="space-y-4">
        {/* Header */}
        <div>
          <h3 className="text-lg font-semibold flex items-center space-x-2">
            <Search className="h-5 w-5 text-primary" />
            <span>Discover Your Site's Hidden Gems</span>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Drop your domain and we'll find every page worth schema-fying ✨
          </p>
        </div>

        {/* Input and Button */}
        <div className="flex space-x-2">
          <input
            type="url"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="https://www.example.com"
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={isDiscovering}
            onKeyPress={(e) => e.key === 'Enter' && handleDiscover()}
          />
          <button
            onClick={handleDiscover}
            disabled={isDiscovering || !domain.trim()}
            className="flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                Discovering...
              </>
            ) : (
              <>
                <Compass className="h-4 w-4 mr-2" />
                Discover URLs
              </>
            )}
          </button>
          {discoveredUrls.length > 0 && !isDiscovering && (
            <button
              onClick={handleClearDiscovery}
              className="flex items-center px-3 py-2 rounded-md border border-border hover:bg-accent transition-colors"
              title="Clear and start fresh"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Error Message */}
        {status === 'error' && errorMessage && (
          <div className="flex items-start space-x-2 p-3 bg-destructive border border-destructive rounded-md">
            <AlertCircle className="h-5 w-5 text-destructive-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive-foreground font-medium">Error</p>
              <p className="text-xs text-destructive-foreground mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Status Message */}
        {(status === 'discovering' || status === 'completed') && discoveredUrls.length > 0 && showStatusBar && (
          <div
            className={cn(
              "flex items-center justify-between p-3 bg-info border border-info rounded-md transition-opacity duration-500",
              !showStatusBar && "opacity-0"
            )}
          >
            <div className="flex items-center space-x-2">
              {status === 'discovering' ? (
                <Loader2 className="h-4 w-4 text-info-foreground animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4 text-success-foreground" />
              )}
              <span className="text-sm text-info-foreground">
                {status === 'discovering'
                  ? `Discovered ${discoveredUrls.length} URLs (loading more...)`
                  : `Discovered ${discoveredUrls.length} URLs`}
              </span>
            </div>
          </div>
        )}

        {/* Batch Progress Panel */}
        {showBatchProgress && batchResults.length > 0 && (
          <BatchProgressPanel
            results={batchResults}
            isProcessing={isBatchProcessing}
            onClose={handleCloseBatchProgress}
          />
        )}

        {/* Discovered URLs - Priority Pages and Grouped */}
        {discoveredUrls.length > 0 && (
          <div className="border border-border rounded-md overflow-hidden">
            {/* Fallback: Show all URLs if no categorization worked */}
            {priorityPages.length === 0 && sortedGroups.length === 0 && (
              <div className="p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-muted-foreground mb-3">All Discovered URLs:</p>
                {filteredUrls.map((urlData, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 hover:bg-accent/50 transition-colors group border-b border-border/50 last:border-b-0"
                  >
                    <span className="text-sm text-gray-700 truncate flex-1 mr-2">
                      {urlData.url}
                    </span>
                    <button
                      onClick={() => handleUrlClick(urlData.url)}
                      className="flex items-center px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      title="Generate schema for this URL"
                    >
                      <LightningBoltIcon className="h-3 w-3 mr-1" />
                      <span className="text-xs">Generate</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Priority Pages (depth 1 - always visible) */}
            {priorityPages.length > 0 && (
              <div className="flex flex-col">
                {/* Fixed Header */}
                <div className="p-3 bg-accent/30 border-b border-border sticky top-0 z-10">
                  <div className="flex items-center justify-between w-full gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-sm">⭐ Priority Pages</span>
                        <span className="text-xs text-muted-foreground">({priorityPages.length})</span>
                      </div>

                      {/* Search Box */}
                      {discoveredUrls.length > 10 && (
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Filter URLs..."
                          className="px-3 py-1.5 text-sm border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      )}
                    </div>

                    {/* Batch button aligned right */}
                    {status === 'completed' && discoveredUrls.length > 0 && getSelectableUrls().length > 0 && (
                      <div className="flex items-center gap-3">
                        {!batchMode ? (
                          <button
                            onClick={toggleBatchMode}
                            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm"
                          >
                            <SuperSchemaIcon className="h-3 w-3" />
                            Batch Generate
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={handleStartBatch}
                              disabled={selectedUrls.size === 0 || isBatchProcessing}
                              className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isBatchProcessing ? (
                                <>
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                  Processing...
                                </>
                              ) : (
                                <>
                                  <SuperSchemaIcon className="h-3 w-3" />
                                  Start Batch ({selectedUrls.size} of {MAX_BATCH_URLS})
                                </>
                              )}
                            </button>
                            <button
                              onClick={clearSelection}
                              disabled={selectedUrls.size === 0}
                              className="flex items-center gap-2 px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Clear Selection
                            </button>
                            <button
                              onClick={toggleBatchMode}
                              className="flex items-center gap-1 px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors text-sm"
                            >
                              <X className="h-3 w-3" />
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* URL count text when in batch mode */}
                  {batchMode && (
                    <div className="text-sm text-muted-foreground mt-2">
                      <span className="font-medium">{selectedUrls.size}</span> of <span className="font-medium">{MAX_BATCH_URLS}</span> URLs selected
                    </div>
                  )}
                </div>

                {/* Scrollable URL List */}
                <div className="max-h-80 overflow-y-auto">
                  <div className="bg-muted/20">
                  {priorityPages.map((urlData, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 px-4 hover:bg-accent/50 transition-colors group border-b border-border/50 last:border-b-0",
                        batchMode && selectedUrls.has(urlData.url) && "bg-primary/10"
                      )}
                    >
                      {/* Batch mode checkbox */}
                      {batchMode && (
                        <div className="flex items-center mr-3">
                          <input
                            type="checkbox"
                            checked={selectedUrls.has(urlData.url)}
                            disabled={urlData.hasSchema}
                            onChange={() => toggleUrlSelection(urlData.url, urlData.hasSchema)}
                            className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                        </div>
                      )}

                      <div className="flex items-center space-x-2 flex-1 mr-2">
                        <span className="text-sm font-medium text-foreground truncate">
                          {urlData.path}
                        </span>
                        <button
                          onClick={() => window.open(urlData.url, '_blank')}
                          className="flex items-center p-1 rounded hover:bg-accent transition-colors opacity-60 hover:opacity-100"
                          title="Open page in new tab"
                        >
                          <ExternalLink className="h-3 w-3 text-gray-600" />
                        </button>
                      </div>
                      {urlData.hasSchema ? (
                        <button
                          onClick={() => navigate(`/library?url=${encodeURIComponent(urlData.url)}`)}
                          className="flex items-center px-3 py-1.5 rounded border border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors"
                          title="View existing schema"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">View Schema</span>
                        </button>
                      ) : batchMode ? (
                        <span className="text-xs text-muted-foreground px-3">Click checkbox to select</span>
                      ) : (
                        <button
                          onClick={() => handleUrlClick(urlData.url)}
                          className="flex items-center px-3 py-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                          title="Generate schema for this URL"
                        >
                          <LightningBoltIcon className="h-3 w-3 mr-1" />
                          <span className="text-xs font-medium">Generate</span>
                        </button>
                      )}
                    </div>
                  ))}
                  </div>

                  {/* Subdirectory Groups (collapsible) - inside scrollable container */}
                  {sortedGroups.map((groupKey) => {
              const urls = subdirectoryGroups[groupKey]
              const isExpanded = expandedGroups.has(groupKey)

              return (
                <div key={groupKey} className="border-b border-border last:border-b-0">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(groupKey)}
                    className="w-full flex items-center justify-between p-3 hover:bg-accent transition-colors text-left"
                  >
                    <div className="flex items-center space-x-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium text-sm">📁 {groupKey}</span>
                      <span className="text-xs text-muted-foreground">({urls.length})</span>
                    </div>
                  </button>

                  {/* Group URLs */}
                  {isExpanded && (
                    <div className="bg-muted/20">
                      {urls.map((urlData, index) => (
                        <div
                          key={index}
                          className={cn(
                            "flex items-center justify-between p-2 px-4 hover:bg-accent/50 transition-colors group",
                            batchMode && selectedUrls.has(urlData.url) && "bg-primary/10"
                          )}
                        >
                          {/* Batch mode checkbox */}
                          {batchMode && (
                            <div className="flex items-center mr-3">
                              <input
                                type="checkbox"
                                checked={selectedUrls.has(urlData.url)}
                                disabled={urlData.hasSchema}
                                onChange={() => toggleUrlSelection(urlData.url, urlData.hasSchema)}
                                className="w-4 h-4 text-primary bg-background border-border rounded focus:ring-primary focus:ring-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                              />
                            </div>
                          )}

                          <div className="flex items-center space-x-2 flex-1 mr-2">
                            <span className="text-sm text-gray-700 truncate">
                              {urlData.url}
                            </span>
                            <button
                              onClick={() => window.open(urlData.url, '_blank')}
                              className="flex items-center p-1 rounded hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                              title="Open page in new tab"
                            >
                              <ExternalLink className="h-3 w-3 text-gray-600" />
                            </button>
                          </div>
                          {urlData.hasSchema ? (
                            <button
                              onClick={() => navigate(`/library?url=${encodeURIComponent(urlData.url)}`)}
                              className="flex items-center px-2 py-1 rounded border border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100"
                              title="View existing schema"
                            >
                              <Eye className="h-3 w-3" />
                            </button>
                          ) : batchMode ? (
                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100">Select to batch generate</span>
                          ) : (
                            <button
                              onClick={() => handleUrlClick(urlData.url)}
                              className="flex items-center px-2 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 transition-colors opacity-0 group-hover:opacity-100"
                              title="Generate schema for this URL"
                            >
                              <LightningBoltIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Batch Confirmation Modal */}
      <BatchConfirmModal
        isOpen={showConfirmModal}
        urlCount={selectedUrls.size}
        creditCost={selectedUrls.size}
        onConfirm={handleConfirmBatch}
        onCancel={handleCancelBatch}
      />
    </div>
  )
}
