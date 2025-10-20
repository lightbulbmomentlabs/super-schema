import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useUser } from '@clerk/clerk-react'
import { Bell, Sparkles, Zap, TrendingUp, Bug, Send, X, Lightbulb } from 'lucide-react'
import { apiService } from '@/services/api'
import type { ReleaseNote } from '@shared/types'
import { cn } from '@/utils/cn'
import { NewPill } from '@/components/NewPill'
import { useWhatsNewNotifications } from '@/hooks/useWhatsNewNotifications'

export default function WhatsNewPage() {
  const { user } = useUser()
  const [featureRequest, setFeatureRequest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Set page title
  useEffect(() => {
    document.title = "Super Schema | What's New"
  }, [])

  // Fetch release notes
  const { data: notesData, isLoading } = useQuery({
    queryKey: ['release-notes'],
    queryFn: () => apiService.getReleaseNotes()
  })

  const notes = notesData?.data || []

  // Track what's new notifications
  const { isNoteNew, isNoteUnread, markAllAsRead } = useWhatsNewNotifications(notes)

  // Mark all as read when navigating away from the page (cleanup)
  // This ensures pills disappear when user returns
  useEffect(() => {
    return () => {
      // Only mark as read if we have notes to avoid unnecessary updates
      if (notes.length > 0) {
        markAllAsRead()
      }
    }
  }, [notes.length, markAllAsRead])

  // Submit feature request mutation
  const submitFeatureRequest = useMutation({
    mutationFn: (message: string) => apiService.createSupportTicket({
      category: 'feature_request',
      message
    }),
    onSuccess: () => {
      setFeatureRequest('')
      setSubmitting(false)
      setIsModalOpen(false)
      // Show success message (you might want to add toast notification here)
      alert('Thanks! Your idea is now in our inbox 🚀')
    },
    onError: () => {
      setSubmitting(false)
      alert('Oops! Something went wrong. Please try again.')
    }
  })

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [isModalOpen])

  const handleSubmitFeatureRequest = (e: React.FormEvent) => {
    e.preventDefault()
    if (!featureRequest.trim() || submitting) return
    setSubmitting(true)
    submitFeatureRequest.mutate(featureRequest)
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'new_feature':
        return <Sparkles className="h-4 w-4" />
      case 'enhancement':
        return <TrendingUp className="h-4 w-4" />
      case 'performance':
        return <Zap className="h-4 w-4" />
      case 'bug_fix':
        return <Bug className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'new_feature':
        return 'New Feature'
      case 'enhancement':
        return 'Enhancement'
      case 'performance':
        return 'Performance'
      case 'bug_fix':
        return 'Bug Fix'
      default:
        return category
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'new_feature':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100'
      case 'enhancement':
        return 'bg-info text-info-foreground'
      case 'performance':
        return 'bg-success text-success-foreground'
      case 'bug_fix':
        return 'bg-warning text-warning-foreground'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <>
      <div className="space-y-8 p-6">
        {/* Header with Feature Request Button */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold tracking-tight">What's New</h1>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Lightbulb className="h-4 w-4" />
              <span className="hidden sm:inline">Share an Idea</span>
              <span className="sm:hidden">Idea</span>
            </button>
          </div>
          <p className="text-muted-foreground">
            Stay up to date with the latest features, improvements, and fixes
          </p>
        </div>

      {/* Release Notes */}
      <div className="space-y-4">
        {isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading updates...</p>
          </div>
        )}

        {!isLoading && notes.length === 0 && (
          <div className="text-center py-12 rounded-lg border border-border bg-card p-8">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Nothing new here yet... but we're cooking up something great!</p>
            <p className="text-sm text-muted-foreground mt-2">Check back soon for exciting updates</p>
          </div>
        )}

        {!isLoading && notes.map((note: ReleaseNote) => (
          <div
            key={note.id}
            className="rounded-lg border border-border bg-card p-6 hover:shadow-md transition-shadow"
          >
            {/* Date and Category */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center">
                <span className="text-sm text-muted-foreground font-medium">
                  {formatDate(note.releaseDate)}
                </span>
                {isNoteNew(note) && isNoteUnread(note) && <NewPill />}
              </div>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full',
                  getCategoryColor(note.category)
                )}
              >
                {getCategoryIcon(note.category)}
                {getCategoryLabel(note.category)}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-xl font-semibold mb-2">{note.title}</h3>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed">{note.description}</p>
          </div>
        ))}
      </div>

      </div>

      {/* Feature Request Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-background rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h2 className="text-2xl font-semibold">Share Your Idea</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <p className="text-muted-foreground mb-4">
                Have a feature request or suggestion? We'd love to hear it! Your feedback helps us build a better SuperSchema.
              </p>

              <form onSubmit={handleSubmitFeatureRequest} className="space-y-4">
                <textarea
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  placeholder="Tell us about your brilliant idea... What would make SuperSchema even more super? 🚀"
                  rows={6}
                  className="w-full px-4 py-3 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  disabled={submitting}
                  required
                  minLength={10}
                  autoFocus
                />

                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    {featureRequest.length < 10 && featureRequest.length > 0 && (
                      <span className="text-warning">At least 10 characters required</span>
                    )}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={submitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={featureRequest.trim().length < 10 || submitting}
                      className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <Send className="h-4 w-4" />
                      {submitting ? 'Sending...' : 'Submit Idea'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
