/**
 * GA4 Path Filter Service
 *
 * Provides intelligent filtering of page paths for AI Analytics:
 * - Pattern matching (exact, prefix, suffix, regex)
 * - Domain-based filtering (cross-property contamination prevention)
 * - Smart pattern suggestions for user-created exclusions
 */

export interface ExclusionPattern {
  id: string
  mappingId: string
  pattern: string
  patternType: 'exact' | 'prefix' | 'suffix' | 'regex'
  category: 'auth' | 'callback' | 'static' | 'admin' | 'api' | 'custom'
  description: string | null
  isActive: boolean
  isDefault: boolean
  createdAt: Date
  createdBy: string | null
}

export class GA4PathFilter {
  private patterns: ExclusionPattern[]
  private domain: string

  constructor(patterns: ExclusionPattern[], domain: string) {
    this.patterns = patterns.filter(p => p.isActive)
    this.domain = domain ? this.normalizeDomain(domain) : ''
  }

  /**
   * Normalize domain for matching
   * Removes protocol, www, and trailing slashes
   */
  private normalizeDomain(domain: string): string {
    if (!domain) {
      return ''
    }
    return domain
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
      .toLowerCase()
  }

  /**
   * Extract domain from a full URL or path
   */
  private extractDomain(urlOrPath: string): string | null {
    // If it's just a path (starts with /), return null
    if (urlOrPath.startsWith('/')) {
      return null
    }

    try {
      const url = new URL(urlOrPath.startsWith('http') ? urlOrPath : `https://${urlOrPath}`)
      return this.normalizeDomain(url.hostname)
    } catch {
      return null
    }
  }

  /**
   * Check if a path matches the mapped domain
   * This prevents cross-property contamination
   */
  public matchesDomain(path: string): boolean {
    // If path starts with /, it's a relative path - assume it belongs to this domain
    if (path.startsWith('/')) {
      return true
    }

    // If path contains a domain, check if it matches
    const pathDomain = this.extractDomain(path)
    if (!pathDomain) {
      return true // Can't determine, assume it matches
    }

    return pathDomain === this.domain || pathDomain.endsWith(`.${this.domain}`)
  }

  /**
   * Check if a path should be excluded based on active patterns
   */
  public shouldExcludePath(path: string): boolean {
    // First check domain matching
    if (!this.matchesDomain(path)) {
      return true // Exclude paths from other domains
    }

    // Extract just the path portion if it's a full URL
    const cleanPath = path.startsWith('/') ? path : this.extractPathFromUrl(path)

    // Check against all active patterns
    for (const pattern of this.patterns) {
      if (this.matchesPattern(cleanPath, pattern)) {
        return true
      }
    }

    return false
  }

  /**
   * Extract path from a full URL
   */
  private extractPathFromUrl(url: string): string {
    try {
      const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
      return urlObj.pathname
    } catch {
      return url
    }
  }

  /**
   * Check if a path matches a specific pattern
   */
  private matchesPattern(path: string, pattern: ExclusionPattern): boolean {
    const { pattern: patternStr, patternType } = pattern

    switch (patternType) {
      case 'exact':
        return path === patternStr

      case 'prefix':
        return path.startsWith(patternStr)

      case 'suffix':
        return path.endsWith(patternStr)

      case 'regex':
        try {
          const regex = new RegExp(patternStr)
          return regex.test(path)
        } catch (error) {
          console.error(`[GA4 Path Filter] Invalid regex pattern: ${patternStr}`, error)
          return false
        }

      default:
        console.warn(`[GA4 Path Filter] Unknown pattern type: ${patternType}`)
        return false
    }
  }

