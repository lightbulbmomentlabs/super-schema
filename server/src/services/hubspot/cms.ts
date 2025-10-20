/**
 * HubSpot CMS Service
 * Manages blog posts, pages, and schema injection
 */

import axios, { AxiosInstance } from 'axios'
import { hubspotOAuthService } from './oauth.js'
import type {
  HubSpotBlogPost,
  HubSpotPage,
  HubSpotContentMatchResult
} from 'aeo-schema-generator-shared/types'

const HUBSPOT_API_BASE = 'https://api.hubapi.com'

// API v2 for blog posts (has head_html field)
const BLOG_POSTS_V2_URL = `${HUBSPOT_API_BASE}/content/api/v2/blog-posts`

// API v3 for pages
const PAGES_V3_URL = `${HUBSPOT_API_BASE}/cms/v3/pages/site-pages`

interface HubSpotBlogPostV2 {
  id: string
  name: string
  slug: string
  url: string
  state: string
  archived?: boolean
  head_html?: string
  publish_date?: number
  created: number
  updated: number
}

interface HubSpotPageV3 {
  id: string
  name: string
  slug: string
  url: string
  state: string
  archived: boolean
  publicAccessRulesEnabled: boolean
  publishDate?: string
  createdAt: string
  updatedAt: string
}

export class HubSpotCMSService {
  /**
   * Create axios instance with authorization
   */
  private async createAuthorizedClient(connectionId: string): Promise<AxiosInstance> {
    const accessToken = await hubspotOAuthService.ensureFreshToken(connectionId)

    return axios.create({
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    })
  }

