// IMPORTANT: Load environment variables FIRST before any other imports
import './config/env.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { rateLimit } from 'express-rate-limit'

import { errorHandler } from './middleware/errorHandler.js'
import { authMiddleware } from './middleware/auth.js'
import schemaRoutes from './routes/schema.js'
import userRoutes from './routes/user.js'
import paymentRoutes from './routes/payment.js'
import webhookRoutes from './routes/webhooks.js'
import { modelTestRouter } from './routes/modelTest.js'
import crawlerRoutes from './routes/crawler.js'
import urlLibraryRoutes from './routes/urlLibrary.js'
import adminRoutes from './routes/admin.js'
import supportRoutes from './routes/support.js'

const app = express()
const PORT = process.env.PORT || 3002

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}))

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? [process.env.CLIENT_URL || 'https://aioschemagenerator.com']
    : ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})
app.use('/api', limiter)

// Schema generation specific rate limiting
const schemaLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 schema generations per minute
  message: 'Too many schema generation requests, please try again later.',
})
app.use('/api/schema/generate', schemaLimiter)

// Request parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging
app.use(morgan('combined'))

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
})

// Webhook routes (no auth required)
app.use('/webhooks', webhookRoutes)

// Routes
app.use('/api/admin', adminRoutes) // Admin routes include their own auth middleware
app.use('/api/schema', authMiddleware, schemaRoutes)
app.use('/api/user', authMiddleware, userRoutes)
app.use('/api/payment', authMiddleware, paymentRoutes)
app.use('/api/model-test', authMiddleware, modelTestRouter)
app.use('/api/crawler', authMiddleware, crawlerRoutes)
app.use('/api/library', authMiddleware, urlLibraryRoutes)
app.use('/api/support', supportRoutes) // Support routes include their own auth middleware

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handling middleware
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`🔗 Health check: http://localhost:${PORT}/health`)
})