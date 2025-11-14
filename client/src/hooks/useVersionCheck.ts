import { useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
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

    // Create persistent toast notification
    const toastId = toast(
      `🎉 New version ${newVersion} is available! Refresh your browser to get the latest features and fixes.`,
      {
        duration: Infinity, // Persistent until user dismisses
        position: 'bottom-left',
        icon: '🎉',
        style: {
          maxWidth: '500px',
          cursor: 'default',
        },
      }
    )

    toastIdRef.current = toastId

    // Store dismissed version when toast is dismissed
    const handleDismiss = () => {
      localStorage.setItem(STORAGE_KEY_DISMISSED, newVersion)
      toastIdRef.current = null
    }

    // Add event listener for when toast is dismissed
    setTimeout(() => {
      const toastElement = document.querySelector(`[data-toast-id="${toastId}"]`)
      if (toastElement) {
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            if (mutation.type === 'childList' && !document.querySelector(`[data-toast-id="${toastId}"]`)) {
              handleDismiss()
              observer.disconnect()
            }
          })
        })
        observer.observe(toastElement.parentElement || document.body, { childList: true })
      }
    }, 100)
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
