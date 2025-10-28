/**
 * HubSpot CRM Service
 *
 * This service handles adding SuperSchema users to the company's HubSpot CRM
 * for marketing and sales purposes. This is separate from the OAuth integration
 * which allows users to connect their own HubSpot accounts.
 *
 * Uses a private app API key with the following required scopes:
 * - crm.objects.contacts.write (create/update contacts)
 * - crm.lists.write (add contacts to lists)
 * - crm.schemas.contacts.read (read contact properties)
 */

import { Client } from '@hubspot/api-client'

interface ContactData {
  email: string
  firstName?: string
  lastName?: string
}

interface ContactResult {
  success: boolean
  contactId?: string
  error?: string
}

class HubSpotCRMService {
  private client: Client | null = null
  private apiKey: string | undefined
  private listId: string | undefined
  private isEnabled: boolean = false

  constructor() {
    this.apiKey = process.env.HUBSPOT_CRM_API_KEY
    this.listId = process.env.HUBSPOT_CRM_LIST_ID

    if (this.apiKey) {
      this.client = new Client({ accessToken: this.apiKey })
      this.isEnabled = true
      console.log('✅ [HubSpot CRM] Service initialized')
      if (this.listId) {
        console.log(`📋 [HubSpot CRM] List ID configured: ${this.listId}`)
      }

      // Verify connection on startup
      this.verifyConnection().catch(error => {
        console.error('⚠️  [HubSpot CRM] Connection verification failed:', error.message)
      })
    } else {
      console.log('⚠️  [HubSpot CRM] Service disabled - HUBSPOT_CRM_API_KEY not configured')
    }
  }

  /**
   * Verify API connection and permissions
   */
  private async verifyConnection(): Promise<void> {
    if (!this.client) {
      throw new Error('Client not initialized')
    }

    try {
      // Make a simple API call to verify credentials and permissions
      // Search for a contact that likely doesn't exist - just to test API access
      await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [],
        properties: ['email'],
        limit: 1
      })

      console.log('✅ [HubSpot CRM] API connection verified successfully')
    } catch (error: any) {
      console.error('❌ [HubSpot CRM] API connection verification failed:', {
        message: error.message,
        statusCode: error.statusCode || error.code,
        body: error.body
      })
      throw error
    }
  }

  /**
   * Create or update a contact in HubSpot CRM
   * Uses PATCH-by-email approach for efficient upsert without 409 errors
   * Automatically sets super_schema property to true for all SuperSchema users
   */
  async createOrUpdateContact(data: ContactData): Promise<ContactResult> {
    if (!this.isEnabled || !this.client) {
      console.log('⚠️  [HubSpot CRM] Service not enabled, skipping contact creation')
      return { success: false, error: 'Service not enabled' }
    }

    const { email, firstName, lastName } = data

    if (!email) {
      console.error('❌ [HubSpot CRM] Email is required')
      return { success: false, error: 'Email is required' }
    }

    try {
      // Prepare contact properties
      // Note: HubSpot API expects string values for all properties
      const properties: Record<string, string> = {
        email: email,
        super_schema: 'true' // Mark as SuperSchema user
      }

      if (firstName) {
        properties.firstname = firstName
      }

      if (lastName) {
        properties.lastname = lastName
      }

      console.log('🔄 [HubSpot CRM] Creating/updating contact via PATCH-by-email:', {
        email,
        firstName,
        lastName,
        super_schema: true
      })

      // Use PATCH-by-email approach (update with idProperty='email')
      // This creates the contact if it doesn't exist, or updates if it does
      // No 409 errors, single API call
      const response = await this.client.crm.contacts.basicApi.update(
        email,
        { properties },
        undefined,
        'email' // idProperty - tells HubSpot to use email as the unique identifier
      )

      const contactId = response.id

      console.log('✅ [HubSpot CRM] Contact created/updated successfully:', {
        email,
        contactId,
        super_schema: true
      })

      // Add to list if configured
      if (this.listId && contactId) {
        await this.addContactToList(contactId)
      }

      return { success: true, contactId }

    } catch (error: any) {
      // Enhanced error logging for better diagnostics
      const errorDetails = {
        email,
        error: error.message,
        statusCode: error.statusCode || error.code,
        body: error.body,
        category: error.category
      }

      console.error('❌ [HubSpot CRM] Failed to create/update contact:', errorDetails)

      // Provide helpful error messages based on common issues
      let userMessage = error.message || 'Unknown error'

      if (error.statusCode === 401 || error.statusCode === 403) {
        userMessage = 'Invalid API key or insufficient permissions. Check HUBSPOT_CRM_API_KEY has required scopes: crm.objects.contacts.write'
      } else if (error.statusCode === 400) {
        userMessage = 'Invalid contact data or property. Check that super_schema property exists in HubSpot.'
      }

      return {
        success: false,
        error: userMessage
      }
    }
  }


  /**
   * Add a contact to the configured list
   */
  private async addContactToList(contactId: string): Promise<boolean> {
    if (!this.client || !this.listId) {
      return false
    }

    try {
      console.log('📋 [HubSpot CRM] Adding contact to list:', { contactId, listId: this.listId })

      await this.client.crm.lists.membershipsApi.add(
        this.listId,
        [contactId]
      )

      console.log('✅ [HubSpot CRM] Contact added to list successfully')
      return true

    } catch (error: any) {
      // Don't fail the whole operation if list addition fails
      console.error('❌ [HubSpot CRM] Failed to add contact to list:', {
        contactId,
        listId: this.listId,
        error: error.message,
        statusCode: error.statusCode || error.code
      })

      return false
    }
  }

  /**
   * Check if the service is enabled and configured
   */
  isServiceEnabled(): boolean {
    return this.isEnabled
  }
}

// Export singleton instance
export const hubspotCRM = new HubSpotCRMService()
