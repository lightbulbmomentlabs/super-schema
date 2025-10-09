/**
 * Extract the domain from a URL
 * @param url - Full URL
 * @returns domain string (e.g., "example.com"), lowercase
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url)
    return urlObj.hostname.toLowerCase()
  } catch {
    return ''
  }
}

/**
 * Find matching HubSpot connection by domain
 * @param connections - List of HubSpot connections
 * @param url - URL to match
 * @returns Matching connection or null
 */
export function findConnectionByDomain(
  connections: Array<{ id: string; associatedDomains?: string[]; isActive: boolean }>,
  url: string
): { id: string; associatedDomains?: string[]; isActive: boolean } | null {
  const domain = extractDomain(url)
  if (!domain) return null

  // Find connection that has this domain in its associatedDomains (case-insensitive match)
  return connections.find(conn =>
    conn.isActive &&
    conn.associatedDomains &&
    conn.associatedDomains.some(d => d.toLowerCase() === domain)
  ) || null
}
