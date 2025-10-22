import { useState } from 'react'
import { X, CheckCircle2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { apiService } from '@/services/api'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General Question', description: 'Ask us anything about the product' },
  { value: 'feature_request', label: 'Feature Request', description: 'Suggest a new feature or improvement' },
  { value: 'bug_report', label: 'Bug Report', description: 'Report a problem or error you encountered' }
] as const

const MAX_CHARS = 500
const MIN_CHARS = 10

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [category, setCategory] = useState<'general' | 'feature_request' | 'bug_report' | ''>('')
  const [message, setMessage] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)

  const createTicket = useMutation({
    mutationFn: (data: { category: 'general' | 'feature_request' | 'bug_report'; message: string }) =>
      apiService.createSupportTicket(data),
    onSuccess: () => {
      setShowSuccess(true)
      // Auto-close after 5 seconds to give time to read the message
      setTimeout(() => {
        handleClose()
      }, 5000)
    }
  })

  const handleClose = () => {
    setCategory('')
    setMessage('')
    setShowSuccess(false)
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!category || message.length < MIN_CHARS) return

    createTicket.mutate({
      category: category as 'general' | 'feature_request' | 'bug_report',
      message
    })
  }

  const charCount = message.length
  const isValid = category && charCount >= MIN_CHARS && charCount <= MAX_CHARS

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50 animate-in fade-in duration-200"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="bg-background border border-border rounded-lg shadow-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-6 pb-4">
            <h2 className="text-xl font-semibold">Contact Support</h2>
            <button
              onClick={handleClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Success State */}
          {showSuccess ? (
            <div className="px-6 pb-6">
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <CheckCircle2 className="h-16 w-16 text-success-foreground mb-4" />
                <p className="text-lg font-semibold mb-2">Message sent successfully!</p>
                <p className="text-sm text-muted-foreground mb-4">
                  We'll get back to you via email soon.
                </p>
                <div className="bg-muted/50 border border-border rounded-lg p-4 text-left w-full mt-2">
                  <p className="text-sm font-medium mb-2">📧 Important: Add us to your contacts</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    To ensure our response doesn't end up in your spam folder, please add{' '}
                    <span className="font-mono font-semibold text-foreground">kevin@superschema.ai</span>{' '}
                    to your email contacts or safe sender list.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Content */}
              <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
                {/* Category Dropdown */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a category...</option>
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  {category && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {CATEGORY_OPTIONS.find(opt => opt.value === category)?.description}
                    </p>
                  )}
                </div>

                {/* Message Textarea */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, MAX_CHARS))}
                    placeholder="Please describe your question, feature request, or issue in detail..."
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    required
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      charCount < MIN_CHARS
                        ? 'text-destructive-foreground'
                        : charCount > MAX_CHARS * 0.9
                        ? 'text-warning-foreground'
                        : 'text-muted-foreground'
                    }`}>
                      {charCount < MIN_CHARS
                        ? `Minimum ${MIN_CHARS} characters required`
                        : `${charCount}/${MAX_CHARS} characters`
                      }
                    </p>
                  </div>
                </div>

                {/* Error Message */}
                {createTicket.isError && (
                  <div className="p-3 bg-destructive border border-destructive rounded-md">
                    <p className="text-sm text-destructive-foreground">
                      Failed to send message. Please try again.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm rounded-md border border-input hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!isValid || createTicket.isPending}
                    className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {createTicket.isPending ? 'Sending...' : 'Submit'}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  )
}
