import { useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import { Sparkles, X } from 'lucide-react'
import { apiService } from '@/services/api'
import { APP_VERSION } from '@/version'

const STORAGE_KEY_DISMISSED = 'app_dismissed_version'
const CHECK_INTERVAL = 1800000 // 30 minutes in milliseconds

/**
 * Custom hook for checking and notifying users of new app versions
 * Polls the /health endpoint every 30 minutes and shows a toast when a new version is detected
 */
export function useVersionCheck() {
  const toastIdRef = useRef<string | null>(null)

  /**
   * Check if there's a new version available
   */
  const checkVersion = useCallback(async () => {
    try {
      const { version: serverVersion } = await apiService.getVersion()
      const dismissedVersion = localStorage.getItem(STORAGE_KEY_DISMISSED)

      console.log('🔍 [VersionCheck] Checking for updates', {
        clientVersion: APP_VERSION,
        serverVersion,
        dismissedVersion
      })

      // If server version is different from client version AND hasn't been dismissed
      if (serverVersion !== APP_VERSION && serverVersion !== dismissedVersion) {
        console.log('🎉 [VersionCheck] New version detected!', {
          currentVersion: APP_VERSION,
          newVersion: serverVersion
        })

        // Show persistent toast with Refresh button
        showUpdateNotification(serverVersion)
      }
    } catch (error) {
      console.error('❌ [VersionCheck] Failed to check version:', error)
      // Silently fail - don't interrupt user experience
    }
  }, [])

  /**
   * Show update notification
   */
  const showUpdateNotification = useCallback((newVersion: string) => {
    // Dismiss existing notification if any
    if (toastIdRef.current) {
      toast.dismiss(toastIdRef.current)
    }

    // Create persistent toast notification with custom UI
    const toastId = toast.custom(
      (t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-card text-card-foreground shadow-lg rounded-lg pointer-events-auto flex items-center border border-border`}
        >
          <div className="flex-1 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Sparkles
                  className="h-6 w-6 text-primary animate-pulse"
                  strokeWidth={2}
                />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-foreground">
                  New updates available!
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click refresh to get the latest features and improvements.
                </p>
              </div>
              <div className="ml-4 flex flex-shrink-0 gap-2">
                <button
                  onClick={() => {
                    // Mark this version as seen before reloading
                    localStorage.setItem(STORAGE_KEY_DISMISSED, newVersion)
                    // Force hard reload to bypass cache
                    window.location.reload()
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={() => {
                    localStorage.setItem(STORAGE_KEY_DISMISSED, newVersion)
                    toast.dismiss(toastId)
                    toastIdRef.current = null
                  }}
                  className="inline-flex rounded-md p-1.5 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-colors"
                >
                  <span className="sr-only">Dismiss</span>
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ),
      {
        duration: Infinity, // Persistent until user dismisses
        position: 'bottom-left',
      }
    )

    toastIdRef.current = toastId
  }, [])

  /**
   * Set up polling interval
   */
  useEffect(() => {
    // Check immediately on mount
    checkVersion()

    // Set up interval to check every 30 minutes
    const intervalId = setInterval(checkVersion, CHECK_INTERVAL)

    // Cleanup on unmount
    return () => {
      clearInterval(intervalId)
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current)
      }
    }
  }, [checkVersion])

  return {
    checkVersion // Exposed for manual checks if needed
  }
}
