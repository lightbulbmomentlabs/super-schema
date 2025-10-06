/**
 * Utility functions for URL manipulation
 */

/**
 * Extracts the base domain (origin) from a URL
 * @param url - Full URL string
 * @returns Base domain including protocol (e.g., "https://blog.helpfulhero.com")
 */
export function extractBaseDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.origin
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`)
  }
}

/**
 * Extracts the path from a URL
 * @param url - Full URL string
 * @returns Path including query and hash (e.g., "/blog/post?id=1")
 */
export function extractPath(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.pathname + urlObj.search + urlObj.hash
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`)
  }
}

/**
 * Calculates the depth of a URL path
 * @param path - URL path
 * @returns Depth as number of path segments
 */
export function calculatePathDepth(path: string): number {
  if (path === '/' || path === '') return 0

  const segments = path.split('/').filter(Boolean)
  return segments.length
}
