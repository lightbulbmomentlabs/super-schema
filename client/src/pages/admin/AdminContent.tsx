import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Plus,
  Trash2
} from 'lucide-react'
import { apiService } from '@/services/api'
import type { ReleaseNote } from '@shared/types'

export default function AdminContent() {
  const queryClient = useQueryClient()
  const [showReleaseNoteForm, setShowReleaseNoteForm] = useState(false)
  const [noteTitle, setNoteTitle] = useState('')
  const [noteDescription, setNoteDescription] = useState('')
  const [noteCategory, setNoteCategory] = useState<'new_feature' | 'enhancement' | 'performance' | 'bug_fix'>('new_feature')
  const [noteDate, setNoteDate] = useState(new Date().toISOString().split('T')[0])
  const [notePublished, setNotePublished] = useState(false)

  // Release notes query
  const { data: releaseNotesData, isLoading: releaseNotesLoading } = useQuery({
    queryKey: ['admin-release-notes'],
    queryFn: () => apiService.getAllReleaseNotes()
  })

  // Create release note mutation
  const createReleaseNote = useMutation({
    mutationFn: (data: any) => apiService.createReleaseNote(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-release-notes'] })
      setNoteTitle('')
      setNoteDescription('')
      setNoteCategory('new_feature')
      setNoteDate(new Date().toISOString().split('T')[0])
      setNotePublished(false)
      setShowReleaseNoteForm(false)
    }
  })

  // Delete release note mutation
  const deleteReleaseNote = useMutation({
    mutationFn: (noteId: string) => apiService.deleteReleaseNote(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-release-notes'] })
    }
  })

  const allReleaseNotes = releaseNotesData?.data || []

  const handleCreateReleaseNote = () => {
    if (!noteTitle || !noteDescription || !noteDate) return

    createReleaseNote.mutate({
      title: noteTitle,
      description: noteDescription,
      category: noteCategory,
      releaseDate: noteDate,
      isPublished: notePublished
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Content Management</h2>
        <p className="text-muted-foreground mt-1">
          Create and manage release notes and announcements
        </p>
      </div>

      {/* Release Notes Management Section */}
      <div className="rounded-lg border border-border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold">Release Notes</h2>
          </div>
          <button
            onClick={() => setShowReleaseNoteForm(!showReleaseNoteForm)}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            {showReleaseNoteForm ? 'Cancel' : 'Add Release Note'}
          </button>
        </div>

        {/* Create Release Note Form */}
        {showReleaseNoteForm && (
          <div className="mb-6 p-4 border border-border rounded-md bg-muted/20">
            <h3 className="font-semibold mb-3">Create New Release Note</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Brief, catchy title (5-8 words)"
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={noteDescription}
                  onChange={(e) => setNoteDescription(e.target.value)}
                  placeholder="User-friendly description with a touch of humor..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    value={noteCategory}
                    onChange={(e) => setNoteCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="new_feature">New Feature</option>
                    <option value="enhancement">Enhancement</option>
                    <option value="performance">Performance</option>
                    <option value="bug_fix">Bug Fix</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Release Date</label>
                  <input
                    type="date"
                    value={noteDate}
                    onChange={(e) => setNoteDate(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={notePublished}
                  onChange={(e) => setNotePublished(e.target.checked)}
                  className="rounded border-border"
                />
                <label htmlFor="published" className="text-sm font-medium">
                  Publish immediately
                </label>
              </div>
              <button
                onClick={handleCreateReleaseNote}
                disabled={!noteTitle || !noteDescription || createReleaseNote.isPending}
                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createReleaseNote.isPending ? 'Creating...' : 'Create Release Note'}
              </button>
            </div>
          </div>
        )}

        {/* Release Notes List */}
        {releaseNotesLoading ? (
          <p className="text-sm text-muted-foreground text-center py-8">Loading release notes...</p>
        ) : allReleaseNotes.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No release notes yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allReleaseNotes.map((note: ReleaseNote) => (
              <div key={note.id} className="p-4 border border-border rounded-md bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold">{note.title}</h4>
                      {!note.isPublished && (
                        <span className="px-2 py-0.5 text-xs bg-warning text-warning-foreground rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{note.description}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="capitalize">{note.category.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{new Date(note.releaseDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteReleaseNote.mutate(note.id)}
                    disabled={deleteReleaseNote.isPending}
                    className="text-red-600 hover:text-red-700 disabled:opacity-50 p-2"
                    title="Delete release note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
