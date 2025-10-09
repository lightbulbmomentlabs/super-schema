import { Router } from 'express'
import {
  getCreditPacks,
  createPaymentIntent,
  getPaymentHistory,
  handleStripeWebhook,
  getPaymentConfig,
  confirmPayment
} from '../controllers/paymentController.js'

const router = Router()

// GET /api/payment/config
router.get('/config', getPaymentConfig)

// GET /api/payment/credit-packs
router.get('/credit-packs', getCreditPacks)

// POST /api/payment/create-intent
router.post('/create-intent', createPaymentIntent)

// POST /api/payment/confirm
router.post('/confirm', confirmPayment)

// GET /api/payment/history
router.get('/history', getPaymentHistory)

export default router