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
   */
  async listBlogPosts(connectionId: string, limit: number = 100): Promise<HubSpotBlogPost[]> {
    try {
      console.log('📚 [HubSpot CMS] Fetching blog posts')

      const client = await this.createAuthorizedClient(connectionId)

      // Try fetching without state filter first
      console.log('🔍 [HubSpot CMS] Making request to:', BLOG_POSTS_V2_URL)
      const response = await client.get<{ objects: HubSpotBlogPostV2[] }>(
        BLOG_POSTS_V2_URL,
        {
          params: {
            limit
            // Removed state filter to see all posts
          }
        }
      )

      console.log('📦 [HubSpot CMS] Raw response:', {
        hasObjects: !!response.data.objects,
        objectCount: response.data.objects?.length || 0,
        rawData: JSON.stringify(response.data).substring(0, 500)
      })

      const posts: HubSpotBlogPost[] = response.data.objects.map(post => ({
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

      console.log(`✅ [HubSpot CMS] Retrieved ${posts.length} blog posts`)
      return posts
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
   */
  async listPages(connectionId: string, limit: number = 100): Promise<HubSpotPage[]> {
    try {
      console.log('📄 [HubSpot CMS] Fetching pages')

      const client = await this.createAuthorizedClient(connectionId)

      const response = await client.get<{ results: HubSpotPageV3[] }>(
        PAGES_V3_URL,
        {
          params: {
            limit
          }
        }
      )

      const pages: HubSpotPage[] = response.data.results.map(page => ({
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

      console.log(`✅ [HubSpot CMS] Retrieved ${pages.length} pages`)
      return pages
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to list pages:', error)
      if (axios.isAxiosError(error)) {
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

      // Normalize target URL for comparison
      const normalizedTarget = this.normalizeUrl(targetUrl)

      // Check blog posts
      for (const post of posts) {
        const normalizedPostUrl = this.normalizeUrl(post.url)
        const confidence = this.calculateUrlSimilarity(normalizedTarget, normalizedPostUrl)

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
        const normalizedPageUrl = this.normalizeUrl(page.url)
        const confidence = this.calculateUrlSimilarity(normalizedTarget, normalizedPageUrl)

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

      console.log(`✅ [HubSpot CMS] Found ${matches.length} matches`)
      return matches.slice(0, 5) // Return top 5 matches
    } catch (error) {
      console.error('❌ [HubSpot CMS] Failed to match URL:', error)
      throw error
    }
  }

  /**
   * Normalize URL for comparison (remove protocol, trailing slash, www)
   */
  private normalizeUrl(url: string): string {
    return url
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '')
  }

  /**
   * Calculate similarity between two URLs (0-1)
   */
  private calculateUrlSimilarity(url1: string, url2: string): number {
    // Exact match
    if (url1 === url2) {
      return 1.0
    }

    // Check if one contains the other
    if (url1.includes(url2) || url2.includes(url1)) {
      return 0.9
    }

    // Path similarity (split by / and compare segments)
    const segments1 = url1.split('/')
    const segments2 = url2.split('/')

    let matchingSegments = 0
    const maxSegments = Math.max(segments1.length, segments2.length)

    for (let i = 0; i < Math.min(segments1.length, segments2.length); i++) {
      if (segments1[i] === segments2[i]) {
        matchingSegments++
      }
    }

    return matchingSegments / maxSegments
  }
}

// Export singleton instance
export const hubspotCMSService = new HubSpotCMSService()
