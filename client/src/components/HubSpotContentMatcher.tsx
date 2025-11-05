import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { hubspotApi } from '@/services/hubspot'
import { X, Loader2, CheckCircle, ExternalLink, Search, Globe } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { HubSpotContentMatchResult } from 'aeo-schema-generator-shared/types'

interface HubSpotContentMatcherProps {
  isOpen: boolean
  onClose: () => void
  onSelectContent: (match: HubSpotContentMatchResult) => void
  connectionId: string
  targetUrl: string
}

export default function HubSpotContentMatcher({
  isOpen,
  onClose,
  onSelectContent,
  connectionId,
  targetUrl
}: HubSpotContentMatcherProps) {
  const [selectedMatch, setSelectedMatch] = useState<HubSpotContentMatchResult | null>(null)
  const navigate = useNavigate()

  // Fetch connection details to check for associated domains
  const { data: connectionsResponse } = useQuery({
    queryKey: ['hubspot-connections'],
    queryFn: () => hubspotApi.getConnections(),
    enabled: isOpen
  })

  // Find the specific connection
  const connection = connectionsResponse?.data?.find(conn => conn.id === connectionId)
  const hasAssociatedDomains = connection?.associatedDomains && connection.associatedDomains.length > 0

  // Auto-match URL to content
  const { data: matchResponse, isLoading: isMatching } = useQuery({
    queryKey: ['hubspot-content-match', connectionId, targetUrl],
    queryFn: () => hubspotApi.matchContent(connectionId, targetUrl),
    enabled: isOpen && !!connectionId && !!targetUrl
  })

  // Also fetch all content for manual selection
  const { data: postsResponse, isLoading: isLoadingPosts } = useQuery({
    queryKey: ['hubspot-blog-posts', connectionId],
    queryFn: () => hubspotApi.listBlogPosts(connectionId),
    enabled: isOpen && !!connectionId
  })

  const { data: pagesResponse, isLoading: isLoadingPages } = useQuery({
    queryKey: ['hubspot-pages', connectionId],
    queryFn: () => hubspotApi.listPages(connectionId),
    enabled: isOpen && !!connectionId
  })

  const matches = matchResponse?.data || []
  const allPosts = postsResponse?.data || []
  const allPages = pagesResponse?.data || []
  const isLoadingContent = isLoadingPosts || isLoadingPages

  useEffect(() => {
    // Auto-select best match if confidence is high
    if (matches.length > 0 && matches[0].confidence > 0.8) {
      setSelectedMatch(matches[0])
    }
  }, [matches])

  const handleConfirm = () => {
    if (selectedMatch) {
      onSelectContent(selectedMatch)
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-card border border-border rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-semibold">Select HubSpot Content</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Choose which HubSpot content to push schema to
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Target URL */}
          <div className="mb-6 p-4 bg-accent/50 rounded-lg">
            <p className="text-sm font-medium mb-1">Schema URL:</p>
            <p className="text-sm text-muted-foreground break-all">{targetUrl}</p>
          </div>

          {/* Loading State */}
          {isMatching && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  Searching for matching content...
                </p>
              </div>
            </div>
          )}

          {/* No Matches - Show manual browse */}
          {!isMatching && matches.length === 0 && (
            <div>
              <div className="text-center py-8 mb-6">
                <Search className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-lg font-medium mb-2">No automatic matches found</p>
                <p className="text-sm text-muted-foreground">
                  Browse and select from all your HubSpot content below
                </p>
              </div>

              {/* Manual content browser */}
              {isLoadingContent ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading content...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Blog Posts */}
                  {allPosts.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Blog Posts ({allPosts.length})</h3>
                      <div className="space-y-2">
                        {allPosts.slice(0, 10).map((post) => (
                          <button
                            key={post.id}
                            onClick={() => setSelectedMatch({
                              contentId: post.id,
                              contentType: 'blog_post',
                              title: post.name,
                              url: post.url,
                              confidence: 0
                            })}
                            className={cn(
                              'w-full text-left border rounded-lg p-3 transition-all',
                              selectedMatch?.contentId === post.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-sm">{post.name}</h4>
                                  {selectedMatch?.contentId === post.id && (
                                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{post.url}</p>
                              </div>
                              <a
                                href={post.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pages */}
                  {allPages.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium mb-2">Pages ({allPages.length})</h3>
                      <div className="space-y-2">
                        {allPages.slice(0, 10).map((page) => (
                          <button
                            key={page.id}
                            onClick={() => setSelectedMatch({
                              contentId: page.id,
                              contentType: 'page',
                              title: page.name,
                              url: page.url,
                              confidence: 0
                            })}
                            className={cn(
                              'w-full text-left border rounded-lg p-3 transition-all',
                              selectedMatch?.contentId === page.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-primary/50 hover:bg-accent/50'
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 mr-4">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="font-medium text-sm">{page.name}</h4>
                                  {selectedMatch?.contentId === page.id && (
                                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{page.url}</p>
                              </div>
                              <a
                                href={page.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="text-muted-foreground hover:text-primary transition-colors"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {allPosts.length === 0 && allPages.length === 0 && (
                    <div className="text-center py-12 px-6">
                      {!hasAssociatedDomains ? (
                        // No domains linked - primary scenario
                        <>
                          <Globe className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                          <h3 className="text-lg font-semibold mb-2">Time to Link Your Domain!</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Looks like your HubSpot portal is ready to go, but we need to connect it to your website domain first.
                            Once linked, we'll discover all your pages and posts automatically—like magic, but real.
                          </p>
                          <button
                            onClick={() => {
                              onClose()
                              navigate('/hubspot')
                            }}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium inline-flex items-center gap-2"
                          >
                            <Globe className="h-4 w-4" />
                            Link Your Domain
                          </button>
                        </>
                      ) : (
                        // Domains linked but no content found
                        <>
                          <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                          <h3 className="text-lg font-semibold mb-2">No Content Found (Yet!)</h3>
                          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                            Your domain is linked, but we couldn't find any blog posts or pages in your HubSpot portal.
                            Create some content in HubSpot first, then come back to supercharge it with schema!
                          </p>
                          <button
                            onClick={() => {
                              onClose()
                              navigate('/hubspot')
                            }}
                            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                          >
                            Check Connection Settings
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Matches List */}
          {!isMatching && matches.length > 0 && (
            <div className="space-y-3">
              <p className="text-sm font-medium mb-3">
                Found {matches.length} matching content item{matches.length !== 1 ? 's' : ''}:
              </p>

              {matches.map((match) => (
                <button
                  key={match.contentId}
                  onClick={() => setSelectedMatch(match)}
                  className={cn(
                    'w-full text-left border rounded-lg p-4 transition-all',
                    selectedMatch?.contentId === match.contentId
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-accent/50'
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 mr-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{match.title}</h3>
                        {selectedMatch?.contentId === match.contentId && (
                          <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-2 break-all">
                        {match.url}
                      </p>

                      <div className="flex items-center space-x-3 text-xs">
                        <span className={cn(
                          'px-2 py-1 rounded-full',
                          match.contentType === 'blog_post'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-purple-100 text-purple-700'
                        )}>
                          {match.contentType === 'blog_post' ? 'Blog Post' : 'Page'}
                        </span>

                        <span className={cn(
                          'px-2 py-1 rounded-full',
                          match.confidence >= 0.9
                            ? 'bg-success text-success-foreground'
                            : match.confidence >= 0.7
                            ? 'bg-warning text-warning-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}>
                          {Math.round(match.confidence * 100)}% match
                        </span>
                      </div>
                    </div>

                    <a
                      href={match.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-md hover:bg-accent transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={!selectedMatch}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Confirm & Push Schema
          </button>
        </div>
      </div>
    </div>
  )
}
