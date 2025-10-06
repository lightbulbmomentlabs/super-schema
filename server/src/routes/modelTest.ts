import { Router, Response } from 'express'
import { schemaGeneratorService } from '../services/schemaGenerator.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import {
  schemaGenerationRequestSchema
} from 'aeo-schema-generator-shared/schemas'

export const modelTestRouter = Router()

// Test schema generation with a specific model
modelTestRouter.post('/test', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { model, ...validatedData } = req.body

  // Validate model parameter
  const validModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-5-nano', 'gpt-3.5-turbo']
  if (!validModels.includes(model)) {
    throw createError(`Invalid model: ${model}. Valid models: ${validModels.join(', ')}`, 400)
  }

  // Validate request body
  const parsedData = schemaGenerationRequestSchema.parse(validatedData)

  try {
    // Temporarily override the model for this request
    const originalModel = process.env.OPENAI_MODEL
    process.env.OPENAI_MODEL = model

    const startTime = Date.now()

    const result = await schemaGeneratorService.generateSchemas({
      url: parsedData.url,
      userId,
      options: parsedData.options,
      ipAddress: req.ip,
      userAgent: req.get('User-Agent')
    })

    const responseTime = Date.now() - startTime

    // Restore original model
    if (originalModel) {
      process.env.OPENAI_MODEL = originalModel
    }

    if (result.success) {
      res.json({
        success: true,
        data: {
          model,
          responseTime,
          schemas: result.schemas,
          metadata: result.metadata,
          validationResults: result.validationResults,
          schemaScore: result.schemaScore
        },
        message: `Successfully generated ${result.schemas.length} schema(s) using ${model}`
      })
    } else {
      res.status(400).json({
        success: false,
        error: result.metadata.errorMessage || 'Schema generation failed',
        data: {
          model,
          responseTime,
          metadata: result.metadata
        }
      })
    }
  } catch (error) {
    // Restore original model in case of error
    const originalModel = process.env.OPENAI_MODEL
    if (originalModel) {
      process.env.OPENAI_MODEL = originalModel
    }

    throw createError(
      error instanceof Error ? error.message : 'Model test failed',
      500
    )
  }
}))

// Get available models and their capabilities
modelTestRouter.get('/models', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const models = [
    {
      value: 'gpt-4o-mini',
      label: 'GPT-4o Mini',
      description: 'Fast, cost-effective model with structured output support',
      cost: 'Low',
      capabilities: ['structured-output', 'temperature'],
      recommended: true
    },
    {
      value: 'gpt-4o',
      label: 'GPT-4o',
      description: 'High-performance model with advanced reasoning',
      cost: 'Medium',
      capabilities: ['structured-output', 'temperature'],
      recommended: true
    },
    {
      value: 'gpt-4-turbo',
      label: 'GPT-4 Turbo',
      description: 'Powerful model with extensive context window',
      cost: 'High',
      capabilities: ['structured-output', 'temperature'],
      recommended: false
    },
    {
      value: 'gpt-5-nano',
      label: 'GPT-5 Nano',
      description: 'Newest experimental model (limited capabilities)',
      cost: 'Variable',
      capabilities: [],
      recommended: true,
      experimental: true
    },
    {
      value: 'gpt-3.5-turbo',
      label: 'GPT-3.5 Turbo',
      description: 'Legacy model with basic capabilities',
      cost: 'Very Low',
      capabilities: [],
      recommended: false
    }
  ]

  res.json({
    success: true,
    data: {
      models,
      currentModel: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    }
  })
}))

// Update the current model for the session
modelTestRouter.post('/switch', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { model } = req.body

  // Validate model parameter
  const validModels = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'gpt-5-nano', 'gpt-3.5-turbo']
  if (!validModels.includes(model)) {
    throw createError(`Invalid model: ${model}. Valid models: ${validModels.join(', ')}`, 400)
  }

  // Update environment variable for this session
  process.env.OPENAI_MODEL = model

  res.json({
    success: true,
    data: {
      model,
      message: `Switched to ${model}`
    }
  })
}))