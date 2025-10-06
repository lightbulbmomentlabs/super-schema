import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Read environment variables
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://atopvinhrlicujtwltsg.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required')
  process.exit(1)
}

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
})

async function runMigration() {
  try {
    console.log('📋 Reading migration file...')
    const migrationPath = join(__dirname, 'migrations', '005_url_library.sql')
    const migrationSQL = readFileSync(migrationPath, 'utf8')

    console.log('🚀 Running migration...')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL })

    if (error) {
      // If exec_sql doesn't exist, try direct execution via pg
      console.log('⚠️  exec_sql function not available, trying alternative method...')

      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'))

      console.log(`📊 Executing ${statements.length} statements...`)

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i]
        console.log(`  ${i + 1}/${statements.length}: ${statement.substring(0, 60)}...`)

        try {
          // Use the REST API to execute raw SQL
          const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': SUPABASE_SERVICE_ROLE_KEY,
              'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            },
            body: JSON.stringify({ sql: statement + ';' })
          })

          if (!response.ok) {
            const errorText = await response.text()
            throw new Error(`Failed to execute statement: ${errorText}`)
          }
        } catch (err) {
          console.error(`❌ Error executing statement ${i + 1}:`, err.message)
          console.error(`Statement: ${statement}`)
          throw err
        }
      }

      console.log('✅ Migration completed successfully!')
    } else {
      console.log('✅ Migration completed successfully!')
      if (data) {
        console.log('📊 Result:', data)
      }
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

runMigration()
