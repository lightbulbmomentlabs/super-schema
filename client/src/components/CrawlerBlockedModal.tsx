import { X } from 'lucide-react'

interface CrawlerBlockedModalProps {
  isOpen: boolean
  onClose: () => void
  url: string
  blockingReasons: string[]
}

export default function CrawlerBlockedModal({
  isOpen,
  onClose,
  url,
  blockingReasons
}: CrawlerBlockedModalProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg p-6 w-full max-w-md relative">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Icon Header - Super Tired */}
          <div className="flex items-center justify-center mb-4">
            <img
              src="/super-tired.png"
              alt="Crawler Blocked"
              className="w-[150px] h-auto"
            />
          </div>

          {/* Title */}
          <h3 className="text-xl font-semibold text-foreground text-center mb-2">
            Kryptonite Detected!
          </h3>

          {/* Subtitle */}
          <p className="text-sm text-muted-foreground text-center mb-4">
            This page has blocking rules that weaken our superpowers. Even heroes have limits!
          </p>

          {/* URL Display */}
          <div className="bg-muted/50 rounded-md p-3 mb-4">
            <p className="text-xs font-mono text-foreground break-all">
              {url}
            </p>
          </div>

          {/* Blocking Reasons */}
          <div className="mb-6">
            <p className="text-sm font-medium text-foreground mb-2">
              We detected:
            </p>
            <ul className="space-y-2">
              {blockingReasons.map((reason, index) => (
                <li key={index} className="flex items-start text-sm">
                  <span className="text-orange-500 mr-2 mt-0.5">•</span>
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>

            <div className="mt-4 p-3 bg-muted/30 rounded-md border border-border">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">What to do:</span> Remove the blocking rules from your website, generate schema, then add them back if needed.
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            >
              Got It
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
