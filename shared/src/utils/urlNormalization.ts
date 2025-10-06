/**
 * Normalizes a URL for consistent comparison
 * - Removes trailing slashes
 * - Converts to lowercase
 * - Ensures consistent protocol (https)
 */
export function normalizeUrl(url: string): string {
  try {
    // Parse the URL
    const urlObj = new URL(url)

    // Convert hostname to lowercase
    urlObj.hostname = urlObj.hostname.toLowerCase()

    // Remove trailing slash from pathname (unless it's just "/")
    if (urlObj.pathname !== '/') {
      urlObj.pathname = urlObj.pathname.replace(/\/$/, '')
    }

    // Convert to string and return
    return urlObj.toString()
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.error('Failed to normalize URL:', url, error)
    return url
  }
}
