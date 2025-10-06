import { Router } from 'express'
import {
  generateSchema,
  validateSchema,
  validateMultipleSchemas,
  getGenerationHistory,
  getGenerationStats,
  getGenerationInsights,
  batchGenerateSchemas,
  refineSchema,
  refineLibrarySchema
} from '../controllers/schemaController.js'

const router = Router()

// POST /api/schema/generate
router.post('/generate', generateSchema)

// POST /api/schema/batch-generate
router.post('/batch-generate', batchGenerateSchemas)

// POST /api/schema/refine
router.post('/refine', refineSchema)

// POST /api/schema/refine-library
router.post('/refine-library', refineLibrarySchema)

// POST /api/schema/validate
router.post('/validate', validateSchema)

// POST /api/schema/validate-multiple
router.post('/validate-multiple', validateMultipleSchemas)

// GET /api/schema/history
router.get('/history', getGenerationHistory)

// GET /api/schema/stats
router.get('/stats', getGenerationStats)

// GET /api/schema/insights
router.get('/insights', getGenerationInsights)

export default router