  /**
   * List all blog posts for connected portal
   * Fetches up to 500 posts using pagination (HubSpot limit is 100 per request)
   */
  async listBlogPosts(connectionId: string, maxPosts: number = 500): Promise<HubSpotBlogPost[]> {
    try {
      console.log('📚 [HubSpot CMS] Fetching blog posts (up to', maxPosts, ')')

      const client = await this.createAuthorizedClient(connectionId)
      const allPosts: HubSpotBlogPost[] = []
      let offset = 0
      const limit = 100 // HubSpot's maximum

      while (allPosts.length < maxPosts) {
        console.log(`🔍 [HubSpot CMS] Fetching blog posts batch (offset: ${offset})`)

        const response = await client.get<{
          objects: HubSpotBlogPostV2[]
          total?: number
          total_count?: number
        }>(
          BLOG_POSTS_V2_URL,
          {
            params: {
              limit,
              offset
            }
          }
        )

        const batch = response.data.objects || []
        if (batch.length === 0) break // No more results

        const posts: HubSpotBlogPost[] = batch.map(post => ({
          id: post.id,
          name: post.name,
          slug: post.slug,
          url: post.url,
          state: post.state as any,
          publicAccessRulesEnabled: false,
          publishDate: post.publish_date ? new Date(post.publish_date).toISOString() : undefined,
          createdAt: new Date(post.created).toISOString(),
          updatedAt: new Date(post.updated).toISOString()
        }))

        allPosts.push(...posts)
        offset += batch.length

        // Stop if we got fewer than requested (last page)
        if (batch.length < limit) break
        // Stop if we've reached our max
        if (allPosts.length >= maxPosts) break
      }

      // Filter out archived posts using the archived boolean field
      const filteredPosts = allPosts.filter(post => !post.archived)
      console.log(`✅ [HubSpot CMS] Retrieved ${allPosts.length} blog posts total (${filteredPosts.length} non-archived)`)
      return filteredPosts.slice(0, maxPosts) // Trim to max
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to list blog posts:', error)
      if (axios.isAxiosError(error)) {
        console.error('❌ [HubSpot CMS] API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
        throw new Error(
          error.response?.data?.message || 'Failed to retrieve blog posts'
        )
      }
      throw error
    }
  }

  /**
   * List all pages for connected portal
   * Fetches up to 500 pages using pagination (HubSpot limit is 100 per request)
   */
  async listPages(connectionId: string, maxPages: number = 500): Promise<HubSpotPage[]> {
    try {
      console.log('📄 [HubSpot CMS] Fetching pages (up to', maxPages, ')')

      const client = await this.createAuthorizedClient(connectionId)
      const allPages: HubSpotPage[] = []
      let offset = 0
      const limit = 100 // HubSpot's maximum

      while (allPages.length < maxPages) {
        console.log(`🔍 [HubSpot CMS] Fetching pages batch (offset: ${offset})`)

        const response = await client.get<{
          results: HubSpotPageV3[]
          total?: number
        }>(
          PAGES_V3_URL,
          {
            params: {
              limit,
              offset
            }
          }
        )

        const batch = response.data.results || []
        if (batch.length === 0) break // No more results

        const pages: HubSpotPage[] = batch.map(page => ({
          id: page.id,
          name: page.name,
          slug: page.slug,
          url: page.url,
          state: page.state as any,
          publicAccessRulesEnabled: page.publicAccessRulesEnabled,
          publishDate: page.publishDate,
          createdAt: page.createdAt,
          updatedAt: page.updatedAt
        }))

        allPages.push(...pages)
        offset += batch.length

        // Stop if we got fewer than requested (last page)
        if (batch.length < limit) break
        // Stop if we've reached our max
        if (allPages.length >= maxPages) break
      }

      // Filter out archived pages using the archived boolean field
      // DEBUG: Log the first few pages to see what HubSpot returns
      console.log('🔍 [DEBUG] Sample pages from HubSpot API:')
      allPages.slice(0, 3).forEach(page => {
        console.log(`  - "${page.name}" (${page.url})`)
        console.log(`    state: ${page.state}, archived: ${page.archived}`)
      })

      const filteredPages = allPages.filter(page => !page.archived)
      console.log(`✅ [HubSpot CMS] Retrieved ${allPages.length} pages total (${filteredPages.length} non-archived)`)

      // DEBUG: Check if any pages with "archived" in URL are getting through
      const archivedUrlPages = filteredPages.filter(p => p.url.includes('archived'))
      if (archivedUrlPages.length > 0) {
        console.log('⚠️ [DEBUG] Pages with "archived" in URL that passed filter:')
        archivedUrlPages.forEach(page => {
          console.log(`  - "${page.name}" (${page.url})`)
          console.log(`    state: ${page.state}, archived: ${page.archived}`)
        })
      }

      return filteredPages.slice(0, maxPages) // Trim to max
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to list pages:', error)
      if (axios.isAxiosError(error)) {
        console.error('❌ [HubSpot CMS] API Error details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        })
        throw new Error(
          error.response?.data?.message || 'Failed to retrieve pages'
        )
      }
      throw error
    }
  }

  /**
   * Push schema to blog post (v2 API with head_html)
   */
  async pushSchemaToPost(
    connectionId: string,
    postId: string,
    schemaHtml: string
  ): Promise<void> {
    try {
      console.log(`🚀 [HubSpot CMS] Pushing schema to blog post ${postId}`)

      const client = await this.createAuthorizedClient(connectionId)

      // Get current post to retrieve existing head_html
      const getResponse = await client.get<HubSpotBlogPostV2>(
        `${BLOG_POSTS_V2_URL}/${postId}`
      )

      const existingHeadHtml = getResponse.data.head_html || ''

      // Check if schema already exists (avoid duplicates)
      const schemaMarker = '<!-- SuperSchema -->'
      let newHeadHtml: string

      if (existingHeadHtml.includes(schemaMarker)) {
        // Replace existing SuperSchema block
        const regex = /<!-- SuperSchema -->[\s\S]*?<!-- \/SuperSchema -->/
        newHeadHtml = existingHeadHtml.replace(
          regex,
          `${schemaMarker}\n${schemaHtml}\n<!-- /SuperSchema -->`
        )
      } else {
        // Append new schema
        newHeadHtml = `${existingHeadHtml}\n${schemaMarker}\n${schemaHtml}\n<!-- /SuperSchema -->`
      }

      // Update post with new head_html
      await client.put(`${BLOG_POSTS_V2_URL}/${postId}`, {
        head_html: newHeadHtml
      })

      console.log(`✅ [HubSpot CMS] Successfully pushed schema to blog post ${postId}`)
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to push schema to blog post:', error)
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || 'Failed to update blog post'
        )
      }
      throw error
    }
  }

