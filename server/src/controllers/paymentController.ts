import { Response } from 'express'
import { stripeService } from '../services/stripe.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'
import type { AuthenticatedRequest } from '../middleware/auth.js'
import { creditPurchaseSchema, paginationSchema } from 'aeo-schema-generator-shared/schemas'

export const getCreditPacks = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  try {
    const creditPacks = await stripeService.getCreditPacks()

    // Add calculated fields for the frontend
    const enhancedPacks = creditPacks.map(pack => ({
      ...pack,
      priceFormatted: stripeService.formatAmount(pack.priceInCents),
      pricePerCredit: stripeService.calculatePricePerCredit(pack.priceInCents, pack.credits)
    }))

    res.json({
      success: true,
      data: enhancedPacks
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to get credit packs',
      500
    )
  }
})

export const createPaymentIntent = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate request body
  const { creditPackId, successUrl, cancelUrl } = creditPurchaseSchema.parse(req.body)

  try {
    const result = await stripeService.createPaymentIntent(
      userId,
      creditPackId,
      successUrl,
      cancelUrl
    )

    res.json({
      success: true,
      data: result,
      message: 'Payment intent created successfully'
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to create payment intent',
      400
    )
  }
})

export const getPaymentHistory = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId

  // Validate query parameters
  const { page, limit } = paginationSchema.parse(req.query)

  try {
    const history = await stripeService.getPaymentHistory(userId, page, limit)

    res.json({
      success: true,
      data: history
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to get payment history',
      500
    )
  }
})

export const handleStripeWebhook = asyncHandler(async (req, res: Response) => {
  const signature = req.headers['stripe-signature'] as string

  if (!signature) {
    throw createError('Missing Stripe signature', 400)
  }

  try {
    await stripeService.handleWebhook(req.body, signature)

    res.status(200).json({ received: true })
  } catch (error) {
    console.error('Stripe webhook error:', error)
    throw createError(
      error instanceof Error ? error.message : 'Webhook processing failed',
      400
    )
  }
})

export const getPaymentConfig = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY

  if (!publishableKey) {
    throw createError('Stripe configuration not available', 500)
  }

  res.json({
    success: true,
    data: {
      publishableKey
    }
  })
})

export const confirmPayment = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.auth!.userId
  const { paymentIntentId } = req.body

  if (!paymentIntentId) {
    throw createError('Payment intent ID is required', 400)
  }

  try {
    const result = await stripeService.confirmAndAllocateCredits(userId, paymentIntentId)

    res.json({
      success: true,
      data: result,
      message: result.message
    })
  } catch (error) {
    throw createError(
      error instanceof Error ? error.message : 'Failed to confirm payment',
      400
    )
  }
})