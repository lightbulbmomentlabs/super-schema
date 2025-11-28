import type { SchemaScore, ActionItem, SchemaOrgCompliance } from '@shared/types'

// Define compliance types locally to avoid import issues
type ComplianceTier = 'perfect' | 'good' | 'acceptable' | 'minor_issues' | 'non_compliant' | 'severely_non_compliant'

interface ComplianceImpact {
  tier: ComplianceTier
  bonusPoints: number
  explanation: string
}

/**
 * Calculate compliance bonus/penalty based on validation results
 * Graduated tiers: Perfect (+10), Good (+7), Acceptable (+5), Minor (0), Non-Compliant (-5), Severe (-10)
 */
function calculateComplianceBonus(compliance?: SchemaOrgCompliance): ComplianceImpact {
  // Default to perfect compliance if no data (sanitization ensures compliance)
  if (!compliance) {
    return { tier: 'perfect', bonusPoints: 10, explanation: 'Schema.org compliant' }
  }

  const errors = compliance.errors.length
  const warnings = compliance.warnings.length

  if (errors === 0 && warnings === 0) {
    return { tier: 'perfect', bonusPoints: 10, explanation: 'Fully Schema.org compliant' }
  }
  if (errors === 0 && warnings <= 2) {
    return { tier: 'good', bonusPoints: 7, explanation: `Compliant with ${warnings} minor note${warnings > 1 ? 's' : ''}` }
  }
  if (errors === 0) {
    return { tier: 'acceptable', bonusPoints: 5, explanation: `Compliant with ${warnings} notes` }
  }
  if (errors === 1) {
    return { tier: 'minor_issues', bonusPoints: 0, explanation: '1 compliance issue to address' }
  }
  if (errors <= 3) {
    return { tier: 'non_compliant', bonusPoints: -5, explanation: `${errors} compliance issues` }
  }
  return { tier: 'severely_non_compliant', bonusPoints: -10, explanation: `${errors} compliance issues - will fail validation` }
}

/**
 * Get AEO properties valid for a specific schema type
 * This prevents penalizing users for properties that were rightfully removed for compliance
 */
function getAEOPropertiesForType(schemaType: string): string[] {
  // Base properties valid for all types
  const baseAEO = [
    'keywords', 'about', 'mentions', 'sameAs',
    'inLanguage', 'isPartOf', 'mainEntityOfPage',
    'aggregateRating', 'review'
  ]

  // Article types can have articleSection and wordCount
  const articleTypes = [
    'Article', 'BlogPosting', 'NewsArticle',
    'ScholarlyArticle', 'TechArticle', 'SocialMediaPosting', 'Report'
  ]
  if (articleTypes.includes(schemaType)) {
    return [...baseAEO, 'articleSection', 'wordCount']
  }

  // CreativeWork types can have wordCount (but not articleSection)
  const creativeWorkTypes = ['CreativeWork', 'Book', 'Review']
  if (creativeWorkTypes.includes(schemaType)) {
    return [...baseAEO, 'wordCount']
  }

  // All other types use base properties only
  return baseAEO
}

