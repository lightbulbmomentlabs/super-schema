/**
 * Schema Validation Service
 *
 * Provides validation and sanitization for refined schemas to prevent hallucinations.
 * Ensures that refinement AI doesn't add unverified properties like fake authors or organization details.
 */

import type { ContentAnalysis } from '@/shared/types';

/**
 * Properties that should NEVER be added during refinement unless verified in original metadata
 */
const PROTECTED_PROPERTIES = [
  'author',
  'editor',
  'contributor',
  'creator',
];

/**
 * Properties that are SAFE to enhance even without verification in metadata
 * These are typically arrays or structural properties that improve schema quality
 */
const SAFE_TO_ENHANCE_PROPERTIES = [
  'keywords',
  'about',
  'mentions',
  'speakable',
  'potentialAction',
  'mainEntity',
  'mainEntityOfPage',
  'isPartOf',
  'hasPart',
  'breadcrumb',
  'inLanguage',
  'url',
  'wordCount',
  'articleSection',
  'articleBody',
];

/**
 * Organization sub-properties that should not be added without verification
 */
const PROTECTED_ORG_PROPERTIES = [
  'address',
  'founder',
  'founders',
  'employee',
  'employees',
  'memberOf',
  'member',
  'contactPoint',
  'telephone',
  'email',
  'faxNumber',
];

/**
 * Validates and sanitizes a refined schema by removing properties that were added
 * without verification from the original metadata.
 *
 * @param originalSchema - The schema before refinement
 * @param refinedSchema - The schema after refinement
 * @param originalMetadata - The original scraped metadata for verification
 * @param refinementCount - The current refinement number (1 for first refinement, 2 for second, etc.)
 * @returns Sanitized schema with unverified properties removed
 */
export function validateRefinedSchema(
  originalSchema: Record<string, any>,
  refinedSchema: Record<string, any>,
  originalMetadata?: ContentAnalysis,
  refinementCount: number = 1
): Record<string, any> {
  let sanitized = { ...refinedSchema };
  let modificationsApplied = false;

  // Log validation tier for debugging
  const validationTier = refinementCount === 1 ? 'STRICT' : 'RELAXED';
  console.log(`[Schema Validator] Validating refinement #${refinementCount} (${validationTier} mode)`);

  // Check for protected top-level properties
  for (const prop of PROTECTED_PROPERTIES) {
    if (refinedSchema[prop] && !originalSchema[prop]) {
      // Property was added during refinement
      const isVerified = verifyPropertyInMetadata(prop, originalMetadata);

      if (!isVerified) {
        console.warn(`[Schema Validator] Removing unverified property: ${prop}`);
        delete sanitized[prop];
        modificationsApplied = true;
      }
    }
  }

  // For 2nd+ refinements, allow enhancement of safe properties
  if (refinementCount > 1) {
    console.log(`[Schema Validator] Skipping strict validation on safe-to-enhance properties (refinement #${refinementCount})`);
    // Don't remove properties that are safe to enhance
    // The validator will only check PROTECTED_PROPERTIES and organization details
  }

  // Check organization sub-properties (only strict on 1st refinement)
  if (refinedSchema.publisher && typeof refinedSchema.publisher === 'object') {
    sanitized.publisher = validateOrganizationProperties(
      originalSchema.publisher || {},
      refinedSchema.publisher,
      originalMetadata,
      refinementCount
    );

    if (sanitized.publisher !== refinedSchema.publisher) {
      modificationsApplied = true;
    }
  }

  // Check mainEntity.provider organization properties (only strict on 1st refinement)
  if (refinedSchema.mainEntity?.provider && typeof refinedSchema.mainEntity.provider === 'object') {
    const originalProvider = originalSchema.mainEntity?.provider || {};
    sanitized.mainEntity = {
      ...sanitized.mainEntity,
      provider: validateOrganizationProperties(
        originalProvider,
        refinedSchema.mainEntity.provider,
        originalMetadata,
        refinementCount
      )
    };

    if (sanitized.mainEntity.provider !== refinedSchema.mainEntity.provider) {
      modificationsApplied = true;
    }
  }

  // Check for suspicious placeholder values
  sanitized = removePlaceholderValues(sanitized);

  if (modificationsApplied) {
    console.info('[Schema Validator] Schema sanitized - removed unverified properties');
  }

  return sanitized;
}

/**
 * Validates organization properties, removing any that weren't in the original
 * and aren't verified in metadata
 */
