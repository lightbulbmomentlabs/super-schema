import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables FIRST - try multiple paths
const envPaths = [
  path.resolve(__dirname, '../../../.env'),  // From server/src/config to root
  path.resolve(__dirname, '../../.env'),     // From server/src/config to server
  path.resolve(__dirname, '../.env'),        // From server/src/config up one level
  path.resolve(process.cwd(), '.env'),       // From current working directory
]

let envLoaded = false
for (const envPath of envPaths) {
  try {
    const result = dotenv.config({ path: envPath })
    if (result.parsed) {
      console.log('✅ Loaded environment variables from:', envPath)
      console.log('📋 SUPABASE_URL:', process.env.SUPABASE_URL ? 'Set' : 'Missing')
      console.log('📋 SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing')
      console.log('📋 OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'Set' : 'Missing')
      console.log('📋 DEV_USER_ID:', process.env.DEV_USER_ID || 'Missing')
      envLoaded = true
      break
    }
  } catch (error) {
    // Continue to next path
  }
}

if (!envLoaded) {
  console.warn('⚠️  Could not load environment variables from any path')
}

// Export env vars for easy access
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
  HUBSPOT_CLIENT_ID: process.env.HUBSPOT_CLIENT_ID,
  HUBSPOT_CLIENT_SECRET: process.env.HUBSPOT_CLIENT_SECRET,
  HUBSPOT_ENCRYPTION_KEY: process.env.HUBSPOT_ENCRYPTION_KEY,
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: process.env.PORT || '3001',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000'
}
