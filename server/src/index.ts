// IMPORTANT: Load environment variables FIRST before any other imports
import './config/env.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'
import path from 'path'
import { fileURLToPath } from 'url'
import { readFileSync } from 'fs'
import cron from 'node-cron'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load package.json for version info
const packageJson = JSON.parse(
  readFileSync(path.join(__dirname, '../../package.json'), 'utf-8')
)
const APP_VERSION = packageJson.version
const BUILD_TIME = new Date().toISOString()

import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'
import { logFeatureFlags } from './config/featureFlags.js'
import { cleanupService } from './services/cleanupService.js'
import { ga4MetricsRefreshService } from './services/ga4/metricsRefreshService.js'
import schemaRoutes from './routes/schema.js'
import userRoutes from './routes/user.js'
import paymentRoutes from './routes/payment.js'
import webhookRoutes from './routes/webhooks.js'
import { modelTestRouter } from './routes/modelTest.js'
import crawlerRoutes from './routes/crawler.js'
import urlLibraryRoutes from './routes/urlLibrary.js'
import adminRoutes from './routes/admin.js'
import supportRoutes from './routes/support.js'
import hubspotRoutes from './routes/hubspot.js'
import ga4Routes from './routes/ga4.js'
import releaseNotesRoutes from './routes/releaseNotes.js'
import teamRoutes from './routes/team.js'

const app = express()
const PORT = process.env.PORT || 8080

// Trust proxy - Required for Digital Ocean App Platform and other reverse proxies
// Set to 1 to trust only the first proxy (DO load balancer) for security
// This allows Express to correctly read X-Forwarded-For headers for rate limiting
app.set('trust proxy', 1)

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
// Support both root domain and www subdomain
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.CLIENT_URL?.split(',').map(url => url.trim()) || ['https://superschema.ai', 'https://www.superschema.ai']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))

// Rate limiting - disabled in development to avoid blocking local testing
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // Default: 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // Default: 100 requests
  message: 'Too many requests from this IP, please try again later.',
  skip: () => process.env.NODE_ENV === 'development', // Skip rate limiting in development
})
app.use('/api', limiter)

// Schema generation specific rate limiting - disabled in development
const schemaLimiter = rateLimit({
  windowMs: parseInt(process.env.SCHEMA_RATE_LIMIT_WINDOW_MS || '60000'), // Default: 1 minute
  max: parseInt(process.env.SCHEMA_RATE_LIMIT_MAX_REQUESTS || '5'), // Default: 5 requests
  message: 'Too many schema generation requests, please try again later.',
  skip: () => process.env.NODE_ENV === 'development', // Skip rate limiting in development
})
app.use('/api/schema/generate', schemaLimiter)

// Webhook routes MUST come before express.json() to receive raw body for Stripe signature verification
app.use('/webhooks/stripe', express.raw({ type: 'application/json' }), webhookRoutes)

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Other webhook routes (after JSON parsing)
app.use('/webhooks', webhookRoutes)

// Logging
app.use(morgan('combined'))

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: APP_VERSION,
    buildTime: BUILD_TIME
  })
})

// API Routes
app.use('/api/admin', adminRoutes) // Admin routes include their own auth middleware
app.use('/api/schema', schemaRoutes) // Schema routes include their own auth middleware (public /extract endpoint)
app.use('/api/user', authMiddleware, userRoutes)
app.use('/api/payment', authMiddleware, paymentRoutes)
app.use('/api/model-test', authMiddleware, modelTestRouter)
app.use('/api/crawler', authMiddleware, crawlerRoutes)
app.use('/api/library', authMiddleware, urlLibraryRoutes)
app.use('/api/support', supportRoutes) // Support routes include their own auth middleware
app.use('/api/hubspot', hubspotRoutes) // HubSpot routes include their own auth middleware
app.use('/api/ga4', ga4Routes) // GA4 routes include their own auth middleware
app.use('/api/release-notes', releaseNotesRoutes) // Release notes routes include their own auth middleware
app.use('/api/team', teamRoutes) // Team routes include their own auth middleware

// Serve static files from client build
// In production, client/dist is copied to server/dist/client during build
const clientDistPath = process.env.NODE_ENV === 'production'
  ? path.join(__dirname, '../client')
  : path.join(__dirname, '../../client/dist')

app.use(express.static(clientDistPath))

// Serve index.html for all non-API routes (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(clientDistPath, 'index.html'))
})

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)

  // Log feature flags status
  logFeatureFlags()

  // Schedule cleanup job - runs every 15 minutes
  // Cron format: minute hour day month weekday
  // */15 * * * * = every 15 minutes
  const cleanupJob = cron.schedule('*/15 * * * *', async () => {
    console.log('⏰ [Cron] Running scheduled cleanup of expired pending HubSpot connections...')
    try {
      const stats = await cleanupService.cleanupExpiredPendingHubSpotConnections()
      if (stats.deletedCount > 0) {
        console.log('✅ [Cron] Cleanup completed:', stats)
      }
    } catch (error) {
      console.error('❌ [Cron] Cleanup failed:', error)
    }
  })

  // Run cleanup immediately on startup
  console.log('🧹 [Startup] Running initial cleanup of expired pending HubSpot connections...')
  cleanupService.cleanupExpiredPendingHubSpotConnections()
    .then((stats) => {
      if (stats.deletedCount > 0) {
        console.log('✅ [Startup] Initial cleanup completed:', stats)
      }
    })
    .catch((error) => {
      console.error('❌ [Startup] Initial cleanup failed:', error)
    })

  console.log('⏰ [Cron] Cleanup job scheduled to run every 15 minutes')

  // Schedule GA4 metrics refresh - runs daily at 2 AM
  // Cron format: minute hour day month weekday
  // 0 2 * * * = every day at 2:00 AM
  const ga4MetricsJob = cron.schedule('0 2 * * *', async () => {
    console.log('⏰ [Cron] Running scheduled GA4 metrics refresh...')
    try {
      const stats = await ga4MetricsRefreshService.refreshAllMetrics()
      console.log('✅ [Cron] GA4 metrics refresh completed:', stats)
      if (stats.errors.length > 0) {
        console.warn('⚠️ [Cron] Some metrics refresh failed:', stats.errors)
      }
    } catch (error) {
      console.error('❌ [Cron] GA4 metrics refresh failed:', error)
    }
  })

  console.log('⏰ [Cron] GA4 metrics refresh job scheduled to run daily at 2:00 AM')
})