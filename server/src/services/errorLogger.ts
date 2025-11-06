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

      const { data, error} = await db.supabase
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

  /**
   * Get AI API health metrics
   * Tracks 529 errors, success rates, response times, and trends
   */
  async getApiHealthMetrics() {
    try {
      // Define time windows
      const now = Date.now()
      const last1Hour = new Date(now - 60 * 60 * 1000).toISOString()
      const last24Hours = new Date(now - 24 * 60 * 60 * 1000).toISOString()
      const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString()

      // Query AI-related errors (529, 429, 500) from error_logs
      const { data: aiErrors } = await db.supabase
        .from('error_logs')
        .select('error_type, response_status, occurrence_count, created_at, user_id')
        .in('error_type', ['ai_error', 'api_error', 'rate_limit'])
        .gte('created_at', last7Days)
        .order('created_at', { ascending: true })

      // Query schema generations for success/failure metrics
      const { data: generations } = await db.supabase
        .from('schema_generations')
        .select('created_at, schemas, processing_time_ms, failure_reason')
        .gte('created_at', last24Hours)
        .order('created_at', { ascending: true })

      // Calculate current status (last hour)
      const errors1h = aiErrors?.filter(e => e.created_at >= last1Hour) || []
      const total529Errors1h = errors1h
        .filter(e => e.response_status === 529 || e.error_type === 'api_error')
        .reduce((sum, e) => sum + (e.occurrence_count || 1), 0)

      // Calculate 24h metrics
      const errors24h = aiErrors?.filter(e => e.created_at >= last24Hours) || []
      const total529Errors24h = errors24h
        .filter(e => e.response_status === 529 || e.error_type === 'api_error')
        .reduce((sum, e) => sum + (e.occurrence_count || 1), 0)

      const totalApiErrors24h = errors24h.reduce((sum, e) => sum + (e.occurrence_count || 1), 0)
      const uniqueUsersAffected = new Set(errors24h.map(e => e.user_id).filter(Boolean)).size

      // Calculate success rate from generations
      const totalGenerations = generations?.length || 0
      const failedGenerations = generations?.filter(g => g.failure_reason).length || 0
      const successfulGenerations = totalGenerations - failedGenerations
      const successRate = totalGenerations > 0 ? (successfulGenerations / totalGenerations) * 100 : 100

      // Calculate average response time
      const responseTimes = generations
        ?.filter(g => g.processing_time_ms && !g.failure_reason)
        .map(g => g.processing_time_ms) || []
      const avgResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0

      // Determine current health status
      const errorRate1h = errors1h.reduce((sum, e) => sum + (e.occurrence_count || 1), 0)
      let status: 'healthy' | 'degraded' | 'down' = 'healthy'
      if (errorRate1h > 10) {
        status = 'down'
      } else if (errorRate1h > 3 || total529Errors1h > 1) {
        status = 'degraded'
      }

      // Calculate hourly trends for last 24 hours
      const hourlyTrends = []
      for (let i = 23; i >= 0; i--) {
        const hourStart = new Date(now - (i + 1) * 60 * 60 * 1000).toISOString()
        const hourEnd = new Date(now - i * 60 * 60 * 1000).toISOString()

        const hourErrors = aiErrors?.filter(e =>
          e.created_at >= hourStart && e.created_at < hourEnd
        ) || []

        const hour529s = hourErrors
          .filter(e => e.response_status === 529 || e.error_type === 'api_error')
          .reduce((sum, e) => sum + (e.occurrence_count || 1), 0)

        const hourGens = generations?.filter(g =>
          g.created_at >= hourStart && g.created_at < hourEnd
        ) || []

        hourlyTrends.push({
          hour: new Date(now - i * 60 * 60 * 1000).toISOString(),
          errors529: hour529s,
          totalErrors: hourErrors.reduce((sum, e) => sum + (e.occurrence_count || 1), 0),
          totalRequests: hourGens.length,
          successRate: hourGens.length > 0
            ? ((hourGens.length - hourGens.filter(g => g.failure_reason).length) / hourGens.length) * 100
            : 100
        })
      }

      // Calculate error breakdown by type
      const errorBreakdown = {
        error529: total529Errors24h,
        error429: errors24h
          .filter(e => e.response_status === 429 || e.error_type === 'rate_limit')
          .reduce((sum, e) => sum + (e.occurrence_count || 1), 0),
        error500: errors24h
          .filter(e => e.response_status === 500)
          .reduce((sum, e) => sum + (e.occurrence_count || 1), 0),
        other: errors24h
          .filter(e => e.response_status !== 529 && e.response_status !== 429 && e.response_status !== 500)
          .reduce((sum, e) => sum + (e.occurrence_count || 1), 0)
      }

      return {
        current: {
          status,
          errorRate: errorRate1h,
          avgResponseTime: Math.round(avgResponseTime)
        },
        last24Hours: {
          total529Errors: total529Errors24h,
          totalApiErrors: totalApiErrors24h,
          totalRequests: totalGenerations,
          successfulRequests: successfulGenerations,
          failedRequests: failedGenerations,
          successRate: Math.round(successRate * 10) / 10,
          usersAffected: uniqueUsersAffected,
          errorBreakdown
        },
        trends: {
          hourly: hourlyTrends
        }
      }
    } catch (error) {
      console.error('Failed to fetch API health metrics:', error)
      return {
        current: { status: 'healthy' as const, errorRate: 0, avgResponseTime: 0 },
        last24Hours: {
          total529Errors: 0,
          totalApiErrors: 0,
          totalRequests: 0,
          successfulRequests: 0,
          failedRequests: 0,
          successRate: 100,
          usersAffected: 0,
          errorBreakdown: { error529: 0, error429: 0, error500: 0, other: 0 }
        },
        trends: { hourly: [] }
      }
    }
  }
}

// Export singleton instance
export const errorLogger = new ErrorLogger()