  /**
   * Push schema to page (v3 API - field name may vary)
   * Note: This may not work on all HubSpot tiers
   */
  async pushSchemaToPage(
    connectionId: string,
    pageId: string,
    schemaHtml: string
  ): Promise<void> {
    try {
      console.log(`🚀 [HubSpot CMS] Pushing schema to page ${pageId}`)

      const client = await this.createAuthorizedClient(connectionId)

      // Note: v3 API documentation doesn't clearly specify head HTML field
      // This is a best-effort attempt - may need adjustment based on testing
      await client.patch(`${PAGES_V3_URL}/${pageId}/draft`, {
        headHtml: schemaHtml
      })

      console.log(`✅ [HubSpot CMS] Successfully pushed schema to page ${pageId}`)
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to push schema to page:', error)
      if (axios.isAxiosError(error)) {
        const errorMessage =
          error.response?.data?.message || 'Failed to update page'

        // Provide helpful error if field doesn't exist
        if (error.response?.status === 400) {
          throw new Error(
            `${errorMessage}. Note: Page head HTML updates may require specific HubSpot subscription tiers.`
          )
        }

        throw new Error(errorMessage)
      }
      throw error
    }
  }

  /**
   * Auto-match URL to HubSpot content
   * Returns best matches with confidence scores
   */
  async matchUrlToContent(
    connectionId: string,
    targetUrl: string
  ): Promise<HubSpotContentMatchResult[]> {
    try {
      console.log(`🔍 [HubSpot CMS] Matching URL: ${targetUrl}`)

      // Fetch both blog posts and pages
      const [posts, pages] = await Promise.all([
        this.listBlogPosts(connectionId),
        this.listPages(connectionId)
      ])

      const matches: HubSpotContentMatchResult[] = []
      let exactMatchFound = false

      // Check blog posts
      // Note: Pass full URLs with protocol to calculateUrlSimilarity
      // The parseUrl function inside needs the protocol for proper parsing
      for (const post of posts) {
        const confidence = this.calculateUrlSimilarity(targetUrl, post.url)

        // Log high confidence or exact matches for debugging
        if (confidence >= 0.95) {
          console.log(`🎯 [HubSpot CMS] High confidence match (${(confidence * 100).toFixed(1)}%): ${post.url}`)
          exactMatchFound = true
        }

        if (confidence > 0.5) {
          matches.push({
            contentId: post.id,
            contentType: 'blog_post',
            title: post.name,
            url: post.url,
            confidence
          })
        }
      }

      // Check pages
      for (const page of pages) {
        const confidence = this.calculateUrlSimilarity(targetUrl, page.url)

        // Log high confidence or exact matches for debugging
        if (confidence >= 0.95) {
          console.log(`🎯 [HubSpot CMS] High confidence match (${(confidence * 100).toFixed(1)}%): ${page.url}`)
          exactMatchFound = true
        }

        if (confidence > 0.5) {
          matches.push({
            contentId: page.id,
            contentType: 'page',
            title: page.name,
            url: page.url,
            confidence
          })
        }
      }

      // Sort by confidence descending
      matches.sort((a, b) => b.confidence - a.confidence)

      if (!exactMatchFound && matches.length > 0) {
        console.log(`⚠️ [HubSpot CMS] No exact match found. Best match: ${matches[0].url} (${(matches[0].confidence * 100).toFixed(1)}%)`)
      }

      console.log(`✅ [HubSpot CMS] Found ${matches.length} matches`)
      return matches.slice(0, 5) // Return top 5 matches
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to match URL:', error)
      throw error
    }
  }

