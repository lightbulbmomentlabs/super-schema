import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, TrendingDown, Users, ChevronDown, ChevronUp, Clock, Code, Trash2 } from 'lucide-react'
import { apiService } from '@/services/api'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'
import { toast } from 'react-hot-toast'

export default function AdminSchemaFailures() {
  const [expandedFailure, setExpandedFailure] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const limit = 10
  const queryClient = useQueryClient()

  // Fetch failure statistics
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-schema-failure-stats'],
    queryFn: () => apiService.getSchemaFailureStats(),
    refetchInterval: 60000 // Refresh every 60 seconds
  })

  // Fetch recent failures with pagination
  const { data: failuresData, isLoading: failuresLoading } = useQuery({
    queryKey: ['admin-schema-failures', page],
    queryFn: () => apiService.getSchemaFailures({ page, limit }),
    refetchInterval: 60000
  })

  // Delete mutation
  const deleteFailure = useMutation({
    mutationFn: (id: string) => apiService.deleteSchemaFailure(id),
    onSuccess: () => {
      toast.success('Failure record deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin-schema-failures'] })
      queryClient.invalidateQueries({ queryKey: ['admin-schema-failure-stats'] })
      setDeleteConfirmId(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to delete failure record')
      setDeleteConfirmId(null)
    }
  })

  const stats = statsData?.data
  const failures = failuresData?.data?.failures || []
  const pagination = failuresData?.data?.pagination

  if (statsLoading || failuresLoading) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        Loading schema failure analytics...
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-4 text-center text-destructive">
        Failed to load schema failure data
      </div>
    )
  }

  const toggleExpanded = (id: string) => {
    setExpandedFailure(expandedFailure === id ? null : id)
  }

  // Helper function to format failure reason for display
  const formatReason = (reason: string) => {
    return reason
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  // Helper function to get color for failure reason
  const getReasonColor = (reason: string) => {
    switch (reason) {
      case 'timeout': return 'text-orange-600 dark:text-orange-400'
      case 'scraper_error': return 'text-red-600 dark:text-red-400'
      case 'ai_error': return 'text-purple-600 dark:text-purple-400'
      case 'validation_error': return 'text-yellow-600 dark:text-yellow-400'
      case 'insufficient_content': return 'text-blue-600 dark:text-blue-400'
      case 'network_error': return 'text-pink-600 dark:text-pink-400'
      case 'rate_limit': return 'text-indigo-600 dark:text-indigo-400'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Failures</p>
              <p className="text-2xl font-bold">{stats.totalFailures}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-destructive/50" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Failure Rate</p>
              <p className={`text-2xl font-bold ${stats.failureRate > 20 ? 'text-destructive' : 'text-green-600 dark:text-green-400'}`}>
                {stats.failureRate}%
              </p>
            </div>
            <TrendingDown className={`w-8 h-8 ${stats.failureRate > 20 ? 'text-destructive/50' : 'text-green-400'}`} />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Last 24h</p>
              <p className="text-2xl font-bold">{stats.recentFailures24h}</p>
            </div>
            <Clock className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Affected Users</p>
              <p className="text-2xl font-bold">{stats.affectedUsers}</p>
            </div>
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Failure Breakdown Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Failures by Reason */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Failures by Reason
          </h3>
          <div className="space-y-3">
            {stats.failuresByReason.slice(0, 5).map((item) => (
              <div key={item.reason}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-medium ${getReasonColor(item.reason)}`}>
                    {formatReason(item.reason)}
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold">{item.count}</span>
                    <span className="text-muted-foreground ml-1">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-destructive"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          {stats.failuresByReason.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No failures recorded yet
            </p>
          )}
        </div>

        {/* Failures by Stage */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Code className="w-5 h-5 text-primary" />
            Failures by Pipeline Stage
          </h3>
          <div className="space-y-3">
            {stats.failuresByStage.map((item) => (
              <div key={item.stage}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {formatReason(item.stage)}
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold">{item.count}</span>
                    <span className="text-muted-foreground ml-1">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-blue-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Failures List */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Failures</h3>

        {failures.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No failures recorded yet
          </p>
        ) : (
          <>
            <div className="space-y-2">
              {failures.map((failure) => (
                <div key={failure.id} className="border border-border rounded-md bg-muted/10">
                  {/* Failure Header - Always Visible */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => toggleExpanded(failure.id)}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`text-xs font-semibold px-2 py-1 rounded ${getReasonColor(failure.failureReason)} bg-muted`}>
                            {formatReason(failure.failureReason)}
                          </span>
                          <span className="text-xs text-muted-foreground px-2 py-1 rounded bg-muted">
                            {formatReason(failure.failureStage)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(failure.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm font-mono truncate mb-1">{failure.url}</p>
                        <p className="text-sm text-muted-foreground">
                          User: {failure.userEmail}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeleteConfirmId(failure.id)
                          }}
                          className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                          title="Delete this failure record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => toggleExpanded(failure.id)}
                          className="p-2 text-muted-foreground hover:text-primary rounded transition-colors"
                        >
                          {expandedFailure === failure.id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  {expandedFailure === failure.id && (
                    <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                      {/* Error Message */}
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-1">Error Message:</p>
                        <p className="text-sm text-destructive font-mono bg-muted/50 p-2 rounded">
                          {failure.errorMessage}
                        </p>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">AI Model:</p>
                          <p className="text-sm font-mono">{failure.aiModelProvider}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Processing Time:</p>
                          <p className="text-sm">{failure.processingTimeMs}ms</p>
                        </div>
                      </div>

                      {/* Scraper Diagnostics (Phase 1.5: Enhanced Scraper Debugging) */}
                      {failure.requestContext?.scraperDiagnostics && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Scraper Diagnostics:</p>
                          <div className="bg-muted/50 p-3 rounded space-y-2 text-xs">
                            {failure.requestContext.scraperDiagnostics.currentUrl && (
                              <div>
                                <span className="font-semibold">Current URL:</span>{' '}
                                <span className="font-mono">{failure.requestContext.scraperDiagnostics.currentUrl}</span>
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.pageTitle && (
                              <div>
                                <span className="font-semibold">Page Title:</span>{' '}
                                <span>{failure.requestContext.scraperDiagnostics.pageTitle}</span>
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.htmlSize !== undefined && (
                              <div>
                                <span className="font-semibold">HTML Size:</span>{' '}
                                <span>{failure.requestContext.scraperDiagnostics.htmlSize.toLocaleString()} chars</span>
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.timeoutSelector && (
                              <div>
                                <span className="font-semibold">Timeout Selector:</span>{' '}
                                <span className="font-mono text-orange-600 dark:text-orange-400">
                                  {failure.requestContext.scraperDiagnostics.timeoutSelector}
                                </span>
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.timeoutDuration && (
                              <div>
                                <span className="font-semibold">Timeout Duration:</span>{' '}
                                <span>{failure.requestContext.scraperDiagnostics.timeoutDuration}ms</span>
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.isTimeout && (
                              <div className="text-orange-600 dark:text-orange-400 font-semibold">
                                ⏱️ Operation Timeout Detected
                              </div>
                            )}
                            {failure.requestContext.scraperDiagnostics.errorType && (
                              <div>
                                <span className="font-semibold">Error Type:</span>{' '}
                                <span className="font-mono">{failure.requestContext.scraperDiagnostics.errorType}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Request Context */}
                      {failure.requestContext && Object.keys(failure.requestContext).length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Request Context:</p>
                          <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(failure.requestContext, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Stack Trace */}
                      {failure.stackTrace && (
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-1">Stack Trace:</p>
                          <pre className="text-xs font-mono bg-muted/50 p-2 rounded overflow-x-auto max-h-48 overflow-y-auto">
                            {failure.stackTrace}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total failures)
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                    disabled={page === pagination.totalPages}
                    className="px-4 py-2 text-sm font-medium border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={() => deleteFailure.mutate(deleteConfirmId!)}
        title="Delete Failure Record"
        message="Are you sure you want to permanently delete this failure record? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="destructive"
        isLoading={deleteFailure.isPending}
      />
    </div>
  )
}
