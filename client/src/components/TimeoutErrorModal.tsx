import { X } from 'lucide-react'

interface TimeoutErrorModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  errorMessage?: string
  onContactSupport: () => void
  onCheckComplete: () => void
  isChecking?: boolean
}

export default function TimeoutErrorModal({
  isOpen,
  onClose,
  url,
  errorMessage,
  onContactSupport,
  onCheckComplete,
  isChecking = false
}: TimeoutErrorModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-lg shadow-lg max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4 pr-8">
          <div className="flex-shrink-0">
            <img
              src="/super-schema-timeout.png"
              alt="Timeout"
              className="w-16 h-auto"
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">
              Hmm, this page is taking longer than expected
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              No worries — this happens sometimes!
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="mb-6">
          <div className="bg-muted/50 rounded-md p-3 mb-4">
            <p className="text-sm font-medium text-foreground break-all">
              {url}
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Here are some common reasons why schema generation might time out:
            </p>

            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>The website has bot detection or anti-scraping measures</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>The server is responding slowly or experiencing high traffic</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>The page has heavy content or continuous background loading</span>
              </li>
              <li className="flex items-start">
                <span className="text-yellow-500 mr-2">•</span>
                <span>Network connectivity issues between our servers and the site</span>
              </li>
            </ul>

            <p className="text-sm text-muted-foreground mt-4 font-medium">
              <span className="text-foreground">Don't worry:</span> Your credit has been automatically refunded. You can try again in a moment, or try a different page from this site that might load faster.
            </p>

            <p className="text-sm text-muted-foreground mt-3">
              If this keeps happening, try a different page or <button onClick={onContactSupport} className="text-primary hover:underline">contact support</button>.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  )
}
