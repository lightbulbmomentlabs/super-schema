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
 * Normalize a domain by ensuring it has a protocol
 * @param domain - Domain string (with or without protocol)
 * @returns Normalized domain with https:// protocol
 * @example
 * normalizeDomain('example.com') // 'https://example.com'
 * normalizeDomain('https://example.com') // 'https://example.com'
 * normalizeDomain('http://example.com') // 'http://example.com'
 */
export function normalizeDomain(domain: string): string {
  if (!domain) return ''

  const trimmed = domain.trim()
  if (!trimmed) return ''

  // If already has protocol, return as-is
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed
  }

  // Add https:// protocol
  return `https://${trimmed}`
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
