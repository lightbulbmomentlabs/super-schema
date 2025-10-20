import { useCallback, useMemo, useState, useEffect } from 'react'
import type { ReleaseNote } from '@shared/types'

const STORAGE_KEY = 'whatsNew_lastVisit'
const NEW_THRESHOLD_DAYS = 7

/**
 * Custom hook for managing What's New notification state
 * Tracks when user last visited the What's New page and calculates unread counts
 */
export function useWhatsNewNotifications(notes: ReleaseNote[] = []) {
  // State to trigger re-renders when localStorage changes
  const [lastReadTime, setLastReadTime] = useState<number>(Date.now())
  /**
   * Get the last visit timestamp from localStorage
   */
  const getLastVisitTimestamp = useCallback((): Date | null => {
    try {
      const timestamp = localStorage.getItem(STORAGE_KEY)
      return timestamp ? new Date(timestamp) : null
    } catch (error) {
      console.error('Failed to read last visit timestamp:', error)
      return null
    }
  }, [])

  /**
   * Mark all notes as read by updating the last visit timestamp
   */
  const markAllAsRead = useCallback((): void => {
    try {
      const now = new Date().toISOString()
      localStorage.setItem(STORAGE_KEY, now)
      setLastReadTime(Date.now()) // Trigger re-render
    } catch (error) {
      console.error('Failed to save last visit timestamp:', error)
    }
  }, [])

  /**
   * Check if a note is "new" (published within last 7 days)
   */
  const isNoteNew = useCallback((note: ReleaseNote): boolean => {
    const releaseDate = new Date(note.releaseDate)
    const now = new Date()
    const daysDiff = Math.floor((now.getTime() - releaseDate.getTime()) / (1000 * 60 * 60 * 24))
    return daysDiff <= NEW_THRESHOLD_DAYS
  }, [])

  /**
   * Check if a note is unread (published after last visit OR within 7 days for first-time visitors)
   */
  const isNoteUnread = useCallback((note: ReleaseNote): boolean => {
    const lastVisit = getLastVisitTimestamp()
    const releaseDate = new Date(note.releaseDate)

    // For first-time visitors, only show notes within 7 days as unread
    if (!lastVisit) {
      return isNoteNew(note)
    }

    // For returning visitors, show notes published after their last visit
    return releaseDate > lastVisit
  }, [getLastVisitTimestamp, isNoteNew])

  /**
   * Calculate the number of unread notes
   */
  const unreadCount = useMemo(() => {
    return notes.filter(isNoteUnread).length
  }, [notes, isNoteUnread, lastReadTime])

  /**
   * Get all notes that should display the "New" badge
   * (published within 7 days AND unread)
   */
  const newNotes = useMemo(() => {
    return notes.filter(note => isNoteNew(note) && isNoteUnread(note))
  }, [notes, isNoteNew, isNoteUnread, lastReadTime])

  /**
   * Check if a specific note should show the "New" pill
   */
  const shouldShowNewPill = useCallback((note: ReleaseNote): boolean => {
    return isNoteNew(note) && isNoteUnread(note)
  }, [isNoteNew, isNoteUnread])

  return {
    unreadCount,
    newNotes,
    isNoteNew,
    isNoteUnread,
    shouldShowNewPill,
    markAllAsRead,
    getLastVisitTimestamp
  }
}