export function calculateSchemaScore(schemas: any[], compliance?: SchemaOrgCompliance): SchemaScore {
  const schema = schemas[0] // For now, score the first schema

  let requiredProps = 0
  let recommendedProps = 0
  let advancedAEOFeatures = 0
  let contentQuality = 0
  const suggestions: string[] = []
  const strengths: string[] = []
  const actionItems: ActionItem[] = []
  const contentIssues: any = {}

  // REQUIRED PROPERTIES (Max 100 points)
  if (schema['@context']) {
    requiredProps += 33
    strengths.push('Valid @context specified')
  } else {
    suggestions.push('Add @context property (required for JSON-LD)')
    actionItems.push({
      id: 'missing-context',
      description: 'Add "@context": "https://schema.org" to make your schema valid JSON-LD',
      priority: 'critical',
      estimatedImpact: 33,
      effort: 'quick',
      category: 'required'
    })
  }

  if (schema['@type']) {
    requiredProps += 33
    strengths.push(`Schema type: ${schema['@type']}`)
  } else {
    suggestions.push('Add @type property (required for all schemas)')
    actionItems.push({
      id: 'missing-type',
      description: 'Add "@type" property to specify your schema type (e.g., "Article", "Product", "Organization")',
      priority: 'critical',
      estimatedImpact: 33,
      effort: 'quick',
      category: 'required'
    })
  }

  if (schema['name'] || schema['headline']) {
    requiredProps += 34
    strengths.push('Title/headline present')
  } else {
    suggestions.push('Add name or headline property')
    actionItems.push({
      id: 'missing-name',
      description: 'Add "name" or "headline" property with your content title',
      priority: 'critical',
      estimatedImpact: 34,
      effort: 'quick',
      category: 'required'
    })
  }

  // RECOMMENDED PROPERTIES (Max 100 points)
  let recommendedCount = 0
  const recommendedProperties = [
    'description', 'url', 'image', 'author', 'publisher',
    'datePublished', 'dateModified'
  ]

  recommendedProperties.forEach(prop => {
    if (schema[prop]) {
      recommendedCount++
      if (prop === 'description' && schema[prop].length >= 50 && schema[prop].length <= 160) {
        strengths.push('Well-optimized description length (50-160 chars)')
      }
    } else {
      const propSuggestions: Record<string, { text: string, impact: number, priority: ActionItem['priority'], category: ActionItem['category'] }> = {
        'description': {
          text: 'Add description property for better SEO and rich snippets',
          impact: 15,
          priority: 'important',
          category: 'recommended'
        },
        'url': {
          text: 'Add URL property pointing to your content',
          impact: 10,
          priority: 'important',
          category: 'recommended'
        },
        'image': {
          text: 'Add image property with featured image URL',
          impact: 12,
          priority: 'important',
          category: 'recommended'
        },
        'author': {
          text: 'Add author property (Person object) for article credibility',
          impact: 15,
          priority: 'important',
          category: 'recommended'
        },
        'publisher': {
          text: 'Add publisher property with Organization object and logo',
          impact: 15,
          priority: 'important',
          category: 'recommended'
        },
        'datePublished': {
          text: 'Add datePublished for article freshness signals',
          impact: 10,
          priority: 'important',
          category: 'recommended'
        },
        'dateModified': {
          text: 'Add dateModified to show content is updated',
          impact: 8,
          priority: 'nice-to-have',
          category: 'recommended'
        }
      }

      const suggestion = propSuggestions[prop]
      if (suggestion) {
        suggestions.push(suggestion.text)
        actionItems.push({
          id: `missing-${prop}`,
          description: suggestion.text,
          priority: suggestion.priority,
          estimatedImpact: suggestion.impact,
          effort: 'quick',
          category: suggestion.category
        })
      }
    }
  })
  recommendedProps = Math.round((recommendedCount / recommendedProperties.length) * 100)

  // ADVANCED AEO FEATURES (Max 100 points)
  // NOTE: speakable removed - causes validator.schema.org CSS selector errors
  // Use type-aware properties to avoid penalizing for compliance-restricted properties
  const schemaType = schema['@type'] || 'Unknown'
  const aeoProperties = getAEOPropertiesForType(schemaType)
  let aeoCount = 0

  aeoProperties.forEach(prop => {
    if (schema[prop]) {
      aeoCount++
      if (prop === 'keywords' && Array.isArray(schema[prop])) {
        strengths.push(`${schema[prop].length} keywords specified for better topical relevance`)
      }
    }
  })
  advancedAEOFeatures = Math.round((aeoCount / aeoProperties.length) * 100)

  // AEO improvement suggestions
  if (!schema['keywords']) {
    suggestions.push('Add keywords array for better AI search understanding')
    actionItems.push({
      id: 'missing-keywords',
      description: 'Add "keywords" property with relevant topic keywords',
      priority: 'nice-to-have',
      estimatedImpact: 8,
      effort: 'quick',
      category: 'advanced'
    })
  }

  if (!schema['inLanguage']) {
    suggestions.push('Add inLanguage property (e.g., "en" for English)')
    actionItems.push({
      id: 'missing-inLanguage',
      description: 'Add "inLanguage" property to specify content language',
      priority: 'nice-to-have',
      estimatedImpact: 5,
      effort: 'quick',
      category: 'advanced'
    })
  }

  if ((schema['@type'] === 'Article' || schema['@type'] === 'BlogPosting') && !schema['mainEntityOfPage']) {
    suggestions.push('Add mainEntityOfPage for better article identification')
    actionItems.push({
      id: 'missing-mainEntityOfPage',
      description: 'Add "mainEntityOfPage" with WebPage object for article schema',
      priority: 'important',
      estimatedImpact: 10,
      effort: 'medium',
      category: 'advanced'
    })
  }

  // CONTENT QUALITY (Max 100 points)
  let qualityScore = 0

  // Check description quality
  if (schema['description']) {
    const descLength = schema['description'].length
    if (descLength >= 50 && descLength <= 160) {
      qualityScore += 20
    } else if (descLength > 0) {
      qualityScore += 10
      if (descLength < 50) {
        suggestions.push('Description is too short (aim for 50-160 characters)')
        contentIssues.poorMetadata = true
      }
      if (descLength > 160) {
        suggestions.push('Description is too long (may be truncated in search results)')
      }
    }
  } else {
    contentIssues.poorMetadata = true
  }

  // Check for structured author
  if (schema['author'] && typeof schema['author'] === 'object') {
    qualityScore += 15
    if (schema['author'].sameAs) {
      qualityScore += 10
      strengths.push('Author with social profile links (sameAs)')
    }
  } else if (schema['author']) {
    qualityScore += 10
    suggestions.push('Convert author to structured Person object for better credibility')
  } else {
    contentIssues.noAuthorInfo = true
  }

  // Check for structured publisher
  if (schema['publisher'] && typeof schema['publisher'] === 'object') {
    qualityScore += 15
    if (schema['publisher'].logo) {
      qualityScore += 10
      strengths.push('Publisher with logo (excellent for rich results)')
    } else {
      suggestions.push('Add logo ImageObject to publisher for rich snippets')
    }
  } else {
    suggestions.push('Add structured publisher with Organization object and logo')
  }

  // Check for image with details
  if (schema['image']) {
    qualityScore += 10
    if (typeof schema['image'] === 'object' || Array.isArray(schema['image'])) {
      qualityScore += 10
      strengths.push('Structured image data included')
    }
  } else {
    contentIssues.missingImages = true
  }

  // Check for keywords
  if (schema['keywords']) {
    if (Array.isArray(schema['keywords']) && schema['keywords'].length > 0) {
      qualityScore += 10
    } else if (typeof schema['keywords'] === 'string' && schema['keywords'].length > 0) {
      qualityScore += 5
      suggestions.push('Convert keywords to array format for better compatibility')
    }
  }

  // Check word count for content schemas
  if (schema['@type'] === 'Article' || schema['@type'] === 'BlogPosting') {
    if (schema['wordCount'] && schema['wordCount'] > 300) {
      strengths.push(`Substantial content (${schema['wordCount']} words)`)
    } else if (!schema['wordCount']) {
      suggestions.push('Add wordCount property for content depth signal')
    } else {
      contentIssues.lowWordCount = true
    }
  }

  // Check for dates
  if (!schema['datePublished'] && (schema['@type'] === 'Article' || schema['@type'] === 'BlogPosting')) {
    contentIssues.noDateInfo = true
  }

  contentQuality = Math.min(qualityScore, 100)

  // Calculate compliance bonus/penalty
  const complianceImpact = calculateComplianceBonus(compliance)

  // Calculate base score (weighted average)
  const baseScore = Math.round(
    (requiredProps * 0.35) +        // 35% weight on required properties
    (recommendedProps * 0.25) +     // 25% weight on recommended properties
    (advancedAEOFeatures * 0.25) +  // 25% weight on AEO features
    (contentQuality * 0.15)         // 15% weight on content quality
  )

  // Apply compliance bonus/penalty (capped at 0-100)
  const overallScore = Math.max(0, Math.min(100, baseScore + complianceImpact.bonusPoints))

  // Add compliance strength or action item
  if (complianceImpact.bonusPoints > 0) {
    strengths.push(`Schema.org compliant (+${complianceImpact.bonusPoints} bonus)`)
  } else if (complianceImpact.bonusPoints < 0) {
    actionItems.push({
      id: 'compliance-fix',
      description: `Fix Schema.org compliance issues to earn up to +${Math.abs(complianceImpact.bonusPoints) + 10} points`,
      priority: 'important',
      estimatedImpact: Math.abs(complianceImpact.bonusPoints) + 10,
      effort: 'quick',
      category: 'required'
    })
  }

  // Add summary suggestions based on score
  if (overallScore >= 90) {
    strengths.unshift('🎉 Excellent schema quality! Your markup is well-optimized.')
  } else if (overallScore >= 75) {
    suggestions.unshift('Good foundation! A few enhancements will push you to excellent.')
  } else if (overallScore >= 60) {
    suggestions.unshift('Solid start! Adding more properties will significantly boost your SEO.')
  } else {
    suggestions.unshift('Your schema needs improvement. Start with the critical action items below.')
  }

  return {
    overallScore,
    breakdown: {
      requiredProperties: requiredProps,
      recommendedProperties: recommendedProps,
      advancedAEOFeatures: advancedAEOFeatures,
      contentQuality: contentQuality,
      complianceBonus: complianceImpact.bonusPoints
    },
    suggestions,
    strengths,
    actionItems,
    contentIssues: Object.keys(contentIssues).length > 0 ? contentIssues : undefined,
    schemaOrgCompliance: compliance,
    complianceImpact
  }
}
