import axios from 'axios';
import * as cheerio from 'cheerio';

export interface ValidationResult {
  blocked: boolean;
  reasons: string[];
  canProceed: boolean;
}

export interface BlockingReason {
  type: 'x-robots-tag' | 'robots-txt' | 'meta-tag';
  description: string;
}

/**
 * Validates if a URL is accessible for web scraping by checking for common
 * crawler-blocking mechanisms
 */
export class UrlValidator {
  private readonly userAgent = 'Mozilla/5.0 (compatible; AEOSchemaBot/1.0)';
  private readonly timeout = 10000; // 10 second timeout for validation checks

  /**
   * Validates URL accessibility by checking for crawler blocking rules
   * @param url - The URL to validate
   * @returns ValidationResult with blocking status and reasons
   */
  async validateUrlAccessibility(url: string): Promise<ValidationResult> {
    const reasons: string[] = [];

    try {
      // Check 1: X-Robots-Tag HTTP headers
      const headerBlocks = await this.checkXRobotsTagHeaders(url);
      reasons.push(...headerBlocks);

      // Check 2: robots.txt file
      const robotsTxtBlocks = await this.checkRobotsTxt(url);
      reasons.push(...robotsTxtBlocks);

      // Check 3: Meta robots tags in HTML
      const metaTagBlocks = await this.checkMetaRobotsTags(url);
      reasons.push(...metaTagBlocks);

      const blocked = reasons.length > 0;

      return {
        blocked,
        reasons,
        canProceed: !blocked,
      };
    } catch (error) {
      // If validation checks fail, allow proceeding but log the error
      console.error('URL validation error:', error);
      return {
        blocked: false,
        reasons: [],
        canProceed: true,
      };
    }
  }

  /**
   * Check for X-Robots-Tag in HTTP response headers
   */
  private async checkXRobotsTagHeaders(url: string): Promise<string[]> {
    const reasons: string[] = [];

    try {
      const response = await axios.head(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
        },
        maxRedirects: 5,
        validateStatus: () => true, // Accept any status code
      });

      const xRobotsTag = response.headers['x-robots-tag'];

      if (xRobotsTag) {
        const headerValue = Array.isArray(xRobotsTag)
          ? xRobotsTag.join(', ').toLowerCase()
          : xRobotsTag.toLowerCase();

        if (headerValue.includes('noindex')) {
          reasons.push('X-Robots-Tag header (noindex)');
        }
        if (headerValue.includes('nofollow')) {
          reasons.push('X-Robots-Tag header (nofollow)');
        }
        if (headerValue.includes('none')) {
          reasons.push('X-Robots-Tag header (none)');
        }
        if (headerValue.includes('noarchive')) {
          reasons.push('X-Robots-Tag header (noarchive)');
        }
      }
    } catch (error) {
      // Silently fail - inability to check headers shouldn't block the request
      console.debug('Failed to check X-Robots-Tag headers:', error);
    }

    return reasons;
  }

  /**
   * Check robots.txt for disallow rules
   */
  private async checkRobotsTxt(url: string): Promise<string[]> {
    const reasons: string[] = [];

    try {
      const urlObj = new URL(url);
      const robotsTxtUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

      const response = await axios.get(robotsTxtUrl, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
        },
        validateStatus: (status) => status === 200,
      });

      const robotsTxt = response.data;
      const lines = robotsTxt.split('\n');

      let currentUserAgent = '';
      let foundWildcardAgent = false;

      for (const line of lines) {
        const trimmedLine = line.trim();

        // Skip comments and empty lines
        if (trimmedLine.startsWith('#') || trimmedLine === '') {
          continue;
        }

        // Check for User-agent directive
        if (trimmedLine.toLowerCase().startsWith('user-agent:')) {
          currentUserAgent = trimmedLine.substring(11).trim().toLowerCase();
          foundWildcardAgent = currentUserAgent === '*';
        }

        // Check for Disallow directive under wildcard user-agent
        if (foundWildcardAgent && trimmedLine.toLowerCase().startsWith('disallow:')) {
          const disallowPath = trimmedLine.substring(9).trim();

          // Check if the path is blocked
          if (disallowPath === '/' || this.isPathBlocked(urlObj.pathname, disallowPath)) {
            reasons.push('robots.txt restrictions');
            break; // No need to check further
          }
        }
      }
    } catch (error) {
      // robots.txt not found or inaccessible - this is acceptable
      console.debug('No robots.txt found or failed to fetch:', error);
    }

    return reasons;
  }

  /**
   * Check for meta robots tags in HTML
   */
  private async checkMetaRobotsTags(url: string): Promise<string[]> {
    const reasons: string[] = [];

    try {
      const response = await axios.get(url, {
        timeout: this.timeout,
        headers: {
          'User-Agent': this.userAgent,
        },
        maxRedirects: 5,
      });

      const $ = cheerio.load(response.data);

      // Check for various meta robots tags
      const metaTags = [
        { name: 'robots', selector: 'meta[name="robots"]' },
        { name: 'googlebot', selector: 'meta[name="googlebot"]' },
        { name: 'bingbot', selector: 'meta[name="bingbot"]' },
      ];

      for (const { name, selector } of metaTags) {
        const metaTag = $(selector);

        if (metaTag.length > 0) {
          const content = metaTag.attr('content')?.toLowerCase() || '';

          if (content.includes('noindex')) {
            reasons.push(`Meta robots tag (${name}: noindex)`);
          }
          if (content.includes('nofollow')) {
            reasons.push(`Meta robots tag (${name}: nofollow)`);
          }
          if (content.includes('none')) {
            reasons.push(`Meta robots tag (${name}: none)`);
          }
        }
      }
    } catch (error) {
      // If we can't fetch the page, let the scraper handle it
      console.debug('Failed to check meta robots tags:', error);
    }

    return reasons;
  }

  /**
   * Helper function to check if a URL path is blocked by a robots.txt disallow rule
   */
  private isPathBlocked(urlPath: string, disallowPath: string): boolean {
    if (!disallowPath || disallowPath === '') {
      return false;
    }

    // Exact match or prefix match
    return urlPath === disallowPath || urlPath.startsWith(disallowPath);
  }
}

// Export singleton instance
export const urlValidator = new UrlValidator();
