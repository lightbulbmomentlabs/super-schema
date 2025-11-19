import { motion } from 'framer-motion'
import { Link, CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react'
import { cn } from '@/utils/cn'
import type { GA4Connection } from '@/services/ga4'

interface GA4ConnectionStatusProps {
  connected: boolean
  connection: GA4Connection | null
  isLoading?: boolean
  onConnect?: () => void
  onDisconnect?: () => void
  isDisconnecting?: boolean
  className?: string
  compact?: boolean
}

export default function GA4ConnectionStatus({
  connected,
  connection,
  isLoading = false,
  onConnect,
  onDisconnect,
  isDisconnecting = false,
  className = '',
  compact = false
}: GA4ConnectionStatusProps) {
  if (isLoading) {
    return (
      <div className={cn(
        'bg-card border border-border rounded-xl',
        compact ? 'p-4' : 'p-6',
        'animate-pulse',
        className
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('bg-muted/20 rounded-full', compact ? 'h-8 w-8' : 'h-12 w-12')} />
            <div>
              <div className={cn('bg-muted/20 rounded mb-2', compact ? 'h-4 w-32' : 'h-6 w-48')} />
              {!compact && <div className="h-4 w-32 bg-muted/20 rounded" />}
            </div>
          </div>
          <div className={cn('bg-muted/20 rounded-lg', compact ? 'h-8 w-20' : 'h-10 w-24')} />
        </div>
      </div>
    )
  }

  // Compact mode - minimal design for inline usage
  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'bg-card border border-border rounded-xl p-4',
          'hover:shadow-lg hover:border-primary/30 transition-all duration-300',
          className
        )}
      >
        <div className="flex items-center justify-between gap-3">
          {/* Status Icon and Info */}
          <div className="flex items-center gap-3">
            <div className={cn(
              'inline-flex items-center justify-center rounded-lg p-2',
              connected ? 'bg-green-500/10' : 'bg-muted/20'
            )}>
              {connected ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 text-muted-foreground" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <Link className="h-3.5 w-3.5 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">
                  Google Analytics 4
                </p>
              </div>
              {connected && (
                <p className="text-xs text-muted-foreground">
                  Connected
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className={cn(
                'px-3 py-1.5 rounded-lg font-medium text-xs',
                'border border-border',
                'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={onConnect}
              className={cn(
                'px-4 py-2 rounded-lg font-semibold text-xs',
                'bg-gradient-to-r from-primary to-primary/80',
                'text-primary-foreground',
                'hover:shadow-lg hover:scale-105',
                'transition-all duration-200',
                'inline-flex items-center gap-1.5'
              )}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Connect
            </button>
          )}
        </div>
      </motion.div>
    )
  }

  // Full mode - detailed design
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        'bg-card border border-border rounded-2xl p-6',
        'hover:shadow-xl hover:border-primary/30 transition-all duration-300',
        className
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Status Icon and Info */}
        <div className="flex items-center gap-4">
          <div className={cn(
            'inline-flex items-center justify-center rounded-full p-3',
            connected
              ? 'bg-green-500/10'
              : 'bg-muted/20'
          )}>
            {connected ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-muted-foreground" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-lg font-bold text-foreground">
                Google Analytics 4
              </h3>
            </div>

            {connected ? (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Connected on {new Date(connection!.connectedAt).toLocaleDateString()}
                </p>
                {connection?.lastValidatedAt && (
                  <p className="text-xs text-muted-foreground/70">
                    Last validated: {new Date(connection.lastValidatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Not connected
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={onDisconnect}
              disabled={isDisconnecting}
              className={cn(
                'px-4 py-2 rounded-lg font-medium text-sm',
                'border border-border',
                'hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50',
                'transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
          ) : (
            <button
              onClick={onConnect}
              className={cn(
                'px-5 py-2.5 rounded-lg font-semibold text-sm',
                'bg-gradient-to-r from-primary to-primary/80',
                'text-primary-foreground',
                'hover:shadow-lg hover:scale-105',
                'transition-all duration-200',
                'inline-flex items-center gap-2'
              )}
            >
              <ExternalLink className="h-4 w-4" />
              Connect GA4
            </button>
          )}
        </div>
      </div>

      {/* Scopes Information */}
      {connected && connection?.scopes && connection.scopes.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Granted Permissions:
              </p>
              <div className="flex flex-wrap gap-2">
                {connection.scopes.map((scope) => (
                  <span
                    key={scope}
                    className="inline-block px-2 py-1 rounded-md bg-muted/30 text-xs text-muted-foreground font-mono"
                  >
                    {scope.replace('https://www.googleapis.com/auth/', '')}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
