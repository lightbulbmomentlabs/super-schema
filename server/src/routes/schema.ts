import { Router } from 'express'
import {
  generateSchema,
  validateSchema,
  validateMultipleSchemas,
  getGenerationHistory,
  getGenerationStats,
  getGenerationInsights,
  batchGenerateSchemas,
  batchGenerateSchemasStream,
  refineSchema,
  refineLibrarySchema,
  recalculateScore,
  extractSchemaFromUrl,
  deleteSchemaType,
  getUnviewedCount
} from '../controllers/schemaController.js'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

// PUBLIC ROUTES (no auth required)
// POST /api/schema/extract - Public endpoint for schema grader
router.post('/extract', extractSchemaFromUrl)

// PROTECTED ROUTES (auth required)
// POST /api/schema/generate
router.post('/generate', authMiddleware, generateSchema)

// POST /api/schema/batch-generate
router.post('/batch-generate', authMiddleware, batchGenerateSchemas)

// POST /api/schema/batch-generate-stream - SSE streaming for real-time progress
router.post('/batch-generate-stream', authMiddleware, batchGenerateSchemasStream)

// POST /api/schema/refine
router.post('/refine', authMiddleware, refineSchema)

// POST /api/schema/refine-library
router.post('/refine-library', authMiddleware, refineLibrarySchema)

// POST /api/schema/recalculate-score
router.post('/recalculate-score', authMiddleware, recalculateScore)

// POST /api/schema/validate
router.post('/validate', authMiddleware, validateSchema)

// POST /api/schema/validate-multiple
router.post('/validate-multiple', authMiddleware, validateMultipleSchemas)

// GET /api/schema/history
router.get('/history', authMiddleware, getGenerationHistory)

// GET /api/schema/stats
router.get('/stats', authMiddleware, getGenerationStats)

// GET /api/schema/insights
router.get('/insights', authMiddleware, getGenerationInsights)

// GET /api/schema/unviewed-count - Stub for deprecated feature
router.get('/unviewed-count', authMiddleware, getUnviewedCount)

// DELETE /api/schema/:schemaId - Delete a schema type (soft delete for regeneration tracking)
router.delete('/:schemaId', authMiddleware, deleteSchemaType)

export default router