/**
 * Default Exclusion Patterns for GA4 Path Filtering
 *
 * Pre-configured patterns that automatically filter out common edge-case URLs:
 * - Authentication pages
 * - OAuth callbacks
 * - Static files (images, CSS, JS)
 * - Admin/dashboard pages
 * - API endpoints
 * - Dynamic temporary URLs
 */

export interface ExclusionPatternDefinition {
  pattern: string
  patternType: 'exact' | 'prefix' | 'suffix' | 'regex'
  category: 'auth' | 'callback' | 'static' | 'admin' | 'api' | 'custom'
  description: string
  isActive: boolean
  isDefault: boolean
}

/**
 * Comprehensive library of default exclusion patterns
 * These are pre-populated when a new domain mapping is created
 */
export const DEFAULT_EXCLUSION_PATTERNS: ExclusionPatternDefinition[] = [
  // ============================================
  // AUTHENTICATION PAGES
  // ============================================
  {
    pattern: '/login',
    patternType: 'prefix',
    category: 'auth',
    description: 'Login pages (e.g., /login, /login/sso)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/signup',
    patternType: 'prefix',
    category: 'auth',
    description: 'Signup/registration pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/register',
    patternType: 'prefix',
    category: 'auth',
    description: 'Registration pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/logout',
    patternType: 'prefix',
    category: 'auth',
    description: 'Logout pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/auth/',
    patternType: 'prefix',
    category: 'auth',
    description: 'Auth flow pages (e.g., /auth/verify, /auth/reset)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/account/',
    patternType: 'prefix',
    category: 'auth',
    description: 'Account management pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/dashboard',
    patternType: 'prefix',
    category: 'auth',
    description: 'Dashboard pages (typically auth-required)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/settings',
    patternType: 'prefix',
    category: 'auth',
    description: 'Settings pages (typically auth-required)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/profile',
    patternType: 'prefix',
    category: 'auth',
    description: 'User profile pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/library',
    patternType: 'prefix',
    category: 'auth',
    description: 'Library/content management pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/generate',
    patternType: 'prefix',
    category: 'auth',
    description: 'Content generation pages',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // OAUTH CALLBACKS
  // ============================================
  {
    pattern: '/callback',
    patternType: 'suffix',
    category: 'callback',
    description: 'OAuth callback endpoints',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/hubspot/callback',
    patternType: 'exact',
    category: 'callback',
    description: 'HubSpot OAuth callback',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/ga4/callback',
    patternType: 'exact',
    category: 'callback',
    description: 'Google Analytics 4 OAuth callback',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/oauth/',
    patternType: 'prefix',
    category: 'callback',
    description: 'OAuth flow pages',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/auth/redirect',
    patternType: 'prefix',
    category: 'callback',
    description: 'Auth redirect pages',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // STATIC FILES (IMAGES)
  // ============================================
  {
    pattern: '\\.png$',
    patternType: 'regex',
    category: 'static',
    description: 'PNG images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.jpg$',
    patternType: 'regex',
    category: 'static',
    description: 'JPG images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.jpeg$',
    patternType: 'regex',
    category: 'static',
    description: 'JPEG images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.gif$',
    patternType: 'regex',
    category: 'static',
    description: 'GIF images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.svg$',
    patternType: 'regex',
    category: 'static',
    description: 'SVG images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.webp$',
    patternType: 'regex',
    category: 'static',
    description: 'WebP images',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.ico$',
    patternType: 'regex',
    category: 'static',
    description: 'Icon files',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // STATIC FILES (CSS, JS, FONTS)
  // ============================================
  {
    pattern: '\\.css$',
    patternType: 'regex',
    category: 'static',
    description: 'CSS stylesheets',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.js$',
    patternType: 'regex',
    category: 'static',
    description: 'JavaScript files',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.woff$',
    patternType: 'regex',
    category: 'static',
    description: 'WOFF font files',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.woff2$',
    patternType: 'regex',
    category: 'static',
    description: 'WOFF2 font files',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.ttf$',
    patternType: 'regex',
    category: 'static',
    description: 'TrueType font files',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.eot$',
    patternType: 'regex',
    category: 'static',
    description: 'EOT font files',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // STATIC FILES (DOCUMENTS, MEDIA)
  // ============================================
  {
    pattern: '\\.pdf$',
    patternType: 'regex',
    category: 'static',
    description: 'PDF documents',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.zip$',
    patternType: 'regex',
    category: 'static',
    description: 'ZIP archives',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.mp4$',
    patternType: 'regex',
    category: 'static',
    description: 'MP4 videos',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '\\.mp3$',
    patternType: 'regex',
    category: 'static',
    description: 'MP3 audio files',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // COMMON STATIC FILE PATHS
  // ============================================
  {
    pattern: '/favicon.ico',
    patternType: 'exact',
    category: 'static',
    description: 'Favicon file',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/robots.txt',
    patternType: 'exact',
    category: 'static',
    description: 'Robots.txt file',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/sitemap.xml',
    patternType: 'exact',
    category: 'static',
    description: 'Sitemap XML file',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/manifest.json',
    patternType: 'exact',
    category: 'static',
    description: 'Web app manifest',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // ADMIN & DASHBOARD
  // ============================================
  {
    pattern: '/admin/',
    patternType: 'prefix',
    category: 'admin',
    description: 'Admin panel pages',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // API ENDPOINTS
  // ============================================
  {
    pattern: '/api/',
    patternType: 'prefix',
    category: 'api',
    description: 'API endpoints',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/graphql',
    patternType: 'prefix',
    category: 'api',
    description: 'GraphQL endpoints',
    isActive: true,
    isDefault: true
  },

  // ============================================
  // DYNAMIC/TEMPORARY URLs
  // ============================================
  {
    pattern: '/team/join/[a-zA-Z0-9]{6,}',
    patternType: 'regex',
    category: 'custom',
    description: 'Team invite links (temporary tokens)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/verify/[a-zA-Z0-9-_]{20,}',
    patternType: 'regex',
    category: 'custom',
    description: 'Email verification links (temporary tokens)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/reset/[a-zA-Z0-9-_]{20,}',
    patternType: 'regex',
    category: 'custom',
    description: 'Password reset links (temporary tokens)',
    isActive: true,
    isDefault: true
  },
  {
    pattern: '/share/[a-zA-Z0-9-_]{8,}',
    patternType: 'regex',
    category: 'custom',
    description: 'Shareable links (temporary tokens)',
    isActive: true,
    isDefault: true
  }
]

/**
 * Get count of default patterns by category
 */
export function getDefaultPatternStats(): Record<string, number> {
  const stats: Record<string, number> = {
    auth: 0,
    callback: 0,
    static: 0,
    admin: 0,
    api: 0,
    custom: 0
  }

  for (const pattern of DEFAULT_EXCLUSION_PATTERNS) {
    stats[pattern.category]++
  }

  return stats
}

/**
 * Get default patterns for a specific category
 */
export function getDefaultPatternsByCategory(category: string): ExclusionPatternDefinition[] {
  return DEFAULT_EXCLUSION_PATTERNS.filter(p => p.category === category)
}

/**
 * Get total count of default patterns
 */
export function getDefaultPatternCount(): number {
  return DEFAULT_EXCLUSION_PATTERNS.length
}
