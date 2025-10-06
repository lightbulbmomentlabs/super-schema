import type { JsonLdSchema } from '@shared/types/index.js'

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

  // Common Schema.org types with their preferred properties (more flexible)
  private readonly schemaTypes: Record<string, string[]> = {
    'Article': [], // More flexible - can have headline, name, or title
    'BlogPosting': [],
    'NewsArticle': [],
    'Product': [], // Can have name, title, or be identified by other means
    'Organization': [], // Flexible naming
    'LocalBusiness': [],
    'Person': [], // Flexible naming
    'Event': [], // Can derive timing from content
    'Recipe': [],
    'Course': [],
    'WebSite': [],
    'WebPage': [],
    'BreadcrumbList': [],
    'Review': [],
    'Rating': [],
    'Offer': [],
    'FAQPage': [],
    'QAPage': [],
    'ImageObject': []
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

    // Check if it's a known Schema.org type
    if (!this.schemaTypes[type]) {
      warnings.push({
        field: '@type',
        message: `"${type}" is not a recognized Schema.org type`,
        severity: 'warning'
      })
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

    // Check if it's a known Schema.org type
    if (typeof type === 'string' && !this.schemaTypes[type]) {
      warnings.push({
        field: `${parentKey}.@type`,
        message: `"${type}" is not a recognized Schema.org type`,
        severity: 'warning',
        path: `${parentKey}.@type`
      })
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
}

export const validatorService = new SchemaValidatorService()