function validateOrganizationProperties(
  original: Record<string, any>,
  refined: Record<string, any>,
  metadata?: ContentAnalysis,
  refinementCount: number = 1
): Record<string, any> {
  const sanitized = { ...refined };

  // For 2nd+ refinements, be less strict about organization properties
  // Only remove obviously fake data, allow structural enhancements
  for (const prop of PROTECTED_ORG_PROPERTIES) {
    if (refined[prop] && !original[prop]) {
      // Property was added during refinement
      const isVerified = verifyOrganizationPropertyInMetadata(prop, metadata);

      if (!isVerified) {
        // On first refinement: remove unverified org properties
        // On 2nd+ refinements: only remove if it looks fake (checked in removePlaceholderValues)
        if (refinementCount === 1) {
          console.warn(`[Schema Validator] Removing unverified organization property: ${prop}`);
          delete sanitized[prop];
        } else {
          console.log(`[Schema Validator] Allowing organization property enhancement on refinement #${refinementCount}: ${prop}`);
        }
      }
    }
  }

  return sanitized;
}

/**
 * Verifies if a property exists in the original metadata
 */
function verifyPropertyInMetadata(
  property: string,
  metadata?: ContentAnalysis
): boolean {
  if (!metadata) return false;

  switch (property) {
    case 'author':
      return !!(metadata.author && metadata.author !== '[NOT FOUND - DO NOT EXTRACT FROM CONTENT - OMIT ENTIRE author PROPERTY]');

    case 'editor':
    case 'contributor':
    case 'creator':
      // These are rarely in metadata, so be strict
      return false;

    default:
      return false;
  }
}

/**
 * Verifies if an organization property exists in the original metadata
 */
function verifyOrganizationPropertyInMetadata(
  property: string,
  metadata?: ContentAnalysis
): boolean {
  if (!metadata) return false;

  // Currently, we don't extract most org details in metadata
  // So be very conservative - don't allow these additions
  return false;
}

/**
 * Removes common placeholder values that indicate hallucination
 */
function removePlaceholderValues(schema: Record<string, any>): Record<string, any> {
  const sanitized = JSON.parse(JSON.stringify(schema));

  // Common placeholder patterns
  const placeholderPatterns = [
    /john\s+doe/i,
    /jane\s+doe/i,
    /example\.com/i,
    /placeholder/i,
    /\[your\s+/i,
    /\{your\s+/i,
    /\[company\s+/i,
    /\{company\s+/i,
    /lorem\s+ipsum/i,
  ];

  // Check author name
  if (sanitized.author?.name && typeof sanitized.author.name === 'string') {
    if (placeholderPatterns.some(pattern => pattern.test(sanitized.author.name))) {
      console.warn(`[Schema Validator] Removing placeholder author: ${sanitized.author.name}`);
      delete sanitized.author;
    }
  }

  // Check author sameAs links for obviously fake patterns
  if (sanitized.author?.sameAs) {
    const sameAs = Array.isArray(sanitized.author.sameAs)
      ? sanitized.author.sameAs
      : [sanitized.author.sameAs];

    const hasFakeLinks = sameAs.some((link: string) =>
      typeof link === 'string' &&
      (link.includes('johndoe') || link.includes('janedoe') || link.includes('example'))
    );

    if (hasFakeLinks) {
      console.warn('[Schema Validator] Removing fake sameAs links from author');
      delete sanitized.author;
    }
  }

  // Check organization names for placeholders
  if (sanitized.publisher?.name && typeof sanitized.publisher.name === 'string') {
    if (placeholderPatterns.some(pattern => pattern.test(sanitized.publisher.name))) {
      console.warn(`[Schema Validator] Removing placeholder publisher name: ${sanitized.publisher.name}`);
      delete sanitized.publisher.name;
    }
  }

  // Check for fake dates (dates that look suspicious)
  const suspiciousDatePatterns = [
    /2023-01-01/, // Generic January 1st dates
    /2024-01-01/,
    /2025-01-01/,
  ];

  if (sanitized.datePublished && typeof sanitized.datePublished === 'string') {
    if (suspiciousDatePatterns.some(pattern => pattern.test(sanitized.datePublished))) {
      // Check if this date was in original schema
      // If not, it might be hallucinated
      // For now, just log a warning
      console.warn(`[Schema Validator] Potentially hallucinated date: ${sanitized.datePublished}`);
    }
  }

  return sanitized;
}

/**
 * Generates a summary of what was changed during validation
 */
export function getValidationSummary(
  original: Record<string, any>,
  validated: Record<string, any>
): string[] {
  const changes: string[] = [];

  // Check for removed properties
  for (const key of Object.keys(original)) {
    if (!(key in validated)) {
      changes.push(`Removed unverified property: ${key}`);
    }
  }

  // Check for modified nested objects
  if (original.publisher && validated.publisher) {
    for (const key of Object.keys(original.publisher)) {
      if (!(key in validated.publisher)) {
        changes.push(`Removed unverified publisher property: ${key}`);
      }
    }
  }

  return changes;
}