  /**
   * Parse URL into components for intelligent matching
   */
  private parseUrl(url: string): {
    protocol: string
    subdomain: string
    domain: string
    path: string
    fullDomain: string
  } {
    try {
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()
      const path = (urlObj.pathname + urlObj.search).replace(/\/$/, '') || '/'

      // Split hostname into parts
      const parts = hostname.split('.')

      // Handle different domain structures
      let subdomain = ''
      let domain = hostname

      if (parts.length >= 2) {
        // Extract base domain (last 2 parts for .com, .org, etc.)
        domain = parts.slice(-2).join('.')

        // Extract subdomain if exists
        if (parts.length > 2) {
          subdomain = parts.slice(0, -2).join('.')
        }
      }

      return {
        protocol: urlObj.protocol,
        subdomain,
        domain,
        path,
        fullDomain: hostname
      }
    } catch (error) {
      // Fallback for invalid URLs
      return {
        protocol: '',
        subdomain: '',
        domain: url.toLowerCase(),
        path: '/',
        fullDomain: url.toLowerCase()
      }
    }
  }

  /**
   * Normalize URL for comparison (remove protocol, trailing slash)
   * Note: Preserves subdomain for accurate matching
   */
  private normalizeUrl(url: string): string {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
  }

  /**
   * Calculate similarity between two URLs with domain-aware scoring (0-1)
   */
  private calculateUrlSimilarity(url1: string, url2: string): number {
    const parsed1 = this.parseUrl(url1)
    const parsed2 = this.parseUrl(url2)

    // Different base domains = no match
    if (parsed1.domain !== parsed2.domain) {
      return 0.0
    }

    // Exact full URL match
    if (parsed1.fullDomain === parsed2.fullDomain && parsed1.path === parsed2.path) {
      return 1.0
    }

    // Calculate subdomain similarity
    let subdomainScore = 0

    if (parsed1.subdomain === parsed2.subdomain) {
      // Exact subdomain match (including both empty = bare domain)
      subdomainScore = 1.0
    } else if (
      (parsed1.subdomain === 'www' && parsed2.subdomain === '') ||
      (parsed1.subdomain === '' && parsed2.subdomain === 'www')
    ) {
      // www vs non-www are considered close variants
      subdomainScore = 0.85
    } else {
      // Different subdomains (e.g., www vs blog)
      subdomainScore = 0.3
    }

    // Calculate path similarity
    let pathScore = 0

    if (parsed1.path === parsed2.path) {
      // Exact path match - only this gets a high score
      pathScore = 1.0
    } else {
      // For non-exact matches, use strict segment-based comparison
      // This prevents child paths (e.g., /ditto/page) from matching parent paths (e.g., /ditto)
      const segments1 = parsed1.path.split('/').filter(s => s)
      const segments2 = parsed2.path.split('/').filter(s => s)

      // Only award points if there are matching initial segments
      // AND the paths are not parent/child relationships
      let matchingSegments = 0
      const minSegments = Math.min(segments1.length, segments2.length)

      for (let i = 0; i < minSegments; i++) {
        if (segments1[i] === segments2[i]) {
          matchingSegments++
        } else {
          break // Stop at first non-matching segment
        }
      }

      // Award minimal score only if some segments match
      // Reduced from 0.4 base to 0.1 to heavily penalize non-exact matches
      if (matchingSegments > 0) {
        const maxSegments = Math.max(segments1.length, segments2.length)
        pathScore = 0.1 + (0.15 * (matchingSegments / maxSegments))
      } else {
        pathScore = 0.0
      }
    }

    // Combine scores with weighting
    // Subdomain is very important (60%), path is important (40%)
    const finalScore = (subdomainScore * 0.6) + (pathScore * 0.4)

    return Math.min(finalScore, 1.0)
  }
}

// Export singleton instance
export const hubspotCMSService = new HubSpotCMSService()
