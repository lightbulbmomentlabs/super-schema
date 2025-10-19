import { Response } from 'express'
import { db } from '../services/database.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { z } from 'zod'

// Validation schemas
const createReleaseNoteSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').max(200, 'Title must be less than 200 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(1000, 'Description must be less than 1000 characters'),
  category: z.enum(['new_feature', 'enhancement', 'performance', 'bug_fix']),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Release date must be in YYYY-MM-DD format'),
  isPublished: z.boolean().optional().default(false)
})

const updateReleaseNoteSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(1000).optional(),
  category: z.enum(['new_feature', 'enhancement', 'performance', 'bug_fix']).optional(),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  isPublished: z.boolean().optional()
})

// Public endpoint - get all published release notes
export const getPublishedReleaseNotes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notes = await db.getPublishedReleaseNotes()

  res.json({
    success: true,
    data: notes
  })
})

// Admin endpoint - get all release notes (including unpublished drafts)
export const getAllReleaseNotes = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const notes = await db.getAllReleaseNotes()

  res.json({
    success: true,
    data: notes
  })
})

// Admin endpoint - create a new release note
export const createReleaseNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { title, description, category, releaseDate, isPublished } = createReleaseNoteSchema.parse(req.body)

  const note = await db.createReleaseNote({
    title,
    description,
    category,
    releaseDate,
    isPublished: isPublished ?? false
  })

  res.json({
    success: true,
    data: note,
    message: 'Release note created successfully'
  })
})

// Admin endpoint - update a release note
export const updateReleaseNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { noteId } = req.params
  const updates = updateReleaseNoteSchema.parse(req.body)

  const note = await db.updateReleaseNote(noteId, updates)

  res.json({
    success: true,
    data: note,
    message: 'Release note updated successfully'
  })
})

// Admin endpoint - delete a release note
export const deleteReleaseNote = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { noteId } = req.params

  await db.deleteReleaseNote(noteId)

  res.json({
    success: true,
    message: 'Release note deleted successfully'
  })
})
