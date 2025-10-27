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
    } else {
      console.log('⚠️  [HubSpot CRM] Service disabled - HUBSPOT_CRM_API_KEY not configured')
    }
  }

  /**
   * Create or update a contact in HubSpot CRM
   * Uses email as the unique identifier (HubSpot's default deduplication)
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
      const properties: Record<string, string> = {
        email: email
      }

      if (firstName) {
        properties.firstname = firstName
      }

      if (lastName) {
        properties.lastname = lastName
      }

      console.log('🔄 [HubSpot CRM] Creating/updating contact:', { email, firstName, lastName })

      // Create or update contact
      // HubSpot will automatically deduplicate by email
      const response = await this.client.crm.contacts.basicApi.create({
        properties,
        associations: []
      })

      const contactId = response.id

      console.log('✅ [HubSpot CRM] Contact created/updated:', { email, contactId })

      // Add to list if configured
      if (this.listId && contactId) {
        await this.addContactToList(contactId)
      }

      return { success: true, contactId }

    } catch (error: any) {
      // Handle duplicate contact error (HubSpot returns 409 Conflict)
      if (error.statusCode === 409 || error.code === 409) {
        console.log('ℹ️  [HubSpot CRM] Contact already exists, attempting update:', { email })
        return await this.updateExistingContact(email, data)
      }

      // Log other errors but don't throw (graceful degradation)
      console.error('❌ [HubSpot CRM] Failed to create/update contact:', {
        email,
        error: error.message,
        statusCode: error.statusCode || error.code,
        body: error.body
      })

      return {
        success: false,
        error: error.message || 'Unknown error'
      }
    }
  }

  /**
   * Update an existing contact by email
   */
  private async updateExistingContact(email: string, data: ContactData): Promise<ContactResult> {
    if (!this.client) {
      return { success: false, error: 'Client not initialized' }
    }

    try {
      // Search for contact by email
      const searchResponse = await this.client.crm.contacts.searchApi.doSearch({
        filterGroups: [{
          filters: [{
            propertyName: 'email',
            operator: 'EQ' as any, // HubSpot SDK type compatibility
            value: email
          }]
        }],
        properties: ['email', 'firstname', 'lastname'],
        limit: 1
      })

      if (!searchResponse.results || searchResponse.results.length === 0) {
        console.error('❌ [HubSpot CRM] Contact not found for update:', { email })
        return { success: false, error: 'Contact not found' }
      }

      const contactId = searchResponse.results[0].id

      // Prepare update properties
      const properties: Record<string, string> = {}

      if (data.firstName) {
        properties.firstname = data.firstName
      }

      if (data.lastName) {
        properties.lastname = data.lastName
      }

      // Update contact
      await this.client.crm.contacts.basicApi.update(contactId, {
        properties
      })

      console.log('✅ [HubSpot CRM] Contact updated:', { email, contactId })

      return { success: true, contactId }

    } catch (error: any) {
      console.error('❌ [HubSpot CRM] Failed to update contact:', {
        email,
        error: error.message,
        statusCode: error.statusCode || error.code
      })

      return {
        success: false,
        error: error.message || 'Unknown error'
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
