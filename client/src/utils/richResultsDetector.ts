import type { JsonLdSchema } from '@shared/types'

/**
 * Detects eligible rich results from an array of schemas
 */
export function detectEligibleRichResults(schemas: JsonLdSchema[] | JsonLdSchema): string[] {
  const types: string[] = []
  const schemasArray = Array.isArray(schemas) ? schemas : [schemas]

  // Check each schema for eligible rich results
  schemasArray.forEach(schema => {
    const schemaType = schema['@type']

    if (schemaType === 'Article' && !types.includes('Article Rich Result')) {
      types.push('Article Rich Result')
    }
    if (schemaType === 'FAQPage' && !types.includes('FAQ Rich Result')) {
      types.push('FAQ Rich Result')
    }
    if (schemaType === 'Product' && !types.includes('Product Rich Result')) {
      types.push('Product Rich Result')
    }
    if (schemaType === 'Organization' && !types.includes('Knowledge Panel')) {
      types.push('Knowledge Panel')
    }
    if (schemaType === 'BreadcrumbList' && !types.includes('Breadcrumb Trail')) {
      types.push('Breadcrumb Trail')
    }
    if (schemaType === 'Recipe' && !types.includes('Recipe Rich Result')) {
      types.push('Recipe Rich Result')
    }
    if (schemaType === 'Event' && !types.includes('Event Rich Result')) {
      types.push('Event Rich Result')
    }
    if (schemaType === 'LocalBusiness' && !types.includes('Local Business')) {
      types.push('Local Business')
    }
    if (schemaType === 'Review' && !types.includes('Review Rich Result')) {
      types.push('Review Rich Result')
    }
    if (schemaType === 'VideoObject' && !types.includes('Video Rich Result')) {
      types.push('Video Rich Result')
    }

    // Check for breadcrumbs in isPartOf
    if (schema.isPartOf && !types.includes('Breadcrumb')) {
      types.push('Breadcrumb')
    }
  })

  return types
}
