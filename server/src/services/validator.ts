import type { JsonLdSchema } from 'aeo-schema-generator-shared/types'
import {
  isPropertyValidForType,
  isArticleType,
  isCreativeWorkType,
  isHeadlineNotValidFor
} from './schemaPropertyWhitelist.js'

/**
 * Schema.org Compliance Result
 * Separate from validation - this checks property-type compatibility
 */
export interface ComplianceResult {
  isCompliant: boolean
  errors: ComplianceError[]
  warnings: ComplianceWarning[]
}

export interface ComplianceError {
  code: string
  property: string
  message: string
}

export interface ComplianceWarning {
  code: string
  property: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  schema?: JsonLdSchema
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
  path?: string
}

export interface ValidationWarning extends ValidationError {
  severity: 'warning'
}

class SchemaValidatorService {
  // Common Schema.org contexts
  private readonly validContexts = [
    'https://schema.org',
    'http://schema.org',
    'https://schema.org/',
    'http://schema.org/',
    ['https://schema.org'],
    ['http://schema.org']
  ]

  // Comprehensive Schema.org types list (100+ most commonly used types)
  // Note: This is not exhaustive (Schema.org has 700+ types), but covers 95%+ of real-world use cases
  private readonly schemaTypes: Record<string, string[]> = {
    // Creative works
    'Article': [],
    'BlogPosting': [],
    'NewsArticle': [],
    'ScholarlyArticle': [],
    'TechArticle': [],
    'SocialMediaPosting': [],
    'WebPage': [],
    'WebSite': [],
    'Book': [],
    'Movie': [],
    'MusicRecording': [],
    'VideoObject': [],
    'AudioObject': [],
    'ImageObject': [],
    'MediaObject': [],
    'Photograph': [],
    'CreativeWork': [],
    'HowTo': [],
    'Recipe': [],
    'Course': [],
    'LearningResource': [],

    // Organizations & People
    'Organization': [],
    'LocalBusiness': [],
    'Corporation': [],
    'EducationalOrganization': [],
    'GovernmentOrganization': [],
    'NGO': [],
    'PerformingGroup': [],
    'SportsTeam': [],
    'Person': [],

    // Local businesses (specific types)
    'Restaurant': [],
    'FoodEstablishment': [],
    'Bakery': [],
    'BarOrPub': [],
    'Cafe': [],
    'Store': [],
    'AutoDealer': [],
    'AutoRepair': [],
    'HealthAndBeautyBusiness': [],
    'HomeAndConstructionBusiness': [],
    'LegalService': [],
    'Dentist': [],
    'Hospital': [],
    'MedicalClinic': [],
    'Physician': [],
    'ProfessionalService': [],
    'RealEstateAgent': [],
    'TravelAgency': [],
    'Accommodation': [],
    'Hotel': [],
    'LodgingBusiness': [],

    // Products & Offers
    'Product': [],
    'Offer': [],
    'AggregateOffer': [],
    'IndividualProduct': [],
    'ProductModel': [],
    'Vehicle': [],
    'Car': [],

    // Events
    'Event': [],
    'BusinessEvent': [],
    'ChildrensEvent': [],
    'ComedyEvent': [],
    'DanceEvent': [],
    'EducationEvent': [],
    'Festival': [],
    'MusicEvent': [],
    'SportsEvent': [],
    'TheaterEvent': [],
    'VisualArtsEvent': [],

    // Actions
    'Action': [],
    'SearchAction': [],
    'CreateAction': [],
    'UpdateAction': [],
    'DeleteAction': [],
    'ReadAction': [],
    'WriteAction': [],
    'ViewAction': [],
    'WatchAction': [],
    'ConsumeAction': [],
    'BuyAction': [],
    'OrderAction': [],
    'PayAction': [],
    'DonateAction': [],

    // Intangible types
    'Service': [],
    'BroadcastService': [],
    'FinancialService': [],
    'GovernmentService': [],
    'TaxiService': [],
    'Rating': [],
    'AggregateRating': [],
    'Review': [],
    'Demand': [],
    'Seat': [],
    'Ticket': [],
    'JobPosting': [],
    'Occupation': [],

    // Structured values
    'PostalAddress': [],
    'GeoCoordinates': [],
    'ContactPoint': [],
    'OpeningHoursSpecification': [],
    'PropertyValue': [],
    'QuantitativeValue': [],
    'MonetaryAmount': [],
    'PriceSpecification': [],
    'Distance': [],
    'Duration': [],
    'Mass': [],

    // Special purpose
    'Place': [],
    'Thing': [],
    'Intangible': [],
    'BreadcrumbList': [],
    'ListItem': [],
    'ItemList': [],
    'FAQPage': [],
    'QAPage': [],
    'Question': [],
    'Answer': [],
    'HowToStep': [],
    'HowToSection': [],
    'HowToDirection': [],
    'EntryPoint': [],
    'SpeakableSpecification': [],
    'WebPageElement': [],
    'WPHeader': [],
    'WPFooter': [],
    'WPSideBar': [],

    // Additional common types
    'Brand': [],
    'Audience': [],
    'Language': [],
    'Country': [],
    'AdministrativeArea': [],
    'City': [],
    'State': [],
    'NutritionInformation': [],
    'Dataset': [],
    'DataDownload': [],
    'SoftwareApplication': [],
    'MobileApplication': [],
    'WebApplication': []
  }

