import { CheckCircle, Loader2, XCircle, Clock, Eye, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/utils/cn'

interface BatchResult {
  url: string
  status: 'queued' | 'processing' | 'success' | 'failed'
  schemas?: any[]
  error?: string
  urlId?: string
}

interface BatchProgressPanelProps {
  results: BatchResult[]
  isProcessing: boolean
  onClose: () => void
}

export default function BatchProgressPanel({ results, isProcessing, onClose }: BatchProgressPanelProps) {
  const navigate = useNavigate()

  const totalUrls = results.length
  const completedUrls = results.filter(r => r.status === 'success' || r.status === 'failed').length
  const successCount = results.filter(r => r.status === 'success').length
  const failedCount = results.filter(r => r.status === 'failed').length
  const progress = totalUrls > 0 ? (completedUrls / totalUrls) * 100 : 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'queued':
        return <Clock className="h-4 w-4 text-muted-foreground" />
      case 'processing':
        return <Loader2 className="h-4 w-4 text-primary animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'queued':
        return 'Queued'
      case 'processing':
        return 'Processing...'
      case 'success':
        return 'Complete'
      case 'failed':
        return 'Failed'
      default:
        return status
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'queued':
        return 'text-muted-foreground'
      case 'processing':
        return 'text-primary'
      case 'success':
        return 'text-green-600'
      case 'failed':
        return 'text-red-600'
      default:
        return 'text-muted-foreground'
    }
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6 mt-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                Batch Generation in Progress
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Batch Generation Complete
              </>
            )}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {completedUrls} of {totalUrls} URLs processed
            {successCount > 0 && ` • ${successCount} succeeded`}
            {failedCount > 0 && ` • ${failedCount} failed`}
          </p>
        </div>
        {!isProcessing && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-md transition-colors"
            title="Close"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-500",
              isProcessing ? "bg-primary" : successCount === totalUrls ? "bg-green-500" : "bg-orange-500"
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center justify-between p-3 rounded-md border transition-colors",
              result.status === 'success' && "bg-success/10 border-success/30 dark:bg-success/5 dark:border-success/20",
              result.status === 'failed' && "bg-destructive/10 border-destructive/30 dark:bg-destructive/5 dark:border-destructive/20",
              (result.status === 'queued' || result.status === 'processing') && "bg-muted/30 border-border"
            )}
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {getStatusIcon(result.status)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" title={result.url}>
                  {result.url}
                </p>
                {result.error && (
                  <p className="text-xs text-destructive mt-1">{result.error}</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn("text-xs font-medium", getStatusColor(result.status))}>
                {getStatusText(result.status)}
              </span>
              {result.status === 'success' && result.urlId && (
                <button
                  onClick={() => navigate(`/library?urlId=${result.urlId}`)}
                  className="flex items-center px-2 py-1 rounded border border-primary text-primary bg-transparent hover:bg-primary/10 transition-colors"
                  title="View schema"
                >
                  <Eye className="h-3 w-3 mr-1" />
                  <span className="text-xs font-medium">View</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Message */}
      {!isProcessing && (
        <div className={cn(
          "mt-4 p-3 rounded-md border",
          successCount === totalUrls
            ? "bg-success/10 border-success/30 dark:bg-success/5 dark:border-success/20"
            : "bg-warning/10 border-warning/30 dark:bg-warning/5 dark:border-warning/20"
        )}>
          <p className={cn(
            "text-sm font-medium",
            successCount === totalUrls ? "text-success-foreground" : "text-warning-foreground"
          )}>
            {successCount === totalUrls
              ? '🎉 All schemas generated successfully!'
              : `⚠️ ${successCount} of ${totalUrls} schemas generated successfully.`
            }
          </p>
          {failedCount > 0 && (
            <p className="text-xs text-muted-foreground mt-1">
              {failedCount} URL{failedCount > 1 ? 's' : ''} failed. Check the error messages above.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