  /**
   * Suggest an intelligent pattern based on a path and category
   * Used when user clicks "Ignore as [category]"
   */
  public static suggestPattern(
    path: string,
    category: 'auth' | 'callback' | 'static' | 'admin' | 'api' | 'custom'
  ): { pattern: string; patternType: 'exact' | 'prefix' | 'suffix' | 'regex'; description: string } {
    // Extract file extension if present
    const extensionMatch = path.match(/\.([a-z0-9]+)$/i)
    const extension = extensionMatch ? extensionMatch[1] : null

    // Extract path segments
    const segments = path.split('/').filter(s => s.length > 0)
    const firstSegment = segments[0] || ''
    const lastSegment = segments[segments.length - 1] || ''

    switch (category) {
      case 'static':
        // If it has a file extension, suggest suffix pattern for that extension
        if (extension) {
          return {
            pattern: `\\.${extension}$`,
            patternType: 'regex',
            description: `${extension.toUpperCase()} files`
          }
        }
        // Otherwise suggest exact match
        return {
          pattern: path,
          patternType: 'exact',
          description: `Static file: ${path}`
        }

      case 'callback':
        // If path ends with /callback, suggest suffix pattern
        if (path.endsWith('/callback')) {
          return {
            pattern: '/callback',
            patternType: 'suffix',
            description: 'OAuth callback endpoints'
          }
        }
        // Otherwise suggest exact match
        return {
          pattern: path,
          patternType: 'exact',
          description: `Callback: ${path}`
        }

      case 'auth':
      case 'admin':
      case 'api':
        // For these categories, suggest prefix pattern based on first segment
        if (segments.length > 0) {
          return {
            pattern: `/${firstSegment}`,
            patternType: 'prefix',
            description: `${category.charAt(0).toUpperCase() + category.slice(1)} pages starting with /${firstSegment}`
          }
        }
        return {
          pattern: path,
          patternType: 'exact',
          description: `${category.charAt(0).toUpperCase() + category.slice(1)} page: ${path}`
        }

      case 'custom':
        // Check if path contains what looks like a token/ID
        const tokenPattern = /\/[a-zA-Z0-9-_]{8,}$/
        if (tokenPattern.test(path)) {
          // Suggest regex pattern that matches similar token-based URLs
          const basePattern = path.replace(/\/[a-zA-Z0-9-_]+$/, '')
          return {
            pattern: `${basePattern}/[a-zA-Z0-9-_]{6,}$`,
            patternType: 'regex',
            description: `Dynamic URLs like ${path}`
          }
        }

        // Otherwise suggest exact match
        return {
          pattern: path,
          patternType: 'exact',
          description: `Custom exclusion: ${path}`
        }

      default:
        return {
          pattern: path,
          patternType: 'exact',
          description: `Excluded page: ${path}`
        }
    }
  }

  /**
   * Get statistics about active patterns
   */
  public getStats(): {
    total: number
    byCategory: Record<string, number>
    byType: Record<string, number>
  } {
    const stats = {
      total: this.patterns.length,
      byCategory: {
        auth: 0,
        callback: 0,
        static: 0,
        admin: 0,
        api: 0,
        custom: 0
      } as Record<string, number>,
      byType: {
        exact: 0,
        prefix: 0,
        suffix: 0,
        regex: 0
      } as Record<string, number>
    }

    for (const pattern of this.patterns) {
      stats.byCategory[pattern.category]++
      stats.byType[pattern.patternType]++
    }

    return stats
  }

  /**
   * Test a pattern against a list of sample paths
   * Useful for previewing what would be excluded
   */
  public static testPattern(
    pattern: string,
    patternType: 'exact' | 'prefix' | 'suffix' | 'regex',
    samplePaths: string[]
  ): { matches: string[]; nonMatches: string[] } {
    const mockPattern: ExclusionPattern = {
      id: 'test',
      mappingId: 'test',
      pattern,
      patternType,
      category: 'custom',
      description: null,
      isActive: true,
      isDefault: false,
      createdAt: new Date(),
      createdBy: null
    }

    const matches: string[] = []
    const nonMatches: string[] = []

    const filter = new GA4PathFilter([mockPattern], 'example.com')

    for (const path of samplePaths) {
      if (filter['matchesPattern'](path, mockPattern)) {
        matches.push(path)
      } else {
        nonMatches.push(path)
      }
    }

    return { matches, nonMatches }
  }
}
