/**
 * Schema Property Whitelist Service
 *
 * Defines valid properties for each schema type and provides sanitization functions
 * to ensure generated schemas pass validator.schema.org validation.
 *
 * Key decisions:
 * - Remove speakable entirely (too error-prone with CSS selectors)
 * - articleSection, articleBody, wordCount only valid for Article types
 * - Auto-remove invalid properties without user intervention
 */

import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'

/**
 * Property-type restrictions based on Schema.org specification
 */
export const PROPERTY_TYPE_RESTRICTIONS = {
  // Properties only valid on Article types (not WebPage, Organization, etc.)
  articleOnly: ['articleSection', 'articleBody', 'wordCount'],

  // Valid Article types that CAN have articleSection, articleBody, wordCount
  articleTypes: [
    'Article',
    'BlogPosting',
    'NewsArticle',
    'ScholarlyArticle',
    'TechArticle',
    'SocialMediaPosting',
    'Report'
  ],

  // CreativeWork types that can have wordCount (broader than Article)
  creativeWorkTypes: [
    'Article',
    'BlogPosting',
    'NewsArticle',
    'ScholarlyArticle',
    'TechArticle',
    'SocialMediaPosting',
    'Report',
    'CreativeWork',
    'Book',
    'Review'
  ],

  // Properties to remove entirely from ALL schema types
  // speakable is removed because cssSelector validation is error-prone
  removeAlways: ['speakable'],

  // Properties that should use 'name' instead of 'headline' for certain types
  headlineNotValidFor: [
    'WebPage',
    'Organization',
    'LocalBusiness',
    'Product',
    'Service',
    'Event',
    'Person',
    'Place'
  ]
} as const

// ============================================================================
// Helper functions to reduce redundant type casts
// ============================================================================

/**
 * Check if a schema type is an Article type (supports articleSection, articleBody)
 */
export function isArticleType(schemaType: string | undefined): boolean {
  if (!schemaType) return false
  return (PROPERTY_TYPE_RESTRICTIONS.articleTypes as readonly string[]).includes(schemaType)
}

/**
 * Check if a schema type is a CreativeWork type (supports wordCount)
 */
export function isCreativeWorkType(schemaType: string | undefined): boolean {
  if (!schemaType) return false
  return (PROPERTY_TYPE_RESTRICTIONS.creativeWorkTypes as readonly string[]).includes(schemaType)
}

/**
 * Check if headline is not recommended for this schema type
 */
export function isHeadlineNotValidFor(schemaType: string | undefined): boolean {
  if (!schemaType) return false
  return (PROPERTY_TYPE_RESTRICTIONS.headlineNotValidFor as readonly string[]).includes(schemaType)
}

/**
 * Check if a property should always be removed
 */
export function shouldAlwaysRemove(propertyName: string): boolean {
  return (PROPERTY_TYPE_RESTRICTIONS.removeAlways as readonly string[]).includes(propertyName)
}

/**
 * Check if a property is article-only
 */
export function isArticleOnlyProperty(propertyName: string): boolean {
  return (PROPERTY_TYPE_RESTRICTIONS.articleOnly as readonly string[]).includes(propertyName)
}

// ============================================================================
// Types for sanitization results
// ============================================================================

/**
 * Sanitization removal info (internal use)
 * Note: This extends beyond SchemaComplianceError to include removedValue for debugging
 */
export interface SanitizationRemoval {
  code: string
  property: string
  message: string
  removedValue?: unknown
}

/**
 * Sanitization result with details about what was changed
 */
export interface SanitizationResult {
  schema: JsonLdSchema
  removedProperties: SanitizationRemoval[]
  wasModified: boolean
}

// ============================================================================
// Core sanitization function
// ============================================================================

/**
 * Sanitizes a single schema by removing invalid properties based on type
 *
 * @param schema - The schema to sanitize
 * @returns Sanitization result with cleaned schema and removal details
 */
