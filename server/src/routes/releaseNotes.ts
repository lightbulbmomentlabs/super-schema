import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { adminAuthMiddleware } from '../middleware/adminAuth.js'
import {
  getPublishedReleaseNotes,
  getAllReleaseNotes,
  createReleaseNote,
  updateReleaseNote,
  deleteReleaseNote
} from '../controllers/releaseNotesController.js'

const router = Router()

// GET /api/release-notes - Get published release notes (public endpoint)
router.get('/', getPublishedReleaseNotes)

// GET /api/admin/release-notes - Get all release notes including drafts (admin only)
router.get('/admin/all', authMiddleware, adminAuthMiddleware, getAllReleaseNotes)

// POST /api/admin/release-notes - Create release note (admin only)
router.post('/admin', authMiddleware, adminAuthMiddleware, createReleaseNote)

// PUT /api/admin/release-notes/:noteId - Update release note (admin only)
router.put('/admin/:noteId', authMiddleware, adminAuthMiddleware, updateReleaseNote)

// DELETE /api/admin/release-notes/:noteId - Delete release note (admin only)
router.delete('/admin/:noteId', authMiddleware, adminAuthMiddleware, deleteReleaseNote)

export default router
