import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertCircle, Clock, CheckCircle, XCircle, Copy, Eye, Filter, RefreshCw } from 'lucide-react'
import { apiService } from '@/services/api'
import toast from 'react-hot-toast'

interface ErrorLog {
  id: string
  error_type: string
  message: string
  stack_trace?: string
  user_id?: string
  user_email?: string
  request_method?: string
  request_url?: string
  request_path?: string
  request_body?: any
  request_headers?: any
  response_status?: number
  response_body?: any
  ip_address?: string
  user_agent?: string
  status: 'open' | 'investigating' | 'resolved' | 'ignored'
  occurrence_count: number
  first_seen_at: string
  last_seen_at: string
  created_at: string
  additional_context?: any
  tags?: string[]
}

export default function AdminErrorsSection() {
  const queryClient = useQueryClient()
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('open')
  const [limit] = useState(100)
  const [offset, setOffset] = useState(0)

  // Fetch error logs
  const { data: errorsData, isLoading, refetch } = useQuery({
    queryKey: ['admin-error-logs', statusFilter, limit, offset],
    queryFn: () => apiService.getErrorLogs({
      limit,
      offset,
      status: statusFilter === 'all' ? undefined : statusFilter as any
    })
  })

  // Fetch error stats
  const { data: statsData } = useQuery({
    queryKey: ['admin-error-stats'],
    queryFn: () => apiService.getErrorStats('24h')
  })

  // Update error status mutation
  const updateStatus = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      apiService.updateErrorLogStatus(id, status, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-error-logs'] })
      toast.success('Error status updated')
      setSelectedError(null)
    },
    onError: () => {
      toast.error('Failed to update error status')
    }
  })

  const errors = errorsData?.data || []
  const total = errorsData?.total || 0
  const stats = statsData?.data

  const copyErrorReport = (error: ErrorLog) => {
    const report = `
ERROR REPORT - SuperSchema
================================
Error ID: ${error.id}
Timestamp: ${new Date(error.created_at).toLocaleString()}
Status: ${getStatusEmoji(error.status)} ${error.response_status || 'N/A'} ${error.error_type}
Occurrences: ${error.occurrence_count}x
First Seen: ${new Date(error.first_seen_at).toLocaleString()}
Last Seen: ${new Date(error.last_seen_at).toLocaleString()}

USER CONTEXT
------------
${error.user_email ? `User: ${error.user_email} (${error.user_id})` : 'User: Not authenticated'}
IP: ${error.ip_address || 'N/A'}
Browser: ${error.user_agent || 'N/A'}

REQUEST
-------
${error.request_method} ${error.request_url || error.request_path || 'N/A'}
${error.request_body ? `Body: ${JSON.stringify(error.request_body, null, 2)}` : ''}

ERROR
-----
Message: ${error.message}
Type: ${error.error_type}
${error.stack_trace ? `\nStack Trace:\n${error.stack_trace}` : ''}

RESPONSE
--------
Status: ${error.response_status || 'N/A'}
${error.response_body ? `Body: ${JSON.stringify(error.response_body, null, 2)}` : ''}

${error.additional_context ? `\nADDITIONAL CONTEXT\n------------------\n${JSON.stringify(error.additional_context, null, 2)}` : ''}
================================
    `.trim()

    navigator.clipboard.writeText(report)
    toast.success('Error report copied to clipboard!')
  }

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'open': return '🔴'
      case 'investigating': return '🔵'
      case 'resolved': return '✅'
      case 'ignored': return '⚪'
      default: return '❓'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'text-destructive bg-destructive/10'
      case 'investigating': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30'
      case 'resolved': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30'
      case 'ignored': return 'text-muted-foreground bg-muted'
      default: return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total (24h)</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-muted-foreground" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Open</p>
                <p className="text-2xl font-bold text-destructive">{stats.byStatus?.open || 0}</p>
              </div>
              <XCircle className="w-8 h-8 text-destructive/50" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Investigating</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byStatus?.investigating || 0}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.byStatus?.resolved || 0}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="resolved">Resolved</option>
            <option value="ignored">Ignored</option>
          </select>

          <button
            onClick={() => refetch()}
            className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Error List */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">
            Error Logs ({total})
          </h3>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading errors...</div>
        ) : errors.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No errors found! 🎉</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Error
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {errors.map((error: ErrorLog) => (
                  <tr key={error.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(error.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium">{error.error_type}</div>
                      <div className="text-muted-foreground truncate max-w-xs">{error.message}</div>
                      {error.response_status && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-destructive/10 text-destructive mt-1">
                          {error.response_status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {error.user_email || 'Anonymous'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(error.status)}`}>
                        {error.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {error.occurrence_count}x
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedError(error)}
                        className="text-primary hover:text-primary/80 transition-colors"
                        title="View details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => copyErrorReport(error)}
                        className="text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
                        title="Copy error report"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Error Details Modal */}
      {selectedError && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-border">
            <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Error Details</h3>
              <button
                onClick={() => setSelectedError(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Update */}
              <div className="bg-muted/50 rounded-lg p-4">
                <label className="block text-sm font-medium mb-2">
                  Update Status
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus.mutate({ id: selectedError.id, status: 'investigating' })}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    Mark Investigating
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: selectedError.id, status: 'resolved' })}
                    className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                  >
                    Mark Resolved
                  </button>
                  <button
                    onClick={() => updateStatus.mutate({ id: selectedError.id, status: 'ignored' })}
                    className="px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors"
                  >
                    Ignore
                  </button>
                  <button
                    onClick={() => copyErrorReport(selectedError)}
                    className="ml-auto px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Full Report
                  </button>
                </div>
              </div>

              {/* Error Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Error Type</h4>
                  <p className="text-sm">{selectedError.error_type}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Status Code</h4>
                  <p className="text-sm">{selectedError.response_status || 'N/A'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Occurrences</h4>
                  <p className="text-sm">{selectedError.occurrence_count}x</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Last Seen</h4>
                  <p className="text-sm">{new Date(selectedError.last_seen_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Message */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Error Message</h4>
                <pre className="text-sm bg-muted/50 p-4 rounded-md overflow-x-auto border border-border">
                  {selectedError.message}
                </pre>
              </div>

              {/* User Context */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">User Context</h4>
                <div className="bg-muted/50 p-4 rounded-md space-y-2 border border-border">
                  <p className="text-sm"><span className="font-medium">Email:</span> {selectedError.user_email || 'Anonymous'}</p>
                  <p className="text-sm"><span className="font-medium">User ID:</span> {selectedError.user_id || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">IP:</span> {selectedError.ip_address || 'N/A'}</p>
                  <p className="text-sm"><span className="font-medium">User Agent:</span> {selectedError.user_agent || 'N/A'}</p>
                </div>
              </div>

              {/* Request Details */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Request Details</h4>
                <div className="bg-muted/50 p-4 rounded-md space-y-2 border border-border">
                  <p className="text-sm"><span className="font-medium">Method:</span> {selectedError.request_method}</p>
                  <p className="text-sm"><span className="font-medium">URL:</span> {selectedError.request_url || selectedError.request_path}</p>
                  {selectedError.request_body && (
                    <div>
                      <p className="text-sm font-medium mb-1">Body:</p>
                      <pre className="text-xs bg-background p-2 rounded border border-border overflow-x-auto">
                        {JSON.stringify(selectedError.request_body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>

              {/* Stack Trace */}
              {selectedError.stack_trace && (
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Stack Trace</h4>
                  <pre className="text-xs bg-muted/50 p-4 rounded-md overflow-x-auto border border-border">
                    {selectedError.stack_trace}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
