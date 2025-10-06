import { Router } from 'express'
import {
  getCreditPacks,
  createPaymentIntent,
  getPaymentHistory,
  handleStripeWebhook,
  getPaymentConfig
} from '../controllers/paymentController.js'

const router = Router()

// GET /api/payment/config
router.get('/config', getPaymentConfig)

// GET /api/payment/credit-packs
router.get('/credit-packs', getCreditPacks)

// POST /api/payment/create-intent
router.post('/create-intent', createPaymentIntent)

// GET /api/payment/history
router.get('/history', getPaymentHistory)

export default router