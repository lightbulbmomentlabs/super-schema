#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') })

const __dirname = dirname(fileURLToPath(import.meta.url))

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Helper function to execute SQL
async function executeSql(sql, description) {
  console.log(`\n🔄 ${description}...`)
  try {
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Supabase doesn't have a built-in exec_sql RPC, so we'll use the REST API directly
      throw new Error('Using direct SQL execution...')
    }

    console.log(`✅ ${description} - Success`)
    return { success: true }
  } catch (err) {
    // Fall back to using postgres connection or manual execution
    console.log(`⚠️  ${description} - Needs manual execution via Supabase Dashboard`)
    console.log(`📋 SQL Preview:\n${sql.substring(0, 200)}...`)
    return { success: false, error: err.message }
  }
}

// Main deployment function
async function deploy() {
  console.log('🚀 Starting Supabase Database Deployment')
  console.log('=' .repeat(50))
  console.log(`📍 Supabase URL: ${supabaseUrl}`)
  console.log('=' .repeat(50))

  const migrations = [
    {
      file: 'migrations/001_initial_schema.sql',
      description: 'Creating tables, types, indexes, and triggers'
    },
    {
      file: 'migrations/002_rls_policies.sql',
      description: 'Setting up Row Level Security policies'
    },
    {
      file: 'migrations/003_functions.sql',
      description: 'Creating database functions'
    },
    {
      file: 'seed/001_credit_packs.sql',
      description: 'Seeding credit packs data'
    }
  ]

  let successCount = 0
  let failCount = 0

  for (const migration of migrations) {
    try {
      const filePath = join(__dirname, migration.file)
      const sql = readFileSync(filePath, 'utf-8')

      const result = await executeSql(sql, migration.description)

      if (result.success) {
        successCount++
      } else {
        failCount++
        console.log(`\n📄 To execute manually, run this file in Supabase SQL Editor:`)
        console.log(`   ${migration.file}`)
      }
    } catch (error) {
      failCount++
      console.error(`❌ Error reading ${migration.file}:`, error.message)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 Deployment Summary')
  console.log('='.repeat(50))
  console.log(`✅ Successful: ${successCount}`)
  console.log(`⚠️  Manual execution needed: ${failCount}`)

  if (failCount > 0) {
    console.log('\n📋 Next Steps:')
    console.log('1. Go to your Supabase Dashboard: https://app.supabase.com')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Run each migration file listed above in order')
    console.log('\n💡 Tip: The SQL files are in the database/ directory')
  }

  console.log('\n🏁 Deployment script completed')
}

// Verification function
async function verify() {
  console.log('\n🔍 Verifying database setup...')

  try {
    // Check if tables exist
    const tables = ['users', 'credit_transactions', 'schema_generations', 'usage_analytics', 'credit_packs', 'payment_intents']

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(0)

      if (error) {
        console.log(`❌ Table '${table}' not found or inaccessible`)
      } else {
        console.log(`✅ Table '${table}' exists`)
      }
    }

    // Check credit packs
    const { data: creditPacks, error: creditPacksError } = await supabase
      .from('credit_packs')
      .select('*')

    if (!creditPacksError && creditPacks) {
      console.log(`✅ Credit packs: ${creditPacks.length} packs found`)
    }

  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

// Run deployment
const command = process.argv[2]

if (command === 'verify') {
  verify()
} else {
  deploy().then(() => {
    console.log('\n🔍 Running verification...')
    return verify()
  })
}
