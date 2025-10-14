/**
 * Schema Type Detection Utility
 *
 * Extracts the actual schema type from generated JSON-LD schemas
 * Maps Schema.org types to human-readable display names
 */

import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'

/**
 * Mapping of Schema.org @type values to human-readable display names
 */
const SCHEMA_TYPE_MAP: Record<string, string> = {
  // Article types
  'Article': 'Article',
  'NewsArticle': 'Article',
  'BlogPosting': 'Article',
  'ScholarlyArticle': 'Article',
  'TechArticle': 'Article',
  'Report': 'Article',

  // FAQ
  'FAQPage': 'FAQ',

  // HowTo
  'HowTo': 'HowTo',
  'Recipe': 'Recipe',

  // Product
  'Product': 'Product',

  // Organization
  'Organization': 'Organization',
  'Corporation': 'Organization',
  'LocalBusiness': 'Local Business',
  'Store': 'Local Business',
  'Restaurant': 'Local Business',

  // Event
  'Event': 'Event',

  // Person
  'Person': 'Person',

  // Video
  'VideoObject': 'Video',

  // Course
  'Course': 'Course',

  // JobPosting
  'JobPosting': 'Job Posting',

  // BreadcrumbList
  'BreadcrumbList': 'Breadcrumb',

  // WebSite
  'WebSite': 'Website',

  // WebPage
  'WebPage': 'Web Page',

  // Default fallback
  'default': 'Auto'
}

/**
 * Extract the primary schema type from a schema or array of schemas
 *
 * @param schemas - Single schema object or array of schemas
 * @returns Human-readable schema type name (e.g., "Article", "FAQ", "HowTo")
 */
export function extractSchemaType(schemas: JsonLdSchema | JsonLdSchema[] | any): string {
  try {
    // Handle null/undefined
    if (!schemas) {
      return 'Auto'
    }

    // Handle array of schemas - get type from first schema
    if (Array.isArray(schemas)) {
      if (schemas.length === 0) {
        return 'Auto'
      }
      return extractSchemaType(schemas[0])
    }

    // Handle single schema object
    if (typeof schemas === 'object' && schemas['@type']) {
      const schemaType = schemas['@type']

      // Handle array of types (some schemas have multiple types)
      if (Array.isArray(schemaType)) {
        // Use the first type
        const primaryType = schemaType[0]
        return SCHEMA_TYPE_MAP[primaryType] || primaryType
      }

      // Handle single type string
      if (typeof schemaType === 'string') {
        return SCHEMA_TYPE_MAP[schemaType] || schemaType
      }
    }

    // Fallback
    return 'Auto'
  } catch (error) {
    console.error('Error extracting schema type:', error)
    return 'Auto'
  }
}

/**
 * Get the raw Schema.org @type value from a schema
 * Used for validation and comparison
 *
 * @param schemas - Single schema object or array of schemas
 * @returns Raw @type value or null
 */
export function getRawSchemaType(schemas: JsonLdSchema | JsonLdSchema[] | any): string | null {
  try {
    if (!schemas) return null

    if (Array.isArray(schemas)) {
      if (schemas.length === 0) return null
      return getRawSchemaType(schemas[0])
    }

    if (typeof schemas === 'object' && schemas['@type']) {
      const schemaType = schemas['@type']

      if (Array.isArray(schemaType)) {
        return schemaType[0]
      }

      if (typeof schemaType === 'string') {
        return schemaType
      }
    }

    return null
  } catch (error) {
    console.error('Error getting raw schema type:', error)
    return null
  }
}