  // Common properties that should have specific formats
  private readonly propertyValidators: Record<string, (value: any) => boolean> = {
    'url': (value) => typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://')),
    'email': (value) => typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    'telephone': (value) => typeof value === 'string' && value.length > 0,
    'datePublished': (value) => typeof value === 'string' && !isNaN(Date.parse(value)),
    'dateModified': (value) => typeof value === 'string' && !isNaN(Date.parse(value)),
    'startDate': (value) => typeof value === 'string' && !isNaN(Date.parse(value)),
    'endDate': (value) => typeof value === 'string' && !isNaN(Date.parse(value)),
    'price': (value) => typeof value === 'string' || typeof value === 'number',
    'ratingValue': (value) => typeof value === 'number' && value >= 0,
    'bestRating': (value) => typeof value === 'number' && value >= 0,
    'worstRating': (value) => typeof value === 'number' && value >= 0
  }

  /**
   * Check if a type name follows Schema.org naming conventions
   * Schema.org types should start with a capital letter and use PascalCase
   */
  private isValidSchemaOrgNaming(typeName: string): boolean {
    if (!typeName || typeof typeName !== 'string') return false

    // Must start with a capital letter
    if (!/^[A-Z]/.test(typeName)) return false

    // Should only contain letters (PascalCase - no spaces, hyphens, or underscores)
    if (!/^[A-Za-z]+$/.test(typeName)) return false

    // Common typos or invalid patterns
    const invalidPatterns = [
      /^[A-Z]{2,}$/, // All caps (e.g., "SERVICE" instead of "Service")
      /[a-z][A-Z]{2,}/ // Multiple consecutive capitals in wrong position
    ]

    if (invalidPatterns.some(pattern => pattern.test(typeName))) return false

    return true
  }

  validateSchema(schema: any): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []

