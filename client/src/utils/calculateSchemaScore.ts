import type { SchemaScore } from '@shared/types'

export function calculateSchemaScore(schemas: any[]): SchemaScore {
  const schema = schemas[0] // For now, score the first schema

  let requiredProps = 0
  let recommendedProps = 0
  let advancedAEOFeatures = 0
  let contentQuality = 0

  // REQUIRED PROPERTIES (Max 100 points)
  if (schema['@context']) requiredProps += 33
  if (schema['@type']) requiredProps += 33
  if (schema['name'] || schema['headline']) requiredProps += 34

  // RECOMMENDED PROPERTIES (Max 100 points)
  let recommendedCount = 0
  const recommendedProperties = [
    'description', 'url', 'image', 'author', 'publisher',
    'datePublished', 'dateModified'
  ]

  recommendedProperties.forEach(prop => {
    if (schema[prop]) recommendedCount++
  })
  recommendedProps = Math.round((recommendedCount / recommendedProperties.length) * 100)

  // ADVANCED AEO FEATURES (Max 100 points)
  let aeoCount = 0
  const aeoProperties = [
    'keywords', 'about', 'mentions', 'sameAs', 'speakable',
    'inLanguage', 'articleSection', 'wordCount', 'isPartOf',
    'mainEntityOfPage', 'aggregateRating', 'review'
  ]

  aeoProperties.forEach(prop => {
    if (schema[prop]) aeoCount++
  })
  advancedAEOFeatures = Math.round((aeoCount / aeoProperties.length) * 100)

  // CONTENT QUALITY (Max 100 points)
  let qualityScore = 0

  // Check description quality
  if (schema['description']) {
    const descLength = schema['description'].length
    if (descLength >= 50 && descLength <= 160) qualityScore += 20
    else if (descLength > 0) qualityScore += 10
  }

  // Check for structured author
  if (schema['author'] && typeof schema['author'] === 'object') {
    qualityScore += 15
    if (schema['author'].sameAs) qualityScore += 10
  } else if (schema['author']) {
    qualityScore += 10
  }

  // Check for structured publisher
  if (schema['publisher'] && typeof schema['publisher'] === 'object') {
    qualityScore += 15
    if (schema['publisher'].logo) qualityScore += 10
  }

  // Check for image with details
  if (schema['image']) {
    qualityScore += 10
    if (typeof schema['image'] === 'object' || Array.isArray(schema['image'])) {
      qualityScore += 10
    }
  }

  // Check for keywords
  if (schema['keywords']) {
    if (Array.isArray(schema['keywords']) && schema['keywords'].length > 0) {
      qualityScore += 10
    } else if (typeof schema['keywords'] === 'string' && schema['keywords'].length > 0) {
      qualityScore += 5
    }
  }

  contentQuality = Math.min(qualityScore, 100)

  // Calculate overall score (weighted average)
  const overallScore = Math.round(
    (requiredProps * 0.35) +        // 35% weight on required properties
    (recommendedProps * 0.25) +     // 25% weight on recommended properties
    (advancedAEOFeatures * 0.25) +  // 25% weight on AEO features
    (contentQuality * 0.15)         // 15% weight on content quality
  )

  return {
    overallScore,
    breakdown: {
      requiredProperties: requiredProps,
      recommendedProperties: recommendedProps,
      advancedAEOFeatures: advancedAEOFeatures,
      contentQuality: contentQuality
    },
    suggestions: [],
    strengths: [],
    actionItems: []
  }
}