export function sanitizeSchemaProperties(schema: JsonLdSchema): SanitizationResult {
  const removedProperties: SanitizationRemoval[] = []
  const cleaned = { ...schema }
  const schemaType = cleaned['@type'] as string | undefined

  // Guard: If no @type, we can't validate property-type compatibility
  // Return unchanged (other validation will catch missing @type)
  if (!schemaType) {
    return {
      schema: cleaned as JsonLdSchema,
      removedProperties,
      wasModified: false
    }
  }

  // 1. Remove speakable from ALL schemas (too error-prone)
  if ('speakable' in cleaned) {
    removedProperties.push({
      code: 'SPEAKABLE_REMOVED',
      property: 'speakable',
      message: 'speakable property removed - CSS selectors are error-prone and often fail validation',
      removedValue: cleaned.speakable
    })
    delete cleaned.speakable
  }

  // 2. Remove article-specific properties from non-article types
  if (!isArticleType(schemaType)) {
    // Remove articleSection from non-article types
    if ('articleSection' in cleaned) {
      removedProperties.push({
        code: 'INVALID_PROPERTY_FOR_TYPE',
        property: 'articleSection',
        message: `articleSection is not valid for ${schemaType} - only valid for Article types`,
        removedValue: cleaned.articleSection
      })
      delete cleaned.articleSection
    }

    // Remove articleBody from non-article types
    if ('articleBody' in cleaned) {
      removedProperties.push({
        code: 'INVALID_PROPERTY_FOR_TYPE',
        property: 'articleBody',
        message: `articleBody is not valid for ${schemaType} - only valid for Article types`,
        removedValue: cleaned.articleBody
      })
      delete cleaned.articleBody
    }
  }

  // 3. Remove wordCount from types that don't support it
  if (!isCreativeWorkType(schemaType) && 'wordCount' in cleaned) {
    removedProperties.push({
      code: 'INVALID_PROPERTY_FOR_TYPE',
      property: 'wordCount',
      message: `wordCount is not valid for ${schemaType} - only valid for CreativeWork types`,
      removedValue: cleaned.wordCount
    })
    delete cleaned.wordCount
  }

  // 4. Handle headline on types that should use 'name' instead
  // Note: We don't auto-remove headline, but log a warning since some validators accept it
  // The AI prompts will be updated to prevent this at generation time

  // 5. Recursively sanitize nested objects with @type
  for (const [key, value] of Object.entries(cleaned)) {
    if (value && typeof value === 'object' && !Array.isArray(value) && '@type' in value) {
      const nestedResult = sanitizeSchemaProperties(value as JsonLdSchema)
      if (nestedResult.wasModified) {
        cleaned[key] = nestedResult.schema
        // Add nested removals with path prefix
        for (const removal of nestedResult.removedProperties) {
          removedProperties.push({
            ...removal,
            property: `${key}.${removal.property}`
          })
        }
      }
    }

    // Handle arrays of objects with @type
    if (Array.isArray(value)) {
      const sanitizedArray = value.map((item, index) => {
        if (item && typeof item === 'object' && '@type' in item) {
          const nestedResult = sanitizeSchemaProperties(item as JsonLdSchema)
          if (nestedResult.wasModified) {
            for (const removal of nestedResult.removedProperties) {
              removedProperties.push({
                ...removal,
                property: `${key}[${index}].${removal.property}`
              })
            }
            return nestedResult.schema
          }
        }
        return item
      })
      cleaned[key] = sanitizedArray
    }
  }

  return {
    schema: cleaned as JsonLdSchema,
    removedProperties,
    wasModified: removedProperties.length > 0
  }
}

// ============================================================================
// Property validation helper (used by validator.ts)
// ============================================================================

/**
 * Quick check if a property is valid for a given schema type
 * Used for validation without modification
 *
 * @param propertyName - The property to check
 * @param schemaType - The @type of the schema
 * @returns true if valid, false if invalid
 */
export function isPropertyValidForType(propertyName: string, schemaType: string | undefined): boolean {
  // Guard: If no schema type, can't determine validity - assume valid
  if (!schemaType) return true

  // Check article-only properties
  if (isArticleOnlyProperty(propertyName)) {
    if (propertyName === 'wordCount') {
      return isCreativeWorkType(schemaType)
    }
    return isArticleType(schemaType)
  }

  // speakable is never valid (we remove it entirely)
  if (shouldAlwaysRemove(propertyName)) {
    return false
  }

  // All other properties are assumed valid (Schema.org is permissive)
  return true
}
