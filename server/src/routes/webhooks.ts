import { Router } from 'express'
import { Webhook } from 'svix'
import { db } from '../services/database.js'
import { stripeService } from '../services/stripe.js'
import { hubspotCRM } from '../services/hubspotCRM.js'
import { createError, asyncHandler } from '../middleware/errorHandler.js'

const router = Router()

// Clerk webhook handler
router.post('/clerk', asyncHandler(async (req, res) => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw createError('Webhook secret not configured', 500)
  }

  // Get the headers
  const headers = req.headers
  const payload = JSON.stringify(req.body)

  // Get the Svix headers for verification
  const svix_id = headers['svix-id'] as string
  const svix_timestamp = headers['svix-timestamp'] as string
  const svix_signature = headers['svix-signature'] as string

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    throw createError('Error occured -- no svix headers', 400)
  }

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    })
  } catch (err) {
    console.error('Error verifying webhook:', err)
    throw createError('Error occured during verification', 400)
  }

  // Handle the webhook
  const { type, data } = evt

  switch (type) {
    case 'user.created':
      await handleUserCreated(data)
      break
    case 'user.updated':
      await handleUserUpdated(data)
      break
    case 'user.deleted':
      await handleUserDeleted(data)
      break
    default:
      console.log(`Unhandled webhook type: ${type}`)
  }

  res.status(200).json({ success: true })
}))

// Stripe webhook handler
router.post('/stripe', asyncHandler(async (req, res) => {
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
}))

async function handleUserCreated(data: any) {
  try {
    const userId = data.id
    const email = data.email_addresses?.[0]?.email_address
    const firstName = data.first_name
    const lastName = data.last_name

    if (!userId || !email) {
      console.error('Missing required user data:', { userId, email })
      return
    }

    // Create user in our database
    // Note: Credits are NOT granted here to avoid double allocation
    // Credits are granted via the /user/init endpoint when the user first logs in
    await db.upsertUserFromClerk(userId, email, firstName, lastName)

    console.log(`User created via webhook: ${userId} (${email})`)

    // Add user to HubSpot CRM (non-blocking, best effort)
    hubspotCRM.createOrUpdateContact({
      email,
      firstName,
      lastName
    }).catch(error => {
      // Log error but don't fail user creation
      console.error('Failed to add user to HubSpot CRM:', error)
    })
  } catch (error) {
    console.error('Error creating user:', error)
  }
}

async function handleUserUpdated(data: any) {
  try {
    const userId = data.id
    const email = data.email_addresses?.[0]?.email_address
    const firstName = data.first_name
    const lastName = data.last_name

    if (!userId || !email) {
      console.error('Missing required user data:', { userId, email })
      return
    }

    // Update user in our database
    await db.upsertUserFromClerk(userId, email, firstName, lastName)

    console.log(`User updated: ${userId} (${email})`)

    // Sync update to HubSpot CRM (non-blocking, best effort)
    hubspotCRM.createOrUpdateContact({
      email,
      firstName,
      lastName
    }).catch(error => {
      // Log error but don't fail user update
      console.error('Failed to sync user update to HubSpot CRM:', error)
    })
  } catch (error) {
    console.error('Error updating user:', error)
  }
}

async function handleUserDeleted(data: any) {
  try {
    const userId = data.id

    if (!userId) {
      console.error('Missing user ID for deletion')
      return
    }

    // Note: Due to foreign key constraints, user data will be handled by the database
    // The user record will be kept for historical purposes but marked as inactive
    const user = await db.getUser(userId)
    if (user) {
      await db.updateUser(userId, { isActive: false })
    }

    console.log(`User deleted: ${userId}`)
  } catch (error) {
    console.error('Error deleting user:', error)
  }
}

export default router