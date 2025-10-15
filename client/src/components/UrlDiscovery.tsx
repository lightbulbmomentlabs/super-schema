import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Loader2, AlertCircle, CheckCircle, ChevronDown, ChevronRight, ExternalLink, Compass, Eye } from 'lucide-react'
import LightningBoltIcon from './icons/LightningBoltIcon'
import { cn } from '@/utils/cn'
import { apiService } from '@/services/api'
import { useAuth } from '@clerk/clerk-react'

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
  const [domain, setDomain] = useState('')
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [discoveredUrls, setDiscoveredUrls] = useState<DiscoveredUrl[]>([])
  const [crawlId, setCrawlId] = useState<string | null>(null)
  const [status, setStatus] = useState<'idle' | 'discovering' | 'completed' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [hasMore, setHasMore] = useState(false)

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

  const filteredUrls = discoveredUrls.filter(urlData =>
    urlData.url.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
        {(status === 'discovering' || status === 'completed') && discoveredUrls.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-info border border-info rounded-md">
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

            {/* Search Box */}
            {discoveredUrls.length > 10 && (
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter URLs..."
                className="px-3 py-1 text-sm border border-info rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-info"
              />
            )}
          </div>
        )}

        {/* Discovered URLs - Priority Pages and Grouped */}
        {discoveredUrls.length > 0 && (
          <div className="border border-border rounded-md max-h-96 overflow-y-auto">
            {/* Fallback: Show all URLs if no categorization worked */}
            {priorityPages.length === 0 && sortedGroups.length === 0 && (
              <div className="p-4">
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
              <div className="border-b border-border">
                <div className="p-3 bg-accent/30">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-sm">⭐ Priority Pages</span>
                    <span className="text-xs text-muted-foreground">({priorityPages.length})</span>
                  </div>
                </div>
                <div className="bg-muted/20">
                  {priorityPages.map((urlData, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 px-4 hover:bg-accent/50 transition-colors group border-b border-border/50 last:border-b-0"
                    >
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
              </div>
            )}

            {/* Subdirectory Groups (collapsible) */}
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
                          className="flex items-center justify-between p-2 px-4 hover:bg-accent/50 transition-colors group"
                        >
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
        )}

      </div>
    </div>
  )
}
