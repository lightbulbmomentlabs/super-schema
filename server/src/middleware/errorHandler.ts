import { Request, Response, NextFunction } from 'express'
import { errorLogger } from '../services/errorLogger.js'
import { AuthenticatedRequest } from './auth.js'

export interface AppError extends Error {
  statusCode?: number
  isOperational?: boolean
}

/**
 * Check if an IP address is localhost (developer testing)
 */
const isLocalhostIP = (ip: string | undefined): boolean => {
  if (!ip) return false

  const localhostIPs = [
    '127.0.0.1',           // IPv4 localhost
    '::1',                 // IPv6 localhost
    '::ffff:127.0.0.1',    // IPv4-mapped IPv6 localhost
  ]

  return localhostIPs.includes(ip)
}

export const errorHandler = async (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  const authReq = req as AuthenticatedRequest

  // Log error for debugging (console)
  console.error(`Error ${statusCode}:`, {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  })

  // Skip logging errors from disabled features (feature flags), authentication failures, and localhost traffic
  const shouldSkipLogging =
    err.message === 'Feature not available' ||
    (statusCode === 401 && err.message === 'Authentication required') ||
    isLocalhostIP(req.ip) // Skip developer testing from localhost

  // Log error to database for admin debugging (skip feature flag denials and auth failures)
  if (!shouldSkipLogging) {
    await errorLogger.logError({
      errorType: 'api_error',
      message: err.message,
      stackTrace: err.stack,
      userId: authReq.auth?.userId,
      teamId: authReq.auth?.teamId || undefined,
      sessionId: authReq.auth?.sessionId,
      userEmail: authReq.auth?.email,
      requestMethod: req.method,
      requestUrl: req.originalUrl || req.url,
      requestPath: req.path,
      requestBody: req.body,
      requestHeaders: req.headers as any,
      responseStatus: statusCode,
      responseBody: { error: message },
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      tags: [
        err.isOperational ? 'operational' : 'programming',
        statusCode >= 500 ? 'server_error' : 'client_error'
      ]
    })
  }

  // Don't send stack trace in production
  const response: any = {
    error: message,
    timestamp: new Date().toISOString(),
    path: req.url
  }

  // Include statusCode for operational errors (helps client distinguish error types)
  if (err.isOperational && err.statusCode) {
    response.statusCode = err.statusCode
  }

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack
    // Include additional error details in development for debugging
    if ((err as any).hubspotError) {
      response.hubspotError = (err as any).hubspotError
    }
  }

  res.status(statusCode).json(response)
}

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError
  error.statusCode = statusCode
  error.isOperational = true
  return error
}

export const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}