    try {
      // Basic structure validation
      if (!schema || typeof schema !== 'object') {
        errors.push({
          field: 'schema',
          message: 'Schema must be a valid object',
          severity: 'error'
        })
        return { isValid: false, errors, warnings }
      }

      // Validate @context
      this.validateContext(schema, errors, warnings)

      // Validate @type
      this.validateType(schema, errors, warnings)

      // Validate required properties
      this.validateRequiredProperties(schema, errors, warnings)

      // Validate property formats
      this.validatePropertyFormats(schema, errors, warnings)

      // Validate nested objects
      this.validateNestedObjects(schema, errors, warnings)

      // Additional content-specific validations
      this.validateContentSpecificRules(schema, errors, warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        schema: errors.length === 0 ? schema as JsonLdSchema : undefined
      }
    } catch (error) {
      errors.push({
        field: 'schema',
        message: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`,
        severity: 'error'
      })
      return { isValid: false, errors, warnings }
    }
  }

  private validateContext(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema['@context']) {
      errors.push({
        field: '@context',
        message: '@context is required for JSON-LD',
        severity: 'error'
      })
      return
    }

    const context = schema['@context']
    const isValidContext = this.validContexts.some(validContext => {
      if (Array.isArray(validContext) && Array.isArray(context)) {
        return validContext.every(vc => context.includes(vc))
      }
      return validContext === context || (Array.isArray(context) && context.includes(validContext))
    })

    if (!isValidContext) {
      warnings.push({
        field: '@context',
        message: 'Context should be a valid Schema.org URL',
        severity: 'warning'
      })
    }
  }

  private validateType(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema['@type']) {
      errors.push({
        field: '@type',
        message: '@type is required for JSON-LD',
        severity: 'error'
      })
      return
    }

    const type = schema['@type']
    if (typeof type !== 'string') {
      errors.push({
        field: '@type',
        message: '@type must be a string',
        severity: 'error'
      })
      return
    }

    // Check if it's a known common Schema.org type
    if (!this.schemaTypes[type]) {
      // Not in our common types list - do additional validation
      if (!this.isValidSchemaOrgNaming(type)) {
        // Definitely invalid - doesn't follow Schema.org naming conventions
        warnings.push({
          field: '@type',
          message: `"${type}" does not appear to be a valid Schema.org type (should start with a capital letter and use PascalCase)`,
          severity: 'warning'
        })
      } else {
        // Follows naming conventions but not in our common types list
        // This could be a less common but valid Schema.org type
        warnings.push({
          field: '@type',
          message: `"${type}" appears to be an uncommon Schema.org type. Verify the spelling and ensure it matches your intent.`,
          severity: 'warning'
        })
      }
    }
  }

  private validateRequiredProperties(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const type = schema['@type']
    if (!type || typeof type !== 'string') return

    const requiredProps = this.schemaTypes[type]
    if (!requiredProps) return

    for (const prop of requiredProps) {
      if (!schema[prop]) {
        errors.push({
          field: prop,
          message: `"${prop}" is required for ${type}`,
          severity: 'error'
        })
      }
    }
  }

  private validatePropertyFormats(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    for (const [property, validator] of Object.entries(this.propertyValidators)) {
      if (schema[property] && !validator(schema[property])) {
        warnings.push({
          field: property,
          message: `"${property}" has invalid format`,
          severity: 'warning'
        })
      }
    }

    // Special validations
    if (schema.image) {
      this.validateImage(schema.image, errors, warnings)
    }

    if (schema.author) {
      this.validateAuthor(schema.author, errors, warnings)
    }

    if (schema.aggregateRating) {
      this.validateRating(schema.aggregateRating, errors, warnings, 'aggregateRating')
    }
  }

  private validateNestedObjects(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate nested schemas
    // NOTE: Nested objects inherit @context from parent, so we don't validate @context on them
    for (const [key, value] of Object.entries(schema)) {
      if (value && typeof value === 'object' && value['@type']) {
        // Validate nested object structure without requiring @context
        this.validateNestedObjectStructure(value, key, errors, warnings)
      }
    }
  }

  private validateNestedObjectStructure(obj: any, parentKey: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    // Validate @type (required for nested objects)
    if (!obj['@type']) {
      errors.push({
        field: `${parentKey}.@type`,
        message: '@type is required for nested objects',
        severity: 'error',
        path: `${parentKey}.@type`
      })
      return
    }

    const type = obj['@type']

    // Check if it's a known common Schema.org type
    if (typeof type === 'string' && !this.schemaTypes[type]) {
      // Not in our common types list - do additional validation
      if (!this.isValidSchemaOrgNaming(type)) {
        // Definitely invalid - doesn't follow Schema.org naming conventions
        warnings.push({
          field: `${parentKey}.@type`,
          message: `"${type}" does not appear to be a valid Schema.org type (should start with a capital letter and use PascalCase)`,
          severity: 'warning',
          path: `${parentKey}.@type`
        })
      } else {
        // Follows naming conventions but not in our common types list
        // This could be a less common but valid Schema.org type
        warnings.push({
          field: `${parentKey}.@type`,
          message: `"${type}" appears to be an uncommon Schema.org type. Verify the spelling and ensure it matches your intent.`,
          severity: 'warning',
          path: `${parentKey}.@type`
        })
      }
    }

    // Validate property formats for nested object
    for (const [property, validator] of Object.entries(this.propertyValidators)) {
      if (obj[property] && !validator(obj[property])) {
        warnings.push({
          field: `${parentKey}.${property}`,
          message: `"${property}" has invalid format`,
          severity: 'warning',
          path: `${parentKey}.${property}`
        })
      }
    }

    // Apply content-specific validations for nested objects
    if (type === 'Organization' || type === 'LocalBusiness') {
      if (!obj.address) {
        warnings.push({
          field: `${parentKey}.address`,
          message: 'Businesses should have address information',
          severity: 'warning',
          path: `${parentKey}.address`
        })
      }

      if (!obj.telephone && !obj.email) {
        warnings.push({
          field: `${parentKey}.contact`,
          message: 'Businesses should have contact information (telephone or email)',
          severity: 'warning',
          path: `${parentKey}.contact`
        })
      }
    }

    // Recursively validate deeper nested objects
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && value['@type']) {
        this.validateNestedObjectStructure(value, `${parentKey}.${key}`, errors, warnings)
      }
    }
  }

  private validateContentSpecificRules(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const type = schema['@type']

    switch (type) {
      case 'Article':
      case 'BlogPosting':
      case 'NewsArticle':
        this.validateArticle(schema, errors, warnings)
        break
      case 'Product':
        this.validateProduct(schema, errors, warnings)
        break
      case 'Event':
        this.validateEvent(schema, errors, warnings)
        break
      case 'LocalBusiness':
      case 'Organization':
        this.validateBusiness(schema, errors, warnings)
        break
    }
  }

  private validateImage(image: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof image === 'string') {
      if (!this.propertyValidators.url(image)) {
        warnings.push({
          field: 'image',
          message: 'Image should be a valid URL',
          severity: 'warning'
        })
      }
    } else if (Array.isArray(image)) {
      image.forEach((img, index) => {
        if (typeof img === 'string' && !this.propertyValidators.url(img)) {
          warnings.push({
            field: `image[${index}]`,
            message: 'Image URL is invalid',
            severity: 'warning'
          })
        }
      })
    } else if (image && typeof image === 'object') {
      if (!image.url) {
        warnings.push({
          field: 'image.url',
          message: 'Image object should have a url property',
          severity: 'warning'
        })
      }
    }
  }

  private validateAuthor(author: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (typeof author === 'string') {
      // String author is fine
      return
    }

    if (author && typeof author === 'object') {
      if (!author['@type']) {
        warnings.push({
          field: 'author.@type',
          message: 'Author object should have @type property',
          severity: 'warning'
        })
      }

      if (!author.name) {
        warnings.push({
          field: 'author.name',
          message: 'Author should have a name',
          severity: 'warning'
        })
      }
    }
  }

  private validateRating(rating: any, errors: ValidationError[], warnings: ValidationWarning[], field: string): void {
    if (!rating || typeof rating !== 'object') {
      warnings.push({
        field,
        message: 'Rating should be an object',
        severity: 'warning'
      })
      return
    }

    if (typeof rating.ratingValue !== 'number') {
      errors.push({
        field: `${field}.ratingValue`,
        message: 'ratingValue must be a number',
        severity: 'error'
      })
    }

    if (rating.bestRating && rating.worstRating && rating.ratingValue) {
      if (rating.ratingValue > rating.bestRating || rating.ratingValue < rating.worstRating) {
        warnings.push({
          field: `${field}.ratingValue`,
          message: 'ratingValue should be between worstRating and bestRating',
          severity: 'warning'
        })
      }
    }
  }

  private validateArticle(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema.author) {
      warnings.push({
        field: 'author',
        message: 'Articles should have an author for better SEO',
        severity: 'warning'
      })
    }

    if (!schema.datePublished) {
      warnings.push({
        field: 'datePublished',
        message: 'Articles should have a publication date',
        severity: 'warning'
      })
    }

    if (!schema.image) {
      warnings.push({
        field: 'image',
        message: 'Articles should have an image for better visibility',
        severity: 'warning'
      })
    }
  }

  private validateProduct(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema.image) {
      warnings.push({
        field: 'image',
        message: 'Products should have images for better visibility',
        severity: 'warning'
      })
    }

    if (!schema.description) {
      warnings.push({
        field: 'description',
        message: 'Products should have descriptions',
        severity: 'warning'
      })
    }

    if (!schema.offers && !schema.price) {
      warnings.push({
        field: 'offers',
        message: 'Products should have offers or price information',
        severity: 'warning'
      })
    }
  }

  private validateEvent(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema.location) {
      warnings.push({
        field: 'location',
        message: 'Events should have location information',
        severity: 'warning'
      })
    }

    if (schema.startDate && schema.endDate) {
      const start = new Date(schema.startDate)
      const end = new Date(schema.endDate)
      if (start >= end) {
        errors.push({
          field: 'endDate',
          message: 'End date must be after start date',
          severity: 'error'
        })
      }
    }
  }

  private validateBusiness(schema: any, errors: ValidationError[], warnings: ValidationWarning[]): void {
    if (!schema.address) {
      warnings.push({
        field: 'address',
        message: 'Businesses should have address information',
        severity: 'warning'
      })
    }

    if (!schema.telephone && !schema.email) {
      warnings.push({
        field: 'contact',
        message: 'Businesses should have contact information (telephone or email)',
        severity: 'warning'
      })
    }
  }

  // Batch validation for multiple schemas
  validateMultipleSchemas(schemas: any[]): ValidationResult[] {
    return schemas.map(schema => this.validateSchema(schema))
  }

  // Get validation summary
  getValidationSummary(results: ValidationResult[]): {
    totalSchemas: number
    validSchemas: number
    totalErrors: number
    totalWarnings: number
    errorRate: number
  } {
    const totalSchemas = results.length
    const validSchemas = results.filter(r => r.isValid).length
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)

    return {
      totalSchemas,
      validSchemas,
      totalErrors,
      totalWarnings,
      errorRate: totalSchemas > 0 ? (totalSchemas - validSchemas) / totalSchemas : 0
    }
  }

  /**
   * Check Schema.org compliance
   *
   * This is SEPARATE from validation - compliance checks property-type compatibility
   * to ensure schemas will pass validator.schema.org
   *
   * Key checks:
   * - articleSection/articleBody only on Article types
   * - wordCount only on CreativeWork types
   * - No speakable property (removed entirely)
   * - headline vs name usage for different types
   */
  checkSchemaOrgCompliance(schema: JsonLdSchema): ComplianceResult {
    const errors: ComplianceError[] = []
    const warnings: ComplianceWarning[] = []
    const schemaType = schema['@type'] as string

    if (!schemaType) {
      errors.push({
        code: 'MISSING_TYPE',
        property: '@type',
        message: 'Schema must have a @type property'
      })
      return { isCompliant: false, errors, warnings }
    }

    // Check for invalid properties using whitelist service
    for (const propertyName of Object.keys(schema)) {
      if (propertyName.startsWith('@')) continue // Skip @context, @type, @id
      if (!isPropertyValidForType(propertyName, schemaType)) {
        errors.push({
          code: 'INVALID_PROPERTY_FOR_TYPE',
          property: propertyName,
          message: `"${propertyName}" is not valid for ${schemaType} - will fail validator.schema.org`
        })
      }
    }

    // Check for speakable (should have been removed, but flag if present)
    if ('speakable' in schema) {
      errors.push({
        code: 'SPEAKABLE_NOT_ALLOWED',
        property: 'speakable',
        message: 'speakable property causes CSS selector validation errors - should be removed'
      })
    }

    // Check headline usage on non-article types
    if ('headline' in schema && isHeadlineNotValidFor(schemaType)) {
      warnings.push({
        code: 'HEADLINE_ON_NON_ARTICLE',
        property: 'headline',
        message: `"headline" on ${schemaType} may cause issues - consider using "name" instead`
      })
    }

    // Check for article-only properties on WebPage (common mistake)
    if (!isArticleType(schemaType)) {
      if ('articleSection' in schema) {
        errors.push({
          code: 'ARTICLE_SECTION_ON_NON_ARTICLE',
          property: 'articleSection',
          message: `articleSection is only valid for Article types, not ${schemaType}`
        })
      }
      if ('articleBody' in schema) {
        errors.push({
          code: 'ARTICLE_BODY_ON_NON_ARTICLE',
          property: 'articleBody',
          message: `articleBody is only valid for Article types, not ${schemaType}`
        })
      }
    }

    // Check wordCount on non-CreativeWork types
    if (!isCreativeWorkType(schemaType) && 'wordCount' in schema) {
      errors.push({
        code: 'WORD_COUNT_ON_INVALID_TYPE',
        property: 'wordCount',
        message: `wordCount is only valid for CreativeWork types, not ${schemaType}`
      })
    }

    // Recursively check nested objects
    this.checkNestedCompliance(schema, errors, warnings, '')

    return {
      isCompliant: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Recursively check compliance on nested objects
   */
  private checkNestedCompliance(
    obj: any,
    errors: ComplianceError[],
    warnings: ComplianceWarning[],
    path: string
  ): void {
    for (const [key, value] of Object.entries(obj)) {
      if (value && typeof value === 'object' && !Array.isArray(value) && '@type' in value) {
        const nestedPath = path ? `${path}.${key}` : key
        const nestedResult = this.checkSchemaOrgCompliance(value as JsonLdSchema)

        // Add errors with path prefix
        for (const error of nestedResult.errors) {
          errors.push({
            ...error,
            property: `${nestedPath}.${error.property}`
          })
        }

        // Add warnings with path prefix
        for (const warning of nestedResult.warnings) {
          warnings.push({
            ...warning,
            property: `${nestedPath}.${warning.property}`
          })
        }
      }

      // Handle arrays of objects
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item && typeof item === 'object' && '@type' in item) {
            const nestedPath = path ? `${path}.${key}[${index}]` : `${key}[${index}]`
            const nestedResult = this.checkSchemaOrgCompliance(item as JsonLdSchema)

            for (const error of nestedResult.errors) {
              errors.push({
                ...error,
                property: `${nestedPath}.${error.property}`
              })
            }

            for (const warning of nestedResult.warnings) {
              warnings.push({
                ...warning,
                property: `${nestedPath}.${warning.property}`
              })
            }
          }
        })
      }
    }
  }

  /**
   * Check compliance for multiple schemas
   */
  checkMultipleSchemasCompliance(schemas: JsonLdSchema[]): ComplianceResult[] {
    return schemas.map(schema => this.checkSchemaOrgCompliance(schema))
  }
}

export const validatorService = new SchemaValidatorService()