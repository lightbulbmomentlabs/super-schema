import Stripe from 'stripe'
import { db } from './database.js'

class StripeService {
  private stripe: Stripe

  constructor() {
    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      console.warn('Stripe secret key not provided - using mock payments for development')
      this.stripe = null as any
    } else {
      this.stripe = new Stripe(secretKey, {
        apiVersion: '2024-06-20'
      })
    }
  }

  private isStripeAvailable(): boolean {
    return this.stripe !== null
  }

  async createPaymentIntent(
    userId: string,
    creditPackId: string,
    successUrl?: string,
    cancelUrl?: string
  ): Promise<{
    clientSecret: string
    paymentIntentId: string
  }> {
    if (!this.isStripeAvailable()) {
      console.log('Mock: createPaymentIntent', { userId, creditPackId })
      return {
        clientSecret: 'pi_mock_client_secret',
        paymentIntentId: 'pi_mock_' + Date.now()
      }
    }

    // Get credit pack details
    const creditPack = await db.getCreditPack(creditPackId)
    if (!creditPack) {
      throw new Error('Credit pack not found')
    }

    // Get user details
    const user = await db.getUser(userId)
    if (!user) {
      throw new Error('User not found')
    }

    try {
      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: creditPack.priceInCents,
        currency: 'usd',
        automatic_payment_methods: {
          enabled: true
        },
        metadata: {
          userId,
          creditPackId,
          credits: creditPack.credits.toString(),
          userEmail: user.email
        },
        description: `${creditPack.name} - ${creditPack.credits} credits`,
        receipt_email: user.email
      })

      // Store payment intent in database
      await this.savePaymentIntent(
        userId,
        creditPackId,
        paymentIntent.id,
        creditPack.priceInCents,
        creditPack.credits
      )

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id
      }
    } catch (error) {
      console.error('Stripe payment intent creation failed:', error)
      throw new Error('Failed to create payment intent')
    }
  }

  private async savePaymentIntent(
    userId: string,
    creditPackId: string,
    stripePaymentIntentId: string,
    amountInCents: number,
    credits: number
  ): Promise<void> {
    try {
      await db.createPaymentIntent({
        userId,
        creditPackId,
        stripePaymentIntentId,
        amountInCents,
        credits,
        status: 'pending'
      })
    } catch (error) {
      console.error('Failed to save payment intent:', error)
      throw new Error('Failed to save payment intent')
    }
  }

  async handleWebhook(body: Buffer, signature: string): Promise<void> {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      throw new Error('Stripe webhook secret not configured')
    }

    let event: Stripe.Event

    try {
      event = this.stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      throw new Error('Invalid webhook signature')
    }

    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.canceled':
        await this.handlePaymentCanceled(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled Stripe event type: ${event.type}`)
    }
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { userId, creditPackId, credits } = paymentIntent.metadata

      if (!userId || !creditPackId || !credits) {
        console.error('Missing payment metadata:', paymentIntent.metadata)
        return
      }

      // Update payment intent status
      await db.updatePaymentIntent(paymentIntent.id, 'succeeded')

      // Add credits to user account
      await db.addCredits(
        userId,
        parseInt(credits),
        `Credit purchase: ${creditPackId}`,
        paymentIntent.id
      )

      // Track analytics
      await db.trackUsage(
        userId,
        'credit_purchase',
        {
          creditPackId,
          credits: parseInt(credits),
          amountInCents: paymentIntent.amount,
          paymentIntentId: paymentIntent.id
        }
      )

      console.log(`Payment succeeded: ${paymentIntent.id} - ${credits} credits added to user ${userId}`)
    } catch (error) {
      console.error('Failed to process successful payment:', error)
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment intent status
      await db.updatePaymentIntent(paymentIntent.id, 'failed')

      console.log(`Payment failed: ${paymentIntent.id}`)
    } catch (error) {
      console.error('Failed to process failed payment:', error)
    }
  }

  private async handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      // Update payment intent status
      await db.updatePaymentIntent(paymentIntent.id, 'canceled')

      console.log(`Payment canceled: ${paymentIntent.id}`)
    } catch (error) {
      console.error('Failed to process canceled payment:', error)
    }
  }

  async getPaymentHistory(userId: string, page: number = 1, limit: number = 10) {
    return await db.getPaymentHistory(userId, page, limit)
  }

  async getCreditPacks() {
    return await db.getCreditPacks()
  }

  // Utility method to format amounts
  formatAmount(cents: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100)
  }

  // Calculate price per credit
  calculatePricePerCredit(priceInCents: number, credits: number): number {
    return Math.round((priceInCents / 100 / credits) * 100) / 100
  }
}

export const stripeService = new StripeService()