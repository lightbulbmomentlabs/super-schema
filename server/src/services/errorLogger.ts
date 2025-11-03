import { createHash } from 'crypto'
import { db } from './database.js'

/**
 * Error logging data structure
 */
export interface ErrorLogData {
  errorType: string
  message: string
  errorCode?: string
  stackTrace?: string

  // User context
  userId?: string
  teamId?: string
  sessionId?: string
  userEmail?: string

  // Request details
  requestMethod?: string
  requestUrl?: string
  requestPath?: string
  requestBody?: any
  requestHeaders?: any

  // Response details
  responseStatus?: number
  responseBody?: any

  // Environment
  ipAddress?: string
  userAgent?: string

  // Metadata
  additionalContext?: Record<string, any>
  tags?: string[]
}

/**
 * Error Logger Service
 * Provides centralized error logging to database for debugging and monitoring
 */
class ErrorLogger {
  /**
   * Generate fingerprint for error deduplication
   * Groups similar errors together based on type, message, and path
   */
  private generateFingerprint(error: ErrorLogData): string {
    const key = `${error.errorType}:${error.message}:${error.requestPath || 'unknown'}`
    return createHash('md5').update(key).digest('hex')
  }

  /**
   * Sanitize request headers to remove sensitive information
   */
  private sanitizeHeaders(headers?: any): any {
    if (!headers) return null

    const sanitized = { ...headers }

    // Remove sensitive headers
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token'
    ]

    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body?: any): any {
    if (!body) return null
    if (typeof body !== 'object') return body

    const sanitized = { ...body }

    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'apiKey',
      'secret',
      'creditCard',
      'ssn'
    ]

    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]'
      }
    })

    return sanitized
  }

  /**
   * Log an error to the database
   * @param errorData Error details to log
   * @returns Error log ID if successful, null if failed
   */
  async logError(errorData: ErrorLogData): Promise<string | null> {
    try {
      const fingerprint = this.generateFingerprint(errorData)
      const environment = process.env.NODE_ENV || 'production'

      // Check if this error already exists in the last 24 hours
      const { data: existing } = await db.supabase
        .from('error_logs')
        .select('id, occurrence_count')
        .eq('error_fingerprint', fingerprint)
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .eq('status', 'open') // Only match unresolved errors
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (existing) {
        // Update existing error
        const { error } = await db.supabase
          .from('error_logs')
          .update({
            occurrence_count: existing.occurrence_count + 1,
            last_seen_at: new Date().toISOString()
          })
          .eq('id', existing.id)

        if (error) {
          console.error('Failed to update existing error log:', error)
        }

        return existing.id
      } else {
        // Create new error log
        const { data, error } = await db.supabase
          .from('error_logs')
          .insert({
            error_type: errorData.errorType,
            error_code: errorData.errorCode,
            message: errorData.message,
            stack_trace: errorData.stackTrace,
            user_id: errorData.userId,
            team_id: errorData.teamId,
            session_id: errorData.sessionId,
            user_email: errorData.userEmail,
            request_method: errorData.requestMethod,
            request_url: errorData.requestUrl,
            request_path: errorData.requestPath,
            request_body: this.sanitizeBody(errorData.requestBody),
            request_headers: this.sanitizeHeaders(errorData.requestHeaders),
            response_status: errorData.responseStatus,
            response_body: errorData.responseBody,
            environment,
            ip_address: errorData.ipAddress,
            user_agent: errorData.userAgent,
            additional_context: errorData.additionalContext,
            tags: errorData.tags,
            error_fingerprint: fingerprint
          })
          .select('id')
          .single()

        if (error) {
          console.error('Failed to create error log:', error)
          return null
        }

        return data.id
      }
    } catch (error) {
      // Fail silently - don't break the app if logging fails
      console.error('❌ Error logger failed:', error)
      return null
    }
  }

  /**
   * Get error logs with pagination and filtering
   */
  async getErrors(options: {
    limit?: number
    offset?: number
    status?: 'open' | 'investigating' | 'resolved' | 'ignored'
    userId?: string
    errorType?: string
    startDate?: string
    endDate?: string
  } = {}) {
    try {
      let query = db.supabase
        .from('error_logs')
        .select('*', { count: 'exact' })

      // Apply filters
      if (options.status) {
        query = query.eq('status', options.status)
      }
      if (options.userId) {
        query = query.eq('user_id', options.userId)
      }
      if (options.errorType) {
        query = query.eq('error_type', options.errorType)
      }
      if (options.startDate) {
        query = query.gte('created_at', options.startDate)
      }
      if (options.endDate) {
        query = query.lte('created_at', options.endDate)
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .range(options.offset || 0, (options.offset || 0) + (options.limit || 100) - 1)

      const { data, error, count } = await query

      if (error) throw error

      return {
        errors: data || [],
        total: count || 0
      }
    } catch (error) {
      console.error('Failed to fetch error logs:', error)
      return { errors: [], total: 0 }
    }
  }

  /**
   * Get a single error log by ID
   */
  async getError(id: string) {
    try {
      const { data, error } = await db.supabase
        .from('error_logs')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Failed to fetch error log:', error)
      return null
    }
  }

  /**
   * Update error log status
   */
  async updateErrorStatus(
    id: string,
    status: 'open' | 'investigating' | 'resolved' | 'ignored',
    resolvedBy?: string,
    resolutionNotes?: string
  ) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString()
      }

      if (status === 'resolved') {
        updateData.resolved_at = new Date().toISOString()
        updateData.resolved_by = resolvedBy
        updateData.resolution_notes = resolutionNotes
      }

      const { error } = await db.supabase
        .from('error_logs')
        .update(updateData)
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Failed to update error status:', error)
      return false
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStats(timeframe: '24h' | '7d' | '30d' = '24h') {
    try {
      const hoursAgo = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
      const startDate = new Date(Date.now() - hoursAgo * 60 * 60 * 1000).toISOString()

      const { data, error } = await db.supabase
        .from('error_logs')
        .select('error_type, status, occurrence_count')
        .gte('created_at', startDate)

      if (error) throw error

      const stats = {
        total: data?.reduce((sum, log) => sum + (log.occurrence_count || 1), 0) || 0,
        byType: {} as Record<string, number>,
        byStatus: {} as Record<string, number>
      }

      data?.forEach(log => {
        stats.byType[log.error_type] = (stats.byType[log.error_type] || 0) + (log.occurrence_count || 1)
        stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
      })

      return stats
    } catch (error) {
      console.error('Failed to fetch error stats:', error)
      return { total: 0, byType: {}, byStatus: {} }
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger()
